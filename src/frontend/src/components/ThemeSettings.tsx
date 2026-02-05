import React, { useState, useRef } from 'react';
import type { AppConfig, ConfigTheme, ConfigIdentity, ConfigCapabilities, ConfigN8n, ConfigBranding } from '../types';
import { extractWebsiteTheme } from '../services/perplexityService';
import type { ExtractedTheme } from '../services/perplexityService';
import './styles/ThemeSettings.css';

interface ThemeSettingsProps {
    config: AppConfig;
    onSave: (config: AppConfig) => void;
    onClose: () => void;
}

interface ColorInputProps {
    label: string;
    value: string;
    onChange: (value: string) => void;
}

const ColorInput: React.FC<ColorInputProps> = ({ label, value, onChange }) => (
    <div className="settings-field">
        <label>{label}</label>
        <div className="color-input-wrapper">
            <input
                type="color"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="color-picker"
            />
            <input
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="color-text"
                placeholder="#000000"
            />
        </div>
    </div>
);

interface ToggleProps {
    label: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
}

const Toggle: React.FC<ToggleProps> = ({ label, checked, onChange }) => (
    <div className="settings-field settings-field--toggle">
        <label>{label}</label>
        <button
            type="button"
            className={`toggle-switch ${checked ? 'toggle-switch--active' : ''}`}
            onClick={() => onChange(!checked)}
            aria-pressed={checked}
        >
            <span className="toggle-slider" />
        </button>
    </div>
);

/**
 * Theme Settings Panel
 * Allows users to configure, download, and upload config.json
 */
