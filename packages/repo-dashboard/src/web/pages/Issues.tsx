import React, { useState, useEffect } from 'react';

interface Issue {
  number: number;
  title: string;
  state: 'open' | 'closed';
  isPullRequest: boolean;
  createdAt: string;
  updatedAt: string;
  url: string;
  author: string;
}

interface IssuesProps {
  repo?: string;
}

const DEFAULT_REPO = 'BPMSoftwareSolutions/package-builder';

export default function Issues({ repo = DEFAULT_REPO }: IssuesProps) {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [state, setState] = useState<'open' | 'closed' | 'all'>('open');
  const [searchTerm, setSearchTerm] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(false);

  useEffect(() => {
    if (!repo) return;

    const fetchIssues = async () => {
      try {
        setLoading(true);
        setError(null);
        const [owner, repoName] = repo.split('/');
        const response = await fetch(`/api/repos/${owner}/${repoName}/issues?state=${state}`);
        if (!response.ok) {
          throw new Error(`Failed to fetch issues: ${response.statusText}`);
        }
        const data = await response.json();
        setIssues(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch issues');
      } finally {
        setLoading(false);
      }
    };

    fetchIssues();

    // Setup auto-refresh if enabled
    let interval: NodeJS.Timeout;
    if (autoRefresh) {
      interval = setInterval(fetchIssues, 30000); // Refresh every 30 seconds
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [repo, state, autoRefresh]);

  const filteredIssues = issues.filter((issue) =>
    issue.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const issueCount = issues.filter((i) => !i.isPullRequest).length;
  const prCount = issues.filter((i) => i.isPullRequest).length;

  return (
    <div>
      <h1>Issues & PRs - {repo}</h1>

      {error && <div className="error">{error}</div>}

      <div className="filters">
        <div className="filter-group">
          <label htmlFor="state">State:</label>
          <select
            id="state"
            value={state}
            onChange={(e) => setState(e.target.value as 'open' | 'closed' | 'all')}
          >
            <option value="open">Open</option>
            <option value="closed">Closed</option>
            <option value="all">All</option>
          </select>
        </div>
        <div className="filter-group">
          <label htmlFor="search">Search:</label>
          <input
            id="search"
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search issues..."
          />
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

      <div style={{ marginBottom: '1rem', display: 'flex', gap: '1rem' }}>
        <div className="card" style={{ flex: 1, marginBottom: 0 }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#0366d6' }}>
              {issueCount}
            </div>
            <div style={{ color: '#666' }}>Issues</div>
          </div>
        </div>
        <div className="card" style={{ flex: 1, marginBottom: 0 }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#6f42c1' }}>
              {prCount}
            </div>
            <div style={{ color: '#666' }}>Pull Requests</div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="loading">Loading issues...</div>
      ) : filteredIssues.length === 0 ? (
        <div className="card">
          <p style={{ textAlign: 'center', color: '#666' }}>
            No issues found
          </p>
        </div>
      ) : (
        <div className="grid grid-1">
          {filteredIssues.map((issue) => (
            <div key={issue.number} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                <div style={{ flex: 1 }}>
                  <h3 style={{ marginBottom: '0.5rem' }}>
                    <a href={issue.url} target="_blank" rel="noopener noreferrer">
                      #{issue.number} {issue.title}
                    </a>
                  </h3>
                  <div style={{ display: 'flex', gap: '1rem', fontSize: '0.9rem', color: '#666' }}>
                    <span>
                      {issue.isPullRequest ? '🔀 PR' : '🐛 Issue'}
                    </span>
                    <span>by {issue.author}</span>
                    <span>
                      {new Date(issue.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <span className={`badge ${issue.state === 'open' ? 'badge-success' : 'badge-danger'}`}>
                  {issue.state}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

