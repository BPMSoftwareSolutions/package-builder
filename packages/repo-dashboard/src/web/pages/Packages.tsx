import React, { useState, useEffect } from 'react';

interface LocalPackage {
  name: string;
  path: string;
  version: string;
  private: boolean;
  description?: string;
  buildReady: boolean;
  packReady: boolean;
  distExists: boolean;
  artifactsExists: boolean;
}

interface PackageReadiness {
  total: number;
  ready: number;
  packages: LocalPackage[];
}

export default function Packages() {
  const [data, setData] = useState<PackageReadiness | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState('all');
  // Default to repo-dashboard packages (ADF-aware)
  const [basePath, setBasePath] = useState('./packages/repo-dashboard');
  const [autoRefresh, setAutoRefresh] = useState(false);

  useEffect(() => {
    const fetchPackages = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch(`/api/packages?basePath=${encodeURIComponent(basePath)}`);
        if (!response.ok) {
          throw new Error(`Failed to fetch packages: ${response.statusText}`);
        }
        const data = await response.json();
        setData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch packages');
      } finally {
        setLoading(false);
      }
    };

    fetchPackages();

    // Setup auto-refresh if enabled
    let interval: NodeJS.Timeout;
    if (autoRefresh) {
      interval = setInterval(fetchPackages, 30000); // Refresh every 30 seconds
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [basePath, autoRefresh]);

  const filteredPackages = data?.packages.filter((pkg) => {
    if (filter === 'ready') return pkg.packReady;
    if (filter === 'not-ready') return !pkg.packReady;
    if (filter === 'private') return pkg.private;
    if (filter === 'public') return !pkg.private;
    return true;
  }) || [];

  return (
    <div>
      <h1>Architecture Packages (ADF-Aware)</h1>

      {error && <div className="error">{error}</div>}

      <div className="filters">
        <div className="filter-group">
          <label htmlFor="basePath">Base Path:</label>
          <input
            id="basePath"
            type="text"
            value={basePath}
            onChange={(e) => setBasePath(e.target.value)}
            placeholder="./packages"
          />
        </div>
        <div className="filter-group">
          <label htmlFor="filter">Filter:</label>
          <select
            id="filter"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="all">All Packages</option>
            <option value="ready">Ready for Pack</option>
            <option value="not-ready">Not Ready</option>
            <option value="private">Private</option>
            <option value="public">Public</option>
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
        <div className="loading">Loading packages...</div>
      ) : !data ? (
        <div className="card">
          <p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
            No packages found
          </p>
        </div>
      ) : (
        <>
          <div style={{ marginBottom: '1rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <div className="card" style={{ marginBottom: 0 }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--accent-color)' }}>
                  {data.total}
                </div>
                <div style={{ color: 'var(--text-secondary)' }}>Total Packages</div>
              </div>
            </div>
            <div className="card" style={{ marginBottom: 0 }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--severity-info)' }}>
                  {data.ready}
                </div>
                <div style={{ color: 'var(--text-secondary)' }}>Ready for Pack</div>
              </div>
            </div>
            <div className="card" style={{ marginBottom: 0 }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--severity-critical)' }}>
                  {data.total - data.ready}
                </div>
                <div style={{ color: 'var(--text-secondary)' }}>Not Ready</div>
              </div>
            </div>
          </div>

          {filteredPackages.length === 0 ? (
            <div className="card">
              <p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
                No packages found matching the filter
              </p>
            </div>
          ) : (
            <div className="grid grid-2">
              {filteredPackages.map((pkg) => (
                <div key={pkg.name} className="card">
                  <div style={{ marginBottom: '1rem' }}>
                    <h3 style={{ marginBottom: '0.5rem' }}>{pkg.name}</h3>
                    <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                      v{pkg.version}
                    </div>
                  </div>

                  {pkg.description && (
                    <p style={{ marginBottom: '1rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                      {pkg.description}
                    </p>
                  )}

                  <div style={{ marginBottom: '1rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <span className={`badge ${pkg.buildReady ? 'badge-success' : 'badge-danger'}`}>
                      {pkg.buildReady ? '✓' : '✗'} Build
                    </span>
                    <span className={`badge ${pkg.packReady ? 'badge-success' : 'badge-danger'}`}>
                      {pkg.packReady ? '✓' : '✗'} Pack
                    </span>
                    <span className={`badge ${pkg.private ? 'badge-warning' : 'badge-info'}`}>
                      {pkg.private ? 'Private' : 'Public'}
                    </span>
                  </div>

                  <div style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)', wordBreak: 'break-all' }}>
                    {pkg.path}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

