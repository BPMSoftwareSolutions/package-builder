# Rich HTML & SVG Component Gallery

A consolidated gallery of sanitized Rich HTML and SVG snippets ready to paste into the **HTML** component (feature flag: `feature.enableRichHtml`).

> All markup shown below is sanitized by `sanitizeHtml.ts`. Disallowed tags (`script`, `style`, `iframe`, `foreignObject`, event handler attributes like `onclick`) are removed automatically.

## Contents

- [HTML Blocks](#html-blocks)
- [Buttons](#buttons)
- [Tables](#tables)
- [Forms](#forms)
- [Composite Layout](#composite-layout)
- [Mixed Showcase](#mixed-showcase)
- [SVG Charts](#svg-charts)
- [SVG Diagrams](#svg-diagrams)
- [SVG Animation](#svg-animation)
- [Dark Mode Variants](#dark-mode-variants)
- [Performance & Sanitization Notes](#performance--sanitization-notes)

---

## HTML Blocks

See: `rich-html-intro-snippet.html`, `rich-html-callout-box.html`, `rich-html-features-grid.html`

```html
<!-- Intro -->
<div class="marketing-intro">
  <h2>Welcome to <strong>RenderX</strong></h2>
  <p>
    <b>Render faster.</b> Orchestrate UI with flexible JSON-driven components.
  </p>
</div>
```

## Buttons

See: `rich-html-styled-buttons.html`

```html
<div style="display:flex;gap:12px;flex-wrap:wrap;">
  <button
    style="background:#4f46e5;color:#fff;padding:8px 14px;border:none;border-radius:6px;"
  >
    Primary
  </button>
  <button
    style="background:#64748b;color:#fff;padding:8px 14px;border:none;border-radius:6px;"
  >
    Secondary
  </button>
</div>
```

## Tables

See: `rich-html-styled-table.html`

```html
<table style="border-collapse:collapse;width:100%;font-size:14px;">
  <thead>
    <tr>
      <th>Feature</th>
      <th>Status</th>
      <th>Notes</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Rich HTML</td>
      <td>✅</td>
      <td>Sanitized</td>
    </tr>
  </tbody>
</table>
```

## Forms

See: `rich-html-styled-form.html`

```html
<form style="display:grid;gap:10px;max-width:340px;">
  <label>Name <input type="text" placeholder="Your name" /></label>
  <label>Email <input type="email" placeholder="you@example.com" /></label>
  <button type="button">Submit</button>
</form>
```

## Composite Layout

See: `rich-html-styled-layout-showcase.html`

## Mixed Showcase

See: `rich-html-styled-mixed-showcase.html`

---

## SVG Charts

Bar Chart: `svg-sample-bar-chart.html`

```html
<svg viewBox="0 0 220 140" width="100%">
  <rect x="42" y="70" width="22" height="40" rx="3" fill="#6366f1" />
</svg>
```

Line Chart (animated): `svg-sample-line-chart-animated.html`

## SVG Diagrams

- Network Diagram: `svg-sample-network-diagram.html`
- Process Flow: `svg-sample-process-flow.html`

## SVG Animation

Animated Pulse: `svg-sample-animated-pulse.html`

```html
<svg viewBox="0 0 120 60" width="100%" aria-hidden="true">
  <circle cx="30" cy="30" r="10" fill="#6366f1">
    <animate
      attributeName="r"
      values="10;20;10"
      dur="2.4s"
      repeatCount="indefinite"
    />
  </circle>
</svg>
```

---

## Dark Mode Variants

Dark mode samples wrap content in a container with `data-theme="dark"`. Inline styles use darker surfaces & lighter text.

See: `rich-html-dark-mode-showcase.html`, `svg-dark-mode-line-chart.html`.

```html
<div
  data-theme="dark"
  style="background:#0f172a;color:#e2e8f0;padding:16px;border-radius:8px;"
>
  <h3 style="margin-top:0;color:#fff;">Dark Mode Panel</h3>
  <p style="margin:0 0 8px;">All inline styles remain after sanitization.</p>
  <button
    style="background:#6366f1;color:#fff;border:none;padding:8px 14px;border-radius:6px;"
  >
    Action
  </button>
</div>
```

```html
<!-- Dark SVG (inline) -->
<svg
  data-theme="dark"
  viewBox="0 0 160 80"
  width="100%"
  preserveAspectRatio="xMidYMid meet"
>
  <rect x="0" y="0" width="160" height="80" rx="8" fill="#1e293b" />
  <polyline
    points="10,60 40,50 70,54 100,40 130,42 150,30"
    fill="none"
    stroke="#38bdf8"
    stroke-width="3"
  />
</svg>
```

---

## Performance & Sanitization Notes

- Sanitizer is linear in DOM node count; typical gallery snippets (< 5 KB) process in a few milliseconds in modern browsers.
- Large pastes: recommend keeping under ~50 KB raw HTML. (Future: soft warning / truncation.)
- Current allowlist extends to common structure & SVG tags: forms, tables, buttons, basic/animated SVG (`animate`, `animateTransform`).
- Stripped always: `script`, `style` (inline styles OK), `iframe`, `object`, `embed`, event handler attributes, `javascript:` URLs.
- Gradients & defs: supported via `<defs>`, `<linearGradient>`, `<stop>`.
- Animation tags preserved: `<animate>`, `<animateTransform>`.

### Potential Future Enhancements

- Configurable allowlist per play / tenant.
- Optional DOMPurify integration for broader coverage & maintenance.
- Export-time re-sanitization on server.

---

## Quick Copy Workflow

1. Open a sample file under `docs/samples`.
2. Copy its inner HTML.
3. Paste into the HTML component's property editor (`markup`).
4. Observe sanitized result; verify no unwanted scripts remain.

---

_Generated gallery referencing existing sample assets._
