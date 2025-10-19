import React, { useState } from 'react';

interface BusFactorMetrics {
  score: number; // 1-10
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  keyPeople: Array<{ name: string; riskPercentage: number }>;
  recommendations: string[];
  trend: 'improving' | 'stable' | 'degrading';
  timestamp: string;
}

interface BusFactorCardProps {
  metrics: BusFactorMetrics;
  onDrillDown?: () => void;
}

export const BusFactorCard: React.FC<BusFactorCardProps> = ({ metrics, onDrillDown }) => {
  const [expanded, setExpanded] = useState(false);

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'low':
        return '#4caf50';
      case 'medium':
        return '#ff9800';
      case 'high':
        return '#f44336';
      case 'critical':
        return '#b71c1c';
      default:
        return '#9e9e9e';
    }
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
        return '#4caf50';
      case 'degrading':
        return '#f44336';
      default:
        return '#ff9800';
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
        <h3 style={{ margin: 0, color: 'var(--text-primary)' }}>Bus Factor</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '1.5rem', color: getTrendColor(metrics.trend), fontWeight: 'bold' }}>
            {getTrendIcon(metrics.trend)}
          </span>
        </div>
      </div>

      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
          Risk Level: {metrics.riskLevel.toUpperCase()}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ flex: 1, height: '12px', backgroundColor: 'var(--border-color)', borderRadius: '6px', overflow: 'hidden' }}>
            <div
              style={{
                height: '100%',
                width: `${(metrics.score / 10) * 100}%`,
                backgroundColor: getRiskColor(metrics.riskLevel),
                transition: 'width 0.3s ease',
              }}
            />
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: getRiskColor(metrics.riskLevel), minWidth: '40px' }}>
            {metrics.score}/10
          </div>
        </div>
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', fontWeight: 'bold' }}>
          Key People at Risk
        </div>
        {metrics.keyPeople.map((person, idx) => (
          <div key={idx} style={{ marginBottom: '0.5rem', fontSize: '0.875rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
              <span style={{ color: 'var(--text-primary)' }}>{person.name}</span>
              <span style={{ color: 'var(--text-secondary)' }}>{person.riskPercentage}%</span>
            </div>
            <div style={{ height: '6px', backgroundColor: 'var(--border-color)', borderRadius: '3px', overflow: 'hidden' }}>
              <div
                style={{
                  height: '100%',
                  width: `${person.riskPercentage}%`,
                  backgroundColor: getRiskColor(person.riskPercentage > 70 ? 'high' : person.riskPercentage > 40 ? 'medium' : 'low'),
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

export default BusFactorCard;

