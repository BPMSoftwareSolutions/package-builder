import React, { useState, useEffect } from 'react';
import { Alert } from '../../services/alerting.js';

interface AlertsPanelProps {
  org: string;
  team?: string;
  maxAlerts?: number;
  onAlertClick?: (alertId: string) => void;
}

export const AlertsPanel: React.FC<AlertsPanelProps> = ({ org, team, maxAlerts = 10, onAlertClick }) => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        setLoading(true);
        const endpoint = team ? `/api/metrics/alerts/${org}/${team}` : `/api/metrics/alerts/${org}`;
        const response = await fetch(endpoint);
        if (!response.ok) throw new Error('Failed to fetch alerts');
        const data = await response.json();
        setAlerts(data.alerts || []);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        setAlerts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAlerts();
    const interval = setInterval(fetchAlerts, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [org, team]);

  const filteredAlerts = alerts
    .filter(a => filterSeverity === 'all' || a.severity === filterSeverity)
    .filter(a => filterStatus === 'all' || a.status === filterStatus)
    .slice(0, maxAlerts);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return '#f44336';
      case 'high': return '#ff9800';
      case 'medium': return '#ffc107';
      case 'low': return '#2196f3';
      default: return '#9e9e9e';
    }
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      active: '#f44336',
      acknowledged: '#ff9800',
      resolved: '#4caf50'
    };
    return colors[status] || '#9e9e9e';
  };

  if (loading) {
    return <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading alerts...</div>;
  }

  return (
    <div style={{
      border: '1px solid var(--border-color)',
      borderRadius: '8px',
      padding: '1.5rem',
      backgroundColor: 'var(--card-background)',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
    }}>
      <h3 style={{ margin: '0 0 1rem 0', color: 'var(--text-primary)' }}>Alerts</h3>

      {error && (
        <div style={{
          padding: '1rem',
          backgroundColor: '#ffebee',
          color: '#c62828',
          borderRadius: '4px',
          marginBottom: '1rem'
        }}>
          Error: {error}
        </div>
      )}

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        <select
          value={filterSeverity}
          onChange={(e) => setFilterSeverity(e.target.value)}
          style={{
            padding: '0.5rem',
            borderRadius: '4px',
            border: '1px solid var(--border-color)',
            backgroundColor: 'var(--input-background)',
            color: 'var(--text-primary)',
            cursor: 'pointer'
          }}
        >
          <option value="all">All Severities</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          style={{
            padding: '0.5rem',
            borderRadius: '4px',
            border: '1px solid var(--border-color)',
            backgroundColor: 'var(--input-background)',
            color: 'var(--text-primary)',
            cursor: 'pointer'
          }}
        >
          <option value="all">All Statuses</option>
          <option value="active">Active</option>
          <option value="acknowledged">Acknowledged</option>
          <option value="resolved">Resolved</option>
        </select>
      </div>

      {filteredAlerts.length === 0 ? (
        <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
          No alerts found
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {filteredAlerts.map((alert) => (
            <div
              key={alert.id}
              onClick={() => onAlertClick?.(alert.id)}
              style={{
                padding: '1rem',
                border: `2px solid ${getSeverityColor(alert.severity)}`,
                borderRadius: '4px',
                backgroundColor: 'var(--input-background)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start'
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.boxShadow = 'none';
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <span style={{
                    display: 'inline-block',
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    backgroundColor: getSeverityColor(alert.severity)
                  }} />
                  <strong style={{ color: 'var(--text-primary)' }}>{alert.title}</strong>
                </div>
                <p style={{ margin: '0.25rem 0', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                  {alert.description}
                </p>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                  {alert.repo} • {new Date(alert.timestamp).toLocaleString()}
                </div>
              </div>
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-end',
                gap: '0.5rem'
              }}>
                <span style={{
                  padding: '0.25rem 0.75rem',
                  borderRadius: '12px',
                  backgroundColor: getStatusBadge(alert.status),
                  color: 'white',
                  fontSize: '0.75rem',
                  fontWeight: 'bold'
                }}>
                  {alert.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

