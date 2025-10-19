import React, { useState, useEffect } from 'react';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { C4Diagram } from '../components/C4Diagram';
import { DependencyGraph } from '../components/DependencyGraph';
import { ComponentCard } from '../components/ComponentCard';

interface ArchitectureDashboardProps {
  onNavigate?: (page: string, data?: any) => void;
}

export const ArchitectureDashboard: React.FC<ArchitectureDashboardProps> = ({ onNavigate }) => {
  const [loading, setLoading] = useState(true);
  const [architecture, setArchitecture] = useState<any>(null);
  const [selectedLevel, setSelectedLevel] = useState<'system' | 'container' | 'component'>('container');
  const [diagram, setDiagram] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchArchitecture();
  }, []);

  useEffect(() => {
    if (architecture) {
      fetchDiagram(selectedLevel);
    }
  }, [selectedLevel, architecture]);

  const fetchArchitecture = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/architecture');
      if (!response.ok) throw new Error('Failed to fetch architecture');
      const data = await response.json();
      setArchitecture(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const fetchDiagram = async (level: string) => {
    try {
      const response = await fetch(`/api/c4/${level}/mermaid`);
      if (!response.ok) throw new Error('Failed to fetch diagram');
      const data = await response.json();
      setDiagram(data.diagram || '');
    } catch (err) {
      console.error('Error fetching diagram:', err);
    }
  };

  if (loading) return <LoadingSpinner message="Loading architecture..." />;

  if (error) {
    return (
      <div className="error">
        <h2>Error</h2>
        <p>{error}</p>
        <button onClick={fetchArchitecture} className="btn btn-primary">
          Retry
        </button>
      </div>
    );
  }

  const containers = architecture?.c4Model?.containers || [];

  return (
    <div>
      <h1 style={{ marginBottom: '2rem', color: 'var(--text-primary)' }}>
        Architecture Dashboard
      </h1>

      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ marginBottom: '1rem', color: 'var(--text-primary)' }}>
          {architecture?.name || 'System Architecture'}
        </h2>
        {architecture?.description && (
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
            {architecture.description}
          </p>
        )}
      </div>

      {/* C4 Level Selector */}
      <div style={{ marginBottom: '2rem', display: 'flex', gap: '1rem' }}>
        {(['system', 'container', 'component'] as const).map((level) => (
          <button
            key={level}
            onClick={() => setSelectedLevel(level)}
            className={`btn ${selectedLevel === level ? 'btn-primary' : 'btn-secondary'}`}
          >
            {level.charAt(0).toUpperCase() + level.slice(1)} Level
          </button>
        ))}
      </div>

      {/* C4 Diagram */}
      {diagram && (
        <div style={{ marginBottom: '2rem', padding: '1rem', backgroundColor: 'var(--bg-secondary)', borderRadius: '4px' }}>
          <C4Diagram diagram={diagram} title={`${selectedLevel.charAt(0).toUpperCase() + selectedLevel.slice(1)} Diagram`} />
        </div>
      )}

      {/* Dependency Graph */}
      {containers.length > 0 && (
        <div style={{ marginBottom: '2rem', padding: '1rem', backgroundColor: 'var(--bg-secondary)', borderRadius: '4px' }}>
          <DependencyGraph
            nodes={containers.map((c: any) => ({
              id: c.id,
              label: c.name,
              type: c.type,
            }))}
            edges={architecture?.relationships?.map((r: any) => ({
              from: r.from,
              to: r.to,
              type: r.type,
            })) || []}
            title="Component Dependencies"
            onNodeClick={(nodeId) => {
              const component = containers.find((c: any) => c.id === nodeId);
              if (component && onNavigate) {
                onNavigate('component-details', { component });
              }
            }}
          />
        </div>
      )}

      {/* Components Grid */}
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ marginBottom: '1rem', color: 'var(--text-primary)' }}>Components</h2>
        <div className="grid grid-3">
          {containers.map((container: any) => (
            <ComponentCard
              key={container.id}
              id={container.id}
              name={container.name}
              type={container.type}
              description={container.description}
              healthScore={container.metrics?.healthScore ? container.metrics.healthScore * 100 : 75}
              repositories={container.repositories}
              packages={container.packages}
              onClick={() => {
                if (onNavigate) {
                  onNavigate('component-details', { component: container });
                }
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default ArchitectureDashboard;

