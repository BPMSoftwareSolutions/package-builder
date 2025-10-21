/**
 * Line Utilities - CSS Class Generation and Styling
 *
 * Isolated utility functions for Line element.
 * Handles CSS class generation, styling, and SVG-specific utilities.
 * Follows the exact same pattern as Button.utils.js
 */

// Component class registry for consistency (matches Button pattern)
const componentClassRegistry = new Map();

// Custom properties storage for line components (matches Button pattern)
const componentCustomProperties = new Map();

/**
 * Generate hash for CSS class names (matches Button pattern exactly)
 */
const generateHash = (input) => {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(36).substring(0, 6);
};

// Line style themes (CSS for container div only - SVG properties handled by React props)
const LINE_THEMES = {
  default: {
    // ✅ FIXED: Only valid CSS properties for the container div
    // SVG properties (stroke, strokeWidth, etc.) are handled by React props in Line.jsx
  },
  primary: {
    // Container-level styling only
  },
  secondary: {
    // Container-level styling only
  },
  success: {
    // Container-level styling only
  },
  danger: {
    // Container-level styling only
  },
  warning: {
    // Container-level styling only
  },
  info: {
    // Container-level styling only
  },
  light: {
    // Container-level styling only
  },
  dark: {
    // Container-level styling only
  }
};

/**
 * Get or create unique CSS class for line component
 * Hash is generated from component ID for consistency
 * Each line gets a single class that contains all styles
 */
export const getLineComponentClass = (componentId) => {
  if (!componentId) return '';

  // Check registry first
  if (componentClassRegistry.has(componentId)) {
    return componentClassRegistry.get(componentId);
  }

  // Generate hash from component ID
  const hash = generateHash(componentId);
  const className = `rx-comp-line-${hash}`;

  // Register and return
  componentClassRegistry.set(componentId, className);
  return className;
};

/**
 * Generate all CSS classes for a line element
 * Returns array of classes following simplified architecture
 * Single component class contains all styles (position, size, theme)
 * SIMPLIFIED: Only includes states that Canvas actually passes
 */
export const generateLineClasses = ({
  id,
  isSelected,
  isDragging,
  isOnCanvas
}) => {
  const classes = [];

  // Single component class (contains everything: theme, position, size)
  if (id) {
    classes.push(getLineComponentClass(id));
  }

  // Only state classes that Canvas actually passes (matches Button architecture)
  if (isSelected) classes.push('rx-selected');
  if (isDragging) classes.push('rx-dragging');

  return classes;
};

/**
 * Get base line styles (equivalent to Button's base styles)
 */
const getBaseLineStyles = () => ({
  position: 'absolute',
  pointerEvents: 'all',
  overflow: 'visible',
  zIndex: 1
});

/**
 * Get line theme styles based on variant
 */
const getLineThemeStyles = (variant = 'default') => {
  return LINE_THEMES[variant] || LINE_THEMES.default;
};

/**
 * Parse custom CSS string into properties object (matches Button pattern)
 */
const parseCustomCSS = (customCSS) => {
  if (!customCSS || typeof customCSS !== 'string') return {};

  const properties = {};
  const declarations = customCSS.split(';').filter(decl => decl.trim());

  declarations.forEach(declaration => {
    const [property, value] = declaration.split(':').map(s => s.trim());
    if (property && value) {
      // Convert kebab-case to camelCase
      const camelProperty = property.replace(/-([a-z])/g, (match, letter) => letter.toUpperCase());
      properties[camelProperty] = value;
    }
  });

  return properties;
};

/**
 * Inject CSS rule into document (matches Button pattern)
 */
const injectCSSRule = (selector, styles) => {
  // Find or create style element
  let styleElement = document.getElementById('renderx-dynamic-styles');
  if (!styleElement) {
    styleElement = document.createElement('style');
    styleElement.id = 'renderx-dynamic-styles';
    styleElement.type = 'text/css';
    document.head.appendChild(styleElement);
  }

  // Generate CSS rule
  const cssRule = `${selector} { ${Object.entries(styles)
    .map(([prop, value]) => `${camelToKebab(prop)}: ${value}`)
    .join('; ')}; }`;

  // Get existing rules
  const existingRules = styleElement.textContent || '';
  
  // Check if rule already exists for this selector
  const selectorRegex = new RegExp(`${selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*{[^}]*}`, 'g');
  
  if (selectorRegex.test(existingRules)) {
    // Replace existing rule
    styleElement.textContent = existingRules.replace(selectorRegex, cssRule);
  } else {
    // Append new rule
    styleElement.textContent = existingRules + '\n' + cssRule;
  }
};

/**
 * Convert camelCase to kebab-case (matches Button pattern)
 */
const camelToKebab = (str) => {
  return str.replace(/([A-Z])/g, '-$1').toLowerCase();
};

/**
 * Generate and inject CSS for line element
 * FIXED: Custom properties now take precedence over theme defaults
 * EXTENDED: Support for container children with absolute positioning
 * ENHANCED: Support for custom CSS strings
 */