export const ThemeSettings: React.FC<ThemeSettingsProps> = ({ config, onSave, onClose }) => {
    const [localConfig, setLocalConfig] = useState<AppConfig>(config);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Perplexity Wizard state
    const [wizardApiKey, setWizardApiKey] = useState('');
    const [wizardUrl, setWizardUrl] = useState('');
    const [integratorUrl, setIntegratorUrl] = useState('');
    const [isExtracting, setIsExtracting] = useState(false);
    const [isExtractingIntegrator, setIsExtractingIntegrator] = useState(false);
    const [extractionError, setExtractionError] = useState<string | null>(null);
    const [extractionSuccess, setExtractionSuccess] = useState(false);
    const [integratorSuccess, setIntegratorSuccess] = useState(false);
    const [copySuccess, setCopySuccess] = useState(false);

    const handleCopySystemPrompt = async () => {
        try {
            await navigator.clipboard.writeText(localConfig.identity.systemPrompt);
            setCopySuccess(true);
            setTimeout(() => setCopySuccess(false), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    const updateIdentity = (updates: Partial<ConfigIdentity>) => {
        setLocalConfig(prev => ({
            ...prev,
            identity: { ...prev.identity, ...updates }
        }));
    };

    const updateTheme = (updates: Partial<ConfigTheme>) => {
        setLocalConfig(prev => ({
            ...prev,
            theme: { ...prev.theme, ...updates }
        }));
    };

    const updateCapabilities = (updates: Partial<ConfigCapabilities>) => {
        setLocalConfig(prev => ({
            ...prev,
            capabilities: { ...prev.capabilities, ...updates }
        }));
    };

    const updateN8n = (updates: Partial<ConfigN8n>) => {
        setLocalConfig(prev => ({
            ...prev,
            n8n: { ...prev.n8n, ...updates }
        }));
    };

    const updateBranding = (updates: Partial<ConfigBranding>) => {
        setLocalConfig(prev => ({
            ...prev,
            branding: {
                enabled: prev.branding?.enabled ?? false,
                logoUrl: prev.branding?.logoUrl ?? '',
                position: prev.branding?.position ?? 'bottom-right',
                opacity: prev.branding?.opacity ?? 0.4,
                size: prev.branding?.size ?? 48,
                linkUrl: prev.branding?.linkUrl ?? '',
                ...updates
            }
        }));
    };

    const applyExtractedTheme = (extracted: ExtractedTheme) => {
        // Apply theme colors
        const themeUpdates: Partial<ConfigTheme> = {};
        if (extracted.primaryColor) themeUpdates.primaryColor = extracted.primaryColor;
        if (extracted.secondaryColor) themeUpdates.secondaryColor = extracted.secondaryColor;
        if (extracted.backgroundColor) themeUpdates.backgroundColor = extracted.backgroundColor;
        if (extracted.surfaceColor) themeUpdates.surfaceColor = extracted.surfaceColor;
        if (extracted.textColor) themeUpdates.textColor = extracted.textColor;
        if (extracted.textSecondaryColor) themeUpdates.textSecondaryColor = extracted.textSecondaryColor;
        if (extracted.fontFamily) themeUpdates.fontFamily = extracted.fontFamily;
        if (extracted.inputBackground) themeUpdates.inputBackground = extracted.inputBackground;

        if (Object.keys(themeUpdates).length > 0) {
            updateTheme(themeUpdates);
        }

        // Apply identity updates
        const identityUpdates: Partial<ConfigIdentity> = {};
        if (extracted.logoUrl) identityUpdates.avatarUrl = extracted.logoUrl;
        if (extracted.botName) identityUpdates.botName = extracted.botName;
        if (extracted.introMessage) identityUpdates.introMessage = extracted.introMessage;
        if (extracted.systemPrompt) identityUpdates.systemPrompt = extracted.systemPrompt;

        if (Object.keys(identityUpdates).length > 0) {
            updateIdentity(identityUpdates);
        }
    };

    const handleExtractTheme = async () => {
        if (!wizardUrl.trim()) {
            setExtractionError('Please enter a website URL');
            return;
        }

        if (!wizardApiKey.trim()) {
            setExtractionError('Please enter your Perplexity API key');
            return;
        }

        setIsExtracting(true);
        setExtractionError(null);
        setExtractionSuccess(false);

        const result = await extractWebsiteTheme(
            wizardUrl,
            wizardApiKey,
            'sonar'
        );

        setIsExtracting(false);

        if (result.success && result.data) {
            applyExtractedTheme(result.data);
            setExtractionSuccess(true);
            // Clear success message after 3 seconds
            setTimeout(() => setExtractionSuccess(false), 3000);
        } else {
            setExtractionError(result.error || 'Failed to extract theme');
        }
    };

    const handleExtractIntegrator = async () => {
        if (!integratorUrl.trim()) {
            setExtractionError('Please enter an integrator website URL');
            return;
        }

        if (!wizardApiKey.trim()) {
            setExtractionError('Please enter your Perplexity API key first');
            return;
        }

        setIsExtractingIntegrator(true);
        setExtractionError(null);

        try {
            // Extract favicon URL using Google's service
            const url = new URL(integratorUrl);
            const faviconUrl = `https://www.google.com/s2/favicons?domain=${url.hostname}&sz=128`;

            // Update branding with the integrator info
            updateBranding({
                enabled: true,
                logoUrl: faviconUrl,
                linkUrl: integratorUrl,
            });

            setIntegratorSuccess(true);
            setTimeout(() => setIntegratorSuccess(false), 3000);
        } catch {
            setExtractionError('Invalid URL format');
        }

        setIsExtractingIntegrator(false);
    };

    const handleDownload = () => {
        const blob = new Blob([JSON.stringify(localConfig, null, 4)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'config.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const parsed = JSON.parse(e.target?.result as string);
                // Basic validation
                if (parsed.identity && parsed.theme && parsed.capabilities && parsed.n8n) {
                    setLocalConfig(parsed as AppConfig);
                } else {
                    alert('Invalid configuration file structure');
                }
            } catch {
                alert('Failed to parse configuration file');
            }
        };
        reader.readAsText(file);
    };

    const handleSave = () => {
        onSave(localConfig);
        onClose();
    };

    return (
        <div className="theme-settings-overlay">
            <div className="theme-settings">
                <div className="theme-settings-header">
                    <h2>Settings</h2>
                    <button className="close-button" onClick={onClose} aria-label="Close">
                        ✕
                    </button>
                </div>

                <div className="theme-settings-content">
                    {/* Perplexity Wizard Section */}
                    <section className="settings-section extraction-section">
                        <h3>🪄 Perplexity Wizard</h3>
                        <p className="section-description">
                            Automatically extract branding, colors, messaging, and system prompt from any website using AI.
                        </p>
                        <div className="settings-field">
                            <label>Perplexity API Key</label>
                            <input
                                type="password"
                                value={wizardApiKey}
                                onChange={(e) => {
                                    setWizardApiKey(e.target.value);
                                    setExtractionError(null);
                                }}
                                placeholder="pplx-xxxxxxxxxxxxxxxx"
                                disabled={isExtracting}
                            />
                            <span className="field-hint">
                                Get your API key from <a href="https://www.perplexity.ai/settings/api" target="_blank" rel="noopener noreferrer">perplexity.ai/settings/api</a>
                            </span>
                        </div>
                        <div className="settings-field">
                            <label>Website URL</label>
                            <input
                                type="url"
                                value={wizardUrl}
                                onChange={(e) => {
                                    setWizardUrl(e.target.value);
                                    setExtractionError(null);
                                    setExtractionSuccess(false);
                                }}
                                placeholder="https://example.com"
                                disabled={isExtracting}
                            />
                        </div>
                        <button
                            className={`btn btn--primary extraction-btn wizard-btn ${isExtracting ? 'btn--loading' : ''}`}
                            onClick={handleExtractTheme}
                            disabled={isExtracting || !wizardApiKey.trim() || !wizardUrl.trim()}
                        >
                            {isExtracting ? (
                                <>
                                    <span className="spinner" />
                                    Extracting Theme...
                                </>
                            ) : (
                                '✨ Run Wizard'
                            )}
                        </button>
                        {extractionError && (
                            <div className="extraction-message extraction-error">
                                ❌ {extractionError}
                            </div>
                        )}
                        {extractionSuccess && (
                            <div className="extraction-message extraction-success">
                                ✅ Theme extracted and applied successfully!
                            </div>
                        )}
                    </section>

                    {/* Identity Section */}
                    <section className="settings-section">
                        <h3>Identity</h3>
                        <div className="settings-field">
                            <label>Bot Name</label>
                            <input
                                type="text"
                                value={localConfig.identity.botName}
                                onChange={(e) => updateIdentity({ botName: e.target.value })}
                                placeholder="AI Assistant"
                            />
                        </div>
                        <div className="settings-field">
                            <label>Avatar URL</label>
                            <input
                                type="url"
                                value={localConfig.identity.avatarUrl}
                                onChange={(e) => updateIdentity({ avatarUrl: e.target.value })}
                                placeholder="https://example.com/avatar.png"
                            />
                        </div>
                        <div className="settings-field">
                            <label>Intro Message</label>
                            <textarea
                                value={localConfig.identity.introMessage}
                                onChange={(e) => updateIdentity({ introMessage: e.target.value })}
                                placeholder="Hello! How can I help you today?"
                                rows={3}
                            />
                        </div>
                        <div className="settings-field">
                            <label>
                                System Prompt
                                <span className="field-hint">Copy this to your n8n AI Agent system prompt</span>
                            </label>
                            <div className="textarea-with-button">
                                <textarea
                                    value={localConfig.identity.systemPrompt}
                                    onChange={(e) => updateIdentity({ systemPrompt: e.target.value })}
                                    placeholder="You are a helpful AI assistant..."
                                    rows={5}
                                    className="system-prompt-textarea"
                                />
                                <button
                                    type="button"
                                    className={`copy-button ${copySuccess ? 'copy-success' : ''}`}
                                    onClick={handleCopySystemPrompt}
                                    title="Copy to clipboard"
                                >
                                    {copySuccess ? '✓ Copied!' : '📋 Copy'}
                                </button>
                            </div>
                        </div>
                    </section>

                    {/* Theme Colors Section */}
                    <section className="settings-section">
                        <h3>Theme Colors</h3>
                        <div className="settings-grid">
                            <ColorInput
                                label="Primary Color"
                                value={localConfig.theme.primaryColor}
                                onChange={(v) => updateTheme({ primaryColor: v })}
                            />
                            <ColorInput
                                label="Secondary Color"
                                value={localConfig.theme.secondaryColor}
                                onChange={(v) => updateTheme({ secondaryColor: v })}
                            />
                            <ColorInput
                                label="Background Color"
                                value={localConfig.theme.backgroundColor}
                                onChange={(v) => updateTheme({ backgroundColor: v })}
                            />
                            <ColorInput
                                label="Surface Color"
                                value={localConfig.theme.surfaceColor}
                                onChange={(v) => updateTheme({ surfaceColor: v })}
                            />
                            <ColorInput
                                label="Text Color"
                                value={localConfig.theme.textColor}
                                onChange={(v) => updateTheme({ textColor: v })}
                            />
                            <ColorInput
                                label="Text Secondary"
                                value={localConfig.theme.textSecondaryColor}
                                onChange={(v) => updateTheme({ textSecondaryColor: v })}
                            />
                            <ColorInput
                                label="Error Color"
                                value={localConfig.theme.errorColor}
                                onChange={(v) => updateTheme({ errorColor: v })}
                            />
                            <ColorInput
                                label="Success Color"
                                value={localConfig.theme.successColor}
                                onChange={(v) => updateTheme({ successColor: v })}
                            />
                            <ColorInput
                                label="Input Background"
                                value={localConfig.theme.inputBackground}
                                onChange={(v) => updateTheme({ inputBackground: v })}
                            />
                        </div>
                    </section>

                    {/* Styling Section */}
                    <section className="settings-section">
                        <h3>Styling</h3>
                        <div className="settings-field">
                            <label>Font Family</label>
                            <input
                                type="text"
                                value={localConfig.theme.fontFamily}
                                onChange={(e) => updateTheme({ fontFamily: e.target.value })}
                                placeholder="'Inter', sans-serif"
                            />
                        </div>
                        <div className="settings-field">
                            <label>Bubble Radius</label>
                            <input
                                type="text"
                                value={localConfig.theme.bubbleRadius}
                                onChange={(e) => updateTheme({ bubbleRadius: e.target.value })}
                                placeholder="16px"
                            />
                        </div>
                    </section>

                    {/* Capabilities Section */}
                    <section className="settings-section">
                        <h3>Capabilities</h3>
                        <Toggle
                            label="File Upload"
                            checked={localConfig.capabilities.fileUpload}
                            onChange={(v) => updateCapabilities({ fileUpload: v })}
                        />
                        <Toggle
                            label="Voice Input"
                            checked={localConfig.capabilities.voiceInput}
                            onChange={(v) => updateCapabilities({ voiceInput: v })}
                        />
                        <Toggle
                            label="Thinking Visualization"
                            checked={localConfig.capabilities.thinkingVisualization}
                            onChange={(v) => updateCapabilities({ thinkingVisualization: v })}
                        />
                        <Toggle
                            label="Show Tool Calls"
                            checked={localConfig.capabilities.showToolCalls}
                            onChange={(v) => updateCapabilities({ showToolCalls: v })}
                        />
                    </section>

                    {/* n8n Connection Section */}
                    <section className="settings-section">
                        <h3>n8n Connection</h3>
                        <div className="settings-field">
                            <label>Webhook URL</label>
                            <input
                                type="url"
                                value={localConfig.n8n.webhookUrl}
                                onChange={(e) => updateN8n({ webhookUrl: e.target.value })}
                                placeholder="http://localhost:5678/webhook/chat"
                            />
                        </div>
                        <Toggle
                            label="Use Proxy"
                            checked={localConfig.n8n.useProxy}
                            onChange={(v) => updateN8n({ useProxy: v })}
                        />
                        {localConfig.n8n.useProxy && (
                            <div className="settings-field">
                                <label>Proxy URL</label>
                                <input
                                    type="url"
                                    value={localConfig.n8n.proxyUrl || ''}
                                    onChange={(e) => updateN8n({ proxyUrl: e.target.value })}
                                    placeholder="http://localhost:3001/proxy"
                                />
                            </div>
                        )}
                    </section>

                    {/* Integrator Branding Section */}
                    <section className="settings-section">
                        <h3>🏢 Integrator Branding</h3>
                        <p className="section-description">
                            Add your company's branding as a watermark in the chat interface.
                        </p>
                        <Toggle
                            label="Enable Watermark"
                            checked={localConfig.branding?.enabled ?? false}
                            onChange={(v) => updateBranding({ enabled: v })}
                        />
                        {localConfig.branding?.enabled && (
                            <>
                                <div className="settings-field">
                                    <label>Lookup from Website</label>
                                    <div className="extraction-input-row">
                                        <input
                                            type="url"
                                            value={integratorUrl}
                                            onChange={(e) => setIntegratorUrl(e.target.value)}
                                            placeholder="https://your-company.com"
                                            className="extraction-url-input"
                                            disabled={isExtractingIntegrator}
                                        />
                                        <button
                                            className={`btn btn--secondary extraction-btn ${isExtractingIntegrator ? 'btn--loading' : ''}`}
                                            onClick={handleExtractIntegrator}
                                            disabled={isExtractingIntegrator || !wizardApiKey.trim() || !integratorUrl.trim()}
                                            title={!wizardApiKey.trim() ? 'Enter Perplexity API key first' : ''}
                                        >
                                            {isExtractingIntegrator ? (
                                                <><span className="spinner" /> Fetching...</>
                                            ) : '🔍 Lookup'}
                                        </button>
                                    </div>
                                    {integratorSuccess && (
                                        <div className="extraction-message extraction-success">
                                            ✅ Integrator branding applied!
                                        </div>
                                    )}
                                </div>
                                <div className="settings-field">
                                    <label>Logo URL</label>
                                    <input
                                        type="url"
                                        value={localConfig.branding?.logoUrl || ''}
                                        onChange={(e) => updateBranding({ logoUrl: e.target.value })}
                                        placeholder="https://example.com/logo.png"
                                    />
                                    {localConfig.branding?.logoUrl && (
                                        <div className="branding-preview">
                                            <img src={localConfig.branding.logoUrl} alt="Preview" />
                                        </div>
                                    )}
                                </div>
                                <div className="settings-field">
                                    <label>Link URL</label>
                                    <input
                                        type="url"
                                        value={localConfig.branding?.linkUrl || ''}
                                        onChange={(e) => updateBranding({ linkUrl: e.target.value })}
                                        placeholder="https://your-company.com"
                                    />
                                </div>
                                <div className="settings-field">
                                    <label>Position</label>
                                    <select
                                        value={localConfig.branding?.position || 'bottom-right'}
                                        onChange={(e) => updateBranding({ position: e.target.value as ConfigBranding['position'] })}
                                    >
                                        <option value="top-left">Top Left</option>
                                        <option value="top-right">Top Right</option>
                                        <option value="bottom-left">Bottom Left</option>
                                        <option value="bottom-right">Bottom Right</option>
                                    </select>
                                </div>
                                <div className="settings-field">
                                    <label>Opacity: {Math.round((localConfig.branding?.opacity ?? 0.4) * 100)}%</label>
                                    <input
                                        type="range"
                                        min="0.1"
                                        max="1"
                                        step="0.05"
                                        value={localConfig.branding?.opacity ?? 0.4}
                                        onChange={(e) => updateBranding({ opacity: parseFloat(e.target.value) })}
                                    />
                                </div>
                                <div className="settings-field">
                                    <label>Size: {localConfig.branding?.size ?? 48}px</label>
                                    <input
                                        type="range"
                                        min="24"
                                        max="96"
                                        step="4"
                                        value={localConfig.branding?.size ?? 48}
                                        onChange={(e) => updateBranding({ size: parseInt(e.target.value) })}
                                    />
                                </div>
                            </>
                        )}
                    </section>
                </div>

                <div className="theme-settings-footer">
                    <div className="footer-actions-left">
                        <button className="btn btn--secondary" onClick={handleDownload}>
                            ⬇️ Download Config
                        </button>
                        <button className="btn btn--secondary" onClick={() => fileInputRef.current?.click()}>
                            ⬆️ Upload Config
                        </button>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".json"
                            onChange={handleUpload}
                            style={{ display: 'none' }}
                        />
                    </div>
                    <div className="footer-actions-right">
                        <button className="btn btn--ghost" onClick={onClose}>
                            Cancel
                        </button>
                        <button className="btn btn--primary" onClick={handleSave}>
                            Save & Close
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
