import React, { useState } from 'react';

interface FlowStageData {
  stage: string;
  percentage: number;
  hours: number;
  color: string;
}

interface PRFlowMetrics {
  stages: FlowStageData[];
  totalTime: number;
  trend: 'improving' | 'stable' | 'degrading';
  timestamp: string;
}

interface PRFlowChartProps {
  metrics: PRFlowMetrics;
  onDrillDown?: () => void;
}

export const PRFlowChart: React.FC<PRFlowChartProps> = ({ metrics, onDrillDown }) => {
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

  const formatTime = (hours: number) => {
    if (hours < 1) return `${Math.round(hours * 60)}m`;
    if (hours < 24) return `${hours.toFixed(1)}h`;
    return `${(hours / 24).toFixed(1)}d`;
  };

  const getLongestStage = () => {
    return metrics.stages.reduce((max, stage) => (stage.hours > max.hours ? stage : max));
  };

  const longest = getLongestStage();

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
        <h3 style={{ margin: 0, color: 'var(--text-primary)' }}>PR Flow Breakdown</h3>
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
        <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
          Total Time in Flow
        </div>
        <div style={{ fontSize: '1.75rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>
          {formatTime(metrics.totalTime)}
        </div>
      </div>

      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.75rem', fontWeight: 'bold' }}>
          Time Distribution
        </div>
        <div style={{ display: 'flex', height: '40px', borderRadius: '4px', overflow: 'hidden', gap: '2px', backgroundColor: 'var(--border-color)' }}>
          {metrics.stages.map((stage, idx) => (
            <div
              key={idx}
              style={{
                flex: stage.percentage,
                backgroundColor: stage.color,
                position: 'relative',
                minWidth: '20px',
              }}
              title={`${stage.stage}: ${stage.percentage.toFixed(1)}%`}
            />
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
        {metrics.stages.map((stage, idx) => (
          <div
            key={idx}
            style={{
              padding: '0.75rem',
              backgroundColor: 'var(--border-color)',
              borderRadius: '4px',
              borderLeft: `4px solid ${stage.color}`,
            }}
          >
            <div style={{ fontSize: '0.875rem', fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
              {stage.stage}
            </div>
            <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: stage.color, marginBottom: '0.25rem' }}>
              {stage.percentage.toFixed(1)}%
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              {formatTime(stage.hours)}
            </div>
          </div>
        ))}
      </div>

      {expanded && (
        <div style={{ paddingTop: '1rem', borderTop: '1px solid var(--border-color)', marginTop: '1rem' }}>
          <div style={{ marginBottom: '1rem' }}>
            <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-primary)', fontSize: '0.95rem' }}>
              Longest Stage
            </h4>
            <div style={{ padding: '0.75rem', backgroundColor: 'var(--border-color)', borderRadius: '4px', borderLeft: `4px solid ${longest.color}` }}>
              <div style={{ fontSize: '0.875rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                {longest.stage}
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: longest.color }}>
                {formatTime(longest.hours)}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                {longest.percentage.toFixed(1)}% of total time
              </div>
            </div>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-primary)', fontSize: '0.95rem' }}>
              Recommendation
            </h4>
            <div style={{ padding: '0.75rem', backgroundColor: '#fff3cd', borderRadius: '4px', fontSize: '0.875rem', color: '#856404' }}>
              Focus on reducing {longest.stage.toLowerCase()} time to improve overall flow efficiency.
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
              View Detailed Analysis
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default PRFlowChart;

