import React, { useState } from 'react';

interface TeamSatisfaction {
  team: string;
  score: number; // 0-100
  trend: 'improving' | 'stable' | 'degrading';
  feedback: string[];
}

interface TeamSatisfactionMetrics {
  teams: TeamSatisfaction[];
  overallScore: number;
  areasForImprovement: string[];
  actionItems: string[];
  timestamp: string;
}

interface TeamSatisfactionScoreProps {
  metrics: TeamSatisfactionMetrics;
  onDrillDown?: () => void;
}

export const TeamSatisfactionScore: React.FC<TeamSatisfactionScoreProps> = ({ metrics, onDrillDown }) => {
  const [expanded, setExpanded] = useState(false);

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'var(--severity-info)';
    if (score >= 60) return 'var(--severity-medium)';
    return 'var(--severity-critical)';
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving':
        return '↑';
      case 'degrading':
        return '↓';
      default:
        return '→';
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'improving':
        return 'var(--severity-info)';
      case 'degrading':
        return 'var(--severity-critical)';
      default:
        return 'var(--severity-medium)';
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
        <h3 style={{ margin: 0, color: 'var(--text-primary)' }}>Team Satisfaction</h3>
        <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
          {metrics.teams.length} teams
        </div>
      </div>

      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
          Overall Score
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ flex: 1, height: '12px', backgroundColor: 'var(--bg-secondary)', borderRadius: '6px', overflow: 'hidden' }}>
            <div
              style={{
                height: '100%',
                width: `${metrics.overallScore}%`,
                backgroundColor: getScoreColor(metrics.overallScore),
              }}
            />
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: getScoreColor(metrics.overallScore), minWidth: '50px' }}>
            {metrics.overallScore}
          </div>
        </div>
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', fontWeight: 'bold' }}>
          Team Scores
        </div>
        {metrics.teams.slice(0, 3).map((team, idx) => (
          <div key={idx} style={{ marginBottom: '0.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem', fontSize: '0.875rem' }}>
              <span style={{ color: 'var(--text-primary)' }}>{team.team}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <span style={{ color: getScoreColor(team.score), fontWeight: 'bold' }}>
                  {team.score}
                </span>
                <span style={{ color: getTrendColor(team.trend), fontWeight: 'bold' }}>
                  {getTrendIcon(team.trend)}
                </span>
              </div>
            </div>
            <div style={{ height: '6px', backgroundColor: 'var(--bg-secondary)', borderRadius: '3px', overflow: 'hidden' }}>
              <div
                style={{
                  height: '100%',
                  width: `${team.score}%`,
                  backgroundColor: getScoreColor(team.score),
                }}
              />
            </div>
          </div>
        ))}
      </div>

      {expanded && (
        <div style={{ paddingTop: '1rem', borderTop: '1px solid var(--border-color)', marginTop: '1rem' }}>
          <div style={{ marginBottom: '1rem' }}>
            <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-primary)', fontSize: '0.95rem' }}>
              All Teams
            </h4>
            {metrics.teams.map((team, idx) => (
              <div key={idx} style={{ marginBottom: '0.75rem', padding: '0.75rem', backgroundColor: 'var(--bg-secondary)', borderRadius: '4px', fontSize: '0.875rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                  <span style={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>
                    {team.team}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <span style={{ color: getScoreColor(team.score), fontWeight: 'bold' }}>
                      {team.score}
                    </span>
                    <span style={{ color: getTrendColor(team.trend), fontWeight: 'bold' }}>
                      {getTrendIcon(team.trend)}
                    </span>
                  </div>
                </div>
                {team.feedback.length > 0 && (
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
                    {team.feedback.join(' • ')}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-primary)', fontSize: '0.95rem' }}>
              Areas for Improvement
            </h4>
            <ul style={{ margin: 0, paddingLeft: '1.5rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
              {metrics.areasForImprovement.map((area, idx) => (
                <li key={idx} style={{ marginBottom: '0.5rem' }}>
                  {area}
                </li>
              ))}
            </ul>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-primary)', fontSize: '0.95rem' }}>
              Action Items
            </h4>
            <ul style={{ margin: 0, paddingLeft: '1.5rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
              {metrics.actionItems.map((item, idx) => (
                <li key={idx} style={{ marginBottom: '0.5rem' }}>
                  {item}
                </li>
              ))}
            </ul>
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

export default TeamSatisfactionScore;

