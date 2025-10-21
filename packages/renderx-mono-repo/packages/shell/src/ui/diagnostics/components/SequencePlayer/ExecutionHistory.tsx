/**
 * ExecutionHistory Component
 * 
 * Display historical executions with filter by success/failure.
 * Part of Issue #306 - Release 2: Live Sequence Triggering.
 */

import React from 'react';
import type { ExecutionHistoryItem, HistoryFilter, HistoryStats } from '../../types';

export interface ExecutionHistoryProps {
  /** History items to display */
  history: ExecutionHistoryItem[];
  /** Current filter */
  filter: HistoryFilter;
  /** Callback when filter changes */
  onFilterChange: (filter: HistoryFilter) => void;
  /** Statistics about history */
  stats: HistoryStats;
  /** Available plugin IDs */
  pluginIds: string[];
  /** Callback when an item is selected */
  onSelectItem: (item: ExecutionHistoryItem) => void;
  /** Callback to clear history */
  onClearHistory: () => void;
  /** Callback to remove an item */
  onRemoveItem: (id: string) => void;
}

export const ExecutionHistory: React.FC<ExecutionHistoryProps> = ({
  history,
  filter,
  onFilterChange,
  stats,
  pluginIds,
  onSelectItem,
  onClearHistory,
  onRemoveItem
}) => {
  const getStatusIcon = (status: 'success' | 'error' | 'running' | 'pending') => {
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

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  const formatDuration = (duration?: number) => {
    if (duration === undefined) return 'N/A';
    return `${duration.toFixed(0)}ms`;
  };

  return (
    <div className="execution-history-container">
      {/* Header */}
      <div className="execution-history-header">
        <h3 className="execution-history-title">
          Execution History ({stats.filtered})
        </h3>
        <div className="execution-history-stats">
          <span className="stat-badge">
            {stats.total} total
          </span>
          <span className="stat-badge stat-badge-success">
            {stats.success} success
          </span>
          {stats.error > 0 && (
            <span className="stat-badge stat-badge-error">
              {stats.error} error
            </span>
          )}
          {stats.avgDuration > 0 && (
            <span className="stat-badge">
              avg: {stats.avgDuration.toFixed(0)}ms
            </span>
          )}
        </div>
        {stats.total > 0 && (
          <button
            className="button-secondary"
            onClick={onClearHistory}
            title="Clear all history"
          >
            Clear All
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="execution-history-filters">
        <input
          type="text"
          className="execution-history-search"
          placeholder="Search history..."
          value={filter.searchQuery || ''}
          onChange={(e) => onFilterChange({ ...filter, searchQuery: e.target.value })}
        />

        <div className="execution-history-filter-row">
          <select
            className="execution-history-filter-select"
            value={filter.status || 'all'}
            onChange={(e) => onFilterChange({ ...filter, status: e.target.value as any })}
          >
            <option value="all">All Status</option>
            <option value="success">Success</option>
            <option value="error">Error</option>
            <option value="running">Running</option>
          </select>

          <select
            className="execution-history-filter-select"
            value={filter.pluginId || 'all'}
            onChange={(e) => onFilterChange({ ...filter, pluginId: e.target.value })}
          >
            <option value="all">All Plugins</option>
            {pluginIds.map(pluginId => (
              <option key={pluginId} value={pluginId}>
                {pluginId}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* History List */}
      {history.length === 0 && (
        <div className="execution-history-empty">
          <span className="empty-icon">📜</span>
          <span>No execution history</span>
          {filter.searchQuery && (
            <button
              className="button-link"
              onClick={() => onFilterChange({ ...filter, searchQuery: '' })}
            >
              Clear search
            </button>
          )}
        </div>
      )}

      {history.length > 0 && (
        <div className="execution-history-list">
          {history.map(item => (
            <div
              key={item.id}
              className={`execution-history-item execution-history-item-${item.status}`}
              onClick={() => onSelectItem(item)}
            >
              <div className="execution-history-item-header">
                <span className="execution-history-item-icon">
                  {getStatusIcon(item.status)}
                </span>
                <div className="execution-history-item-info">
                  <div className="execution-history-item-sequence">
                    {item.sequenceId}
                  </div>
                  <div className="execution-history-item-plugin">
                    {item.pluginId}
                  </div>
                </div>
                <div className="execution-history-item-meta">
                  <div className="execution-history-item-duration">
                    {formatDuration(item.totalDuration)}
                  </div>
                  <div className="execution-history-item-timestamp">
                    {formatTimestamp(item.startTime)}
                  </div>
                </div>
                <button
                  className="execution-history-item-remove"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveItem(item.id);
                  }}
                  title="Remove from history"
                >
                  ×
                </button>
              </div>
              {item.error && (
                <div className="execution-history-item-error">
                  ⚠️ {item.error}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

