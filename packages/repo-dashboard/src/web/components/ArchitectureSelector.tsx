import React, { useState, useEffect } from 'react';
import { LoadingSpinner } from './LoadingSpinner';

interface ADFMetadata {
  org: string;
  repo: string;
  path: string;
  version: string;
  name: string;
  lastUpdated: string;
}

interface ArchitectureSelectorProps {
  org: string;
  onSelect: (org: string, repo: string) => void;
  selectedRepo?: string;
}

export const ArchitectureSelector: React.FC<ArchitectureSelectorProps> = ({
  org,
  onSelect,
  selectedRepo,
}) => {
  const [adfs, setAdfs] = useState<ADFMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const fetchADFs = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/adf/${org}`);

        if (!response.ok) {
          throw new Error(`Failed to fetch ADFs: ${response.statusText}`);
        }

        const data = await response.json();
        setAdfs(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch ADFs');
        setAdfs([]);
      } finally {
        setLoading(false);
      }
    };

    fetchADFs();
  }, [org]);

  const filteredAdfs = adfs.filter(adf =>
    adf.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    adf.repo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedAdf = adfs.find(adf => adf.repo === selectedRepo);

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      {/* Dropdown Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '100%',
          padding: '0.75rem 1rem',
          backgroundColor: 'var(--bg-primary)',
          color: 'var(--text-primary)',
          border: '1px solid var(--border-color)',
          borderRadius: '4px',
          cursor: 'pointer',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '1rem',
          transition: 'all 0.2s',
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--accent-color)';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border-color)';
        }}
      >
        <span>
          {selectedAdf ? selectedAdf.name : 'Select Architecture'}
        </span>
        <span style={{ fontSize: '0.8rem' }}>
          {isOpen ? '▲' : '▼'}
        </span>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            backgroundColor: 'var(--bg-primary)',
            border: '1px solid var(--border-color)',
            borderTop: 'none',
            borderRadius: '0 0 4px 4px',
            boxShadow: 'var(--shadow-lg)',
            zIndex: 1000,
            maxHeight: '400px',
            overflowY: 'auto',
          }}
        >
          {/* Search Input */}
          <div style={{ padding: '0.75rem', borderBottom: '1px solid var(--border-color)' }}>
            <input
              type="text"
              placeholder="Search architectures..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '0.5rem',
                backgroundColor: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-color)',
                borderRadius: '3px',
                fontSize: '0.9rem',
              }}
            />
          </div>

          {/* Loading State */}
          {loading && (
            <div style={{ padding: '1rem', textAlign: 'center' }}>
              <LoadingSpinner />
            </div>
          )}

          {/* Error State */}
          {error && (
            <div style={{
              padding: '1rem',
              color: 'var(--severity-critical)',
              fontSize: '0.9rem',
            }}>
              {error}
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && filteredAdfs.length === 0 && (
            <div style={{
              padding: '1rem',
              color: 'var(--text-secondary)',
              textAlign: 'center',
              fontSize: '0.9rem',
            }}>
              {searchTerm ? 'No architectures match your search' : 'No architectures available'}
            </div>
          )}

          {/* ADF List */}
          {!loading && !error && filteredAdfs.map((adf) => (
            <div
              key={`${adf.org}/${adf.repo}`}
              onClick={() => {
                onSelect(adf.org, adf.repo);
                setIsOpen(false);
                setSearchTerm('');
              }}
              style={{
                padding: '0.75rem 1rem',
                borderBottom: '1px solid var(--border-color)',
                cursor: 'pointer',
                backgroundColor: selectedRepo === adf.repo ? 'var(--bg-secondary)' : 'transparent',
                transition: 'background-color 0.2s',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLDivElement).style.backgroundColor = 'var(--bg-secondary)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLDivElement).style.backgroundColor =
                  selectedRepo === adf.repo ? 'var(--bg-secondary)' : 'transparent';
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                <div>
                  <h4 style={{ color: 'var(--text-primary)', margin: '0 0 0.25rem 0' }}>
                    {adf.name}
                  </h4>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: 0 }}>
                    {adf.repo}
                  </p>
                </div>
                <span style={{
                  backgroundColor: 'var(--accent-color)',
                  color: 'white',
                  padding: '0.25rem 0.5rem',
                  borderRadius: '3px',
                  fontSize: '0.75rem',
                  fontFamily: 'monospace',
                  whiteSpace: 'nowrap',
                }}>
                  v{adf.version}
                </span>
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', margin: '0.25rem 0 0 0' }}>
                Updated: {new Date(adf.lastUpdated).toLocaleDateString()}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Close dropdown when clicking outside */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 999,
          }}
        />
      )}
    </div>
  );
};

export default ArchitectureSelector;

