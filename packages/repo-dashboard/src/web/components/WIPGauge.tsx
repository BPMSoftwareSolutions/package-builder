import React, { useState } from 'react';

interface WIPMetrics {
  currentWIP: number;
  wipLimit: number;
  team: string;
  status: 'healthy' | 'warning' | 'critical';
  percentageOfLimit: number;
  timestamp: string;
}

interface WIPGaugeProps {
  metrics: WIPMetrics;
  onViewPRs?: () => void;
  onAdjustLimit?: () => void;
}

export const WIPGauge: React.FC<WIPGaugeProps> = ({ metrics, onViewPRs, onAdjustLimit }) => {
  const [expanded, setExpanded] = useState(false);

  const getStatusColor = (status: string) => {
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

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'healthy':
        return '✓ Healthy';
      case 'warning':
        return '⚠ Warning';
      case 'critical':
        return '✕ Critical';
      default:
        return 'Unknown';
    }
  };

  const statusColor = getStatusColor(metrics.status);

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
        <h3 style={{ margin: 0, color: 'var(--text-primary)' }}>Work in Progress</h3>
        <div style={{ fontSize: '0.875rem', fontWeight: 'bold', color: statusColor }}>
          {getStatusLabel(metrics.status)}
        </div>
      </div>

      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
          Team: {metrics.team}
        </div>
      </div>

      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
          <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Current WIP</span>
          <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>
            {metrics.currentWIP} / {metrics.wipLimit}
          </span>
        </div>
        <div style={{ height: '24px', backgroundColor: 'var(--bg-secondary)', borderRadius: '12px', overflow: 'hidden' }}>
          <div
            style={{
              height: '100%',
              width: `${Math.min(metrics.percentageOfLimit, 100)}%`,
              backgroundColor: statusColor,
              transition: 'width 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '0.75rem',
              fontWeight: 'bold',
            }}
          >
            {metrics.percentageOfLimit > 10 && `${metrics.percentageOfLimit.toFixed(0)}%`}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
        <div style={{ padding: '0.75rem', backgroundColor: 'var(--bg-secondary)', borderRadius: '4px', textAlign: 'center' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
            Current WIP
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>
            {metrics.currentWIP}
          </div>
        </div>
        <div style={{ padding: '0.75rem', backgroundColor: 'var(--bg-secondary)', borderRadius: '4px', textAlign: 'center' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
            WIP Limit
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>
            {metrics.wipLimit}
          </div>
        </div>
      </div>

      {expanded && (
        <div style={{ paddingTop: '1rem', borderTop: '1px solid var(--border-color)', marginTop: '1rem' }}>
          <div style={{ marginBottom: '1rem' }}>
            <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-primary)', fontSize: '0.95rem' }}>
              Status Details
            </h4>
            <div style={{ padding: '0.75rem', backgroundColor: 'var(--bg-secondary)', borderRadius: '4px', fontSize: '0.875rem' }}>
              <div style={{ marginBottom: '0.5rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Percentage of Limit:</span>
                <span style={{ float: 'right', fontWeight: 'bold', color: statusColor }}>
                  {metrics.percentageOfLimit.toFixed(1)}%
                </span>
              </div>
              <div>
                <span style={{ color: 'var(--text-secondary)' }}>Status:</span>
                <span style={{ float: 'right', fontWeight: 'bold', color: statusColor }}>
                  {getStatusLabel(metrics.status)}
                </span>
              </div>
            </div>
          </div>

          {metrics.status === 'critical' && (
            <div style={{ marginBottom: '1rem', padding: '0.75rem', backgroundColor: 'rgba(244, 67, 54, 0.1)', borderRadius: '4px', borderLeft: '4px solid var(--severity-critical)' }}>
              <div style={{ fontSize: '0.875rem', fontWeight: 'bold', color: 'var(--severity-critical)', marginBottom: '0.25rem' }}>
                ⚠ Critical Alert
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--severity-critical)' }}>
                WIP exceeds limit. Consider pausing new work or increasing team capacity.
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {onViewPRs && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onViewPRs();
                }}
                style={{
                  flex: 1,
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
                View PRs
              </button>
            )}
            {onAdjustLimit && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onAdjustLimit();
                }}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  backgroundColor: 'var(--secondary-color)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: 'bold',
                }}
              >
                Adjust Limit
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default WIPGauge;

