/**
 * @renderx/sdk
 * Core interfaces and base classes for RenderX plugin development
 */

/**
 * Base class for all RenderX plugins
 */
export abstract class Plugin {
  abstract name: string;
  abstract version: string;

  /**
   * Initialize the plugin
   */
  abstract initialize(): Promise<void>;

  /**
   * Cleanup the plugin
   */
  abstract cleanup(): Promise<void>;
}

/**
 * Plugin manifest interface
 */
export interface PluginManifest {
  name: string;
  version: string;
  description?: string;
  exports?: string[];
}

export type { PluginManifest };

