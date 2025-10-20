import React, { useState, useEffect } from 'react';

interface TestResults {
  passCount: number;
  failCount: number;
  skipCount: number;
  coverage: number;
  coverageTrend: 'improving' | 'stable' | 'degrading';
  executionTime: number;
  failedTests: Array<{ name: string; error: string }>;
  coverageByModule: Record<string, number>;
}

interface TestResultsPanelProps {
  org: string;
  repo: string;
  onCoverageChange?: (coverage: number) => void;
}

export const TestResultsPanel: React.FC<TestResultsPanelProps> = ({ org, repo, onCoverageChange }) => {
  const [testResults, setTestResults] = useState<TestResults | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedModule, setExpandedModule] = useState<string | null>(null);

  useEffect(() => {
    const fetchTestResults = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/metrics/test-results/${org}/${repo}`);
        if (!response.ok) throw new Error('Failed to fetch test results');
        const data = await response.json();
        setTestResults(data.testResults || data);
        onCoverageChange?.(data.testResults?.coverage || data.coverage);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        setTestResults(null);
      } finally {
        setLoading(false);
      }
    };

    fetchTestResults();
    const interval = setInterval(fetchTestResults, 60000); // Refresh every 60 seconds
    return () => clearInterval(interval);
  }, [org, repo, onCoverageChange]);

  const getCoverageColor = (coverage: number) => {
    if (coverage >= 80) return 'var(--severity-info)';
    if (coverage >= 60) return 'var(--severity-medium)';
    return 'var(--severity-critical)';
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving': return '↑';
      case 'degrading': return '↓';
      default: return '→';
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'improving': return 'var(--severity-info)';
      case 'degrading': return 'var(--severity-critical)';
      default: return 'var(--severity-medium)';
    }
  };

  if (loading) {
    return <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading test results...</div>;
  }

  if (!testResults) {
    return <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-secondary)' }}>No test data available</div>;
  }

  const totalTests = testResults.passCount + testResults.failCount + testResults.skipCount;
  const passRate = totalTests > 0 ? (testResults.passCount / totalTests) * 100 : 0;

  return (
    <div style={{
      border: '1px solid var(--border-color)',
      borderRadius: '8px',
      padding: '1.5rem',
      backgroundColor: 'var(--card-background)',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
    }}>
      <h3 style={{ margin: '0 0 1rem 0', color: 'var(--text-primary)' }}>Test Results</h3>

      {error && (
        <div style={{
          padding: '1rem',
          backgroundColor: 'rgba(244, 67, 54, 0.1)',
          color: 'var(--severity-critical)',
          borderRadius: '4px',
          marginBottom: '1rem'
        }}>
          Error: {error}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
        <div style={{ padding: '1rem', backgroundColor: 'var(--input-background)', borderRadius: '4px' }}>
          <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
            Pass Rate
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: getCoverageColor(passRate) }}>
            {passRate.toFixed(1)}%
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
            {testResults.passCount} passed, {testResults.failCount} failed, {testResults.skipCount} skipped
          </div>
        </div>
        <div style={{ padding: '1rem', backgroundColor: 'var(--input-background)', borderRadius: '4px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Coverage</span>
            <span style={{ fontSize: '1rem', color: getTrendColor(testResults.coverageTrend), fontWeight: 'bold' }}>
              {getTrendIcon(testResults.coverageTrend)}
            </span>
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: getCoverageColor(testResults.coverage) }}>
            {testResults.coverage.toFixed(1)}%
          </div>
        </div>
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', fontWeight: 'bold' }}>
          Execution Time
        </div>
        <div style={{ fontSize: '1rem', color: 'var(--text-primary)' }}>
          {(testResults.executionTime / 1000).toFixed(2)}s
        </div>
      </div>

      {testResults.failedTests && testResults.failedTests.length > 0 && (
        <div style={{ marginBottom: '1rem' }}>
          <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', fontWeight: 'bold' }}>
            Failed Tests ({testResults.failedTests.length})
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {testResults.failedTests.slice(0, 3).map((test, idx) => (
              <div key={idx} style={{
                padding: '0.5rem',
                backgroundColor: 'rgba(244, 67, 54, 0.1)',
                borderLeft: '3px solid var(--severity-critical)',
                borderRadius: '2px',
                fontSize: '0.75rem'
              }}>
                <div style={{ fontWeight: 'bold', color: 'var(--severity-critical)' }}>{test.name}</div>
                <div style={{ color: 'var(--severity-critical)', marginTop: '0.25rem' }}>{test.error}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {testResults.coverageByModule && Object.keys(testResults.coverageByModule).length > 0 && (
        <div>
          <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', fontWeight: 'bold' }}>
            Coverage by Module
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {Object.entries(testResults.coverageByModule).slice(0, 5).map(([module, coverage]) => (
              <div key={module} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{module}</span>
                <span style={{ fontSize: '0.875rem', fontWeight: 'bold', color: getCoverageColor(coverage) }}>
                  {coverage.toFixed(1)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

