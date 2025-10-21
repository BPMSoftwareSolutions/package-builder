#!/usr/bin/env node

/**
 * AI Knowledge Transfer CLI for MusicalConductor
 *
 * A comprehensive CLI tool for transferring knowledge between AI agents
 * working with the MusicalConductor system.
 *
 * Features:
 * - Export/import system state and configurations
 * - Transfer plugin knowledge and metadata
 * - Share event logs and performance metrics
 * - Merge knowledge from multiple agents
 * - Validate knowledge compatibility
 *
 * Usage:
 *   npm run knowledge -- export --type=all --output=knowledge.json
 *   npm run knowledge -- import --file=knowledge.json --merge
 *   npm run knowledge -- merge --files=agent1.json,agent2.json --output=merged.json
 */

import { Command } from "commander";
import * as fs from "fs";
import * as path from "path";
import { KnowledgeExporter } from "./exporters/KnowledgeExporter";
import { KnowledgeImporter } from "./importers/KnowledgeImporter";
import { KnowledgeMerger } from "./mergers/KnowledgeMerger";
import { KnowledgeValidator } from "./validators/KnowledgeValidator";
import { CLILogger } from "./utils/CLILogger";
import { ShortcutManager } from "./shortcuts/ShortcutManager";
import { KnowledgeTransferQueue } from "./queue/KnowledgeTransferQueue";

// Knowledge transfer data structures
export interface AgentKnowledge {
  metadata: {
    agentId: string;
    timestamp: number;
    version: string;
    musicalConductorVersion: string;
    exportType: "full" | "partial" | "incremental";
    description?: string;
  };
  systemState: {
    conductorStatistics: any;
    performanceMetrics: any;
    eventLogs: any[];
    queueState: any;
  };
  pluginKnowledge: {
    mountedPlugins: any[];
    pluginConfigurations: any[];
    pluginMetadata: any[];
    sequenceDefinitions: any[];
  };
  eventKnowledge: {
    eventSubscriptions: any[];
    eventHistory: any[];
    eventPatterns: any[];
    domainEvents: any[];
  };
  resourceKnowledge: {
    resourceOwnership: any[];
    resourceConflicts: any[];
    resourceDelegations: any[];
  };
  learningData: {
    successPatterns: any[];
    errorPatterns: any[];
    optimizationInsights: any[];
    bestPractices: string[];
  };
}

export interface KnowledgeTransferOptions {
  includeSystemState?: boolean;
  includePlugins?: boolean;
  includeEvents?: boolean;
  includeResources?: boolean;
  includeLearning?: boolean;
  includePerformanceData?: boolean;
  timeRange?: {
    start: number;
    end: number;
  };
  filterByPlugin?: string[];
  filterByEvent?: string[];
}

class KnowledgeCLI {
  private program: Command;
  private logger: CLILogger;
  private exporter: KnowledgeExporter;
  private importer: KnowledgeImporter;
  private merger: KnowledgeMerger;
  private validator: KnowledgeValidator;
  private shortcutManager: ShortcutManager;
  private transferQueue: KnowledgeTransferQueue;

  constructor() {
    this.program = new Command();
    this.logger = new CLILogger();
    this.exporter = new KnowledgeExporter();
    this.importer = new KnowledgeImporter();
    this.merger = new KnowledgeMerger();
    this.validator = new KnowledgeValidator();
    this.shortcutManager = new ShortcutManager();
    this.transferQueue = new KnowledgeTransferQueue();

    this.setupCommands();
  }

