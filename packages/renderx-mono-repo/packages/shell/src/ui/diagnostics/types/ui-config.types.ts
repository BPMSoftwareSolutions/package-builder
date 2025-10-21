/**
 * UI Configuration Types
 * 
 * Type definitions for plugin UI configuration including dependencies,
 * props, events, styling, and lifecycle hooks.
 */

export interface UIDependency {
  name: string;
  version?: string;
  size?: string;
  license?: string;
}

export interface UIProp {
  type: string;
  default?: any;
  required?: boolean;
  validation?: any;
}

export interface UIEvent {
  name: string;
  payloadSchema?: any;
  frequency?: string;
  subscribers?: string[];
}

export interface UIStyling {
  cssClasses?: string[];
  themeVariables?: Record<string, string>;
}

export interface UILifecycleHooks {
  onMount?: string;
  onUpdate?: string;
  onUnmount?: string;
}

export interface UIConfiguration {
  slot: string;
  module: string;
  export: string;
  dependencies?: UIDependency[];
  props?: Record<string, UIProp>;
  events?: UIEvent[];
  styling?: UIStyling;
  lifecycleHooks?: UILifecycleHooks;
}

