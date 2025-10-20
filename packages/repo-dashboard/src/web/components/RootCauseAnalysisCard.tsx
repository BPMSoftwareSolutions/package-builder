import React, { useState } from 'react';

interface RootCause {
  cause: string;
  frequency: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  affectedMetrics: string[];
}

interface RootCauseMetrics {
  rootCauses: RootCause[];
  recommendations: string[];
  patterns: string[];
  timestamp: string;
}

interface RootCauseAnalysisCardProps {
  metrics: RootCauseMetrics;
  onDrillDown?: () => void;
}

export const RootCauseAnalysisCard: React.FC<RootCauseAnalysisCardProps> = ({ metrics, onDrillDown }) => {
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
        <h3 style={{ margin: 0, color: 'var(--text-primary)' }}>Root Cause Analysis</h3>
        <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
          {metrics.rootCauses.length} causes
        </div>
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', fontWeight: 'bold' }}>
          Top Root Causes
        </div>
        {metrics.rootCauses.slice(0, 3).map((cause, idx) => (
          <div key={idx} style={{ marginBottom: '0.75rem', padding: '0.75rem', backgroundColor: 'var(--border-color)', borderRadius: '4px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
              <span style={{ fontWeight: 'bold', color: 'var(--text-primary)', fontSize: '0.875rem' }}>
                {cause.cause}
              </span>
              <span style={{ color: getSeverityColor(cause.severity), fontWeight: 'bold', fontSize: '0.75rem' }}>
                {cause.severity.toUpperCase()}
              </span>
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              Frequency: {cause.frequency} occurrences
            </div>
          </div>
        ))}
      </div>

      {expanded && (
        <div style={{ paddingTop: '1rem', borderTop: '1px solid var(--border-color)', marginTop: '1rem' }}>
          <div style={{ marginBottom: '1rem' }}>
            <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-primary)', fontSize: '0.95rem' }}>
              All Root Causes
            </h4>
            {metrics.rootCauses.map((cause, idx) => (
              <div key={idx} style={{ marginBottom: '0.75rem', padding: '0.75rem', backgroundColor: 'var(--border-color)', borderRadius: '4px', fontSize: '0.875rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                  <span style={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>
                    {cause.cause}
                  </span>
                  <span style={{ color: getSeverityColor(cause.severity), fontWeight: 'bold' }}>
                    {cause.severity.toUpperCase()}
                  </span>
                </div>
                <div style={{ color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                  Frequency: {cause.frequency} • Affected: {cause.affectedMetrics.join(', ')}
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-primary)', fontSize: '0.95rem' }}>
              Patterns
            </h4>
            <ul style={{ margin: 0, paddingLeft: '1.5rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
              {metrics.patterns.map((pattern, idx) => (
                <li key={idx} style={{ marginBottom: '0.5rem' }}>
                  {pattern}
                </li>
              ))}
            </ul>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-primary)', fontSize: '0.95rem' }}>
              Recommendations
            </h4>
            <ul style={{ margin: 0, paddingLeft: '1.5rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
              {metrics.recommendations.map((rec, idx) => (
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

export default RootCauseAnalysisCard;

