import React, { useState, useEffect } from 'react';

interface DeploymentStatus {
  status: 'in-progress' | 'success' | 'failed' | 'rolled-back';
  duration: number;
  successRate: number;
  deploymentFrequency: number;
  rollbackCount: number;
  lastDeployment: Date;
  deploymentHistory: Array<{
    status: 'success' | 'failed' | 'rolled-back';
    duration: number;
    timestamp: Date;
    environment: string;
  }>;
}

interface DeploymentStatusCardProps {
  org: string;
  repo: string;
  environment?: string;
  onStatusChange?: (status: DeploymentStatus) => void;
}

export const DeploymentStatusCard: React.FC<DeploymentStatusCardProps> = ({
  org,
  repo,
  environment,
  onStatusChange
}) => {
  const [deploymentStatus, setDeploymentStatus] = useState<DeploymentStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDeploymentStatus = async () => {
      try {
        setLoading(true);
        const url = environment
          ? `/api/metrics/deployment-status/${org}/${repo}?environment=${environment}`
          : `/api/metrics/deployment-status/${org}/${repo}`;
        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to fetch deployment status');
        const data = await response.json();
        setDeploymentStatus(data.deploymentStatus || data);
        onStatusChange?.(data.deploymentStatus || data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        setDeploymentStatus(null);
      } finally {
        setLoading(false);
      }
    };

    fetchDeploymentStatus();
    const interval = setInterval(fetchDeploymentStatus, 60000); // Refresh every 60 seconds
    return () => clearInterval(interval);
  }, [org, repo, environment, onStatusChange]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'var(--severity-info)';
      case 'failed': return 'var(--severity-critical)';
      case 'in-progress': return 'var(--type-service)';
      case 'rolled-back': return 'var(--severity-medium)';
      default: return 'var(--text-tertiary)';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return '✓';
      case 'failed': return '✗';
      case 'in-progress': return '⟳';
      case 'rolled-back': return '↶';
      default: return '?';
    }
  };

  if (loading) {
    return <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading deployment status...</div>;
  }

  if (!deploymentStatus) {
    return <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-secondary)' }}>No deployment data available</div>;
  }

  return (
    <div style={{
      border: '1px solid var(--border-color)',
      borderRadius: '8px',
      padding: '1.5rem',
      backgroundColor: 'var(--card-background)',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
    }}>
      <h3 style={{ margin: '0 0 1rem 0', color: 'var(--text-primary)' }}>Deployment Status</h3>

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
          color: getStatusColor(deploymentStatus.status),
          fontWeight: 'bold'
        }}>
          {getStatusIcon(deploymentStatus.status)}
        </div>
        <div>
          <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Current Status</div>
          <div style={{
            fontSize: '1.5rem',
            fontWeight: 'bold',
            color: getStatusColor(deploymentStatus.status),
            textTransform: 'capitalize'
          }}>
            {deploymentStatus.status.replace('-', ' ')}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
        <div style={{ padding: '1rem', backgroundColor: 'var(--input-background)', borderRadius: '4px' }}>
          <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
            Success Rate
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>
            {deploymentStatus.successRate.toFixed(1)}%
          </div>
        </div>
        <div style={{ padding: '1rem', backgroundColor: 'var(--input-background)', borderRadius: '4px' }}>
          <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
            Deployment Frequency
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>
            {deploymentStatus.deploymentFrequency.toFixed(1)}/day
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
        <div style={{ padding: '1rem', backgroundColor: 'var(--input-background)', borderRadius: '4px' }}>
          <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
            Duration
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>
            {(deploymentStatus.duration / 60).toFixed(1)}m
          </div>
        </div>
        <div style={{ padding: '1rem', backgroundColor: 'var(--input-background)', borderRadius: '4px' }}>
          <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
            Rollbacks
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: deploymentStatus.rollbackCount > 0 ? 'var(--severity-medium)' : 'var(--severity-info)' }}>
            {deploymentStatus.rollbackCount}
          </div>
        </div>
      </div>

      {deploymentStatus.deploymentHistory && deploymentStatus.deploymentHistory.length > 0 && (
        <div>
          <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', fontWeight: 'bold' }}>
            Recent Deployments
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {deploymentStatus.deploymentHistory.slice(0, 5).map((deployment, idx) => (
              <div key={idx} style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '0.5rem',
                backgroundColor: 'var(--input-background)',
                borderRadius: '4px',
                fontSize: '0.875rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{
                    display: 'inline-block',
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: getStatusColor(deployment.status)
                  }} />
                  <span style={{ color: 'var(--text-secondary)' }}>{deployment.environment}</span>
                </div>
                <span style={{ color: 'var(--text-secondary)' }}>
                  {new Date(deployment.timestamp).toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

