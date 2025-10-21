/**
 * KnowledgeTransferQueue - Manages knowledge transfer coordination between AI agents
 * Provides sent/received/consumed state tracking and agent coordination
 */

import * as fs from "fs";
import * as path from "path";
import { CLILogger } from "../utils/CLILogger";
import { AgentKnowledge } from "../knowledge-cli";

export type TransferState =
  | "pending"
  | "sent"
  | "received"
  | "consumed"
  | "failed"
  | "expired";
export type TransferPriority = "low" | "normal" | "high" | "urgent";

export interface KnowledgeTransferRequest {
  transferId: string;
  fromAgentId: string;
  toAgentId: string;
  knowledgeFile: string;
  priority: TransferPriority;
  state: TransferState;
  metadata: {
    title: string;
    description: string;
    knowledgeType: string[];
    estimatedSize: number;
    createdAt: number;
    updatedAt: number;
    expiresAt?: number;
  };
  progress: {
    sent: boolean;
    received: boolean;
    consumed: boolean;
    validated: boolean;
  };
  history: TransferHistoryEntry[];
}

export interface TransferHistoryEntry {
  timestamp: number;
  state: TransferState;
  agentId: string;
  message: string;
  details?: any;
}

export interface QueueStatus {
  totalTransfers: number;
  pendingTransfers: number;
  activeTransfers: number;
  completedTransfers: number;
  failedTransfers: number;
  expiredTransfers: number;
}

export interface AgentStatus {
  agentId: string;
  lastSeen: number;
  isOnline: boolean;
  pendingReceives: number;
  pendingConsumes: number;
  totalTransfers: number;
}

export class KnowledgeTransferQueue {
  private logger: CLILogger;
  private queuePath: string;
  private transfers: Map<string, KnowledgeTransferRequest> = new Map();
  private agents: Map<string, AgentStatus> = new Map();

  constructor() {
    this.logger = new CLILogger();
    this.queuePath = path.join(__dirname, "../data/transfer-queue.json");
    this.loadQueue();

    // Auto-cleanup expired transfers every 5 minutes (only in production)
    if (process.env.NODE_ENV === "production") {
      setInterval(() => this.cleanupExpiredTransfers(), 5 * 60 * 1000);
    }
  }

  /**
   * Create a new knowledge transfer request
   */
  public createTransfer(
    fromAgentId: string,
    toAgentId: string,
    knowledgeFile: string,
    options: {
      title: string;
      description: string;
      knowledgeType: string[];
      priority?: TransferPriority;
      expiresIn?: number; // milliseconds
    }
  ): string {
    const transferId = this.generateTransferId();
    const now = Date.now();

    const transfer: KnowledgeTransferRequest = {
      transferId,
      fromAgentId,
      toAgentId,
      knowledgeFile,
      priority: options.priority || "normal",
      state: "pending",
      metadata: {
        title: options.title,
        description: options.description,
        knowledgeType: options.knowledgeType,
        estimatedSize: this.getFileSize(knowledgeFile),
        createdAt: now,
        updatedAt: now,
        expiresAt: options.expiresIn ? now + options.expiresIn : undefined,
      },
      progress: {
        sent: false,
        received: false,
        consumed: false,
        validated: false,
      },
      history: [
        {
          timestamp: now,
          state: "pending",
          agentId: fromAgentId,
          message: "Transfer request created",
        },
      ],
    };

    this.transfers.set(transferId, transfer);
    this.updateAgentStatus(fromAgentId);
    this.saveQueue();

    this.logger.success(
      `✅ Created transfer ${transferId}: ${fromAgentId} → ${toAgentId}`
    );
    return transferId;
  }

  /**
   * Mark transfer as sent by the sending agent
   */
  public markAsSent(transferId: string, agentId: string): boolean {
    const transfer = this.transfers.get(transferId);
    if (!transfer || transfer.fromAgentId !== agentId) {
      return false;
    }

    transfer.state = "sent";
    transfer.progress.sent = true;
    transfer.metadata.updatedAt = Date.now();
    transfer.history.push({
      timestamp: Date.now(),
      state: "sent",
      agentId,
      message: "Knowledge file sent",
    });

    this.updateAgentStatus(agentId);
    this.saveQueue();

    this.logger.info(`📤 Transfer ${transferId} marked as sent by ${agentId}`);
    return true;
  }

  /**
   * Mark transfer as received by the receiving agent
   */
  public markAsReceived(transferId: string, agentId: string): boolean {
    const transfer = this.transfers.get(transferId);
    if (!transfer || transfer.toAgentId !== agentId) {
      return false;
    }

    transfer.state = "received";
    transfer.progress.received = true;
    transfer.metadata.updatedAt = Date.now();
    transfer.history.push({
      timestamp: Date.now(),
      state: "received",
      agentId,
      message: "Knowledge file received",
    });

    this.updateAgentStatus(agentId);
    this.saveQueue();

    this.logger.info(
      `📥 Transfer ${transferId} marked as received by ${agentId}`
    );
    return true;
  }

  /**
   * Mark transfer as consumed (processed/imported) by the receiving agent
   */
  public markAsConsumed(
    transferId: string,
    agentId: string,
    details?: any
  ): boolean {
    const transfer = this.transfers.get(transferId);
    if (!transfer || transfer.toAgentId !== agentId) {
      return false;
    }

    transfer.state = "consumed";
    transfer.progress.consumed = true;
    transfer.metadata.updatedAt = Date.now();
    transfer.history.push({
      timestamp: Date.now(),
      state: "consumed",
      agentId,
      message: "Knowledge successfully imported and processed",
      details,
    });

    this.updateAgentStatus(agentId);
    this.saveQueue();

    this.logger.success(
      `✅ Transfer ${transferId} marked as consumed by ${agentId}`
    );
    return true;
  }

