import React from 'react';
import type { ToolCall } from '../types';
import './styles/ToolCallIndicator.css';

interface ToolCallIndicatorProps {
    toolCall: ToolCall;
    isExpanded?: boolean;
    onToggle?: () => void;
}

/**
 * Visualizes agent tool usage and thinking state
 * Shows tool name, status, and expandable input/output
 */
export const ToolCallIndicator: React.FC<ToolCallIndicatorProps> = ({
    toolCall,
    isExpanded = false,
    onToggle,
}) => {
    const statusIcons = {
        'in-progress': '⏳',
        'success': '✓',
        'failed': '✗',
    };

    const statusClasses = {
        'in-progress': 'tool-status--progress',
        'success': 'tool-status--success',
        'failed': 'tool-status--failed',
    };

    const formatToolName = (name: string): string => {
        // Convert snake_case to Title Case
        return name
            .replace(/_/g, ' ')
            .replace(/\b\w/g, (char) => char.toUpperCase());
    };

    const formatDuration = (): string | null => {
        if (!toolCall.endTime) return null;
        const ms = toolCall.endTime.getTime() - toolCall.startTime.getTime();
        if (ms < 1000) return `${ms}ms`;
        return `${(ms / 1000).toFixed(1)}s`;
    };

    return (
        <div className={`tool-call-indicator ${statusClasses[toolCall.status]}`}>
            <div className="tool-call-header" onClick={onToggle}>
                <span className="tool-call-icon">{statusIcons[toolCall.status]}</span>
                <span className="tool-call-name">{formatToolName(toolCall.name)}</span>
                {toolCall.status === 'in-progress' && (
                    <span className="tool-call-spinner" />
                )}
                {formatDuration() && (
                    <span className="tool-call-duration">{formatDuration()}</span>
                )}
                <span className="tool-call-expand">
                    {isExpanded ? '▼' : '▶'}
                </span>
            </div>

            {isExpanded && (
                <div className="tool-call-details">
                    <div className="tool-call-section">
                        <span className="tool-call-label">Input:</span>
                        <pre className="tool-call-code">
                            {JSON.stringify(toolCall.input, null, 2)}
                        </pre>
                    </div>

                    {toolCall.output && (
                        <div className="tool-call-section">
                            <span className="tool-call-label">Output:</span>
                            <pre className="tool-call-code">{toolCall.output}</pre>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

interface ThinkingIndicatorProps {
    content?: string;
    isExpanded?: boolean;
    onToggle?: () => void;
}

/**
 * Shows extracted <thinking> content from AI responses
 */
export const ThinkingIndicator: React.FC<ThinkingIndicatorProps> = ({
    content,
    isExpanded = false,
    onToggle,
}) => {
    if (!content) return null;

    return (
        <div className="thinking-indicator">
            <div className="thinking-header" onClick={onToggle}>
                <span className="thinking-icon">🧠</span>
                <span className="thinking-label">View Reasoning</span>
                <span className="thinking-expand">{isExpanded ? '▼' : '▶'}</span>
            </div>

            {isExpanded && (
                <div className="thinking-content">
                    <pre>{content}</pre>
                </div>
            )}
        </div>
    );
};
