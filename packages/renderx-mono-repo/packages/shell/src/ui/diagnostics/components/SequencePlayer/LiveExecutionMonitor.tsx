/**
 * LiveExecutionMonitor Component
 * 
 * Displays real-time beat-by-beat progress with timing data.
 * Part of Issue #306 - Release 2: Live Sequence Triggering.
 */

import React from 'react';
import type { LiveExecution, LiveBeat } from '../../types';

export interface LiveExecutionMonitorProps {
  /** The live execution to monitor */
  execution: LiveExecution | null;
  /** Whether execution is in progress */
  isExecuting: boolean;
}

export const LiveExecutionMonitor: React.FC<LiveExecutionMonitorProps> = ({
  execution,
  isExecuting
}) => {
  if (!execution) {
    return (
      <div className="live-monitor-empty">
        <span className="empty-icon">📊</span>
        <span>No execution in progress</span>
      </div>
    );
  }

  const getStatusIcon = (status: 'pending' | 'running' | 'success' | 'error') => {
    switch (status) {
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      case 'running':
        return '⏳';
      case 'pending':
        return '⏸️';
      default:
        return '⏳';
    }
  };

  const getStatusColor = (status: 'pending' | 'running' | 'success' | 'error') => {
    switch (status) {
      case 'success':
        return '#4caf50';
      case 'error':
        return '#f44336';
      case 'running':
        return '#2196f3';
      case 'pending':
        return '#ff9800';
      default:
        return '#2196f3';
    }
  };

  const calculateProgress = () => {
    if (execution.beats.length === 0) return 0;
    const completedBeats = execution.beats.filter(
      b => b.status === 'success' || b.status === 'error'
    ).length;
    return (completedBeats / execution.beats.length) * 100;
  };

  const calculateDuration = () => {
    if (execution.totalDuration) return execution.totalDuration;
    if (execution.endTime && execution.startTime) {
      return new Date(execution.endTime).getTime() - new Date(execution.startTime).getTime();
    }
    if (execution.startTime) {
      return Date.now() - new Date(execution.startTime).getTime();
    }
    return 0;
  };

  const progress = calculateProgress();
  const duration = calculateDuration();

  return (
    <div className="live-monitor-container">
      <div className="live-monitor-header">
        <h3 className="live-monitor-title">
          Live Execution Monitor
        </h3>
        <span 
          className="live-monitor-status-badge"
          style={{ backgroundColor: getStatusColor(execution.status) }}
        >
          {getStatusIcon(execution.status)} {execution.status}
        </span>
      </div>

      {/* Execution Info */}
      <div className="live-monitor-info">
        <div className="live-monitor-info-row">
          <span className="live-monitor-label">Sequence:</span>
          <span className="live-monitor-value">{execution.sequenceId}</span>
        </div>
        <div className="live-monitor-info-row">
          <span className="live-monitor-label">Plugin:</span>
          <span className="live-monitor-value">{execution.pluginId}</span>
        </div>
        <div className="live-monitor-info-row">
          <span className="live-monitor-label">Duration:</span>
          <span className="live-monitor-value">{duration.toFixed(0)}ms</span>
        </div>
        <div className="live-monitor-info-row">
          <span className="live-monitor-label">Beats:</span>
          <span className="live-monitor-value">
            {execution.beats.filter(b => b.status === 'success' || b.status === 'error').length} / {execution.beats.length || '?'}
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      {execution.beats.length > 0 && (
        <div className="live-monitor-progress">
          <div className="live-monitor-progress-label">
            Progress: {progress.toFixed(0)}%
          </div>
          <div className="live-monitor-progress-bar">
            <div 
              className="live-monitor-progress-fill"
              style={{ 
                width: `${progress}%`,
                backgroundColor: getStatusColor(execution.status)
              }}
            />
          </div>
        </div>
      )}

      {/* Beats List */}
      {execution.beats.length > 0 && (
        <div className="live-monitor-beats">
          <h4 className="live-monitor-beats-title">Beats</h4>
          <div className="live-monitor-beats-list">
            {execution.beats.map((beat, index) => (
              <BeatItem key={index} beat={beat} />
            ))}
          </div>
        </div>
      )}

      {/* Error Display */}
      {execution.error && (
        <div className="live-monitor-error">
          <span className="error-icon">❌</span>
          <span>{execution.error}</span>
        </div>
      )}

      {/* Loading Indicator */}
      {isExecuting && execution.status === 'running' && (
        <div className="live-monitor-loading">
          <span className="spinner">⏳</span>
          <span>Execution in progress...</span>
        </div>
      )}
    </div>
  );
};

interface BeatItemProps {
  beat: LiveBeat;
}

const BeatItem: React.FC<BeatItemProps> = ({ beat }) => {
  const getStatusIcon = (status: 'pending' | 'running' | 'success' | 'error') => {
    switch (status) {
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      case 'running':
        return '⏳';
      case 'pending':
        return '⏸️';
      default:
        return '⏳';
    }
  };

  const getStatusColor = (status: 'pending' | 'running' | 'success' | 'error') => {
    switch (status) {
      case 'success':
        return '#4caf50';
      case 'error':
        return '#f44336';
      case 'running':
        return '#2196f3';
      case 'pending':
        return '#888';
      default:
        return '#2196f3';
    }
  };

  return (
    <div 
      className={`live-monitor-beat live-monitor-beat-${beat.status}`}
      style={{ borderLeftColor: getStatusColor(beat.status) }}
    >
      <div className="live-monitor-beat-header">
        <span className="live-monitor-beat-icon">
          {getStatusIcon(beat.status)}
        </span>
        <span className="live-monitor-beat-number">
          Beat {beat.number}
        </span>
        <span className="live-monitor-beat-event">
          {beat.event}
        </span>
        {beat.duration !== undefined && (
          <span className="live-monitor-beat-duration">
            {beat.duration.toFixed(1)}ms
          </span>
        )}
      </div>
      {beat.error && (
        <div className="live-monitor-beat-error">
          {beat.error}
        </div>
      )}
    </div>
  );
};

