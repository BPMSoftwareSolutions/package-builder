/**
 * @renderx/contracts
 * Shared interfaces and type definitions for RenderX
 */

/**
 * Base plugin interface
 */
export interface IPlugin {
  name: string;
  version: string;
  initialize(): Promise<void>;
  cleanup(): Promise<void>;
}

/**
 * Plugin manifest interface
 */
export interface IPluginManifest {
  name: string;
  version: string;
  description?: string;
  exports?: string[];
}

/**
 * Event interface
 */
export interface IEvent {
  topic: string;
  data: any;
  timestamp: number;
}

/**
 * Conductor interface
 */
export interface IConductor {
  registerPlugin(name: string, plugin: IPlugin): void;
  unregisterPlugin(name: string): void;
  publish(topic: string, data: any): void;
  subscribe(topic: string, handler: (event: IEvent) => void): void;
}

