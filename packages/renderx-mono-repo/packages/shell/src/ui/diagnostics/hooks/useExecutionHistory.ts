/**
 * useExecutionHistory Hook
 * 
 * Hook to store last 20 executions in memory with add/clear functions.
 * Part of Issue #306 - Release 2: Live Sequence Triggering.
 */

import { useState, useCallback } from 'react';
import { convertToHistoryItem } from '../services';
import type { ExecutionHistoryItem, LiveExecution, HistoryFilter, HistoryStats } from '../types';

const MAX_HISTORY_SIZE = 20;

/**
 * Hook for managing execution history
 * 
 * @returns Object containing history state and management functions
 */
export function useExecutionHistory() {
  const [history, setHistory] = useState<ExecutionHistoryItem[]>([]);
  const [filter, setFilter] = useState<HistoryFilter>({
    status: 'all',
    pluginId: 'all',
    searchQuery: ''
  });

  /**
   * Adds an execution to history
   */
  const addToHistory = useCallback((execution: LiveExecution) => {
    const historyItem = convertToHistoryItem(execution);
    
    setHistory(prev => {
      // Add to beginning of array (most recent first)
      const newHistory = [historyItem, ...prev];
      
      // Keep only last MAX_HISTORY_SIZE items
      return newHistory.slice(0, MAX_HISTORY_SIZE);
    });
  }, []);

  /**
   * Clears all history
   */
  const clearHistory = useCallback(() => {
    setHistory([]);
  }, []);

  /**
   * Removes a specific item from history
   */
  const removeFromHistory = useCallback((id: string) => {
    setHistory(prev => prev.filter(item => item.id !== id));
  }, []);

  /**
   * Gets filtered history based on current filter
   */
  const getFilteredHistory = useCallback((): ExecutionHistoryItem[] => {
    return history.filter(item => {
      // Filter by status
      if (filter.status !== 'all' && item.status !== filter.status) {
        return false;
      }

      // Filter by plugin
      if (filter.pluginId !== 'all' && item.pluginId !== filter.pluginId) {
        return false;
      }

      // Filter by search query
      if (filter.searchQuery) {
        const query = filter.searchQuery.toLowerCase();
        return (
          item.sequenceId.toLowerCase().includes(query) ||
          item.pluginId.toLowerCase().includes(query) ||
          (item.error && item.error.toLowerCase().includes(query))
        );
      }

      return true;
    });
  }, [history, filter]);

  /**
   * Gets statistics about the history
   */
  const getStats = useCallback((): HistoryStats => {
    const filteredHistory = getFilteredHistory();
    
    return {
      total: history.length,
      success: history.filter(item => item.status === 'success').length,
      error: history.filter(item => item.status === 'error').length,
      filtered: filteredHistory.length,
      avgDuration: history.length > 0
        ? history.reduce((sum, item) => sum + (item.totalDuration || 0), 0) / history.length
        : 0
    };
  }, [history, getFilteredHistory]);

  /**
   * Gets unique plugin IDs from history
   */
  const getPluginIds = useCallback((): string[] => {
    const pluginIds = new Set(history.map(item => item.pluginId));
    return Array.from(pluginIds).sort();
  }, [history]);

  /**
   * Finds a history item by ID
   */
  const findById = useCallback((id: string): ExecutionHistoryItem | undefined => {
    return history.find(item => item.id === id);
  }, [history]);

  return {
    history,
    filteredHistory: getFilteredHistory(),
    filter,
    setFilter,
    stats: getStats(),
    pluginIds: getPluginIds(),
    addToHistory,
    clearHistory,
    removeFromHistory,
    findById
  };
}

