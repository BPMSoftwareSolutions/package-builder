/**
 * ExecutionStats Component
 * 
 * Displays performance statistics and summary for a parsed execution.
 * Part of the Diagnostic Sequence Player MVP (Issue #305).
 */

import React from 'react';
import type { ExecutionStats } from '../../types';

export interface ExecutionStatsProps {
  stats: ExecutionStats;
  onExport?: () => void;
}

export const ExecutionStats: React.FC<ExecutionStatsProps> = ({ stats, onExport }) => {
  const successRate = stats.totalBeats > 0 
    ? Math.round((stats.successfulBeats / stats.totalBeats) * 100) 
    : 0;

  return (
    <div className="execution-stats">
      <div className="panel-header">
        <h3 className="panel-title">Performance Stats</h3>
        {onExport && (
          <button
            onClick={onExport}
            className="button-secondary"
            style={{
              padding: '0.25rem 0.75rem',
              fontSize: '0.85rem',
              backgroundColor: 'var(--bg-tertiary)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-color)',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Export JSON
          </button>
        )}
      </div>

      <div className="stats-grid">
        <StatCard
          label="Total Movements"
          value={stats.totalMovements}
          icon="🎬"
        />
        
        <StatCard
          label="Total Beats"
          value={stats.totalBeats}
          icon="🥁"
        />
        
        <StatCard
          label="Total Duration"
          value={`${stats.totalDuration}ms`}
          icon="⏱️"
        />
        
        <StatCard
          label="Avg Beat Duration"
          value={`${stats.avgBeatDuration}ms`}
          icon="📊"
        />
        
        <StatCard
          label="Success Rate"
          value={`${successRate}%`}
          icon={successRate === 100 ? '✅' : successRate > 50 ? '⚠️' : '❌'}
          color={successRate === 100 ? '#4caf50' : successRate > 50 ? '#ff9800' : '#f44336'}
        />
        
        <StatCard
          label="Successful Beats"
          value={stats.successfulBeats}
          icon="✅"
          color="#4caf50"
        />
        
        <StatCard
          label="Failed Beats"
          value={stats.failedBeats}
          icon="❌"
          color={stats.failedBeats > 0 ? '#f44336' : undefined}
        />
      </div>

      {stats.slowestBeat && (
        <div className="slowest-beat" style={{ 
          padding: '1rem',
          margin: '0 1rem 1rem 1rem',
          backgroundColor: 'var(--bg-secondary)',
          borderRadius: '4px',
          borderLeft: '4px solid #ff9800'
        }}>
          <div style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>
            🐌 Slowest Beat
          </div>
          <div style={{ fontSize: '0.9rem' }}>
            <div><strong>Movement:</strong> {stats.slowestBeat.movement}</div>
            <div><strong>Beat:</strong> {stats.slowestBeat.beat}</div>
            <div><strong>Duration:</strong> {stats.slowestBeat.duration}ms</div>
          </div>
        </div>
      )}
    </div>
  );
};

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: string;
  color?: string;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, icon, color }) => {
  return (
    <div className="stat-card" style={{ 
      padding: '1rem',
      backgroundColor: 'var(--bg-secondary)',
      borderRadius: '4px',
      textAlign: 'center',
      borderLeft: color ? `4px solid ${color}` : undefined
    }}>
      {icon && (
        <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>
          {icon}
        </div>
      )}
      <div style={{ 
        fontSize: '1.5rem', 
        fontWeight: 'bold',
        color: color || 'var(--text-primary)',
        marginBottom: '0.25rem'
      }}>
        {value}
      </div>
      <div style={{ 
        fontSize: '0.85rem', 
        color: 'var(--text-muted)'
      }}>
        {label}
      </div>
    </div>
  );
};

