import React from 'react';
import type { LogEntry } from '../../types';

export interface FooterPanelProps {
  selectedNodePath: string | null;
  loadedPluginsCount: number;
  totalPluginsCount: number;
  routeCount: number;
  topicCount: number;
  logs: LogEntry[];
  onExport: () => void;
  onRefresh: () => void;
}

export const FooterPanel: React.FC<FooterPanelProps> = ({
  selectedNodePath,
  loadedPluginsCount,
  totalPluginsCount,
  routeCount,
  topicCount,
  logs,
  onExport,
  onRefresh
}) => {
  const errorCount = logs.filter(l => l.level === 'error').length;

  return (
    <footer className="footer-panel">
      <div className="footer-section">
        <strong>Selected:</strong> {selectedNodePath || 'None'}
      </div>
      <div className="footer-section footer-stats">
        <span className="footer-stat">
          <span className="footer-stat-label">Plugins:</span>
          <span className="footer-stat-value">{loadedPluginsCount}/{totalPluginsCount}</span>
        </span>
        <span className="footer-stat">
          <span className="footer-stat-label">Routes:</span>
          <span className="footer-stat-value">{routeCount}</span>
        </span>
        <span className="footer-stat">
          <span className="footer-stat-label">Topics:</span>
          <span className="footer-stat-value">{topicCount}</span>
        </span>
        <span className="footer-stat">
          <span className="footer-stat-label">Errors:</span>
          <span className="footer-stat-value" style={{
            color: errorCount > 0 ? 'var(--danger-color)' : 'var(--success-color)'
          }}>
            {errorCount}
          </span>
        </span>
      </div>
      <div className="footer-section footer-actions">
        <button
          className="btn btn-sm btn-secondary"
          onClick={onExport}
          title="Export diagnostics report"
        >
          📊 Export
        </button>
        <button
          className="btn btn-sm btn-secondary"
          onClick={onRefresh}
          title="Refresh statistics"
        >
          🔄 Refresh
        </button>
      </div>
    </footer>
  );
};

