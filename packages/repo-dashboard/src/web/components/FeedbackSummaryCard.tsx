import React, { useState, useEffect } from 'react';

interface FeedbackSummary {
  healthScore: number;
  trend: 'improving' | 'stable' | 'degrading';
  alertCount: number;
  buildStatus: 'passing' | 'failing' | 'flaky';
  testCoverage: number;
  deploymentStatus: 'success' | 'failed' | 'in-progress';
  lastUpdated: Date;
}

interface FeedbackSummaryCardProps {
  org: string;
  team?: string;
  onHealthChange?: (health: number) => void;
}

export const FeedbackSummaryCard: React.FC<FeedbackSummaryCardProps> = ({ org, team, onHealthChange }) => {
  const [summary, setSummary] = useState<FeedbackSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        setLoading(true);
        const endpoint = team ? `/api/metrics/feedback-summary/${org}?team=${team}` : `/api/metrics/feedback-summary/${org}`;
        const response = await fetch(endpoint);
        if (!response.ok) throw new Error('Failed to fetch feedback summary');
        const data = await response.json();
        setSummary(data.summary || data);
        onHealthChange?.(data.summary?.healthScore || data.healthScore);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        setSummary(null);
      } finally {
        setLoading(false);
      }
    };

    fetchSummary();
    const interval = setInterval(fetchSummary, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [org, team, onHealthChange]);

  const getHealthColor = (score: number) => {
    if (score >= 80) return 'var(--severity-info)';
    if (score >= 60) return 'var(--severity-medium)';
    return 'var(--severity-critical)';
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving': return '↑';
      case 'degrading': return '↓';
      default: return '→';
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'improving': return 'var(--severity-info)';
      case 'degrading': return 'var(--severity-critical)';
      default: return 'var(--severity-medium)';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'passing':
      case 'success': return 'var(--severity-info)';
      case 'failing':
      case 'failed': return 'var(--severity-critical)';
      case 'flaky':
      case 'in-progress': return 'var(--severity-medium)';
      default: return 'var(--text-tertiary)';
    }
  };

  if (loading) {
    return <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading feedback summary...</div>;
  }

  if (!summary) {
    return <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-secondary)' }}>No feedback data available</div>;
  }

  return (
    <div style={{
      border: '1px solid var(--border-color)',
      borderRadius: '8px',
      padding: '1.5rem',
      backgroundColor: 'var(--card-background)',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
    }}>
      <h3 style={{ margin: '0 0 1rem 0', color: 'var(--text-primary)' }}>Feedback Summary</h3>

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
        justifyContent: 'space-between',
        marginBottom: '1.5rem',
        padding: '1rem',
        backgroundColor: 'var(--input-background)',
        borderRadius: '8px'
      }}>
        <div>
          <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
            Health Score
          </div>
          <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: getHealthColor(summary.healthScore) }}>
            {summary.healthScore.toFixed(0)}
          </div>
        </div>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <div style={{
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            backgroundColor: getHealthColor(summary.healthScore),
            opacity: 0.2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <span style={{
              fontSize: '1.5rem',
              color: getTrendColor(summary.trend),
              fontWeight: 'bold'
            }}>
              {getTrendIcon(summary.trend)}
            </span>
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'capitalize' }}>
            {summary.trend}
          </span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
        <div style={{ padding: '1rem', backgroundColor: 'var(--input-background)', borderRadius: '4px' }}>
          <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
            Active Alerts
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: summary.alertCount > 0 ? 'var(--severity-critical)' : 'var(--severity-info)' }}>
            {summary.alertCount}
          </div>
        </div>
        <div style={{ padding: '1rem', backgroundColor: 'var(--input-background)', borderRadius: '4px' }}>
          <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
            Test Coverage
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: getHealthColor(summary.testCoverage) }}>
            {summary.testCoverage.toFixed(1)}%
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div style={{ padding: '1rem', backgroundColor: 'var(--input-background)', borderRadius: '4px' }}>
          <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
            Build Status
          </div>
          <div style={{
            fontSize: '1rem',
            fontWeight: 'bold',
            color: getStatusColor(summary.buildStatus),
            textTransform: 'capitalize'
          }}>
            {summary.buildStatus}
          </div>
        </div>
        <div style={{ padding: '1rem', backgroundColor: 'var(--input-background)', borderRadius: '4px' }}>
          <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
            Deployment Status
          </div>
          <div style={{
            fontSize: '1rem',
            fontWeight: 'bold',
            color: getStatusColor(summary.deploymentStatus),
            textTransform: 'capitalize'
          }}>
            {summary.deploymentStatus}
          </div>
        </div>
      </div>

      <div style={{ marginTop: '1rem', fontSize: '0.75rem', color: 'var(--text-secondary)', textAlign: 'right' }}>
        Last updated: {new Date(summary.lastUpdated).toLocaleTimeString()}
      </div>
    </div>
  );
};

