import React, { useState, useEffect } from 'react';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { HealthScore } from '../components/HealthScore';
import { MetricsChart } from '../components/MetricsChart';

interface ComponentDetailsProps {
  componentId?: string;
  component?: any;
  onNavigate?: (page: string, data?: any) => void;
}

export const ComponentDetails: React.FC<ComponentDetailsProps> = ({
  componentId,
  component: initialComponent,
  onNavigate,
}) => {
  const [loading, setLoading] = useState(!initialComponent);
  const [component, setComponent] = useState(initialComponent);
  const [metrics, setMetrics] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialComponent) {
      setComponent(initialComponent);
    } else if (componentId) {
      fetchComponent();
    }
  }, [componentId, initialComponent]);

  useEffect(() => {
    if (component?.id) {
      fetchMetrics();
    }
  }, [component?.id]);

  const fetchComponent = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/components/${componentId}`);
      if (!response.ok) throw new Error('Failed to fetch component');
      const data = await response.json();
      setComponent(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const fetchMetrics = async () => {
    try {
      const response = await fetch(`/api/components/${component.id}/metrics`);
      if (!response.ok) throw new Error('Failed to fetch metrics');
      const data = await response.json();
      setMetrics(data);
    } catch (err) {
      console.error('Error fetching metrics:', err);
    }
  };

  if (loading) return <LoadingSpinner message="Loading component details..." />;

  if (error) {
    return (
      <div className="error">
        <h2>Error</h2>
        <p>{error}</p>
        <button onClick={fetchComponent} className="btn btn-primary">
          Retry
        </button>
      </div>
    );
  }

  if (!component) {
    return (
      <div className="error">
        <h2>Component Not Found</h2>
        <p>The requested component could not be found.</p>
      </div>
    );
  }

  const typeColors: Record<string, string> = {
    service: '#2196f3',
    library: '#4caf50',
    ui: '#ff9800',
    database: '#f44336',
  };

  return (
    <div>
      <button
        onClick={() => onNavigate?.('architecture')}
        className="btn btn-secondary"
        style={{ marginBottom: '1rem' }}
      >
        ← Back to Architecture
      </button>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
            {component.name}
          </h1>
          <span
            style={{
              display: 'inline-block',
              backgroundColor: typeColors[component.type],
              color: 'white',
              padding: '0.5rem 1rem',
              borderRadius: '4px',
              fontWeight: 500,
            }}
          >
            {component.type}
          </span>
        </div>
        {component.metrics?.healthScore !== undefined && (
          <HealthScore score={component.metrics.healthScore * 100} size="large" />
        )}
      </div>

      {component.description && (
        <div className="card" style={{ marginBottom: '2rem' }}>
          <div className="card-header">Description</div>
          <div className="card-body" style={{ color: 'var(--text-secondary)' }}>
            {component.description}
          </div>
        </div>
      )}

      {/* Repositories */}
      {component.repositories && component.repositories.length > 0 && (
        <div className="card" style={{ marginBottom: '2rem' }}>
          <div className="card-header">Repositories</div>
          <div className="card-body">
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {component.repositories.map((repo: string) => (
                <li key={repo} style={{ padding: '0.5rem 0', color: 'var(--text-primary)' }}>
                  📦 {repo}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Packages */}
      {component.packages && component.packages.length > 0 && (
        <div className="card" style={{ marginBottom: '2rem' }}>
          <div className="card-header">Packages</div>
          <table className="table">
            <thead>
              <tr>
                <th>Package Name</th>
                <th>Version</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {component.packages.map((pkg: any) => (
                <tr key={pkg.name}>
                  <td style={{ fontFamily: 'monospace' }}>{pkg.name}</td>
                  <td>{pkg.version}</td>
                  <td>
                    <span className={`badge badge-${pkg.status === 'stable' ? 'success' : pkg.status === 'beta' ? 'warning' : 'info'}`}>
                      {pkg.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Dependencies */}
      {component.dependencies && component.dependencies.length > 0 && (
        <div className="card" style={{ marginBottom: '2rem' }}>
          <div className="card-header">Dependencies</div>
          <div className="card-body">
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {component.dependencies.map((dep: string) => (
                <li key={dep} style={{ padding: '0.5rem 0', color: 'var(--text-primary)' }}>
                  → {dep}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Metrics */}
      {metrics && (
        <div className="card">
          <div className="card-header">Metrics</div>
          <div className="card-body">
            <div className="grid grid-2">
              <div>
                <h4 style={{ color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                  Test Coverage
                </h4>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--info-color)' }}>
                  {(metrics.testCoverage * 100).toFixed(1)}%
                </div>
              </div>
              <div>
                <h4 style={{ color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                  Build Status
                </h4>
                <span className={`badge badge-${metrics.buildStatus === 'success' ? 'success' : 'danger'}`}>
                  {metrics.buildStatus}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ComponentDetails;

