import * as React from "react";
import { useState, useEffect, useCallback } from "react";
import { createRoot } from "react-dom/client";

interface LogEntry {
  timestamp: string;
  level: 'info' | 'warn' | 'error';
  message: string;
  data?: any;
}

const TestPluginLoader: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);

  const addLog = useCallback((level: LogEntry['level'], message: string, data?: any) => {
    const entry: LogEntry = {
      timestamp: new Date().toLocaleTimeString(),
      level,
      message,
      data
    };
    setLogs(prev => [...prev.slice(-99), entry]); // Keep last 100 logs
  }, []);

  useEffect(() => {
    const initialize = async () => {
      try {
        addLog('info', 'Initializing test plugin loader...');
        addLog('info', 'Test harness infrastructure ready');
      } catch (error) {
        addLog('error', 'Initialization failed', error);
      }
    };

    initialize();
  }, [addLog]);

  const clearLogs = () => {
    setLogs([]);
    addLog('info', 'Logs cleared');
  };

  return (
    <div className="inspector-container">
      <div className="inspector-header">
        <h1 className="inspector-title">RenderX Plugin Loading Test</h1>
        <p className="inspector-subtitle">
          Test Harness - Plugin-served, data-driven E2E testing
        </p>
      </div>

      <div className="inspector-content">
        {/* Toolbar */}
        <div className="toolbar">
          <h3 className="toolbar-title">Test Controls</h3>
          <button
            className="btn btn-primary"
            onClick={clearLogs}
            disabled={loading}
          >
            Clear Logs
          </button>
        </div>

        {/* Logs Panel */}
        <div className="panel">
          <div className="panel-header">
            <h3 className="panel-title">System Logs</h3>
          </div>
          <div className="panel-content">
            {logs.length > 0 ? (
              logs.map((log, index) => (
                <div key={index} style={{ marginBottom: '0.5rem', fontSize: '0.875rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>[{log.timestamp}]</span>{' '}
                  <span style={{ 
                    color: log.level === 'error' ? 'var(--danger-color)' : 
                           log.level === 'warn' ? 'var(--warning-color)' : 
                           'var(--success-color)'
                  }}>
                    {log.level.toUpperCase()}
                  </span>{' '}
                  {log.message}
                  {log.data && (
                    <div style={{ marginLeft: '1rem', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                      {typeof log.data === 'string' ? log.data : JSON.stringify(log.data)}
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="loading-message">No logs yet...</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const container = document.getElementById('test-root');
if (container) {
  const root = createRoot(container);
  root.render(<TestPluginLoader />);
} else {
  console.error('Container element not found');
}

