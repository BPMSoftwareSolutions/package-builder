import React, { useState } from 'react';
import { QualityMetrics } from '../../services/code-quality-collector.js';

interface QualityMetricsCardProps {
  metrics: QualityMetrics;
  onDrillDown?: () => void;
}

export const QualityMetricsCard: React.FC<QualityMetricsCardProps> = ({ metrics, onDrillDown }) => {
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

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'var(--coverage-high)'; // green
    if (score >= 60) return 'var(--coverage-medium)'; // orange
    return 'var(--coverage-low)'; // red
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'var(--severity-critical)';
      case 'high':
        return 'var(--severity-high)';
      case 'medium':
        return 'var(--severity-medium)';
      case 'low':
        return 'var(--severity-low)';
      default:
        return 'var(--severity-info)';
    }
  };

  const totalLintingIssues = metrics.lintingIssues.error + metrics.lintingIssues.warning + metrics.lintingIssues.info;
  const totalVulnerabilities = metrics.securityVulnerabilities.critical + metrics.securityVulnerabilities.high + 
                               metrics.securityVulnerabilities.medium + metrics.securityVulnerabilities.low;

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
        <h3 style={{ margin: 0, color: 'var(--text-primary)' }}>Code Quality</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '1.5rem', color: getTrendColor(metrics.qualityTrend), fontWeight: 'bold' }}>
            {getTrendIcon(metrics.qualityTrend)}
          </span>
        </div>
      </div>

      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
          Quality Score
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: getScoreColor(metrics.qualityScore) }}>
            {metrics.qualityScore.toFixed(1)}
          </div>
          <div style={{ flex: 1, height: '12px', backgroundColor: 'var(--border-color)', borderRadius: '6px', overflow: 'hidden' }}>
            <div
              style={{
                height: '100%',
                width: `${metrics.qualityScore}%`,
                backgroundColor: getScoreColor(metrics.qualityScore),
                transition: 'width 0.3s ease',
              }}
            />
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
        <div style={{ padding: '0.75rem', backgroundColor: 'var(--border-color)', borderRadius: '4px' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
            Linting Issues
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>
            {totalLintingIssues}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            E: {metrics.lintingIssues.error} W: {metrics.lintingIssues.warning}
          </div>
        </div>
        <div style={{ padding: '0.75rem', backgroundColor: 'var(--border-color)', borderRadius: '4px' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
            Type Errors
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: metrics.typeErrors > 0 ? 'var(--coverage-medium)' : 'var(--coverage-high)' }}>
            {metrics.typeErrors}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
        <div style={{ padding: '0.75rem', backgroundColor: 'var(--border-color)', borderRadius: '4px' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
            Security Vulnerabilities
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: totalVulnerabilities > 0 ? 'var(--coverage-low)' : 'var(--coverage-high)' }}>
            {totalVulnerabilities}
          </div>
        </div>
        <div style={{ padding: '0.75rem', backgroundColor: 'var(--border-color)', borderRadius: '4px' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
            Duplication
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: metrics.duplicationPercentage > 10 ? 'var(--coverage-medium)' : 'var(--coverage-high)' }}>
            {metrics.duplicationPercentage.toFixed(1)}%
          </div>
        </div>
      </div>

      {expanded && (
        <div style={{ paddingTop: '1rem', borderTop: '1px solid var(--border-color)', marginTop: '1rem' }}>
          <div style={{ marginBottom: '1rem' }}>
            <div style={{ fontSize: '0.875rem', fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
              Security Breakdown
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem', fontSize: '0.75rem' }}>
              {Object.entries(metrics.securityVulnerabilities).map(([severity, count]) => (
                <div key={severity} style={{ padding: '0.5rem', backgroundColor: 'var(--border-color)', borderRadius: '4px', textAlign: 'center' }}>
                  <div style={{ color: getSeverityColor(severity), fontWeight: 'bold', textTransform: 'capitalize' }}>
                    {severity}
                  </div>
                  <div style={{ color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                    {count}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.875rem' }}>
            <div>
              <div style={{ color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Avg Cyclomatic Complexity</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                {metrics.avgCyclomaticComplexity.toFixed(2)}
              </div>
            </div>
            <div>
              <div style={{ color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Max Cyclomatic Complexity</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                {metrics.maxCyclomaticComplexity.toFixed(2)}
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

export default QualityMetricsCard;

