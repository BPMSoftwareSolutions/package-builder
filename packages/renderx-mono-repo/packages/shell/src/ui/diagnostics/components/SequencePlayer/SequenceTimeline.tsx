/**
 * SequenceTimeline Component
 * 
 * Visualizes sequence execution timeline with movements and beats.
 * Part of the Diagnostic Sequence Player MVP (Issue #305).
 */

import React from 'react';
import type { ParsedExecution, Movement, Beat } from '../../types';

export interface SequenceTimelineProps {
  execution: ParsedExecution;
}

export const SequenceTimeline: React.FC<SequenceTimelineProps> = ({ execution }) => {
  const getStatusIcon = (status?: 'success' | 'error' | 'pending') => {
    switch (status) {
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      case 'pending':
        return '⏳';
      default:
        return '✅';
    }
  };

  const getStatusColor = (status?: 'success' | 'error' | 'pending') => {
    switch (status) {
      case 'success':
        return '#4caf50';
      case 'error':
        return '#f44336';
      case 'pending':
        return '#ff9800';
      default:
        return '#4caf50';
    }
  };

  return (
    <div className="sequence-timeline">
      <div className="panel-header">
        <h3 className="panel-title">Execution Timeline</h3>
        <span className="panel-badge" style={{ backgroundColor: getStatusColor(execution.status) }}>
          {getStatusIcon(execution.status)} {execution.status}
        </span>
      </div>

      <div className="timeline-metadata" style={{ 
        padding: '1rem', 
        backgroundColor: 'var(--bg-secondary)',
        borderRadius: '4px',
        marginBottom: '1rem'
      }}>
        <div><strong>Sequence:</strong> {execution.sequenceName}</div>
        <div><strong>Plugin:</strong> {execution.pluginId}</div>
        <div><strong>Request ID:</strong> {execution.requestId}</div>
        <div><strong>Total Duration:</strong> {execution.totalDuration}ms</div>
        {execution.startTime && <div><strong>Start Time:</strong> {execution.startTime}</div>}
        {execution.endTime && <div><strong>End Time:</strong> {execution.endTime}</div>}
        {execution.error && (
          <div style={{ color: 'var(--error-color)', marginTop: '0.5rem' }}>
            <strong>Error:</strong> {execution.error}
          </div>
        )}
      </div>

      <div className="timeline-movements">
        {execution.movements.map((movement, movementIndex) => (
          <MovementView key={movementIndex} movement={movement} />
        ))}
      </div>
    </div>
  );
};

interface MovementViewProps {
  movement: Movement;
}

const MovementView: React.FC<MovementViewProps> = ({ movement }) => {
  const getStatusIcon = (status?: 'success' | 'error' | 'pending') => {
    switch (status) {
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      case 'pending':
        return '⏳';
      default:
        return '✅';
    }
  };

  const getStatusColor = (status?: 'success' | 'error' | 'pending') => {
    switch (status) {
      case 'success':
        return '#4caf50';
      case 'error':
        return '#f44336';
      case 'pending':
        return '#ff9800';
      default:
        return '#4caf50';
    }
  };

  return (
    <div className="movement" style={{ 
      marginBottom: '1.5rem',
      padding: '1rem',
      backgroundColor: 'var(--bg-tertiary)',
      borderRadius: '4px',
      borderLeft: `4px solid ${getStatusColor(movement.status)}`
    }}>
      <div className="movement-header" style={{ 
        display: 'flex', 
        justifyContent: 'space-between',
        marginBottom: '0.5rem',
        fontWeight: 'bold'
      }}>
        <span>{getStatusIcon(movement.status)} {movement.name}</span>
        <span>{movement.duration}ms</span>
      </div>

      <div className="movement-beats">
        {movement.beats.map((beat, beatIndex) => (
          <BeatView key={beatIndex} beat={beat} />
        ))}
      </div>
    </div>
  );
};

interface BeatViewProps {
  beat: Beat;
}

const BeatView: React.FC<BeatViewProps> = ({ beat }) => {
  const [expanded, setExpanded] = React.useState(false);

  const getStatusIcon = (status?: 'success' | 'error' | 'pending') => {
    switch (status) {
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      case 'pending':
        return '⏳';
      default:
        return '✅';
    }
  };

  return (
    <div className="beat" style={{ 
      padding: '0.5rem',
      marginBottom: '0.5rem',
      backgroundColor: 'var(--bg-secondary)',
      borderRadius: '4px',
      fontSize: '0.9rem'
    }}>
      <div 
        className="beat-header" 
        style={{ 
          display: 'flex', 
          justifyContent: 'space-between',
          cursor: beat.dataBaton ? 'pointer' : 'default'
        }}
        onClick={() => beat.dataBaton && setExpanded(!expanded)}
      >
        <span>
          {getStatusIcon(beat.status)} Beat {beat.number}: {beat.event}
        </span>
        <span style={{ color: 'var(--text-muted)' }}>{beat.duration}ms</span>
      </div>

      {beat.timestamp && (
        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
          {beat.timestamp}
        </div>
      )}

      {beat.error && (
        <div style={{ color: 'var(--error-color)', marginTop: '0.25rem', fontSize: '0.85rem' }}>
          Error: {beat.error}
        </div>
      )}

      {beat.dataBaton && (
        <div style={{ marginTop: '0.5rem' }}>
          <button
            onClick={() => setExpanded(!expanded)}
            style={{
              fontSize: '0.8rem',
              padding: '0.25rem 0.5rem',
              backgroundColor: 'var(--bg-tertiary)',
              border: '1px solid var(--border-color)',
              borderRadius: '4px',
              cursor: 'pointer',
              color: 'var(--text-primary)'
            }}
          >
            {expanded ? '▼' : '▶'} Data Baton
          </button>
          {expanded && (
            <pre style={{ 
              marginTop: '0.5rem',
              padding: '0.5rem',
              backgroundColor: 'var(--bg-primary)',
              borderRadius: '4px',
              overflow: 'auto',
              fontSize: '0.8rem',
              maxHeight: '200px'
            }}>
              {JSON.stringify(beat.dataBaton, null, 2)}
            </pre>
          )}
        </div>
      )}
    </div>
  );
};

