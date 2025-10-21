/**
 * Core Event Types
 * Centralized event type definitions for core system events
 */

export const CORE_EVENT_TYPES = {
  // Component Events
  COMPONENT_MOUNTED: 'component-mounted',
  COMPONENT_UNMOUNTED: 'component-unmounted',
  COMPONENT_UPDATED: 'component-updated',
  COMPONENT_ERROR: 'component-error',

  // System Events
  SYSTEM_ERROR: 'system-error',
  SYSTEM_WARNING: 'system-warning',
  SYSTEM_INFO: 'system-info'
} as const;

export type CoreEventType = typeof CORE_EVENT_TYPES[keyof typeof CORE_EVENT_TYPES];
