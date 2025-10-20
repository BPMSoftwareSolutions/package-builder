import React, { useState } from 'react';

interface TrendPoint {
  date: string;
  value: number;
}

interface MetricsTrendMetrics {
  metricName: string;
  data: TrendPoint[];
  trend: 'improving' | 'stable' | 'degrading';
  correlation: number; // -1 to 1
  anomalies: number;
  timestamp: string;
}

interface MetricsTrendAnalysisProps {
  metrics: MetricsTrendMetrics;
  onDrillDown?: () => void;
}

export const MetricsTrendAnalysis: React.FC<MetricsTrendAnalysisProps> = ({ metrics, onDrillDown }) => {
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
        return 'var(--severity-info)';
      case 'degrading':
        return 'var(--severity-critical)';
      default:
        return 'var(--severity-medium)';
    }
  };

  const minValue = Math.min(...metrics.data.map(d => d.value));
  const maxValue = Math.max(...metrics.data.map(d => d.value));
  const range = maxValue - minValue || 1;

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
        <h3 style={{ margin: 0, color: 'var(--text-primary)' }}>{metrics.metricName} Trend</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '1.5rem', color: getTrendColor(metrics.trend), fontWeight: 'bold' }}>
            {getTrendIcon(metrics.trend)}
          </span>
        </div>
      </div>

      <div style={{ marginBottom: '1.5rem', height: '100px', position: 'relative', backgroundColor: 'var(--bg-secondary)', borderRadius: '4px', padding: '0.5rem' }}>
        <svg style={{ width: '100%', height: '100%' }} viewBox={`0 0 ${metrics.data.length * 20} 100`} preserveAspectRatio="none">
          <polyline
            points={metrics.data.map((d, i) => `${i * 20},${100 - ((d.value - minValue) / range) * 100}`).join(' ')}
            fill="none"
            stroke={getTrendColor(metrics.trend)}
            strokeWidth="2"
          />
        </svg>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
        <div>
          <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
            Current Value
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>
            {metrics.data[metrics.data.length - 1]?.value.toFixed(2) || 'N/A'}
          </div>
        </div>
        <div>
          <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
            Trend
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: getTrendColor(metrics.trend) }}>
            {metrics.trend.charAt(0).toUpperCase() + metrics.trend.slice(1)}
          </div>
        </div>
      </div>

      {expanded && (
        <div style={{ paddingTop: '1rem', borderTop: '1px solid var(--border-color)', marginTop: '1rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem', fontSize: '0.875rem' }}>
            <div>
              <div style={{ color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Correlation</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                {metrics.correlation.toFixed(2)}
              </div>
            </div>
            <div>
              <div style={{ color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Anomalies Detected</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: metrics.anomalies > 0 ? 'var(--severity-critical)' : 'var(--severity-info)' }}>
                {metrics.anomalies}
              </div>
            </div>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-primary)', fontSize: '0.95rem' }}>
              Historical Data
            </h4>
            <div style={{ maxHeight: '200px', overflowY: 'auto', fontSize: '0.875rem' }}>
              {metrics.data.map((point, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.25rem 0', color: 'var(--text-secondary)' }}>
                  <span>{point.date}</span>
                  <span style={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>{point.value.toFixed(2)}</span>
                </div>
              ))}
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
              View Details
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default MetricsTrendAnalysis;

