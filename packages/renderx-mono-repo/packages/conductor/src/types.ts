/**
 * Conductor Type Definitions
 * Core types for the RenderX Conductor orchestration engine
 */

/**
 * Configuration for the Conductor
 */
export interface ConductorConfig {
  plugins: string[];
  mode: 'development' | 'production';
  timeout?: number; // milliseconds
  retryAttempts?: number;
}

/**
 * Plugin metadata
 */
export interface PluginMetadata {
  name: string;
  version: string;
  loaded: boolean;
  loadedAt?: Date;
  error?: Error;
}

/**
 * Symphony represents a high-level orchestration workflow
 */
export interface Symphony {
  id: string;
  name: string;
  movements: Movement[];
  status: 'pending' | 'running' | 'completed' | 'failed';
  createdAt: Date;
  completedAt?: Date;
}

/**
 * Movement represents a phase within a symphony
 */
export interface Movement {
  id: string;
  name: string;
  beats: Beat[];
  status: 'pending' | 'running' | 'completed' | 'failed';
  order: number;
}

/**
 * Beat represents an individual action within a movement
 */
export interface Beat {
  id: string;
  name: string;
  pluginId: string;
  sequenceId: string;
  data?: Record<string, any>;
  status: 'pending' | 'running' | 'completed' | 'failed';
  result?: any;
  error?: Error;
  duration?: number; // milliseconds
}

/**
 * Sequence represents a callable action in a plugin
 */
export interface Sequence {
  id: string;
  name: string;
  pluginId: string;
  handler: (data?: any) => Promise<any>;
}

/**
 * Event emitted by the conductor
 */
export interface ConductorEvent {
  type: 'symphony:start' | 'symphony:complete' | 'symphony:error' |
         'movement:start' | 'movement:complete' | 'movement:error' |
         'beat:start' | 'beat:complete' | 'beat:error' |
         'plugin:loaded' | 'plugin:error';
  symphonyId?: string;
  movementId?: string;
  beatId?: string;
  pluginId?: string;
  data?: any;
  error?: Error;
  timestamp: Date;
}

/**
 * Event listener callback
 */
export type EventListener = (event: ConductorEvent) => void;

/**
 * Conductor metrics
 */
export interface ConductorMetrics {
  totalSymphonies: number;
  completedSymphonies: number;
  failedSymphonies: number;
  activeMovements: number;
  completedBeats: number;
  failedBeats: number;
  avgBeatDuration: number; // milliseconds
  totalPluginsLoaded: number;
  pluginErrors: Record<string, number>;
}

