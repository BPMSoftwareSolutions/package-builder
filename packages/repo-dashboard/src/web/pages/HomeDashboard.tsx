import React, { useState, useEffect } from 'react';
import { ArchitectureSelector } from '../components/ArchitectureSelector';

interface SummaryData {
  organization?: string;
  repos?: { total: number; health: number };
  architectures?: { total: number; health: number };
  packages?: { total: number; health: number };
  issues?: { open: number; stalePRs: number };
  recentActivity?: Array<{ type: string; description: string; timestamp: string }>;
  // Architecture-aware summary fields
  architecture?: { name: string; version: string; description?: string };
  repositories?: Array<{ name: string; owner: string; health: number; issues: { open: number; stalePRs: number } }>;
  containers?: Array<{ id: string; name: string; type: string; description: string; healthScore: number; repository?: string }>;
  aggregatedMetrics?: { overallHealth: number; totalIssues: number; stalePRs: number; testCoverage: number; buildStatus: string };
  relationships?: Array<{ from: string; to: string; type: string; description: string }>;
}

interface HomeDashboardProps {
  onNavigate: (page: string, data?: any) => void;
}

export default function HomeDashboard({ onNavigate }: HomeDashboardProps) {
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedArchOrg, setSelectedArchOrg] = useState<string>('BPMSoftwareSolutions');
  const [selectedArchRepo, setSelectedArchRepo] = useState<string | null>(null);
  const [isArchitectureMode, setIsArchitectureMode] = useState(true);
  const [defaultArchLoaded, setDefaultArchLoaded] = useState(false);
  const [showArchitectureSelector, setShowArchitectureSelector] = useState(false);

  // Load default architecture on component mount
  useEffect(() => {
    const loadDefaultArchitecture = async () => {
      try {
        const response = await fetch('/api/config');
        if (response.ok) {
          const config = await response.json();
          setSelectedArchOrg(config.defaultArchitectureOrg);
          setSelectedArchRepo(config.defaultArchitectureRepo);
          setDefaultArchLoaded(true);
        }
      } catch (err) {
        console.warn('Failed to load default architecture config:', err);
        // Use hardcoded defaults
        setSelectedArchRepo('renderx-plugins-demo');
        setDefaultArchLoaded(true);
      }
    };

    if (!defaultArchLoaded) {
      loadDefaultArchitecture();
    }
  }, [defaultArchLoaded]);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        setLoading(true);
        setError(null);

        let url = '/api/summary';
        if (isArchitectureMode && selectedArchRepo) {
          url = `/api/summary/architecture/${selectedArchOrg}/${selectedArchRepo}`;
        }

        const response = await fetch(url);
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

    if (defaultArchLoaded) {
      fetchSummary();
    }
  }, [isArchitectureMode, selectedArchOrg, selectedArchRepo, defaultArchLoaded]);

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

  const handleArchitectureSelect = (org: string, repo: string) => {
    setSelectedArchOrg(org);
    setSelectedArchRepo(repo);
    setIsArchitectureMode(true);
    setShowArchitectureSelector(false);
  };

  const handleBackToOrganization = () => {
    setIsArchitectureMode(false);
    setSelectedArchRepo(null);
  };

  const handleSwitchArchitecture = () => {
    setShowArchitectureSelector(!showArchitectureSelector);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h1>
          {isArchitectureMode && summary?.architecture
            ? `${summary.architecture.name} Architecture Dashboard`
            : `${summary?.organization || 'BPMSoftwareSolutions'} Dashboard`}
        </h1>
        {isArchitectureMode && (
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={handleSwitchArchitecture}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#0366d6',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '0.9rem'
              }}
            >
              🔄 Switch Architecture
            </button>
            <button
              onClick={handleBackToOrganization}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '0.9rem'
              }}
            >
              ← Back to Organization
            </button>
          </div>
        )}
      </div>

      {isArchitectureMode && summary?.architecture && (
        <div style={{ marginBottom: '2rem', padding: '1rem', backgroundColor: '#f8f9fa', borderRadius: '4px', borderLeft: '4px solid #0366d6' }}>
          <h3 style={{ margin: '0 0 0.5rem 0' }}>{summary.architecture.name}</h3>
          <p style={{ margin: '0 0 0.5rem 0', color: '#666' }}>Version: {summary.architecture.version}</p>
          {summary.architecture.description && (
            <p style={{ margin: 0, color: '#666' }}>{summary.architecture.description}</p>
          )}
        </div>
      )}

      {showArchitectureSelector && (
        <div style={{ marginBottom: '2rem', padding: '1rem', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
          <h3 style={{ margin: '0 0 1rem 0' }}>Select an Architecture</h3>
          <ArchitectureSelector
            org={selectedArchOrg}
            onSelect={handleArchitectureSelect}
            selectedRepo={selectedArchRepo || undefined}
          />
        </div>
      )}

      <p style={{ marginBottom: '2rem', color: '#666' }}>
        {isArchitectureMode
          ? 'Architecture-specific summary with filtered repositories and components'
          : 'Comprehensive summary of your organization\'s repositories, architectures, and packages'}
      </p>

      {error && <div className="error" style={{ marginBottom: '1rem' }}>{error}</div>}

      {isArchitectureMode && summary?.aggregatedMetrics ? (
        // Architecture-specific cards
        <div className="grid grid-3">
          {/* Overall Health Card */}
          <div className="card">
            <div className="card-header">💪 Overall Health</div>
            <div className="card-body" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '0.5rem', color: getHealthColor(summary.aggregatedMetrics.overallHealth) }}>
                {summary.aggregatedMetrics.overallHealth.toFixed(1)}%
              </div>
              <div style={{ color: '#666' }}>architecture health</div>
            </div>
          </div>

          {/* Repositories Card */}
          <div className="card">
            <div className="card-header">📦 Repositories</div>
            <div className="card-body" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                {summary.repositories?.length || 0}
              </div>
              <div style={{ color: '#666', marginBottom: '1rem' }}>in architecture</div>
              <div style={{ fontSize: '0.9rem', color: '#666' }}>
                {summary.aggregatedMetrics.totalIssues} issues
              </div>
            </div>
          </div>

          {/* Containers Card */}
          <div className="card">
            <div className="card-header">🏗️ Containers</div>
            <div className="card-body" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                {summary.containers?.length || 0}
              </div>
              <div style={{ color: '#666', marginBottom: '1rem' }}>components</div>
              <div style={{ fontSize: '0.9rem', color: '#666' }}>
                {summary.relationships?.length || 0} relationships
              </div>
            </div>
          </div>

          {/* Test Coverage Card */}
          <div className="card">
            <div className="card-header">✅ Test Coverage</div>
            <div className="card-body" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '0.5rem', color: getHealthColor(summary.aggregatedMetrics.testCoverage * 100) }}>
                {(summary.aggregatedMetrics.testCoverage * 100).toFixed(1)}%
              </div>
              <div style={{ color: '#666' }}>coverage</div>
            </div>
          </div>

          {/* Build Status Card */}
          <div className="card">
            <div className="card-header">🔨 Build Status</div>
            <div className="card-body" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem', color: summary.aggregatedMetrics.buildStatus === 'success' ? '#28a745' : '#dc3545' }}>
                {summary.aggregatedMetrics.buildStatus.toUpperCase()}
              </div>
              <div style={{ color: '#666' }}>latest build</div>
            </div>
          </div>

          {/* Stale PRs Card */}
          <div className="card">
            <div className="card-header">⏳ Stale PRs</div>
            <div className="card-body" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '0.5rem', color: summary.aggregatedMetrics.stalePRs > 0 ? '#ffc107' : '#28a745' }}>
                {summary.aggregatedMetrics.stalePRs}
              </div>
              <div style={{ color: '#666' }}>stale pull requests</div>
            </div>
          </div>
        </div>
      ) : (
        // Organization-wide cards
        <div className="grid grid-3">
          {/* Repositories Card */}
          <div className="card" style={{ cursor: 'pointer' }} onClick={() => onNavigate('repos', { org: 'BPMSoftwareSolutions' })}>
            <div className="card-header">📦 Repositories</div>
            <div className="card-body" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                {summary?.repos?.total || 0}
              </div>
              <div style={{ color: '#666', marginBottom: '1rem' }}>repositories</div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                <span style={{ color: '#666' }}>Health:</span>
                <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: getHealthColor(summary?.repos?.health || 0) }}>
                  {summary?.repos?.health?.toFixed(1) || 0}%
                </span>
              </div>
            </div>
          </div>

          {/* Architectures Card */}
          <div className="card" style={{ cursor: 'pointer' }} onClick={() => onNavigate('architecture')}>
            <div className="card-header">🏗️ Architectures</div>
            <div className="card-body" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                {summary?.architectures?.total || 0}
              </div>
              <div style={{ color: '#666', marginBottom: '1rem' }}>architectures</div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                <span style={{ color: '#666' }}>Health:</span>
                <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: getHealthColor(summary?.architectures?.health || 0) }}>
                  {summary?.architectures?.health?.toFixed(1) || 0}%
                </span>
              </div>
            </div>
          </div>

          {/* Packages Card */}
          <div className="card" style={{ cursor: 'pointer' }} onClick={() => onNavigate('packages')}>
            <div className="card-header">📚 Packages</div>
            <div className="card-body" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                {summary?.packages?.total || 0}
              </div>
              <div style={{ color: '#666', marginBottom: '1rem' }}>packages</div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                <span style={{ color: '#666' }}>Health:</span>
                <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: getHealthColor(summary?.packages?.health || 0) }}>
                  {summary?.packages?.health?.toFixed(1) || 0}%
                </span>
              </div>
            </div>
          </div>

          {/* Issues Card */}
          <div className="card" style={{ cursor: 'pointer' }} onClick={() => onNavigate('issues', { repo: 'BPMSoftwareSolutions/package-builder' })}>
            <div className="card-header">🐛 Issues</div>
            <div className="card-body" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '0.5rem', color: '#0366d6' }}>
                {summary?.issues?.open || 0}
              </div>
              <div style={{ color: '#666', marginBottom: '1rem' }}>open issues</div>
              <div style={{ fontSize: '0.9rem', color: '#666' }}>
                {summary?.issues?.stalePRs || 0} stale PRs
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
      )}

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

