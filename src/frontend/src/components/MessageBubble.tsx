import React from 'react';
import ReactMarkdown from 'react-markdown';
import type { Message } from '../types';
import { ToolCallIndicator, ThinkingIndicator } from './ToolCallIndicator';
import './styles/MessageBubble.css';

interface MessageBubbleProps {
    message: Message;
    botName?: string;
    botAvatar?: string;
    showToolCalls?: boolean;
    showThinking?: boolean;
}

/**
 * Individual message display component
 * Supports user, assistant, and system message types
 */
export const MessageBubble: React.FC<MessageBubbleProps> = ({
    message,
    botName = 'AI',
    botAvatar,
    showToolCalls = true,
    showThinking = true,
}) => {
    const [expandedTools, setExpandedTools] = React.useState<Set<string>>(new Set());
    const [thinkingExpanded, setThinkingExpanded] = React.useState(false);

    const toggleTool = (toolId: string) => {
        setExpandedTools((prev) => {
            const next = new Set(prev);
            if (next.has(toolId)) {
                next.delete(toolId);
            } else {
                next.add(toolId);
            }
            return next;
        });
    };

    const formatTime = (date: Date): string => {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const renderContent = () => {
        if (message.status === 'pending') {
            return <span className="message-loading">Thinking...</span>;
        }

        return (
            <>
                {/* Tool calls visualization */}
                {showToolCalls && message.toolCalls && message.toolCalls.length > 0 && (
                    <div className="message-tool-calls">
                        {message.toolCalls.map((tool) => (
                            <ToolCallIndicator
                                key={tool.id}
                                toolCall={tool}
                                isExpanded={expandedTools.has(tool.id)}
                                onToggle={() => toggleTool(tool.id)}
                            />
                        ))}
                    </div>
                )}

                {/* Thinking content */}
                {showThinking && message.thinkingContent && (
                    <ThinkingIndicator
                        content={message.thinkingContent}
                        isExpanded={thinkingExpanded}
                        onToggle={() => setThinkingExpanded(!thinkingExpanded)}
                    />
                )}

                {/* Main content with Markdown rendering */}
                <div className="message-text">
                    {message.role === 'assistant' ? (
                        <ReactMarkdown
                            components={{
                                // Custom rendering for code blocks
                                code: ({ className, children, ...props }) => {
                                    const isInline = !className;
                                    return isInline ? (
                                        <code className="inline-code" {...props}>{children}</code>
                                    ) : (
                                        <code className={className} {...props}>{children}</code>
                                    );
                                },
                                // Open links in new tab
                                a: ({ children, ...props }) => (
                                    <a {...props} target="_blank" rel="noopener noreferrer">{children}</a>
                                ),
                            }}
                        >
                            {message.content}
                        </ReactMarkdown>
                    ) : (
                        message.content
                    )}
                    {message.status === 'streaming' && (
                        <span className="message-cursor" />
                    )}
                </div>

                {/* File attachments */}
                {message.files && message.files.length > 0 && (
                    <div className="message-files">
                        {message.files.map((file) => (
                            <div key={file.id} className="message-file">
                                {file.preview || file.type?.startsWith('image/') ? (
                                    <img
                                        src={file.preview}
                                        alt={file.name}
                                        className="message-file-image"
                                    />
                                ) : (
                                    <svg className="file-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" />
                                    </svg>
                                )}
                                <span className="file-name">{file.name}</span>
                            </div>
                        ))}
                    </div>
                )}
            </>
        );
    };

    return (
        <div className={`message-bubble message-bubble--${message.role}`}>
            {message.role === 'assistant' && (
                <div className="message-avatar">
                    {botAvatar ? (
                        <img src={botAvatar} alt={botName} />
                    ) : (
                        <span className="avatar-placeholder">🤖</span>
                    )}
                </div>
            )}

            <div className="message-content-wrapper">
                {message.role === 'assistant' && (
                    <span className="message-sender">{botName}</span>
                )}

                <div className={`message-content message-content--${message.status}`}>
                    {renderContent()}
                </div>

                <span className="message-time">{formatTime(message.timestamp)}</span>
            </div>
        </div>
    );
};
