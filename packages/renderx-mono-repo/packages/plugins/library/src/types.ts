/**
 * Library Plugin Types
 */

export interface LibraryPluginConfig {
  [key: string]: unknown;
}

export interface LibraryItem {
  id: string;
  name: string;
  category: string;
  description?: string;
  tags?: string[];
}