  /**
   * Mark transfer as failed
   */
  public markAsFailed(
    transferId: string,
    agentId: string,
    reason: string
  ): boolean {
    const transfer = this.transfers.get(transferId);
    if (!transfer) {
      return false;
    }

    transfer.state = "failed";
    transfer.metadata.updatedAt = Date.now();
    transfer.history.push({
      timestamp: Date.now(),
      state: "failed",
      agentId,
      message: `Transfer failed: ${reason}`,
    });

    this.updateAgentStatus(agentId);
    this.saveQueue();

    this.logger.error(
      `❌ Transfer ${transferId} marked as failed by ${agentId}: ${reason}`
    );
    return true;
  }

  /**
   * Get transfers for a specific agent
   */
  public getTransfersForAgent(
    agentId: string,
    role: "sender" | "receiver" | "both" = "both"
  ): KnowledgeTransferRequest[] {
    const transfers = Array.from(this.transfers.values());

    return transfers
      .filter((transfer) => {
        if (role === "sender") return transfer.fromAgentId === agentId;
        if (role === "receiver") return transfer.toAgentId === agentId;
        return (
          transfer.fromAgentId === agentId || transfer.toAgentId === agentId
        );
      })
      .sort((a, b) => b.metadata.updatedAt - a.metadata.updatedAt);
  }

  /**
   * Get transfers by state
   */
  public getTransfersByState(state: TransferState): KnowledgeTransferRequest[] {
    return Array.from(this.transfers.values())
      .filter((transfer) => transfer.state === state)
      .sort((a, b) => b.metadata.updatedAt - a.metadata.updatedAt);
  }

  /**
   * Get queue status
   */
  public getQueueStatus(): QueueStatus {
    const transfers = Array.from(this.transfers.values());

    return {
      totalTransfers: transfers.length,
      pendingTransfers: transfers.filter((t) => t.state === "pending").length,
      activeTransfers: transfers.filter((t) =>
        ["sent", "received"].includes(t.state)
      ).length,
      completedTransfers: transfers.filter((t) => t.state === "consumed")
        .length,
      failedTransfers: transfers.filter((t) => t.state === "failed").length,
      expiredTransfers: transfers.filter((t) => t.state === "expired").length,
    };
  }

  /**
   * Get agent status
   */
  public getAgentStatus(agentId: string): AgentStatus | null {
    return this.agents.get(agentId) || null;
  }

  /**
   * Get all agent statuses
   */
  public getAllAgentStatuses(): AgentStatus[] {
    return Array.from(this.agents.values()).sort(
      (a, b) => b.lastSeen - a.lastSeen
    );
  }

  /**
   * Get all transfers (for CLI access)
   */
  public getAllTransfers(): KnowledgeTransferRequest[] {
    return Array.from(this.transfers.values()).sort(
      (a, b) => b.metadata.updatedAt - a.metadata.updatedAt
    );
  }

  private generateTransferId(): string {
    return `transfer-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private getFileSize(filePath: string): number {
    try {
      const stats = fs.statSync(filePath);
      return stats.size;
    } catch {
      return 0;
    }
  }

  private updateAgentStatus(agentId: string): void {
    const now = Date.now();
    const transfers = this.getTransfersForAgent(agentId);

    const status: AgentStatus = {
      agentId,
      lastSeen: now,
      isOnline: true,
      pendingReceives: transfers.filter(
        (t) => t.toAgentId === agentId && t.state === "sent"
      ).length,
      pendingConsumes: transfers.filter(
        (t) => t.toAgentId === agentId && t.state === "received"
      ).length,
      totalTransfers: transfers.length,
    };

    this.agents.set(agentId, status);
  }

  private cleanupExpiredTransfers(): void {
    const now = Date.now();
    let expiredCount = 0;

    for (const [transferId, transfer] of this.transfers) {
      if (
        transfer.metadata.expiresAt &&
        now > transfer.metadata.expiresAt &&
        transfer.state !== "consumed"
      ) {
        transfer.state = "expired";
        transfer.metadata.updatedAt = now;
        transfer.history.push({
          timestamp: now,
          state: "expired",
          agentId: "system",
          message: "Transfer expired due to timeout",
        });
        expiredCount++;
      }
    }

    if (expiredCount > 0) {
      this.saveQueue();
      this.logger.warn(`⏰ Cleaned up ${expiredCount} expired transfers`);
    }
  }

  private loadQueue(): void {
    try {
      if (fs.existsSync(this.queuePath)) {
        const data = fs.readFileSync(this.queuePath, "utf8");
        const parsed = JSON.parse(data);

        this.transfers = new Map(parsed.transfers || []);
        this.agents = new Map(parsed.agents || []);
      }
    } catch (error) {
      this.logger.warn("⚠️ Failed to load transfer queue, starting fresh");
      this.transfers = new Map();
      this.agents = new Map();
    }
  }

  private saveQueue(): void {
    try {
      const dir = path.dirname(this.queuePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      const data = {
        transfers: Array.from(this.transfers.entries()),
        agents: Array.from(this.agents.entries()),
        lastUpdated: Date.now(),
      };

      fs.writeFileSync(this.queuePath, JSON.stringify(data, null, 2));
    } catch (error) {
      this.logger.error("❌ Failed to save transfer queue:", error);
    }
  }
}