  private setupCommands(): void {
    this.program
      .name("knowledge-cli")
      .description("AI Knowledge Transfer CLI for MusicalConductor")
      .version("1.0.0");

    // Export command
    this.program
      .command("export")
      .description("Export knowledge from the current MusicalConductor system")
      .option(
        "-t, --type <type>",
        "Export type: all, system, plugins, events, resources, learning",
        "all"
      )
      .option(
        "-o, --output <file>",
        "Output file path",
        "knowledge-export.json"
      )
      .option(
        "--include-performance",
        "Include performance metrics and statistics"
      )
      .option(
        "--time-range <range>",
        'Time range for data (e.g., "1h", "1d", "1w")'
      )
      .option(
        "--filter-plugin <plugins>",
        "Filter by specific plugins (comma-separated)"
      )
      .option(
        "--filter-event <events>",
        "Filter by specific events (comma-separated)"
      )
      .option("--compress", "Compress the output file")
      .action(this.handleExport.bind(this));

    // Import command
    this.program
      .command("import")
      .description("Import knowledge into the current MusicalConductor system")
      .option(
        "-f, --file <file>",
        "Knowledge file to import",
        "knowledge-export.json"
      )
      .option("--merge", "Merge with existing knowledge instead of replacing")
      .option(
        "--validate-only",
        "Only validate the knowledge file without importing"
      )
      .option("--dry-run", "Show what would be imported without making changes")
      .option("--force", "Force import even if validation warnings exist")
      .option("--backup", "Create backup before importing")
      .action(this.handleImport.bind(this));

    // Merge command
    this.program
      .command("merge")
      .description("Merge knowledge from multiple agents")
      .option(
        "-f, --files <files>",
        "Comma-separated list of knowledge files to merge"
      )
      .option(
        "-o, --output <file>",
        "Output file for merged knowledge",
        "merged-knowledge.json"
      )
      .option(
        "--strategy <strategy>",
        "Merge strategy: latest, priority, consensus",
        "latest"
      )
      .option(
        "--resolve-conflicts",
        "Automatically resolve conflicts using the merge strategy"
      )
      .action(this.handleMerge.bind(this));

    // Validate command
    this.program
      .command("validate")
      .description("Validate knowledge file compatibility")
      .option(
        "-f, --file <file>",
        "Knowledge file to validate",
        "knowledge-export.json"
      )
      .option("--strict", "Use strict validation rules")
      .option("--report <file>", "Generate validation report file")
      .action(this.handleValidate.bind(this));

    // Status command
    this.program
      .command("status")
      .description("Show current system knowledge status")
      .option("--detailed", "Show detailed status information")
      .option("--json", "Output in JSON format")
      .action(this.handleStatus.bind(this));

    // Diff command
    this.program
      .command("diff")
      .description("Compare knowledge between two files or current system")
      .option("-a, --file-a <file>", "First knowledge file")
      .option(
        "-b, --file-b <file>",
        'Second knowledge file (or "current" for current system)'
      )
      .option("--format <format>", "Output format: text, json, html", "text")
      .action(this.handleDiff.bind(this));

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
      .option("--add <file>", "Add shortcuts from JSON file")
      .option("--export <file>", "Export shortcuts to JSON file")
      .action(this.handleShortcuts.bind(this));

    // Transfer queue commands
    this.program
      .command("queue")
      .description("Manage knowledge transfer queue")
      .option("--status", "Show queue status")
      .option("--list", "List all transfers")
      .option("--agent <agentId>", "Show transfers for specific agent")
      .option("--state <state>", "Filter by transfer state")
      .option("--create", "Create a new transfer request")
      .option("--sent <transferId>", "Mark transfer as sent")
      .option("--received <transferId>", "Mark transfer as received")
      .option("--consumed <transferId>", "Mark transfer as consumed")
      .option("--failed <transferId>", "Mark transfer as failed")
      .action(this.handleQueue.bind(this));
  }

  private async handleExport(options: any): Promise<void> {
    try {
      this.logger.info("🚀 Starting knowledge export...");

      const exportOptions: KnowledgeTransferOptions =
        this.parseExportOptions(options);
      const knowledge = await this.exporter.exportKnowledge(exportOptions);

      const outputPath = path.resolve(options.output);

      if (options.compress) {
        await this.writeCompressedFile(outputPath, knowledge);
      } else {
        await this.writeJsonFile(outputPath, knowledge);
      }

      this.logger.success(`✅ Knowledge exported to: ${outputPath}`);
      this.logger.info(
        `📊 Export summary: ${this.getExportSummary(knowledge)}`
      );
    } catch (error) {
      this.logger.error("❌ Export failed:", error);
      process.exit(1);
    }
  }

