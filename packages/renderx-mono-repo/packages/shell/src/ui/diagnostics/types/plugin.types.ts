/**
 * Plugin Types
 * 
 * Type definitions for plugin information and metadata.
 */

import { UIConfiguration } from './ui-config.types';
import { RuntimeConfiguration } from './runtime.types';

export interface PluginInfo {
  id: string;
  ui?: UIConfiguration;
  runtime?: RuntimeConfiguration;
  // Extended metadata fields with fallback defaults
  version?: string;
  author?: string;
  description?: string;
  loadTime?: number;
  memoryUsage?: string;
  status?: 'loaded' | 'unloaded' | 'failed' | 'loading' | 'deprecated';
  topics?: { subscribes: string[], publishes: string[] };
  sequences?: string[];
  permissions?: any;
  configuration?: any;
  metrics?: any;
  dependencies?: any;
}

export interface Route {
  route: string;
  pluginId: string;
  sequenceId: string;
}

export interface TopicDef {
  routes: Array<{ pluginId: string; sequenceId: string }>;
  visibility?: string;
  notes?: string;
  perf?: {
    throttleMs?: number;
    debounceMs?: number;
    dedupeWindowMs?: number;
  };
  payloadSchema?: any;
}

