import React, { useState, useEffect } from 'react';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { MarkdownRenderer } from '../components/MarkdownRenderer';

interface InsightsPageProps {
  onNavigate?: (page: string, data?: any) => void;
}

export const InsightsPage: React.FC<InsightsPageProps> = ({ onNavigate }) => {
  const [loading, setLoading] = useState(true);
  const [insights, setInsights] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchInsights();
  }, []);

  const fetchInsights = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/insights');
      if (!response.ok) throw new Error('Failed to fetch insights');
      const data = await response.json();
      setInsights(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner message="Loading insights..." />;

  if (error) {
    return (
      <div className="error">
        <h2>Error</h2>
        <p>{error}</p>
        <button onClick={fetchInsights} className="btn btn-primary">
          Retry
        </button>
      </div>
    );
  }

  const trends = insights?.trends || [];
  const anomalies = insights?.anomalies || [];
  const recommendations = insights?.recommendations || [];
  const report = insights?.report || '';

  return (
    <div>
      <h1 style={{ marginBottom: '2rem', color: 'var(--text-primary)' }}>
        Insights & Recommendations
      </h1>

      {/* Trends */}
      {trends.length > 0 && (
        <div className="card" style={{ marginBottom: '2rem' }}>
          <div className="card-header">Trends</div>
          <div className="card-body">
            {trends.map((trend: any, idx: number) => (
              <div key={idx} style={{ marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border-color)' }}>
                <h4 style={{ color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                  {trend.metric}
                </h4>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                  {trend.description}
                </p>
                <span className={`badge badge-${trend.direction === 'up' ? 'success' : trend.direction === 'down' ? 'danger' : 'warning'}`}>
                  {trend.direction === 'up' ? '↑' : trend.direction === 'down' ? '↓' : '→'} {Math.abs(trend.change).toFixed(1)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Anomalies */}
      {anomalies.length > 0 && (
        <div className="card" style={{ marginBottom: '2rem' }}>
          <div className="card-header">Anomalies Detected</div>
          <div className="card-body">
            {anomalies.map((anomaly: any, idx: number) => (
              <div key={idx} style={{ marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border-color)' }}>
                <h4 style={{ color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                  {anomaly.metric}
                </h4>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                  {anomaly.description}
                </p>
                <span className={`badge badge-${anomaly.severity === 'critical' ? 'danger' : anomaly.severity === 'high' ? 'warning' : 'info'}`}>
                  {anomaly.severity.toUpperCase()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <div className="card" style={{ marginBottom: '2rem' }}>
          <div className="card-header">Recommendations</div>
          <div className="card-body">
            {recommendations.map((rec: any, idx: number) => (
              <div key={idx} style={{ marginBottom: '1.5rem', paddingBottom: '1.5rem', borderBottom: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.5rem' }}>
                  <h4 style={{ color: 'var(--text-primary)' }}>
                    {rec.title}
                  </h4>
                  <span className={`badge badge-${rec.priority === 'high' ? 'danger' : rec.priority === 'medium' ? 'warning' : 'info'}`}>
                    {rec.priority.toUpperCase()}
                  </span>
                </div>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                  {rec.description}
                </p>
                {rec.actions && (
                  <div style={{ marginTop: '0.5rem' }}>
                    <strong style={{ color: 'var(--text-primary)' }}>Actions:</strong>
                    <ul style={{ marginLeft: '1.5rem', marginTop: '0.5rem' }}>
                      {rec.actions.map((action: string, i: number) => (
                        <li key={i} style={{ color: 'var(--text-secondary)' }}>
                          {action}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Full Report */}
      {report && (
        <div className="card">
          <div className="card-header">Full Report</div>
          <div className="card-body">
            <MarkdownRenderer content={report} />
          </div>
        </div>
      )}
    </div>
  );
};

export default InsightsPage;

