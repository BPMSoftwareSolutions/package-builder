import React, { useState } from 'react';
import { CoverageMetrics } from '../../services/test-coverage-collector.js';

interface CoverageCardProps {
  metrics: CoverageMetrics;
  onDrillDown?: () => void;
}

export const CoverageCard: React.FC<CoverageCardProps> = ({ metrics, onDrillDown }) => {
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

  const getCoverageColor = (coverage: number) => {
    if (coverage >= 80) return '#4caf50'; // green
    if (coverage >= 60) return '#ff9800'; // orange
    return '#f44336'; // red
  };

  const avgCoverage = (metrics.lineCoverage + metrics.branchCoverage + metrics.functionCoverage + metrics.statementCoverage) / 4;

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
        <h3 style={{ margin: 0, color: 'var(--text-primary)' }}>Test Coverage</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '1.5rem', color: getTrendColor(metrics.coverageTrend), fontWeight: 'bold' }}>
            {getTrendIcon(metrics.coverageTrend)}
          </span>
          <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            {metrics.percentageChange > 0 ? '+' : ''}{metrics.percentageChange}%
          </span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
        <div>
          <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
            Line Coverage
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 'bold', color: getCoverageColor(metrics.lineCoverage) }}>
            {metrics.lineCoverage.toFixed(1)}%
          </div>
        </div>
        <div>
          <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
            Branch Coverage
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 'bold', color: getCoverageColor(metrics.branchCoverage) }}>
            {metrics.branchCoverage.toFixed(1)}%
          </div>
        </div>
        <div>
          <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
            Function Coverage
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 'bold', color: getCoverageColor(metrics.functionCoverage) }}>
            {metrics.functionCoverage.toFixed(1)}%
          </div>
        </div>
        <div>
          <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
            Statement Coverage
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 'bold', color: getCoverageColor(metrics.statementCoverage) }}>
            {metrics.statementCoverage.toFixed(1)}%
          </div>
        </div>
      </div>

      <div style={{ marginBottom: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
        <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
          Average Coverage
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ flex: 1, height: '8px', backgroundColor: 'var(--border-color)', borderRadius: '4px', overflow: 'hidden' }}>
            <div
              style={{
                height: '100%',
                width: `${avgCoverage}%`,
                backgroundColor: getCoverageColor(avgCoverage),
                transition: 'width 0.3s ease',
              }}
            />
          </div>
          <div style={{ fontSize: '1rem', fontWeight: 'bold', color: getCoverageColor(avgCoverage), minWidth: '50px' }}>
            {avgCoverage.toFixed(1)}%
          </div>
        </div>
      </div>

      {expanded && (
        <div style={{ paddingTop: '1rem', borderTop: '1px solid var(--border-color)', marginTop: '1rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.875rem' }}>
            <div>
              <div style={{ color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Uncovered Lines</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                {metrics.uncoveredLines}
              </div>
            </div>
            <div>
              <div style={{ color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Uncovered Branches</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                {metrics.uncoveredBranches}
              </div>
            </div>
            <div>
              <div style={{ color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Critical Path Coverage</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: getCoverageColor(metrics.criticalPathCoverage) }}>
                {metrics.criticalPathCoverage.toFixed(1)}%
              </div>
            </div>
            <div>
              <div style={{ color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Last Updated</div>
              <div style={{ fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                {new Date(metrics.timestamp).toLocaleDateString()}
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
                marginTop: '1rem',
                padding: '0.5rem 1rem',
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

export default CoverageCard;

