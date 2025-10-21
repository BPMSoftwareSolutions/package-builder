/**
 * Shell interface and event system for RenderX
 */

import type { IShell, IPlugin, PluginId, SequenceId, ShellEvent, ShellEventListener, ShellConfig, ShellMetrics } from './types.js';

/**
 * Abstract base class for shell implementations
 */
export abstract class BaseShell implements IShell {
  protected plugins: Map<PluginId, IPlugin> = new Map();
  protected eventListeners: Set<ShellEventListener> = new Set();
  protected config: ShellConfig;
  protected startTime: Date = new Date();

  constructor(config: ShellConfig = {}) {
    this.config = config;
  }

  /**
   * Register a plugin with the shell
   */
  async registerPlugin(plugin: IPlugin): Promise<void> {
    const pluginId = plugin.metadata.id as PluginId;
    
    if (this.plugins.has(pluginId)) {
      throw new Error(`Plugin ${pluginId} is already registered`);
    }

    await plugin.initialize();
    this.plugins.set(pluginId, plugin);
    
    this.emit({
      type: 'plugin:registered',
      timestamp: new Date(),
      pluginId,
      data: plugin.metadata,
    });
  }

  /**
   * Unregister a plugin from the shell
   */
  async unregisterPlugin(pluginId: PluginId): Promise<void> {
    const plugin = this.plugins.get(pluginId);
    
    if (!plugin) {
      throw new Error(`Plugin ${pluginId} is not registered`);
    }

    await plugin.deactivate();
    this.plugins.delete(pluginId);
    
    this.emit({
      type: 'plugin:unregistered',
      timestamp: new Date(),
      pluginId,
    });
  }

  /**
   * Get a plugin by ID
   */
  getPlugin(pluginId: PluginId): IPlugin | undefined {
    return this.plugins.get(pluginId);
  }

  /**
   * List all registered plugins
   */
  listPlugins() {
    return Array.from(this.plugins.values()).map(p => p.metadata);
  }

  /**
   * Execute a sequence in a plugin
   */
  async executeSequence(
    pluginId: PluginId,
    sequenceId: SequenceId,
    params: Record<string, unknown>
  ): Promise<unknown> {
    const plugin = this.getPlugin(pluginId);
    
    if (!plugin) {
      throw new Error(`Plugin ${pluginId} not found`);
    }

    try {
      const startTime = Date.now();
      const result = await plugin.executeSequence(sequenceId, params);
      const duration = Date.now() - startTime;

      this.emit({
        type: 'sequence:executed',
        timestamp: new Date(),
        pluginId,
        sequenceId,
        data: { result, duration },
      });

      return result;
    } catch (error) {
      this.emit({
        type: 'sequence:failed',
        timestamp: new Date(),
        pluginId,
        sequenceId,
        error: error instanceof Error ? error : new Error(String(error)),
      });
      throw error;
    }
  }

  /**
   * Subscribe to shell events
   */
  on(listener: ShellEventListener): void {
    this.eventListeners.add(listener);
  }

  /**
   * Unsubscribe from shell events
   */
  off(listener: ShellEventListener): void {
    this.eventListeners.delete(listener);
  }

  /**
   * Emit a shell event
   */
  protected emit(event: ShellEvent): void {
    this.eventListeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.error('Error in shell event listener:', error);
      }
    });
  }

  /**
   * Get shell metrics
   */
  getMetrics(): ShellMetrics {
    return {
      totalPlugins: this.plugins.size,
      activePlugins: this.plugins.size,
      totalSequencesExecuted: 0,
      failedSequences: 0,
      averageExecutionTime: 0,
      uptime: Date.now() - this.startTime.getTime(),
    };
  }
}

