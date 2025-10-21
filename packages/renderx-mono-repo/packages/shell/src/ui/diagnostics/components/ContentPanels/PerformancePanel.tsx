import React from 'react';
import type { LogEntry } from '../../types';

export interface PerformancePanelProps {
  conductor: any;
  performanceMetrics: Record<string, number>;
  interactionStatsLoaded: boolean;
  topicsStatsLoaded: boolean;
  logs: LogEntry[];
}

export const PerformancePanel: React.FC<PerformancePanelProps> = ({
  conductor,
  performanceMetrics,
  interactionStatsLoaded,
  topicsStatsLoaded,
  logs
}) => {
  const errorCount = logs.filter(l => l.level === 'error').length;
  const errorRate = logs.length > 0 ? Math.round((errorCount / logs.length) * 100) : 0;
  const manifestsLoaded = [interactionStatsLoaded, topicsStatsLoaded].filter(Boolean).length;

  return (
    <div className="panel">
      <div className="panel-header">
        <h3 className="panel-title">Performance Metrics</h3>
        <span className="panel-badge">{Object.keys(performanceMetrics).length}</span>
      </div>
      <div className="panel-content">
        <div className="plugin-item">
          <h4 className="plugin-name">System Health</h4>
          <div className="plugin-details">
            <div className="detail-row">
              <span className="detail-label">Conductor Status:</span>
              <span className="code" style={{ color: conductor ? 'var(--success-color)' : 'var(--danger-color)' }}>
                {conductor ? 'Connected' : 'Disconnected'}
              </span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Manifests Loaded:</span>
              <span className="code" style={{ color: 'var(--success-color)' }}>
                {manifestsLoaded}/2
              </span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Active Logs:</span>
              <span className="code">{logs.length}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Error Rate:</span>
              <span className="code" style={{
                color: errorCount > 0 ? 'var(--danger-color)' : 'var(--success-color)'
              }}>
                {errorRate}%
              </span>
            </div>
          </div>
        </div>

        {Object.keys(performanceMetrics).length > 0 && (
          <div className="plugin-item">
            <h4 className="plugin-name">Test Execution Times</h4>
            <div className="plugin-details">
              {Object.entries(performanceMetrics)
                .sort(([,a], [,b]) => b - a)
                .map(([key, duration]) => (
                  <div key={key} className="detail-row">
                    <span className="detail-label">{key.replace(/_/g, ' ')}:</span>
                    <span className="code"
                          style={{
                            color: duration > 1000 ? 'var(--danger-color)' :
                                   duration > 500 ? 'var(--warning-color)' :
                                   'var(--success-color)'
                          }}>
                      {duration}ms
                    </span>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

