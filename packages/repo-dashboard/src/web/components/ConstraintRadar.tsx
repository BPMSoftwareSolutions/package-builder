import React, { useState } from 'react';

interface TeamConstraint {
  team: string;
  severity: number; // 0-100
  stage: string;
  description: string;
}

interface ConstraintRadarMetrics {
  constraints: TeamConstraint[];
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  timestamp: string;
}

interface ConstraintRadarProps {
  metrics: ConstraintRadarMetrics;
  onDrillDown?: () => void;
}

export const ConstraintRadar: React.FC<ConstraintRadarProps> = ({ metrics, onDrillDown }) => {
  const [expanded, setExpanded] = useState(false);

  const getSeverityColor = (severity: number) => {
    if (severity >= 80) return 'var(--severity-critical)'; // critical
    if (severity >= 60) return 'var(--severity-medium)'; // high
    if (severity >= 40) return 'var(--severity-low)'; // medium
    return 'var(--severity-info)'; // low
  };

  const getSeverityLabel = (severity: number) => {
    if (severity >= 80) return 'Critical';
    if (severity >= 60) return 'High';
    if (severity >= 40) return 'Medium';
    return 'Low';
  };

  const maxSeverity = Math.max(...metrics.constraints.map(c => c.severity), 1);
  const numTeams = metrics.constraints.length;
  const angleSlice = (Math.PI * 2) / numTeams;

  const getRadarPoint = (index: number, severity: number) => {
    const angle = angleSlice * index - Math.PI / 2;
    const radius = (severity / 100) * 40;
    const x = 50 + radius * Math.cos(angle);
    const y = 50 + radius * Math.sin(angle);
    return { x, y };
  };

  const radarPoints = metrics.constraints
    .map((constraint, idx) => getRadarPoint(idx, constraint.severity))
    .map(p => `${p.x},${p.y}`)
    .join(' ');

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
        <h3 style={{ margin: 0, color: 'var(--text-primary)' }}>Constraint Radar</h3>
        <div style={{ display: 'flex', gap: '0.5rem', fontSize: '0.75rem' }}>
          <div style={{ padding: '0.25rem 0.5rem', backgroundColor: 'var(--severity-critical)', color: 'white', borderRadius: '3px', fontWeight: 'bold' }}>
            {metrics.criticalCount} Critical
          </div>
          <div style={{ padding: '0.25rem 0.5rem', backgroundColor: 'var(--severity-medium)', color: 'white', borderRadius: '3px', fontWeight: 'bold' }}>
            {metrics.highCount} High
          </div>
        </div>
      </div>

      <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'center' }}>
        <svg
          viewBox="0 0 100 100"
          style={{
            width: '200px',
            height: '200px',
            backgroundColor: 'var(--bg-secondary)',
            borderRadius: '4px',
          }}
        >
          {/* Concentric circles */}
          {[20, 40, 60, 80, 100].map((radius) => (
            <circle
              key={`circle-${radius}`}
              cx="50"
              cy="50"
              r={radius / 2.5}
              fill="none"
              stroke="var(--border-color)"
              strokeWidth="0.5"
              opacity="0.5"
            />
          ))}

          {/* Radial lines */}
          {metrics.constraints.map((_, idx) => {
            const angle = angleSlice * idx - Math.PI / 2;
            const x2 = 50 + 40 * Math.cos(angle);
            const y2 = 50 + 40 * Math.sin(angle);
            return (
              <line
                key={`radial-${idx}`}
                x1="50"
                y1="50"
                x2={x2}
                y2={y2}
                stroke="var(--border-color)"
                strokeWidth="0.5"
                opacity="0.3"
              />
            );
          })}

          {/* Radar polygon */}
          <polyline
            points={radarPoints}
            fill="rgba(33, 150, 243, 0.2)"
            stroke="var(--type-service)"
            strokeWidth="1.5"
          />

          {/* Data points */}
          {metrics.constraints.map((constraint, idx) => {
            const point = getRadarPoint(idx, constraint.severity);
            return (
              <circle
                key={`point-${idx}`}
                cx={point.x}
                cy={point.y}
                r="1.5"
                fill={getSeverityColor(constraint.severity)}
              />
            );
          })}

          {/* Team labels */}
          {metrics.constraints.map((constraint, idx) => {
            const angle = angleSlice * idx - Math.PI / 2;
            const labelRadius = 45;
            const x = 50 + labelRadius * Math.cos(angle);
            const y = 50 + labelRadius * Math.sin(angle);
            return (
              <text
                key={`label-${idx}`}
                x={x}
                y={y}
                textAnchor="middle"
                fontSize="2"
                fill="var(--text-secondary)"
              >
                {constraint.team.substring(0, 3)}
              </text>
            );
          })}
        </svg>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
        {metrics.constraints.slice(0, 4).map((constraint, idx) => (
          <div
            key={idx}
            style={{
              padding: '0.75rem',
              backgroundColor: 'var(--bg-secondary)',
              borderRadius: '4px',
              borderLeft: `4px solid ${getSeverityColor(constraint.severity)}`,
            }}
          >
            <div style={{ fontSize: '0.875rem', fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
              {constraint.team}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
              {constraint.stage}
            </div>
            <div style={{ fontSize: '0.875rem', fontWeight: 'bold', color: getSeverityColor(constraint.severity) }}>
              {getSeverityLabel(constraint.severity)}
            </div>
          </div>
        ))}
      </div>

      {expanded && (
        <div style={{ paddingTop: '1rem', borderTop: '1px solid var(--border-color)', marginTop: '1rem' }}>
          <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-primary)', fontSize: '0.95rem' }}>
            All Constraints
          </h4>
          <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
            {metrics.constraints.map((constraint, idx) => (
              <div
                key={idx}
                style={{
                  padding: '0.5rem',
                  marginBottom: '0.5rem',
                  backgroundColor: 'var(--bg-secondary)',
                  borderRadius: '4px',
                  borderLeft: `3px solid ${getSeverityColor(constraint.severity)}`,
                  fontSize: '0.875rem',
                }}
              >
                <div style={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>
                  {constraint.team} - {constraint.stage}
                </div>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: '0.25rem' }}>
                  {constraint.description}
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
                marginTop: '1rem',
                backgroundColor: 'var(--primary-color)',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: 'bold',
              }}
            >
              View Detailed Analysis
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default ConstraintRadar;

