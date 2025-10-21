# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- **Config API**: New host-managed configuration service for plugins
  - `getConfigValue(key)`: Get a configuration value from the host
  - `hasConfigValue(key)`: Check if a configuration key exists
  - `initConfig(initialConfig)`: Host function to initialize configuration with environment variable support
  - `setConfigValue(key, value)`: Host function to set configuration values at runtime
  - `removeConfigValue(key)`: Host function to remove configuration values
  - Full TypeScript support with `ConfigAPI` type
  - Subpath export: `@renderx-plugins/host-sdk/core/environment/config`

### Features

- **Environment Variable Support**: Seamless integration with Vite's `import.meta.env` for E2E/CI workflows
- **Host-Managed Configuration**: Respects plugin boundaries - plugins access via SDK, not direct host imports
- **SSR-Safe**: Returns `undefined` in Node.js environments without throwing errors
- **Runtime Updates**: Host can update configuration values at runtime
- **Thin Host Principle**: Host provides service, plugins consume via simple facade
- **Upgrade Path**: Designed to support future backend proxy implementation without plugin code changes

### Technical Details

- Follows established facade pattern used by other SDK components
- Configuration stored in `window.RenderX.config` for browser environments
- Comprehensive unit test coverage with 30+ tests
- TypeScript definitions included in global `Window.RenderX` interface
- Compatible with existing build and test infrastructure

## [0.3.0] - 2025-09-10

### Added

- **Inventory API**: New facade for component inventory management
  - `listComponents()`: List all available components with summary information
  - `getComponentById(id)`: Get detailed component information by ID
  - `onInventoryChanged(callback)`: Subscribe to inventory changes
  - `Inventory` object: Convenience object containing all inventory methods
  - Full TypeScript support with `ComponentSummary`, `Component`, and `InventoryAPI` types

- **CSS Registry API**: New facade for CSS class management
  - `hasClass(name)`: Check if a CSS class exists
  - `createClass(def)`: Create a new CSS class
  - `updateClass(name, def)`: Update an existing CSS class
  - `onCssChanged(callback)`: Subscribe to CSS registry changes
  - `CssRegistry` object: Convenience object containing all CSS registry methods
  - Full TypeScript support with `CssClassDef` and `CssRegistryAPI` types

### Features

- **Node/SSR Support**: Both APIs work seamlessly in Node.js environments with mock implementations
- **Host Delegation**: APIs delegate to host implementations when available, falling back gracefully
- **Observer Pattern**: Both APIs support change observers with proper unsubscribe functionality
- **Error Handling**: Comprehensive error handling with graceful fallbacks and informative warnings
- **Test Utilities**: Mock functions for testing in Node/SSR environments

### Breaking Changes

None. This release is fully backwards compatible.

### Upgrade Notes

- All new API methods are asynchronous and return Promises. Consumers should treat these methods as async operations.
- The APIs are designed to work without host implementations, making them safe to use in any environment.
- Observer callbacks should handle potential errors gracefully as the SDK will log warnings but continue operation.

### Technical Details

- APIs follow the established facade pattern used by other SDK components
- Full unit test coverage with 56 passing tests
- TypeScript definitions included in global `Window.RenderX` interface
- Compatible with existing build and test infrastructure

## [0.1.1] - 2025-09-09

### Fixed

- Export `setPluginManifest` function in public API
- Correct test imports to align with repository layout
- Update repository URL in package.json

## [0.1.0] - 2025-09-09

### Added

- Initial release of `@renderx-plugins/host-sdk`
- Conductor API with `useConductor` hook
- Event routing with `EventRouter`
- Interaction resolution with `resolveInteraction`
- Feature flags management
- Component mapping utilities
- Plugin manifest access
- Comprehensive test suite with Vitest
- TypeScript support with full type definitions
