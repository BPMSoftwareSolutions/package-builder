import React, { useState } from 'react';
import { TestMetrics } from '../../services/test-execution-collector.js';

interface TestMetricsCardProps {
  metrics: TestMetrics;
  onDrillDown?: () => void;
}

export const TestMetricsCard: React.FC<TestMetricsCardProps> = ({ metrics, onDrillDown }) => {
  const [expanded, setExpanded] = useState(false);

  const getPassRateColor = (rate: number) => {
    if (rate >= 0.95) return '#4caf50'; // green
    if (rate >= 0.85) return '#ff9800'; // orange
    return '#f44336'; // red
  };

  const getTestTypePassRate = (testType: { total: number; passed: number }) => {
    return testType.total > 0 ? (testType.passed / testType.total) : 0;
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
        <h3 style={{ margin: 0, color: 'var(--text-primary)' }}>Test Execution</h3>
        {metrics.flakyTests.length > 0 && (
          <div style={{ padding: '0.25rem 0.75rem', backgroundColor: '#ff9800', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold', color: 'white' }}>
            {metrics.flakyTests.length} Flaky
          </div>
        )}
      </div>

      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
          Pass Rate
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: getPassRateColor(metrics.passRate) }}>
            {(metrics.passRate * 100).toFixed(1)}%
          </div>
          <div style={{ flex: 1, height: '12px', backgroundColor: 'var(--border-color)', borderRadius: '6px', overflow: 'hidden' }}>
            <div
              style={{
                height: '100%',
                width: `${metrics.passRate * 100}%`,
                backgroundColor: getPassRateColor(metrics.passRate),
                transition: 'width 0.3s ease',
              }}
            />
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
        <div style={{ padding: '0.75rem', backgroundColor: 'var(--border-color)', borderRadius: '4px' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
            Total Tests
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>
            {metrics.totalTests}
          </div>
        </div>
        <div style={{ padding: '0.75rem', backgroundColor: 'var(--border-color)', borderRadius: '4px' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
            Execution Time
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>
            {metrics.totalExecutionTime}s
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
        <div style={{ padding: '0.75rem', backgroundColor: '#4caf5033', borderRadius: '4px', textAlign: 'center' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
            Passed
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#4caf50' }}>
            {metrics.passedTests}
          </div>
        </div>
        <div style={{ padding: '0.75rem', backgroundColor: '#f4433633', borderRadius: '4px', textAlign: 'center' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
            Failed
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#f44336' }}>
            {metrics.failedTests}
          </div>
        </div>
        <div style={{ padding: '0.75rem', backgroundColor: '#ff980033', borderRadius: '4px', textAlign: 'center' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
            Skipped
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#ff9800' }}>
            {metrics.skippedTests}
          </div>
        </div>
      </div>

      {expanded && (
        <div style={{ paddingTop: '1rem', borderTop: '1px solid var(--border-color)', marginTop: '1rem' }}>
          <div style={{ marginBottom: '1rem' }}>
            <div style={{ fontSize: '0.875rem', fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '0.75rem' }}>
              Test Breakdown by Type
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
              <div style={{ padding: '0.75rem', backgroundColor: 'var(--border-color)', borderRadius: '4px' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                  Unit Tests
                </div>
                <div style={{ fontSize: '1rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                  {metrics.unitTests.passed}/{metrics.unitTests.total}
                </div>
                <div style={{ fontSize: '0.75rem', color: getPassRateColor(getTestTypePassRate(metrics.unitTests)), marginTop: '0.25rem' }}>
                  {(getTestTypePassRate(metrics.unitTests) * 100).toFixed(0)}%
                </div>
              </div>
              <div style={{ padding: '0.75rem', backgroundColor: 'var(--border-color)', borderRadius: '4px' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                  Integration Tests
                </div>
                <div style={{ fontSize: '1rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                  {metrics.integrationTests.passed}/{metrics.integrationTests.total}
                </div>
                <div style={{ fontSize: '0.75rem', color: getPassRateColor(getTestTypePassRate(metrics.integrationTests)), marginTop: '0.25rem' }}>
                  {(getTestTypePassRate(metrics.integrationTests) * 100).toFixed(0)}%
                </div>
              </div>
              <div style={{ padding: '0.75rem', backgroundColor: 'var(--border-color)', borderRadius: '4px' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                  E2E Tests
                </div>
                <div style={{ fontSize: '1rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                  {metrics.e2eTests.passed}/{metrics.e2eTests.total}
                </div>
                <div style={{ fontSize: '0.75rem', color: getPassRateColor(getTestTypePassRate(metrics.e2eTests)), marginTop: '0.25rem' }}>
                  {(getTestTypePassRate(metrics.e2eTests) * 100).toFixed(0)}%
                </div>
              </div>
            </div>
          </div>

          {metrics.flakyTests.length > 0 && (
            <div style={{ marginBottom: '1rem', padding: '0.75rem', backgroundColor: '#ff980033', borderRadius: '4px' }}>
              <div style={{ fontSize: '0.875rem', fontWeight: 'bold', color: '#ff9800', marginBottom: '0.5rem' }}>
                ⚠️ Flaky Tests ({metrics.flakyTests.length})
              </div>
              <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                {metrics.flakyTests.map((test, idx) => (
                  <li key={idx}>{test}</li>
                ))}
              </ul>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.875rem' }}>
            <div>
              <div style={{ color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Avg Test Time</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                {metrics.avgTestExecutionTime}ms
              </div>
            </div>
            <div>
              <div style={{ color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Flaky Test %</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: metrics.flakyTestPercentage > 0.05 ? '#ff9800' : '#4caf50' }}>
                {(metrics.flakyTestPercentage * 100).toFixed(2)}%
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

export default TestMetricsCard;

