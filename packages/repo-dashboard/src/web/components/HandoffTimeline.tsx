import React, { useState } from 'react';

interface Handoff {
  id: string;
  fromTeam: string;
  toTeam: string;
  startDate: string;
  endDate: string;
  duration: number; // in hours
  status: 'completed' | 'in-progress' | 'blocked';
  blockers: string[];
}

interface HandoffTimelineMetrics {
  handoffs: Handoff[];
  averageDuration: number;
  efficiency: number; // 0-100
  timestamp: string;
}

interface HandoffTimelineProps {
  metrics: HandoffTimelineMetrics;
  onDrillDown?: () => void;
}

export const HandoffTimeline: React.FC<HandoffTimelineProps> = ({ metrics, onDrillDown }) => {
  const [expanded, setExpanded] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'var(--severity-info)';
      case 'in-progress':
        return 'var(--type-service)';
      case 'blocked':
        return 'var(--severity-critical)';
      default:
        return 'var(--text-tertiary)';
    }
  };

  const getEfficiencyColor = (efficiency: number) => {
    if (efficiency >= 80) return 'var(--severity-info)';
    if (efficiency >= 60) return 'var(--severity-medium)';
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
        <h3 style={{ margin: 0, color: 'var(--text-primary)' }}>Handoff Timeline</h3>
        <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
          {metrics.handoffs.length} handoffs
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
        <div>
          <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
            Average Duration
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>
            {metrics.averageDuration.toFixed(1)}h
          </div>
        </div>
        <div>
          <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
            Efficiency
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ flex: 1, height: '8px', backgroundColor: 'var(--border-color)', borderRadius: '4px', overflow: 'hidden' }}>
              <div
                style={{
                  height: '100%',
                  width: `${metrics.efficiency}%`,
                  backgroundColor: getEfficiencyColor(metrics.efficiency),
                }}
              />
            </div>
            <span style={{ fontSize: '0.875rem', fontWeight: 'bold', color: getEfficiencyColor(metrics.efficiency), minWidth: '40px' }}>
              {metrics.efficiency}%
            </span>
          </div>
        </div>
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', fontWeight: 'bold' }}>
          Recent Handoffs
        </div>
        {metrics.handoffs.slice(0, 3).map((handoff) => (
          <div key={handoff.id} style={{ marginBottom: '0.75rem', padding: '0.75rem', backgroundColor: 'var(--border-color)', borderRadius: '4px', fontSize: '0.875rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
              <span style={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>
                {handoff.fromTeam} → {handoff.toTeam}
              </span>
              <span style={{ color: getStatusColor(handoff.status), fontWeight: 'bold' }}>
                {handoff.status.toUpperCase()}
              </span>
            </div>
            <div style={{ color: 'var(--text-secondary)' }}>
              {handoff.startDate} • {handoff.duration}h
            </div>
          </div>
        ))}
      </div>

      {expanded && (
        <div style={{ paddingTop: '1rem', borderTop: '1px solid var(--border-color)', marginTop: '1rem' }}>
          <div style={{ marginBottom: '1rem' }}>
            <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-primary)', fontSize: '0.95rem' }}>
              All Handoffs
            </h4>
            {metrics.handoffs.map((handoff) => (
              <div key={handoff.id} style={{ marginBottom: '0.75rem', padding: '0.75rem', backgroundColor: 'var(--border-color)', borderRadius: '4px', fontSize: '0.875rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                  <span style={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>
                    {handoff.fromTeam} → {handoff.toTeam}
                  </span>
                  <span style={{ color: getStatusColor(handoff.status), fontWeight: 'bold' }}>
                    {handoff.status.toUpperCase()}
                  </span>
                </div>
                <div style={{ color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                  {handoff.startDate} to {handoff.endDate} • {handoff.duration}h
                </div>
                {handoff.blockers.length > 0 && (
                  <div style={{ color: '#f44336', fontSize: '0.75rem' }}>
                    Blockers: {handoff.blockers.join(', ')}
                  </div>
                )}
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

export default HandoffTimeline;

