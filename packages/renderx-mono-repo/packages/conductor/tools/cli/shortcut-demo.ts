#!/usr/bin/env node

/**
 * Standalone Shortcut Demo CLI
 * Demonstrates the data-driven shortcut system without dependencies on other CLI components
 */

import { Command } from "commander";
import { ShortcutManager } from "./shortcuts/ShortcutManager";

class ShortcutDemoCLI {
  private program: Command;
  private shortcutManager: ShortcutManager;

  constructor() {
    this.program = new Command();
    this.shortcutManager = new ShortcutManager();
    this.setupCommands();
  }

  private setupCommands(): void {
    this.program
      .name("shortcut-demo")
      .description("Demo of data-driven shortcut system for MusicalConductor")
      .version("1.0.0");

    // Shortcut command - Quick access to documentation and resources
    this.program
      .command("shortcut <keyword>")
      .description("Quick access to documentation and resources by keyword")
      .option("--search", "Search for shortcuts instead of exact match")
      .option("--brief", "Show brief summary without detailed resources")
      .action(this.handleShortcut.bind(this));

    // Shortcuts management command
    this.program
      .command("shortcuts")
      .description("Manage documentation shortcuts")
      .option("--list", "List all available shortcuts")
      .option("--list-categories", "List all categories")
      .option("--category <category>", "Show shortcuts in specific category")
      .option("--search <query>", "Search shortcuts by query")
      .action(this.handleShortcuts.bind(this));
  }

  private async handleShortcut(keyword: string, options: any): Promise<void> {
    try {
      if (options.search) {
        // Search mode
        const results = this.shortcutManager.searchShortcuts(keyword);
        this.shortcutManager.displaySearchResults(results, keyword);
      } else {
        // Exact match mode
        const shortcut = this.shortcutManager.findShortcut(keyword);

        if (!shortcut) {
          console.log(`❌ Shortcut '${keyword}' not found`);

          // Suggest similar shortcuts
          const suggestions = this.shortcutManager.searchShortcuts(keyword);
          if (suggestions.length > 0) {
            console.log("\n💡 Did you mean one of these?");
            suggestions.slice(0, 3).forEach((s) => {
              console.log(`   - ${s.keyword}: ${s.description}`);
            });
          }

          console.log("\n🔍 Use --search flag to search for shortcuts");
          console.log(
            '📋 Use "npm run shortcut-demo -- shortcuts --list" to see all available shortcuts'
          );
          return;
        }

        this.shortcutManager.displayShortcut(shortcut, !options.brief);
      }
    } catch (error) {
      console.error("❌ Shortcut command failed:", error);
      process.exit(1);
    }
  }

  private async handleShortcuts(options: any): Promise<void> {
    try {
      if (options.listCategories) {
        const categories = this.shortcutManager.getAllCategories();
        console.log("\n🎼 Available Categories");
        console.log("======================");
        categories.forEach((category, index) => {
          const shortcuts =
            this.shortcutManager.getShortcutsByCategory(category);
          console.log(
            `${index + 1}. 📁 ${category} (${shortcuts.length} shortcuts)`
          );
        });
        console.log(
          "\n💡 Use --category <name> to see shortcuts in a specific category"
        );
      } else if (options.category) {
        const shortcuts = this.shortcutManager.getShortcutsByCategory(
          options.category
        );
        if (shortcuts.length === 0) {
          console.log(`❌ No shortcuts found in category: ${options.category}`);
          return;
        }

        console.log(
          `\n🎼 Shortcuts in "${options.category}" (${shortcuts.length})`
        );
        console.log("=".repeat(50));
        shortcuts.forEach((shortcut, index) => {
          console.log(`\n${index + 1}. 🔗 ${shortcut.keyword}`);
          console.log(`   ${shortcut.description}`);
          console.log(`   📚 ${shortcut.resources.length} resources`);
          if (shortcut.aliases.length > 0) {
            console.log(`   🏷️  Aliases: ${shortcut.aliases.join(", ")}`);
          }
        });
      } else if (options.search) {
        const results = this.shortcutManager.searchShortcuts(options.search);
        this.shortcutManager.displaySearchResults(results, options.search);
      } else if (options.list) {
        const shortcuts = this.shortcutManager.getAllShortcuts();
        console.log(`\n🎼 All Shortcuts (${shortcuts.length})`);
        console.log("=".repeat(30));

        // Group by category
        const categories = this.shortcutManager.getAllCategories();
        categories.forEach((category) => {
          const categoryShortcuts = shortcuts.filter(
            (s) => s.category === category
          );
          if (categoryShortcuts.length > 0) {
            console.log(`\n📁 ${category.toUpperCase()}`);
            categoryShortcuts.forEach((shortcut) => {
              console.log(
                `   🔗 ${shortcut.keyword} - ${shortcut.description}`
              );
              if (shortcut.aliases.length > 0) {
                console.log(`      Aliases: ${shortcut.aliases.join(", ")}`);
              }
            });
          }
        });

        console.log(
          '\n💡 Use "npm run shortcut-demo -- shortcut <keyword>" for detailed resources'
        );
      } else {
        // Default: show summary
        const shortcuts = this.shortcutManager.getAllShortcuts();
        const categories = this.shortcutManager.getAllCategories();

        console.log("\n🎼 Knowledge Shortcuts Summary");
        console.log("==============================");
        console.log(`📊 Total shortcuts: ${shortcuts.length}`);
        console.log(`📁 Categories: ${categories.length}`);

        console.log("\n📋 Quick Commands:");
        console.log(
          "   npm run shortcut-demo -- shortcut <keyword>     # Get resources for keyword"
        );
        console.log(
          "   npm run shortcut-demo -- shortcut <keyword> --search  # Search shortcuts"
        );
        console.log(
          "   npm run shortcut-demo -- shortcuts --list       # List all shortcuts"
        );
        console.log(
          "   npm run shortcut-demo -- shortcuts --list-categories  # List categories"
        );

        console.log("\n🔥 Popular shortcuts:");
        const popularKeywords = [
          "testing",
          "architecture",
          "sequences",
          "plugins",
          "events",
          "cli",
        ];
        popularKeywords.forEach((keyword) => {
          const shortcut = this.shortcutManager.findShortcut(keyword);
          if (shortcut) {
            console.log(`   🔗 ${keyword} - ${shortcut.description}`);
          }
        });
      }
    } catch (error) {
      console.error("❌ Shortcuts command failed:", error);
      process.exit(1);
    }
  }

  public run(): void {
    this.program.parse();
  }
}

// Main execution
if (require.main === module) {
  const cli = new ShortcutDemoCLI();
  cli.run();
}

export { ShortcutDemoCLI };
