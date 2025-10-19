import React, { useState } from 'react';

interface GateResult {
  repository: string;
  status: 'passing' | 'failing';
  violations: number;
  timestamp: string;
}

interface SPAGateMetrics {
  results: GateResult[];
  passRate: number; // 0-100
  trend: 'improving' | 'stable' | 'degrading';
  recommendations: string[];
  timestamp: string;
}

interface SPAGateStatusProps {
  metrics: SPAGateMetrics;
  onDrillDown?: () => void;
}

export const SPAGateStatus: React.FC<SPAGateStatusProps> = ({ metrics, onDrillDown }) => {
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
        return '#4caf50';
      case 'degrading':
        return '#f44336';
      default:
        return '#ff9800';
    }
  };

  const getPassRateColor = (rate: number) => {
    if (rate >= 90) return '#4caf50';
    if (rate >= 70) return '#ff9800';
    return '#f44336';
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
        <h3 style={{ margin: 0, color: 'var(--text-primary)' }}>SPA Gate Status</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '1.5rem', color: getTrendColor(metrics.trend), fontWeight: 'bold' }}>
            {getTrendIcon(metrics.trend)}
          </span>
        </div>
      </div>

      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
          Pass Rate
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ flex: 1, height: '12px', backgroundColor: 'var(--border-color)', borderRadius: '6px', overflow: 'hidden' }}>
            <div
              style={{
                height: '100%',
                width: `${metrics.passRate}%`,
                backgroundColor: getPassRateColor(metrics.passRate),
              }}
            />
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: getPassRateColor(metrics.passRate), minWidth: '50px' }}>
            {metrics.passRate.toFixed(0)}%
          </div>
        </div>
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', fontWeight: 'bold' }}>
          Recent Results
        </div>
        {metrics.results.slice(0, 3).map((result, idx) => (
          <div key={idx} style={{ marginBottom: '0.5rem', padding: '0.75rem', backgroundColor: 'var(--border-color)', borderRadius: '4px', fontSize: '0.875rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
              <span style={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>
                {result.repository}
              </span>
              <span style={{ color: result.status === 'passing' ? '#4caf50' : '#f44336', fontWeight: 'bold' }}>
                {result.status.toUpperCase()}
              </span>
            </div>
            {result.violations > 0 && (
              <div style={{ color: '#f44336', fontSize: '0.75rem' }}>
                {result.violations} violations
              </div>
            )}
          </div>
        ))}
      </div>

      {expanded && (
        <div style={{ paddingTop: '1rem', borderTop: '1px solid var(--border-color)', marginTop: '1rem' }}>
          <div style={{ marginBottom: '1rem' }}>
            <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-primary)', fontSize: '0.95rem' }}>
              All Results
            </h4>
            {metrics.results.map((result, idx) => (
              <div key={idx} style={{ marginBottom: '0.5rem', padding: '0.75rem', backgroundColor: 'var(--border-color)', borderRadius: '4px', fontSize: '0.875rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                  <span style={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>
                    {result.repository}
                  </span>
                  <span style={{ color: result.status === 'passing' ? '#4caf50' : '#f44336', fontWeight: 'bold' }}>
                    {result.status.toUpperCase()}
                  </span>
                </div>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
                  {result.violations} violations • {result.timestamp}
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-primary)', fontSize: '0.95rem' }}>
              Recommendations
            </h4>
            <ul style={{ margin: 0, paddingLeft: '1.5rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
              {metrics.recommendations.map((rec, idx) => (
                <li key={idx} style={{ marginBottom: '0.5rem' }}>
                  {rec}
                </li>
              ))}
            </ul>
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

export default SPAGateStatus;

