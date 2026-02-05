import React, { useState, useRef } from 'react';
import type { AppConfig, ConfigTheme, ConfigIdentity, ConfigCapabilities, ConfigN8n } from '../types';
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
