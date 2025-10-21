/**
 * Conductor Types
 * 
 * Type definitions for conductor introspection data.
 */

export interface ConductorIntrospection {
  mountedPluginIds: string[];
  discoveredPlugins: any[];
  runtimeMountedSeqIds: string[];
  sequenceCatalogDirs: string[];
}

