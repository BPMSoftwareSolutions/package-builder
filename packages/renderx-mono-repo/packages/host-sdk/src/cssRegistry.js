// Standalone CSS Registry API for @renderx/host-sdk
// Provides CSS class management without host dependencies
import "./types.js"; // Load global declarations
// Simple in-memory cache for Node/SSR environments
let cachedClasses = new Map();
// Observer management
const cssObservers = new Set();
// Mock implementation for Node/SSR environments
const mockCssRegistryAPI = {
    async hasClass(name) {
        return cachedClasses.has(name);
    },
    async createClass(def) {
        cachedClasses.set(def.name, { ...def });
        notifyCssObservers();
    },
    async updateClass(name, def) {
        if (cachedClasses.has(name)) {
            cachedClasses.set(name, { ...def, name });
            notifyCssObservers();
        }
        else {
            throw new Error(`CSS class '${name}' not found`);
        }
    },
    onCssChanged(callback) {
        cssObservers.add(callback);
        return () => {
            cssObservers.delete(callback);
        };
    },
};
// Helper function to notify observers
function notifyCssObservers() {
    const classes = Array.from(cachedClasses.values());
    cssObservers.forEach(callback => {
        try {
            callback(classes);
        }
        catch (error) {
            console.warn("Error in CSS registry observer callback:", error);
        }
    });
}
// Public API functions
export async function hasClass(name) {
    if (typeof window === "undefined") {
        // Node/SSR fallback
        return mockCssRegistryAPI.hasClass(name);
    }
    const hostCssRegistry = window.RenderX?.cssRegistry;
    if (!hostCssRegistry) {
        console.warn("Host CSS Registry API not available.");
        return false;
    }
    try {
        return await hostCssRegistry.hasClass(name);
    }
    catch (error) {
        console.warn("Error calling host cssRegistry.hasClass:", error);
        return false;
    }
}
export async function createClass(def) {
    if (typeof window === "undefined") {
        // Node/SSR fallback
        return mockCssRegistryAPI.createClass(def);
    }
    const hostCssRegistry = window.RenderX?.cssRegistry;
    if (!hostCssRegistry) {
        console.warn("Host CSS Registry API not available. Class will not be created.");
        return;
    }
    try {
        return await hostCssRegistry.createClass(def);
    }
    catch (error) {
        console.warn("Error calling host cssRegistry.createClass:", error);
        throw error;
    }
}
export async function updateClass(name, def) {
    if (typeof window === "undefined") {
        // Node/SSR fallback
        return mockCssRegistryAPI.updateClass(name, def);
    }
    const hostCssRegistry = window.RenderX?.cssRegistry;
    if (!hostCssRegistry) {
        console.warn("Host CSS Registry API not available. Class will not be updated.");
        return;
    }
    try {
        return await hostCssRegistry.updateClass(name, def);
    }
    catch (error) {
        console.warn("Error calling host cssRegistry.updateClass:", error);
        throw error;
    }
}
export function onCssChanged(callback) {
    if (typeof window === "undefined") {
        // Node/SSR fallback
        return mockCssRegistryAPI.onCssChanged(callback);
    }
    const hostCssRegistry = window.RenderX?.cssRegistry;
    if (!hostCssRegistry) {
        console.warn("Host CSS Registry API not available. Observer will not receive updates.");
        return () => { };
    }
    try {
        return hostCssRegistry.onCssChanged(callback);
    }
    catch (error) {
        console.warn("Error setting up CSS registry observer:", error);
        return () => { };
    }
}
// Export the complete API object for convenience
export const CssRegistry = {
    hasClass,
    createClass,
    updateClass,
    onCssChanged,
};
// Test utilities for Node/SSR environments
export function setMockCssClass(def) {
    if (typeof window !== "undefined") {
        console.warn("setMockCssClass should only be used in Node/SSR environments");
        return;
    }
    cachedClasses.set(def.name, { ...def });
    notifyCssObservers();
}
export function clearMockCssRegistry() {
    if (typeof window !== "undefined") {
        console.warn("clearMockCssRegistry should only be used in Node/SSR environments");
        return;
    }
    cachedClasses.clear();
    cssObservers.clear();
}
//# sourceMappingURL=cssRegistry.js.map