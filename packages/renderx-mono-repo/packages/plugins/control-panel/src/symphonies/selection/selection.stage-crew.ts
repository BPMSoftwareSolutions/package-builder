// Stage-crew handler for deriving Control Panel selection model from DOM + component JSON
import { extractElementContent } from "../../utils/content-extractor";

export function deriveSelectionModel(data: any, ctx: any) {
  const { id } = data || {};
  if (!id) {
    ctx.payload.selectionModel = null;
    return;
  }

  const element = document.getElementById(String(id)) as HTMLElement | null;
  if (!element) {
    ctx.payload.selectionModel = null;
    return;
  }

  // Extract type from rx-<type> class with fallback strategies
  const rxClasses = Array.from(element.classList).filter(
    (cls) => cls.startsWith("rx-") && cls !== "rx-comp"
  );
  
  let type = "unknown";
  const typeClass = rxClasses[0]; // e.g., "rx-button"
  
  if (typeClass) {
    type = typeClass.replace("rx-", "");
  } else {
    // Fallback 1: Try to infer type from HTML tag name
    const tagName = element.tagName.toLowerCase();
    if (tagName === "button") {
      type = "button";
    } else if (tagName === "input") {
      type = "input";
    } else if (tagName === "div") {
      // Fallback 2: Check for common component patterns
      if (element.querySelector("svg")) {
        type = "line"; // SVG-based components are likely lines
      } else {
        type = "container"; // Generic div containers
      }
    } else if (tagName === "img") {
      type = "image";
    }
    
    // Log for debugging externalized plugin CSS class issues
    ctx.logger?.warn?.(`[Control Panel] Element ${id} missing rx-<type> class, inferred type: ${type}`, {
      tagName,
      classList: Array.from(element.classList)
    });
  }

  // Get position and dimensions from inline styles (preferred) or computed styles
  const style = element.style;
  const computed = getComputedStyle(element);

  const x = parseFloat(style.left || computed.left || "0");
  const y = parseFloat(style.top || computed.top || "0");
  const width = parseFloat(style.width || computed.width || "0");
  const height = parseFloat(style.height || computed.height || "0");

  // Extract content using content extractor for component-specific properties
  const content = extractElementContent(element, type);

  // Build selection model with rule engine extracted content
  const selectionModel = {
    header: { type, id },
    content,
    layout: { x, y, width, height },
    styling: {
      "bg-color": computed.backgroundColor || "#007acc",
      "text-color": computed.color || "#ffffff",
      "border-radius": computed.borderRadius || "4px",
      "font-size": computed.fontSize || "14px",
    },
    classes: Array.from(element.classList),
  };

  ctx.payload.selectionModel = selectionModel;
}