  private async handleImport(options: any): Promise<void> {
    try {
      this.logger.info("📥 Starting knowledge import...");

      const filePath = path.resolve(options.file);
      if (!fs.existsSync(filePath)) {
        throw new Error(`Knowledge file not found: ${filePath}`);
      }

      const knowledge = await this.readKnowledgeFile(filePath);

      // Validate before importing
      const validation = await this.validator.validate(knowledge);
      if (!validation.isValid && !options.force) {
        this.logger.error("❌ Validation failed:", validation.errors);
        if (validation.warnings.length > 0) {
          this.logger.warn("⚠️ Warnings:", validation.warnings);
        }
        process.exit(1);
      }

      if (options.validateOnly) {
        this.logger.success("✅ Knowledge file is valid");
        return;
      }

      if (options.dryRun) {
        const preview = await this.importer.previewImport(knowledge);
        this.logger.info("🔍 Import preview:", preview);
        return;
      }

      if (options.backup) {
        await this.createBackup();
      }

      const result = await this.importer.importKnowledge(knowledge, {
        merge: options.merge,
        force: options.force,
      });

      this.logger.success("✅ Knowledge imported successfully");
      this.logger.info(`📊 Import summary: ${this.getImportSummary(result)}`);
    } catch (error) {
      this.logger.error("❌ Import failed:", error);
      process.exit(1);
    }
  }

  private async handleMerge(options: any): Promise<void> {
    try {
      this.logger.info("🔄 Starting knowledge merge...");

      const files = options.files.split(",").map((f: string) => f.trim());
      const knowledgeFiles = await Promise.all(
        files.map((file: string) => this.readKnowledgeFile(path.resolve(file)))
      );

      const mergedKnowledge = await this.merger.merge(knowledgeFiles, {
        strategy: options.strategy,
        resolveConflicts: options.resolveConflicts,
      });

      const outputPath = path.resolve(options.output);
      await this.writeJsonFile(outputPath, mergedKnowledge);

      this.logger.success(`✅ Knowledge merged and saved to: ${outputPath}`);
    } catch (error) {
      this.logger.error("❌ Merge failed:", error);
      process.exit(1);
    }
  }

  private async handleValidate(options: any): Promise<void> {
    try {
      this.logger.info("🔍 Validating knowledge file...");

      const filePath = path.resolve(options.file);
      const knowledge = await this.readKnowledgeFile(filePath);

      const validation = await this.validator.validate(knowledge, {
        strict: options.strict,
      });

      if (validation.isValid) {
        this.logger.success("✅ Knowledge file is valid");
      } else {
        this.logger.error("❌ Validation failed:", validation.errors);
      }

      if (validation.warnings.length > 0) {
        this.logger.warn("⚠️ Warnings:", validation.warnings);
      }

      if (options.report) {
        await this.writeJsonFile(path.resolve(options.report), validation);
        this.logger.info(`📄 Validation report saved to: ${options.report}`);
      }
    } catch (error) {
      this.logger.error("❌ Validation failed:", error);
      process.exit(1);
    }
  }

  private async handleStatus(options: any): Promise<void> {
    try {
      const status = await this.exporter.getSystemStatus();

      if (options.json) {
        console.log(JSON.stringify(status, null, 2));
      } else {
        this.displayStatus(status, options.detailed);
      }
    } catch (error) {
      this.logger.error("❌ Failed to get status:", error);
      process.exit(1);
    }
  }

  private async handleDiff(options: any): Promise<void> {
    try {
      this.logger.info("🔍 Comparing knowledge...");

      const knowledgeA = await this.readKnowledgeFile(
        path.resolve(options.fileA)
      );
      let knowledgeB;

      if (options.fileB === "current") {
        knowledgeB = await this.exporter.exportKnowledge({});
      } else {
        knowledgeB = await this.readKnowledgeFile(path.resolve(options.fileB));
      }

      const diff = await this.merger.diff(knowledgeA, knowledgeB);

      if (options.format === "json") {
        console.log(JSON.stringify(diff, null, 2));
      } else {
        this.displayDiff(diff);
      }
    } catch (error) {
      this.logger.error("❌ Diff failed:", error);
      process.exit(1);
    }
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
          this.logger.warn(`❌ Shortcut '${keyword}' not found`);

          // Suggest similar shortcuts
          const suggestions = this.shortcutManager.searchShortcuts(keyword);
          if (suggestions.length > 0) {
            this.logger.info("\n💡 Did you mean one of these?");
            suggestions.slice(0, 3).forEach((s) => {
              console.log(`   - ${s.keyword}: ${s.description}`);
            });
          }

          this.logger.info("\n🔍 Use --search flag to search for shortcuts");
          this.logger.info(
            '📋 Use "npm run knowledge -- shortcuts --list" to see all available shortcuts'
          );
          return;
        }

