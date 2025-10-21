/**
 * Control Panel Plugin Types
 */

export interface ControlPanelPluginConfig {
  [key: string]: unknown;
}

export interface PropertyDefinition {
  id: string;
  name: string;
  type: string;
  value?: unknown;
  editable?: boolean;
}

