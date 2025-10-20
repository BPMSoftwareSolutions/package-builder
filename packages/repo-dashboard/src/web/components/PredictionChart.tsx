import React, { useState } from 'react';

interface PredictionPoint {
  date: string;
  predicted: number;
  confidence: number; // 0-100
}

interface PredictionMetrics {
  metricName: string;
  predictions: PredictionPoint[];
  trend: 'improving' | 'stable' | 'degrading';
  scenarios: Array<{ name: string; value: number }>;
  timestamp: string;
}

interface PredictionChartProps {
  metrics: PredictionMetrics;
  onDrillDown?: () => void;
}

export const PredictionChart: React.FC<PredictionChartProps> = ({ metrics, onDrillDown }) => {
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
        return 'var(--severity-info)';
      case 'degrading':
        return 'var(--severity-critical)';
      default:
        return 'var(--severity-medium)';
    }
  };

  const avgConfidence = metrics.predictions.reduce((sum, p) => sum + p.confidence, 0) / metrics.predictions.length;

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
        <h3 style={{ margin: 0, color: 'var(--text-primary)' }}>{metrics.metricName} Prediction</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '1.5rem', color: getTrendColor(metrics.trend), fontWeight: 'bold' }}>
            {getTrendIcon(metrics.trend)}
          </span>
        </div>
      </div>

      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
          Average Confidence
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ flex: 1, height: '8px', backgroundColor: 'var(--border-color)', borderRadius: '4px', overflow: 'hidden' }}>
            <div
              style={{
                height: '100%',
                width: `${avgConfidence}%`,
                backgroundColor: avgConfidence > 80 ? 'var(--severity-info)' : avgConfidence > 60 ? 'var(--severity-medium)' : 'var(--severity-critical)',
              }}
            />
          </div>
          <div style={{ fontSize: '1rem', fontWeight: 'bold', color: 'var(--text-primary)', minWidth: '50px' }}>
            {avgConfidence.toFixed(0)}%
          </div>
        </div>
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', fontWeight: 'bold' }}>
          Next 30 Days Predictions
        </div>
        {metrics.predictions.slice(0, 5).map((pred, idx) => (
          <div key={idx} style={{ marginBottom: '0.5rem', fontSize: '0.875rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
              <span style={{ color: 'var(--text-primary)' }}>{pred.date}</span>
              <span style={{ color: 'var(--text-secondary)' }}>{pred.predicted.toFixed(2)} ({pred.confidence}%)</span>
            </div>
            <div style={{ height: '6px', backgroundColor: 'var(--border-color)', borderRadius: '3px', overflow: 'hidden' }}>
              <div
                style={{
                  height: '100%',
                  width: `${pred.confidence}%`,
                  backgroundColor: pred.confidence > 80 ? 'var(--severity-info)' : pred.confidence > 60 ? 'var(--severity-medium)' : 'var(--severity-critical)',
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
              What-If Scenarios
            </h4>
            {metrics.scenarios.map((scenario, idx) => (
              <div key={idx} style={{ marginBottom: '0.5rem', padding: '0.75rem', backgroundColor: 'var(--border-color)', borderRadius: '4px', fontSize: '0.875rem' }}>
                <div style={{ fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                  {scenario.name}
                </div>
                <div style={{ color: 'var(--text-secondary)' }}>
                  Predicted Value: {scenario.value.toFixed(2)}
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

export default PredictionChart;

