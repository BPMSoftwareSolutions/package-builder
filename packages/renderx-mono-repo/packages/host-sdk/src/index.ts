/**
 * @renderx/host-sdk
 * Host application interfaces and plugin loading mechanisms
 */

/**
 * Plugin loader interface
 */
export interface PluginLoader {
  /**
   * Load a plugin from manifest
   */
  loadPlugin(manifest: any): Promise<any>;

  /**
   * Unload a plugin
   */
  unloadPlugin(name: string): Promise<void>;

  /**
   * Get loaded plugins
   */
  getLoadedPlugins(): string[];
}

/**
 * Create a new plugin loader
 */
export function createPluginLoader(): PluginLoader {
  return {
    loadPlugin: async () => ({}),
    unloadPlugin: async () => {},
    getLoadedPlugins: () => []
  };
}

