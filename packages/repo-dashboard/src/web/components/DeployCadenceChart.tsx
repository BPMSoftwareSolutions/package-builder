import React, { useState } from 'react';

interface DeploymentData {
  date: string;
  deployments: number;
  successRate: number;
  rollbacks: number;
}

interface DeployCadenceMetrics {
  data: DeploymentData[];
  averageDeploysPerDay: number;
  averageSuccessRate: number;
  totalDeployments: number;
  totalRollbacks: number;
  trend: 'improving' | 'stable' | 'degrading';
  timestamp: string;
}

interface DeployCadenceChartProps {
  metrics: DeployCadenceMetrics;
  onDrillDown?: () => void;
}

export const DeployCadenceChart: React.FC<DeployCadenceChartProps> = ({ metrics, onDrillDown }) => {
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

  const maxDeployments = Math.max(...metrics.data.map(d => d.deployments), 1);

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
        <h3 style={{ margin: 0, color: 'var(--text-primary)' }}>Deploy Cadence</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '1.5rem', color: getTrendColor(metrics.trend), fontWeight: 'bold' }}>
            {getTrendIcon(metrics.trend)}
          </span>
          <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            {metrics.trend}
          </span>
        </div>
      </div>

      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', height: '60px', gap: '2px', alignItems: 'flex-end', backgroundColor: 'var(--bg-secondary)', padding: '0.5rem', borderRadius: '4px' }}>
          {metrics.data.map((data, idx) => (
            <div
              key={idx}
              style={{
                flex: 1,
                height: `${(data.deployments / maxDeployments) * 100}%`,
                backgroundColor: getTrendColor(metrics.trend),
                borderRadius: '2px',
                position: 'relative',
                minHeight: '4px',
              }}
              title={`${data.date}: ${data.deployments} deployments`}
            />
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
        <div style={{ padding: '0.75rem', backgroundColor: 'var(--bg-secondary)', borderRadius: '4px', textAlign: 'center' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
            Avg Deploys/Day
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>
            {metrics.averageDeploysPerDay.toFixed(1)}
          </div>
        </div>
        <div style={{ padding: '0.75rem', backgroundColor: 'var(--bg-secondary)', borderRadius: '4px', textAlign: 'center' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
            Success Rate
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 'bold', color: 'var(--severity-info)' }}>
            {metrics.averageSuccessRate.toFixed(1)}%
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
        <div style={{ padding: '0.75rem', backgroundColor: 'var(--bg-secondary)', borderRadius: '4px', textAlign: 'center' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
            Total Deployments
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>
            {metrics.totalDeployments}
          </div>
        </div>
        <div style={{ padding: '0.75rem', backgroundColor: 'var(--bg-secondary)', borderRadius: '4px', textAlign: 'center' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
            Rollbacks
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--severity-critical)' }}>
            {metrics.totalRollbacks}
          </div>
        </div>
      </div>

      {expanded && (
        <div style={{ paddingTop: '1rem', borderTop: '1px solid var(--border-color)', marginTop: '1rem' }}>
          <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-primary)', fontSize: '0.95rem' }}>
            Recent Deployments
          </h4>
          <div style={{ maxHeight: '150px', overflowY: 'auto' }}>
            {metrics.data.slice(-7).reverse().map((data, idx) => (
              <div
                key={idx}
                style={{
                  padding: '0.5rem',
                  marginBottom: '0.5rem',
                  backgroundColor: 'var(--bg-secondary)',
                  borderRadius: '4px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '0.875rem',
                }}
              >
                <span style={{ color: 'var(--text-secondary)' }}>{data.date}</span>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <span style={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>
                    {data.deployments} deploys
                  </span>
                  <span style={{ color: 'var(--severity-info)', fontWeight: 'bold' }}>
                    {data.successRate.toFixed(0)}%
                  </span>
                </div>
              </div>
            ))}
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
                marginTop: '1rem',
                backgroundColor: 'var(--primary-color)',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: 'bold',
              }}
            >
              View Detailed History
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default DeployCadenceChart;

