import React, { useState, useEffect } from 'react';

interface Repository {
  name: string;
  owner: string;
  url: string;
  description?: string;
  isPrivate: boolean;
  topics?: string[];
  lastUpdated: string;
  openIssues: number;
  openPRs: number;
  stalePRs: number;
  lastWorkflow: string;
}

interface RepoStatusProps {
  org: string;
  onNavigate: (page: string, org?: string, repo?: string) => void;
}

export default function RepoStatus({ org, onNavigate }: RepoStatusProps) {
  const [repos, setRepos] = useState<Repository[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    if (!org) return;

    const fetchRepos = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch(`/api/repos/${org}`);
        if (!response.ok) {
          throw new Error(`Failed to fetch repositories: ${response.statusText}`);
        }
        const data = await response.json();
        setRepos(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch repositories');
      } finally {
        setLoading(false);
      }
    };

    fetchRepos();
  }, [org]);

  const getStatusBadge = (status: string) => {
    const statusMap: { [key: string]: string } = {
      success: 'badge-success',
      failure: 'badge-danger',
      unknown: 'badge-warning',
      error: 'badge-danger',
    };
    return statusMap[status] || 'badge-info';
  };

  const filteredRepos = repos.filter((repo) => {
    if (filter === 'issues') return repo.openIssues > 0;
    if (filter === 'prs') return repo.openPRs > 0;
    if (filter === 'stale') return repo.stalePRs > 0;
    return true;
  });

  if (!org) {
    return (
      <div className="error">
        Please select an organization from the dashboard
      </div>
    );
  }

  return (
    <div>
      <h1>Repository Status - {org}</h1>

      {error && <div className="error">{error}</div>}

      <div className="filters">
        <div className="filter-group">
          <label htmlFor="filter">Filter:</label>
          <select
            id="filter"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="all">All Repositories</option>
            <option value="issues">With Open Issues</option>
            <option value="prs">With Open PRs</option>
            <option value="stale">With Stale PRs</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="loading">Loading repositories...</div>
      ) : filteredRepos.length === 0 ? (
        <div className="card">
          <p style={{ textAlign: 'center', color: '#666' }}>
            No repositories found matching the filter
          </p>
        </div>
      ) : (
        <div className="card">
          <table className="table">
            <thead>
              <tr>
                <th>Repository</th>
                <th>Issues</th>
                <th>PRs</th>
                <th>Stale</th>
                <th>Workflow</th>
                <th>Last Updated</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRepos.map((repo) => (
                <tr key={repo.name}>
                  <td>
                    <a href={repo.url} target="_blank" rel="noopener noreferrer">
                      {repo.name}
                    </a>
                  </td>
                  <td>{repo.openIssues}</td>
                  <td>{repo.openPRs}</td>
                  <td>{repo.stalePRs}</td>
                  <td>
                    <span className={`badge ${getStatusBadge(repo.lastWorkflow)}`}>
                      {repo.lastWorkflow}
                    </span>
                  </td>
                  <td>{new Date(repo.lastUpdated).toLocaleDateString()}</td>
                  <td>
                    <button
                      className="btn btn-primary btn-small"
                      onClick={() => onNavigate('issues', '', `${repo.owner}/${repo.name}`)}
                    >
                      View Issues
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

