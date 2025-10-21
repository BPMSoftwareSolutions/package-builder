// Standalone public surface for @renderx/host-sdk
export { useConductor } from "./conductor.js";
export type { ConductorClient } from "./conductor.js";
export { EventRouter } from "./EventRouter.js";
export { resolveInteraction } from "./interactionManifest.js";
export { isFlagEnabled, getFlagMeta, getAllFlags, getUsageLog, setFlagOverride, clearFlagOverrides, setFeatureFlagsProvider } from "./feature-flags.js";
export type { FlagsProvider } from "./feature-flags.js";
// Provider hooks (optional):
export { setInteractionManifestProvider } from "./core/manifests/interactionManifest.js";
export type { InteractionManifestProvider } from "./core/manifests/interactionManifest.js";
export { setTopicsManifestProvider } from "./core/manifests/topicsManifest.js";
export type { TopicsManifestProvider } from "./core/manifests/topicsManifest.js";
export { setStartupStatsProvider } from "./core/startup/startupValidation.js";
export type { StartupStatsProvider } from "./core/startup/startupValidation.js";

export { getTagForType, computeTagFromJson } from "./component-mapper.js";
export { mapJsonComponentToTemplate } from "./jsonComponent.mapper.js";
export { getPluginManifest, getCachedPluginManifest, setPluginManifest } from "./pluginManifest.js";

// Inventory API
export { listComponents, getComponentById, onInventoryChanged, Inventory } from "./inventory.js";
export type { ComponentSummary, Component, InventoryAPI } from "./types.js";

// CSS Registry API
export { hasClass, createClass, updateClass, onCssChanged, CssRegistry } from "./cssRegistry.js";
export type { CssClassDef, CssRegistryAPI } from "./types.js";

// Config API
export { getConfigValue, hasConfigValue } from "./config.js";
export type { ConfigAPI } from "./types.js";