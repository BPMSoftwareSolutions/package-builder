/**
 * PluginManager - High-level plugin management and mounting
 * Handles CIA (Conductor Integration Architecture) plugin lifecycle
 */
import { DataBaton } from "../monitoring/DataBaton.js";
import { PluginLoader } from "./PluginLoader.js";
import { PluginValidator } from "./PluginValidator.js";
import { PluginManifestLoader } from "./PluginManifestLoader.js";
import { MusicalConductor } from "../MusicalConductor.js";
import { CallbackRegistry, __internal as CBInternal, } from "../orchestration/CallbackRegistry.js";
export class PluginManager {
    eventBus;
    spaValidator;
    sequenceRegistry;
    pluginLoader; // Made public for access from MusicalConductor
    pluginValidator;
    manifestLoader;
    // Plugin state
    mountedPlugins = new Map();
    pluginHandlers = new Map();
    // Beat handler subscriptions per plugin (for cleanup)
    pluginSubscriptions = new Map();
    // Per-request execution contexts to accumulate handler outputs
    requestContexts = new Map();
    pluginsRegistered = false; // Prevent React StrictMode double execution
    // Discovery cache from manifest (helps in environments where auto-mounting is stubbed)
    discoveredPluginIds = [];
    constructor(eventBus, spaValidator, sequenceRegistry) {
        this.eventBus = eventBus;
        this.spaValidator = spaValidator;
        this.sequenceRegistry = sequenceRegistry;
        this.pluginLoader = new PluginLoader();
        this.pluginValidator = new PluginValidator();
        this.manifestLoader = new PluginManifestLoader();
    }
    /**
     * Mount a plugin with sequence and handlers
     * @param sequence - Musical sequence definition
     * @param handlers - Event handlers for the sequence
     * @param pluginId - Optional plugin ID (defaults to sequence.name)
     * @param metadata - Optional plugin metadata
     * @returns Plugin mount result
     */
    async mount(sequence, handlers, pluginId, metadata) {
        const id = pluginId || sequence?.name || "unknown-plugin";
        const warnings = [];
        try {
            console.log(`🧠 PluginManager: Attempting to mount plugin: ${id}`);
            // Validate plugin structure
            const validationResult = this.pluginValidator.validatePluginStructure(sequence, handlers, id);
            if (!validationResult.isValid) {
                return {
                    success: false,
                    pluginId: id,
                    message: `Plugin validation failed: ${validationResult.errors.join(", ")}`,
                    reason: "validation_failed",
                    warnings: validationResult.warnings,
                };
            }
            warnings.push(...validationResult.warnings);
            // Register with SPA validator
            this.spaValidator.registerPlugin(id);
            // If plugin already exists, allow augmenting with additional sequences (issue #60)
            if (this.mountedPlugins.has(id)) {
                console.log(`🧠 Plugin already mounted: ${id} — augmenting with additional sequence`);
                // proceed without early return; we'll register the new sequence and wire handlers
            }
            // Enforce conductor logger usage on handlers if configured
            if (handlers &&
                typeof handlers === "object" &&
                this.spaValidator.config.enforceConductorLogger !== "off") {
                for (const [name, fn] of Object.entries(handlers)) {
                    if (typeof fn === "function") {
                        const usesConsole = this.spaValidator.detectDirectConsoleUsage(fn);
                        if (usesConsole) {
                            const stack = new Error().stack || "";
                            const violation = this.spaValidator.createViolation("PLUGIN_DIRECT_CONSOLE_USAGE", id, `Direct console usage detected in ${id}.${name}. Use context.logger.<level>(...) instead of console.<level>(...)`, stack, this.spaValidator.config.enforceConductorLogger === "error"
                                ? "error"
                                : "warning");
                            this.spaValidator.handleViolation(violation);
                            if (this.spaValidator.config.enforceConductorLogger === "error") {
                                warnings.push(`Handler ${name} disabled due to direct console usage`);
                                delete handlers[name];
                            }
                        }
                    }
                }
            }
            // Register the sequence
            this.sequenceRegistry.register(sequence);
            // Create plugin object
            const plugin = {
                sequence,
                handlers: handlers || {},
                metadata: {
                    id,
                    version: metadata?.version || "1.0.0",
                    author: metadata?.author,
                },
            };
            // Mount the plugin (or update existing plugin with new sequence)
            const existingPlugin = this.mountedPlugins.get(id);
            if (existingPlugin) {
                // Merge handlers from new sequence with existing plugin
                const mergedHandlers = { ...existingPlugin.handlers, ...handlers };
                const updatedPlugin = {
                    ...existingPlugin,
                    handlers: mergedHandlers,
                    metadata: {
                        id,
                        version: metadata?.version || existingPlugin.metadata?.version || "1.0.0",
                        author: metadata?.author || existingPlugin.metadata?.author,
                    },
                };
                this.mountedPlugins.set(id, updatedPlugin);
            }
            else {
                this.mountedPlugins.set(id, plugin);
            }
            // Wire beat handlers to event bus so plugin handlers run
            try {
                const unsubscribes = [];
                const movements = sequence?.movements || [];
                for (const movement of movements) {
                    const beats = movement?.beats || [];
                    for (const beat of beats) {
                        const eventName = beat?.event;
                        const handlerName = beat?.handler;
                        if (!eventName || !handlerName)
                            continue;
                        const handlerFn = handlers?.[handlerName];
                        if (typeof handlerFn !== "function")
                            continue;
                        const unsubscribe = this.eventBus.subscribe(eventName, (data) => {
                            // Rehydrate preserved callbacks using correlation id on data, if any
                            try {
                                const restored = CallbackRegistry.getInstance().rehydrateInPlace(data);
                                if (restored > 0) {
                                    console.log(`🎼 PluginManager: rehydrated ${restored} callback(s) for event ${eventName}`);
                                }
                            }
                            catch (e) {
                                console.warn("⚠️ PluginManager: callback rehydration skipped:", e?.message || e);
                            }
                            // Derive a stable request key (prefer conductor requestId)
                            const requestId = data?._musicalContext?.execution?.requestId ||
                                `${id}::__global__`;
                            // Initialize or retrieve per-request context
                            let context = this.requestContexts.get(requestId);
                            if (!context) {
                                context = {
                                    payload: {},
                                    onComponentsLoaded: data?.onComponentsLoaded,
                                    plugin: { id, metadata: plugin.metadata },
                                    sequence: plugin.sequence,
                                };
                            }
                            else if (data?.onComponentsLoaded) {
                                // Keep latest callback if provided
                                context.onComponentsLoaded = data.onComponentsLoaded;
                            }
                            // Serialize handler execution per request via a promise chain
                            const run = async () => {
                                // Provide a conductor-aware logger to plugin handlers
                                const logger = {
                                    log: (...message) => this.eventBus.emit("musical-conductor:log", {
                                        level: "log",
                                        message,
                                        requestId,
                                        pluginId: id,
                                        handlerName,
                                    }),
                                    info: (...message) => this.eventBus.emit("musical-conductor:log", {
                                        level: "info",
                                        message,
                                        requestId,
                                        pluginId: id,
                                        handlerName,
                                    }),
                                    warn: (...message) => this.eventBus.emit("musical-conductor:log", {
                                        level: "warn",
                                        message,
                                        requestId,
                                        pluginId: id,
                                        handlerName,
                                    }),
                                    error: (...message) => this.eventBus.emit("musical-conductor:log", {
                                        level: "error",
                                        message,
                                        requestId,
                                        pluginId: id,
                                        handlerName,
                                    }),
                                };
                                // Emit handler start
                                this.eventBus.emit("plugin:handler:start", {
                                    requestId,
                                    pluginId: id,
                                    handlerName,
                                });
                                // Baton snapshots pre/post for plugin handler
                                const prevSnap = DataBaton.snapshot(context.payload);
                                try {
                                    // Build enriched handler context
                                    const handlerContext = {
                                        ...context,
                                        logger,
                                        // CIA-compliant: expose minimal conductor with play() only
                                        conductor: {
                                            play: (pluginId, sequenceId, ctx, priority) => {
                                                try {
                                                    // Propagate correlation id from event data to nested ctx if missing
                                                    try {
                                                        const key = CBInternal.CORRELATION_KEY;
                                                        if (ctx &&
                                                            typeof ctx === "object" &&
                                                            key &&
                                                            !(key in ctx) &&
                                                            data &&
                                                            typeof data[key] === "string") {
                                                            ctx[key] = data[key];
                                                        }
                                                    }
                                                    catch { }
                                                    const mc = MusicalConductor.getInstance(this.eventBus);
                                                    return mc.play(pluginId, sequenceId, ctx, priority);
                                                }
                                                catch (err) {
                                                    console.warn(`🧠 PluginManager: conductor.play unavailable in handler context for ${id}.${handlerName}:`, err?.message || err);
                                                    return null;
                                                }
                                            },
                                        },
                                        // StageCrew V1: expose per-plugin facade for DOM write cueing
                                        stageCrew: (() => {
                                            try {
                                                // Prefer correlation id from CallbackRegistry key on data if present
                                                const key = CBInternal.CORRELATION_KEY;
                                                const corr = data?.[key] ||
                                                    `mc-${Date.now()}-${Math.random()
                                                        .toString(36)
                                                        .slice(2, 6)}`;
                                                const { StageCrew, } = require("../stage/StageCrew.js");
                                                return new StageCrew(this.eventBus, id);
                                            }
                                            catch {
                                                return undefined;
                                            }
                                        })(),
                                        // Deprecated: emit removed per ADR-0002 (kept temporarily as no-op to avoid breaking plugins)
                                        emit: undefined,
                                    };
                                    const result = await handlerFn(data, handlerContext);
                                    if (result && typeof result === "object") {
                                        context.payload = { ...context.payload, ...result };
                                    }
                                    // Log baton delta for this handler
                                    const nextSnap = DataBaton.snapshot(context.payload);
                                    DataBaton.log({
                                        sequenceName: context.sequence?.name,
                                        beatEvent: eventName,
                                        handlerName,
                                        pluginId: id,
                                        requestId,
                                    }, prevSnap, nextSnap);
                                    if (handlerName === "notifyComponentsLoaded") {
                                        const prepared = context.payload?.preparedComponents || [];
                                        if (typeof context.onComponentsLoaded === "function") {
                                            try {
                                                context.onComponentsLoaded(prepared);
                                            }
                                            catch { }
                                        }
                                        this.eventBus.emit("components:loaded", {
                                            components: prepared,
                                        });
                                    }
                                }
                                catch (err) {
                                    console.error(`🧠 PluginManager: Handler execution failed for ${id}.${handlerName}:`, err);
                                }
                                finally {
                                    // Emit handler end
                                    this.eventBus.emit("plugin:handler:end", {
                                        requestId,
                                        pluginId: id,
                                        handlerName,
                                    });
                                }
                            };
                            context.chain = (context.chain || Promise.resolve())
                                .then(run)
                                .catch(() => {
                                // Already reported via components:error
                            });
                            // Persist updated context
                            this.requestContexts.set(requestId, context);
                        }, { pluginId: `${id}:${sequence.id}` });
                        unsubscribes.push(unsubscribe);
                    }
                }
                if (unsubscribes.length > 0) {
                    // Merge with existing subscriptions if plugin already has some
                    const existingUnsubscribes = this.pluginSubscriptions.get(id) || [];
                    this.pluginSubscriptions.set(id, [...existingUnsubscribes, ...unsubscribes]);
                }
            }
            catch (wireErr) {
                console.warn(`🧠 PluginManager: Failed wiring beat handlers for ${id}:`, wireErr);
            }
            // Store handlers only if provided (optional for event-bus driven plugins)
            if (handlers && typeof handlers === "object") {
                // Merge with existing handlers if plugin already has some
                const existingHandlers = this.pluginHandlers.get(id) || {};
                this.pluginHandlers.set(id, { ...existingHandlers, ...handlers });
            }
            // Cleanup request contexts after sequence completes
            try {
                this.eventBus.subscribe(`${id}:sequence:completed`, (data) => {
                    const requestId = data?._musicalContext?.execution?.requestId;
                    if (requestId)
                        this.requestContexts.delete(requestId);
                }, { pluginId: `${id}:${sequence.id}:cleanup` });
            }
            catch { }
            console.log(`✅ Plugin mounted successfully: ${id}`);
            console.log(`🎼 Sequence registered: ${sequence.name}`);
            return {
                success: true,
                pluginId: id,
                message: `Successfully mounted plugin: ${id}`,
                warnings,
            };
        }
        catch (error) {
            console.error(`❌ Failed to mount plugin ${id}:`, error);
            return {
                success: false,
                pluginId: id,
                message: error instanceof Error ? error.message : String(error),
                reason: "mount_error",
                warnings,
            };
        }
    }
    /**
     * Unmount a plugin and cleanup event subscriptions
     */
    async unmount(pluginId) {
        try {
            const subs = this.pluginSubscriptions.get(pluginId) || [];
            for (const unsub of subs) {
                try {
                    unsub?.();
                }
                catch { }
            }
            this.pluginSubscriptions.delete(pluginId);
            this.mountedPlugins.delete(pluginId);
            this.pluginHandlers.delete(pluginId);
        }
        catch (err) {
            console.warn(`🧠 PluginManager: Failed to unmount ${pluginId}:`, err);
        }
    }
    /**
     * Unmount a plugin
     * @param pluginId - Plugin ID to unmount
     * @returns True if successfully unmounted
     */
    unmountPlugin(pluginId) {
        try {
            if (!this.mountedPlugins.has(pluginId)) {
                console.warn(`🧠 Plugin not found for unmounting: ${pluginId}`);
                return false;
            }
            const plugin = this.mountedPlugins.get(pluginId);
            // Unregister the sequence
            this.sequenceRegistry.unregister(plugin.sequence.name);
            // Remove from mounted plugins
            this.mountedPlugins.delete(pluginId);
            this.pluginHandlers.delete(pluginId);
            console.log(`✅ Plugin unmounted successfully: ${pluginId}`);
            return true;
        }
        catch (error) {
            console.error(`❌ Failed to unmount plugin ${pluginId}:`, error);
            return false;
        }
    }
    /**
     * Register CIA-compliant plugins
     * Loads and mounts all plugins from the plugins directory
     */
    async registerCIAPlugins() {
        try {
            // Prevent React StrictMode double execution
            if (this.pluginsRegistered) {
                console.log("⚠️ Plugins already registered, skipping duplicate registration");
                return;
            }
            console.log("🧠 Registering CIA-compliant plugins...");
            // Track count before attempting registration
            const beforeCount = this.getMountedPluginIds().length;
            // Load plugin manifest
            const pluginManifest = await this.manifestLoader.loadManifest("/plugins/manifest.json");
            // Register plugins dynamically based on manifest data (data-driven approach)
            await this.registerPluginsFromManifest(pluginManifest);
            // Record discovered plugin IDs regardless of mounting success (useful in tests)
            try {
                this.discoveredPluginIds = pluginManifest.plugins.map((p) => p.name);
            }
            catch { }
            // Determine if any new plugins were actually mounted
            const afterCount = this.getMountedPluginIds().length;
            if (afterCount > beforeCount) {
                // Mark plugins as registered to prevent duplicate execution
                this.pluginsRegistered = true;
                console.log(`✅ CIA-compliant plugins registered successfully (mounted: ${afterCount - beforeCount}, total: ${afterCount})`);
            }
            else {
                // Nothing mounted (likely manifest load issue or all autoMount=false) — allow retry later
                console.warn("⚠️ No CIA plugins were mounted. Leaving pluginsRegistered=false so a later retry can succeed.");
            }
        }
        catch (error) {
            console.error("❌ Failed to register CIA plugins:", error);
            // Fallback to basic event handling if plugin loading fails
            this.registerFallbackSequences();
        }
    }
    /**
     * Register plugins from manifest
     * @param manifest - Plugin manifest data
     */
    async registerPluginsFromManifest(manifest) {
        console.log("🎼 PluginManager: Registering plugins from manifest...");
        console.log(`🔌 Processing ${manifest.plugins.length} plugins from manifest`);
        // Iterate through plugins defined in manifest
        for (const plugin of manifest.plugins) {
            try {
                if (plugin.autoMount) {
                    // Check if plugin is already mounted (prevents React StrictMode double execution)
                    if (this.mountedPlugins.has(plugin.name)) {
                        console.log(`⚠️ Plugin already mounted, skipping: ${plugin.name}`);
                        continue;
                    }
                    console.log(`🔌 Auto-mounting plugin: ${plugin.name} from ${plugin.path}`);
                    // Dynamic plugin loading using pre-compiled JavaScript files
                    const pluginModule = await this.pluginLoader.loadPluginModule(`/plugins/${plugin.path}index.js`);
                    // Validate plugin structure
                    if (!pluginModule.sequence || !pluginModule.handlers) {
                        console.warn(`⚠️ Plugin ${plugin.name} missing required exports (sequence, handlers)`);
                        continue;
                    }
                    // Mount the plugin with metadata from manifest
                    // Use the symphony id (sequence.id) as the pluginId for architectural consistency
                    const mountResult = await this.mount(pluginModule.sequence, pluginModule.handlers, pluginModule.sequence?.id || plugin.name, {
                        version: plugin.version,
                        description: plugin.description,
                        path: plugin.path,
                        autoMount: plugin.autoMount,
                    });
                    if (mountResult.success) {
                        console.log(`✅ Auto-mounted plugin: ${plugin.name}`);
                    }
                    else {
                        console.error(`❌ Failed to auto-mount plugin ${plugin.name}: ${mountResult.message}`);
                    }
                }
                else {
                    console.log(`⏭️ Skipping non-auto-mount plugin: ${plugin.name}`);
                }
            }
            catch (error) {
                console.error(`❌ Error processing plugin ${plugin.name}:`, error);
            }
        }
    }
    /**
     * Register fallback sequences when plugin loading fails
     */
    registerFallbackSequences() {
        console.log("🔄 Registering fallback sequences...");
        // Register basic fallback sequences for essential functionality
        const fallbackSequences = [
            {
                name: "fallback-sequence",
                description: "Basic fallback sequence",
                movements: [
                    {
                        name: "fallback-movement",
                        beats: [
                            {
                                beat: 1,
                                event: "fallback-event",
                                title: "Fallback Event",
                                description: "Basic fallback event",
                                dynamics: "forte",
                                timing: "immediate",
                                errorHandling: "continue",
                                data: {},
                            },
                        ],
                    },
                ],
            },
        ];
        fallbackSequences.forEach((sequence) => {
            this.sequenceRegistry.register(sequence);
        });
        console.log("✅ Fallback sequences registered");
    }
    /**
     * Get plugin information
     * @param pluginId - Plugin ID
     * @returns Plugin information or undefined
     */
    getPluginInfo(pluginId) {
        return this.mountedPlugins.get(pluginId);
    }
    /**
     * Get all mounted plugin IDs
     * @returns Array of plugin IDs
     */
    getMountedPluginIds() {
        // Prefer mounted plugin IDs, but include registered sequence IDs and discovered plugin names
        const mountedIds = Array.from(this.mountedPlugins.keys());
        let sequenceIds = [];
        try {
            sequenceIds = this.sequenceRegistry.getAll().map((s) => s.id);
        }
        catch { }
        const all = new Set();
        for (const id of mountedIds)
            if (id)
                all.add(id);
        for (const id of sequenceIds)
            if (id)
                all.add(id);
        for (const id of this.discoveredPluginIds || [])
            if (id)
                all.add(id);
        return Array.from(all);
    }
    /**
     * Get all mounted plugin names (alias for getMountedPluginIds)
     */
    getMountedPlugins() {
        return this.getMountedPluginIds();
    }
    /**
     * Get plugin handlers for a specific plugin
     * @param pluginId - Plugin ID
     * @returns Plugin handlers or null
     */
    getPluginHandlers(pluginId) {
        // Validate plugin exists
        const plugin = this.mountedPlugins.get(pluginId);
        if (!plugin) {
            console.warn(`🧠 Plugin not found: ${pluginId}. Available plugins: [${Array.from(this.mountedPlugins.keys()).join(", ")}]`);
            return null;
        }
        return this.pluginHandlers.get(pluginId) || null;
    }
    /**
     * Get plugin statistics
     * @returns Plugin statistics
     */
    getStatistics() {
        return {
            totalPlugins: this.mountedPlugins.size,
            mountedPlugins: this.getMountedPluginIds(),
            pluginsRegistered: this.pluginsRegistered,
        };
    }
    /**
     * Get total number of sequences from all mounted plugins
     * @returns Total sequence count
     */
    getTotalSequences() {
        return Array.from(this.mountedPlugins.values()).reduce((count, plugin) => {
            return count + (plugin.sequence ? 1 : 0);
        }, 0);
    }
    /**
     * Reset plugin manager state (for testing)
     */
    reset() {
        this.mountedPlugins.clear();
        this.pluginHandlers.clear();
        this.pluginsRegistered = false;
        console.log("🧹 PluginManager: State reset");
    }
}
//# sourceMappingURL=PluginManager.js.map