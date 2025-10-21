/**
 * SequencePlayer Component
 *
 * Main component for the Diagnostic Sequence Player.
 * Combines LogParser, SequenceTimeline, and ExecutionStats (Issue #305).
 * Added Live Triggering functionality (Issue #306).
 */

import React, { useState } from 'react';
import { useLogParser, useSequenceList, useSequenceExecution, useExecutionHistory } from '../../hooks';
import { isConductorAvailable } from '../../services';
import { LogParser } from './LogParser';
import { SequenceTimeline } from './SequenceTimeline';
import { ExecutionStats } from './ExecutionStats';
import { SequenceList } from './SequenceList';
import { SequenceTrigger } from './SequenceTrigger';
import { LiveExecutionMonitor } from './LiveExecutionMonitor';
import { ExecutionHistory } from './ExecutionHistory';
import type { AvailableSequence } from '../../types';

type TabMode = 'log-replay' | 'live-trigger';

export const SequencePlayer: React.FC = () => {
  // Tab state
  const [activeTab, setActiveTab] = useState<TabMode>('log-replay');
  const [conductorAvailable] = useState(() => isConductorAvailable());

  // Log Replay hooks (Issue #305)
  const {
    execution,
    stats,
    error,
    isLoading,
    autoConverted,
    allExecutions,
    currentIndex,
    totalSequences,
    hasMultipleSequences,
    parse,
    clear,
    exportJson,
    goToSequence,
    nextSequence,
    prevSequence
  } = useLogParser();

  // Live Triggering hooks (Issue #306)
  const {
    groupedSequences,
    searchQuery,
    setSearchQuery,
    filterPlugin,
    setFilterPlugin,
    showMountedOnly,
    setShowMountedOnly,
    pluginIds,
    stats: sequenceStats,
    isLoading: sequencesLoading,
    error: sequencesError
  } = useSequenceList();

  const {
    liveExecution,
    isExecuting,
    execute
  } = useSequenceExecution();

  const {
    filteredHistory,
    filter: historyFilter,
    setFilter: setHistoryFilter,
    stats: historyStats,
    pluginIds: historyPluginIds,
    addToHistory,
    clearHistory,
    removeFromHistory
  } = useExecutionHistory();

  // Selected sequence for triggering
  const [selectedSequence, setSelectedSequence] = useState<AvailableSequence | null>(null);

  // Calculate aggregate stats for all sequences (Log Replay)
  const aggregateStats = React.useMemo(() => {
    if (allExecutions.length === 0) return null;

    const totalDuration = allExecutions.reduce((sum, exec) => sum + exec.totalDuration, 0);
    const successCount = allExecutions.filter(exec => exec.status === 'success').length;
    const errorCount = allExecutions.filter(exec => exec.status === 'error').length;

    return {
      totalSequences: allExecutions.length,
      totalDuration,
      successCount,
      errorCount,
      successRate: Math.round((successCount / allExecutions.length) * 100)
    };
  }, [allExecutions]);

  // Handlers for Log Replay
  const handleExport = () => {
    const json = exportJson();
    if (!json) return;

    // Create a blob and download
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `execution-${execution?.requestId || 'export'}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Handlers for Live Triggering
  const handleTriggerSequence = (sequence: AvailableSequence) => {
    setSelectedSequence(sequence);
  };

  const handleExecuteSequence = async (sequence: AvailableSequence, parameters?: Record<string, any>) => {
    await execute(sequence, parameters);

    // Add to history when execution completes
    // Note: In a real implementation, this would be triggered by event listeners
    setTimeout(() => {
      if (liveExecution) {
        addToHistory(liveExecution);
      }
    }, 1500);
  };

  const handleCancelTrigger = () => {
    setSelectedSequence(null);
  };

  const handleSelectHistoryItem = (item: any) => {
    // For now, just log the item
    // In a full implementation, this could show the execution details
    console.log('Selected history item:', item);
  };

  return (
    <div className="sequence-player" style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '1rem',
      height: '100%',
      overflow: 'auto'
    }}>
      {/* Tab Navigation */}
      <div className="sequence-player-tabs">
        <button
          className={`sequence-player-tab ${activeTab === 'log-replay' ? 'active' : ''}`}
          onClick={() => setActiveTab('log-replay')}
        >
          📜 Log Replay
        </button>
        <button
          className={`sequence-player-tab ${activeTab === 'live-trigger' ? 'active' : ''}`}
          onClick={() => setActiveTab('live-trigger')}
          disabled={!conductorAvailable}
          title={!conductorAvailable ? 'Conductor not available' : 'Trigger sequences live'}
        >
          ▶️ Live Triggering
          {!conductorAvailable && ' (Unavailable)'}
        </button>
      </div>

      {/* Log Replay Tab */}
      {activeTab === 'log-replay' && (
        <>
          <LogParser
            onParse={parse}
            isLoading={isLoading}
            error={error}
          />

          {autoConverted && (
            <div style={{
              padding: '0.75rem 1rem',
              backgroundColor: '#e8f5e9',
              border: '1px solid #4caf50',
              borderRadius: '4px',
              color: '#2e7d32',
              fontSize: '0.9rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <span style={{ fontSize: '1.2rem' }}>✨</span>
              <span>
                <strong>Auto-converted from console log format!</strong>
                {' '}Your console logs were automatically detected and converted to JSON.
              </span>
            </div>
          )}

          {hasMultipleSequences && aggregateStats && (
            <>
              <div className="aggregate-stats-panel">
                <h3 className="aggregate-stats-title">
                  📊 Aggregate Stats (All Sequences)
                </h3>
                <div className="aggregate-stats-grid">
                  <div>
                    <strong>Total Sequences:</strong> {aggregateStats.totalSequences}
                  </div>
                  <div>
                    <strong>Total Duration:</strong> {aggregateStats.totalDuration.toFixed(1)}ms
                  </div>
                  <div>
                    <strong>Success Rate:</strong> {aggregateStats.successRate}% ({aggregateStats.successCount}/{aggregateStats.totalSequences})
                  </div>
                  {aggregateStats.errorCount > 0 && (
                    <div style={{ color: '#d32f2f' }}>
                      <strong>Failed:</strong> {aggregateStats.errorCount}
                    </div>
                  )}
                </div>
              </div>

              <div className="sequence-navigation">
                <div className="sequence-navigation-left">
                  <span className="sequence-counter">
                    Showing sequence {currentIndex + 1} of {totalSequences}
                  </span>

                  <select
                    value={currentIndex}
                    onChange={(e) => goToSequence(Number(e.target.value))}
                    className="sequence-selector"
                  >
                    {allExecutions.map((exec, index) => (
                      <option key={index} value={index}>
                        {index + 1}. {exec.sequenceName} ({exec.totalDuration}ms)
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sequence-navigation-buttons">
                  <button
                    onClick={prevSequence}
                    disabled={currentIndex === 0}
                    className="sequence-nav-button"
                  >
                    ← Previous
                  </button>
                  <button
                    onClick={nextSequence}
                    disabled={currentIndex === totalSequences - 1}
                    className="sequence-nav-button"
                  >
                    Next →
                  </button>
                </div>
              </div>
            </>
          )}

          {execution && stats && (
            <>
              <ExecutionStats
                stats={stats}
                onExport={handleExport}
              />

              <SequenceTimeline execution={execution} />

              <div style={{ padding: '1rem', textAlign: 'center' }}>
                <button
                  onClick={clear}
                  className="button-secondary"
                  style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: 'var(--bg-tertiary)',
                    color: 'var(--text-primary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Clear Results
                </button>
              </div>
            </>
          )}

          {!execution && !error && !isLoading && (
            <div style={{
              padding: '2rem',
              textAlign: 'center',
              color: 'var(--text-muted)',
              backgroundColor: 'var(--bg-secondary)',
              borderRadius: '4px',
              margin: '1rem'
            }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎬</div>
              <div style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>
                Log Replay Mode
              </div>
              <div style={{ fontSize: '0.9rem' }}>
                Paste or upload a sequence execution log to visualize what happened
              </div>
            </div>
          )}
        </>
      )}

      {/* Live Triggering Tab */}
      {activeTab === 'live-trigger' && (
        <>
          {!conductorAvailable ? (
            <div style={{
              padding: '2rem',
              textAlign: 'center',
              color: 'var(--text-muted)',
              backgroundColor: 'var(--bg-secondary)',
              borderRadius: '4px',
              margin: '1rem'
            }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
              <div style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>
                Conductor Not Available
              </div>
              <div style={{ fontSize: '0.9rem' }}>
                The conductor is not initialized. Live triggering is only available when the application is running.
              </div>
            </div>
          ) : (
            <div className="live-trigger-layout">
              {/* Left Column: Sequence List and Trigger */}
              <div className="live-trigger-left">
                <SequenceList
                  groupedSequences={groupedSequences}
                  searchQuery={searchQuery}
                  onSearchChange={setSearchQuery}
                  filterPlugin={filterPlugin}
                  onFilterChange={setFilterPlugin}
                  showMountedOnly={showMountedOnly}
                  onMountedFilterChange={setShowMountedOnly}
                  pluginIds={pluginIds}
                  stats={sequenceStats}
                  onTriggerSequence={handleTriggerSequence}
                  isLoading={sequencesLoading}
                  error={sequencesError}
                />

                <SequenceTrigger
                  sequence={selectedSequence}
                  isExecuting={isExecuting}
                  onTrigger={handleExecuteSequence}
                  onCancel={handleCancelTrigger}
                />
              </div>

              {/* Right Column: Live Monitor and History */}
              <div className="live-trigger-right">
                <LiveExecutionMonitor
                  execution={liveExecution}
                  isExecuting={isExecuting}
                />

                <ExecutionHistory
                  history={filteredHistory}
                  filter={historyFilter}
                  onFilterChange={setHistoryFilter}
                  stats={historyStats}
                  pluginIds={historyPluginIds}
                  onSelectItem={handleSelectHistoryItem}
                  onClearHistory={clearHistory}
                  onRemoveItem={removeFromHistory}
                />
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

