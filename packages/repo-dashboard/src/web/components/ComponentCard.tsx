import React from 'react';
import { HealthScore } from './HealthScore';

interface ComponentCardProps {
  id: string;
  name: string;
  type: 'service' | 'library' | 'ui' | 'database';
  description?: string;
  healthScore?: number;
  repositories?: string[];
  packages?: Array<{ name: string; version: string }>;
  onClick?: () => void;
}

export const ComponentCard: React.FC<ComponentCardProps> = ({
  id,
  name,
  type,
  description,
  healthScore = 75,
  repositories = [],
  packages = [],
  onClick,
}) => {
  const typeColors: Record<string, string> = {
    service: 'var(--type-service)',
    library: 'var(--type-library)',
    ui: 'var(--type-ui)',
    database: 'var(--type-database)',
  };

  return (
    <div
      onClick={onClick}
      style={{
        backgroundColor: 'var(--bg-primary)',
        border: '1px solid var(--border-color)',
        borderRadius: '4px',
        padding: '1.5rem',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.2s',
        boxShadow: 'var(--shadow-md)',
      }}
      onMouseEnter={(e) => {
        if (onClick) {
          (e.currentTarget as HTMLDivElement).style.boxShadow = 'var(--shadow-lg)';
          (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)';
        }
      }}
      onMouseLeave={(e) => {
        if (onClick) {
          (e.currentTarget as HTMLDivElement).style.boxShadow = 'var(--shadow-md)';
          (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
        }
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
        <div>
          <h3 style={{ color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
            {name}
          </h3>
          <span
            style={{
              display: 'inline-block',
              backgroundColor: typeColors[type],
              color: 'white',
              padding: '0.25rem 0.75rem',
              borderRadius: '12px',
              fontSize: '0.875rem',
              fontWeight: 500,
            }}
          >
            {type}
          </span>
        </div>
        {healthScore !== undefined && (
          <div style={{ width: '80px' }}>
            <HealthScore score={healthScore} size="small" />
          </div>
        )}
      </div>

      {description && (
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem', fontSize: '0.95rem' }}>
          {description}
        </p>
      )}

      {repositories.length > 0 && (
        <div style={{ marginBottom: '1rem' }}>
          <h4 style={{ color: 'var(--text-primary)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
            Repositories
          </h4>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {repositories.map((repo) => (
              <span
                key={repo}
                style={{
                  backgroundColor: 'var(--bg-secondary)',
                  color: 'var(--text-secondary)',
                  padding: '0.25rem 0.5rem',
                  borderRadius: '3px',
                  fontSize: '0.85rem',
                }}
              >
                {repo}
              </span>
            ))}
          </div>
        </div>
      )}

      {packages.length > 0 && (
        <div>
          <h4 style={{ color: 'var(--text-primary)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
            Packages
          </h4>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {packages.map((pkg) => (
              <span
                key={pkg.name}
                style={{
                  backgroundColor: 'var(--bg-secondary)',
                  color: 'var(--accent-color)',
                  padding: '0.25rem 0.5rem',
                  borderRadius: '3px',
                  fontSize: '0.85rem',
                  fontFamily: 'monospace',
                }}
              >
                {pkg.name}@{pkg.version}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ComponentCard;

