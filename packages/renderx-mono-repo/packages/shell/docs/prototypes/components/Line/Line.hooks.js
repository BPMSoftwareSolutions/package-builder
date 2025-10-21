/**
 * Line Hooks - State Management
 * 
 * Isolated hooks for Line element state management.
 * Handles line states, interactions, and canvas integration.
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { eventBus, EVENT_TYPES } from '../../../communication/EventBus.js';

/**
 * Main Line state hook (SIMPLIFIED)
 * Manages line DOM references only - Canvas handles all state
 */
export const useLineState = ({
  isOnCanvas = false
}) => {
  // Line DOM references
  const lineRef = useRef(null);
  const svgRef = useRef(null);

  return {
    lineRef,
    svgRef
  };
};

/**
 * Line interactions hook (SIMPLIFIED)
 * Handles line events and canvas integration
 */
export const useLineInteractions = ({
  onClick,
  onMouseDown,
  onMouseUp,
  onMouseEnter,
  onMouseLeave,
  isOnCanvas = false
}) => {
  // Handle click events - placeholder for legacy compatibility
  const handleClick = useCallback((e) => {
    // Click handling moved to Line.interactions.js using musical sequences
    if (onClick) {
      onClick(e);
    }
  }, [onClick]);

  // Handle mouse down events
  const handleMouseDown = useCallback((e) => {
    if (onMouseDown) {
      onMouseDown(e);
    }
  }, [onMouseDown]);

  // Handle mouse up events
  const handleMouseUp = useCallback((e) => {
    if (onMouseUp) {
      onMouseUp(e);
    }
  }, [onMouseUp]);

  // Handle mouse enter events
  const handleMouseEnter = useCallback((e) => {
    if (onMouseEnter) {
      onMouseEnter(e);
    }
  }, [onMouseEnter]);

  // Handle mouse leave events
  const handleMouseLeave = useCallback((e) => {
    if (onMouseLeave) {
      onMouseLeave(e);
    }
  }, [onMouseLeave]);

  // Handle focus events - placeholder for legacy compatibility
  const handleFocus = useCallback((e) => {
    // Focus handling moved to Line.interactions.js with musical sequences
    console.warn('[Line.hooks] Focus handling moved to Line.interactions.js - update component usage');
  }, []);

  // Handle blur events - placeholder for legacy compatibility
  const handleBlur = useCallback((e) => {
    // Blur handling moved to Line.interactions.js with musical sequences
    console.warn('[Line.hooks] Blur handling moved to Line.interactions.js - update component usage');
  }, []);

  return {
    handleClick,
    handleMouseDown,
    handleMouseUp,
    handleMouseEnter,
    handleMouseLeave,
    handleFocus,
    handleBlur
  };
};

/**
 * Line accessibility hook
 * Handles ARIA attributes and keyboard navigation
 */
export const useLineAccessibility = ({
  disabled = false,
  ariaLabel,
  ariaDescribedBy,
  role = 'img'
}) => {
  const getAriaAttributes = useCallback(() => {
    const attributes = {
      role,
      'aria-disabled': disabled
    };

    if (ariaLabel) {
      attributes['aria-label'] = ariaLabel;
    }

    if (ariaDescribedBy) {
      attributes['aria-describedby'] = ariaDescribedBy;
    }

    return attributes;
  }, [disabled, ariaLabel, ariaDescribedBy, role]);

  return {
    getAriaAttributes
  };
};

/**
 * Line keyboard navigation hook
 */
export const useLineKeyboard = ({
  onClick,
  disabled = false,
  lineRef
}) => {
  useEffect(() => {
    const line = lineRef?.current;
    if (!line || disabled) return;

    const handleKeyDown = (e) => {
      // Handle Enter and Space key presses
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        if (onClick) {
          onClick(e);
        }
      }
    };

    line.addEventListener('keydown', handleKeyDown);

    return () => {
      line.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClick, disabled, lineRef]);
};

/**
 * Line connection points hook
 * Manages connection point calculations and updates
 */
export const useLineConnectionPoints = ({
  startComponentId,
  endComponentId,
  startAnchor = 'center',
  endAnchor = 'center',
  elements = []
}) => {
  const [connectionPoints, setConnectionPoints] = useState({
    start: null,
    end: null
  });

  // Calculate connection points based on component positions
  const calculateConnectionPoints = useCallback(() => {
    if (!startComponentId || !endComponentId) return;

    const startComponent = elements.find(el => el.id === startComponentId);
    const endComponent = elements.find(el => el.id === endComponentId);

    if (!startComponent || !endComponent) return;

    // Calculate anchor positions
    const startPoint = calculateAnchorPosition(startComponent, startAnchor);
    const endPoint = calculateAnchorPosition(endComponent, endAnchor);

    setConnectionPoints({
      start: startPoint,
      end: endPoint
    });
  }, [startComponentId, endComponentId, startAnchor, endAnchor, elements]);

  // Update connection points when dependencies change
  useEffect(() => {
    calculateConnectionPoints();
  }, [calculateConnectionPoints]);

  return {
    connectionPoints,
    calculateConnectionPoints
  };
};

/**
 * Calculate anchor position on a component
 */
const calculateAnchorPosition = (component, anchor) => {
  const ANCHOR_POINTS = {
    'top': { x: 0.5, y: 0 },
    'top-left': { x: 0, y: 0 },
    'top-right': { x: 1, y: 0 },
    'right': { x: 1, y: 0.5 },
    'bottom-right': { x: 1, y: 1 },
    'bottom': { x: 0.5, y: 1 },
    'bottom-left': { x: 0, y: 1 },
    'left': { x: 0, y: 0.5 },
    'center': { x: 0.5, y: 0.5 }
  };

  const anchorPoint = ANCHOR_POINTS[anchor] || ANCHOR_POINTS.center;
  
  return {
    x: component.x + (component.width * anchorPoint.x),
    y: component.y + (component.height * anchorPoint.y)
  };
};

/**
 * Line geometry calculations hook
 * Provides utility functions for line calculations
 */
export const useLineGeometry = () => {
  // Calculate line length
  const calculateLength = useCallback((x1, y1, x2, y2) => {
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
  }, []);

  // Calculate line angle in radians
  const calculateAngle = useCallback((x1, y1, x2, y2) => {
    return Math.atan2(y2 - y1, x2 - x1);
  }, []);

  // Calculate midpoint
  const calculateMidpoint = useCallback((x1, y1, x2, y2) => {
    return {
      x: (x1 + x2) / 2,
      y: (y1 + y2) / 2
    };
  }, []);

  // Calculate perpendicular point at distance
  const calculatePerpendicularPoint = useCallback((x1, y1, x2, y2, distance, fromStart = true) => {
    const angle = calculateAngle(x1, y1, x2, y2);
    const perpAngle = angle + Math.PI / 2;
    
    const baseX = fromStart ? x1 : x2;
    const baseY = fromStart ? y1 : y2;
    
    return {
      x: baseX + Math.cos(perpAngle) * distance,
      y: baseY + Math.sin(perpAngle) * distance
    };
  }, [calculateAngle]);

  return {
    calculateLength,
    calculateAngle,
    calculateMidpoint,
    calculatePerpendicularPoint
  };
};
