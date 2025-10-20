import React, { useState, useEffect } from 'react';

interface ArchitecturePackage {
  name: string;
  repository: string;
  version: string;
  private: boolean;
  description?: string;
  main?: string;
  types?: string;
  dependencies: number;
  devDependencies: number;
  internalDependencies: string[];
  isArchitecturePackage: boolean;
}

interface PackageResponse {
  total: number;
  packages: ArchitecturePackage[];
  dependencyMap: Record<string, string[]>;
}

export default function Packages() {
  const [data, setData] = useState<PackageResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState('all');
  const [autoRefresh, setAutoRefresh] = useState(false);

  useEffect(() => {
    const fetchPackages = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch('/api/packages');
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
  }, [autoRefresh]);

  const filteredPackages = data?.packages.filter((pkg: ArchitecturePackage) => {
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
          <label htmlFor="filter">Filter:</label>
          <select
            id="filter"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="all">All Packages</option>
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
                <div style={{ color: 'var(--text-secondary)' }}>Architecture Packages</div>
              </div>
            </div>
            <div className="card" style={{ marginBottom: 0 }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--severity-info)' }}>
                  {data.packages.filter(p => !p.private).length}
                </div>
                <div style={{ color: 'var(--text-secondary)' }}>Public Packages</div>
              </div>
            </div>
            <div className="card" style={{ marginBottom: 0 }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--severity-warning)' }}>
                  {data.packages.filter(p => p.private).length}
                </div>
                <div style={{ color: 'var(--text-secondary)' }}>Private Packages</div>
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
              {filteredPackages.map((pkg: ArchitecturePackage) => (
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
                    <span className={`badge ${pkg.private ? 'badge-warning' : 'badge-info'}`}>
                      {pkg.private ? 'Private' : 'Public'}
                    </span>
                    {pkg.types && (
                      <span className="badge badge-success">TypeScript</span>
                    )}
                  </div>

                  <div style={{ marginBottom: '1rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    <div>Dependencies: {pkg.dependencies}</div>
                    <div>Dev Dependencies: {pkg.devDependencies}</div>
                  </div>

                  {pkg.internalDependencies.length > 0 && (
                    <div style={{ marginBottom: '1rem', fontSize: '0.85rem' }}>
                      <div style={{ fontWeight: 'bold', marginBottom: '0.5rem', color: 'var(--accent-color)' }}>
                        Architecture Dependencies:
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        {pkg.internalDependencies.map((dep) => (
                          <span key={dep} className="badge badge-info" style={{ fontSize: '0.75rem' }}>
                            {dep}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)', wordBreak: 'break-all' }}>
                    Repository: {pkg.repository}
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

