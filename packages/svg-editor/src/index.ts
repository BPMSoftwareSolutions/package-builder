/**
 * svg-editor
 * Tiny SVG DOM manipulation helpers for UI
 */

export type SvgSelector = string | SVGGraphicsElement;

const sel = (s: SvgSelector) =>
  typeof s === "string" ? (document.querySelector(s) as SVGGraphicsElement|null) : s;

/**
 * Set multiple attributes on an SVG element
 * @param target - CSS selector or SVG element
 * @param attrs - Object with attribute key-value pairs
 * @returns true if successful, false if element not found
 */
export function setAttrs(target: SvgSelector, attrs: Record<string, string|number|boolean>) {
  const el = sel(target);
  if (!el) return false;
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, String(v));
  return true;
}

/**
 * Apply a translate transform to an SVG element
 * @param target - CSS selector or SVG element
 * @param x - X offset
 * @param y - Y offset
 * @returns true if successful, false if element not found
 */
export function translate(target: SvgSelector, x: number, y: number) {
  const el = sel(target);
  if (!el) return false;
  const prev = el.getAttribute("transform") ?? "";
  const next = prev.trim() ? `${prev} translate(${x}, ${y})` : `translate(${x}, ${y})`;
  el.setAttribute("transform", next);
  return true;
}
