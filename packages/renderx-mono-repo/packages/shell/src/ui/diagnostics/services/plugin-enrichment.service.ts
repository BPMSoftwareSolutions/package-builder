/**
 * Plugin Enrichment Service
 * 
 * Handles enriching plugin data with additional information from various sources.
 * Extracted from DiagnosticsPanel.tsx as part of Phase 2 refactoring.
 * 
 * @see docs/refactoring/diagnostics-modularity-strategy.md
 */

import type { PluginInfo, RuntimeSequence, RuntimeHandler } from '../types';

/**
 * Maps plugin IDs to their sequence catalog directory names
 * This handles legacy naming conventions where plugin IDs don't match directory names
 *
 * @param pluginId - The plugin ID from the manifest
 * @returns The directory name for the plugin's sequence catalog
 */
function mapPluginIdToCatalogDir(pluginId: string): string {
  // Legacy mappings from plugin IDs to catalog directory names
  const mappings: Record<string, string> = {
    'CanvasComponentPlugin': 'canvas-component',
    'LibraryPlugin': 'library',
    'LibraryComponentPlugin': 'library-component',
    'ControlPanelPlugin': 'control-panel',
    'HeaderTitlePlugin': 'header',
    'HeaderControlsPlugin': 'header',
    'HeaderThemePlugin': 'header',
    'CanvasPlugin': 'canvas',
  };

  return mappings[pluginId] || pluginId;
}

/**
 * Loads sequence data for a plugin from JSON catalogs
 *
 * @param pluginId - The ID of the plugin to load sequences for
 * @returns Promise resolving to array of runtime sequences
 */
export async function loadPluginSequences(pluginId: string): Promise<RuntimeSequence[]> {
  try {
    // Map plugin ID to catalog directory name
    const catalogDir = mapPluginIdToCatalogDir(pluginId);

    // Try to load the index.json catalog for this plugin
    const catalogResponse = await fetch(`/json-sequences/${catalogDir}/index.json`);
    if (!catalogResponse.ok) {
      return [];
    }

    const catalog = await catalogResponse.json();
    const sequences: RuntimeSequence[] = [];

    // Load each sequence file listed in the catalog
    if (Array.isArray(catalog.sequences)) {
      for (const seqEntry of catalog.sequences) {
        try {
          const seqFile = seqEntry.file || seqEntry;
          const seqResponse = await fetch(`/json-sequences/${catalogDir}/${seqFile}`);
          if (seqResponse.ok) {
            const seqData = await seqResponse.json();

            // Extract handler names from movements/beats
            const handlers: RuntimeHandler[] = [];
            if (Array.isArray(seqData.movements)) {
              for (const movement of seqData.movements) {
                if (Array.isArray(movement.beats)) {
                  for (const beat of movement.beats) {
                    if (beat.handler && !handlers.find(h => h.name === beat.handler)) {
                      handlers.push({ name: beat.handler });
                    }
                  }
                }
              }
            }

            sequences.push({
              id: seqData.id || seqFile.replace('.json', ''),
              name: seqData.name || seqData.id || seqFile.replace('.json', ''),
              description: seqData.description,
              handlers: handlers.length > 0 ? handlers : undefined,
              movements: seqData.movements?.map((m: any) => ({
                from: m.id || 'start',
                to: m.id || 'end'
              })),
              parameters: seqData.parameters,
              returns: seqData.returns
            });
          }
        } catch (error) {
          // Skip sequences that fail to load
          console.warn(`Failed to load sequence ${seqEntry}:`, error);
        }
      }
    }

    return sequences;
  } catch (error) {
    console.warn(`Failed to load sequences for plugin ${pluginId}:`, error);
    return [];
  }
}

/**
 * Enriches a plugin with sample UI configuration data
 * This is used for demonstration purposes for specific plugins
 * 
 * @param plugin - The plugin to enrich
 * @returns The plugin with enriched UI configuration
 */
function enrichUiConfiguration(plugin: PluginInfo): PluginInfo {
  let enrichedUi = plugin.ui;
  
  // Add sample data for demonstration (only for LibraryPlugin as example)
  if (plugin.ui && !plugin.ui.dependencies && !plugin.ui.props && !plugin.ui.events) {
    if (plugin.id === 'LibraryPlugin') {
      enrichedUi = {
        ...plugin.ui,
        dependencies: [
          { name: 'react', version: '18.2.0', size: '42.3 KB', license: 'MIT' },
          { name: 'lucide-react', version: '0.263.1', size: '156 KB', license: 'ISC' }
        ],
        props: {
          theme: {
            type: 'string',
            default: 'light',
            required: false,
            validation: { enum: ['light', 'dark'] }
          },
          onComponentSelect: {
            type: 'function',
            required: true
          }
        },
        events: [
          {
            name: 'component.selected',
            payloadSchema: { componentId: 'string' },
            frequency: 'on-demand',
            subscribers: ['ControlPanelPlugin']
          }
        ],
        styling: {
          cssClasses: ['library-panel', 'scrollable'],
          themeVariables: { '--library-bg': '#ffffff', '--library-border': '#e0e0e0' }
        },
        lifecycleHooks: {
          onMount: 'initializeLibrary',
          onUpdate: 'refreshComponents',
          onUnmount: 'cleanup'
        }
      };
    }
  }

  return {
    ...plugin,
    ui: enrichedUi
  };
}

/**
 * Enriches a plugin with runtime configuration including sequence data
 * 
 * @param plugin - The plugin to enrich
 * @returns Promise resolving to the plugin with enriched runtime configuration
 */
async function enrichRuntimeConfiguration(plugin: PluginInfo): Promise<PluginInfo> {
  let enrichedRuntime = plugin.runtime;
  
  if (plugin.runtime) {
    const sequences = await loadPluginSequences(plugin.id);
    enrichedRuntime = {
      ...plugin.runtime,
      sequences: sequences.length > 0 ? sequences : undefined
    };
  }

  return {
    ...plugin,
    runtime: enrichedRuntime
  };
}

/**
 * Enriches plugin data with fallback values and additional information
 * 
 * @param plugin - The plugin to enrich
 * @returns Promise resolving to the enriched plugin
 */
export async function enrichPluginData(plugin: PluginInfo): Promise<PluginInfo> {
  // Enrich UI configuration with sample data if needed
  let enriched = enrichUiConfiguration(plugin);
  
  // Enrich runtime configuration with sequence data
  enriched = await enrichRuntimeConfiguration(enriched);

  // Add fallback values for missing fields
  return {
    ...enriched,
    version: enriched.version || '1.0.0',
    status: enriched.status || 'loaded',
    topics: enriched.topics || { subscribes: [], publishes: [] },
    sequences: enriched.sequences || [],
    // Keep other fields as-is (undefined if not present)
  };
}

/**
 * Enriches all plugins in a manifest
 * 
 * @param plugins - Array of plugins to enrich
 * @returns Promise resolving to array of enriched plugins
 */
export async function enrichAllPlugins(plugins: PluginInfo[]): Promise<PluginInfo[]> {
  return Promise.all(plugins.map(p => enrichPluginData(p)));
}

