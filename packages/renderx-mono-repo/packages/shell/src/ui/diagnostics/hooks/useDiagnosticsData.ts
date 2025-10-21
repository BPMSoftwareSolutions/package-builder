/**
 * useDiagnosticsData Hook
 * 
 * Manages loading and state for all diagnostics data.
 * Extracted from DiagnosticsPanel.tsx as part of Phase 3 refactoring.
 * 
 * @see docs/refactoring/diagnostics-modularity-strategy.md
 * @see docs/refactoring/phase-3-implementation-guide.md
 */

import { useState, useEffect, useCallback } from 'react';
import {
  loadPluginManifest,
  enrichAllPlugins,
  aggregateAllStats
} from '../services';
import type { ManifestData, ComponentDetail } from '../types';

/**
 * Hook for managing all diagnostics data
 * 
 * @param conductor - The conductor instance
 * @param onLog - Optional callback for logging
 * @returns Object containing all diagnostics data and refresh function
 */
export function useDiagnosticsData(
  conductor: any,
  onLog?: (level: 'info' | 'warn' | 'error', message: string, data?: any) => void
) {
  const [manifest, setManifest] = useState<ManifestData | null>(null);
  const [interactionStats, setInteractionStats] = useState<any>(null);
  const [topicsStats, setTopicsStats] = useState<any>(null);
  const [pluginStats, setPluginStats] = useState<any>(null);
  const [components, setComponents] = useState<ComponentDetail[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  /**
   * Loads all diagnostics data
   */
  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      onLog?.('info', 'Loading plugin manifest...');
      
      // Load plugin manifest
      const manifestData = await loadPluginManifest();
      if (!manifestData) {
        onLog?.('warn', 'Failed to load plugin manifest');
        return;
      }

      // Enrich plugin data with sequence information
      onLog?.('info', 'Enriching plugin data with sequence information...');
      const enrichedPlugins = await enrichAllPlugins(manifestData.plugins || []);
      const enrichedManifest = {
        ...manifestData,
        plugins: enrichedPlugins
      };
      
      setManifest(enrichedManifest);
      onLog?.('info', `Loaded ${enrichedPlugins.length} plugins from manifest`);

      // Aggregate all statistics
      onLog?.('info', 'Loading statistics...');
      const stats = await aggregateAllStats();
      setInteractionStats(stats.interactionStats);
      setTopicsStats(stats.topicsStats);
      setPluginStats(stats.pluginStats);
      setComponents(stats.components);

      onLog?.('info', 'Diagnostics data loaded successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(err instanceof Error ? err : new Error(errorMessage));
      onLog?.('error', 'Failed to load diagnostics data', err);
    } finally {
      setLoading(false);
    }
  }, [onLog]);

  /**
   * Refreshes all diagnostics data
   */
  const refresh = useCallback(async () => {
    await loadData();
  }, [loadData]);

  // Load data on mount
  useEffect(() => {
    loadData();
  }, [loadData]);

  return {
    manifest,
    interactionStats,
    topicsStats,
    pluginStats,
    components,
    loading,
    error,
    refresh
  };
}

