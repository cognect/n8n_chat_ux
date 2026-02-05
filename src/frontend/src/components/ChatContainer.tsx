import React, { useState, useRef, useEffect, useCallback } from 'react';
import type { AppConfig, Message, AttachedFile, ToolCall, ConnectionStatus } from '../types';
import { n8nService } from '../services/n8nService';
import { n8nApiService } from '../services/n8nApiService';
import { StreamParser } from '../services/streamParser';
import { MessageBubble } from './MessageBubble';
import { ChatInput } from './ChatInput';
import type { ChatInputHandle } from './ChatInput';
import './styles/ChatContainer.css';

interface ChatContainerProps {
    config: AppConfig;
}

/**
 * Main chat container component
 * Handles message state, API communication, and streaming responses
 */
export const ChatContainer: React.FC<ChatContainerProps> = ({ config }) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('idle');
    const [, setCurrentMessageId] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const chatInputRef = useRef<ChatInputHandle>(null);

    const generateId = () => Math.random().toString(36).substring(7);

    // Show intro message on mount
    useEffect(() => {
        if (config.identity.introMessage) {
            setMessages([
                {
                    id: generateId(),
                    role: 'assistant',
                    content: config.identity.introMessage,
                    timestamp: new Date(),
                    status: 'complete',
                },
            ]);
        }
    }, [config.identity.introMessage]);

    // Scroll to bottom when messages change
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const updateMessage = useCallback((messageId: string, updates: Partial<Message>) => {
        setMessages((prev) =>
            prev.map((msg) =>
                msg.id === messageId ? { ...msg, ...updates } : msg
            )
        );
    }, []);

    const addToolCall = useCallback((messageId: string, toolCall: ToolCall) => {
        setMessages((prev) =>
            prev.map((msg) => {
                if (msg.id !== messageId) return msg;
                return {
                    ...msg,
                    toolCalls: [...(msg.toolCalls || []), toolCall],
                };
            })
        );
    }, []);

    const updateToolCall = useCallback((messageId: string, toolId: string, updates: Partial<ToolCall>) => {
        setMessages((prev) =>
            prev.map((msg) => {
                if (msg.id !== messageId) return msg;
                return {
                    ...msg,
                    toolCalls: msg.toolCalls?.map((tool) =>
                        tool.id === toolId ? { ...tool, ...updates } : tool
                    ),
                };
            })
        );
    }, []);

    const handleSend = async (message: string, files: AttachedFile[]) => {
        if (!config.n8n.webhookUrl) {
            // Demo mode - show a warning message

            setMessages((prev) => [
                ...prev,
                {
                    id: generateId(),
                    role: 'user',
                    content: message,
                    timestamp: new Date(),
                    status: 'complete',
                    files,
                },
                {
                    id: generateId(),
                    role: 'assistant',
                    content: '⚠️ n8n webhook URL not configured. Please update config.json with your webhook URL to enable chat functionality.',
                    timestamp: new Date(),
                    status: 'complete',
                },
            ]);
            return;
        }

        // Add user message
        const userMessageId = generateId();
        setMessages((prev) => [
            ...prev,
            {
                id: userMessageId,
                role: 'user',
                content: message,
                timestamp: new Date(),
                status: 'complete',
                files,
            },
        ]);

        // Add pending assistant message
        const assistantMessageId = generateId();
        setCurrentMessageId(assistantMessageId);
        setMessages((prev) => [
            ...prev,
            {
                id: assistantMessageId,
                role: 'assistant',
                content: '',
                timestamp: new Date(),
                status: 'pending',
            },
        ]);

        setConnectionStatus('streaming');
        let fullContent = '';
        const toolCallMap = new Map<string, string>();

        await n8nService.sendMessage(message, files, {
            onWorkflowStart: () => {
                updateMessage(assistantMessageId, { status: 'streaming' });
            },
            onWorkflowEnd: () => {
                // Extract thinking content if present
                const [cleanContent, thinkingContent] = StreamParser.extractThinking(fullContent);

                updateMessage(assistantMessageId, {
                    content: cleanContent,
                    thinkingContent: thinkingContent || undefined,
                    status: 'complete',
                });
                setConnectionStatus('idle');
                setCurrentMessageId(null);
                // Auto-focus input after response completes
                chatInputRef.current?.focus();
            },
            onToolCallStart: (data) => {
                const toolId = generateId();
                toolCallMap.set(data.tool, toolId);

                addToolCall(assistantMessageId, {
                    id: toolId,
                    name: data.tool,
                    input: data.input,
                    status: 'in-progress',
                    startTime: new Date(),
                });
            },
            onToolCallEnd: (data) => {
                const toolId = toolCallMap.get(data.tool);
                if (toolId) {
                    updateToolCall(assistantMessageId, toolId, {
                        output: data.output,
                        status: 'success',
                        endTime: new Date(),
                    });
                }
            },
            onData: (content) => {
                fullContent += content;
                updateMessage(assistantMessageId, {
                    content: fullContent,
                    status: 'streaming',
                });
            },
            onError: (error) => {
                updateMessage(assistantMessageId, {
                    content: `Error: ${error.message}`,
                    status: 'error',
                });
                setConnectionStatus('error');
                setCurrentMessageId(null);
                // Auto-focus input on error too
                chatInputRef.current?.focus();
            },
            onMetricsComplete: async (metrics) => {
                // Store metrics on the message for developer display
                // Only store if we have the required timing data
                if (metrics.latencyMs !== undefined && metrics.totalDurationMs !== undefined) {
                    const baseMetrics = {
                        latencyMs: metrics.latencyMs,
                        totalDurationMs: metrics.totalDurationMs,
                        tokenUsage: metrics.tokenUsage,
                        executionId: metrics.executionId,
                    };

                    // Initial update with available metrics
                    updateMessage(assistantMessageId, { metrics: baseMetrics });

                    // If we have an execution ID and no token usage, try fetching from n8n API
                    if (metrics.executionId && !metrics.tokenUsage?.input) {
                        try {
                            const executionData = await n8nApiService.getExecutionDetails(metrics.executionId);
                            if (executionData?.tokenUsage) {
                                updateMessage(assistantMessageId, {
                                    metrics: {
                                        ...baseMetrics,
                                        tokenUsage: executionData.tokenUsage,
                                    },
                                });
                            }
                        } catch (error) {
                            console.debug('[ChatContainer] Failed to fetch token usage from n8n API:', error);
                        }
                    }
                }
            },
        });
    };

    return (
        <div className="chat-container">
            <div className="chat-header">
                <div className="chat-header-avatar">
                    {config.identity.avatarUrl ? (
                        <img src={config.identity.avatarUrl} alt={config.identity.botName} />
                    ) : (
                        <span className="avatar-placeholder">🤖</span>
                    )}
                </div>
                <div className="chat-header-info">
                    <h1 className="chat-header-title">{config.identity.botName}</h1>
                    <span className={`chat-header-status chat-header-status--${connectionStatus}`}>
                        {connectionStatus === 'streaming' ? 'Typing...' : 'Online'}
                    </span>
                </div>
            </div>

            <div className="chat-messages">
                {messages.map((message) => (
                    <MessageBubble
                        key={message.id}
                        message={message}
                        botName={config.identity.botName}
                        botAvatar={config.identity.avatarUrl}
                        showToolCalls={config.capabilities.showToolCalls}
                        showThinking={config.capabilities.thinkingVisualization}
                        showDeveloperMetrics={config.capabilities.showDeveloperMetrics}
                    />
                ))}
                <div ref={messagesEndRef} />
            </div>

            <ChatInput
                ref={chatInputRef}
                onSend={handleSend}
                disabled={connectionStatus === 'streaming'}
                placeholder={`Message ${config.identity.botName}...`}
                enableFileUpload={config.capabilities.fileUpload}
            />
        </div>
    );
};
