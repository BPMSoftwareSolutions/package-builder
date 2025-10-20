import React, { useState } from 'react';

interface Dependency {
  name: string;
  currentVersion: string;
  latestVersion: string;
  status: 'up-to-date' | 'outdated' | 'critical';
  vulnerabilities: number;
}

interface DependencyHealthMetrics {
  dependencies: Dependency[];
  healthScore: number; // 0-100
  outdatedCount: number;
  vulnerabilityCount: number;
  timestamp: string;
}

interface DependencyHealthChartProps {
  metrics: DependencyHealthMetrics;
  onDrillDown?: () => void;
}

export const DependencyHealthChart: React.FC<DependencyHealthChartProps> = ({ metrics, onDrillDown }) => {
  const [expanded, setExpanded] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'up-to-date':
        return 'var(--severity-info)';
      case 'outdated':
        return 'var(--severity-medium)';
      case 'critical':
        return 'var(--severity-critical)';
      default:
        return 'var(--text-tertiary)';
    }
  };

  const getHealthColor = (score: number) => {
    if (score >= 80) return 'var(--severity-info)';
    if (score >= 60) return 'var(--severity-medium)';
    return 'var(--severity-critical)';
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
        <h3 style={{ margin: 0, color: 'var(--text-primary)' }}>Dependency Health</h3>
        <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
          {metrics.dependencies.length} dependencies
        </div>
      </div>

      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
          Health Score
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ flex: 1, height: '12px', backgroundColor: 'var(--border-color)', borderRadius: '6px', overflow: 'hidden' }}>
            <div
              style={{
                height: '100%',
                width: `${metrics.healthScore}%`,
                backgroundColor: getHealthColor(metrics.healthScore),
              }}
            />
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: getHealthColor(metrics.healthScore), minWidth: '50px' }}>
            {metrics.healthScore}%
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
        <div>
          <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
            Outdated
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--severity-medium)' }}>
            {metrics.outdatedCount}
          </div>
        </div>
        <div>
          <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
            Vulnerabilities
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: metrics.vulnerabilityCount > 0 ? 'var(--severity-critical)' : 'var(--severity-info)' }}>
            {metrics.vulnerabilityCount}
          </div>
        </div>
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', fontWeight: 'bold' }}>
          Top Dependencies
        </div>
        {metrics.dependencies.slice(0, 3).map((dep, idx) => (
          <div key={idx} style={{ marginBottom: '0.5rem', padding: '0.75rem', backgroundColor: 'var(--border-color)', borderRadius: '4px', fontSize: '0.875rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
              <span style={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>
                {dep.name}
              </span>
              <span style={{ color: getStatusColor(dep.status), fontWeight: 'bold' }}>
                {dep.status.toUpperCase()}
              </span>
            </div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
              {dep.currentVersion} → {dep.latestVersion}
              {dep.vulnerabilities > 0 && ` • ${dep.vulnerabilities} vulnerabilities`}
            </div>
          </div>
        ))}
      </div>

      {expanded && (
        <div style={{ paddingTop: '1rem', borderTop: '1px solid var(--border-color)', marginTop: '1rem' }}>
          <div style={{ marginBottom: '1rem' }}>
            <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-primary)', fontSize: '0.95rem' }}>
              All Dependencies
            </h4>
            {metrics.dependencies.map((dep, idx) => (
              <div key={idx} style={{ marginBottom: '0.5rem', padding: '0.75rem', backgroundColor: 'var(--border-color)', borderRadius: '4px', fontSize: '0.875rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                  <span style={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>
                    {dep.name}
                  </span>
                  <span style={{ color: getStatusColor(dep.status), fontWeight: 'bold' }}>
                    {dep.status.toUpperCase()}
                  </span>
                </div>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
                  {dep.currentVersion} → {dep.latestVersion}
                  {dep.vulnerabilities > 0 && ` • ${dep.vulnerabilities} vulnerabilities`}
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

export default DependencyHealthChart;

