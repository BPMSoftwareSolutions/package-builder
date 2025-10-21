/**
 * Line Element Component - Export
 * 
 * Simple export for the isolated Line element component.
 * Following component-driven architecture principles.
 */

export { default } from './Line.jsx';
export { default as LineResizeHandles } from './LineResizeHandles.jsx';

// Export hooks and utilities for testing purposes
export { 
  useLineState, 
  useLineInteractions, 
  useLineAccessibility, 
  useLineKeyboard,
  useLineConnectionPoints,
  useLineGeometry
} from './Line.hooks.js';

export * from './Line.interactions.js';
export * from './Line.utils.js';
