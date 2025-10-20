import React, { useState } from 'react';

interface Skill {
  name: string;
  level: 'beginner' | 'intermediate' | 'expert';
  people: number;
}

interface SkillGap {
  skill: string;
  gap: number; // 0-100
}

interface SkillInventoryMetrics {
  skills: Skill[];
  skillGaps: SkillGap[];
  trainingRecommendations: string[];
  timestamp: string;
}

interface SkillInventoryCardProps {
  metrics: SkillInventoryMetrics;
  onDrillDown?: () => void;
}

export const SkillInventoryCard: React.FC<SkillInventoryCardProps> = ({ metrics, onDrillDown }) => {
  const [expanded, setExpanded] = useState(false);

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'beginner':
        return 'var(--severity-medium)';
      case 'intermediate':
        return 'var(--type-service)';
      case 'expert':
        return 'var(--severity-info)';
      default:
        return 'var(--text-tertiary)';
    }
  };

  const getLevelLabel = (level: string) => {
    return level.charAt(0).toUpperCase() + level.slice(1);
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
        <h3 style={{ margin: 0, color: 'var(--text-primary)' }}>Skill Inventory</h3>
        <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
          {metrics.skills.length} skills
        </div>
      </div>

      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', fontWeight: 'bold' }}>
          Skills by Level
        </div>
        {metrics.skills.map((skill, idx) => (
          <div key={idx} style={{ marginBottom: '0.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem', fontSize: '0.875rem' }}>
              <span style={{ color: 'var(--text-primary)' }}>{skill.name}</span>
              <span style={{ color: getLevelColor(skill.level), fontWeight: 'bold' }}>
                {getLevelLabel(skill.level)} ({skill.people} people)
              </span>
            </div>
            <div style={{ height: '6px', backgroundColor: 'var(--bg-secondary)', borderRadius: '3px', overflow: 'hidden' }}>
              <div
                style={{
                  height: '100%',
                  width: `${(skill.people / Math.max(...metrics.skills.map(s => s.people))) * 100}%`,
                  backgroundColor: getLevelColor(skill.level),
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
              Skill Gaps
            </h4>
            {metrics.skillGaps.map((gap, idx) => (
              <div key={idx} style={{ marginBottom: '0.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem', fontSize: '0.875rem' }}>
                  <span style={{ color: 'var(--text-primary)' }}>{gap.skill}</span>
                  <span style={{ color: 'var(--text-secondary)' }}>{gap.gap}%</span>
                </div>
                <div style={{ height: '6px', backgroundColor: 'var(--bg-secondary)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div
                    style={{
                      height: '100%',
                      width: `${gap.gap}%`,
                      backgroundColor: gap.gap > 60 ? 'var(--severity-critical)' : gap.gap > 30 ? 'var(--severity-medium)' : 'var(--severity-info)',
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-primary)', fontSize: '0.95rem' }}>
              Training Recommendations
            </h4>
            <ul style={{ margin: 0, paddingLeft: '1.5rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
              {metrics.trainingRecommendations.map((rec, idx) => (
                <li key={idx} style={{ marginBottom: '0.5rem' }}>
                  {rec}
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

export default SkillInventoryCard;

