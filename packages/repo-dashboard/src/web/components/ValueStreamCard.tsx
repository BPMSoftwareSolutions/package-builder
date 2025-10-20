import React, { useState } from 'react';

interface ValueStreamStage {
  name: string;
  medianTime: number; // in hours
  p95Time: number;
  p5Time: number;
  trend: 'improving' | 'stable' | 'degrading';
}

interface ValueStreamMetrics {
  stages: ValueStreamStage[];
  totalMedianTime: number;
  sevenDayTrend: 'improving' | 'stable' | 'degrading';
  thirtyDayTrend: 'improving' | 'stable' | 'degrading';
  timestamp: string;
}

interface ValueStreamCardProps {
  metrics: ValueStreamMetrics;
  onDrillDown?: () => void;
}

export const ValueStreamCard: React.FC<ValueStreamCardProps> = ({ metrics, onDrillDown }) => {
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
        return 'var(--trend-improving)';
      case 'degrading':
        return 'var(--trend-degrading)';
      default:
        return 'var(--trend-stable)';
    }
  };

  const getStageColor = (stage: string) => {
    const colors: { [key: string]: string } = {
      'Idea': 'var(--stage-idea-bg)',
      'PR': 'var(--stage-pr-bg)',
      'Review': 'var(--stage-review-bg)',
      'Build': 'var(--stage-build-bg)',
      'Test': 'var(--stage-test-bg)',
      'Deploy': 'var(--stage-deploy-bg)',
    };
    return colors[stage] || 'var(--bg-tertiary)';
  };

  const formatTime = (hours: number) => {
    if (hours < 1) return `${Math.round(hours * 60)}m`;
    if (hours < 24) return `${hours.toFixed(1)}h`;
    return `${(hours / 24).toFixed(1)}d`;
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
        <h3 style={{ margin: 0, color: 'var(--text-primary)' }}>Value Stream Timeline</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '1.5rem', color: getTrendColor(metrics.sevenDayTrend), fontWeight: 'bold' }}>
            {getTrendIcon(metrics.sevenDayTrend)}
          </span>
          <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            7-day trend
          </span>
        </div>
      </div>

      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
          Total Median Lead Time
        </div>
        <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>
          {formatTime(metrics.totalMedianTime)}
        </div>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
        {metrics.stages.map((stage, idx) => (
          <div
            key={idx}
            style={{
              flex: '0 0 auto',
              minWidth: '120px',
              padding: '1rem',
              backgroundColor: getStageColor(stage.name),
              borderRadius: '6px',
              border: `2px solid ${getTrendColor(stage.trend)}`,
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem', fontWeight: 'bold' }}>
              {stage.name}
            </div>
            <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
              {formatTime(stage.medianTime)}
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
              {getTrendIcon(stage.trend)} {stage.trend}
            </div>
          </div>
        ))}
      </div>

      {expanded && (
        <div style={{ paddingTop: '1rem', borderTop: '1px solid var(--border-color)', marginTop: '1rem' }}>
          <div style={{ marginBottom: '1rem' }}>
            <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-primary)', fontSize: '0.95rem' }}>
              Detailed Metrics
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.875rem' }}>
              {metrics.stages.map((stage, idx) => (
                <div key={idx} style={{ padding: '0.75rem', backgroundColor: 'var(--border-color)', borderRadius: '4px' }}>
                  <div style={{ fontWeight: 'bold', marginBottom: '0.25rem', color: 'var(--text-primary)' }}>
                    {stage.name}
                  </div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                    <div>Median: {formatTime(stage.medianTime)}</div>
                    <div>P95: {formatTime(stage.p95Time)}</div>
                    <div>P5: {formatTime(stage.p5Time)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.875rem', marginBottom: '1rem' }}>
            <div>
              <div style={{ color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>7-Day Trend</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: getTrendColor(metrics.sevenDayTrend) }}>
                {getTrendIcon(metrics.sevenDayTrend)} {metrics.sevenDayTrend}
              </div>
            </div>
            <div>
              <div style={{ color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>30-Day Trend</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: getTrendColor(metrics.thirtyDayTrend) }}>
                {getTrendIcon(metrics.thirtyDayTrend)} {metrics.thirtyDayTrend}
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
              View Detailed Breakdown
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default ValueStreamCard;

