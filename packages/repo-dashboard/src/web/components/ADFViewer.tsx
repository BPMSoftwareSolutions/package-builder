import React, { useState, useEffect } from 'react';
import { HealthScore } from './HealthScore';
import { LoadingSpinner } from './LoadingSpinner';

interface Container {
  id: string;
  name: string;
  type: 'service' | 'library' | 'ui' | 'database';
  description?: string;
  metrics?: {
    healthScore?: number;
    testCoverage?: number;
    buildStatus?: string;
  };
}

interface Relationship {
  from: string;
  to: string;
  type: string;
  description?: string;
}

interface ADFViewerProps {
  org: string;
  repo: string;
  branch?: string;
  path?: string;
}

export const ADFViewer: React.FC<ADFViewerProps> = ({
  org,
  repo,
  branch = 'main',
  path = 'adf.json',
}) => {
  const [adf, setAdf] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedContainer, setExpandedContainer] = useState<string | null>(null);

  useEffect(() => {
    const fetchADF = async () => {
      try {
        setLoading(true);
        setError(null);

        const url = `/api/adf/${org}/${repo}?branch=${branch}&path=${path}`;
        const response = await fetch(url);

        if (!response.ok) {
          throw new Error(`Failed to fetch ADF: ${response.statusText}`);
        }

        const data = await response.json();
        setAdf(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch ADF');
      } finally {
        setLoading(false);
      }
    };

    fetchADF();
  }, [org, repo, branch, path]);

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <div style={{
        backgroundColor: 'rgba(244, 67, 54, 0.1)',
        color: 'var(--severity-critical)',
        padding: '1rem',
        borderRadius: '4px',
        border: `1px solid var(--severity-critical)`
      }}>
        <strong>Error:</strong> {error}
      </div>
    );
  }

  if (!adf) {
    return <div>No ADF data available</div>;
  }

  const containers: Container[] = adf.c4Model?.containers || [];
  const relationships: Relationship[] = adf.c4Model?.relationships || [];

  const typeColors: Record<string, string> = {
    service: 'var(--type-service)',
    library: 'var(--type-library)',
    ui: 'var(--type-ui)',
    database: 'var(--type-database)',
  };

  return (
    <div style={{ padding: '1.5rem' }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
          {adf.name}
        </h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
          {adf.description}
        </p>
        <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
          <div>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Version</span>
            <p style={{ color: 'var(--text-primary)', fontFamily: 'monospace', fontWeight: 'bold' }}>
              {adf.version}
            </p>
          </div>
          {adf.metrics && (
            <>
              {adf.metrics.healthScore !== undefined && (
                <div>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Health Score</span>
                  <div style={{ marginTop: '0.5rem' }}>
                    <HealthScore score={adf.metrics.healthScore * 100} size="medium" />
                  </div>
                </div>
              )}
              {adf.metrics.testCoverage !== undefined && (
                <div>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Test Coverage</span>
                  <p style={{ color: 'var(--text-primary)', fontWeight: 'bold' }}>
                    {(adf.metrics.testCoverage * 100).toFixed(1)}%
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Containers */}
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ color: 'var(--text-primary)', marginBottom: '1rem' }}>
          Containers ({containers.length})
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
          {containers.map((container) => (
            <div
              key={container.id}
              onClick={() => setExpandedContainer(expandedContainer === container.id ? null : container.id)}
              style={{
                backgroundColor: 'var(--bg-primary)',
                border: '1px solid var(--border-color)',
                borderRadius: '4px',
                padding: '1rem',
                cursor: 'pointer',
                transition: 'all 0.2s',
                boxShadow: expandedContainer === container.id ? 'var(--shadow-lg)' : 'var(--shadow-md)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.5rem' }}>
                <h3 style={{ color: 'var(--text-primary)', margin: 0 }}>
                  {container.name}
                </h3>
                <span
                  style={{
                    backgroundColor: typeColors[container.type] || 'var(--text-tertiary)',
                    color: 'white',
                    padding: '0.25rem 0.5rem',
                    borderRadius: '3px',
                    fontSize: '0.75rem',
                    fontWeight: 'bold',
                  }}
                >
                  {container.type}
                </span>
              </div>

              {container.description && (
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: '0.5rem 0' }}>
                  {container.description}
                </p>
              )}

              {expandedContainer === container.id && container.metrics && (
                <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
                  {container.metrics.healthScore !== undefined && (
                    <div style={{ marginBottom: '0.5rem' }}>
                      <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Health Score</span>
                      <p style={{ color: 'var(--text-primary)', fontWeight: 'bold', margin: '0.25rem 0' }}>
                        {(container.metrics.healthScore * 100).toFixed(1)}%
                      </p>
                    </div>
                  )}
                  {container.metrics.testCoverage !== undefined && (
                    <div style={{ marginBottom: '0.5rem' }}>
                      <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Test Coverage</span>
                      <p style={{ color: 'var(--text-primary)', fontWeight: 'bold', margin: '0.25rem 0' }}>
                        {(container.metrics.testCoverage * 100).toFixed(1)}%
                      </p>
                    </div>
                  )}
                  {container.metrics.buildStatus && (
                    <div>
                      <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Build Status</span>
                      <p style={{ color: 'var(--text-primary)', fontWeight: 'bold', margin: '0.25rem 0' }}>
                        {container.metrics.buildStatus}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Relationships */}
      {relationships.length > 0 && (
        <div>
          <h2 style={{ color: 'var(--text-primary)', marginBottom: '1rem' }}>
            Relationships ({relationships.length})
          </h2>
          <div style={{ display: 'grid', gap: '0.5rem' }}>
            {relationships.map((rel, idx) => (
              <div
                key={idx}
                style={{
                  backgroundColor: 'var(--bg-primary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '4px',
                  padding: '0.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                }}
              >
                <span style={{ color: 'var(--text-primary)', fontWeight: 'bold', minWidth: '150px' }}>
                  {rel.from}
                </span>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                  {rel.type}
                </span>
                <span style={{ color: 'var(--text-primary)', fontWeight: 'bold', minWidth: '150px' }}>
                  {rel.to}
                </span>
                {rel.description && (
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginLeft: 'auto' }}>
                    {rel.description}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ADFViewer;

