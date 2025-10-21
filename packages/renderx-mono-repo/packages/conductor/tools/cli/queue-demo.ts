#!/usr/bin/env node

/**
 * Knowledge Transfer Queue Demo
 * Demonstrates the queue system for coordinating knowledge transfers between agents
 */

import { KnowledgeTransferQueue } from "./queue/KnowledgeTransferQueue";
import { CLILogger } from "./utils/CLILogger";

class QueueDemo {
  private queue: KnowledgeTransferQueue;
  private logger: CLILogger;

  constructor() {
    this.queue = new KnowledgeTransferQueue();
    this.logger = new CLILogger();
  }

  async runDemo(): Promise<void> {
    this.logger.header("🎼 Knowledge Transfer Queue Demo");

    console.log(
      "This demo shows how agents coordinate knowledge transfers using the queue system.\n"
    );

    // Simulate Agent A creating a transfer request
    console.log("📤 Agent A wants to share plugin knowledge with Agent B...");
    const transferId1 = this.queue.createTransfer(
      "agent-a-senior-dev",
      "agent-b-junior-dev",
      "demo-plugin-knowledge.json",
      {
        title: "Plugin Development Best Practices",
        description:
          "Comprehensive plugin development knowledge including patterns and examples",
        knowledgeType: ["plugins", "best-practices", "examples"],
        priority: "high",
        expiresIn: 24 * 60 * 60 * 1000, // 24 hours
      }
    );

    // Simulate Agent C creating another transfer
    console.log(
      "\n📤 Agent C wants to share testing knowledge with Agent A..."
    );
    const transferId2 = this.queue.createTransfer(
      "agent-c-test-expert",
      "agent-a-senior-dev",
      "demo-testing-knowledge.json",
      {
        title: "Advanced Testing Strategies",
        description:
          "Unit testing, integration testing, and test automation knowledge",
        knowledgeType: ["testing", "automation", "strategies"],
        priority: "normal",
      }
    );

    // Show queue status
    console.log("\n📊 Current Queue Status:");
    this.showQueueStatus();

    // Simulate Agent A sending the knowledge
    console.log("\n📤 Agent A sends the plugin knowledge...");
    this.queue.markAsSent(transferId1, "agent-a-senior-dev");

    // Simulate Agent B receiving it
    console.log("📥 Agent B receives the plugin knowledge...");
    this.queue.markAsReceived(transferId1, "agent-b-junior-dev");

    // Show Agent B's pending transfers
    console.log("\n👤 Agent B's current transfers:");
    this.showAgentTransfers("agent-b-junior-dev");

    // Simulate Agent B processing/consuming the knowledge
    console.log("\n🔄 Agent B processes and imports the knowledge...");
    this.queue.markAsConsumed(transferId1, "agent-b-junior-dev", {
      importedPlugins: 3,
      newBestPractices: 12,
      successfulImport: true,
    });

    // Simulate Agent C sending knowledge
    console.log("\n📤 Agent C sends testing knowledge...");
    this.queue.markAsSent(transferId2, "agent-c-test-expert");

    // Show final queue status
    console.log("\n📊 Final Queue Status:");
    this.showQueueStatus();

    // Show all transfers
    console.log("\n📋 All Transfers:");
    this.showAllTransfers();

    console.log(
      "\n✅ Demo completed! The queue system successfully coordinated knowledge transfers."
    );
    console.log("\n💡 Key Benefits:");
    console.log("   • Tracks sent/received/consumed states");
    console.log("   • Prevents lost transfers");
    console.log("   • Enables agent coordination");
    console.log("   • Provides transfer history");
    console.log("   • Supports priority and expiration");
  }

  private showQueueStatus(): void {
    const status = this.queue.getQueueStatus();
    console.log(`   📊 Total: ${status.totalTransfers}`);
    console.log(`   ⏳ Pending: ${status.pendingTransfers}`);
    console.log(`   🔄 Active: ${status.activeTransfers}`);
    console.log(`   ✅ Completed: ${status.completedTransfers}`);
    console.log(`   ❌ Failed: ${status.failedTransfers}`);
  }

  private showAgentTransfers(agentId: string): void {
    const transfers = this.queue.getTransfersForAgent(agentId);
    const status = this.queue.getAgentStatus(agentId);

    if (status) {
      console.log(
        `   📊 Status: ${status.isOnline ? "🟢 Online" : "🔴 Offline"}`
      );
      console.log(`   📥 Pending receives: ${status.pendingReceives}`);
      console.log(`   🔄 Pending consumes: ${status.pendingConsumes}`);
    }

    transfers.forEach((transfer, index) => {
      const stateIcon = this.getStateIcon(transfer.state);
      const role = transfer.fromAgentId === agentId ? "sender" : "receiver";
      console.log(
        `   ${index + 1}. ${stateIcon} ${transfer.metadata.title} (${role})`
      );
    });
  }

  private showAllTransfers(): void {
    // Get all transfers and deduplicate by transferId
    const allTransfers = new Map();

    // Collect all transfers from different states
    const states = [
      "consumed",
      "received",
      "sent",
      "pending",
      "failed",
      "expired",
    ];
    states.forEach((state) => {
      this.queue.getTransfersByState(state as any).forEach((transfer) => {
        allTransfers.set(transfer.transferId, transfer);
      });
    });

    // Convert to array and sort by update time (newest first)
    const transfers = Array.from(allTransfers.values()).sort(
      (a, b) => b.metadata.updatedAt - a.metadata.updatedAt
    );

    transfers.forEach((transfer, index) => {
      const stateIcon = this.getStateIcon(transfer.state);
      console.log(`   ${index + 1}. ${stateIcon} ${transfer.metadata.title}`);
      console.log(`      👤 ${transfer.fromAgentId} → ${transfer.toAgentId}`);
      console.log(`      🏷️  ${transfer.metadata.knowledgeType.join(", ")}`);
      console.log(`      ⏰ ${this.getTimeAgo(transfer.metadata.updatedAt)}`);
    });
  }

  private getStateIcon(state: string): string {
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

    const seconds = Math.floor(diff / 1000);
    if (seconds < 60) return "just now";

    const minutes = Math.floor(diff / (1000 * 60));
    if (minutes < 60) return `${minutes}m ago`;

    const hours = Math.floor(diff / (1000 * 60 * 60));
    return `${hours}h ago`;
  }
}

// Run demo if called directly
if (require.main === module) {
  const demo = new QueueDemo();
  demo.runDemo().catch(console.error);
}

export { QueueDemo };
