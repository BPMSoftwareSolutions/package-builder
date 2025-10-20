import React, { useState } from 'react';

interface Recommendation {
  id: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  expectedImpact: number; // 0-100
  implementationSteps: string[];
  status: 'not-started' | 'in-progress' | 'completed';
}

interface LearningRecommendationsMetrics {
  recommendations: Recommendation[];
  timestamp: string;
}

interface LearningRecommendationsProps {
  metrics: LearningRecommendationsMetrics;
  onDrillDown?: () => void;
}

export const LearningRecommendations: React.FC<LearningRecommendationsProps> = ({ metrics, onDrillDown }) => {
  const [expanded, setExpanded] = useState(false);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return '✓';
      case 'in-progress':
        return '⟳';
      default:
        return '○';
    }
  };

  const completedCount = metrics.recommendations.filter(r => r.status === 'completed').length;

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
        <h3 style={{ margin: 0, color: 'var(--text-primary)' }}>Learning Recommendations</h3>
        <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
          {completedCount}/{metrics.recommendations.length} completed
        </div>
      </div>

      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ flex: 1, height: '8px', backgroundColor: 'var(--bg-secondary)', borderRadius: '4px', overflow: 'hidden' }}>
            <div
              style={{
                height: '100%',
                width: `${(completedCount / metrics.recommendations.length) * 100}%`,
                backgroundColor: 'var(--severity-info)',
              }}
            />
          </div>
          <div style={{ fontSize: '0.875rem', fontWeight: 'bold', color: 'var(--text-primary)', minWidth: '50px' }}>
            {((completedCount / metrics.recommendations.length) * 100).toFixed(0)}%
          </div>
        </div>
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', fontWeight: 'bold' }}>
          Top Recommendations
        </div>
        {metrics.recommendations.slice(0, 3).map((rec) => (
          <div key={rec.id} style={{ marginBottom: '0.75rem', padding: '0.75rem', backgroundColor: 'var(--bg-secondary)', borderRadius: '4px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
              <span style={{ fontWeight: 'bold', color: 'var(--text-primary)', fontSize: '0.875rem' }}>
                {getStatusIcon(rec.status)} {rec.title}
              </span>
              <span style={{ color: getPriorityColor(rec.priority), fontWeight: 'bold', fontSize: '0.75rem' }}>
                {rec.priority.toUpperCase()}
              </span>
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              Impact: {rec.expectedImpact}%
            </div>
          </div>
        ))}
      </div>

      {expanded && (
        <div style={{ paddingTop: '1rem', borderTop: '1px solid var(--border-color)', marginTop: '1rem' }}>
          <div style={{ marginBottom: '1rem' }}>
            <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-primary)', fontSize: '0.95rem' }}>
              All Recommendations
            </h4>
            {metrics.recommendations.map((rec) => (
              <div key={rec.id} style={{ marginBottom: '1rem', padding: '0.75rem', backgroundColor: 'var(--bg-secondary)', borderRadius: '4px', fontSize: '0.875rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                  <span style={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>
                    {getStatusIcon(rec.status)} {rec.title}
                  </span>
                  <span style={{ color: getPriorityColor(rec.priority), fontWeight: 'bold' }}>
                    {rec.priority.toUpperCase()}
                  </span>
                </div>
                <div style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                  {rec.description}
                </div>
                <div style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                  Expected Impact: {rec.expectedImpact}%
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  <strong>Steps:</strong>
                  <ol style={{ margin: '0.25rem 0 0 1.5rem', paddingLeft: 0 }}>
                    {rec.implementationSteps.map((step, idx) => (
                      <li key={idx} style={{ marginBottom: '0.25rem' }}>
                        {step}
                      </li>
                    ))}
                  </ol>
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

export default LearningRecommendations;

