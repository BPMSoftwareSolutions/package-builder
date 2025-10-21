/**
 * PluginInterfaceFacade - Public plugin interface
 * Provides a clean facade for all plugin-related operations
 * Handles CIA (Conductor Integration Architecture) compliance
 */
import { SEQUENCE_PRIORITIES } from "../SequenceTypes.js";
export class PluginInterfaceFacade {
    pluginManager;
    spaValidator;
    constructor(pluginManager, spaValidator) {
        this.pluginManager = pluginManager;
        this.spaValidator = spaValidator;
    }
    /**
     * Get all mounted plugin names
     */
    getMountedPlugins() {
        return this.pluginManager.getMountedPlugins();
    }
    /**
     * Play a specific sequence of a mounted SPA plugin (CIA-compliant)
     * @param pluginId - The plugin identifier
     * @param sequenceName - The sequence name to execute
     * @param context - Context data to pass to the movement handler
     * @param priority - Sequence priority (NORMAL, HIGH, CHAINED)
     * @returns Execution result
     */
    play(pluginId, sequenceName, context = {}, priority = SEQUENCE_PRIORITIES.NORMAL, startSequenceCallback) {
        try {
            console.log(`🎼 PluginInterfaceFacade.play(): ${pluginId} -> ${sequenceName}`);
            // SPA Validation: Register plugin (silent)
            this.spaValidator.registerPlugin(pluginId);
            // Validate plugin exists
            const plugin = this.pluginManager.getPluginInfo(pluginId);
            if (!plugin) {
                console.warn(`🧠 Plugin not found: ${pluginId}. Available plugins: [${this.pluginManager
                    .getMountedPluginIds()
                    .join(", ")}]`);
                return Promise.resolve(null);
            }
            // Start the sequence instead of calling handlers directly
            return startSequenceCallback(sequenceName, context, priority);
        }
        catch (error) {
            console.error(`🧠 PluginInterfaceFacade.play() failed for ${pluginId}.${sequenceName}:`, error.message);
            return Promise.resolve(null);
        }
    }
    /**
     * Mount an SPA plugin with comprehensive validation (CIA-compliant)
     * @param sequence - The sequence definition from the plugin
     * @param handlers - The handlers object from the plugin
     * @param pluginId - Optional plugin ID (defaults to sequence.name)
     * @returns Plugin mount result
     */
    async mount(sequence, handlers, pluginId, metadata) {
        return this.pluginManager.mount(sequence, handlers, pluginId, metadata);
    }
    /**
     * Register CIA-compliant plugins
     * Loads and mounts all plugins from the plugins directory
     */
    async registerCIAPlugins() {
        return this.pluginManager.registerCIAPlugins();
    }
    /**
     * Execute movement with handler validation (CIA-compliant)
     * @param sequenceName - Sequence name
     * @param movementName - Movement name
     * @param data - Movement data
     * @returns Handler execution result
     */
    executeMovementWithHandler(sequenceName, movementName, data) {
        try {
            const handlers = this.pluginManager.getPluginHandlers(sequenceName);
            if (!handlers) {
                console.warn(`🧠 No handlers found for sequence: ${sequenceName}`);
                return null;
            }
            const handler = handlers[movementName];
            if (!handler || typeof handler !== "function") {
                console.warn(`🧠 Handler not found or not a function: ${sequenceName}.${movementName}`);
                return null;
            }
            console.log(`🎼 Executing handler: ${sequenceName}.${movementName} with data:`, data);
            return handler(data);
        }
        catch (error) {
            console.error(`🧠 Handler execution failed for ${sequenceName}.${movementName}:`, error.message);
            return null;
        }
    }
    /**
     * Load plugin from dynamic import with error handling (CIA-compliant)
     * @param pluginPath - Path to the plugin module
     * @returns Plugin load result
     */
    async loadPlugin(pluginPath) {
        try {
            console.log(`🧠 PluginInterfaceFacade: Loading plugin from: ${pluginPath}`);
            const plugin = await this.pluginManager.pluginLoader.loadPlugin(pluginPath);
            if (!plugin) {
                return {
                    success: false,
                    pluginId: "unknown",
                    message: `Failed to load plugin: ${pluginPath}`,
                    reason: "load_failed",
                };
            }
            // Mount the plugin
            return await this.mount(plugin.sequence, plugin.handlers);
        }
        catch (error) {
            console.warn(`🧠 PluginInterfaceFacade: Failed to load plugin from ${pluginPath}:`, error.message);
            return {
                success: false,
                pluginId: "unknown",
                message: `Failed to load plugin from ${pluginPath}: ${error.message}`,
                reason: "load_error",
            };
        }
    }
    /**
     * Extract plugin code for SPA validation
     * @param sequence - Plugin sequence
     * @param handlers - Plugin handlers
     * @returns String representation of plugin code
     */
    extractPluginCode(sequence, handlers) {
        try {
            // Convert sequence and handlers to string for analysis
            const sequenceCode = JSON.stringify(sequence, null, 2);
            const handlersCode = Object.keys(handlers)
                .map((key) => `${key}: ${handlers[key].toString()}`)
                .join("\n");
            return `${sequenceCode}\n${handlersCode}`;
        }
        catch (error) {
            console.warn("🎼 Failed to extract plugin code for validation:", error);
            return "";
        }
    }
    /**
     * Validate plugin pre-compilation status
     * @param pluginId - Plugin identifier
     * @returns Validation result
     */
    async validatePluginPreCompilation(pluginId) {
        try {
            const issues = [];
            // Check for bundled artifact
            const bundlePath = `/plugins/${pluginId}/dist/plugin.js`;
            try {
                const response = await fetch(bundlePath);
                if (!response.ok) {
                    issues.push(`Missing bundled artifact: ${bundlePath}`);
                }
            }
            catch {
                issues.push(`Cannot access bundled artifact: ${bundlePath}`);
            }
            // Check for required runtime files
            const requiredFiles = ["index.js", "sequence.js", "manifest.json"];
            for (const file of requiredFiles) {
                const filePath = `/plugins/${pluginId}/${file}`;
                try {
                    const response = await fetch(filePath);
                    if (!response.ok) {
                        issues.push(`Missing required file: ${filePath}`);
                    }
                }
                catch {
                    issues.push(`Cannot access required file: ${filePath}`);
                }
            }
            return {
                valid: issues.length === 0,
                issues,
            };
        }
        catch (error) {
            console.warn(`🔨 Pre-compilation validation error for ${pluginId}:`, error);
            return {
                valid: false,
                issues: [`Validation error: ${error.message}`],
            };
        }
    }
    /**
     * Unmount a plugin (CIA-compliant)
     * @param pluginId - Plugin identifier
     * @returns Success status
     */
    unmountPlugin(pluginId) {
        return this.pluginManager.unmountPlugin(pluginId);
    }
    /**
     * Get mounted plugin information
     * @param pluginId - Plugin identifier
     * @returns Plugin information or undefined
     */
    getPluginInfo(pluginId) {
        return this.pluginManager.getPluginInfo(pluginId);
    }
    /**
     * Get all mounted plugin IDs
     * @returns Array of plugin IDs
     */
    getMountedPluginIds() {
        return this.pluginManager.getMountedPluginIds();
    }
    /**
     * Get plugin statistics
     * @returns Plugin statistics
     */
    getPluginStatistics() {
        const pluginIds = this.pluginManager.getMountedPluginIds();
        return {
            mountedPlugins: pluginIds.length,
            totalSequences: this.pluginManager.getTotalSequences(),
            pluginIds,
        };
    }
}
//# sourceMappingURL=PluginInterfaceFacade.js.map