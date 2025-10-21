/**
 * Shell implementation for RenderX plugin system
 */

import { BaseShell, type ShellConfig } from '@renderx/contracts';

/**
 * RenderX Shell - Thin wrapper for managing plugins
 * 
 * The shell is responsible for:
 * - Plugin registration and lifecycle management
 * - Sequence execution coordination
 * - Event emission and listening
 * - Metrics collection
 */
export class Shell extends BaseShell {
  private initialized: boolean = false;

  constructor(config: ShellConfig = {}) {
    super(config);
  }

  /**
   * Initialize the shell
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    console.log(`🐚 Shell initialized: ${this.config.name || 'RenderX Shell'}`);
    this.initialized = true;

    if (this.config.autoInitialize) {
      // Auto-initialize plugins if configured
      for (const plugin of this.plugins.values()) {
        try {
          await plugin.activate();
          this.emit({
            type: 'plugin:activated',
            timestamp: new Date(),
            pluginId: plugin.metadata.id,
          });
        } catch (error) {
          this.emit({
            type: 'error',
            timestamp: new Date(),
            error: error instanceof Error ? error : new Error(String(error)),
          });
        }
      }
    }
  }

  /**
   * Shutdown the shell
   */
  async shutdown(): Promise<void> {
    console.log('🐚 Shell shutting down...');
    
    // Deactivate all plugins
    for (const plugin of this.plugins.values()) {
      try {
        await plugin.deactivate();
      } catch (error) {
        console.error(`Error deactivating plugin ${plugin.metadata.id}:`, error);
      }
    }

    this.plugins.clear();
    this.eventListeners.clear();
    this.initialized = false;
  }

  /**
   * Check if shell is initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }
}

/**
 * Factory function to create a shell instance
 */
export function createShell(config?: ShellConfig): Shell {
  return new Shell(config);
}

