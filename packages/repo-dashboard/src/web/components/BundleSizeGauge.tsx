import React, { useState } from 'react';

interface BundleMetric {
  name: string;
  size: number; // in KB
  budget: number; // in KB
  status: 'green' | 'yellow' | 'red';
}

interface BundleSizeMetrics {
  bundles: BundleMetric[];
  totalSize: number;
  totalBudget: number;
  loadTime: number; // in seconds
  trend: 'improving' | 'stable' | 'degrading';
  timestamp: string;
}

interface BundleSizeGaugeProps {
  metrics: BundleSizeMetrics;
  onDrillDown?: () => void;
}

export const BundleSizeGauge: React.FC<BundleSizeGaugeProps> = ({ metrics, onDrillDown }) => {
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'green':
        return 'var(--severity-info)';
      case 'yellow':
        return 'var(--severity-medium)';
      case 'red':
        return 'var(--severity-critical)';
      default:
        return 'var(--type-service)';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'green':
        return 'Within Budget';
      case 'yellow':
        return 'Near Limit';
      case 'red':
        return 'Over Budget';
      default:
        return 'Unknown';
    }
  };

  const overBudgetCount = metrics.bundles.filter(b => b.status === 'red').length;
  const percentageOfBudget = (metrics.totalSize / metrics.totalBudget) * 100;

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
        <h3 style={{ margin: 0, color: 'var(--text-primary)' }}>Bundle Size & Performance</h3>
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
          <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Total Bundle Size</span>
          <span style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>
            {metrics.totalSize} KB / {metrics.totalBudget} KB
          </span>
        </div>
        <div style={{ height: '24px', backgroundColor: 'var(--bg-secondary)', borderRadius: '12px', overflow: 'hidden' }}>
          <div
            style={{
              height: '100%',
              width: `${Math.min(percentageOfBudget, 100)}%`,
              backgroundColor: getStatusColor(percentageOfBudget > 100 ? 'red' : percentageOfBudget > 90 ? 'yellow' : 'green'),
              transition: 'width 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '0.75rem',
              fontWeight: 'bold',
            }}
          >
            {percentageOfBudget > 10 && `${percentageOfBudget.toFixed(0)}%`}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
        <div style={{ padding: '0.75rem', backgroundColor: 'var(--bg-secondary)', borderRadius: '4px', textAlign: 'center' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
            Load Time
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>
            {metrics.loadTime.toFixed(2)}s
          </div>
        </div>
        <div style={{ padding: '0.75rem', backgroundColor: 'var(--bg-secondary)', borderRadius: '4px', textAlign: 'center' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
            Over Budget
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 'bold', color: overBudgetCount > 0 ? 'var(--severity-critical)' : 'var(--severity-info)' }}>
            {overBudgetCount}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
        {metrics.bundles.slice(0, 3).map((bundle, idx) => (
          <div
            key={idx}
            style={{
              padding: '0.75rem',
              backgroundColor: 'var(--bg-secondary)',
              borderRadius: '4px',
              borderLeft: `4px solid ${getStatusColor(bundle.status)}`,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
              <div style={{ fontWeight: 'bold', color: 'var(--text-primary)', fontSize: '0.875rem' }}>
                {bundle.name}
              </div>
              <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: getStatusColor(bundle.status) }}>
                {getStatusLabel(bundle.status)}
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>
                {bundle.size} KB / {bundle.budget} KB
              </span>
              <span style={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>
                {((bundle.size / bundle.budget) * 100).toFixed(0)}%
              </span>
            </div>
          </div>
        ))}
      </div>

      {expanded && (
        <div style={{ paddingTop: '1rem', borderTop: '1px solid var(--border-color)', marginTop: '1rem' }}>
          <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-primary)', fontSize: '0.95rem' }}>
            All Bundles
          </h4>
          <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
            {metrics.bundles.map((bundle, idx) => (
              <div
                key={idx}
                style={{
                  padding: '0.5rem',
                  marginBottom: '0.5rem',
                  backgroundColor: 'var(--bg-secondary)',
                  borderRadius: '4px',
                  borderLeft: `3px solid ${getStatusColor(bundle.status)}`,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '0.8rem',
                }}
              >
                <span style={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>
                  {bundle.name}
                </span>
                <span style={{ color: 'var(--text-secondary)' }}>
                  {bundle.size} KB / {bundle.budget} KB
                </span>
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

export default BundleSizeGauge;