        this.shortcutManager.displayShortcut(shortcut, !options.brief);
      }
    } catch (error) {
      this.logger.error("❌ Shortcut command failed:", error);
      process.exit(1);
    }
  }

  private async handleShortcuts(options: any): Promise<void> {
    try {
      if (options.listCategories) {
        const categories = this.shortcutManager.getAllCategories();
        this.logger.header("Available Categories");
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
          this.logger.warn(
            `❌ No shortcuts found in category: ${options.category}`
          );
          return;
        }

        this.logger.header(
          `Shortcuts in "${options.category}" (${shortcuts.length})`
        );
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
        this.logger.header(`All Shortcuts (${shortcuts.length})`);

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
          '\n💡 Use "npm run knowledge -- shortcut <keyword>" for detailed resources'
        );
      } else if (options.export) {
        const shortcuts = this.shortcutManager.getAllShortcuts();
        const exportData = {
          version: "1.0.0",
          exportedAt: new Date().toISOString(),
          shortcuts: shortcuts,
        };

        await this.writeJsonFile(path.resolve(options.export), exportData);
        this.logger.success(`✅ Shortcuts exported to: ${options.export}`);
      } else if (options.add) {
        // This would allow importing shortcuts from a file
        this.logger.info("📥 Import shortcuts functionality - coming soon!");
        this.logger.info(
          "💡 For now, shortcuts can be added by editing tools/cli/data/shortcuts.json"
        );
      } else {
        // Default: show summary
        const shortcuts = this.shortcutManager.getAllShortcuts();
        const categories = this.shortcutManager.getAllCategories();

        this.logger.header("Knowledge Shortcuts Summary");
        console.log(`📊 Total shortcuts: ${shortcuts.length}`);
        console.log(`📁 Categories: ${categories.length}`);

        console.log("\n📋 Quick Commands:");
        console.log(
          "   npm run knowledge -- shortcut <keyword>     # Get resources for keyword"
        );
        console.log(
          "   npm run knowledge -- shortcut <keyword> --search  # Search shortcuts"
        );
        console.log(
          "   npm run knowledge -- shortcuts --list       # List all shortcuts"
        );
        console.log(
          "   npm run knowledge -- shortcuts --list-categories  # List categories"
        );

        console.log("\n🔥 Popular shortcuts:");
        const popularKeywords = [
          "testing",
          "architecture",
          "sequences",
          "plugins",
        ];
        popularKeywords.forEach((keyword) => {
          const shortcut = this.shortcutManager.findShortcut(keyword);
          if (shortcut) {
            console.log(`   🔗 ${keyword} - ${shortcut.description}`);
          }
        });
      }
    } catch (error) {
      this.logger.error("❌ Shortcuts command failed:", error);
      process.exit(1);
    }
  }

  private async handleQueue(options: any): Promise<void> {
    try {
      if (options.consumed) {
        // Handle consumed command
        const transferId = options.consumed;
        const agentId = this.getCurrentAgentId(options);

        try {
          const success = this.transferQueue.markAsConsumed(
            transferId,
            agentId
          );
          if (success) {
            console.log(
              `✅ Transfer ${transferId} marked as consumed by ${agentId}`
            );
          } else {
            console.log(`❌ Failed to mark transfer ${transferId} as consumed`);
            console.log(
              `💡 Check that the transfer exists and you have permission to consume it`
            );
          }
        } catch (error) {
          console.log(
            `❌ Error marking transfer as consumed: ${
              error instanceof Error ? error.message : String(error)
            }`
          );
        }
      } else if (options.sent) {
        // Handle sent command
        const transferId = options.sent;
        const agentId = this.getCurrentAgentId(options);

        try {
          const success = this.transferQueue.markAsSent(transferId, agentId);
          if (success) {
            console.log(
              `✅ Transfer ${transferId} marked as sent by ${agentId}`
            );
          } else {
            console.log(`❌ Failed to mark transfer ${transferId} as sent`);
          }
        } catch (error) {
          console.log(
            `❌ Error marking transfer as sent: ${
              error instanceof Error ? error.message : String(error)
            }`
          );
        }
      } else if (options.received) {
        // Handle received command
        const transferId = options.received;
        const agentId = this.getCurrentAgentId(options);

        try {
          const success = this.transferQueue.markAsReceived(
            transferId,
            agentId
          );
          if (success) {
            console.log(
              `✅ Transfer ${transferId} marked as received by ${agentId}`
            );
          } else {
            console.log(`❌ Failed to mark transfer ${transferId} as received`);
          }
        } catch (error) {
          console.log(
            `❌ Error marking transfer as received: ${
              error instanceof Error ? error.message : String(error)
            }`
          );
        }
      } else if (options.failed) {
        // Handle failed command
        const transferId = options.failed;
        const agentId = this.getCurrentAgentId(options);

        try {
          const success = this.transferQueue.markAsFailed(
            transferId,
            agentId,
            "Marked as failed via CLI"
          );
          if (success) {
            console.log(
              `✅ Transfer ${transferId} marked as failed by ${agentId}`
            );
          } else {
            console.log(`❌ Failed to mark transfer ${transferId} as failed`);
          }
        } catch (error) {
          console.log(
            `❌ Error marking transfer as failed: ${
              error instanceof Error ? error.message : String(error)
            }`
          );
        }
      } else if (options.create) {
        // Handle create command
        console.log("🎼 Knowledge Transfer Creation Guide");
        console.log("═══════════════════════════════════════");
        console.log("\n📋 Steps to create a knowledge transfer:");
        console.log("\n1. Create your knowledge file (JSON format):");
        console.log("   cat > my-knowledge.json << 'EOF'");
        console.log("   {");
        console.log('     "knowledgeTransfer": {');
        console.log('       "version": "1.0.0",');
        console.log('       "fromAgent": "your-agent-id",');
        console.log('       "toAgent": "target-agent-id",');
        console.log('       "priority": "high"');
        console.log("     },");
        console.log('     "content": { /* your knowledge here */ }');
        console.log("   }");
        console.log("   EOF");
        console.log("\n2. Create the transfer:");
        console.log('   node -r ts-node/register -e "');
        console.log(
          "   const { KnowledgeTransferQueue } = require('./tools/cli/queue/KnowledgeTransferQueue.ts');"
        );
        console.log("   const queue = new KnowledgeTransferQueue();");
        console.log("   const transferId = queue.createTransfer(");
        console.log("     'from-agent', 'to-agent', 'my-knowledge.json',");
        console.log(
          "     { title: 'Title', description: 'Description', knowledgeType: ['type'] }"
        );
        console.log("   );");
        console.log("   console.log('Transfer created:', transferId);");
        console.log("   queue.markAsSent(transferId, 'from-agent');");
        console.log('   "');
        console.log("\n3. Verify creation:");
        console.log("   npm run queue -- --status");
      } else if (options.status) {
        const status = this.transferQueue.getQueueStatus();
        const agents = this.transferQueue.getAllAgentStatuses();

        this.logger.header("Knowledge Transfer Queue Status");
        console.log(`📊 Total transfers: ${status.totalTransfers}`);
        console.log(`⏳ Pending: ${status.pendingTransfers}`);
        console.log(`🔄 Active: ${status.activeTransfers}`);
        console.log(`✅ Completed: ${status.completedTransfers}`);
        console.log(`❌ Failed: ${status.failedTransfers}`);
        console.log(`⏰ Expired: ${status.expiredTransfers}`);

        if (agents.length > 0) {
          console.log(`\n👥 Active Agents (${agents.length}):`);
          agents.slice(0, 5).forEach((agent) => {
            const onlineStatus = agent.isOnline ? "🟢" : "🔴";
            console.log(
              `   ${onlineStatus} ${agent.agentId} - ${agent.totalTransfers} transfers`
            );
          });
        }

        // Show actionable next steps for current agent
        this.showNextStepsForCurrentAgent();
      } else if (options.list) {
        const transfers = options.state
          ? this.transferQueue.getTransfersByState(options.state as any)
          : this.transferQueue.getAllTransfers();

        this.logger.header(`Transfer Queue (${transfers.length} transfers)`);

        if (transfers.length === 0) {
          console.log("📭 No transfers found");
          return;
        }

        transfers.slice(0, 10).forEach((transfer, index) => {
          const stateIcon = this.getTransferStateIcon(transfer.state);
          const timeAgo = this.getTimeAgo(transfer.metadata.updatedAt);

          console.log(`\n${index + 1}. ${stateIcon} ${transfer.transferId}`);
          console.log(`   📝 ${transfer.metadata.title}`);
          console.log(`   👤 ${transfer.fromAgentId} → ${transfer.toAgentId}`);
          console.log(`   ⏰ ${timeAgo}`);
          console.log(`   🏷️  ${transfer.metadata.knowledgeType.join(", ")}`);
        });

        if (transfers.length > 10) {
          console.log(`\n... and ${transfers.length - 10} more transfers`);
        }
      } else if (options.agent) {
        const transfers = this.transferQueue.getTransfersForAgent(
          options.agent
        );
        const agentStatus = this.transferQueue.getAgentStatus(options.agent);

        this.logger.header(`Transfers for Agent: ${options.agent}`);

        if (agentStatus) {
          const onlineStatus = agentStatus.isOnline
            ? "🟢 Online"
            : "🔴 Offline";
          console.log(`📊 Status: ${onlineStatus}`);
          console.log(`📥 Pending receives: ${agentStatus.pendingReceives}`);
          console.log(`🔄 Pending consumes: ${agentStatus.pendingConsumes}`);
          console.log(`📈 Total transfers: ${agentStatus.totalTransfers}`);
        }

        if (transfers.length > 0) {
          console.log(`\n📋 Recent Transfers (${transfers.length}):`);
          transfers.slice(0, 5).forEach((transfer, index) => {
            const stateIcon = this.getTransferStateIcon(transfer.state);
            const role =
              transfer.fromAgentId === options.agent ? "sender" : "receiver";
            const otherAgent =
              transfer.fromAgentId === options.agent
                ? transfer.toAgentId
                : transfer.fromAgentId;

            console.log(
              `\n${index + 1}. ${stateIcon} ${transfer.transferId} (${role})`
            );
            console.log(`   📝 ${transfer.metadata.title}`);
            console.log(`   👤 ${role === "sender" ? "→" : "←"} ${otherAgent}`);
            console.log(
              `   ⏰ ${this.getTimeAgo(transfer.metadata.updatedAt)}`
            );
          });
        } else {
          console.log("\n📭 No transfers found for this agent");
        }
      } else {
        // Default: show summary
        const status = this.transferQueue.getQueueStatus();

        this.logger.header("Knowledge Transfer Queue");
        console.log(
          `📊 Queue Status: ${status.activeTransfers} active, ${status.pendingTransfers} pending`
        );

        console.log("\n📋 Quick Commands:");
        console.log(
          "   npm run knowledge -- queue --status           # Show detailed status"
        );
        console.log(
          "   npm run knowledge -- queue --list             # List all transfers"
        );
        console.log(
          "   npm run knowledge -- queue --agent <id>       # Show agent transfers"
        );
        console.log(
          "   npm run knowledge -- queue --state pending    # Filter by state"
        );

        console.log("\n🔄 Transfer States:");
        console.log("   pending → sent → received → consumed ✅");
        console.log("   Any state can go to → failed ❌ or expired ⏰");
      }
    } catch (error) {
      this.logger.error("❌ Queue command failed:", error);
      process.exit(1);
    }
  }

  private getTransferStateIcon(state: string): string {
    const icons = {
      pending: "⏳",
      sent: "📤",
      received: "📥",
      consumed: "✅",
      failed: "❌",
      expired: "⏰",
    };
    return icons[state as keyof typeof icons] || "❓";
  }

  private getTimeAgo(timestamp: number): string {
    const now = Date.now();
    const diff = now - timestamp;

    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return "just now";
  }

  private getCurrentAgentId(options: any): string {
    // Try to get agent ID from options first
    if (options.agent) {
      return options.agent;
    }

    // Try to get from environment variable
    if (process.env.AGENT_ID) {
      return process.env.AGENT_ID;
    }

    // Default fallback - could be improved with better agent detection
    return "current-agent";
  }

  private showNextStepsForCurrentAgent(): void {
    // Get all transfers that might be relevant to any agent
    const allTransfers = this.transferQueue.getAllTransfers();
    const sentTransfers = allTransfers.filter((t) => t.state === "sent");
    const receivedTransfers = allTransfers.filter(
      (t) => t.state === "received"
    );

    if (sentTransfers.length === 0 && receivedTransfers.length === 0) {
      return; // No actionable transfers
    }

    console.log(`\n🎯 Next Steps for Agent:`);
    console.log(`══════════════════════════`);

    // Show transfers waiting to be received
    if (sentTransfers.length > 0) {
      console.log(
        `\n📥 Available Knowledge Transfers (${sentTransfers.length}):`
      );
      sentTransfers.slice(0, 3).forEach((transfer, index) => {
        const timeRemaining =
          (transfer.metadata.expiresAt || Date.now() + 3600000) - Date.now();
        const hoursRemaining = Math.floor(timeRemaining / (1000 * 60 * 60));

        console.log(`\n${index + 1}. 📤 ${transfer.metadata.title}`);
        console.log(`   📝 ${transfer.metadata.description}`);
        console.log(`   🏷️  ${transfer.metadata.knowledgeType.join(", ")}`);
        console.log(`   ⏰ Expires in: ${hoursRemaining}h`);
        console.log(`   📁 Knowledge file: ${transfer.knowledgeFile}`);
        console.log(`
   🚀 To receive this knowledge:`);
        console.log(`      npm run queue -- --received ${transfer.transferId}`);
      });
    }

    // Show transfers that have been received but not consumed
    if (receivedTransfers.length > 0) {
      console.log(
        `\n📋 Received Transfers Ready for Action (${receivedTransfers.length}):`
      );
      receivedTransfers.slice(0, 3).forEach((transfer, index) => {
        console.log(`\n${index + 1}. 📥 ${transfer.metadata.title}`);
        console.log(`   📁 Knowledge file: ${transfer.knowledgeFile}`);
        console.log(`
   ✅ To mark as consumed after completing the work:`);
        console.log(`      npm run queue -- --consumed ${transfer.transferId}`);
      });
    }

    // Show general guidance
    console.log(`\n💡 Quick Commands:`);
    console.log(
      `   cat ${
        sentTransfers[0]?.knowledgeFile || "knowledge-file.json"
      }                    # Read knowledge content`
    );
    console.log(
      `   npm run queue -- --agent <your-agent-id>     # See your specific transfers`
    );
    console.log(
      `   npm run queue -- --list                     # See all transfers`
    );
  }

  // Helper methods
  private parseExportOptions(options: any): KnowledgeTransferOptions {
    const exportOptions: KnowledgeTransferOptions = {};

    // Parse export type
    const type = options.type.toLowerCase();
    if (type === "all") {
      exportOptions.includeSystemState = true;
      exportOptions.includePlugins = true;
      exportOptions.includeEvents = true;
      exportOptions.includeResources = true;
      exportOptions.includeLearning = true;
      exportOptions.includePerformanceData = options.includePerformance;
    } else {
      exportOptions.includeSystemState = type.includes("system");
      exportOptions.includePlugins = type.includes("plugins");
      exportOptions.includeEvents = type.includes("events");
      exportOptions.includeResources = type.includes("resources");
      exportOptions.includeLearning = type.includes("learning");
      exportOptions.includePerformanceData = options.includePerformance;
    }

    // Parse time range
    if (options.timeRange) {
      const timeRange = this.parseTimeRange(options.timeRange);
      exportOptions.timeRange = timeRange;
    }

    // Parse filters
    if (options.filterPlugin) {
      exportOptions.filterByPlugin = options.filterPlugin
        .split(",")
        .map((p: string) => p.trim());
    }

    if (options.filterEvent) {
      exportOptions.filterByEvent = options.filterEvent
        .split(",")
        .map((e: string) => e.trim());
    }

    return exportOptions;
  }

  private parseTimeRange(timeRangeStr: string): { start: number; end: number } {
    const now = Date.now();
    const match = timeRangeStr.match(/^(\d+)([hdw])$/);

    if (!match) {
      throw new Error(
        `Invalid time range format: ${timeRangeStr}. Use format like "1h", "2d", "1w"`
      );
    }

    const value = parseInt(match[1]);
    const unit = match[2];

    let milliseconds = 0;
    switch (unit) {
      case "h":
        milliseconds = value * 60 * 60 * 1000;
        break;
      case "d":
        milliseconds = value * 24 * 60 * 60 * 1000;
        break;
      case "w":
        milliseconds = value * 7 * 24 * 60 * 60 * 1000;
        break;
    }

    return {
      start: now - milliseconds,
      end: now,
    };
  }

  private async writeJsonFile(filePath: string, data: any): Promise<void> {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  }

  private async writeCompressedFile(
    filePath: string,
    data: any
  ): Promise<void> {
    // For now, just write as JSON. In the future, could add compression
    await this.writeJsonFile(filePath, data);
  }

  private async readKnowledgeFile(filePath: string): Promise<AgentKnowledge> {
    const content = fs.readFileSync(filePath, "utf8");
    return JSON.parse(content);
  }

  private getExportSummary(knowledge: AgentKnowledge): string {
    const parts = [];

    if (knowledge.systemState) {
      parts.push(
        `System state: ${Object.keys(knowledge.systemState).length} components`
      );
    }

    if (knowledge.pluginKnowledge) {
      const pluginCount = knowledge.pluginKnowledge.mountedPlugins?.length || 0;
      parts.push(`Plugins: ${pluginCount} mounted`);
    }

    if (knowledge.eventKnowledge) {
      const eventCount = knowledge.eventKnowledge.eventHistory?.length || 0;
      parts.push(`Events: ${eventCount} recorded`);
    }

    if (knowledge.learningData) {
      const insightCount =
        knowledge.learningData.optimizationInsights?.length || 0;
      parts.push(`Learning: ${insightCount} insights`);
    }

    return parts.join(", ");
  }

  private getImportSummary(result: any): string {
    return `Imported ${result.imported || 0} items, ${
      result.merged || 0
    } merged, ${result.skipped || 0} skipped`;
  }

  private async createBackup(): Promise<void> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const backupPath = `knowledge-backup-${timestamp}.json`;

    this.logger.info(`📦 Creating backup: ${backupPath}`);

    const currentKnowledge = await this.exporter.exportKnowledge({
      includeSystemState: true,
      includePlugins: true,
      includeEvents: true,
      includeResources: true,
      includeLearning: true,
    });

    await this.writeJsonFile(backupPath, currentKnowledge);
    this.logger.success(`✅ Backup created: ${backupPath}`);
  }

  private displayStatus(status: any, detailed: boolean): void {
    console.log("\n🎼 MusicalConductor Knowledge Status");
    console.log("=====================================");

    if (status.conductor) {
      console.log(`\n🎯 Conductor Status:`);
      console.log(`  - Active: ${status.conductor.active ? "✅" : "❌"}`);
      console.log(`  - Sequences: ${status.conductor.sequences || 0}`);
      console.log(`  - Plugins: ${status.conductor.plugins || 0}`);
      console.log(`  - Queue Length: ${status.conductor.queueLength || 0}`);
    }

    if (status.performance && detailed) {
      console.log(`\n📊 Performance Metrics:`);
      console.log(
        `  - Total Executions: ${status.performance.totalExecutions || 0}`
      );
      console.log(`  - Average Time: ${status.performance.averageTime || 0}ms`);
      console.log(`  - Success Rate: ${status.performance.successRate || 0}%`);
    }

    if (status.events && detailed) {
      console.log(`\n📡 Event System:`);
      console.log(`  - Subscriptions: ${status.events.subscriptions || 0}`);
      console.log(`  - Events Emitted: ${status.events.emitted || 0}`);
    }

    console.log("");
  }

  private displayDiff(diff: any): void {
    console.log("\n🔍 Knowledge Comparison");
    console.log("=======================");

    if (diff.metadata) {
      console.log(`\n📋 Metadata Changes:`);
      Object.entries(diff.metadata).forEach(([key, value]) => {
        console.log(`  ${key}: ${JSON.stringify(value)}`);
      });
    }

    if (diff.added?.length > 0) {
      console.log(`\n➕ Added (${diff.added.length}):`);
      diff.added.forEach((item: any) => {
        console.log(`  + ${item.type}: ${item.name || item.id}`);
      });
    }

    if (diff.removed?.length > 0) {
      console.log(`\n➖ Removed (${diff.removed.length}):`);
      diff.removed.forEach((item: any) => {
        console.log(`  - ${item.type}: ${item.name || item.id}`);
      });
    }

    if (diff.modified?.length > 0) {
      console.log(`\n🔄 Modified (${diff.modified.length}):`);
      diff.modified.forEach((item: any) => {
        console.log(`  ~ ${item.type}: ${item.name || item.id}`);
      });
    }

    console.log("");
  }

  public run(): void {
    this.program.parse();
  }
}

// Main execution
if (require.main === module) {
  const cli = new KnowledgeCLI();
  cli.run();
}

export { KnowledgeCLI };
