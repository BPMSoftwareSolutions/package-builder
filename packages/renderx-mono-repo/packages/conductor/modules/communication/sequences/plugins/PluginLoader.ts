/**
 * PluginLoader - Plugin loading and module resolution
 * Handles dynamic loading of plugin modules with fallback strategies
 */

import { isDevEnv } from "../environment/ConductorEnv.js";

export class PluginLoader {
  private moduleCache: Map<string, any> = new Map();

  /**
   * Load a plugin module with caching and fallback strategies
   * @param pluginPath - Path to the plugin module (e.g., "/plugins/App.app-shell-symphony/index.js")
   * @returns Plugin module with exports
   */
  async loadPluginModule(pluginPath: string): Promise<any> {
    // Check cache first
    if (this.moduleCache.has(pluginPath)) {
      console.log(`📦 Loading plugin from cache: ${pluginPath}`);
      return this.moduleCache.get(pluginPath);
    }

    // Node/Jest-friendly import: map /plugins/... to local repo path when not in browser
    try {
      const isBrowser =
        typeof window !== "undefined" &&
        typeof (window as any).document !== "undefined";
      if (!isBrowser && pluginPath.startsWith("/plugins/")) {
        const path = await import("node:path");
        const { pathToFileURL } = await import("node:url");
        const localPath = path.resolve(
          process.cwd(),
          pluginPath.replace(/^\/?plugins\//, "RenderX/public/plugins/")
        );
        const fileUrl = pathToFileURL(localPath).href;
        console.log(`🔄 [node] Importing plugin via file URL: ${fileUrl}`);
        let module: any | null = null;
        try {
          module = await import(fileUrl);
          // Unwrap default export if necessary
          if (
            module &&
            module.default &&
            !module.sequence &&
            !module.handlers
          ) {
            const def = module.default;
            if (def && (def.sequence || def.handlers)) module = def;
          }
        } catch (importErr) {
          console.warn(
            `⚠️ file:// import failed for ${fileUrl}. Trying transform fallback.`,
            importErr
          );
        }
        // If import did not work or did not expose named exports, try transform fallback
        if (!module?.sequence && !module?.handlers) {
          try {
            const fs = await import("node:fs");
            const src = fs.readFileSync(localPath, "utf-8");
            const transformed = src
              .replace(/^\s*import\s+[^;]+;?/gm, "")
              .replace(/export const (\w+)\s*=\s*/g, "moduleExports.$1 = ")
              .replace(
                /export\s+async\s+function\s+(\w+)\s*\(/g,
                "moduleExports.$1 = async function $1("
              )
              .replace(
                /export\s+function\s+(\w+)\s*\(/g,
                "moduleExports.$1 = function $1("
              )
              .replace(/export default\s+/g, "moduleExports.default = ");
            const moduleExports: any = {};
            const evaluator = new Function(
              "moduleExports",
              "fetch",
              transformed
            );
            evaluator(moduleExports, (globalThis as any).fetch);
            module = moduleExports;
          } catch (fallbackErr) {
            console.warn(
              "⚠️ PluginLoader fallback transform failed:",
              fallbackErr
            );
          }
        }
        if (!module) {
          throw new Error(`Failed to load plugin module at ${fileUrl}`);
        }
        this.moduleCache.set(pluginPath, module);
        return module;
      }
    } catch (nodeImportErr) {
      console.warn(
        "⚠️ Node/Jest import path mapping failed, falling back to web import:",
        nodeImportErr
      );
    }

    // Extract plugin directory from path
    const pluginDir = pluginPath.substring(0, pluginPath.lastIndexOf("/"));
    const bundledPath = `${pluginDir}/dist/plugin.js`;

    // Prefer original path in dev to avoid 500s for missing dist builds
    const isDev = isDevEnv();

    if (isDev) {
      // Try original path first (dev)
      try {
        console.log(`🔄 Attempting to load plugin: ${pluginPath}`);
        const module = await import(pluginPath);
        this.moduleCache.set(pluginPath, module);
        console.log(`✅ Successfully loaded plugin: ${pluginPath}`);
        return module;
      } catch (originalError) {
        console.log(
          `⚠️ Dev load failed (${pluginPath}), trying bundled path as fallback`
        );
        // Fall through to bundled attempt
      }

      try {
        console.log(`🔄 Attempting to load bundled plugin: ${bundledPath}`);
        let module: any = await import(bundledPath);
        if (module && module.default && !module.sequence && !module.handlers) {
          const def = module.default;
          if (def && (def.sequence || def.handlers)) module = def;
        }
        this.moduleCache.set(pluginPath, module);
        console.log(`✅ Successfully loaded bundled plugin: ${bundledPath}`);
        return module;
      } catch (bundledError) {
        console.warn(
          `⚠️ Failed to load plugin from both dev and bundled paths for ${pluginPath}`
        );
      }
    } else {
      // Prod: try bundled first
      try {
        console.log(`🔄 Attempting to load bundled plugin: ${bundledPath}`);
        let module: any = await import(bundledPath);
        if (module && module.default && !module.sequence && !module.handlers) {
          const def = module.default;
          if (def && (def.sequence || def.handlers)) module = def;
        }
        this.moduleCache.set(pluginPath, module);
        console.log(`✅ Successfully loaded bundled plugin: ${bundledPath}`);
        return module;
      } catch (bundledError) {
        console.log(
          `⚠️ Bundled version not available (${bundledPath}), trying original path`
        );
      }

      try {
        console.log(`🔄 Attempting to load plugin: ${pluginPath}`);
        let module: any = await import(pluginPath);
        if (module && module.default && !module.sequence && !module.handlers) {
          const def = module.default;
          if (def && (def.sequence || def.handlers)) module = def;
        }
        this.moduleCache.set(pluginPath, module);
        console.log(`✅ Successfully loaded plugin: ${pluginPath}`);
        return module;
      } catch (originalError) {
        console.warn(
          `⚠️ Failed to load plugin from original path: ${pluginPath}. Error: ${
            originalError instanceof Error
              ? originalError.message
              : originalError
          }`
        );
        // Fall back to complex dependency resolution
        return this.loadPluginModuleComplex(pluginPath);
      }
    }
  }

  /**
   * Complex plugin loading with full dependency resolution (fallback method)
   * @param pluginPath - Path to the plugin module
   * @returns Plugin module with exports
   */
  private async loadPluginModuleComplex(pluginPath: string): Promise<any> {
    try {
      console.log(
        `🔄 Loading plugin module with complex resolution: ${pluginPath}`
      );

      // Extract plugin directory and name
      const pluginDir = pluginPath.substring(0, pluginPath.lastIndexOf("/"));
      const pluginName = pluginDir.substring(pluginDir.lastIndexOf("/") + 1);

      console.log(`🔍 Plugin directory: ${pluginDir}`);
      console.log(`🔍 Plugin name: ${pluginName}`);

      // Try multiple resolution strategies
      const resolutionStrategies = [
        `${pluginDir}/index.js`,
        `${pluginDir}/src/index.js`,
        `${pluginDir}/lib/index.js`,
        `${pluginDir}/dist/index.js`,
        `${pluginDir}/${pluginName}.js`,
        `${pluginDir}/main.js`,
      ];

      for (const strategy of resolutionStrategies) {
        try {
          console.log(`🔄 Trying resolution strategy: ${strategy}`);
          let module: any = await import(strategy);
          if (
            module &&
            module.default &&
            !module.sequence &&
            !module.handlers
          ) {
            const def = module.default;
            if (def && (def.sequence || def.handlers)) module = def;
          }
          // Cache the loaded module
          this.moduleCache.set(pluginPath, module);

          console.log(
            `✅ Successfully loaded plugin with strategy: ${strategy}`
          );
          return module;
        } catch (strategyError) {
          console.log(
            `⚠️ Strategy failed: ${strategy} - ${
              strategyError instanceof Error
                ? strategyError.message
                : strategyError
            }`
          );
        }
      }

      // If all strategies fail, try dynamic import with error handling
      throw new Error(
        `Failed to load plugin module: ${pluginPath}. All resolution strategies failed.`
      );
    } catch (error) {
      console.error(
        `❌ Complex plugin loading failed for ${pluginPath}:`,
        error
      );
      throw error;
    }
  }

  /**
   * Load plugin from a specific path with validation
   * @param pluginPath - Path to the plugin
   * @returns Plugin module or null if failed
   */
  async loadPlugin(pluginPath: string): Promise<any> {
    try {
      console.log(`🧠 PluginLoader: Loading plugin from: ${pluginPath}`);

      const plugin = await this.loadPluginModule(pluginPath);

      // Validate plugin structure after import
      if (!plugin || typeof plugin !== "object") {
        console.warn(
          `🧠 Failed to load plugin: invalid plugin structure at ${pluginPath}`
        );
        return null;
      }

      // Check for required exports
      if (!plugin.sequence && !plugin.handlers && !plugin.default) {
        console.warn(
          `🧠 Plugin at ${pluginPath} missing required exports (sequence, handlers, or default)`
        );
        return null;
      }

      // Handle default export
      if (plugin.default && !plugin.sequence) {
        console.log(`🔄 Using default export for plugin: ${pluginPath}`);
        return plugin.default;
      }

      console.log(`✅ Successfully loaded and validated plugin: ${pluginPath}`);
      return plugin;
    } catch (error) {
      console.error(`❌ Failed to load plugin from ${pluginPath}:`, error);
      return null;
    }
  }

  /**
   * Preload multiple plugins
   * @param pluginPaths - Array of plugin paths to preload
   * @returns Array of loaded plugins (null for failed loads)
   */
  async preloadPlugins(pluginPaths: string[]): Promise<(any | null)[]> {
    console.log(`🔄 Preloading ${pluginPaths.length} plugins...`);

    const loadPromises = pluginPaths.map(async (path) => {
      try {
        return await this.loadPlugin(path);
      } catch (error) {
        console.error(`❌ Failed to preload plugin ${path}:`, error);
        return null;
      }
    });

    const results = await Promise.all(loadPromises);
    const successCount = results.filter((result) => result !== null).length;

    console.log(
      `✅ Preloaded ${successCount}/${pluginPaths.length} plugins successfully`
    );

    return results;
  }

  /**
   * Check if a plugin is cached
   * @param pluginPath - Plugin path to check
   * @returns True if cached
   */
  isCached(pluginPath: string): boolean {
    return this.moduleCache.has(pluginPath);
  }

  /**
   * Clear the module cache
   */
  clearCache(): void {
    this.moduleCache.clear();
    console.log("🧹 PluginLoader: Module cache cleared");
  }

  /**
   * Get cache statistics
   * @returns Cache statistics
   */
  getCacheStatistics(): {
    cachedModules: number;
    cachedPaths: string[];
  } {
    return {
      cachedModules: this.moduleCache.size,
      cachedPaths: Array.from(this.moduleCache.keys()),
    };
  }

  /**
   * Remove a specific module from cache
   * @param pluginPath - Plugin path to remove from cache
   * @returns True if removed, false if not found
   */
  removeCached(pluginPath: string): boolean {
    const removed = this.moduleCache.delete(pluginPath);
    if (removed) {
      console.log(`🗑️ Removed plugin from cache: ${pluginPath}`);
    }
    return removed;
  }

  /**
   * Validate plugin module structure
   * @param pluginModule - Plugin module to validate
   * @returns Validation result
   */
  validatePluginModule(pluginModule: any): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!pluginModule || typeof pluginModule !== "object") {
      errors.push("Plugin module is not a valid object");
      return { isValid: false, errors, warnings };
    }

    // Check for sequence export
    if (!pluginModule.sequence) {
      if (pluginModule.default?.sequence) {
        warnings.push("Using sequence from default export");
      } else {
        errors.push("Missing required 'sequence' export");
      }
    }

    // Check for handlers export
    if (!pluginModule.handlers) {
      if (pluginModule.default?.handlers) {
        warnings.push("Using handlers from default export");
      } else {
        warnings.push(
          "Missing 'handlers' export - plugin may be event-bus driven"
        );
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }
}
