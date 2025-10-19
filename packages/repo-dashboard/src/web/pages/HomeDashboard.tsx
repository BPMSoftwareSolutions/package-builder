import React, { useState, useEffect } from 'react';

interface SummaryData {
  organization: string;
  repos: { total: number; health: number };
  architectures: { total: number; health: number };
  packages: { total: number; health: number };
  issues: { open: number; stalePRs: number };
  recentActivity: Array<{ type: string; description: string; timestamp: string }>;
}

interface HomeDashboardProps {
  onNavigate: (page: string, data?: any) => void;
}

export default function HomeDashboard({ onNavigate }: HomeDashboardProps) {
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch('/api/summary');
        if (!response.ok) {
          throw new Error(`Failed to fetch summary: ${response.statusText}`);
        }
        const data = await response.json();
        setSummary(data);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to fetch summary';
        console.error('Error fetching summary:', errorMsg);
        setError(errorMsg);
        // Set default summary on error
        setSummary({
          organization: 'BPMSoftwareSolutions',
          repos: { total: 0, health: 0 },
          architectures: { total: 0, health: 0 },
          packages: { total: 0, health: 0 },
          issues: { open: 0, stalePRs: 0 },
          recentActivity: [],
        });
      } finally {
        setLoading(false);
      }
    };

    fetchSummary();
  }, []);

  if (loading) {
    return <div className="loading">Loading dashboard...</div>;
  }

  if (!summary) {
    return <div className="error">Failed to load dashboard</div>;
  }

  const getHealthColor = (health: number) => {
    if (health >= 80) return '#28a745';
    if (health >= 60) return '#ffc107';
    return '#dc3545';
  };

  return (
    <div>
      <h1>{summary.organization} Dashboard</h1>
      <p style={{ marginBottom: '2rem', color: '#666' }}>
        Comprehensive summary of your organization's repositories, architectures, and packages
      </p>

      {error && <div className="error" style={{ marginBottom: '1rem' }}>{error}</div>}

      <div className="grid grid-3">
        {/* Repositories Card */}
        <div className="card" style={{ cursor: 'pointer' }} onClick={() => onNavigate('repos', { org: 'BPMSoftwareSolutions' })}>
          <div className="card-header">📦 Repositories</div>
          <div className="card-body" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
              {summary.repos.total}
            </div>
            <div style={{ color: '#666', marginBottom: '1rem' }}>repositories</div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
              <span style={{ color: '#666' }}>Health:</span>
              <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: getHealthColor(summary.repos.health) }}>
                {summary.repos.health}%
              </span>
            </div>
          </div>
        </div>

        {/* Architectures Card */}
        <div className="card" style={{ cursor: 'pointer' }} onClick={() => onNavigate('architecture')}>
          <div className="card-header">🏗️ Architectures</div>
          <div className="card-body" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
              {summary.architectures.total}
            </div>
            <div style={{ color: '#666', marginBottom: '1rem' }}>architectures</div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
              <span style={{ color: '#666' }}>Health:</span>
              <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: getHealthColor(summary.architectures.health) }}>
                {summary.architectures.health}%
              </span>
            </div>
          </div>
        </div>

        {/* Packages Card */}
        <div className="card" style={{ cursor: 'pointer' }} onClick={() => onNavigate('packages')}>
          <div className="card-header">📚 Packages</div>
          <div className="card-body" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
              {summary.packages.total}
            </div>
            <div style={{ color: '#666', marginBottom: '1rem' }}>packages</div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
              <span style={{ color: '#666' }}>Health:</span>
              <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: getHealthColor(summary.packages.health) }}>
                {summary.packages.health}%
              </span>
            </div>
          </div>
        </div>

        {/* Issues Card */}
        <div className="card" style={{ cursor: 'pointer' }} onClick={() => onNavigate('issues', { repo: 'BPMSoftwareSolutions/package-builder' })}>
          <div className="card-header">🐛 Issues</div>
          <div className="card-body" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '0.5rem', color: '#0366d6' }}>
              {summary.issues.open}
            </div>
            <div style={{ color: '#666', marginBottom: '1rem' }}>open issues</div>
            <div style={{ fontSize: '0.9rem', color: '#666' }}>
              {summary.issues.stalePRs} stale PRs
            </div>
          </div>
        </div>

        {/* Metrics Card */}
        <div className="card" style={{ cursor: 'pointer' }} onClick={() => onNavigate('metrics')}>
          <div className="card-header">📊 Metrics</div>
          <div className="card-body" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '1rem' }}>
              DORA Metrics
            </div>
            <div style={{ color: '#666', fontSize: '0.9rem' }}>
              View deployment frequency, lead time, MTTR, and change failure rate
            </div>
          </div>
        </div>

        {/* Insights Card */}
        <div className="card" style={{ cursor: 'pointer' }} onClick={() => onNavigate('insights')}>
          <div className="card-header">💡 Insights</div>
          <div className="card-body" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '1rem' }}>
              AI-Powered Analysis
            </div>
            <div style={{ color: '#666', fontSize: '0.9rem' }}>
              Trends, anomalies, and recommendations
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity Section */}
      {summary.recentActivity && summary.recentActivity.length > 0 && (
        <div style={{ marginTop: '2rem' }}>
          <h2>Recent Activity</h2>
          <div className="card">
            <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
              {summary.recentActivity.map((activity, index) => (
                <div key={index} style={{ padding: '0.5rem 0', borderBottom: index < summary.recentActivity.length - 1 ? '1px solid #eee' : 'none' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>{activity.description}</span>
                    <span style={{ color: '#999', fontSize: '0.85rem' }}>
                      {new Date(activity.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

