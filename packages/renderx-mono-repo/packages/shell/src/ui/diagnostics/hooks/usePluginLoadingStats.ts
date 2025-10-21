/**
 * usePluginLoadingStats Hook
 * 
 * Manages plugin loading statistics.
 * Extracted from DiagnosticsPanel.tsx as part of Phase 3 refactoring.
 * 
 * @see docs/refactoring/diagnostics-modularity-strategy.md
 * @see docs/refactoring/phase-3-implementation-guide.md
 */

import { useState, useCallback } from 'react';
import type { PluginLoadingStats } from '../types';

/**
 * Hook for managing plugin loading statistics
 * 
 * @returns Object containing stats and update functions
 */
export function usePluginLoadingStats() {
  const [stats, setStats] = useState<PluginLoadingStats>({
    totalPlugins: 0,
    loadedPlugins: 0,
    failedPlugins: 0,
    loadingTime: 0
  });

  /**
   * Updates plugin loading statistics
   * 
   * @param updates - Partial stats object with fields to update
   */
  const updateStats = useCallback((updates: Partial<PluginLoadingStats>) => {
    setStats(prev => ({ ...prev, ...updates }));
  }, []);

  /**
   * Resets all statistics to zero
   */
  const resetStats = useCallback(() => {
    setStats({
      totalPlugins: 0,
      loadedPlugins: 0,
      failedPlugins: 0,
      loadingTime: 0
    });
  }, []);

  return {
    stats,
    updateStats,
    resetStats
  };
}

