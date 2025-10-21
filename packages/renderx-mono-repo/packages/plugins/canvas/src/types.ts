/**
 * Canvas Plugin Types
 */

export interface CanvasPluginConfig {
  [key: string]: unknown;
}

export interface CanvasOperation {
  type: string;
  payload?: unknown;
}

