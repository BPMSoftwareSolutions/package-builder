// Standalone Inventory API for @renderx/host-sdk
// Provides component inventory access without host dependencies
import "./types.js"; // Load global declarations
// Default empty inventory for fallback
const DEFAULT_INVENTORY = [];
// Simple in-memory cache for Node/SSR environments
let cachedInventory = DEFAULT_INVENTORY;
let cachedComponents = new Map();
// Observer management
const inventoryObservers = new Set();
// Mock implementation for Node/SSR environments
const mockInventoryAPI = {
    async listComponents() {
        return [...cachedInventory];
    },
    async getComponentById(id) {
        return cachedComponents.get(id) || null;
    },
    onInventoryChanged(callback) {
        inventoryObservers.add(callback);
        return () => {
            inventoryObservers.delete(callback);
        };
    },
};
// Helper function to notify observers
function notifyInventoryObservers(components) {
    cachedInventory = [...components];
    inventoryObservers.forEach(callback => {
        try {
            callback(components);
        }
        catch (error) {
            console.warn("Error in inventory observer callback:", error);
        }
    });
}
// Public API functions
export async function listComponents() {
    if (typeof window === "undefined") {
        // Node/SSR fallback
        return mockInventoryAPI.listComponents();
    }
    const hostInventory = window.RenderX?.inventory;
    if (!hostInventory) {
        console.warn("Host Inventory API not available. Using empty inventory.");
        return DEFAULT_INVENTORY;
    }
    try {
        return await hostInventory.listComponents();
    }
    catch (error) {
        console.warn("Error calling host inventory.listComponents:", error);
        return DEFAULT_INVENTORY;
    }
}
export async function getComponentById(id) {
    if (typeof window === "undefined") {
        // Node/SSR fallback
        return mockInventoryAPI.getComponentById(id);
    }
    const hostInventory = window.RenderX?.inventory;
    if (!hostInventory) {
        console.warn("Host Inventory API not available.");
        return null;
    }
    try {
        return await hostInventory.getComponentById(id);
    }
    catch (error) {
        console.warn("Error calling host inventory.getComponentById:", error);
        return null;
    }
}
export function onInventoryChanged(callback) {
    if (typeof window === "undefined") {
        // Node/SSR fallback
        return mockInventoryAPI.onInventoryChanged(callback);
    }
    const hostInventory = window.RenderX?.inventory;
    if (!hostInventory) {
        console.warn("Host Inventory API not available. Observer will not receive updates.");
        return () => { };
    }
    try {
        return hostInventory.onInventoryChanged(callback);
    }
    catch (error) {
        console.warn("Error setting up inventory observer:", error);
        return () => { };
    }
}
// Export the complete API object for convenience
export const Inventory = {
    listComponents,
    getComponentById,
    onInventoryChanged,
};
// Test utilities for Node/SSR environments
export function setMockInventory(components) {
    if (typeof window !== "undefined") {
        console.warn("setMockInventory should only be used in Node/SSR environments");
        return;
    }
    notifyInventoryObservers(components);
}
export function setMockComponent(component) {
    if (typeof window !== "undefined") {
        console.warn("setMockComponent should only be used in Node/SSR environments");
        return;
    }
    cachedComponents.set(component.id, component);
}
export function clearMockInventory() {
    if (typeof window !== "undefined") {
        console.warn("clearMockInventory should only be used in Node/SSR environments");
        return;
    }
    cachedInventory = DEFAULT_INVENTORY;
    cachedComponents.clear();
    inventoryObservers.clear();
}
//# sourceMappingURL=inventory.js.map