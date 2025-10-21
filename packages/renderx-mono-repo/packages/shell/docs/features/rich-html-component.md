# Rich HTML Component (Experimental)

Feature flag: `feature.enableRichHtml` (default: off)

The Rich HTML component lets authors paste sanitized HTML (including basic/animated SVG) directly into the canvas without creating a bespoke component first. This accelerates prototyping of marketing blocks, documentation sections, diagrams, and lightweight data visuals.

## Key Capabilities

- Supports core structural & typographic tags (headings, lists, code, blockquote, tables, forms, buttons).
- Supports inline SVG including gradients, basic shapes, and simple animation (`<animate>`, `<animateTransform>`).
- Sanitizes pasted markup: strips `<script>`, disallowed tags (unwraps to keep safe children), event handler attributes (`on*`), and dangerous URLs (`javascript:`).
- Rule engine integration (`markup` property → `innerHtml`) with extraction for round‑trip editing.

## Files & Implementation

| Concern             | Location                                                       |
| ------------------- | -------------------------------------------------------------- |
| Component JSON      | `json-components/html.json`                                    |
| Sanitizer           | `src/sanitizeHtml.ts`                                          |
| Rule engine hooks   | `src/domain/mapping/component-mapper/rule-engine.ts` (`innerHtml` branches)   |
| Feature flag source | `data/feature-flags.json`                                      |
| Gallery samples     | `docs/samples/*`                                               |
| Tests               | `__tests__/component-mapper/html.component.sanitizer*.spec.ts` |

## Adding / Updating Sanitization Rules

1. Adjust allowlist in `sanitizeHtml.ts` (`ALLOWED_TAGS`).
2. (Optional) Add attribute or URL protocol validation.
3. Add / update test in `__tests__/component-mapper` to cover new tags.
4. Run: `npm test -- __tests__/component-mapper/html.component.sanitizer.svg-extended.spec.ts`.

### Considering DOMPurify

If broader HTML support is needed:

1. `npm install dompurify`.
2. Replace the body of `sanitizeHtml` with a DOMPurify call.
3. Maintain the same public function signature for minimal churn.

## Usage Workflow

1. Enable flag (temporarily) by setting `feature.enableRichHtml.status` to `on` in `data/feature-flags.json` (dev only).
2. Select the HTML component in the library.
3. Paste markup into the Control Panel field bound to `markup`.
4. Observe sanitized rendering on the canvas.
5. (Optional) Switch to dark‑mode variants using wrapper container with `data-theme="dark"` + inline styles.

## Performance Notes

- Sanitization is a single pass DOM traversal (O(n) in node count). Typical gallery snippets (<5KB) take a few ms in modern browsers.
- Large HTML blocks (>50KB) are discouraged; consider splitting into smaller semantic sections or promoting to a first‑class JSON component.
- Extended SVG (gradients + animation) adds minimal overhead (shared traversal cost only).

## Security Considerations

| Risk                         | Mitigation                                                                |
| ---------------------------- | ------------------------------------------------------------------------- |
| Script injection             | `<script>` dropped entirely.                                              |
| Event handler attributes     | Removed by name prefix (`on`).                                            |
| Dangerous URLs               | `javascript:` stripped; `data:` restricted to images.                     |
| CSS expression()             | Stripped from inline style attributes.                                    |
| Unapproved embedded contexts | `<iframe>`, `<object>`, `<embed>` unwrapped or removed (not allowlisted). |

## Sample Sources

See consolidated gallery: `docs/samples/RICH_HTML_SVG_GALLERY.md` for quick copy blocks (HTML + SVG + dark mode).

## Extending for Future

- Add Markdown → sanitized HTML transform.
- Introduce per‑tenant allowlist overrides (`window.RenderX.htmlComponentPolicy`).
- Add server‑side re‑sanitization during export.
- Provide WYSIWYG editing layer in Control Panel with live diff to `markup`.

---

_This document describes the experimental implementation intended for iterative feedback._
