/**
 * Conductor Service
 * 
 * Handles introspection and interaction with the Musical Conductor.
 * Extracted from DiagnosticsPanel.tsx as part of Phase 2 refactoring.
 * 
 * @see docs/refactoring/diagnostics-modularity-strategy.md
 */

import type { ConductorIntrospection } from '../types';

/**
 * Introspects the conductor to extract runtime information
 * 
 * @param conductorInstance - The conductor instance to introspect
 * @returns Conductor introspection data
 */
export function introspectConductor(conductorInstance: any): ConductorIntrospection {
  try {
    return {
      mountedPluginIds: conductorInstance?.getMountedPluginIds?.() || [],
      discoveredPlugins: conductorInstance?._discoveredPlugins || [],
      runtimeMountedSeqIds: Array.from(conductorInstance?._runtimeMountedSeqIds || []),
      sequenceCatalogDirs: conductorInstance?._sequenceCatalogDirsFromManifest || []
    };
  } catch (error) {
    console.warn('Failed to introspect conductor:', error);
    return {
      mountedPluginIds: [],
      discoveredPlugins: [],
      runtimeMountedSeqIds: [],
      sequenceCatalogDirs: []
    };
  }
}

/**
 * Gets the list of mounted plugin IDs from the conductor
 * 
 * @param conductorInstance - The conductor instance
 * @returns Array of mounted plugin IDs
 */
export function getMountedPluginIds(conductorInstance: any): string[] {
  try {
    return conductorInstance?.getMountedPluginIds?.() || [];
  } catch (error) {
    console.warn('Failed to get mounted plugin IDs:', error);
    return [];
  }
}

/**
 * Gets the list of discovered plugins from the conductor
 * 
 * @param conductorInstance - The conductor instance
 * @returns Array of discovered plugins
 */
export function getDiscoveredPlugins(conductorInstance: any): any[] {
  try {
    return conductorInstance?._discoveredPlugins || [];
  } catch (error) {
    console.warn('Failed to get discovered plugins:', error);
    return [];
  }
}

/**
 * Gets the list of runtime mounted sequence IDs from the conductor
 * 
 * @param conductorInstance - The conductor instance
 * @returns Array of runtime mounted sequence IDs
 */
export function getRuntimeMountedSeqIds(conductorInstance: any): string[] {
  try {
    return Array.from(conductorInstance?._runtimeMountedSeqIds || []);
  } catch (error) {
    console.warn('Failed to get runtime mounted sequence IDs:', error);
    return [];
  }
}

/**
 * Gets the sequence catalog directories from the conductor
 * 
 * @param conductorInstance - The conductor instance
 * @returns Array of sequence catalog directories
 */
export function getSequenceCatalogDirs(conductorInstance: any): string[] {
  try {
    return conductorInstance?._sequenceCatalogDirsFromManifest || [];
  } catch (error) {
    console.warn('Failed to get sequence catalog directories:', error);
    return [];
  }
}

/**
 * Checks if a plugin is mounted in the conductor
 * 
 * @param conductorInstance - The conductor instance
 * @param pluginId - The ID of the plugin to check
 * @returns true if the plugin is mounted, false otherwise
 */
export function isPluginMounted(conductorInstance: any, pluginId: string): boolean {
  const mountedIds = getMountedPluginIds(conductorInstance);
  return mountedIds.includes(pluginId);
}

/**
 * Checks if a sequence is mounted in the conductor
 * 
 * @param conductorInstance - The conductor instance
 * @param sequenceId - The ID of the sequence to check
 * @returns true if the sequence is mounted, false otherwise
 */
export function isSequenceMounted(conductorInstance: any, sequenceId: string): boolean {
  const mountedSeqIds = getRuntimeMountedSeqIds(conductorInstance);
  return mountedSeqIds.includes(sequenceId);
}

