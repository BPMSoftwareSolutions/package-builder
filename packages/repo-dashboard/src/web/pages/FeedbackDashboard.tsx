import React, { useState, useEffect } from 'react';
import { AlertsPanel } from '../components/AlertsPanel';
import { BuildStatusCard } from '../components/BuildStatusCard';
import { TestResultsPanel } from '../components/TestResultsPanel';
import { DeploymentStatusCard } from '../components/DeploymentStatusCard';
import { FeedbackSummaryCard } from '../components/FeedbackSummaryCard';
import { useWebSocket } from '../hooks/useWebSocket';

interface FeedbackDashboardProps {
  org?: string;
  team?: string;
}

const FeedbackDashboardComponent: React.FC<FeedbackDashboardProps> = ({ org = 'BPMSoftwareSolutions', team }) => {
  const [selectedOrg, setSelectedOrg] = useState(org);
  const [selectedTeam, setSelectedTeam] = useState(team || '');
  const [selectedRepo, setSelectedRepo] = useState('');
  const [repos, setRepos] = useState<string[]>([]);
  const [teams, setTeams] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const { isConnected } = useWebSocket();

  useEffect(() => {
    const fetchRepos = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/repos?org=${selectedOrg}`);
        if (response.ok) {
          const data = await response.json();
          setRepos(data.repos || []);
          if (data.repos && data.repos.length > 0 && !selectedRepo) {
            setSelectedRepo(data.repos[0]);
          }
        }
      } catch (err) {
        console.error('Failed to fetch repos:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchRepos();
  }, [selectedOrg]);

  return (
    <div style={{
      padding: '2rem',
      backgroundColor: 'var(--background)',
      minHeight: '100vh',
      color: 'var(--text-primary)'
    }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ margin: '0 0 1rem 0', color: 'var(--text-primary)' }}>Feedback Dashboard</h1>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            flexWrap: 'wrap'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Organization:</span>
              <input
                type="text"
                value={selectedOrg}
                onChange={(e) => setSelectedOrg(e.target.value)}
                style={{
                  padding: '0.5rem',
                  borderRadius: '4px',
                  border: '1px solid var(--border-color)',
                  backgroundColor: 'var(--input-background)',
                  color: 'var(--text-primary)',
                  minWidth: '150px'
                }}
              />
            </div>

            {repos.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Repository:</span>
                <select
                  value={selectedRepo}
                  onChange={(e) => setSelectedRepo(e.target.value)}
                  style={{
                    padding: '0.5rem',
                    borderRadius: '4px',
                    border: '1px solid var(--border-color)',
                    backgroundColor: 'var(--input-background)',
                    color: 'var(--text-primary)',
                    minWidth: '150px',
                    cursor: 'pointer'
                  }}
                >
                  {repos.map((repo) => (
                    <option key={repo} value={repo}>{repo}</option>
                  ))}
                </select>
              </div>
            )}

            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginLeft: 'auto'
            }}>
              <span style={{
                display: 'inline-block',
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: isConnected ? '#4caf50' : '#f44336'
              }} />
              <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                {isConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
            Loading dashboard...
          </div>
        ) : (
          <>
            {/* Summary Row */}
            <div style={{ marginBottom: '2rem' }}>
              <FeedbackSummaryCard org={selectedOrg} team={selectedTeam} />
            </div>

            {/* Alerts and Build Status Row */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
              gap: '1.5rem',
              marginBottom: '2rem'
            }}>
              <AlertsPanel org={selectedOrg} team={selectedTeam} maxAlerts={5} />
              {selectedRepo && <BuildStatusCard org={selectedOrg} repo={selectedRepo} />}
            </div>

            {/* Test Results and Deployment Status Row */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
              gap: '1.5rem'
            }}>
              {selectedRepo && <TestResultsPanel org={selectedOrg} repo={selectedRepo} />}
              {selectedRepo && <DeploymentStatusCard org={selectedOrg} repo={selectedRepo} />}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default FeedbackDashboardComponent;

