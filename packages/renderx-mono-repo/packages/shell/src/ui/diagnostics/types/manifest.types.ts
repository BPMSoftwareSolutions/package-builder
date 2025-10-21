/**
 * Manifest Types
 * 
 * Type definitions for manifest data structures.
 */

import { PluginInfo } from './plugin.types';

export interface ManifestData {
  plugins: PluginInfo[];
}

export interface ComponentDetail {
  id: string;
  metadata?: {
    type: string;
    name?: string;
    description?: string;
  };
  [key: string]: any;
}

