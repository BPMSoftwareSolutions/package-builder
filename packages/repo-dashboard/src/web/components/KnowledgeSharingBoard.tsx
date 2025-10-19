import React, { useState } from 'react';

interface KnowledgeSession {
  id: string;
  title: string;
  date: string;
  participants: string[];
  topic: string;
  resourcesShared: number;
}

interface KnowledgeSharingMetrics {
  sessions: KnowledgeSession[];
  totalParticipants: number;
  upcomingSessions: number;
  timestamp: string;
}

interface KnowledgeSharingBoardProps {
  metrics: KnowledgeSharingMetrics;
  onDrillDown?: () => void;
}

export const KnowledgeSharingBoard: React.FC<KnowledgeSharingBoardProps> = ({ metrics, onDrillDown }) => {
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
        <h3 style={{ margin: 0, color: 'var(--text-primary)' }}>Knowledge Sharing</h3>
        <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
          {metrics.sessions.length} sessions
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
        <div>
          <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
            Total Participants
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>
            {metrics.totalParticipants}
          </div>
        </div>
        <div>
          <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
            Upcoming Sessions
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#4caf50' }}>
            {metrics.upcomingSessions}
          </div>
        </div>
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', fontWeight: 'bold' }}>
          Recent Sessions
        </div>
        {metrics.sessions.slice(0, 3).map((session) => (
          <div key={session.id} style={{ marginBottom: '0.75rem', padding: '0.75rem', backgroundColor: 'var(--border-color)', borderRadius: '4px' }}>
            <div style={{ fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '0.25rem', fontSize: '0.875rem' }}>
              {session.title}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
              {session.date} • {session.topic}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              {session.participants.length} participants • {session.resourcesShared} resources
            </div>
          </div>
        ))}
      </div>

      {expanded && (
        <div style={{ paddingTop: '1rem', borderTop: '1px solid var(--border-color)', marginTop: '1rem' }}>
          <div style={{ marginBottom: '1rem' }}>
            <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-primary)', fontSize: '0.95rem' }}>
              All Sessions
            </h4>
            {metrics.sessions.map((session) => (
              <div key={session.id} style={{ marginBottom: '0.75rem', padding: '0.75rem', backgroundColor: 'var(--border-color)', borderRadius: '4px', fontSize: '0.875rem' }}>
                <div style={{ fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                  {session.title}
                </div>
                <div style={{ color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                  {session.date} • {session.topic}
                </div>
                <div style={{ color: 'var(--text-secondary)' }}>
                  Participants: {session.participants.join(', ')}
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

export default KnowledgeSharingBoard;

