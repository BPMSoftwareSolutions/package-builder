import React, { useState } from 'react';

interface CommunicationChannel {
  id: string;
  name: string;
  teams: string[];
  messageCount: number;
  lastMessage: string;
  status: 'active' | 'inactive';
}

interface CrossTeamCommunicationMetrics {
  channels: CommunicationChannel[];
  activeTeams: number;
  blockers: Array<{ title: string; teams: string[] }>;
  timestamp: string;
}

interface CrossTeamCommunicationHubProps {
  metrics: CrossTeamCommunicationMetrics;
  onDrillDown?: () => void;
}

export const CrossTeamCommunicationHub: React.FC<CrossTeamCommunicationHubProps> = ({ metrics, onDrillDown }) => {
  const [expanded, setExpanded] = useState(false);

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
        <h3 style={{ margin: 0, color: 'var(--text-primary)' }}>Communication Hub</h3>
        <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
          {metrics.activeTeams} teams
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
        <div>
          <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
            Active Channels
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>
            {metrics.channels.filter(c => c.status === 'active').length}
          </div>
        </div>
        <div>
          <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
            Open Blockers
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 'bold', color: metrics.blockers.length > 0 ? 'var(--severity-critical)' : 'var(--severity-info)' }}>
            {metrics.blockers.length}
          </div>
        </div>
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', fontWeight: 'bold' }}>
          Communication Channels
        </div>
        {metrics.channels.slice(0, 3).map((channel) => (
          <div key={channel.id} style={{ marginBottom: '0.75rem', padding: '0.75rem', backgroundColor: 'var(--bg-secondary)', borderRadius: '4px', fontSize: '0.875rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
              <span style={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>
                {channel.name}
              </span>
              <span style={{ color: channel.status === 'active' ? 'var(--severity-info)' : 'var(--text-tertiary)', fontWeight: 'bold' }}>
                {channel.status.toUpperCase()}
              </span>
            </div>
            <div style={{ color: 'var(--text-secondary)' }}>
              {channel.teams.join(', ')} • {channel.messageCount} messages
            </div>
          </div>
        ))}
      </div>

      {expanded && (
        <div style={{ paddingTop: '1rem', borderTop: '1px solid var(--border-color)', marginTop: '1rem' }}>
          <div style={{ marginBottom: '1rem' }}>
            <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-primary)', fontSize: '0.95rem' }}>
              All Channels
            </h4>
            {metrics.channels.map((channel) => (
              <div key={channel.id} style={{ marginBottom: '0.75rem', padding: '0.75rem', backgroundColor: 'var(--bg-secondary)', borderRadius: '4px', fontSize: '0.875rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                  <span style={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>
                    {channel.name}
                  </span>
                  <span style={{ color: channel.status === 'active' ? 'var(--severity-info)' : 'var(--text-tertiary)', fontWeight: 'bold' }}>
                    {channel.status.toUpperCase()}
                  </span>
                </div>
                <div style={{ color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                  Teams: {channel.teams.join(', ')}
                </div>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
                  {channel.messageCount} messages • Last: {channel.lastMessage}
                </div>
              </div>
            ))}
          </div>

          {metrics.blockers.length > 0 && (
            <div style={{ marginBottom: '1rem' }}>
              <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-primary)', fontSize: '0.95rem' }}>
                Open Blockers
              </h4>
              {metrics.blockers.map((blocker, idx) => (
                <div key={idx} style={{ marginBottom: '0.5rem', padding: '0.75rem', backgroundColor: 'rgba(244, 67, 54, 0.1)', borderRadius: '4px', fontSize: '0.875rem' }}>
                  <div style={{ fontWeight: 'bold', color: 'var(--severity-critical)', marginBottom: '0.25rem' }}>
                    {blocker.title}
                  </div>
                  <div style={{ color: 'var(--text-secondary)' }}>
                    Affecting: {blocker.teams.join(', ')}
                  </div>
                </div>
              ))}
            </div>
          )}

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

export default CrossTeamCommunicationHub;

