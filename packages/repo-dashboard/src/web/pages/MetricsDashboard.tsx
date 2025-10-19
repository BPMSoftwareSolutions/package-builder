import React, { useState, useEffect } from 'react';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { MetricsChart } from '../components/MetricsChart';
import { HealthScore } from '../components/HealthScore';
import { TrendChart } from '../components/TrendChart';

interface MetricsDashboardProps {
  onNavigate?: (page: string, data?: any) => void;
}

export const MetricsDashboard: React.FC<MetricsDashboardProps> = ({ onNavigate }) => {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<any>(null);
  const [timePeriod, setTimePeriod] = useState<7 | 30 | 90>(30);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchMetrics();
  }, [timePeriod]);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/metrics?days=${timePeriod}`);
      if (!response.ok) throw new Error('Failed to fetch metrics');
      const data = await response.json();
      setMetrics(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner message="Loading metrics..." />;

  if (error) {
    return (
      <div className="error">
        <h2>Error</h2>
        <p>{error}</p>
        <button onClick={fetchMetrics} className="btn btn-primary">
          Retry
        </button>
      </div>
    );
  }

  const summary = metrics?.summary || {};
  const byRepository = metrics?.byRepository || {};
  const trends = metrics?.trends || {};

  const repoData = Object.entries(byRepository).map(([name, data]: [string, any]) => ({
    name,
    healthScore: data.healthScore * 100,
    testCoverage: data.testCoverage * 100,
    buildSuccessRate: data.buildSuccessRate * 100,
  }));

  return (
    <div>
      <h1 style={{ marginBottom: '2rem', color: 'var(--text-primary)' }}>
        Metrics Dashboard
      </h1>

      {/* Time Period Selector */}
      <div style={{ marginBottom: '2rem', display: 'flex', gap: '1rem' }}>
        {[7, 30, 90].map((period) => (
          <button
            key={period}
            onClick={() => setTimePeriod(period as 7 | 30 | 90)}
            className={`btn ${timePeriod === period ? 'btn-primary' : 'btn-secondary'}`}
          >
            Last {period} Days
          </button>
        ))}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-4" style={{ marginBottom: '2rem' }}>
        <div className="card">
          <div className="card-header">Overall Health</div>
          <div className="card-body" style={{ display: 'flex', justifyContent: 'center' }}>
            <HealthScore score={summary.healthScore * 100 || 75} size="medium" />
          </div>
        </div>
        <div className="card">
          <div className="card-header">Build Success Rate</div>
          <div className="card-body" style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--success-color)' }}>
            {(summary.buildSuccessRate * 100 || 0).toFixed(1)}%
          </div>
        </div>
        <div className="card">
          <div className="card-header">Test Coverage</div>
          <div className="card-body" style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--info-color)' }}>
            {(summary.testCoverageAvg * 100 || 0).toFixed(1)}%
          </div>
        </div>
        <div className="card">
          <div className="card-header">Deployment Frequency</div>
          <div className="card-body" style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--accent-color)' }}>
            {(summary.deploymentFrequency || 0).toFixed(2)}/day
          </div>
        </div>
      </div>

      {/* DORA Metrics */}
      <div className="grid grid-2" style={{ marginBottom: '2rem' }}>
        <div className="card">
          <div className="card-header">Lead Time for Changes</div>
          <div className="card-body" style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
            {(summary.leadTimeForChanges || 0).toFixed(1)} hours
          </div>
        </div>
        <div className="card">
          <div className="card-header">Mean Time to Recovery</div>
          <div className="card-body" style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
            {(summary.meanTimeToRecovery || 0).toFixed(1)} hours
          </div>
        </div>
      </div>

      {/* Trends */}
      {trends.healthScoreTrend && (
        <div style={{ marginBottom: '2rem', padding: '1rem', backgroundColor: 'var(--bg-secondary)', borderRadius: '4px' }}>
          <TrendChart
            data={trends.healthScoreTrend.map((score: number, idx: number) => ({
              date: `Day ${idx + 1}`,
              score: score * 100,
            }))}
            dataKey="score"
            title="Health Score Trend"
            showTrendLine
          />
        </div>
      )}

      {/* Repository Metrics */}
      {repoData.length > 0 && (
        <div style={{ marginBottom: '2rem', padding: '1rem', backgroundColor: 'var(--bg-secondary)', borderRadius: '4px' }}>
          <MetricsChart
            data={repoData}
            type="bar"
            dataKey="healthScore"
            xAxisKey="name"
            title="Repository Health Scores"
          />
        </div>
      )}

      {/* Repository Details Table */}
      {Object.keys(byRepository).length > 0 && (
        <div className="card">
          <div className="card-header">Repository Details</div>
          <table className="table">
            <thead>
              <tr>
                <th>Repository</th>
                <th>Health Score</th>
                <th>Build Status</th>
                <th>Test Coverage</th>
                <th>Open Issues</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(byRepository).map(([name, data]: [string, any]) => (
                <tr key={name}>
                  <td>{name}</td>
                  <td>{(data.healthScore * 100).toFixed(1)}%</td>
                  <td>
                    <span className={`badge badge-${data.buildStatus === 'success' ? 'success' : 'danger'}`}>
                      {data.buildStatus}
                    </span>
                  </td>
                  <td>{(data.testCoverage * 100).toFixed(1)}%</td>
                  <td>{data.openIssues}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default MetricsDashboard;

