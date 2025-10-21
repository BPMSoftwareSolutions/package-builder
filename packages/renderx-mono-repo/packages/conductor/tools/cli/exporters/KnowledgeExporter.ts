/**
 * KnowledgeExporter - Export system knowledge and state
 * Extracts knowledge from the MusicalConductor system for transfer to other agents
 */

import { AgentKnowledge, KnowledgeTransferOptions } from "../knowledge-cli";
import { MusicalConductor } from "../../../modules/communication/sequences/MusicalConductor";
import { EventBus } from "../../../modules/communication/EventBus";
import { initializeCommunicationSystem } from "../../../modules/communication/index";

export class KnowledgeExporter {
  private conductor: MusicalConductor | null = null;
  private eventBus: EventBus | null = null;

  constructor() {
    this.initializeSystem();
  }

  private initializeSystem(): void {
    try {
      // Initialize the communication system to get access to the conductor
      const system = initializeCommunicationSystem();
      this.conductor = system.conductor;
      this.eventBus = system.eventBus;
    } catch (error) {
      console.warn(
        "⚠️ Could not initialize MusicalConductor system for export:",
        error
      );
    }
  }

  async exportKnowledge(
    options: KnowledgeTransferOptions
  ): Promise<AgentKnowledge> {
    const agentId = this.generateAgentId();
    const timestamp = Date.now();

    const knowledge: AgentKnowledge = {
      metadata: {
        agentId,
        timestamp,
        version: "1.0.0",
        musicalConductorVersion: this.getMusicalConductorVersion(),
        exportType: this.determineExportType(options),
        description: "AI Agent Knowledge Export from MusicalConductor System",
      },
      systemState: {
        conductorStatistics: {},
        performanceMetrics: {},
        eventLogs: [],
        queueState: {},
      },
      pluginKnowledge: {
        mountedPlugins: [],
        pluginConfigurations: [],
        pluginMetadata: [],
        sequenceDefinitions: [],
      },
      eventKnowledge: {
        eventSubscriptions: [],
        eventHistory: [],
        eventPatterns: [],
        domainEvents: [],
      },
      resourceKnowledge: {
        resourceOwnership: [],
        resourceConflicts: [],
        resourceDelegations: [],
      },
      learningData: {
        successPatterns: [],
        errorPatterns: [],
        optimizationInsights: [],
        bestPractices: [],
      },
    };

    // Export system state
    if (options.includeSystemState !== false) {
      knowledge.systemState = await this.exportSystemState(options);
    }

    // Export plugin knowledge
    if (options.includePlugins !== false) {
      knowledge.pluginKnowledge = await this.exportPluginKnowledge(options);
    }

    // Export event knowledge
    if (options.includeEvents !== false) {
      knowledge.eventKnowledge = await this.exportEventKnowledge(options);
    }

    // Export resource knowledge
    if (options.includeResources !== false) {
      knowledge.resourceKnowledge = await this.exportResourceKnowledge(options);
    }

    // Export learning data
    if (options.includeLearning !== false) {
      knowledge.learningData = await this.exportLearningData(options);
    }

    return knowledge;
  }

  async getSystemStatus(): Promise<any> {
    const status = {
      conductor: {
        active: this.conductor !== null,
        sequences: 0,
        plugins: 0,
        queueLength: 0,
      },
      performance: {
        totalExecutions: 0,
        averageTime: 0,
        successRate: 0,
      },
      events: {
        subscriptions: 0,
        emitted: 0,
      },
    };

    if (this.conductor) {
      try {
        // Get conductor statistics
        const stats = this.conductor.getStatistics();
        status.conductor.sequences = stats.totalSequencesExecuted || 0;
        status.performance.totalExecutions = stats.totalSequencesExecuted || 0;
        status.performance.averageTime = stats.averageExecutionTime || 0;
        status.performance.successRate = stats.successRate || 0;

        // Get queue status
        const queuedSequences = this.conductor.getQueuedSequences();
        status.conductor.queueLength = queuedSequences.length;

        // Get plugin count (if available)
        // Note: This would need to be implemented in the conductor API
        status.conductor.plugins = 0; // Placeholder
      } catch (error) {
        console.warn("⚠️ Could not get full system status:", error);
      }
    }

    if (this.eventBus) {
      try {
        // Get event bus statistics (if available)
        const eventStats = (this.eventBus as any).getStatistics?.() || {};
        status.events.subscriptions = eventStats.totalSubscriptions || 0;
        status.events.emitted = eventStats.totalEventsEmitted || 0;
      } catch (error) {
        console.warn("⚠️ Could not get event bus statistics:", error);
      }
    }

    return status;
  }

