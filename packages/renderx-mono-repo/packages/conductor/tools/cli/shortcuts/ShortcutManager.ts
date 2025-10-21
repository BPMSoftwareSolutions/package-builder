/**
 * ShortcutManager - Data-driven shortcut system for quick access to knowledge sources
 * Enables one keyword/phrase to link to multiple relevant documentation and resources
 */

import * as fs from "fs";
import * as path from "path";
import { CLILogger } from "../utils/CLILogger";

export interface ShortcutResource {
  type:
    | "documentation"
    | "code"
    | "example"
    | "test"
    | "architecture"
    | "api"
    | "guide"
    | "reference";
  title: string;
  description: string;
  url?: string;
  filePath?: string;
  lineRange?: [number, number];
  priority: number; // 1-10, higher = more relevant
  tags: string[];
}

export interface Shortcut {
  keyword: string;
  aliases: string[];
  description: string;
  category: string;
  resources: ShortcutResource[];
  lastUpdated: number;
}

export interface ShortcutDatabase {
  version: string;
  shortcuts: Shortcut[];
  categories: string[];
  lastUpdated: number;
}

export class ShortcutManager {
  private logger: CLILogger;
  private database!: ShortcutDatabase; // Initialized in loadDatabase()
  private databasePath: string;

  constructor() {
    this.logger = new CLILogger();
    this.databasePath = path.join(__dirname, "../data/shortcuts.json");
    this.loadDatabase();
  }

  private loadDatabase(): void {
    try {
      if (fs.existsSync(this.databasePath)) {
        const data = fs.readFileSync(this.databasePath, "utf8");
        this.database = JSON.parse(data);
      } else {
        this.database = this.createDefaultDatabase();
        this.saveDatabase();
      }
    } catch (error) {
      this.logger.warn("⚠️ Failed to load shortcuts database, using defaults");
      this.database = this.createDefaultDatabase();
    }
  }

