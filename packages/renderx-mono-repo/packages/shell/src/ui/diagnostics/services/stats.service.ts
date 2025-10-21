/**
 * Stats Service
 * 
 * Handles aggregation and calculation of statistics from various sources.
 * Extracted from DiagnosticsPanel.tsx as part of Phase 2 refactoring.
 * 
 * @see docs/refactoring/diagnostics-modularity-strategy.md
 */

import { getInteractionManifestStats, resolveInteraction } from "@renderx-plugins/host-sdk/core/manifests/interactionManifest";
import { getTopicsManifestStats } from "@renderx-plugins/host-sdk/core/manifests/topicsManifest";
import { getPluginManifestStats } from "@renderx-plugins/host-sdk/core/startup/startupValidation";
import { listComponents } from "../../../domain/components/inventory/inventory.service";
import type { ComponentDetail } from '../types';

/**
 * Loads interaction manifest data with detailed information
 * 
 * @returns Promise resolving to interaction manifest stats with details
 */
export async function loadInteractionManifestData(): Promise<any> {
  try {
    // Load the manifest directly to get all routes
    const response = await fetch('/interaction-manifest.json');
    let manifest = null;
    if (response.ok) {
      manifest = await response.json();
    }
    const stats = getInteractionManifestStats();

    // Build routes array from manifest
    let routesArray: any[] = [];
    if (manifest && manifest.routes) {
      routesArray = Object.entries(manifest.routes).map(([route, def]: [string, any]) => ({
        route,
        pluginId: def.pluginId,
        sequenceId: def.sequenceId
      }));
    }

    // Try to get detailed interaction data (legacy, can be removed if not needed)
    const detailedInteractions: any[] = [];
    if (stats.totalInteractions > 0) {
      try {
        const sampleInteractionIds = ['component.create', 'component.select', 'component.update'];
        for (const id of sampleInteractionIds) {
          try {
            const interaction = resolveInteraction(id);
            if (interaction) {
              detailedInteractions.push({
                id,
                ...interaction
              });
            }
          } catch {
            // Skip interactions that can't be resolved
          }
        }
      } catch (error) {
        console.warn('Failed to load detailed interactions:', error);
      }
    }

    return {
      ...stats,
      routes: routesArray,
      interactions: detailedInteractions
    };
  } catch (error) {
    console.warn('Failed to load interaction manifest data:', error);
    // Fallback to stats only
    return getInteractionManifestStats();
  }
}

/**
 * Loads topics manifest statistics
 * 
 * @returns Topics manifest stats
 */
export function loadTopicsManifestData(): any {
  return getTopicsManifestStats();
}

/**
 * Loads plugin manifest statistics
 * 
 * @returns Promise resolving to plugin manifest stats
 */
export async function loadPluginManifestData(): Promise<any> {
  return getPluginManifestStats();
}

/**
 * Loads component inventory data
 * 
 * @returns Promise resolving to array of components
 */
export async function loadComponentsData(): Promise<ComponentDetail[]> {
  try {
    return await listComponents();
  } catch (error) {
    console.warn('Failed to load components:', error);
    return [];
  }
}

/**
 * Aggregates all statistics from various sources
 * 
 * @returns Promise resolving to aggregated stats object
 */
export async function aggregateAllStats(): Promise<{
  interactionStats: any;
  topicsStats: any;
  pluginStats: any;
  components: ComponentDetail[];
}> {
  const [interactionStats, topicsStats, pluginStats, components] = await Promise.all([
    loadInteractionManifestData(),
    Promise.resolve(loadTopicsManifestData()),
    loadPluginManifestData(),
    loadComponentsData()
  ]);

  return {
    interactionStats,
    topicsStats,
    pluginStats,
    components
  };
}

/**
 * Calculates summary statistics for the diagnostics panel
 * 
 * @param interactionStats - Interaction manifest stats
 * @param topicsStats - Topics manifest stats
 * @param pluginStats - Plugin manifest stats
 * @param components - Component inventory
 * @returns Summary statistics object
 */
export function calculateSummaryStats(
  interactionStats: any,
  topicsStats: any,
  pluginStats: any,
  components: ComponentDetail[]
): {
  totalInteractions: number;
  totalTopics: number;
  totalPlugins: number;
  totalComponents: number;
  totalRoutes: number;
} {
  return {
    totalInteractions: interactionStats?.totalInteractions || 0,
    totalTopics: topicsStats?.totalTopics || 0,
    totalPlugins: pluginStats?.totalPlugins || 0,
    totalComponents: components.length,
    totalRoutes: interactionStats?.totalRoutes || 0
  };
}

/**
 * Formats loading time in a human-readable format
 * 
 * @param milliseconds - Time in milliseconds
 * @returns Formatted time string
 */
export function formatLoadingTime(milliseconds: number): string {
  if (milliseconds < 1000) {
    return `${milliseconds}ms`;
  }
  const seconds = (milliseconds / 1000).toFixed(2);
  return `${seconds}s`;
}

/**
 * Calculates average loading time per plugin
 * 
 * @param totalTime - Total loading time in milliseconds
 * @param pluginCount - Number of plugins loaded
 * @returns Average time per plugin in milliseconds
 */
export function calculateAverageLoadTime(totalTime: number, pluginCount: number): number {
  if (pluginCount === 0) return 0;
  return Math.round(totalTime / pluginCount);
}

/**
 * Calculates success rate percentage
 * 
 * @param successful - Number of successful operations
 * @param total - Total number of operations
 * @returns Success rate as a percentage (0-100)
 */
export function calculateSuccessRate(successful: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((successful / total) * 100);
}

