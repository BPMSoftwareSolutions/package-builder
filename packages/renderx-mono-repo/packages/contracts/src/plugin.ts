/**
 * Plugin interface and base class for RenderX plugins
 */

import type { IPlugin, PluginMetadata, Sequence, SequenceId } from './types.js';

/**
 * Abstract base class for plugins
 * Plugins should extend this class and implement the required methods
 */
export abstract class BasePlugin implements IPlugin {
  abstract metadata: PluginMetadata;
  protected sequences: Map<SequenceId, Sequence> = new Map();

  /**
   * Initialize the plugin
   * Called when the plugin is first loaded
   */
  abstract initialize(): Promise<void>;

  /**
   * Activate the plugin
   * Called when the plugin is activated by the shell
   */
  abstract activate(): Promise<void>;

  /**
   * Deactivate the plugin
   * Called when the plugin is deactivated by the shell
   */
  abstract deactivate(): Promise<void>;

  /**
   * Get a sequence by ID
   */
  getSequence(id: SequenceId): Sequence | undefined {
    return this.sequences.get(id);
  }

  /**
   * Execute a sequence
   */
  async executeSequence(id: SequenceId, params: Record<string, unknown>): Promise<unknown> {
    const sequence = this.getSequence(id);
    if (!sequence) {
      throw new Error(`Sequence ${id} not found in plugin ${this.metadata.id}`);
    }
    return sequence.handler(params);
  }

  /**
   * Register a sequence
   */
  protected registerSequence(sequence: Sequence): void {
    this.sequences.set(sequence.id, sequence);
  }

  /**
   * Unregister a sequence
   */
  protected unregisterSequence(id: SequenceId): void {
    this.sequences.delete(id);
  }
}

/**
 * Plugin factory function type
 */
export type PluginFactory = () => IPlugin | Promise<IPlugin>;

/**
 * Plugin loader interface
 */
export interface IPluginLoader {
  load(path: string): Promise<IPlugin>;
  unload(pluginId: string): Promise<void>;
}

