/**
 * Line Interactions - Advanced Interaction Handling
 * 
 * Isolated interaction logic for Line element.
 * Handles complex interactions, animations, and canvas-specific behavior.
 */

import { useCallback, useRef, useEffect } from 'react';
import { eventBus, EVENT_TYPES } from '../../../communication/EventBus.js';
import { MusicalSequences, MusicalSequencesAPI } from '../../../communication/sequences/index.js';
import { generateLineCSS } from './Line.utils.js';

/**
 * Line hover effect hook
 * Provides visual feedback on line hover
 */
export const useLineHover = ({ 
  lineRef, 
  disabled = false,
  enableHover = true 
}) => {
  const hoverTimeoutRef = useRef(null);

  const animateHoverIn = useCallback(() => {
    if (disabled || !enableHover || !lineRef.current) return;

    const line = lineRef.current;
    line.style.filter = 'drop-shadow(0 0 3px rgba(0,0,0,0.3))';
    line.style.transition = 'filter 0.2s ease';
  }, [lineRef, disabled, enableHover]);

  const animateHoverOut = useCallback(() => {
    if (disabled || !enableHover || !lineRef.current) return;

    const line = lineRef.current;
    line.style.filter = '';
    line.style.transition = 'filter 0.2s ease';
  }, [lineRef, disabled, enableHover]);

  return { animateHoverIn, animateHoverOut };
};

/**
 * Line selection animation hook
 * Provides visual feedback for line selection
 */
export const useLineSelection = ({ 
  lineRef, 
  disabled = false,
  enableAnimation = true 
}) => {
  const animateSelect = useCallback(() => {
    if (disabled || !enableAnimation || !lineRef.current) return;

    const line = lineRef.current;
    line.style.strokeDasharray = '5 5';
    line.style.strokeDashoffset = '0';
    line.style.animation = 'line-dash-flow 1s linear infinite';
  }, [lineRef, disabled, enableAnimation]);

  const animateDeselect = useCallback(() => {
    if (disabled || !enableAnimation || !lineRef.current) return;

    const line = lineRef.current;
    line.style.strokeDasharray = '';
    line.style.strokeDashoffset = '';
    line.style.animation = '';
  }, [lineRef, disabled, enableAnimation]);

  return { animateSelect, animateDeselect };
};

/**
 * Line double-click detection hook
 * Handles double-click events for line editing
 */
export const useLineDoubleClick = ({
  id,
  x1,
  y1,
  x2,
  y2,
  onDoubleClick,
  isOnCanvas = false,
  editMode = false
}) => {
  const clickCountRef = useRef(0);
  const clickTimeoutRef = useRef(null);

  const handleDoubleClick = useCallback((e) => {
    clickCountRef.current += 1;

    if (clickTimeoutRef.current) {
      clearTimeout(clickTimeoutRef.current);
    }

    clickTimeoutRef.current = setTimeout(() => {
      if (clickCountRef.current === 2) {
        // Double click detected
        if (isOnCanvas && !editMode) {
          // ✅ USE MUSICAL SEQUENCE: Line Edit Mode Sequence
          const lineElement = {
            id, type: 'line', x1, y1, x2, y2
          };

          const sanitizedEventData = {
            eventType: 'double-click',
            timestamp: Date.now()
          };

          // TODO: Implement Line Edit Mode Musical Sequence
          // MusicalSequences.startLineEditModeFlow(eventBus, lineElement, sanitizedEventData);
        }

        if (onDoubleClick) {
          onDoubleClick(e);
        }
      }

      clickCountRef.current = 0;
    }, 300);
  }, [id, x1, y1, x2, y2, onDoubleClick, isOnCanvas, editMode]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (clickTimeoutRef.current) {
        clearTimeout(clickTimeoutRef.current);
      }
    };
  }, []);

  return { handleDoubleClick };
};

/**
 * Line drag detection hook
 * Handles line dragging for repositioning
 */
