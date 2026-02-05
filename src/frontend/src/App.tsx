import { useState, useEffect } from 'react';
import type { AppConfig } from './types';
import { loadConfig } from './services/configService';
import { ThemeInjector } from './components/ThemeInjector';
import { ChatContainer } from './components/ChatContainer';
import './index.css';

function App() {
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
        <ChatContainer config={config} />
      </div>
    </ThemeInjector>
  );
}

export default App;