export const generateLineCSS = ({
  id,
  x1,
  y1,
  x2,
  y2,
  x = 0, // ✅ ADD: Canvas coordinates like Button
  y = 0, // ✅ ADD: Canvas coordinates like Button
  width = 100, // ✅ ADD: Canvas dimensions like Button
  height = 50, // ✅ ADD: Canvas dimensions like Button
  strokeColor,
  strokeWidth,
  lineStyle = 'solid',
  opacity = 1,
  variant = 'default',
  parentId = null, // ✅ ADD: Optional parameter for container children
  customCSS = null, // ✅ NEW: Custom CSS string parameter
  arrowStart = false, // ✅ FIXED: Arrow parameters for proper bounds calculation
  arrowEnd = false
}) => {
  if (!id) return;

  const componentClass = getLineComponentClass(id);

  // Get existing custom properties
  const existingCustom = componentCustomProperties.get(id) || {};

  // Build custom properties object (EXACTLY like Button)
  const allCustomProperties = {
    ...existingCustom
  };

  // Add new custom properties if provided
  if (strokeColor !== undefined) allCustomProperties.strokeColor = strokeColor;
  if (strokeWidth !== undefined) allCustomProperties.strokeWidth = strokeWidth;
  if (lineStyle !== undefined) allCustomProperties.lineStyle = lineStyle;
  if (opacity !== undefined) allCustomProperties.opacity = opacity;

  // Store updated custom properties
  if (Object.keys(allCustomProperties).length > 0) {
    componentCustomProperties.set(id, allCustomProperties);
  }

  // Parse custom CSS string
  const customCSSProperties = parseCustomCSS(customCSS);

  // Get theme styles
  const themeStyles = getLineThemeStyles(variant);

  // ✅ FIXED: Calculate container dimensions from line endpoints with arrow padding
  const svgBounds = calculateSVGBounds(x1, y1, x2, y2, 10, arrowStart, arrowEnd);

  // ✅ FIXED: Use SVG bounds for positioning (not Canvas coordinates)
  const positioningStyles = parentId ? {
    // ✅ NEW: Container child - absolute positioning with calculated bounds origin
    position: 'absolute',
    left: `${svgBounds.x}px`,
    top: `${svgBounds.y}px`
  } : {
    // ✅ FIXED: Canvas component - absolute positioning with calculated bounds origin
    position: 'absolute',
    left: `${svgBounds.x}px`,
    top: `${svgBounds.y}px`
  };


  // Apply styles with correct priority: Base → Theme → Position → Size → Property Overrides → Custom CSS
  const allStyles = {
    // 1. Base line styles (lowest priority)
    ...getBaseLineStyles(),

    // 2. Theme styles (medium priority)
    ...themeStyles,

    // 3. Position (conditional based on parent relationship)
    ...positioningStyles,

    // 4. Size (calculated from line endpoints, not Canvas dimensions)
    width: `${svgBounds.width}px`,
    height: `${svgBounds.height}px`,

    // 5. Property overrides (high priority - will override theme)
    ...allCustomProperties,

    // 6. Custom CSS (highest priority - will override everything)
    ...customCSSProperties
  };

  // Inject CSS rule
  injectCSSRule(`.${componentClass}`, allStyles);
};

/**
 * Calculate SVG bounds for line positioning with proper arrow marker padding
 */
const calculateSVGBounds = (x1, y1, x2, y2, arrowSize = 10, arrowStart = false, arrowEnd = false) => {
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
    height: maxY - minY
  };
};

/**
 * Generate stroke dash array for line styles
 */
export const getStrokeDashArray = (lineStyle, strokeWidth = 2) => {
  switch (lineStyle) {
    case 'dashed':
      return `${strokeWidth * 3} ${strokeWidth * 2}`;
    case 'dotted':
      return `${strokeWidth} ${strokeWidth}`;
    case 'dash-dot':
      return `${strokeWidth * 3} ${strokeWidth} ${strokeWidth} ${strokeWidth}`;
    case 'dash-dot-dot':
      return `${strokeWidth * 3} ${strokeWidth} ${strokeWidth} ${strokeWidth} ${strokeWidth} ${strokeWidth}`;
    default:
      return 'none';
  }
};

/**
 * Calculate line length
 */
export const calculateLineLength = (x1, y1, x2, y2) => {
  return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
};

/**
 * Calculate line angle in degrees
 */
export const calculateLineAngle = (x1, y1, x2, y2) => {
  const radians = Math.atan2(y2 - y1, x2 - x1);
  return radians * (180 / Math.PI);
};

/**
 * Calculate line midpoint
 */
export const calculateLineMidpoint = (x1, y1, x2, y2) => {
  return {
    x: (x1 + x2) / 2,
    y: (y1 + y2) / 2
  };
};

/**
 * Get exportable HTML for line (matches Button pattern)
 * Returns clean SVG without canvas wrappers
 */
export const getLineExportHTML = (lineProps) => {
  const classes = generateLineClasses({
    ...lineProps,
    isOnCanvas: true, // Force canvas classes for export
    isSelected: false,
    isDragging: false
  });

  const { x1, y1, x2, y2, strokeColor, strokeWidth, lineStyle } = lineProps;
  const svgBounds = calculateSVGBounds(x1, y1, x2, y2);
  const dashArray = getStrokeDashArray(lineStyle, strokeWidth);
  
  return `<svg class="${classes.join(' ')}" viewBox="${svgBounds.x} ${svgBounds.y} ${svgBounds.width} ${svgBounds.height}">
    <line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" 
          stroke="${strokeColor}" stroke-width="${strokeWidth}" 
          stroke-dasharray="${dashArray}" fill="none" />
  </svg>`;
};

/**
 * Clear custom properties cache (for testing/cleanup)
 */
export const clearCustomPropertiesCache = () => {
  componentCustomProperties.clear();
};