  private saveDatabase(): void {
    try {
      const dir = path.dirname(this.databasePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(
        this.databasePath,
        JSON.stringify(this.database, null, 2)
      );
    } catch (error) {
      this.logger.error("❌ Failed to save shortcuts database:", error);
    }
  }

  private createDefaultDatabase(): ShortcutDatabase {
    return {
      version: "1.0.0",
      lastUpdated: Date.now(),
      categories: [
        "testing",
        "architecture",
        "documentation",
        "development",
        "deployment",
        "troubleshooting",
        "api",
        "examples",
      ],
      shortcuts: [
        {
          keyword: "testing",
          aliases: ["test", "tests", "unit-test", "integration-test"],
          description: "Testing documentation and examples",
          category: "testing",
          lastUpdated: Date.now(),
          resources: [
            {
              type: "documentation",
              title: "Testing Guide",
              description:
                "Comprehensive testing documentation for MusicalConductor",
              filePath: "docs/testing/README.md",
              priority: 10,
              tags: ["testing", "guide", "documentation"],
            },
            {
              type: "example",
              title: "Unit Test Examples",
              description: "Example unit tests for sequences and plugins",
              filePath: "tests/examples/",
              priority: 9,
              tags: ["testing", "examples", "unit-tests"],
            },
            {
              type: "code",
              title: "Test Utilities",
              description:
                "Helper utilities for testing MusicalConductor components",
              filePath: "tests/utils/TestUtilities.ts",
              priority: 8,
              tags: ["testing", "utilities", "helpers"],
            },
          ],
        },
        {
          keyword: "architecture",
          aliases: ["arch", "design", "structure", "components"],
          description: "System architecture and design documentation",
          category: "architecture",
          lastUpdated: Date.now(),
          resources: [
            {
              type: "architecture",
              title: "MusicalConductor Architecture",
              description:
                "Core architecture overview and component relationships",
              filePath: "docs/architecture/README.md",
              priority: 10,
              tags: ["architecture", "overview", "components"],
            },
            {
              type: "architecture",
              title: "Event System Architecture",
              description: "Detailed event bus and communication system design",
              filePath: "docs/architecture/event-system.md",
              priority: 9,
              tags: ["architecture", "events", "communication"],
            },
            {
              type: "code",
              title: "Core Components",
              description: "Main MusicalConductor implementation",
              filePath: "modules/communication/sequences/MusicalConductor.ts",
              lineRange: [1, 100],
              priority: 8,
              tags: ["architecture", "code", "core"],
            },
          ],
        },
        {
          keyword: "sequences",
          aliases: ["sequence", "musical-sequence", "beats", "movements"],
          description: "Musical sequence system documentation and examples",
          category: "development",
          lastUpdated: Date.now(),
          resources: [
            {
              type: "documentation",
              title: "Sequence Development Guide",
              description: "How to create and manage musical sequences",
              filePath: "docs/sequences/development-guide.md",
              priority: 10,
              tags: ["sequences", "development", "guide"],
            },
            {
              type: "example",
              title: "Sequence Examples",
              description: "Example sequence implementations",
              filePath: "modules/communication/sequences/examples/",
              priority: 9,
              tags: ["sequences", "examples", "implementation"],
            },
            {
              type: "api",
              title: "Sequence API Reference",
              description: "Complete API reference for sequence operations",
              filePath: "docs/api/sequences.md",
              priority: 8,
              tags: ["sequences", "api", "reference"],
            },
            {
              type: "code",
              title: "MusicalConductor Core",
              description:
                "Main conductor implementation with sequence management",
              filePath: "modules/communication/sequences/MusicalConductor.ts",
              lineRange: [1, 200],
              priority: 7,
              tags: ["sequences", "conductor", "core"],
            },
          ],
        },
        {
          keyword: "plugins",
          aliases: ["plugin", "extensions", "mounting"],
          description: "Plugin system documentation and development",
          category: "development",
          lastUpdated: Date.now(),
          resources: [
            {
              type: "documentation",
              title: "Plugin Development Guide",
              description:
                "Complete guide to developing MusicalConductor plugins",
              filePath: "docs/plugins/development.md",
              priority: 10,
              tags: ["plugins", "development", "guide"],
            },
            {
              type: "example",
              title: "Plugin Examples",
              description: "Example plugin implementations",
              filePath: "examples/plugins/",
              priority: 9,
              tags: ["plugins", "examples", "implementation"],
            },
            {
              type: "api",
              title: "Plugin Interface",
              description: "Plugin interface and mounting system",
              filePath:
                "modules/communication/sequences/plugins/PluginInterfaceFacade.ts",
              priority: 8,
              tags: ["plugins", "api", "interface"],
            },
          ],
        },
        {
          keyword: "events",
          aliases: ["event", "eventbus", "communication", "messaging"],
          description: "Event system and communication documentation",
          category: "architecture",
          lastUpdated: Date.now(),
          resources: [
            {
              type: "architecture",
              title: "Event System Architecture",
              description: "Detailed event bus and communication system design",
              filePath: "docs/architecture/event-system.md",
              priority: 10,
              tags: ["events", "architecture", "communication"],
            },
            {
              type: "code",
              title: "EventBus Implementation",
              description: "Core event bus implementation",
              filePath: "modules/communication/EventBus.ts",
              priority: 9,
              tags: ["events", "eventbus", "implementation"],
            },
            {
              type: "example",
              title: "Event Usage Examples",
              description: "Examples of event subscription and emission",
              filePath: "examples/events/",
              priority: 8,
              tags: ["events", "examples", "usage"],
            },
          ],
        },
        {
          keyword: "cli",
          aliases: ["command-line", "knowledge-cli", "shortcuts"],
          description: "CLI tools and knowledge management system",
          category: "development",
          lastUpdated: Date.now(),
          resources: [
            {
              type: "documentation",
              title: "CLI Documentation",
              description: "Complete CLI documentation and usage guide",
              filePath: "tools/cli/README.md",
              priority: 10,
              tags: ["cli", "documentation", "tools"],
            },
            {
              type: "code",
              title: "CLI Implementation",
              description: "Main CLI implementation with all commands",
              filePath: "tools/cli/knowledge-cli.ts",
              priority: 9,
              tags: ["cli", "implementation", "typescript"],
            },
            {
              type: "example",
              title: "CLI Demo",
              description: "Working demo of CLI functionality",
              filePath: "tools/cli/demo.ts",
              priority: 8,
              tags: ["cli", "demo", "examples"],
            },
          ],
        },
        {
          keyword: "onboarding",
          aliases: [
            "getting-started",
            "quickstart",
            "agent-guide",
            "new-agent",
          ],
          description: "Agent onboarding guide and getting started resources",
          category: "documentation",
          lastUpdated: Date.now(),
          resources: [
            {
              type: "guide",
              title: "Agent Onboarding Guide",
              description: "Complete step-by-step guide for new AI agents",
              filePath: "tools/cli/AGENT_ONBOARDING_GUIDE.md",
              priority: 10,
              tags: ["onboarding", "getting-started", "guide"],
            },
            {
              type: "documentation",
              title: "CLI Documentation",
              description: "Complete CLI documentation and usage guide",
              filePath: "tools/cli/README.md",
              priority: 9,
              tags: ["cli", "documentation", "reference"],
            },
            {
              type: "example",
              title: "CLI Demo",
              description: "Working demo of CLI functionality",
              filePath: "tools/cli/demo.ts",
              priority: 8,
              tags: ["cli", "demo", "examples"],
            },
          ],
        },
      ],
    };
  }

  // Public API methods
  public findShortcut(keyword: string): Shortcut | null {
    const normalizedKeyword = keyword.toLowerCase().trim();

    // Direct keyword match
    let shortcut = this.database.shortcuts.find(
      (s) => s.keyword.toLowerCase() === normalizedKeyword
    );

    // Alias match
    if (!shortcut) {
      shortcut = this.database.shortcuts.find((s) =>
        s.aliases.some((alias) => alias.toLowerCase() === normalizedKeyword)
      );
    }

    return shortcut || null;
  }

  public searchShortcuts(query: string): Shortcut[] {
    const normalizedQuery = query.toLowerCase().trim();
    const results: Array<{ shortcut: Shortcut; score: number }> = [];

    for (const shortcut of this.database.shortcuts) {
      let score = 0;

      // Exact keyword match (highest priority)
      if (shortcut.keyword.toLowerCase() === normalizedQuery) {
        score += 100;
      }

      // Exact alias match
      if (
        shortcut.aliases.some(
          (alias) => alias.toLowerCase() === normalizedQuery
        )
      ) {
        score += 90;
      }

      // Partial keyword match
      if (shortcut.keyword.toLowerCase().includes(normalizedQuery)) {
        score += 50;
      }

      // Partial alias match
      if (
        shortcut.aliases.some((alias) =>
          alias.toLowerCase().includes(normalizedQuery)
        )
      ) {
        score += 40;
      }

      // Description match
      if (shortcut.description.toLowerCase().includes(normalizedQuery)) {
        score += 30;
      }

      // Tag match
      const tagMatches = shortcut.resources.reduce((count, resource) => {
        return (
          count +
          resource.tags.filter((tag) =>
            tag.toLowerCase().includes(normalizedQuery)
          ).length
        );
      }, 0);
      score += tagMatches * 20;

      // Resource title/description match
      const resourceMatches = shortcut.resources.filter(
        (resource) =>
          resource.title.toLowerCase().includes(normalizedQuery) ||
          resource.description.toLowerCase().includes(normalizedQuery)
      );
      score += resourceMatches.length * 15;

      if (score > 0) {
        results.push({ shortcut, score });
      }
    }

    // Sort by score (descending) and return shortcuts
    return results
      .sort((a, b) => b.score - a.score)
      .map((result) => result.shortcut);
  }

  public getShortcutsByCategory(category: string): Shortcut[] {
    return this.database.shortcuts.filter(
      (s) => s.category.toLowerCase() === category.toLowerCase()
    );
  }

  public getAllCategories(): string[] {
    return [...this.database.categories];
  }

  public getAllShortcuts(): Shortcut[] {
    return [...this.database.shortcuts];
  }

  public addShortcut(shortcut: Omit<Shortcut, "lastUpdated">): void {
    const newShortcut: Shortcut = {
      ...shortcut,
      lastUpdated: Date.now(),
    };

    // Check for duplicate keywords
    const existing = this.findShortcut(shortcut.keyword);
    if (existing) {
      throw new Error(
        `Shortcut with keyword '${shortcut.keyword}' already exists`
      );
    }

    this.database.shortcuts.push(newShortcut);
    this.database.lastUpdated = Date.now();

    // Add category if it doesn't exist
    if (!this.database.categories.includes(shortcut.category)) {
      this.database.categories.push(shortcut.category);
    }

    this.saveDatabase();
    this.logger.success(`✅ Added shortcut: ${shortcut.keyword}`);
  }

  public updateShortcut(
    keyword: string,
    updates: Partial<Omit<Shortcut, "keyword" | "lastUpdated">>
  ): void {
    const shortcut = this.findShortcut(keyword);
    if (!shortcut) {
      throw new Error(`Shortcut '${keyword}' not found`);
    }

    Object.assign(shortcut, updates, { lastUpdated: Date.now() });
    this.database.lastUpdated = Date.now();
    this.saveDatabase();
    this.logger.success(`✅ Updated shortcut: ${keyword}`);
  }

  public removeShortcut(keyword: string): void {
    const index = this.database.shortcuts.findIndex(
      (s) =>
        s.keyword.toLowerCase() === keyword.toLowerCase() ||
        s.aliases.some((alias) => alias.toLowerCase() === keyword.toLowerCase())
    );

    if (index === -1) {
      throw new Error(`Shortcut '${keyword}' not found`);
    }

    const removed = this.database.shortcuts.splice(index, 1)[0];
    this.database.lastUpdated = Date.now();
    this.saveDatabase();
    this.logger.success(`✅ Removed shortcut: ${removed.keyword}`);
  }

  public displayShortcut(
    shortcut: Shortcut,
    showDetails: boolean = true
  ): void {
    this.logger.header(`${shortcut.keyword} (${shortcut.category})`);

    console.log(`📝 ${shortcut.description}`);

    if (shortcut.aliases.length > 0) {
      console.log(`🔗 Aliases: ${shortcut.aliases.join(", ")}`);
    }

    if (showDetails) {
      console.log(`\n📚 Resources (${shortcut.resources.length}):`);

      // Sort resources by priority (descending)
      const sortedResources = [...shortcut.resources].sort(
        (a, b) => b.priority - a.priority
      );

      sortedResources.forEach((resource, index) => {
        const icon = this.getResourceIcon(resource.type);
        console.log(
          `\n  ${index + 1}. ${icon} ${resource.title} (Priority: ${
            resource.priority
          })`
        );
        console.log(`     ${resource.description}`);

        if (resource.filePath) {
          const displayPath = resource.lineRange
            ? `${resource.filePath}:${resource.lineRange[0]}-${resource.lineRange[1]}`
            : resource.filePath;
          console.log(`     📁 ${displayPath}`);
        }

        if (resource.url) {
          console.log(`     🌐 ${resource.url}`);
        }

        if (resource.tags.length > 0) {
          console.log(`     🏷️  ${resource.tags.join(", ")}`);
        }
      });
    }

    console.log(
      `\n⏰ Last updated: ${new Date(shortcut.lastUpdated).toLocaleString()}`
    );
    console.log("");
  }

  private getResourceIcon(type: ShortcutResource["type"]): string {
    const icons = {
      documentation: "📖",
      code: "💻",
      example: "🔍",
      test: "🧪",
      architecture: "🏗️",
      api: "🔌",
      guide: "📋",
      reference: "📚",
    };
    return icons[type] || "📄";
  }

  public displaySearchResults(results: Shortcut[], query: string): void {
    if (results.length === 0) {
      this.logger.warn(`❌ No shortcuts found for: "${query}"`);
      this.logger.info(
        "💡 Try using different keywords or check available categories with: npm run knowledge -- shortcuts --list-categories"
      );
      return;
    }

    this.logger.header(
      `Search Results for "${query}" (${results.length} found)`
    );

    results.forEach((shortcut, index) => {
      console.log(
        `\n${index + 1}. 🔗 ${shortcut.keyword} (${shortcut.category})`
      );
      console.log(`   ${shortcut.description}`);
      console.log(`   📚 ${shortcut.resources.length} resources available`);
    });

    console.log(
      `\n💡 Use "npm run knowledge -- shortcut <keyword>" to see detailed resources`
    );
    console.log("");
  }
}
