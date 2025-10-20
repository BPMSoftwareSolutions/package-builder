import React, { useState, useEffect } from 'react';

interface ConductorLog {
  timestamp: string;
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  symphonyId?: string;
  movementId?: string;
  beatId?: string;
  pluginId?: string;
}

interface ConductorLogsPanelProps {
  containerId?: string;
  maxLogs?: number;
  onLogClick?: (log: ConductorLog) => void;
}

export const ConductorLogsPanel: React.FC<ConductorLogsPanelProps> = ({ 
  containerId = 'default', 
  maxLogs = 50,
  onLogClick 
}) => {
  const [logs, setLogs] = useState<ConductorLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterLevel, setFilterLevel] = useState<string>('all');
  const [searchText, setSearchText] = useState<string>('');
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/conductor/logs/${containerId}`);
        if (!response.ok) throw new Error('Failed to fetch conductor logs');
        const data = await response.json();
        setLogs(data.logs || []);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        setLogs([]);
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
    const interval = autoRefresh ? setInterval(fetchLogs, 5000) : undefined;
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [containerId, autoRefresh]);

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'error': return 'var(--severity-critical)';
      case 'warn': return 'var(--severity-medium)';
      case 'info': return 'var(--status-active)';
      case 'debug': return 'var(--text-secondary)';
      default: return 'var(--text-tertiary)';
    }
  };

  const filteredLogs = logs
    .filter(log => filterLevel === 'all' || log.level === filterLevel)
    .filter(log => searchText === '' || log.message.toLowerCase().includes(searchText.toLowerCase()))
    .slice(0, maxLogs);

  if (loading) {
    return <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading logs...</div>;
  }

  return (
    <div style={{
      border: '1px solid var(--border-color)',
      borderRadius: '8px',
      padding: '1.5rem',
      backgroundColor: 'var(--card-background)',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
    }}>
      <h3 style={{ margin: '0 0 1rem 0', color: 'var(--text-primary)' }}>Conductor Logs</h3>

      {error && (
        <div style={{
          padding: '1rem',
          backgroundColor: 'rgba(244, 67, 54, 0.1)',
          color: 'var(--severity-critical)',
          borderRadius: '4px',
          marginBottom: '1rem'
        }}>
          Error: {error}
        </div>
      )}

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <select
          value={filterLevel}
          onChange={(e) => setFilterLevel(e.target.value)}
          style={{
            padding: '0.5rem',
            borderRadius: '4px',
            border: '1px solid var(--border-color)',
            backgroundColor: 'var(--input-background)',
            color: 'var(--text-primary)',
            cursor: 'pointer'
          }}
        >
          <option value="all">All Levels</option>
          <option value="debug">Debug</option>
          <option value="info">Info</option>
          <option value="warn">Warning</option>
          <option value="error">Error</option>
        </select>

        <input
          type="text"
          placeholder="Search logs..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          style={{
            padding: '0.5rem',
            borderRadius: '4px',
            border: '1px solid var(--border-color)',
            backgroundColor: 'var(--input-background)',
            color: 'var(--text-primary)',
            flex: 1,
            minWidth: '200px'
          }}
        />

        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={autoRefresh}
            onChange={(e) => setAutoRefresh(e.target.checked)}
          />
          <span style={{ color: 'var(--text-primary)', fontSize: '0.875rem' }}>Auto-refresh</span>
        </label>
      </div>

      {filteredLogs.length === 0 ? (
        <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
          No logs found
        </div>
      ) : (
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '0.5rem',
          maxHeight: '500px',
          overflowY: 'auto'
        }}>
          {filteredLogs.map((log, idx) => (
            <div
              key={idx}
              onClick={() => onLogClick?.(log)}
              style={{
                padding: '0.75rem',
                border: `1px solid ${getLevelColor(log.level)}`,
                borderLeft: `4px solid ${getLevelColor(log.level)}`,
                borderRadius: '4px',
                backgroundColor: 'var(--input-background)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                fontSize: '0.875rem'
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.boxShadow = 'none';
              }}
            >
              <div style={{ display: 'flex', gap: '1rem', marginBottom: '0.25rem' }}>
                <span style={{ 
                  color: getLevelColor(log.level), 
                  fontWeight: 'bold',
                  minWidth: '60px'
                }}>
                  [{log.level.toUpperCase()}]
                </span>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
                  {new Date(log.timestamp).toLocaleTimeString()}
                </span>
              </div>
              <div style={{ color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                {log.message}
              </div>
              {(log.symphonyId || log.pluginId) && (
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
                  {log.symphonyId && <span>Symphony: {log.symphonyId} • </span>}
                  {log.pluginId && <span>Plugin: {log.pluginId}</span>}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

