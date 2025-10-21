// Global type declarations for @renderx/host-sdk

import type { ConductorClient } from "./conductor";
import type { TopicHandler, Unsubscribe } from "./EventRouter";
import type { Route } from "./interactionManifest";
import type { FlagMeta } from "./feature-flags";

// Inventory API types
export interface ComponentSummary {
  id: string;
  name: string;
  tags?: string[];
}

export interface Component {
  id: string;
  name: string;
  json: any;
  tags?: string[];
  metadata?: Record<string, any>;
}

export interface InventoryAPI {
  listComponents(): Promise<ComponentSummary[]>;
  getComponentById(id: string): Promise<Component | null>;
  onInventoryChanged(callback: (components: ComponentSummary[]) => void): Unsubscribe;
}

// CSS Registry API types
export interface CssClassDef {
  name: string;
  rules: string;
  source?: string;
  metadata?: Record<string, any>;
}

export interface CssRegistryAPI {
  hasClass(name: string): Promise<boolean>;
  createClass(def: CssClassDef): Promise<void>;
  updateClass(name: string, def: CssClassDef): Promise<void>;
  onCssChanged(callback: (classes: CssClassDef[]) => void): Unsubscribe;
}

// Config API types
export interface ConfigAPI {
  getValue(key: string): string | undefined;
  hasValue(key: string): boolean;
}

declare global {
  interface Window {
    renderxCommunicationSystem?: {
      conductor: ConductorClient;
    };
    RenderX?: {
      conductor: ConductorClient;
      EventRouter?: {
        subscribe(topic: string, handler: TopicHandler): Unsubscribe;
        publish(topic: string, payload: any, conductor?: any): Promise<void>;
      };
      resolveInteraction?: (key: string) => Route;
      featureFlags?: {
        isFlagEnabled(id: string): boolean;
        getFlagMeta(id: string): FlagMeta | undefined;
        getAllFlags(): Record<string, FlagMeta>;
      };
      componentMapperConfig?: any;
      inventory?: InventoryAPI;
      cssRegistry?: CssRegistryAPI;
      config?: ConfigAPI;
    };
  }
}

export {};
