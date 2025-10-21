// Lightweight content extraction utility for Control Panel
// Simplified version of ComponentRuleEngine's extractContent functionality

/**
 * Extract content properties from a DOM element based on component type
 */
export function extractElementContent(element: HTMLElement, type?: string): Record<string, any> {
  const content: Record<string, any> = {};
  const elementType = (type || inferTypeFromElement(element)).toLowerCase();
  
  // Common properties for all elements
  const textContent = element.textContent?.trim();
  if (textContent) {
    content.text = textContent;
  }
  
  // Type-specific extraction
  switch (elementType) {
    case 'button':
      content.content = textContent;
      content.disabled = element.hasAttribute('disabled');
      
      // Extract button variants from classes
      const buttonVariant = extractClassVariant(element, 'rx-button--', ['primary', 'secondary', 'danger']);
      if (buttonVariant) content.variant = buttonVariant;
      
      const buttonSize = extractClassVariant(element, 'rx-button--', ['small', 'medium', 'large']);
      if (buttonSize) content.size = buttonSize;
      break;
      
    case 'input':
      if (element instanceof HTMLInputElement) {
        content.placeholder = element.placeholder;
        content.value = element.value;
        content.inputType = element.type;
        content.disabled = element.disabled;
        content.required = element.required;
        
        const inputVariant = extractClassVariant(element, 'rx-input--', ['default', 'error', 'success']);
        if (inputVariant) content.variant = inputVariant;
      }
      break;
      
    case 'image':
    case 'img':
      content.src = element.getAttribute('src');
      content.alt = element.getAttribute('alt');
      content.loading = element.getAttribute('loading');
      
      const objectFit = (element.style as any).objectFit;
      if (objectFit) content.objectFit = objectFit;
      
      const imageVariant = extractClassVariant(element, 'rx-image--', [
        'default', 'rounded', 'circle', 'bordered', 'shadow', 'zoom', 'lift'
      ]);
      if (imageVariant) content.variant = imageVariant;
      break;
      
    case 'container':
    case 'div':
      // For containers, just extract text content
      if (textContent) content.text = textContent;
      break;

    case 'line':
      // For SVG-based line components, extract innerHTML
      const innerHTML = element.innerHTML;
      if (innerHTML?.trim()) {
        content.innerHTML = innerHTML;
      }
      break;

    case 'heading':
      // Extract heading content and level (from class variant or tagName fallback)
      if (textContent) content.content = textContent;
      {
        const cls = Array.from(element.classList).find(c => c.startsWith('rx-heading--level-'));
        if (cls) {
          const lvl = cls.replace('rx-heading--level-', '');
          content.level = lvl;
        } else {
          const tn = element.tagName.toLowerCase();
          if (/^h[1-6]$/.test(tn)) content.level = tn;
        }
      }
      break;

    case 'paragraph':
      // Extract paragraph alignment variant from class (e.g., rx-paragraph--right)
      if (textContent) content.content = textContent;
      {
        const variant = extractClassVariant(element, 'rx-paragraph--', ['default', 'left', 'center', 'right', 'justify']);
        if (variant) content.variant = variant;
      }
      break;

    default:
      // For unknown types, just extract text content
      if (textContent) content.text = textContent;
      break;
  }

  return content;
}

/**
 * Infer component type from element
 */
function inferTypeFromElement(element: HTMLElement): string {
  // First try to get type from rx-<type> class
  const rxClasses = Array.from(element.classList).filter(
    (cls) => cls.startsWith("rx-") && cls !== "rx-comp"
  );
  
  if (rxClasses.length > 0) {
    const typeClass = rxClasses[0]; // e.g., "rx-button"
    return typeClass.replace("rx-", "");
  }
  
  // Fallback to HTML tag name
  const tagName = element.tagName.toLowerCase();
  switch (tagName) {
    case 'button': return 'button';
    case 'input': return 'input';
    case 'img': return 'image';
    case 'div':
      // Check if it contains SVG (likely a line component)
      if (element.querySelector('svg')) {
        return 'line';
      }
      return 'container';
    default:
      return tagName;
  }
}

/**
 * Extract class variant from element based on prefix and allowed values
 */
function extractClassVariant(element: HTMLElement, prefix: string, allowedValues: string[]): string | null {
  const classes = Array.from(element.classList);
  
  for (const className of classes) {
    if (className.startsWith(prefix)) {
      const variant = className.slice(prefix.length);
      if (allowedValues.includes(variant)) {
        return variant;
      }
    }
  }
  
  return null;
}