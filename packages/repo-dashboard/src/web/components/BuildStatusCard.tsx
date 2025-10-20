import React, { useState, useEffect } from 'react';

interface BuildStatus {
  status: 'passing' | 'failing' | 'flaky';
  lastBuildTime: number;
  successRate: number;
  flakinessPercentage: number;
  recentBuilds: Array<{ status: 'success' | 'failure'; duration: number; timestamp: Date }>;
  failureReasons: string[];
}

interface BuildStatusCardProps {
  org: string;
  repo: string;
  onStatusChange?: (status: BuildStatus) => void;
}

export const BuildStatusCard: React.FC<BuildStatusCardProps> = ({ org, repo, onStatusChange }) => {
  const [buildStatus, setBuildStatus] = useState<BuildStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBuildStatus = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/metrics/build-status/${org}/${repo}`);
        if (!response.ok) throw new Error('Failed to fetch build status');
        const data = await response.json();
        setBuildStatus(data.buildStatus || data);
        onStatusChange?.(data.buildStatus || data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        setBuildStatus(null);
      } finally {
        setLoading(false);
      }
    };

    fetchBuildStatus();
    const interval = setInterval(fetchBuildStatus, 60000); // Refresh every 60 seconds
    return () => clearInterval(interval);
  }, [org, repo, onStatusChange]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'passing': return 'var(--severity-info)';
      case 'failing': return 'var(--severity-critical)';
      case 'flaky': return 'var(--severity-medium)';
      default: return 'var(--text-tertiary)';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'passing': return '✓';
      case 'failing': return '✗';
      case 'flaky': return '⚠';
      default: return '?';
    }
  };

  if (loading) {
    return <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading build status...</div>;
  }

  if (!buildStatus) {
    return <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-secondary)' }}>No build data available</div>;
  }

  return (
    <div style={{
      border: '1px solid var(--border-color)',
      borderRadius: '8px',
      padding: '1.5rem',
      backgroundColor: 'var(--card-background)',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
    }}>
      <h3 style={{ margin: '0 0 1rem 0', color: 'var(--text-primary)' }}>Build Status</h3>

      {error && (
        <div style={{
          padding: '1rem',
          backgroundColor: 'rgba(244, 67, 54, 0.1)',
          color: 'var(--severity-critical)',
          borderRadius: '4px',
          marginBottom: '1rem'
        }}>
          Error: {error}
        </div>
      )}

      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        marginBottom: '1.5rem',
        padding: '1rem',
        backgroundColor: 'var(--input-background)',
        borderRadius: '8px'
      }}>
        <div style={{
          fontSize: '2.5rem',
          color: getStatusColor(buildStatus.status),
          fontWeight: 'bold'
        }}>
          {getStatusIcon(buildStatus.status)}
        </div>
        <div>
          <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Current Status</div>
          <div style={{
            fontSize: '1.5rem',
            fontWeight: 'bold',
            color: getStatusColor(buildStatus.status),
            textTransform: 'capitalize'
          }}>
            {buildStatus.status}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
        <div style={{ padding: '1rem', backgroundColor: 'var(--input-background)', borderRadius: '4px' }}>
          <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
            Success Rate
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>
            {buildStatus.successRate.toFixed(1)}%
          </div>
        </div>
        <div style={{ padding: '1rem', backgroundColor: 'var(--input-background)', borderRadius: '4px' }}>
          <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
            Flakiness
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: buildStatus.flakinessPercentage > 10 ? 'var(--severity-medium)' : 'var(--severity-info)' }}>
            {buildStatus.flakinessPercentage.toFixed(1)}%
          </div>
        </div>
      </div>

      {buildStatus.failureReasons && buildStatus.failureReasons.length > 0 && (
        <div style={{ marginBottom: '1rem' }}>
          <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', fontWeight: 'bold' }}>
            Recent Failure Reasons
          </div>
          <ul style={{ margin: 0, paddingLeft: '1.5rem', color: 'var(--text-primary)' }}>
            {buildStatus.failureReasons.slice(0, 3).map((reason, idx) => (
              <li key={idx} style={{ fontSize: '0.875rem', marginBottom: '0.25rem' }}>{reason}</li>
            ))}
          </ul>
        </div>
      )}

      <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
        Last build: {buildStatus.lastBuildTime}ms
      </div>
    </div>
  );
};

