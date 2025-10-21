/**
 * Statistics Types
 * 
 * Type definitions for plugin loading and performance statistics.
 */

export interface PluginLoadingStats {
  totalPlugins: number;
  loadedPlugins: number;
  failedPlugins: number;
  loadingTime: number;
}

