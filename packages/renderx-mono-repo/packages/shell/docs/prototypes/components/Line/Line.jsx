/**
 * Line Element Component - SVG-Based Implementation
 * 
 * Completely self-contained Line element following the clean HTML architecture.
 * Renders clean SVG without canvas wrappers, using CSS classes for all styling.
 * 
 * Features:
 * - Clean SVG output: <svg class="rx-comp-line-1"><line x1="0" y1="0" x2="100" y2="100" /></svg>
 * - CSS-only styling (no inline styles)
 * - Dynamic CSS class generation for position and styling
 * - SVG-based line drawing with arrow support
 * - Connection point system for component linking
 * - Isolated component architecture
 * - Event handling and interaction
 */

import React from 'react';
import { useLineState } from './Line.hooks.js';
import { useLineInteractions } from './Line.interactions.js';
import { generateLineClasses, generateLineCSS } from './Line.utils.js';
import './Line.css';

const Line = ({
  // Element properties (REQUIRED)
  id,
  x = 0, // ✅ ADD: Canvas coordinates like Button
  y = 0, // ✅ ADD: Canvas coordinates like Button
  width = 100, // ✅ ADD: Canvas dimensions like Button
  height = 50, // ✅ ADD: Canvas dimensions like Button
  x1 = 0,
  y1 = 0,
  x2 = 100,
  y2 = 100,

  // Line-specific properties
  strokeColor = '#333333',
  strokeWidth = 2,
  lineStyle = 'solid', // 'solid', 'dashed', 'dotted'
  arrowStart = false,
  arrowEnd = false,
  arrowSize = 10,

  // Connection properties (for future connection system)
  startComponentId = null,
  endComponentId = null,
  startAnchor = 'center',
  endAnchor = 'center',

  // Style properties (REQUIRED)
  opacity = 1,
  
  // Event handlers (REQUIRED)
  onClick,
  onMouseDown,
  onMouseUp,
  onMouseEnter,
  onMouseLeave,

  // Canvas integration (REQUIRED - ONLY WHAT CANVAS PROVIDES)
  isSelected = false,
  isDragging = false,
  isOnCanvas = false,
  isInContainer = false,
  isInTableCell = false,
  containerId = null,

  // Additional props
  className = '',
  ...props
}) => {
  // Line state management (SIMPLIFIED)
  const {
    lineRef,
    svgRef
  } = useLineState({
    isOnCanvas
  });

  // Line interactions (PURE MUSICAL SEQUENCING)
  const {
    handleClick,
    handleMouseDown,
    handleMouseUp,
    handleMouseEnter,
    handleMouseLeave,
    handleFocus,
    handleBlur
  } = useLineInteractions({
    id,
    x, // ✅ ADD: Canvas coordinates
    y, // ✅ ADD: Canvas coordinates
    width, // ✅ ADD: Canvas dimensions
    height, // ✅ ADD: Canvas dimensions
    x1,
    y1,
    x2,
    y2,
    onClick,
    onMouseDown,
    onMouseUp,
    onMouseEnter,
    onMouseLeave,
    isOnCanvas,
    isInContainer,
    isInTableCell,
    containerId
  });

  // Generate CSS classes following the simplified architecture
  const cssClasses = generateLineClasses({
    id,
    isSelected,
    isDragging,
    isOnCanvas
  });

  // Generate and inject CSS for this line (like Button)
  React.useEffect(() => {

    generateLineCSS({
      id,
      x, // ✅ ADD: Canvas coordinates
      y, // ✅ ADD: Canvas coordinates
      width, // ✅ ADD: Canvas dimensions
      height, // ✅ ADD: Canvas dimensions
      x1,
      y1,
      x2,
      y2,
      strokeColor,
      strokeWidth,
      lineStyle,
      opacity,
      parentId: containerId,
      arrowStart, // ✅ FIXED: Pass arrow parameters for proper bounds calculation
      arrowEnd
    });
  }, [id, x, y, width, height, x1, y1, x2, y2, strokeColor, strokeWidth, lineStyle, opacity, containerId, arrowStart, arrowEnd]);

  // Calculate SVG dimensions and positioning with proper arrow marker padding
  const svgBounds = React.useMemo(() => {
    // ✅ FIXED: Account for arrow marker positioning with proper padding
    // Start arrow (refX="0") extends the full arrow width to the left
    // End arrow (refX="10") extends slightly beyond the end point
    const leftPadding = arrowStart ? arrowSize * 2 : arrowSize; // Extra padding for start arrow
    const rightPadding = arrowEnd ? arrowSize * 2 : arrowSize;  // Extra padding for end arrow
    const topBottomPadding = (arrowStart || arrowEnd) ? arrowSize * 2 : arrowSize;

    const minX = Math.min(x1, x2) - leftPadding;
    const minY = Math.min(y1, y2) - topBottomPadding;
    const maxX = Math.max(x1, x2) + rightPadding;
    const maxY = Math.max(y1, y2) + topBottomPadding;

    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
      viewBox: `${minX} ${minY} ${maxX - minX} ${maxY - minY}`
    };
  }, [x1, y1, x2, y2, arrowSize, arrowStart, arrowEnd]);

  // Generate stroke dash array for line styles
  const getStrokeDashArray = (style) => {
    switch (style) {
      case 'dashed':
        return `${strokeWidth * 3} ${strokeWidth * 2}`;
      case 'dotted':
        return `${strokeWidth} ${strokeWidth}`;
      default:
        return 'none';
    }
  };

  // Generate unique marker IDs for arrows
  const startMarkerId = arrowStart ? `arrow-start-${id}` : null;
  const endMarkerId = arrowEnd ? `arrow-end-${id}` : null;

  // Filter out DOM props to avoid React warnings
  const { 
    startComponentId: _startComponentId,
    endComponentId: _endComponentId,
    startAnchor: _startAnchor,
    endAnchor: _endAnchor,
    strokeColor: _strokeColor,
    strokeWidth: _strokeWidth,
    lineStyle: _lineStyle,
    arrowStart: _arrowStart,
    arrowEnd: _arrowEnd,
    arrowSize: _arrowSize,
    isInContainer: _isInContainer,
    isInTableCell: _isInTableCell,
    containerId: _containerId,
    ...domProps
  } = props;

  // ✅ FIXED: Render as positioned div container with SVG inside (like Button pattern)
  return (
    <div
      className={`${cssClasses.join(' ')} ${className}`.trim()}
      onClick={handleClick}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleFocus}
      onBlur={handleBlur}
      data-component-id={id}
      data-component-type="line"
      tabIndex={isOnCanvas ? 0 : -1} // Focusable on canvas for accessibility
      {...domProps}
    >
      <svg
        ref={svgRef}
        viewBox={svgBounds.viewBox}
        style={{ width: '100%', height: '100%' }}
      >
      {/* Arrow markers definition */}
      <defs>
        {arrowStart && (
          <marker
            id={startMarkerId}
            markerWidth={arrowSize}
            markerHeight={arrowSize}
            refX="0"
            refY={arrowSize / 2}
            orient="auto-start-reverse"
            markerUnits="strokeWidth"
          >
            <path
              d={`M0,0 L0,${arrowSize} L${arrowSize},${arrowSize / 2} z`}
              fill={strokeColor}
            />
          </marker>
        )}
        {arrowEnd && (
          <marker
            id={endMarkerId}
            markerWidth={arrowSize}
            markerHeight={arrowSize}
            refX={arrowSize}
            refY={arrowSize / 2}
            orient="auto"
            markerUnits="strokeWidth"
          >
            <path
              d={`M0,0 L0,${arrowSize} L${arrowSize},${arrowSize / 2} z`}
              fill={strokeColor}
            />
          </marker>
        )}
      </defs>

      {/* Main line element */}
      <line
        ref={lineRef}
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        strokeDasharray={getStrokeDashArray(lineStyle)}
        opacity={opacity}
        markerStart={startMarkerId ? `url(#${startMarkerId})` : undefined}
        markerEnd={endMarkerId ? `url(#${endMarkerId})` : undefined}
        fill="none"
      />

      {/* Invisible wider line for easier selection */}
      <line
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke="transparent"
        strokeWidth={Math.max(strokeWidth * 3, 10)}
        fill="none"
        style={{ pointerEvents: 'stroke' }}
      />
      </svg>
    </div>
  );
};

export default Line;
