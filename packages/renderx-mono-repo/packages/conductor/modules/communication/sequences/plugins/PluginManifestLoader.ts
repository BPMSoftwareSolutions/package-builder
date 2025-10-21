/**
 * PluginManifestLoader - Manifest loading and parsing
 * Handles loading and validation of plugin manifest files
 */

export interface PluginManifestEntry {
  name: string;
  path: string;
  version: string;
  description: string;
  autoMount: boolean;
  dependencies?: string[];
  author?: string;
  license?: string;
}

export interface PluginManifest {
  version: string;
  plugins: PluginManifestEntry[];
  metadata?: {
    name?: string;
    description?: string;
    author?: string;
    created?: string;
    updated?: string;
  };
}

export class PluginManifestLoader {
  private manifestCache: Map<string, PluginManifest> = new Map();

  /**
   * Load plugin manifest from a URL or path
   * @param manifestPath - Path to the manifest file
   * @returns Plugin manifest data
   */
  async loadManifest(manifestPath: string): Promise<PluginManifest> {
    // Check cache first
    if (this.manifestCache.has(manifestPath)) {
      console.log(`📦 Loading manifest from cache: ${manifestPath}`);
      return this.manifestCache.get(manifestPath)!;
    }

    try {
      console.log(`🔄 Loading plugin manifest: ${manifestPath}`);

      // Node/Jest-friendly: if running in Node (no window), try local repo path first
      const isBrowser =
        typeof window !== "undefined" &&
        typeof (window as any).document !== "undefined";
      if (!isBrowser && manifestPath.startsWith("/plugins/")) {
        try {
          const path = await import("node:path");
          const fs = await import("node:fs");
          const localPath = path.resolve(
            process.cwd(),
            manifestPath.replace(/^\/?plugins\//, "RenderX/public/plugins/")
          );
          if (fs.existsSync(localPath)) {
            const jsonText = fs.readFileSync(localPath, "utf-8");
            const manifestData = JSON.parse(jsonText);
            const validatedManifest = this.validateManifest(manifestData);
            this.manifestCache.set(manifestPath, validatedManifest);
            console.log(
              `✅ Successfully loaded manifest from local file: ${localPath}`
            );
            console.log(
              `📋 Found ${validatedManifest.plugins.length} plugins in manifest`
            );
            return validatedManifest;
          }
        } catch (nodeErr) {
          console.warn(
            "⚠️ Node local manifest load failed, falling back to fetch:",
            nodeErr
          );
        }
      }

      // Fetch the manifest file (browser or as fallback)
      const response = await fetch(manifestPath);

      if (!response.ok) {
        throw new Error(
          `Failed to fetch manifest: ${response.status} ${response.statusText}`
        );
      }

      const manifestData = await response.json();

      // Validate manifest structure
      const validatedManifest = this.validateManifest(manifestData);

      // Cache the manifest
      this.manifestCache.set(manifestPath, validatedManifest);

      console.log(`✅ Successfully loaded manifest: ${manifestPath}`);
      console.log(
        `📋 Found ${validatedManifest.plugins.length} plugins in manifest`
      );

      return validatedManifest;
    } catch (error) {
      console.error(`❌ Failed to load manifest from ${manifestPath}:`, error);

      // Return fallback manifest
      const fallbackManifest = this.createFallbackManifest();
      console.log("🔄 Using fallback manifest");

      return fallbackManifest;
    }
  }

  /**
   * Validate manifest structure and content
   * @param manifestData - Raw manifest data
   * @returns Validated manifest
   */
  private validateManifest(manifestData: any): PluginManifest {
    if (!manifestData || typeof manifestData !== "object") {
      throw new Error("Manifest must be a valid JSON object");
    }

    // Validate required properties
    if (!manifestData.version || typeof manifestData.version !== "string") {
      console.warn("⚠️ Manifest missing version, using default");
      manifestData.version = "1.0.0";
    }

    if (!manifestData.plugins || !Array.isArray(manifestData.plugins)) {
      throw new Error("Manifest must contain a plugins array");
    }

    // Validate each plugin entry
    const validatedPlugins: PluginManifestEntry[] = [];

    manifestData.plugins.forEach((plugin: any, index: number) => {
      try {
        const validatedPlugin = this.validatePluginEntry(plugin, index);
        validatedPlugins.push(validatedPlugin);
      } catch (error) {
        console.error(`❌ Invalid plugin entry at index ${index}:`, error);
        // Skip invalid entries but continue processing
      }
    });

    if (validatedPlugins.length === 0) {
      console.warn("⚠️ No valid plugins found in manifest");
    }

    return {
      version: manifestData.version,
      plugins: validatedPlugins,
      metadata: manifestData.metadata || {},
    };
  }

  /**
   * Validate individual plugin entry
   * @param plugin - Plugin entry to validate
   * @param index - Index for error reporting
   * @returns Validated plugin entry
   */
  private validatePluginEntry(plugin: any, index: number): PluginManifestEntry {
    if (!plugin || typeof plugin !== "object") {
      throw new Error(`Plugin entry ${index} must be an object`);
    }

    // Validate required properties
    if (!plugin.name || typeof plugin.name !== "string") {
      throw new Error(`Plugin entry ${index} must have a valid name`);
    }

    if (!plugin.path || typeof plugin.path !== "string") {
      throw new Error(`Plugin entry ${index} must have a valid path`);
    }

    // Ensure path ends with /
    if (!plugin.path.endsWith("/")) {
      plugin.path += "/";
    }

    // Set defaults for optional properties
    const validatedPlugin: PluginManifestEntry = {
      name: plugin.name,
      path: plugin.path,
      version: plugin.version || "1.0.0",
      description: plugin.description || `Plugin: ${plugin.name}`,
      autoMount: plugin.autoMount !== false, // Default to true
      dependencies: Array.isArray(plugin.dependencies)
        ? plugin.dependencies
        : [],
      author: plugin.author || "Unknown",
      license: plugin.license || "MIT",
    };

    return validatedPlugin;
  }

  /**
   * Create a fallback manifest when loading fails
   * @returns Fallback manifest
   */
  private createFallbackManifest(): PluginManifest {
    return {
      version: "1.0.0",
      plugins: [
        {
          name: "fallback-plugin",
          path: "fallback/",
          version: "1.0.0",
          description: "Fallback plugin for when manifest loading fails",
          autoMount: false,
          dependencies: [],
          author: "System",
          license: "MIT",
        },
      ],
      metadata: {
        name: "Fallback Manifest",
        description: "Generated fallback manifest",
        author: "MusicalConductor",
        created: new Date().toISOString(),
      },
    };
  }

  /**
   * Load manifest from multiple sources with fallback
   * @param manifestPaths - Array of manifest paths to try
   * @returns First successfully loaded manifest
   */
  async loadManifestWithFallback(
    manifestPaths: string[]
  ): Promise<PluginManifest> {
    for (const path of manifestPaths) {
      try {
        const manifest = await this.loadManifest(path);
        console.log(`✅ Successfully loaded manifest from: ${path}`);
        return manifest;
      } catch (error) {
        console.warn(`⚠️ Failed to load manifest from ${path}, trying next...`);
      }
    }

    console.warn("⚠️ All manifest sources failed, using fallback");
    return this.createFallbackManifest();
  }

  /**
   * Parse manifest from JSON string
   * @param manifestJson - JSON string containing manifest
   * @returns Parsed and validated manifest
   */
  parseManifest(manifestJson: string): PluginManifest {
    try {
      const manifestData = JSON.parse(manifestJson);
      return this.validateManifest(manifestData);
    } catch (error) {
      console.error("❌ Failed to parse manifest JSON:", error);
      throw new Error(
        `Invalid manifest JSON: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  /**
   * Filter plugins by criteria
   * @param manifest - Manifest to filter
   * @param criteria - Filter criteria
   * @returns Filtered plugin entries
   */
  filterPlugins(
    manifest: PluginManifest,
    criteria: {
      autoMount?: boolean;
      name?: string;
      version?: string;
      author?: string;
    }
  ): PluginManifestEntry[] {
    return manifest.plugins.filter((plugin) => {
      if (
        criteria.autoMount !== undefined &&
        plugin.autoMount !== criteria.autoMount
      ) {
        return false;
      }
      if (criteria.name && !plugin.name.includes(criteria.name)) {
        return false;
      }
      if (criteria.version && plugin.version !== criteria.version) {
        return false;
      }
      if (criteria.author && plugin.author !== criteria.author) {
        return false;
      }
      return true;
    });
  }

  /**
   * Get manifest statistics
   * @param manifest - Manifest to analyze
   * @returns Manifest statistics
   */
  getManifestStatistics(manifest: PluginManifest): {
    totalPlugins: number;
    autoMountPlugins: number;
    manualMountPlugins: number;
    uniqueAuthors: string[];
    versions: string[];
  } {
    const autoMountPlugins = manifest.plugins.filter((p) => p.autoMount).length;
    const uniqueAuthors = [
      ...new Set(manifest.plugins.map((p) => p.author || "Unknown")),
    ];
    const versions = [...new Set(manifest.plugins.map((p) => p.version))];

    return {
      totalPlugins: manifest.plugins.length,
      autoMountPlugins,
      manualMountPlugins: manifest.plugins.length - autoMountPlugins,
      uniqueAuthors,
      versions,
    };
  }

  /**
   * Clear manifest cache
   */
  clearCache(): void {
    this.manifestCache.clear();
    console.log("🧹 PluginManifestLoader: Cache cleared");
  }

  /**
   * Get cached manifest paths
   * @returns Array of cached manifest paths
   */
  getCachedPaths(): string[] {
    return Array.from(this.manifestCache.keys());
  }

  /**
   * Remove specific manifest from cache
   * @param manifestPath - Path to remove from cache
   * @returns True if removed, false if not found
   */
  removeCached(manifestPath: string): boolean {
    return this.manifestCache.delete(manifestPath);
  }
}
