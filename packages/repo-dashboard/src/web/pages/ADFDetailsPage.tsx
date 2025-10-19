import React, { useState, useEffect } from 'react';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { HealthScore } from '../components/HealthScore';
import { ArchitectureSelector } from '../components/ArchitectureSelector';

interface ADFDetailsPageProps {
  org?: string;
  repo?: string;
}

export const ADFDetailsPage: React.FC<ADFDetailsPageProps> = ({
  org: initialOrg = 'BPMSoftwareSolutions',
  repo: initialRepo,
}) => {
  const [org, setOrg] = useState(initialOrg);
  const [repo, setRepo] = useState(initialRepo || '');
  const [adf, setAdf] = useState<any>(null);
  const [loading, setLoading] = useState(!!initialRepo);
  const [error, setError] = useState<string | null>(null);
  const [expandedSection, setExpandedSection] = useState<string | null>('overview');

  useEffect(() => {
    if (repo) {
      fetchADF();
    }
  }, [org, repo]);

  const fetchADF = async () => {
    if (!repo) return;

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/adf/${org}/${repo}`);

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

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const SectionHeader: React.FC<{ title: string; id: string; count?: number }> = ({ title, id, count }) => (
    <div
      onClick={() => toggleSection(id)}
      style={{
        padding: '1rem',
        backgroundColor: 'var(--bg-secondary)',
        border: '1px solid var(--border-color)',
        borderRadius: '4px',
        cursor: 'pointer',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '0.5rem',
        transition: 'all 0.2s',
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.backgroundColor = 'var(--bg-primary)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.backgroundColor = 'var(--bg-secondary)';
      }}
    >
      <h3 style={{ margin: 0, color: 'var(--text-primary)' }}>
        {title} {count !== undefined && <span style={{ color: 'var(--text-secondary)' }}>({count})</span>}
      </h3>
      <span style={{ fontSize: '1.2rem' }}>
        {expandedSection === id ? '▼' : '▶'}
      </span>
    </div>
  );

  if (!repo) {
    return (
      <div style={{ padding: '2rem' }}>
        <h1 style={{ color: 'var(--text-primary)', marginBottom: '2rem' }}>
          Architecture Details
        </h1>
        <div style={{ maxWidth: '400px', marginBottom: '2rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-primary)', fontWeight: 'bold' }}>
            Select Architecture
          </label>
          <ArchitectureSelector
            org={org}
            selectedRepo={repo || undefined}
            onSelect={(selectedOrg, selectedRepo) => {
              setOrg(selectedOrg);
              setRepo(selectedRepo);
            }}
          />
        </div>
      </div>
    );
  }

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <div style={{ padding: '2rem' }}>
        <div style={{
          backgroundColor: '#ffebee',
          color: '#c62828',
          padding: '1rem',
          borderRadius: '4px',
          border: '1px solid #ef5350',
          marginBottom: '2rem'
        }}>
          <strong>Error:</strong> {error}
        </div>
        <button
          onClick={() => setRepo('')}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: 'var(--accent-color)',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          Select Different Architecture
        </button>
      </div>
    );
  }

  if (!adf) {
    return <div>No ADF data available</div>;
  }

  const containers = adf.c4Model?.containers || [];
  const relationships = adf.c4Model?.relationships || [];

  return (
    <div style={{ padding: '2rem' }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
          {adf.name}
        </h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
          {adf.description}
        </p>
        <button
          onClick={() => setRepo('')}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: 'var(--bg-secondary)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border-color)',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          Change Architecture
        </button>
      </div>

      {/* Overview Section */}
      <SectionHeader title="Overview" id="overview" />
      {expandedSection === 'overview' && (
        <div style={{ padding: '1rem', backgroundColor: 'var(--bg-primary)', marginBottom: '1rem', borderRadius: '4px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <div>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Version</span>
              <p style={{ color: 'var(--text-primary)', fontFamily: 'monospace', fontWeight: 'bold', margin: '0.5rem 0 0 0' }}>
                {adf.version}
              </p>
            </div>
            {adf.metrics?.healthScore !== undefined && (
              <div>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Health Score</span>
                <div style={{ marginTop: '0.5rem' }}>
                  <HealthScore score={adf.metrics.healthScore * 100} size="medium" />
                </div>
              </div>
            )}
            {adf.metrics?.testCoverage !== undefined && (
              <div>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Test Coverage</span>
                <p style={{ color: 'var(--text-primary)', fontWeight: 'bold', margin: '0.5rem 0 0 0' }}>
                  {(adf.metrics.testCoverage * 100).toFixed(1)}%
                </p>
              </div>
            )}
            {adf.metrics?.buildStatus && (
              <div>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Build Status</span>
                <p style={{ color: 'var(--text-primary)', fontWeight: 'bold', margin: '0.5rem 0 0 0' }}>
                  {adf.metrics.buildStatus}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Containers Section */}
      <SectionHeader title="Containers" id="containers" count={containers.length} />
      {expandedSection === 'containers' && (
        <div style={{ marginBottom: '1rem' }}>
          {containers.map((container: any, idx: number) => (
            <div
              key={idx}
              style={{
                padding: '1rem',
                backgroundColor: 'var(--bg-primary)',
                border: '1px solid var(--border-color)',
                borderRadius: '4px',
                marginBottom: '0.5rem',
              }}
            >
              <h4 style={{ color: 'var(--text-primary)', margin: '0 0 0.5rem 0' }}>
                {container.name}
              </h4>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: '0 0 0.5rem 0' }}>
                {container.description}
              </p>
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                <span style={{ backgroundColor: 'var(--bg-secondary)', padding: '0.25rem 0.5rem', borderRadius: '3px', fontSize: '0.85rem' }}>
                  Type: {container.type}
                </span>
                {container.metrics?.healthScore !== undefined && (
                  <span style={{ backgroundColor: 'var(--bg-secondary)', padding: '0.25rem 0.5rem', borderRadius: '3px', fontSize: '0.85rem' }}>
                    Health: {(container.metrics.healthScore * 100).toFixed(1)}%
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Relationships Section */}
      {relationships.length > 0 && (
        <>
          <SectionHeader title="Relationships" id="relationships" count={relationships.length} />
          {expandedSection === 'relationships' && (
            <div style={{ marginBottom: '1rem' }}>
              {relationships.map((rel: any, idx: number) => (
                <div
                  key={idx}
                  style={{
                    padding: '1rem',
                    backgroundColor: 'var(--bg-primary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '4px',
                    marginBottom: '0.5rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                    <span style={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>{rel.from}</span>
                    <span style={{ color: 'var(--text-secondary)' }}>→</span>
                    <span style={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>{rel.to}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                    <span style={{ backgroundColor: 'var(--bg-secondary)', padding: '0.25rem 0.5rem', borderRadius: '3px', fontSize: '0.85rem' }}>
                      Type: {rel.type}
                    </span>
                    {rel.description && (
                      <span style={{ backgroundColor: 'var(--bg-secondary)', padding: '0.25rem 0.5rem', borderRadius: '3px', fontSize: '0.85rem' }}>
                        {rel.description}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ADFDetailsPage;

