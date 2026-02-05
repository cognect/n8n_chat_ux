import { getConfig, loadN8nApiKey } from './configService';

interface TokenUsage {
    input?: number;
    output?: number;
    total?: number;
}

interface ExecutionMetadata {
    executionId: string;
    tokenUsage?: TokenUsage;
    duration?: number;
    status?: string;
}

/**
 * Service for interacting with n8n REST API
 * Provides execution details lookup for token usage metrics
 */
class N8nApiService {
    private apiKey: string | null = null;
    private initialized = false;

    /**
     * Initialize the service by loading the API key
     */
    async initialize(): Promise<void> {
        if (this.initialized) return;
        this.apiKey = await loadN8nApiKey();
        this.initialized = true;
    }

    /**
     * Check if API key is configured
     */
    isConfigured(): boolean {
        return this.apiKey !== null || !!getConfig().n8n.apiKey;
    }

    /**
     * Get the n8n base URL from webhook URL
     */
    private getBaseUrl(): string {
        const config = getConfig();
        const webhookUrl = config.n8n.webhookUrl;

        // Extract base URL from webhook URL
        // e.g., "http://localhost:5678/webhook/chat" -> "http://localhost:5678"
        try {
            const url = new URL(webhookUrl);
            return `${url.protocol}//${url.host}`;
        } catch {
            return 'http://localhost:5678';
        }
    }

    /**
     * Get the API key (from file or config)
     */
    private getApiKey(): string | null {
        return this.apiKey || getConfig().n8n.apiKey || null;
    }

    /**
     * Fetch execution details from n8n REST API
     */
    async getExecutionDetails(executionId: string): Promise<ExecutionMetadata | null> {
        await this.initialize();

        const apiKey = this.getApiKey();
        if (!apiKey) {
            console.debug('[n8nApiService] No API key configured, skipping token lookup');
            return null;
        }

        // Use /n8n-api proxy path in development to bypass CORS
        // The Vite proxy rewrites /n8n-api/* to /api/* on the n8n server
        // Include ?includeData=true to get full execution data with node outputs
        const url = `/n8n-api/v1/executions/${executionId}?includeData=true`;

        try {
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'X-N8N-API-KEY': apiKey,
                    'Accept': 'application/json',
                },
            });

            if (!response.ok) {
                console.warn(`[n8nApiService] Failed to fetch execution: ${response.status}`);
                return null;
            }

            const data = await response.json();
            return this.extractTokenUsage(executionId, data);
        } catch (error) {
            console.warn('[n8nApiService] Error fetching execution details:', error);
            return null;
        }
    }

    /**
     * Extract token usage from execution data
     * Searches through node outputs for AI model token usage info
     */
    private extractTokenUsage(executionId: string, executionData: unknown): ExecutionMetadata {
        const result: ExecutionMetadata = { executionId };

        try {
            const data = executionData as Record<string, unknown>;
            const resultData = data.data as Record<string, unknown> | undefined;
            const resultNodes = resultData?.resultData as Record<string, unknown> | undefined;
            const runData = resultNodes?.runData as Record<string, unknown[]> | undefined;

            if (!runData) {
                return result;
            }

            let totalInput = 0;
            let totalOutput = 0;
            let foundUsage = false;

            // Search through all nodes for token usage
            for (const [, nodeRuns] of Object.entries(runData)) {
                for (const run of nodeRuns) {
                    const runObj = run as Record<string, unknown>;
                    const runObjData = runObj.data as Record<string, unknown> | undefined;

                    // Check ai_languageModel path (used by Gemini and other LLM nodes)
                    if (runObjData?.ai_languageModel) {
                        const aiData = runObjData.ai_languageModel as unknown[][];
                        if (aiData?.[0]?.[0]) {
                            const item = aiData[0][0] as Record<string, unknown>;
                            const json = item.json as Record<string, unknown>;
                            if (json) {
                                const usage = this.findTokenUsage(json);
                                if (usage) {
                                    totalInput += usage.input || 0;
                                    totalOutput += usage.output || 0;
                                    foundUsage = true;
                                }
                            }
                        }
                    }

                    // Check main array path
                    const dataArray = runObjData?.main as Array<Array<Record<string, unknown>>> | undefined;
                    if (!dataArray) continue;

                    for (const outputs of dataArray) {
                        if (!outputs) continue;

                        for (const output of outputs) {
                            const json = output.json as Record<string, unknown> | undefined;
                            if (!json) continue;

                            const usage = this.findTokenUsage(json);
                            if (usage) {
                                totalInput += usage.input || 0;
                                totalOutput += usage.output || 0;
                                foundUsage = true;
                            }
                        }
                    }
                }
            }

            if (foundUsage) {
                result.tokenUsage = {
                    input: totalInput,
                    output: totalOutput,
                    total: totalInput + totalOutput,
                };
            }

            // Get execution duration if available
            if (data.startedAt && data.stoppedAt) {
                const started = new Date(data.startedAt as string).getTime();
                const stopped = new Date(data.stoppedAt as string).getTime();
                result.duration = stopped - started;
            }

            result.status = data.finished ? 'finished' : 'running';

        } catch (error) {
            console.warn('[n8nApiService] Error extracting token usage:', error);
        }

        return result;
    }

    /**
     * Find token usage in a JSON object (handles various field patterns)
     */
    private findTokenUsage(json: Record<string, unknown>): { input?: number; output?: number } | null {
        // Pattern 1: OpenAI style - usage.prompt_tokens / completion_tokens
        const usage = json.usage as Record<string, number> | undefined;
        if (usage) {
            if (usage.prompt_tokens !== undefined || usage.completion_tokens !== undefined) {
                return {
                    input: usage.prompt_tokens,
                    output: usage.completion_tokens,
                };
            }
            if (usage.input_tokens !== undefined || usage.output_tokens !== undefined) {
                return {
                    input: usage.input_tokens,
                    output: usage.output_tokens,
                };
            }
        }

        // Pattern 2: n8n AI Agent - tokenUsage.promptTokens / completionTokens
        const tokenUsage = json.tokenUsage as Record<string, number> | undefined;
        if (tokenUsage) {
            return {
                input: tokenUsage.promptTokens,
                output: tokenUsage.completionTokens,
            };
        }

        // Pattern 3: Gemini style - usageMetadata
        const usageMetadata = json.usageMetadata as Record<string, number> | undefined;
        if (usageMetadata) {
            return {
                input: usageMetadata.promptTokenCount,
                output: usageMetadata.candidatesTokenCount,
            };
        }

        // Pattern 4: Generic response metadata
        const response = json.response as Record<string, unknown> | undefined;
        if (response?.usageMetadata) {
            const meta = response.usageMetadata as Record<string, number>;
            return {
                input: meta.promptTokenCount,
                output: meta.candidatesTokenCount,
            };
        }

        return null;
    }
}

// Singleton instance
export const n8nApiService = new N8nApiService();
