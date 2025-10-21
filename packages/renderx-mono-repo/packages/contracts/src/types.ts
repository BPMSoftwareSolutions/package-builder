/**
 * Core type definitions for RenderX plugin system
 * These interfaces define the contract between plugins, shell, and conductor
 */

/**
 * Unique identifier for a plugin
 */
export type PluginId = string & { readonly __brand: 'PluginId' };

/**
 * Unique identifier for a sequence (callable action)
 */
export type SequenceId = string & { readonly __brand: 'SequenceId' };

/**
 * Plugin metadata describing the plugin
 */
export interface PluginMetadata {
  id: PluginId;
  name: string;
  version: string;
  description?: string;
  author?: string;
  capabilities: string[];
  dependencies?: PluginId[];
}

/**
 * Sequence parameter definition
 */
export interface SequenceParameter {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  required: boolean;
  description?: string;
  default?: unknown;
}

/**
 * Sequence return value definition
 */
export interface SequenceReturn {
  type: 'string' | 'number' | 'boolean' | 'object' | 'array' | 'void';
  description?: string;
}

/**
 * Sequence (callable action) definition
 */
export interface Sequence {
  id: SequenceId;
  name: string;
  description?: string;
  parameters: SequenceParameter[];
  returns: SequenceReturn;
  handler: (params: Record<string, unknown>) => Promise<unknown>;
}

/**
 * Plugin interface that all plugins must implement
 */
export interface IPlugin {
  metadata: PluginMetadata;
  sequences: Map<SequenceId, Sequence>;
  initialize(): Promise<void>;
  activate(): Promise<void>;
  deactivate(): Promise<void>;
  getSequence(id: SequenceId): Sequence | undefined;
  executeSequence(id: SequenceId, params: Record<string, unknown>): Promise<unknown>;
}

/**
 * Shell interface for managing plugins
 */
export interface IShell {
  registerPlugin(plugin: IPlugin): Promise<void>;
  unregisterPlugin(pluginId: PluginId): Promise<void>;
  getPlugin(pluginId: PluginId): IPlugin | undefined;
  listPlugins(): PluginMetadata[];
  executeSequence(pluginId: PluginId, sequenceId: SequenceId, params: Record<string, unknown>): Promise<unknown>;
}

/**
 * Event types emitted by the shell
 */
export type ShellEventType = 
  | 'plugin:registered'
  | 'plugin:unregistered'
  | 'plugin:activated'
  | 'plugin:deactivated'
  | 'sequence:executed'
  | 'sequence:failed'
  | 'error';

/**
 * Shell event
 */
export interface ShellEvent {
  type: ShellEventType;
  timestamp: Date;
  pluginId?: PluginId;
  sequenceId?: SequenceId;
  data?: unknown;
  error?: Error;
}

/**
 * Shell event listener
 */
export type ShellEventListener = (event: ShellEvent) => void;

/**
 * Shell configuration
 */
export interface ShellConfig {
  name?: string;
  version?: string;
  autoInitialize?: boolean;
  maxConcurrentSequences?: number;
  timeout?: number;
}

/**
 * Sequence execution result
 */
export interface SequenceExecutionResult {
  sequenceId: SequenceId;
  pluginId: PluginId;
  status: 'success' | 'failed' | 'timeout';
  result?: unknown;
  error?: Error;
  duration: number;
  timestamp: Date;
}

/**
 * Shell metrics
 */
export interface ShellMetrics {
  totalPlugins: number;
  activePlugins: number;
  totalSequencesExecuted: number;
  failedSequences: number;
  averageExecutionTime: number;
  uptime: number;
}