  private async exportSystemState(
    options: KnowledgeTransferOptions
  ): Promise<any> {
    const systemState: any = {};

    if (this.conductor) {
      try {
        // Export conductor statistics
        systemState.conductorStatistics = this.conductor.getStatistics();

        // Export queue state
        systemState.queueState = {
          queuedSequences: this.conductor.getQueuedSequences(),
          timestamp: Date.now(),
        };

        // Export performance metrics if requested
        if (options.includePerformanceData) {
          systemState.performanceMetrics = await this.exportPerformanceMetrics(
            options
          );
        }

        // Export event logs (limited by time range if specified)
        systemState.eventLogs = await this.exportEventLogs(options);
      } catch (error) {
        console.warn("⚠️ Could not export complete system state:", error);
        systemState.error =
          error instanceof Error ? error.message : String(error);
      }
    }

    return systemState;
  }

  private async exportPluginKnowledge(
    options: KnowledgeTransferOptions
  ): Promise<any> {
    const pluginKnowledge = {
      mountedPlugins: [],
      pluginConfigurations: [],
      pluginMetadata: [],
      sequenceDefinitions: [],
    };

    if (this.conductor) {
      try {
        // Export mounted plugins information
        // Note: This would need to be implemented in the conductor API
        pluginKnowledge.mountedPlugins = []; // Placeholder

        // Export sequence definitions (these are part of plugin knowledge)
        // Note: This would need access to the sequence registry
        pluginKnowledge.sequenceDefinitions = []; // Placeholder

        // Apply plugin filters if specified
        if (options.filterByPlugin && options.filterByPlugin.length > 0) {
          pluginKnowledge.mountedPlugins =
            pluginKnowledge.mountedPlugins.filter((plugin: any) =>
              options.filterByPlugin!.includes(plugin.id || plugin.name)
            );
        }
      } catch (error) {
        console.warn("⚠️ Could not export complete plugin knowledge:", error);
      }
    }

    return pluginKnowledge;
  }

  private async exportEventKnowledge(
    options: KnowledgeTransferOptions
  ): Promise<any> {
    const eventKnowledge = {
      eventSubscriptions: [] as any[],
      eventHistory: [] as any[],
      eventPatterns: [] as any[],
      domainEvents: [] as any[],
    };

    if (this.eventBus) {
      try {
        // Export current event subscriptions (if available)
        const subscriptions =
          (this.eventBus as any).getAllSubscriptions?.() || [];
        eventKnowledge.eventSubscriptions = subscriptions.map((sub: any) => ({
          id: sub.id,
          eventName: sub.eventName,
          subscribedAt: sub.subscribedAt,
          pluginId: sub.pluginId,
          context: sub.context,
        }));

        // Export event history (limited by time range if specified)
        eventKnowledge.eventHistory = await this.exportEventHistory(options);

        // Apply event filters if specified
        if (options.filterByEvent && options.filterByEvent.length > 0) {
          eventKnowledge.eventSubscriptions =
            eventKnowledge.eventSubscriptions.filter((sub: any) =>
              options.filterByEvent!.includes(sub.eventName)
            );
          eventKnowledge.eventHistory = eventKnowledge.eventHistory.filter(
            (event: any) => options.filterByEvent!.includes(event.eventName)
          );
        }
      } catch (error) {
        console.warn("⚠️ Could not export complete event knowledge:", error);
      }
    }

    return eventKnowledge;
  }

