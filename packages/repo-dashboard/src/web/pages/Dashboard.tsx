import React, { useState } from 'react';

interface DashboardProps {
  onNavigate: (page: string, org?: string, repo?: string) => void;
}

export default function Dashboard({ onNavigate }: DashboardProps) {
  const [org, setOrg] = useState('');
  const [repo, setRepo] = useState('');

  const handleOrgSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (org.trim()) {
      onNavigate('repos', org);
    }
  };

  const handleRepoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (repo.trim()) {
      onNavigate('issues', '', repo);
    }
  };

  return (
    <div>
      <h1>Repository Dashboard</h1>
      <p style={{ marginBottom: '2rem', color: '#666' }}>
        Manage and monitor your repositories, issues, and packages
      </p>

      <div className="grid grid-2">
        <div className="card">
          <div className="card-header">📦 Organization Repositories</div>
          <div className="card-body">
            <p style={{ marginBottom: '1rem', color: '#666' }}>
              View all repositories in an organization with their status
            </p>
            <form onSubmit={handleOrgSubmit}>
              <div style={{ marginBottom: '1rem' }}>
                <label htmlFor="org" style={{ display: 'block', marginBottom: '0.5rem' }}>
                  Organization Name:
                </label>
                <input
                  id="org"
                  type="text"
                  value={org}
                  onChange={(e) => setOrg(e.target.value)}
                  placeholder="e.g., BPMSoftwareSolutions"
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                  }}
                />
              </div>
              <button type="submit" className="btn btn-primary">
                View Repositories
              </button>
            </form>
          </div>
        </div>

        <div className="card">
          <div className="card-header">🐛 Repository Issues</div>
          <div className="card-body">
            <p style={{ marginBottom: '1rem', color: '#666' }}>
              View issues and pull requests for a specific repository
            </p>
            <form onSubmit={handleRepoSubmit}>
              <div style={{ marginBottom: '1rem' }}>
                <label htmlFor="repo" style={{ display: 'block', marginBottom: '0.5rem' }}>
                  Repository (owner/repo):
                </label>
                <input
                  id="repo"
                  type="text"
                  value={repo}
                  onChange={(e) => setRepo(e.target.value)}
                  placeholder="e.g., BPMSoftwareSolutions/package-builder"
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                  }}
                />
              </div>
              <button type="submit" className="btn btn-primary">
                View Issues
              </button>
            </form>
          </div>
        </div>

        <div className="card">
          <div className="card-header">📚 Local Packages</div>
          <div className="card-body">
            <p style={{ marginBottom: '1rem', color: '#666' }}>
              View local packages and their build/pack status
            </p>
            <button
              onClick={() => onNavigate('packages')}
              className="btn btn-primary"
            >
              View Packages
            </button>
          </div>
        </div>

        <div className="card">
          <div className="card-header">ℹ️ About</div>
          <div className="card-body">
            <p style={{ marginBottom: '0.5rem' }}>
              <strong>Repository Dashboard v0.1.0</strong>
            </p>
            <p style={{ color: '#666', fontSize: '0.9rem' }}>
              A web UI for managing repositories, issues, and packages across your organization.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

