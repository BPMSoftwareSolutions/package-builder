import React, { useState } from 'react';

interface WIPDataPoint {
  date: string;
  wip: number;
  limit: number;
}

interface WIPTrendMetrics {
  data: WIPDataPoint[];
  averageWIP: number;
  maxWIP: number;
  minWIP: number;
  trend: 'improving' | 'stable' | 'degrading';
  timestamp: string;
}

interface WIPTrendChartProps {
  metrics: WIPTrendMetrics;
  onDrillDown?: () => void;
}

export const WIPTrendChart: React.FC<WIPTrendChartProps> = ({ metrics, onDrillDown }) => {
  const [expanded, setExpanded] = useState(false);

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

  const maxValue = Math.max(...metrics.data.map(d => Math.max(d.wip, d.limit)));
  const minValue = 0;
  const range = maxValue - minValue;

  const getY = (value: number) => {
    return 100 - ((value - minValue) / range) * 100;
  };

  const getX = (index: number) => {
    return (index / (metrics.data.length - 1)) * 100;
  };

  const pathData = metrics.data
    .map((point, idx) => `${getX(idx)},${getY(point.wip)}`)
    .join(' L ');

  const limitPathData = metrics.data
    .map((point, idx) => `${getX(idx)},${getY(point.limit)}`)
    .join(' L ');

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
        <h3 style={{ margin: 0, color: 'var(--text-primary)' }}>WIP Trend (30 Days)</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '1.5rem', color: getTrendColor(metrics.trend), fontWeight: 'bold' }}>
            {getTrendIcon(metrics.trend)}
          </span>
          <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            {metrics.trend}
          </span>
        </div>
      </div>

      <div style={{ marginBottom: '1.5rem' }}>
        <svg
          viewBox="0 0 100 60"
          style={{
            width: '100%',
            height: '200px',
            backgroundColor: 'var(--border-color)',
            borderRadius: '4px',
          }}
        >
          {/* Grid lines */}
          {[0, 25, 50, 75, 100].map((y) => (
            <line
              key={`grid-${y}`}
              x1="0"
              y1={y}
              x2="100"
              y2={y}
              stroke="var(--border-color)"
              strokeWidth="0.5"
              opacity="0.5"
            />
          ))}

          {/* Limit line */}
          <polyline
            points={limitPathData}
            fill="none"
            stroke="#ff9800"
            strokeWidth="1.5"
            opacity="0.6"
            strokeDasharray="2,2"
          />

          {/* WIP line */}
          <polyline
            points={pathData}
            fill="none"
            stroke={getTrendColor(metrics.trend)}
            strokeWidth="2"
          />

          {/* Data points */}
          {metrics.data.map((point, idx) => (
            <circle
              key={`point-${idx}`}
              cx={getX(idx)}
              cy={getY(point.wip)}
              r="1"
              fill={getTrendColor(metrics.trend)}
            />
          ))}
        </svg>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
        <div style={{ padding: '0.75rem', backgroundColor: 'var(--border-color)', borderRadius: '4px', textAlign: 'center' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
            Average WIP
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>
            {metrics.averageWIP.toFixed(1)}
          </div>
        </div>
        <div style={{ padding: '0.75rem', backgroundColor: 'var(--border-color)', borderRadius: '4px', textAlign: 'center' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
            Max WIP
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#f44336' }}>
            {metrics.maxWIP}
          </div>
        </div>
        <div style={{ padding: '0.75rem', backgroundColor: 'var(--border-color)', borderRadius: '4px', textAlign: 'center' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
            Min WIP
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#4caf50' }}>
            {metrics.minWIP}
          </div>
        </div>
      </div>

      {expanded && (
        <div style={{ paddingTop: '1rem', borderTop: '1px solid var(--border-color)', marginTop: '1rem' }}>
          <div style={{ marginBottom: '1rem' }}>
            <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-primary)', fontSize: '0.95rem' }}>
              Legend
            </h4>
            <div style={{ display: 'flex', gap: '1rem', fontSize: '0.875rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ width: '12px', height: '2px', backgroundColor: getTrendColor(metrics.trend) }} />
                <span>Current WIP</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ width: '12px', height: '2px', backgroundColor: '#ff9800', opacity: '0.6' }} />
                <span>WIP Limit</span>
              </div>
            </div>
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
              View Detailed Trend Analysis
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default WIPTrendChart;