  private async exportResourceKnowledge(
    options: KnowledgeTransferOptions
  ): Promise<any> {
    const resourceKnowledge = {
      resourceOwnership: [] as any[],
      resourceConflicts: [] as any[],
      resourceDelegations: [] as any[],
    };

    if (this.conductor) {
      try {
        // Export resource ownership information
        const ownership = this.conductor.getResourceOwnership();
        resourceKnowledge.resourceOwnership = Array.from(ownership || []);

        // Export resource conflicts (if available)
        // Note: This would need to be implemented in the conductor API
        resourceKnowledge.resourceConflicts = []; // Placeholder

        // Export resource delegations (if available)
        // Note: This would need to be implemented in the conductor API
        resourceKnowledge.resourceDelegations = []; // Placeholder
      } catch (error) {
        console.warn("⚠️ Could not export complete resource knowledge:", error);
      }
    }

    return resourceKnowledge;
  }

  private async exportLearningData(
    options: KnowledgeTransferOptions
  ): Promise<any> {
    const learningData = {
      successPatterns: [] as any[],
      errorPatterns: [] as any[],
      optimizationInsights: [] as any[],
      bestPractices: [] as string[],
    };

    // This would be populated with AI learning insights
    // For now, we'll include some basic best practices
    learningData.bestPractices = [
      "Use conductor.play() instead of direct eventBus.emit() for SPA compliance",
      "Always handle sequence errors gracefully with proper error handling strategies",
      "Use appropriate musical dynamics (pp, p, mp, mf, f, ff) for sequence priorities",
      "Implement proper resource ownership patterns to avoid conflicts",
      "Use data baton (payload) for passing data between sequence beats",
    ];

    // Export performance-based insights
    if (this.conductor && options.includePerformanceData) {
      try {
        const stats = this.conductor.getStatistics();

        if (stats.successRate > 0.95) {
          learningData.optimizationInsights.push({
            type: "performance",
            insight: "High success rate indicates good sequence design",
            metric: "successRate",
            value: stats.successRate,
            timestamp: Date.now(),
          });
        }

        if (stats.averageExecutionTime < 100) {
          learningData.optimizationInsights.push({
            type: "performance",
            insight:
              "Fast execution times indicate efficient sequence implementation",
            metric: "averageExecutionTime",
            value: stats.averageExecutionTime,
            timestamp: Date.now(),
          });
        }
      } catch (error) {
        console.warn("⚠️ Could not export performance insights:", error);
      }
    }

    return learningData;
  }

  private async exportPerformanceMetrics(
    options: KnowledgeTransferOptions
  ): Promise<any> {
    const performanceMetrics = {
      executionTimes: [],
      memoryUsage: [],
      errorRates: [],
      throughput: [],
      timestamp: Date.now(),
    };

    // This would collect detailed performance metrics
    // For now, we'll return basic structure
    return performanceMetrics;
  }

  private async exportEventLogs(
    options: KnowledgeTransferOptions
  ): Promise<any[]> {
    const eventLogs: any[] = [];

    // This would export event logs from the system
    // Limited by time range if specified
    if (options.timeRange) {
      // Filter logs by time range
      return eventLogs.filter(
        (log) =>
          log.timestamp >= options.timeRange!.start &&
          log.timestamp <= options.timeRange!.end
      );
    }

    return eventLogs;
  }

  private async exportEventHistory(
    options: KnowledgeTransferOptions
  ): Promise<any[]> {
    const eventHistory: any[] = [];

    // This would export event history from the event bus
    // For now, return empty array as placeholder
    return eventHistory;
  }

  private generateAgentId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 5);
    return `agent-${timestamp}-${random}`;
  }

  private getMusicalConductorVersion(): string {
    try {
      // Try to get version from package.json
      const packageJson = require("../../../package.json");
      return packageJson.version || "1.0.0";
    } catch (error) {
      return "1.0.0";
    }
  }

  private determineExportType(
    options: KnowledgeTransferOptions
  ): "full" | "partial" | "incremental" {
    const hasAllOptions =
      options.includeSystemState !== false &&
      options.includePlugins !== false &&
      options.includeEvents !== false &&
      options.includeResources !== false &&
      options.includeLearning !== false;

    if (
      hasAllOptions &&
      !options.timeRange &&
      !options.filterByPlugin &&
      !options.filterByEvent
    ) {
      return "full";
    } else if (options.timeRange) {
      return "incremental";
    } else {
      return "partial";
    }
  }
}
