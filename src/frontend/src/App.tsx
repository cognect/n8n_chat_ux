import { useState, useEffect } from 'react';
import type { AppConfig } from './types';
import { loadConfig, updateConfig } from './services/configService';
import { ThemeInjector } from './components/ThemeInjector';
import { ChatContainer } from './components/ChatContainer';
import { ThemeSettings } from './components/ThemeSettings';
import './index.css';

function App() {
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    async function initApp() {
      try {
        const loadedConfig = await loadConfig();
        setConfig(loadedConfig);
      } catch (err) {
        setError('Failed to load configuration');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    initApp();
  }, []);

  const handleConfigSave = (newConfig: AppConfig) => {
    setConfig(newConfig);
    updateConfig(newConfig);
  };

  if (loading) {
    return (
      <div className="app-loading">
        <div className="loading-spinner" />
        <span>Loading...</span>
      </div>
    );
  }

  if (error || !config) {
    return (
      <div className="app-error">
        <span className="error-icon">⚠️</span>
        <h2>Configuration Error</h2>
        <p>{error || 'Failed to load application configuration'}</p>
      </div>
    );
  }

  return (
    <ThemeInjector theme={config.theme}>
      <div className="app">
        <button
          className="settings-toggle"
          onClick={() => setShowSettings(true)}
          aria-label="Open Settings"
        >
          ⚙️
        </button>
        <ChatContainer config={config} />
        {showSettings && (
          <ThemeSettings
            config={config}
            onSave={handleConfigSave}
            onClose={() => setShowSettings(false)}
          />
        )}
      </div>
    </ThemeInjector>
  );
}

export default App;

