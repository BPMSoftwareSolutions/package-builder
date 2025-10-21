// Standalone JSON component mapper for @renderx/host-sdk
// Maps JSON component definitions to runtime templates

import { computeTagFromJson } from "./component-mapper.js";

export type RuntimeTemplate = {
  tag: string;
  text?: string;
  classes: string[];
  css?: string;
  cssVariables?: Record<string, string | number>;
  cssLibrary?: string;
  cssVariablesLibrary?: Record<string, string | number>;
  attributes?: Record<string, string>;
  dimensions?: { width?: number; height?: number };
  style?: Record<string, string>;
  content?: any;
};

export function mapJsonComponentToTemplate(json: any): RuntimeTemplate {
  const type = json?.metadata?.type || json?.metadata?.replaces || "div";
  const name = json?.metadata?.name || type;
  
  // Base classes
  const classes = ["rx-comp", `rx-${type}`];
  const ci = json?.integration?.canvasIntegration || {};

  // Icon data attributes
  const icon = json?.ui?.icon || {};
  const attrs: Record<string, string> = {};
  if (icon?.mode === "emoji" && icon?.value) {
    attrs["data-icon"] = String(icon.value);
    if (icon.position) attrs["data-icon-pos"] = String(icon.position);
  }

  // Metadata attributes
  const category = json?.metadata?.category || "basic";
  const description = json?.metadata?.description || `${name} component`;
  attrs["data-category"] = String(category);
  attrs["data-description"] = String(description);

  // Overlay kind
  const overlayKind = json?.integration?.canvasIntegration?.overlayKind;
  if (overlayKind) attrs["data-overlay"] = String(overlayKind);

  // Container role
  const isContainer = !!json?.integration?.canvasIntegration?.allowChildElements;
  if (isContainer) attrs["data-role"] = "container";

  // Compute tag
  const tag = computeTagFromJson(json) || String(type || "div");

  // Resize tool attributes
  const tools = json?.ui?.tools || {};
  const resize = tools?.resize || {};
  if (resize?.enabled === false) attrs["data-resize-enabled"] = "false";
  
  const handles: string[] = Array.isArray(resize?.handles)
    ? resize.handles.filter((h: any) => typeof h === "string")
    : [];
  if (handles.length) attrs["data-resize-handles"] = handles.join(",");
  
  const minW = resize?.constraints?.min?.w ?? json?.integration?.canvasIntegration?.minWidth;
  const minH = resize?.constraints?.min?.h ?? json?.integration?.canvasIntegration?.minHeight;
  if (minW != null) attrs["data-resize-min-w"] = String(minW);
  if (minH != null) attrs["data-resize-min-h"] = String(minH);

  // Default values
  const defaults: any = json?.integration?.properties?.defaultValues || {};

  return {
    tag,
    text:
      type === "button"
        ? defaults?.content || "Click Me"
        : type === "heading"
        ? defaults?.content || "Heading Text"
        : type === "paragraph"
        ? defaults?.content || "This is a paragraph of text."
        : undefined,
    classes,
    css: json?.ui?.styles?.css,
    cssVariables: json?.ui?.styles?.variables || {},
    cssLibrary: json?.ui?.styles?.library?.css,
    cssVariablesLibrary: json?.ui?.styles?.library?.variables || {},
    attributes: {
      ...attrs,
      ...(type === "image"
        ? {
            src: String(defaults?.src || "https://via.placeholder.com/300x200?text=Image"),
            alt: String(defaults?.alt || "Image description"),
            ...(defaults?.loading ? { loading: String(defaults.loading) } : {}),
          }
        : {}),
    },
    ...(defaults && Object.keys(defaults).length ? { content: defaults } : {}),
    dimensions: { width: ci.defaultWidth, height: ci.defaultHeight },
    style: {
      ...(type === "image" && defaults?.objectFit
        ? { objectFit: String(defaults.objectFit) }
        : {}),
    },
  } as RuntimeTemplate;
}
