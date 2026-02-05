import type { AppConfig } from '../types';

const DEFAULT_CONFIG: AppConfig = {
    identity: {
        botName: 'AI Assistant',
        avatarUrl: '',
        introMessage: 'Hello! How can I help you today?',
        systemPrompt: 'You are a helpful AI assistant. Be friendly, professional, and concise in your responses.',
    },
    theme: {
        primaryColor: '#6366f1',
        secondaryColor: '#818cf8',
        backgroundColor: '#0f0f23',
        surfaceColor: '#1a1a2e',
        textColor: '#ffffff',
        textSecondaryColor: '#a1a1aa',
        errorColor: '#ef4444',
        successColor: '#22c55e',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        bubbleRadius: '16px',
        inputBackground: '#16162a',
    },
    capabilities: {
        fileUpload: true,
        voiceInput: false,
        thinkingVisualization: true,
        showToolCalls: true,
        showDeveloperMetrics: false,  // Hidden by default
    },
    n8n: {
        webhookUrl: '',
        useProxy: false,
    },
};

let cachedConfig: AppConfig | null = null;

/**
 * Loads configuration from config.json
 * Falls back to defaults if loading fails
 */
export async function loadConfig(): Promise<AppConfig> {
    if (cachedConfig) {
        return cachedConfig;
    }

    try {
        const response = await fetch('/config.json');
        if (!response.ok) {
            console.warn('Failed to load config.json, using defaults');
            cachedConfig = DEFAULT_CONFIG;
            return cachedConfig;
        }

        const userConfig = await response.json();
        // Deep merge with defaults
        cachedConfig = mergeConfig(DEFAULT_CONFIG, userConfig);
        return cachedConfig;
    } catch (error) {
        console.warn('Error loading config:', error);
        cachedConfig = DEFAULT_CONFIG;
        return cachedConfig;
    }
}

/**
 * Deep merge configuration objects
 */
function mergeConfig(defaults: AppConfig, overrides: Partial<AppConfig>): AppConfig {
    return {
        identity: { ...defaults.identity, ...overrides.identity },
        theme: { ...defaults.theme, ...overrides.theme },
        capabilities: { ...defaults.capabilities, ...overrides.capabilities },
        n8n: { ...defaults.n8n, ...overrides.n8n },
        perplexity: overrides.perplexity,
        branding: overrides.branding,
    };
}

/**
 * Get cached config (must call loadConfig first)
 */
export function getConfig(): AppConfig {
    if (!cachedConfig) {
        throw new Error('Config not loaded. Call loadConfig() first.');
    }
    return cachedConfig;
}

/**
 * Check if n8n is configured
 */
export function isN8nConfigured(): boolean {
    return !!cachedConfig?.n8n.webhookUrl;
}

/**
 * Update the cached configuration
 * Used by ThemeSettings for live preview and saving
 */
export function updateConfig(newConfig: AppConfig): void {
    cachedConfig = newConfig;
}

/**
 * Clear the cached configuration
 * Allows reloading from config.json
 */
export function clearConfigCache(): void {
    cachedConfig = null;
}

/**
 * Get the default configuration
 */
export function getDefaultConfig(): AppConfig {
    return { ...DEFAULT_CONFIG };
}

/**
 * Loads Perplexity API key from separate configuration file
 * Returns null if the file doesn't exist or contains a placeholder
 */
export async function loadPerplexityApiKey(): Promise<string | null> {
    try {
        const response = await fetch('/perplexity-api-key.json');
        if (!response.ok) {
            return null;
        }

        const data = await response.json();
        const apiKey = data.apiKey;

        // Check if it's a placeholder value
        if (!apiKey || apiKey === 'pplx-your-api-key-here' || apiKey.includes('your-api-key')) {
            return null;
        }

        return apiKey;
    } catch {
        // File doesn't exist or invalid JSON - this is expected
        return null;
    }
}

/**
 * Loads n8n API key from separate configuration file
 * Returns null if the file doesn't exist or contains a placeholder
 */
let n8nApiKeyFromFile: string | null = null;
let n8nApiKeyLoaded = false;

export async function loadN8nApiKey(): Promise<string | null> {
    if (n8nApiKeyLoaded) {
        return n8nApiKeyFromFile;
    }

    try {
        const response = await fetch('/n8n-api-key.json');

        if (!response.ok) {
            n8nApiKeyLoaded = true;
            return null;
        }

        const data = await response.json();
        const apiKey = data.apiKey;

        // Check if it's a placeholder value
        if (!apiKey || apiKey.includes('your-api-key')) {
            n8nApiKeyLoaded = true;
            return null;
        }

        n8nApiKeyFromFile = apiKey;
        n8nApiKeyLoaded = true;
        return apiKey;
    } catch {
        // File doesn't exist or invalid JSON - this is expected
        n8nApiKeyLoaded = true;
        return null;
    }
}

/**
 * Check if n8n API key is loaded from file (non-async check after initial load)
 */
export function isN8nApiKeyFromFile(): boolean {
    return n8nApiKeyFromFile !== null;
}

/**
 * Get the n8n API key loaded from file (if any)
 */
export function getN8nApiKeyFromFile(): string | null {
    return n8nApiKeyFromFile;
}

