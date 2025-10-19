import React, { useState } from 'react';

interface BottleneckAlert {
  id: string;
  stage: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  affectedTeams: string[];
  suggestedActions: string[];
  detectedAt: string;
  resolvedAt?: string;
}

interface BottleneckAlertProps {
  alerts: BottleneckAlert[];
  onAcknowledge?: (alertId: string) => void;
  onResolve?: (alertId: string) => void;
}

export const BottleneckAlert: React.FC<BottleneckAlertProps> = ({ alerts, onAcknowledge, onResolve }) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return '#f44336';
      case 'high':
        return '#ff9800';
      case 'medium':
        return '#ffc107';
      case 'low':
        return '#4caf50';
      default:
        return '#2196f3';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return '✕';
      case 'high':
        return '⚠';
      case 'medium':
        return '!';
      case 'low':
        return 'ℹ';
      default:
        return '?';
    }
  };

  if (alerts.length === 0) {
    return (
      <div
        style={{
          border: '1px solid var(--border-color)',
          borderRadius: '8px',
          padding: '1.5rem',
          backgroundColor: 'var(--card-background)',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>✓</div>
        <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-primary)' }}>No Bottlenecks Detected</h3>
        <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
          Your flow is healthy and running smoothly.
        </p>
      </div>
    );
  }

  return (
    <div
      style={{
        border: '1px solid var(--border-color)',
        borderRadius: '8px',
        padding: '1.5rem',
        backgroundColor: 'var(--card-background)',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      }}
    >
      <h3 style={{ margin: '0 0 1rem 0', color: 'var(--text-primary)' }}>
        Bottleneck Alerts ({alerts.length})
      </h3>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {alerts.map((alert) => (
          <div
            key={alert.id}
            style={{
              padding: '1rem',
              backgroundColor: 'var(--border-color)',
              borderRadius: '6px',
              borderLeft: `4px solid ${getSeverityColor(alert.severity)}`,
              cursor: 'pointer',
              transition: 'all 0.3s ease',
            }}
            onClick={() => setExpandedId(expandedId === alert.id ? null : alert.id)}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', gap: '0.75rem', flex: 1 }}>
                <div
                  style={{
                    fontSize: '1.5rem',
                    color: getSeverityColor(alert.severity),
                    fontWeight: 'bold',
                    minWidth: '24px',
                  }}
                >
                  {getSeverityIcon(alert.severity)}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.95rem', fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                    {alert.stage} Bottleneck
                  </div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                    {alert.description}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    Affected Teams: {alert.affectedTeams.join(', ')}
                  </div>
                </div>
              </div>
              <div
                style={{
                  padding: '0.25rem 0.75rem',
                  backgroundColor: getSeverityColor(alert.severity),
                  color: 'white',
                  borderRadius: '3px',
                  fontSize: '0.75rem',
                  fontWeight: 'bold',
                  textTransform: 'uppercase',
                }}
              >
                {alert.severity}
              </div>
            </div>

            {expandedId === alert.id && (
              <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
                <div style={{ marginBottom: '1rem' }}>
                  <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-primary)', fontSize: '0.9rem' }}>
                    Suggested Actions
                  </h4>
                  <ul style={{ margin: 0, paddingLeft: '1.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                    {alert.suggestedActions.map((action, idx) => (
                      <li key={idx} style={{ marginBottom: '0.25rem' }}>
                        {action}
                      </li>
                    ))}
                  </ul>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {onAcknowledge && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onAcknowledge(alert.id);
                      }}
                      style={{
                        flex: 1,
                        padding: '0.5rem',
                        backgroundColor: 'var(--primary-color)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '0.8rem',
                        fontWeight: 'bold',
                      }}
                    >
                      Acknowledge
                    </button>
                  )}
                  {onResolve && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onResolve(alert.id);
                      }}
                      style={{
                        flex: 1,
                        padding: '0.5rem',
                        backgroundColor: '#4caf50',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '0.8rem',
                        fontWeight: 'bold',
                      }}
                    >
                      Mark Resolved
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default BottleneckAlert;

