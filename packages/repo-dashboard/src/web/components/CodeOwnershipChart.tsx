import React, { useState } from 'react';

interface OwnershipData {
  owner: string;
  percentage: number;
  filesOwned: number;
}

interface CodeOwnershipMetrics {
  data: OwnershipData[];
  concentration: number; // 0-100, higher = more concentrated
  recommendations: string[];
  timestamp: string;
}

interface CodeOwnershipChartProps {
  metrics: CodeOwnershipMetrics;
  onDrillDown?: () => void;
}

export const CodeOwnershipChart: React.FC<CodeOwnershipChartProps> = ({ metrics, onDrillDown }) => {
  const [expanded, setExpanded] = useState(false);

  const getConcentrationColor = (concentration: number) => {
    if (concentration < 40) return 'var(--severity-info)'; // green - good distribution
    if (concentration < 60) return 'var(--severity-medium)'; // orange - moderate
    return 'var(--severity-critical)'; // red - high concentration
  };

  const colors = ['var(--type-service)', 'var(--severity-medium)', 'var(--severity-info)', 'var(--severity-critical)', 'var(--type-library)', 'var(--type-database)', 'var(--type-ui)', 'var(--text-tertiary)'];

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
        <h3 style={{ margin: 0, color: 'var(--text-primary)' }}>Code Ownership</h3>
        <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
          Concentration: {metrics.concentration.toFixed(1)}%
        </div>
      </div>

      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', height: '30px', borderRadius: '4px', overflow: 'hidden', marginBottom: '1rem' }}>
          {metrics.data.map((item, idx) => (
            <div
              key={idx}
              style={{
                flex: item.percentage,
                backgroundColor: colors[idx % colors.length],
                position: 'relative',
              }}
              title={`${item.owner}: ${item.percentage.toFixed(1)}%`}
            />
          ))}
        </div>
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', fontWeight: 'bold' }}>
          Ownership Distribution
        </div>
        {metrics.data.map((item, idx) => (
          <div key={idx} style={{ marginBottom: '0.5rem', fontSize: '0.875rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
              <span style={{ color: 'var(--text-primary)' }}>{item.owner}</span>
              <span style={{ color: 'var(--text-secondary)' }}>{item.percentage.toFixed(1)}% ({item.filesOwned} files)</span>
            </div>
            <div style={{ height: '6px', backgroundColor: 'var(--border-color)', borderRadius: '3px', overflow: 'hidden' }}>
              <div
                style={{
                  height: '100%',
                  width: `${item.percentage}%`,
                  backgroundColor: colors[idx % colors.length],
                }}
              />
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginBottom: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
        <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
          Concentration Level
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ flex: 1, height: '8px', backgroundColor: 'var(--border-color)', borderRadius: '4px', overflow: 'hidden' }}>
            <div
              style={{
                height: '100%',
                width: `${metrics.concentration}%`,
                backgroundColor: getConcentrationColor(metrics.concentration),
              }}
            />
          </div>
          <span style={{ fontSize: '0.875rem', color: getConcentrationColor(metrics.concentration), fontWeight: 'bold' }}>
            {metrics.concentration < 40 ? 'Good' : metrics.concentration < 60 ? 'Moderate' : 'High'}
          </span>
        </div>
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

export default CodeOwnershipChart;

