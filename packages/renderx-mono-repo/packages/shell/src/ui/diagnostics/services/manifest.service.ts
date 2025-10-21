/**
 * Manifest Service
 * 
 * Handles loading and processing of plugin manifests.
 * Extracted from DiagnosticsPanel.tsx as part of Phase 2 refactoring.
 * 
 * @see docs/refactoring/diagnostics-modularity-strategy.md
 */

import type { ManifestData, PluginInfo } from '../types';

/**
 * Loads the plugin manifest from the server
 * 
 * @returns Promise resolving to the manifest data or null if loading fails
 */
export async function loadPluginManifest(): Promise<ManifestData | null> {
  try {
    const response = await fetch('/plugins/plugin-manifest.json');
    if (!response.ok) {
      console.warn('Failed to load plugin manifest:', response.statusText);
      return null;
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error loading plugin manifest:', error);
    return null;
  }
}

/**
 * Validates that a manifest has the expected structure
 * 
 * @param manifest - The manifest to validate
 * @returns true if valid, false otherwise
 */
export function isValidManifest(manifest: any): manifest is ManifestData {
  return (
    manifest &&
    typeof manifest === 'object' &&
    Array.isArray(manifest.plugins)
  );
}

/**
 * Gets a plugin by ID from the manifest
 * 
 * @param manifest - The manifest to search
 * @param pluginId - The ID of the plugin to find
 * @returns The plugin info or undefined if not found
 */
export function getPluginById(
  manifest: ManifestData | null,
  pluginId: string
): PluginInfo | undefined {
  if (!manifest) return undefined;
  return manifest.plugins.find(p => p.id === pluginId);
}

/**
 * Gets all plugin IDs from the manifest
 * 
 * @param manifest - The manifest to extract IDs from
 * @returns Array of plugin IDs
 */
export function getPluginIds(manifest: ManifestData | null): string[] {
  if (!manifest) return [];
  return manifest.plugins.map(p => p.id);
}

/**
 * Filters plugins by a predicate function
 * 
 * @param manifest - The manifest to filter
 * @param predicate - Function to test each plugin
 * @returns Array of plugins matching the predicate
 */
export function filterPlugins(
  manifest: ManifestData | null,
  predicate: (plugin: PluginInfo) => boolean
): PluginInfo[] {
  if (!manifest) return [];
  return manifest.plugins.filter(predicate);
}

