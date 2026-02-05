import React from 'react';
import type { SessionMetrics } from '../types';
import './styles/MetricsDisplay.css';

interface MetricsDisplayProps {
    metrics: SessionMetrics;
}

/**
 * Displays session metrics (latency, token usage, duration) for a message.
 * Shown only when developer metrics are enabled in config.
 */
export const MetricsDisplay: React.FC<MetricsDisplayProps> = ({ metrics }) => {
    const formatLatency = (ms: number): string => {
        if (ms < 1000) {
            return `${Math.round(ms)}ms`;
        }
        return `${(ms / 1000).toFixed(2)}s`;
    };

    const formatTokens = (usage?: { input?: number; output?: number; total?: number }): string => {
        if (!usage?.total) return 'N/A';
        if (usage.input !== undefined && usage.output !== undefined) {
            return `${usage.input}↓ ${usage.output}↑`;
        }
        return `${usage.total}`;
    };

    return (
        <div className="metrics-display">
            <span title="Time to first token" className="metric-item metric-latency">
                ⚡ {formatLatency(metrics.latencyMs)}
            </span>
            <span title={`Token usage${metrics.tokenUsage?.input ? ` (${metrics.tokenUsage.input} in, ${metrics.tokenUsage.output} out)` : ''}`} className="metric-item metric-tokens">
                📊 {formatTokens(metrics.tokenUsage)}
            </span>
            <span title="Total duration" className="metric-item metric-duration">
                ⏱️ {formatLatency(metrics.totalDurationMs)}
            </span>
            {metrics.executionId && (
                <span title={`Execution ID: ${metrics.executionId}`} className="metric-item metric-execution-id">
                    🔗 {metrics.executionId.substring(0, 8)}...
                </span>
            )}
        </div>
    );
};
