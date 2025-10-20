import React, { useState, useEffect } from 'react';

interface ContainerHealth {
  status: 'running' | 'stopped' | 'error';
  uptime: number;
  cpuUsage: number;
  memoryUsage: number;
  networkIn: number;
  networkOut: number;
  healthStatus: 'healthy' | 'degraded' | 'unhealthy';
  lastUpdated: string;
}

interface ContainerHealthPanelProps {
  containerId?: string;
  onStatusChange?: (status: ContainerHealth) => void;
}

export const ContainerHealthPanel: React.FC<ContainerHealthPanelProps> = ({ 
  containerId = 'default',
  onStatusChange 
}) => {
  const [health, setHealth] = useState<ContainerHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    const fetchHealth = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/conductor/container-health/${containerId}`);
        if (!response.ok) throw new Error('Failed to fetch container health');
        const data = await response.json();
        setHealth(data);
        onStatusChange?.(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchHealth();
    const interval = autoRefresh ? setInterval(fetchHealth, 10000) : undefined;
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [containerId, autoRefresh, onStatusChange]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return '#4caf50';
      case 'stopped': return '#9e9e9e';
      case 'error': return '#f44336';
      default: return '#ff9800';
    }
  };

  const getHealthColor = (health: string) => {
    switch (health) {
      case 'healthy': return '#4caf50';
      case 'degraded': return '#ff9800';
      case 'unhealthy': return '#f44336';
      default: return '#9e9e9e';
    }
  };

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${days}d ${hours}h ${minutes}m`;
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  if (loading) {
    return <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading health data...</div>;
  }

  if (!health) {
    return <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-secondary)' }}>No health data available</div>;
  }

  return (
    <div style={{
      border: '1px solid var(--border-color)',
      borderRadius: '8px',
      padding: '1.5rem',
      backgroundColor: 'var(--card-background)',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h3 style={{ margin: 0, color: 'var(--text-primary)' }}>Container Health</h3>
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={autoRefresh}
            onChange={(e) => setAutoRefresh(e.target.checked)}
          />
          <span style={{ color: 'var(--text-primary)', fontSize: '0.875rem' }}>Auto-refresh</span>
        </label>
      </div>

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

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
        <div style={{
          padding: '1rem',
          backgroundColor: 'var(--input-background)',
          borderRadius: '4px',
          border: `2px solid ${getStatusColor(health.status)}`
        }}>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Status</div>
          <div style={{ color: getStatusColor(health.status), fontWeight: 'bold', fontSize: '1.25rem' }}>
            {health.status.toUpperCase()}
          </div>
        </div>

        <div style={{
          padding: '1rem',
          backgroundColor: 'var(--input-background)',
          borderRadius: '4px',
          border: `2px solid ${getHealthColor(health.healthStatus)}`
        }}>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Health</div>
          <div style={{ color: getHealthColor(health.healthStatus), fontWeight: 'bold', fontSize: '1.25rem' }}>
            {health.healthStatus.toUpperCase()}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
        <div style={{
          padding: '1rem',
          backgroundColor: 'var(--input-background)',
          borderRadius: '4px'
        }}>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Uptime</div>
          <div style={{ color: 'var(--text-primary)', fontWeight: 'bold' }}>
            {formatUptime(health.uptime)}
          </div>
        </div>

        <div style={{
          padding: '1rem',
          backgroundColor: 'var(--input-background)',
          borderRadius: '4px'
        }}>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Last Updated</div>
          <div style={{ color: 'var(--text-primary)', fontSize: '0.875rem' }}>
            {new Date(health.lastUpdated).toLocaleTimeString()}
          </div>
        </div>
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>CPU Usage</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ flex: 1, height: '8px', backgroundColor: 'var(--input-background)', borderRadius: '4px', overflow: 'hidden' }}>
            <div style={{
              height: '100%',
              width: `${Math.min(health.cpuUsage, 100)}%`,
              backgroundColor: health.cpuUsage > 80 ? '#f44336' : health.cpuUsage > 50 ? '#ff9800' : '#4caf50',
              transition: 'width 0.3s ease'
            }} />
          </div>
          <span style={{ color: 'var(--text-primary)', fontWeight: 'bold', minWidth: '50px' }}>
            {health.cpuUsage.toFixed(1)}%
          </span>
        </div>
      </div>

      <div>
        <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Memory Usage</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ flex: 1, height: '8px', backgroundColor: 'var(--input-background)', borderRadius: '4px', overflow: 'hidden' }}>
            <div style={{
              height: '100%',
              width: `${Math.min(health.memoryUsage, 100)}%`,
              backgroundColor: health.memoryUsage > 80 ? '#f44336' : health.memoryUsage > 50 ? '#ff9800' : '#4caf50',
              transition: 'width 0.3s ease'
            }} />
          </div>
          <span style={{ color: 'var(--text-primary)', fontWeight: 'bold', minWidth: '50px' }}>
            {health.memoryUsage.toFixed(1)}%
          </span>
        </div>
      </div>
    </div>
  );
};

