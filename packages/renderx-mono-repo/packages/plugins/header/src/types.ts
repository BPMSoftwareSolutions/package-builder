/**
 * Header Plugin Types
 */

export interface HeaderPluginConfig {
  [key: string]: unknown;
}

export interface HeaderComponent {
  id: string;
  name: string;
  type: string;
  position?: 'left' | 'center' | 'right';
}

