import React from 'react';

interface HealthScoreProps {
  score: number; // 0-100
  label?: string;
  trend?: 'up' | 'down' | 'stable';
  size?: 'small' | 'medium' | 'large';
}

export const HealthScore: React.FC<HealthScoreProps> = ({
  score,
  label = 'Health Score',
  trend = 'stable',
  size = 'medium',
}) => {
  const getColor = (value: number) => {
    if (value >= 80) return '#4caf50'; // green
    if (value >= 60) return '#ff9800'; // orange
    return '#f44336'; // red
  };

  const getTrendIcon = () => {
    switch (trend) {
      case 'up':
        return '↑';
      case 'down':
        return '↓';
      default:
        return '→';
    }
  };

  const getTrendColor = () => {
    switch (trend) {
      case 'up':
        return '#4caf50';
      case 'down':
        return '#f44336';
      default:
        return '#ff9800';
    }
  };

  const sizeMap = {
    small: { radius: 40, fontSize: '1.5rem', labelSize: '0.875rem' },
    medium: { radius: 60, fontSize: '2rem', labelSize: '1rem' },
    large: { radius: 80, fontSize: '2.5rem', labelSize: '1.25rem' },
  };

  const { radius, fontSize, labelSize } = sizeMap[size];
  const color = getColor(score);
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '0.5rem',
      }}
    >
      <div style={{ position: 'relative', width: radius * 2 + 20, height: radius * 2 + 20 }}>
        <svg
          width={radius * 2 + 20}
          height={radius * 2 + 20}
          style={{ transform: 'rotate(-90deg)' }}
        >
          <circle
            cx={radius + 10}
            cy={radius + 10}
            r={radius}
            fill="none"
            stroke="var(--border-color)"
            strokeWidth="4"
          />
          <circle
            cx={radius + 10}
            cy={radius + 10}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth="4"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 0.5s ease' }}
          />
        </svg>
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize, fontWeight: 'bold', color }}>
            {Math.round(score)}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            %
          </div>
        </div>
      </div>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: labelSize, fontWeight: 600, color: 'var(--text-primary)' }}>
          {label}
        </div>
        <div
          style={{
            fontSize: '1rem',
            color: getTrendColor(),
            fontWeight: 'bold',
            marginTop: '0.25rem',
          }}
        >
          {getTrendIcon()}
        </div>
      </div>
    </div>
  );
};

export default HealthScore;

