/**
 * Components Plugin Types
 */

export interface ComponentsPluginConfig {
  [key: string]: unknown;
}

export interface ComponentDefinition {
  id: string;
  name: string;
  type: string;
  properties?: Record<string, unknown>;
}

