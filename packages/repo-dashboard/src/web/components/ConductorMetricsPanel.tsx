import React, { useState, useEffect } from 'react';

interface ConductorMetrics {
  orchestration: {
    totalSymphonies: number;
    activeMovements: number;
    completedBeats: number;
  };
  performance: {
    avgLatency: number;
    p95Latency: number;
    p99Latency: number;
    throughput: number;
  };
  queue: {
    pending: number;
    processing: number;
    completed: number;
  };
  errors: {
    total: number;
    rate: number;
    topErrors: Array<{ error: string; count: number }>;
  };
  plugins: Record<string, { calls: number; errors: number; avgLatency: number }>;
}

interface ConductorMetricsPanelProps {
  containerId?: string;
}

export const ConductorMetricsPanel: React.FC<ConductorMetricsPanelProps> = ({ 
  containerId = 'default'
}) => {
  const [metrics, setMetrics] = useState<ConductorMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/conductor/metrics/${containerId}`);
        if (!response.ok) throw new Error('Failed to fetch conductor metrics');
        const data = await response.json();
        setMetrics(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
    const interval = autoRefresh ? setInterval(fetchMetrics, 15000) : undefined;
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [containerId, autoRefresh]);

  if (loading) {
    return <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading metrics...</div>;
  }

  if (!metrics) {
    return <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-secondary)' }}>No metrics available</div>;
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
        <h3 style={{ margin: 0, color: 'var(--text-primary)' }}>Conductor Metrics</h3>
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

      {/* Orchestration Metrics */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h4 style={{ color: 'var(--text-primary)', marginBottom: '1rem' }}>Orchestration</h4>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
          <div style={{ padding: '1rem', backgroundColor: 'var(--input-background)', borderRadius: '4px' }}>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Total Symphonies</div>
            <div style={{ color: 'var(--text-primary)', fontWeight: 'bold', fontSize: '1.5rem' }}>
              {metrics.orchestration.totalSymphonies}
            </div>
          </div>
          <div style={{ padding: '1rem', backgroundColor: 'var(--input-background)', borderRadius: '4px' }}>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Active Movements</div>
            <div style={{ color: 'var(--text-primary)', fontWeight: 'bold', fontSize: '1.5rem' }}>
              {metrics.orchestration.activeMovements}
            </div>
          </div>
          <div style={{ padding: '1rem', backgroundColor: 'var(--input-background)', borderRadius: '4px' }}>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Completed Beats</div>
            <div style={{ color: 'var(--text-primary)', fontWeight: 'bold', fontSize: '1.5rem' }}>
              {metrics.orchestration.completedBeats}
            </div>
          </div>
        </div>
      </div>

      {/* Performance Metrics */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h4 style={{ color: 'var(--text-primary)', marginBottom: '1rem' }}>Performance</h4>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div style={{ padding: '1rem', backgroundColor: 'var(--input-background)', borderRadius: '4px' }}>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Avg Latency</div>
            <div style={{ color: 'var(--text-primary)', fontWeight: 'bold', fontSize: '1.25rem' }}>
              {metrics.performance.avgLatency.toFixed(2)}ms
            </div>
          </div>
          <div style={{ padding: '1rem', backgroundColor: 'var(--input-background)', borderRadius: '4px' }}>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Throughput</div>
            <div style={{ color: 'var(--text-primary)', fontWeight: 'bold', fontSize: '1.25rem' }}>
              {metrics.performance.throughput.toFixed(2)} ops/s
            </div>
          </div>
          <div style={{ padding: '1rem', backgroundColor: 'var(--input-background)', borderRadius: '4px' }}>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>P95 Latency</div>
            <div style={{ color: 'var(--text-primary)', fontWeight: 'bold', fontSize: '1.25rem' }}>
              {metrics.performance.p95Latency.toFixed(2)}ms
            </div>
          </div>
          <div style={{ padding: '1rem', backgroundColor: 'var(--input-background)', borderRadius: '4px' }}>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>P99 Latency</div>
            <div style={{ color: 'var(--text-primary)', fontWeight: 'bold', fontSize: '1.25rem' }}>
              {metrics.performance.p99Latency.toFixed(2)}ms
            </div>
          </div>
        </div>
      </div>

      {/* Queue Metrics */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h4 style={{ color: 'var(--text-primary)', marginBottom: '1rem' }}>Queue Status</h4>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
          <div style={{ padding: '1rem', backgroundColor: 'var(--input-background)', borderRadius: '4px' }}>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Pending</div>
            <div style={{ color: '#ff9800', fontWeight: 'bold', fontSize: '1.5rem' }}>
              {metrics.queue.pending}
            </div>
          </div>
          <div style={{ padding: '1rem', backgroundColor: 'var(--input-background)', borderRadius: '4px' }}>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Processing</div>
            <div style={{ color: '#2196f3', fontWeight: 'bold', fontSize: '1.5rem' }}>
              {metrics.queue.processing}
            </div>
          </div>
          <div style={{ padding: '1rem', backgroundColor: 'var(--input-background)', borderRadius: '4px' }}>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Completed</div>
            <div style={{ color: '#4caf50', fontWeight: 'bold', fontSize: '1.5rem' }}>
              {metrics.queue.completed}
            </div>
          </div>
        </div>
      </div>

      {/* Error Metrics */}
      <div>
        <h4 style={{ color: 'var(--text-primary)', marginBottom: '1rem' }}>Errors</h4>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
          <div style={{ padding: '1rem', backgroundColor: 'var(--input-background)', borderRadius: '4px' }}>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Total Errors</div>
            <div style={{ color: '#f44336', fontWeight: 'bold', fontSize: '1.5rem' }}>
              {metrics.errors.total}
            </div>
          </div>
          <div style={{ padding: '1rem', backgroundColor: 'var(--input-background)', borderRadius: '4px' }}>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Error Rate</div>
            <div style={{ color: '#f44336', fontWeight: 'bold', fontSize: '1.5rem' }}>
              {(metrics.errors.rate * 100).toFixed(2)}%
            </div>
          </div>
        </div>
        {metrics.errors.topErrors.length > 0 && (
          <div style={{ padding: '1rem', backgroundColor: 'var(--input-background)', borderRadius: '4px' }}>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Top Errors</div>
            {metrics.errors.topErrors.slice(0, 3).map((err, idx) => (
              <div key={idx} style={{ color: 'var(--text-primary)', fontSize: '0.875rem', marginBottom: '0.25rem' }}>
                {err.error}: <strong>{err.count}</strong>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