export const useLineDrag = ({
  id,
  x1,
  y1,
  x2,
  y2,
  onDragStart,
  onDragMove,
  onDragEnd,
  isOnCanvas = false
}) => {
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef(null);
  const dragOffsetRef = useRef({ x: 0, y: 0 });

  const handleDragStart = useCallback((e) => {
    if (!isOnCanvas) return;

    isDraggingRef.current = true;
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    
    // Calculate offset from line start point
    dragOffsetRef.current = {
      x: e.clientX - x1,
      y: e.clientY - y1
    };

    if (onDragStart) {
      onDragStart(e);
    }

    // ✅ USE MUSICAL SEQUENCE: Line Drag Start Sequence
    const lineElement = {
      id, type: 'line', x1, y1, x2, y2
    };

    const sanitizedEventData = {
      eventType: 'drag-start',
      timestamp: Date.now(),
      clientX: e.clientX,
      clientY: e.clientY
    };

    // ✅ USE CANVAS SEQUENCE: Use Canvas Component Drag Symphony (works for all components)
    MusicalSequences.startCanvasComponentDragFlow(eventBus, lineElement, sanitizedEventData);
  }, [id, x1, y1, x2, y2, onDragStart, isOnCanvas]);

  const handleDragMove = useCallback((e) => {
    if (!isDraggingRef.current) return;

    if (onDragMove) {
      onDragMove(e);
    }
  }, [onDragMove]);

  const handleDragEnd = useCallback((e) => {
    if (!isDraggingRef.current) return;

    isDraggingRef.current = false;
    dragStartRef.current = null;

    if (onDragEnd) {
      onDragEnd(e);
    }

    // ✅ USE MUSICAL SEQUENCE: Line Drag End Sequence
    const lineElement = {
      id, type: 'line', x1, y1, x2, y2
    };

    const sanitizedEventData = {
      eventType: 'drag-end',
      timestamp: Date.now(),
      clientX: e.clientX,
      clientY: e.clientY
    };

    // ✅ USE CANVAS SEQUENCE: Use Canvas Component Drag End (works for all components)
    // Note: Canvas handles drag end automatically, no specific sequence needed
  }, [id, x1, y1, x2, y2, onDragEnd]);

  return {
    handleDragStart,
    handleDragMove,
    handleDragEnd,
    isDragging: isDraggingRef.current
  };
};

/**
 * Main Line interactions hook
 * Combines all interaction functionality for the Line component
 */
export const useLineInteractions = ({
  id,
  x = 0, // ✅ ADD: Canvas coordinates like Button
  y = 0, // ✅ ADD: Canvas coordinates like Button
  width = 100, // ✅ ADD: Canvas dimensions like Button
  height = 50, // ✅ ADD: Canvas dimensions like Button
  x1,
  y1,
  x2,
  y2,
  onClick,
  onMouseDown,
  onMouseUp,
  onMouseEnter,
  onMouseLeave,
  isOnCanvas = false,
  isInContainer = false,
  isInTableCell = false,
  containerId = null
}) => {
  // Handle click events
  const handleClick = useCallback((e) => {
    // For canvas elements, call the canvas click handler first (for selection)
    if (isOnCanvas && onClick) {
      onClick(e);
    }

    // Prevent event bubbling on canvas to avoid deselection
    if (isOnCanvas) {
      e.stopPropagation();
    }

    // ✅ USE BUTTON PATTERN: Include Canvas coordinates like Button
    const elementData = {
      id,
      type: 'line',
      x, // ✅ ADD: Canvas coordinates
      y, // ✅ ADD: Canvas coordinates
      width, // ✅ ADD: Canvas dimensions
      height, // ✅ ADD: Canvas dimensions
      x1,
      y1,
      x2,
      y2
    };

    const sanitizedEventData = {
      eventType: 'click',
      timestamp: Date.now()
    };

    // ✅ USE LINE SEQUENCES: Use Line-specific sequences that actually exist
    if (isOnCanvas && !isInContainer) {
      // Canvas context: Use Canvas-Component Symphony (works for all components)
      MusicalSequences.startCanvasComponentFlow(eventBus, elementData, sanitizedEventData);
    } else if (isInContainer) {
      // Container context: Use Container-Child Symphony (works for all components)
      const actualContainerId = containerId || 'unknown-container';
      MusicalSequences.startContainerChildFlow(eventBus, elementData, actualContainerId, sanitizedEventData);
    } else {
      // Non-canvas context: Use Canvas-Component Symphony (works for all components)
      MusicalSequences.startCanvasComponentFlow(eventBus, elementData, sanitizedEventData);
    }
  }, [id, x1, y1, x2, y2, onClick, isOnCanvas, isInContainer, containerId]);

  // Handle mouse down events
  const handleMouseDown = useCallback((e) => {
    if (onMouseDown) {
      onMouseDown(e);
    }

    // ✅ USE BUTTON PATTERN: Include Canvas coordinates like Button
    const elementData = {
      id,
      type: 'line',
      x, // ✅ ADD: Canvas coordinates
      y, // ✅ ADD: Canvas coordinates
      width, // ✅ ADD: Canvas dimensions
      height, // ✅ ADD: Canvas dimensions
      x1,
      y1,
      x2,
      y2
    };

    const sanitizedEventData = {
      eventType: 'mouse-down',
      timestamp: Date.now(),
      clientX: e.clientX,
      clientY: e.clientY
    };

    // ✅ USE LINE SEQUENCE: Use Line selection sequence through proper API
    MusicalSequencesAPI.line.startSelectionFlow(eventBus, elementData, sanitizedEventData);
  }, [id, x1, y1, x2, y2, onMouseDown]);

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

  // Handle focus events
  const handleFocus = useCallback((e) => {
    // Focus handling for accessibility
  }, []);

  // Handle blur events
  const handleBlur = useCallback((e) => {
    // Blur handling for accessibility
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
