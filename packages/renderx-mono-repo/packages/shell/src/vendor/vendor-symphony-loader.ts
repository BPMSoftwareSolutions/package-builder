// Vendor symphony loaders for deep handlersPath imports like
// "@renderx-plugins/control-panel/symphonies/selection/selection.symphony"
// This allows Vite to statically include these modules in the production bundle.

// Note: import.meta.glob keys are file system paths. We translate bare specifiers
// into the corresponding node_modules/dist path and look them up here.

const cp = import.meta.glob('../../node_modules/@renderx-plugins/control-panel/dist/symphonies/**/*.js');
const cc = import.meta.glob('../../node_modules/@renderx-plugins/canvas-component/dist/symphonies/**/*.js');
const lc = import.meta.glob('../../node_modules/@renderx-plugins/library-component/dist/symphonies/**/*.js');

function specToNodeModulesDistPath(spec: string): string | null {
  const s = (spec || '').trim();
  if (!s.startsWith('@renderx-plugins/')) return null;
  // Expecting patterns like: @renderx-plugins/<pkg>/symphonies/.../*.symphony(.js)?
  const m = s.match(/^@renderx-plugins\/([^/]+)\/(symphonies\/.*?)(\.js)?$/);
  if (!m) return null;
  const pkg = m[1];
  const sub = m[2];
  return `../../node_modules/@renderx-plugins/${pkg}/dist/${sub}.js`;
}

export function getVendorSymphonyLoader(spec: string): (() => Promise<any>) | null {
  try {
    const key = specToNodeModulesDistPath(spec);
    if (!key) return null;
    if (key in cp) return (cp as any)[key] as () => Promise<any>;
    if (key in cc) return (cc as any)[key] as () => Promise<any>;
    if (key in lc) return (lc as any)[key] as () => Promise<any>;
    return null;
  } catch {
    return null;
  }
}

