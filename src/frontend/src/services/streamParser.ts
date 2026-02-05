import type { SSEEvent, SSEEventType, ToolCallStartEvent, ToolCallEndEvent } from '../types';

/**
 * Callback handlers for SSE stream events
 */
export interface StreamCallbacks {
    onWorkflowStart?: () => void;
    onWorkflowEnd?: () => void;
    onToolCallStart?: (data: ToolCallStartEvent) => void;
    onToolCallEnd?: (data: ToolCallEndEvent) => void;
    onData?: (content: string) => void;
    onError?: (error: Error) => void;
}

/**
 * Parses SSE stream from n8n webhook
 * Handles buffering for partial events across TCP packets
 */
export class StreamParser {
    private buffer = '';
    private callbacks: StreamCallbacks;

    constructor(callbacks: StreamCallbacks) {
        this.callbacks = callbacks;
    }

    /**
     * Process incoming text chunk from stream
     */
    processChunk(chunk: string): void {
        this.buffer += chunk;
        this.parseBuffer();
    }

    /**
     * Parse buffered content for complete SSE events
     */
    private parseBuffer(): void {
        // SSE events are delimited by double newlines
        const events = this.buffer.split('\n\n');

        // Keep last potentially incomplete event in buffer
        this.buffer = events.pop() || '';

        for (const eventText of events) {
            if (eventText.trim()) {
                this.parseEvent(eventText);
            }
        }
    }

    /**
     * Parse a single SSE event
     */
    private parseEvent(eventText: string): void {
        const lines = eventText.split('\n');
        let eventType: SSEEventType = 'data';
        let dataContent = '';

        for (const line of lines) {
            if (line.startsWith('event:')) {
                eventType = line.substring(6).trim() as SSEEventType;
            } else if (line.startsWith('data:')) {
                dataContent = line.substring(5).trim();
            }
        }

        this.dispatchEvent(eventType, dataContent);
    }

    /**
     * Dispatch event to appropriate callback
     */
    private dispatchEvent(eventType: SSEEventType, dataContent: string): void {
        try {
            const event: SSEEvent = {
                event: eventType,
                data: dataContent ? JSON.parse(dataContent) : null,
            };

            switch (eventType) {
                case 'workflow:start':
                    this.callbacks.onWorkflowStart?.();
                    break;
                case 'workflow:end':
                    this.callbacks.onWorkflowEnd?.();
                    break;
                case 'tool-call-start':
                    this.callbacks.onToolCallStart?.(event.data as ToolCallStartEvent);
                    break;
                case 'tool-call-end':
                    this.callbacks.onToolCallEnd?.(event.data as ToolCallEndEvent);
                    break;
                case 'data':
                    // Handle both raw text and structured data
                    if (typeof event.data === 'string') {
                        this.callbacks.onData?.(event.data);
                    } else if (event.data && typeof event.data === 'object' && 'content' in event.data) {
                        this.callbacks.onData?.((event.data as { content: string }).content);
                    }
                    break;
                case 'error':
                    this.callbacks.onError?.(new Error(String(event.data)));
                    break;
            }
        } catch {
            // For plain text data events
            if (eventType === 'data' && dataContent) {
                this.callbacks.onData?.(dataContent);
            }
        }
    }

    /**
     * Extract <thinking> tags from content
     * Returns [contentWithoutThinking, thinkingContent]
     */
    static extractThinking(content: string): [string, string | null] {
        const thinkingRegex = /<thinking>([\s\S]*?)<\/thinking>/gi;
        const matches = content.match(thinkingRegex);

        if (!matches || matches.length === 0) {
            return [content, null];
        }

        let thinkingContent = '';
        let cleanContent = content;

        for (const match of matches) {
            const inner = match.replace(/<\/?thinking>/gi, '');
            thinkingContent += inner;
            cleanContent = cleanContent.replace(match, '');
        }

        return [cleanContent.trim(), thinkingContent.trim()];
    }

    /**
     * Reset buffer (call when starting new stream)
     */
    reset(): void {
        this.buffer = '';
    }
}
