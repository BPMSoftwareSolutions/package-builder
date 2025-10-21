// Stable vendor entry used to bundle the Control Panel package into a single file for preview/E2E
// Import via the workspace npm package to avoid internal path coupling
import * as CP from '@renderx-plugins/control-panel';
// Ensure Control Panel CSS is bundled/injected when using the vendor entry
// tsup emits the CSS as a separate file and the dist JS doesn't import it,
// so we import it explicitly here for Vite to pick it up.
import '@renderx-plugins/control-panel/index.css';
export const ControlPanel = CP.ControlPanel;
export const register = CP.register;
// Prevent full tree-shake: attach to window for preview builds
if (typeof window !== 'undefined') {
  // @ts-ignore
  (window).__rx_cp_vendor = CP;
}

