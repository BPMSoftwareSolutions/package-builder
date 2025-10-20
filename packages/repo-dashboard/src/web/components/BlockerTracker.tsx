import React, { useState } from 'react';

interface Blocker {
  id: string;
  title: string;
  status: 'open' | 'in-progress' | 'resolved';
  severity: 'low' | 'medium' | 'high' | 'critical';
  affectedTeams: string[];
  createdDate: string;
  resolutionTime?: number; // in hours
}

interface BlockerTrackerMetrics {
  blockers: Blocker[];
  openCount: number;
  averageResolutionTime: number;
  timestamp: string;
}

interface BlockerTrackerProps {
  metrics: BlockerTrackerMetrics;
  onDrillDown?: () => void;
}

export const BlockerTracker: React.FC<BlockerTrackerProps> = ({ metrics, onDrillDown }) => {
  const [expanded, setExpanded] = useState(false);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low':
        return 'var(--severity-info)';
      case 'medium':
        return 'var(--severity-medium)';
      case 'high':
        return 'var(--severity-critical)';
      case 'critical':
        return 'var(--severity-critical)';
      default:
        return 'var(--text-tertiary)';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'resolved':
        return 'var(--severity-info)';
      case 'in-progress':
        return 'var(--type-service)';
      case 'open':
        return 'var(--severity-critical)';
      default:
        return 'var(--text-tertiary)';
    }
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
        <h3 style={{ margin: 0, color: 'var(--text-primary)' }}>Blocker Tracker</h3>
        <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
          {metrics.openCount} open
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
        <div>
          <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
            Open Blockers
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 'bold', color: metrics.openCount > 0 ? 'var(--severity-critical)' : 'var(--severity-info)' }}>
            {metrics.openCount}
          </div>
        </div>
        <div>
          <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
            Avg Resolution Time
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>
            {metrics.averageResolutionTime.toFixed(1)}h
          </div>
        </div>
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', fontWeight: 'bold' }}>
          Recent Blockers
        </div>
        {metrics.blockers.slice(0, 3).map((blocker) => (
          <div key={blocker.id} style={{ marginBottom: '0.75rem', padding: '0.75rem', backgroundColor: 'var(--bg-secondary)', borderRadius: '4px', fontSize: '0.875rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
              <span style={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>
                {blocker.title}
              </span>
              <span style={{ color: getStatusColor(blocker.status), fontWeight: 'bold' }}>
                {blocker.status.toUpperCase()}
              </span>
            </div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
              <span style={{ color: getSeverityColor(blocker.severity) }}>
                {blocker.severity.toUpperCase()}
              </span>
              {' • '}
              {blocker.affectedTeams.join(', ')}
            </div>
          </div>
        ))}
      </div>

      {expanded && (
        <div style={{ paddingTop: '1rem', borderTop: '1px solid var(--border-color)', marginTop: '1rem' }}>
          <div style={{ marginBottom: '1rem' }}>
            <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-primary)', fontSize: '0.95rem' }}>
              All Blockers
            </h4>
            {metrics.blockers.map((blocker) => (
              <div key={blocker.id} style={{ marginBottom: '0.75rem', padding: '0.75rem', backgroundColor: 'var(--bg-secondary)', borderRadius: '4px', fontSize: '0.875rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                  <span style={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>
                    {blocker.title}
                  </span>
                  <span style={{ color: getStatusColor(blocker.status), fontWeight: 'bold' }}>
                    {blocker.status.toUpperCase()}
                  </span>
                </div>
                <div style={{ color: 'var(--text-secondary)', marginBottom: '0.25rem', fontSize: '0.75rem' }}>
                  <span style={{ color: getSeverityColor(blocker.severity) }}>
                    {blocker.severity.toUpperCase()}
                  </span>
                  {' • '}
                  {blocker.affectedTeams.join(', ')}
                </div>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
                  Created: {blocker.createdDate}
                  {blocker.resolutionTime && ` • Resolved in ${blocker.resolutionTime}h`}
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

export default BlockerTracker;

