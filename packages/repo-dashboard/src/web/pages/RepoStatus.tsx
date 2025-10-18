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

type SortField = 'name' | 'issues' | 'prs' | 'stale' | 'updated';
type SortOrder = 'asc' | 'desc';

export default function RepoStatus({ org, onNavigate }: RepoStatusProps) {
  const [repos, setRepos] = useState<Repository[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState('all');
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [autoRefresh, setAutoRefresh] = useState(false);

  useEffect(() => {
    if (!org) return;

    const fetchRepos = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch(`/api/repos/${org}`);
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          const errorMessage = errorData.error || `Failed to fetch repositories: ${response.statusText}`;
          throw new Error(errorMessage);
        }
        const data = await response.json();
        setRepos(data);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to fetch repositories';
        console.error('Error fetching repos:', errorMsg);
        setError(errorMsg);
      } finally {
        setLoading(false);
      }
    };

    fetchRepos();

    // Setup auto-refresh if enabled
    let interval: NodeJS.Timeout;
    if (autoRefresh) {
      interval = setInterval(fetchRepos, 30000); // Refresh every 30 seconds
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [org, autoRefresh]);

  const getStatusBadge = (status: string) => {
    const statusMap: { [key: string]: string } = {
      success: 'badge-success',
      failure: 'badge-danger',
      unknown: 'badge-warning',
      error: 'badge-danger',
    };
    return statusMap[status] || 'badge-info';
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const getSortedRepos = (reposToSort: Repository[]) => {
    const sorted = [...reposToSort];
    sorted.sort((a, b) => {
      let aVal: any = a[sortField as keyof Repository];
      let bVal: any = b[sortField as keyof Repository];

      if (sortField === 'updated') {
        aVal = new Date(a.lastUpdated).getTime();
        bVal = new Date(b.lastUpdated).getTime();
      }

      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
    return sorted;
  };

  const filteredRepos = repos.filter((repo) => {
    if (filter === 'issues') return repo.openIssues > 0;
    if (filter === 'prs') return repo.openPRs > 0;
    if (filter === 'stale') return repo.stalePRs > 0;
    return true;
  });

  const sortedRepos = getSortedRepos(filteredRepos);

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
        <div className="filter-group">
          <label htmlFor="autoRefresh">
            <input
              id="autoRefresh"
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              style={{ marginRight: '0.5rem' }}
            />
            Auto-refresh (30s)
          </label>
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
                <th style={{ cursor: 'pointer' }} onClick={() => handleSort('name')}>
                  Repository {sortField === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th style={{ cursor: 'pointer' }} onClick={() => handleSort('issues')}>
                  Issues {sortField === 'issues' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th style={{ cursor: 'pointer' }} onClick={() => handleSort('prs')}>
                  PRs {sortField === 'prs' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th style={{ cursor: 'pointer' }} onClick={() => handleSort('stale')}>
                  Stale {sortField === 'stale' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th>Workflow</th>
                <th style={{ cursor: 'pointer' }} onClick={() => handleSort('updated')}>
                  Last Updated {sortField === 'updated' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedRepos.map((repo) => (
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

