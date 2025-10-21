import React from 'react';

export interface DiagnosticsToolbarProps {
  loading: boolean;
  onRefresh: () => void;
  onExport: () => void;
  onClearLogs: () => void;
}

export const DiagnosticsToolbar: React.FC<DiagnosticsToolbarProps> = ({
  loading,
  onRefresh,
  onExport,
  onClearLogs
}) => {
  return (
    <div className="toolbar">
      <div className="toolbar-section">
        <button
          className="btn btn-secondary btn-icon btn-sm"
          onClick={onRefresh}
          disabled={loading}
        >
          <span className="icon">🔄</span>
          Refresh Stats
        </button>
        <button
          className="btn btn-warning btn-icon btn-sm"
          onClick={onExport}
        >
          <span className="icon">📊</span>
          Export Logs
        </button>
        <button
          className="btn btn-danger btn-icon btn-sm"
          onClick={onClearLogs}
        >
          <span className="icon">🗑️</span>
          Clear Logs
        </button>
      </div>
    </div>
  );
};

