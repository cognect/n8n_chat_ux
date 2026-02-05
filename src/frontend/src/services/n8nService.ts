import type { AttachedFile } from '../types';
import { getConfig } from './configService';
import { StreamParser } from './streamParser';
import type { StreamCallbacks } from './streamParser';

/**
 * Generate a UUID v4
 */
function generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

/**
 * Get or create a session ID
 * - If ?sessionid=xxx in URL → use that session (allows resuming)
 * - Otherwise → generate a new session every time
 * Updates URL with sessionId for bookmarking/sharing
 */
function getSessionId(): string {
    const QUERY_PARAM = 'sessionid';

    // Check URL query parameter
    const urlParams = new URLSearchParams(window.location.search);
    const querySessionId = urlParams.get(QUERY_PARAM);

    if (querySessionId) {
        // Use the provided session ID
        return querySessionId;
    }

    // No session specified - generate a new one
    const sessionId = generateUUID();

    // Update URL with new sessionId (without reloading)
    updateUrlWithSessionId(sessionId);

    return sessionId;
}

/**
 * Update URL query parameter with session ID for bookmarking
 */
function updateUrlWithSessionId(sessionId: string): void {
    const url = new URL(window.location.href);
    url.searchParams.set('sessionid', sessionId);
    window.history.replaceState({}, '', url.toString());
}

/**
 * Service for communicating with n8n webhook
 */
export class N8nService {
    private abortController: AbortController | null = null;
    private sessionId: string;

    constructor() {
        this.sessionId = getSessionId();
    }

    /**
     * Send a message to n8n webhook with optional file attachments
     * Uses SSE for streaming responses
     */
    async sendMessage(
        message: string,
        files: AttachedFile[],
        callbacks: StreamCallbacks
    ): Promise<void> {
        const config = getConfig();

        if (!config.n8n.webhookUrl) {
            callbacks.onError?.(new Error('n8n webhook URL not configured'));
            return;
        }

        // Abort any existing request
        this.abort();
        this.abortController = new AbortController();

        const parser = new StreamParser(callbacks);

        try {
            let body: FormData | string;
            const headers: Record<string, string> = {};

            if (files.length > 0) {
                // Use multipart/form-data for file uploads
                // IMPORTANT: Do NOT set Content-Type header manually!
                // Browser will set it with correct boundary
                body = new FormData();
                body.append('text', message);
                body.append('sessionId', this.sessionId);
                files.forEach((file, index) => {
                    (body as FormData).append(`file${index}`, file.file, file.name);
                });
            } else {
                // Use JSON for text-only messages with sessionId
                body = JSON.stringify({ message, sessionId: this.sessionId });
                headers['Content-Type'] = 'application/json';
            }

            const url = config.n8n.useProxy && config.n8n.proxyUrl
                ? config.n8n.proxyUrl
                : config.n8n.webhookUrl;

            const response = await fetch(url, {
                method: 'POST',
                headers,
                body,
                signal: this.abortController.signal,
            });

            if (!response.ok) {
                throw new Error(`HTTP error: ${response.status}`);
            }

            if (!response.body) {
                throw new Error('No response body');
            }

            // Process SSE stream
            const reader = response.body.getReader();
            const decoder = new TextDecoder();

            while (true) {
                const { done, value } = await reader.read();

                if (done) {
                    break;
                }

                const chunk = decoder.decode(value, { stream: true });
                parser.processChunk(chunk);
            }
        } catch (error) {
            if ((error as Error).name === 'AbortError') {
                // Request was aborted, don't treat as error
                return;
            }
            callbacks.onError?.(error as Error);
        }
    }

    /**
     * Abort current request
     */
    abort(): void {
        if (this.abortController) {
            this.abortController.abort();
            this.abortController = null;
        }
    }
}

// Singleton instance
export const n8nService = new N8nService();
