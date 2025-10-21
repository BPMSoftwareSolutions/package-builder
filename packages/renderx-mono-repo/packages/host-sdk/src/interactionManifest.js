// Standalone interaction resolution for @renderx/host-sdk
// Delegates to host's interaction manifest
import "./types.js"; // Load global declarations
// Default routes for common interactions (fallback when host not available)
const DEFAULT_ROUTES = {
    "app.ui.theme.get": {
        pluginId: "HeaderThemePlugin",
        sequenceId: "header-ui-theme-get-symphony",
    },
    "app.ui.theme.toggle": {
        pluginId: "HeaderThemePlugin",
        sequenceId: "header-ui-theme-toggle-symphony",
    },
    "control.panel.selection.show": {
        pluginId: "ControlPanelPlugin",
        sequenceId: "control-panel-selection-show-symphony",
    },
    "control.panel.update": {
        pluginId: "ControlPanelPlugin",
        sequenceId: "control-panel-update-symphony",
    },
};
export function resolveInteraction(key) {
    if (typeof window !== "undefined") {
        const hostResolver = window.RenderX?.resolveInteraction;
        if (hostResolver) {
            try {
                return hostResolver(key);
            }
            catch {
                // Fall through to defaults
            }
        }
    }
    // Use built-in defaults
    const route = DEFAULT_ROUTES[key];
    if (!route) {
        throw new Error(`Unknown interaction: ${key}`);
    }
    return route;
}
//# sourceMappingURL=interactionManifest.js.map