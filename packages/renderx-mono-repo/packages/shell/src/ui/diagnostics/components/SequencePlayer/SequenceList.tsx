/**
 * SequenceList Component
 * 
 * Displays available sequences grouped by plugin with search/filter functionality.
 * Part of Issue #306 - Release 2: Live Sequence Triggering.
 */

import React from 'react';
import type { AvailableSequence } from '../../types';

export interface SequenceListProps {
  /** Grouped sequences by plugin ID */
  groupedSequences: Record<string, AvailableSequence[]>;
  /** Search query */
  searchQuery: string;
  /** Callback when search query changes */
  onSearchChange: (query: string) => void;
  /** Selected plugin filter */
  filterPlugin: string;
  /** Callback when plugin filter changes */
  onFilterChange: (pluginId: string) => void;
  /** Show only mounted sequences */
  showMountedOnly: boolean;
  /** Callback when mounted filter changes */
  onMountedFilterChange: (showMounted: boolean) => void;
  /** Available plugin IDs for filter */
  pluginIds: string[];
  /** Statistics about sequences */
  stats: {
    total: number;
    mounted: number;
    unmounted: number;
    filtered: number;
    pluginCount: number;
  };
  /** Callback when a sequence is selected to trigger */
  onTriggerSequence: (sequence: AvailableSequence) => void;
  /** Loading state */
  isLoading?: boolean;
  /** Error message */
  error?: string | null;
}

export const SequenceList: React.FC<SequenceListProps> = ({
  groupedSequences,
  searchQuery,
  onSearchChange,
  filterPlugin,
  onFilterChange,
  showMountedOnly,
  onMountedFilterChange,
  pluginIds,
  stats,
  onTriggerSequence,
  isLoading,
  error
}) => {
  const [expandedPlugins, setExpandedPlugins] = React.useState<Set<string>>(new Set());

  const togglePlugin = (pluginId: string) => {
    setExpandedPlugins(prev => {
      const next = new Set(prev);
      if (next.has(pluginId)) {
        next.delete(pluginId);
      } else {
        next.add(pluginId);
      }
      return next;
    });
  };

  // Expand all plugins by default if there are few
  React.useEffect(() => {
    if (Object.keys(groupedSequences).length <= 3) {
      setExpandedPlugins(new Set(Object.keys(groupedSequences)));
    }
  }, [groupedSequences]);

  if (error) {
    return (
      <div className="sequence-list-error">
        <span className="error-icon">⚠️</span>
        <span>{error}</span>
      </div>
    );
  }

  return (
    <div className="sequence-list-container">
      {/* Header with stats */}
      <div className="sequence-list-header">
        <h3 className="sequence-list-title">
          Available Sequences ({stats.filtered})
        </h3>
        <div className="sequence-list-stats">
          <span className="stat-badge">
            {stats.total} total
          </span>
          <span className="stat-badge stat-badge-success">
            {stats.mounted} mounted
          </span>
          {stats.unmounted > 0 && (
            <span className="stat-badge stat-badge-warning">
              {stats.unmounted} unmounted
            </span>
          )}
        </div>
      </div>

      {/* Search and filters */}
      <div className="sequence-list-filters">
        <input
          type="text"
          className="sequence-search-input"
          placeholder="Search sequences..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
        />

        <div className="sequence-filter-row">
          <select
            className="sequence-filter-select"
            value={filterPlugin}
            onChange={(e) => onFilterChange(e.target.value)}
          >
            <option value="all">All Plugins ({stats.pluginCount})</option>
            {pluginIds.map(pluginId => (
              <option key={pluginId} value={pluginId}>
                {pluginId}
              </option>
            ))}
          </select>

          <label className="sequence-filter-checkbox">
            <input
              type="checkbox"
              checked={showMountedOnly}
              onChange={(e) => onMountedFilterChange(e.target.checked)}
            />
            <span>Mounted only</span>
          </label>
        </div>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="sequence-list-loading">
          <span>Loading sequences...</span>
        </div>
      )}

      {/* Sequence list */}
      {!isLoading && Object.keys(groupedSequences).length === 0 && (
        <div className="sequence-list-empty">
          <span className="empty-icon">🔍</span>
          <span>No sequences found</span>
          {searchQuery && (
            <button
              className="button-link"
              onClick={() => onSearchChange('')}
            >
              Clear search
            </button>
          )}
        </div>
      )}

      {!isLoading && Object.keys(groupedSequences).length > 0 && (
        <div className="sequence-list-groups">
          {Object.entries(groupedSequences).map(([pluginId, sequences]) => (
            <div key={pluginId} className="sequence-group">
              <button
                className="sequence-group-header"
                onClick={() => togglePlugin(pluginId)}
              >
                <span className="sequence-group-icon">
                  {expandedPlugins.has(pluginId) ? '▼' : '▶'}
                </span>
                <span className="sequence-group-name">{pluginId}</span>
                <span className="sequence-group-count">
                  ({sequences.length})
                </span>
              </button>

              {expandedPlugins.has(pluginId) && (
                <div className="sequence-group-items">
                  {sequences.map(sequence => (
                    <div
                      key={sequence.sequenceId}
                      className={`sequence-item ${!sequence.isMounted ? 'sequence-item-unmounted' : ''}`}
                    >
                      <div className="sequence-item-info">
                        <div className="sequence-item-name">
                          {sequence.sequenceName}
                        </div>
                        <div className="sequence-item-id">
                          {sequence.sequenceId}
                        </div>
                        {sequence.description && (
                          <div className="sequence-item-description">
                            {sequence.description}
                          </div>
                        )}
                        {!sequence.isMounted && (
                          <div className="sequence-item-warning">
                            ⚠️ Not mounted
                          </div>
                        )}
                      </div>
                      <button
                        className="sequence-play-button"
                        onClick={() => onTriggerSequence(sequence)}
                        disabled={!sequence.isMounted}
                        title={sequence.isMounted ? 'Trigger sequence' : 'Sequence not mounted'}
                      >
                        ▶ Play
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

