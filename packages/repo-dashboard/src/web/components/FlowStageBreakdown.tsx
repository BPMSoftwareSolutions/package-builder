import React, { useState } from 'react';

interface StageMetric {
  stage: string;
  median: number;
  p95: number;
  p99: number;
  p5: number;
  trend: 'improving' | 'stable' | 'degrading';
}

interface FlowStageBreakdownMetrics {
  stages: StageMetric[];
  timestamp: string;
}

interface FlowStageBreakdownProps {
  metrics: FlowStageBreakdownMetrics;
  onDrillDown?: () => void;
}

export const FlowStageBreakdown: React.FC<FlowStageBreakdownProps> = ({ metrics, onDrillDown }) => {
  const [expanded, setExpanded] = useState(false);
  const [selectedStage, setSelectedStage] = useState<string | null>(null);

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

  const formatTime = (hours: number) => {
    if (hours < 1) return `${Math.round(hours * 60)}m`;
    if (hours < 24) return `${hours.toFixed(1)}h`;
    return `${(hours / 24).toFixed(1)}d`;
  };

  const maxValue = Math.max(...metrics.stages.map(s => s.p99));

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
      <h3 style={{ margin: '0 0 1rem 0', color: 'var(--text-primary)' }}>
        Flow Stage Breakdown
      </h3>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {metrics.stages.map((stage, idx) => (
          <div
            key={idx}
            style={{
              padding: '1rem',
              backgroundColor: 'var(--border-color)',
              borderRadius: '6px',
              cursor: 'pointer',
              border: selectedStage === stage.stage ? '2px solid var(--primary-color)' : '1px solid transparent',
            }}
            onClick={(e) => {
              e.stopPropagation();
              setSelectedStage(selectedStage === stage.stage ? null : stage.stage);
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <div style={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>
                {stage.stage}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '1.25rem', color: getTrendColor(stage.trend), fontWeight: 'bold' }}>
                  {getTrendIcon(stage.trend)}
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  {stage.trend}
                </span>
              </div>
            </div>

            <div style={{ marginBottom: '0.75rem' }}>
              <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                Median: {formatTime(stage.median)}
              </div>
              <div style={{ height: '8px', backgroundColor: 'var(--border-color)', borderRadius: '4px', overflow: 'hidden' }}>
                <div
                  style={{
                    height: '100%',
                    width: `${(stage.median / maxValue) * 100}%`,
                    backgroundColor: getTrendColor(stage.trend),
                    transition: 'width 0.3s ease',
                  }}
                />
              </div>
            </div>

            {selectedStage === stage.stage && (
              <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-color)' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.8rem' }}>
                  <div>
                    <div style={{ color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>P5</div>
                    <div style={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>
                      {formatTime(stage.p5)}
                    </div>
                  </div>
                  <div>
                    <div style={{ color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>P95</div>
                    <div style={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>
                      {formatTime(stage.p95)}
                    </div>
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <div style={{ color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>P99</div>
                    <div style={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>
                      {formatTime(stage.p99)}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {expanded && (
        <div style={{ paddingTop: '1rem', borderTop: '1px solid var(--border-color)', marginTop: '1rem' }}>
          <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-primary)', fontSize: '0.95rem' }}>
            Summary
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.875rem', marginBottom: '1rem' }}>
            <div style={{ padding: '0.5rem', backgroundColor: 'var(--border-color)', borderRadius: '4px' }}>
              <div style={{ color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Fastest Stage</div>
              <div style={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>
                {metrics.stages.reduce((min, s) => s.median < min.median ? s : min).stage}
              </div>
            </div>
            <div style={{ padding: '0.5rem', backgroundColor: 'var(--border-color)', borderRadius: '4px' }}>
              <div style={{ color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Slowest Stage</div>
              <div style={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>
                {metrics.stages.reduce((max, s) => s.median > max.median ? s : max).stage}
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
              View Detailed Analysis
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default FlowStageBreakdown;

