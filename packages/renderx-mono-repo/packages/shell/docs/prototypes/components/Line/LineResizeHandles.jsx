/**
 * Line Resize Handles Component
 * 
 * Provides resize handles for Line elements on the canvas.
 * Allows users to adjust line endpoints by dragging handles.
 * Follows RenderX visual tools architecture.
 */

import React, { useCallback, useState, useRef, useEffect } from 'react';
import { MusicalSequencesAPI } from '../../../communication/sequences/index.js';
import { eventBus } from '../../../communication/EventBus.js';

const LineResizeHandles = ({
  // Line properties
  id,
  x1,
  y1,
  x2,
  y2,
  
  // Canvas integration
  isSelected = false,
  isOnCanvas = false,
  
  // Callbacks
  onElementUpdate, // ✅ USE BUTTON PATTERN: Direct element update callback like Button
  onResize,
  onResizeStart,
  onResizeEnd,
  
  // Visual options
  handleSize = 8,
  handleColor = '#007bff',
  handleBorderColor = '#ffffff',

  // Arrow properties (for bounds calculation)
  arrowStart = false,
  arrowEnd = false,
  arrowSize = 10,

  // Container context
  containerId = null,
  isInContainer = false,
  
  ...props
}) => {
  // Drag state management
  const [isDragging, setIsDragging] = useState(false);
  const [dragHandle, setDragHandle] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const svgRef = useRef(null);

  // Only show handles when line is selected and on canvas
  if (!isSelected || !isOnCanvas) {
    return null;
  }

  // Handle resize start
  const handleResizeStart = useCallback((handleType, e) => {
    e.stopPropagation();
    e.preventDefault();

    // Start drag operation
    setIsDragging(true);
    setDragHandle(handleType);

    // Calculate offset from handle center to mouse position
    const rect = svgRef.current?.getBoundingClientRect();
    if (rect) {
      const handleX = handleType === 'start' ? x1 : x2;
      const handleY = handleType === 'start' ? y1 : y2;
      setDragOffset({
        x: e.clientX - (rect.left + handleX),
        y: e.clientY - (rect.top + handleY)
      });
    }

    if (onResizeStart) {
      onResizeStart(handleType, e);
    }
  }, [x1, y1, x2, y2, onResizeStart]);

  // Handle mouse move during drag
  const handleMouseMove = useCallback((e) => {
    if (!isDragging || !dragHandle) return;

    e.preventDefault();

    // Calculate new position based on mouse position and offset
    const rect = svgRef.current?.getBoundingClientRect();
    if (rect && onElementUpdate) {
      const newX = e.clientX - rect.left - dragOffset.x;
      const newY = e.clientY - rect.top - dragOffset.y;

      // ✅ USE BUTTON PATTERN: Call onElementUpdate with endpoint updates
      const updates = {};
      if (dragHandle === 'start') {
        updates.x1 = newX;
        updates.y1 = newY;
      } else if (dragHandle === 'end') {
        updates.x2 = newX;
        updates.y2 = newY;
      }

      // Call element update callback (like Button does)
      onElementUpdate(id, updates);
    }
  }, [isDragging, dragHandle, dragOffset, onElementUpdate, id]);

  // Handle mouse up - end drag
  const handleMouseUp = useCallback((e) => {
    if (!isDragging) return;

    e.preventDefault();

    // End drag operation
    setIsDragging(false);
    setDragHandle(null);
    setDragOffset({ x: 0, y: 0 });

    if (onResizeEnd) {
      onResizeEnd(dragHandle, e);
    }
  }, [isDragging, dragHandle, onResizeEnd]);

  // Add global mouse event listeners during drag
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);

      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // Calculate handle positions
  const handles = [
    {
      type: 'start',
      x: x1,
      y: y1,
      cursor: 'move'
    },
    {
      type: 'end',
      x: x2,
      y: y2,
      cursor: 'move'
    }
  ];

  // ✅ FIXED: Use same bounds calculation as Line component for proper alignment
  const leftPadding = arrowStart ? arrowSize * 2 : arrowSize;
  const rightPadding = arrowEnd ? arrowSize * 2 : arrowSize;
  const topBottomPadding = (arrowStart || arrowEnd) ? arrowSize * 2 : arrowSize;

  const svgBounds = {
    minX: Math.min(x1, x2) - leftPadding,
    minY: Math.min(y1, y2) - topBottomPadding,
    maxX: Math.max(x1, x2) + rightPadding,
    maxY: Math.max(y1, y2) + topBottomPadding
  };



  const svgWidth = svgBounds.maxX - svgBounds.minX;
  const svgHeight = svgBounds.maxY - svgBounds.minY;

  return (
    <svg
      ref={svgRef}
      className="line-resize-handles"
      style={{
        position: 'absolute',
        left: `${svgBounds.minX}px`,
        top: `${svgBounds.minY}px`,
        width: `${svgWidth}px`,
        height: `${svgHeight}px`,
        pointerEvents: 'none',
        overflow: 'visible',
        zIndex: 1000
      }}
      viewBox={`${svgBounds.minX} ${svgBounds.minY} ${svgWidth} ${svgHeight}`}
      {...props}
    >
      {handles.map((handle) => (
        <g key={handle.type}>
          {/* Handle background circle */}
          <circle
            cx={handle.x}
            cy={handle.y}
            r={handleSize}
            fill={handleBorderColor}
            stroke={handleColor}
            strokeWidth="2"
            style={{
              cursor: handle.cursor,
              pointerEvents: 'all'
            }}
            onMouseDown={(e) => handleResizeStart(handle.type, e)}
          />
          
          {/* Handle inner circle */}
          <circle
            cx={handle.x}
            cy={handle.y}
            r={handleSize - 2}
            fill={handleColor}
            style={{
              cursor: handle.cursor,
              pointerEvents: 'all'
            }}
            onMouseDown={(e) => handleResizeStart(handle.type, e)}
          />
          
          {/* Handle label for accessibility */}
          <title>{`${handle.type} handle for line ${id}`}</title>
        </g>
      ))}
    </svg>
  );
};

export default LineResizeHandles;
