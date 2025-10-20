import React, { useState } from 'react';

interface ConductorMetrics {
  throughput: number; // sequences/minute
  queueLength: number;
  averageExecutionTime: number; // milliseconds
  successRate: number;
  errorRate: number;
  trend: 'improving' | 'stable' | 'degrading';
  timestamp: string;
}

interface ConductorThroughputChartProps {
  metrics: ConductorMetrics;
  onDrillDown?: () => void;
}

export const ConductorThroughputChart: React.FC<ConductorThroughputChartProps> = ({ metrics, onDrillDown }) => {
  const [expanded, setExpanded] = useState(false);

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving':
        return '↑';
      case 'degrading':
        return '↓';
      default:
        return '→';
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'improving':
        return 'var(--trend-improving)';
      case 'degrading':
        return 'var(--trend-degrading)';
      default:
        return 'var(--trend-stable)';
    }
  };

  const getHealthStatus = () => {
    if (metrics.successRate >= 95 && metrics.queueLength < 100) return 'healthy';
    if (metrics.successRate >= 90 && metrics.queueLength < 200) return 'warning';
    return 'critical';
  };

  const getHealthColor = () => {
    const status = getHealthStatus();
    switch (status) {
      case 'healthy':
        return 'var(--severity-info)';
      case 'warning':
        return 'var(--severity-medium)';
      case 'critical':
        return 'var(--severity-critical)';
      default:
        return 'var(--type-service)';
    }
  };

  return (
    <div
      style={{
        border: '1px solid var(--border-color)',
        borderRadius: '8px',
        padding: '1.5rem',
        backgroundColor: 'var(--card-background)',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
      }}
      onClick={() => setExpanded(!expanded)}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h3 style={{ margin: 0, color: 'var(--text-primary)' }}>Conductor Throughput</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '1.5rem', color: getTrendColor(metrics.trend), fontWeight: 'bold' }}>
            {getTrendIcon(metrics.trend)}
          </span>
          <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            {metrics.trend}
          </span>
        </div>
      </div>

      <div style={{ marginBottom: '1.5rem', padding: '1rem', backgroundColor: getHealthColor(), borderRadius: '6px', color: 'white', textAlign: 'center' }}>
        <div style={{ fontSize: '0.875rem', marginBottom: '0.25rem', opacity: 0.9 }}>
          System Health
        </div>
        <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
          {getHealthStatus().toUpperCase()}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
        <div style={{ padding: '0.75rem', backgroundColor: 'var(--bg-secondary)', borderRadius: '4px', textAlign: 'center' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
            Throughput
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>
            {metrics.throughput.toFixed(1)}
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
            sequences/min
          </div>
        </div>
        <div style={{ padding: '0.75rem', backgroundColor: 'var(--bg-secondary)', borderRadius: '4px', textAlign: 'center' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
            Queue Length
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>
            {metrics.queueLength}
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
            pending
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
        <div style={{ padding: '0.75rem', backgroundColor: 'var(--bg-secondary)', borderRadius: '4px', textAlign: 'center' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
            Success Rate
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 'bold', color: 'var(--severity-info)' }}>
            {metrics.successRate.toFixed(1)}%
          </div>
        </div>
        <div style={{ padding: '0.75rem', backgroundColor: 'var(--bg-secondary)', borderRadius: '4px', textAlign: 'center' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
            Avg Execution
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>
            {metrics.averageExecutionTime.toFixed(0)}
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
            ms
          </div>
        </div>
      </div>

      {expanded && (
        <div style={{ paddingTop: '1rem', borderTop: '1px solid var(--border-color)', marginTop: '1rem' }}>
          <div style={{ marginBottom: '1rem' }}>
            <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-primary)', fontSize: '0.95rem' }}>
              Error Analysis
            </h4>
            <div style={{ padding: '0.75rem', backgroundColor: 'var(--bg-secondary)', borderRadius: '4px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Error Rate</span>
                <span style={{ fontWeight: 'bold', color: 'var(--severity-critical)', fontSize: '0.875rem' }}>
                  {metrics.errorRate.toFixed(2)}%
                </span>
              </div>
              <div style={{ height: '6px', backgroundColor: 'var(--bg-secondary)', borderRadius: '3px', overflow: 'hidden' }}>
                <div
                  style={{
                    height: '100%',
                    width: `${metrics.errorRate}%`,
                    backgroundColor: 'var(--severity-critical)',
                  }}
                />
              </div>
            </div>
          </div>

          {onDrillDown && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDrillDown();
              }}
              style={{
                width: '100%',
                padding: '0.75rem',
                backgroundColor: 'var(--primary-color)',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: 'bold',
              }}
            >
              View Detailed Metrics
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default ConductorThroughputChart;

