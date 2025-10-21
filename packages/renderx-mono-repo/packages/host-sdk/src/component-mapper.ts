// Standalone component mapper for @renderx/host-sdk
// Provides tag computation without host dependencies

export type TagRule =
  | { when?: string; tag: string }
  | {
      when?: string;
      tagFrom: { path: string; validateIn?: string[]; fallback: string };
    }
  | { defaultTag: string };

export type MapperConfig = {
  version: string;
  defaults: {
    tagRules: TagRule[];
  };
};

// Built-in default rules
const DEFAULT_CONFIG: MapperConfig = {
  version: "1.0.0",
  defaults: {
    tagRules: [
      { when: "metadata.type == 'container'", tag: "div" },
      { when: "metadata.type == 'input'", tag: "input" },
      { when: "metadata.type == 'image'", tag: "img" },
      { when: "metadata.type == 'line'", tag: "svg" },
      { when: "metadata.type == 'svg'", tag: "svg" },
      { when: "metadata.type == 'paragraph'", tag: "p" },
      {
        when: "metadata.type == 'heading'",
        tagFrom: {
          path: "integration.properties.defaultValues.level",
          validateIn: ["h1", "h2", "h3", "h4", "h5", "h6"],
          fallback: "h2",
        },
      },
      { defaultTag: "div" },
    ],
  },
};

let cachedConfig: MapperConfig | null = null;

// Simple path getter
function getByPath(obj: any, path: string): any {
  if (!obj || !path) return undefined;
  const parts = path.split(".");
  let cur: any = obj;
  for (const p of parts) {
    if (cur == null) return undefined;
    cur = cur[p];
  }
  return cur;
}

// Simple expression matcher
function matchesWhen(json: any, when?: string): boolean {
  if (!when) return true;
  
  const eqIdx = when.indexOf("==");
  if (eqIdx > -1) {
    const left = when.slice(0, eqIdx).trim();
    const right = when.slice(eqIdx + 2).trim();
    const leftVal = getByPath(json, left);
    const cleanedRight = right.replace(/^['\"]|['\"]$/g, "");
    return String(leftVal) === cleanedRight;
  }
  
  const strictIdx = when.indexOf("===");
  if (strictIdx > -1) {
    const left = when.slice(0, strictIdx).trim();
    const right = when.slice(strictIdx + 3).trim();
    const leftVal = getByPath(json, left);
    if (right === "true") return !!leftVal === true;
    if (right === "false") return !!leftVal === false;
    const cleanedRight = right.replace(/^['\"]|['\"]$/g, "");
    return String(leftVal) === cleanedRight;
  }
  
  return false;
}

export function loadConfigFromWindow() {
  try {
    const g: any = (globalThis as any) || {};
    const cfg = g?.RenderX?.componentMapperConfig;
    if (cfg && typeof cfg === "object" && cfg.defaults?.tagRules) {
      cachedConfig = cfg as MapperConfig;
    }
  } catch {}
}

export function setConfig(cfg: MapperConfig) {
  cachedConfig = cfg;
}

export function getConfig(): MapperConfig {
  if (!cachedConfig) loadConfigFromWindow();
  return cachedConfig || DEFAULT_CONFIG;
}

export function getTagForType(type: string | undefined | null): string {
  const t = (type || "").trim();
  if (!t) return "div";
  const json = { metadata: { type: t } };
  return computeTagFromJson(json);
}

export function computeTagFromJson(json: any): string {
  // Check for explicit runtime.tag override
  const override = getByPath(json, "runtime.tag");
  if (typeof override === "string" && override.trim()) return override.trim();

  const cfg = getConfig();
  for (const rule of cfg.defaults.tagRules) {
    if ((rule as any).defaultTag) {
      continue; // Evaluate at the end
    }
    if (matchesWhen(json, (rule as any).when)) {
      if ((rule as any).tag) {
        return (rule as any).tag;
      }
      if ((rule as any).tagFrom) {
        const tf = (rule as any).tagFrom as {
          path: string;
          validateIn?: string[];
          fallback: string;
        };
        let v = String(getByPath(json, tf.path) || "");
        v = v.toLowerCase();
        if (tf.validateIn && tf.validateIn.length) {
          if (tf.validateIn.includes(v)) return v;
          return tf.fallback;
        }
        return v || tf.fallback;
      }
    }
  }
  
  // Default fallback
  const t = String(getByPath(json, "metadata.type") || "").trim();
  if (t) return t;
  const def = cfg.defaults.tagRules.find((r) => (r as any).defaultTag) as any;
  return def?.defaultTag || "div";
}
