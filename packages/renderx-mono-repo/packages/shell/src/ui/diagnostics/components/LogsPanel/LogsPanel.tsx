import React from 'react';
import type { LogEntry } from '../../types';

export interface LogsPanelProps {
  logs: LogEntry[];
}

export const LogsPanel: React.FC<LogsPanelProps> = ({ logs }) => {
  return (
    <div className="logs-panel">
      <div className="panel-header">
        <h3 className="panel-title">System Logs</h3>
        <span className="panel-badge">{logs.length}</span>
      </div>
      <div className="logs-content">
        {logs.map((log, index) => (
          <div key={index} className="log-entry">
            <span className="log-timestamp">[{log.timestamp}]</span>{' '}
            <span className={`log-level-${log.level}`}>{log.level.toUpperCase()}</span>{' '}
            {log.message}
            {log.data && (
              <div style={{ marginLeft: '1rem', color: '#569cd6' }}>
                {typeof log.data === 'string' ? log.data : JSON.stringify(log.data)}
              </div>
            )}
          </div>
        ))}
        {logs.length === 0 && (
          <div style={{ color: 'var(--text-muted)' }}>No logs yet...</div>
        )}
      </div>
    </div>
  );
};

