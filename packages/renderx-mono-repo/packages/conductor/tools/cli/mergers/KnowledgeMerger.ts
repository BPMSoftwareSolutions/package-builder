/**
 * KnowledgeMerger - Merge knowledge from multiple agents
 * Handles merging and conflict resolution when combining knowledge from different sources
 */

import { AgentKnowledge } from "../knowledge-cli";

export interface MergeOptions {
  strategy: "latest" | "priority" | "consensus";
  resolveConflicts?: boolean;
  priorityOrder?: string[]; // Agent IDs in priority order
}

export interface MergeResult {
  success: boolean;
  mergedKnowledge: AgentKnowledge;
  conflicts: ConflictInfo[];
  resolutions: ResolutionInfo[];
  warnings: string[];
}

export interface ConflictInfo {
  type: "metadata" | "plugin" | "event" | "resource" | "learning";
  field: string;
  values: { agentId: string; value: any }[];
  severity: "low" | "medium" | "high";
  description: string;
}

export interface ResolutionInfo {
  conflict: ConflictInfo;
  resolution: "latest" | "priority" | "merge" | "skip";
  chosenValue: any;
  reason: string;
}

export interface DiffResult {
  added: any[];
  removed: any[];
  modified: any[];
  metadata: any;
}

export class KnowledgeMerger {
  async merge(
    knowledgeFiles: AgentKnowledge[],
    options: MergeOptions
  ): Promise<AgentKnowledge> {
    if (knowledgeFiles.length === 0) {
      throw new Error("No knowledge files provided for merging");
    }

    if (knowledgeFiles.length === 1) {
      return knowledgeFiles[0];
    }

    // Sort by timestamp for latest strategy
    const sortedKnowledge = [...knowledgeFiles].sort(
      (a, b) => b.metadata.timestamp - a.metadata.timestamp
    );

    // Create base merged knowledge from the latest/highest priority source
    const baseKnowledge = this.createBaseKnowledge(sortedKnowledge, options);

    // Merge each section
    baseKnowledge.systemState = await this.mergeSystemState(
      knowledgeFiles,
      options
    );
    baseKnowledge.pluginKnowledge = await this.mergePluginKnowledge(
      knowledgeFiles,
      options
    );
    baseKnowledge.eventKnowledge = await this.mergeEventKnowledge(
      knowledgeFiles,
      options
    );
    baseKnowledge.resourceKnowledge = await this.mergeResourceKnowledge(
      knowledgeFiles,
      options
    );
    baseKnowledge.learningData = await this.mergeLearningData(
      knowledgeFiles,
      options
    );

    return baseKnowledge;
  }

  async diff(
    knowledgeA: AgentKnowledge,
    knowledgeB: AgentKnowledge
  ): Promise<DiffResult> {
    const diff: DiffResult = {
      added: [] as any[],
      removed: [] as any[],
      modified: [] as any[],
      metadata: {},
    };

    // Compare metadata
    diff.metadata = this.compareMetadata(
      knowledgeA.metadata,
      knowledgeB.metadata
    );

    // Compare plugins
    const pluginDiff = this.comparePluginKnowledge(
      knowledgeA.pluginKnowledge,
      knowledgeB.pluginKnowledge
    );
    diff.added.push(...pluginDiff.added);
    diff.removed.push(...pluginDiff.removed);
    diff.modified.push(...pluginDiff.modified);

    // Compare events
    const eventDiff = this.compareEventKnowledge(
      knowledgeA.eventKnowledge,
      knowledgeB.eventKnowledge
    );
    diff.added.push(...eventDiff.added);
    diff.removed.push(...eventDiff.removed);
    diff.modified.push(...eventDiff.modified);

    // Compare learning data
    const learningDiff = this.compareLearningData(
      knowledgeA.learningData,
      knowledgeB.learningData
    );
    diff.added.push(...learningDiff.added);
    diff.removed.push(...learningDiff.removed);
    diff.modified.push(...learningDiff.modified);

    return diff;
  }

  private createBaseKnowledge(
    knowledgeFiles: AgentKnowledge[],
    options: MergeOptions
  ): AgentKnowledge {
    const latest = knowledgeFiles[0];

    return {
      metadata: {
        agentId: `merged-${Date.now().toString(36)}`,
        timestamp: Date.now(),
        version: "1.0.0",
        musicalConductorVersion: latest.metadata.musicalConductorVersion,
        exportType: "full",
        description: `Merged knowledge from ${knowledgeFiles.length} agents using ${options.strategy} strategy`,
      },
      systemState: {
        conductorStatistics: {},
        performanceMetrics: {},
        eventLogs: [],
        queueState: {},
      },
      pluginKnowledge: {
        mountedPlugins: [] as any[],
        pluginConfigurations: [] as any[],
        pluginMetadata: [] as any[],
        sequenceDefinitions: [] as any[],
      },
      eventKnowledge: {
        eventSubscriptions: [] as any[],
        eventHistory: [] as any[],
        eventPatterns: [] as any[],
        domainEvents: [] as any[],
      },
      resourceKnowledge: {
        resourceOwnership: [] as any[],
        resourceConflicts: [] as any[],
        resourceDelegations: [] as any[],
      },
      learningData: {
        successPatterns: [] as any[],
        errorPatterns: [] as any[],
        optimizationInsights: [] as any[],
        bestPractices: [] as string[],
      },
    };
  }

  private async mergeSystemState(
    knowledgeFiles: AgentKnowledge[],
    options: MergeOptions
  ): Promise<any> {
    const merged: any = {};

    // Use latest strategy for system state
    const latest = knowledgeFiles.find(
      (k) => k.systemState && Object.keys(k.systemState).length > 0
    );
    if (latest) {
      Object.assign(merged, latest.systemState);
    }

    return merged;
  }

  private async mergePluginKnowledge(
    knowledgeFiles: AgentKnowledge[],
    options: MergeOptions
  ): Promise<any> {
    const merged = {
      mountedPlugins: [] as any[],
      pluginConfigurations: [] as any[],
      pluginMetadata: [] as any[],
      sequenceDefinitions: [] as any[],
    };

    const seenSequences = new Set<string>();
    const seenPlugins = new Set<string>();

    for (const knowledge of knowledgeFiles) {
      if (!knowledge.pluginKnowledge) continue;

      // Merge sequence definitions (avoid duplicates)
      if (knowledge.pluginKnowledge.sequenceDefinitions) {
        for (const sequence of knowledge.pluginKnowledge.sequenceDefinitions) {
          const key = sequence.id || sequence.name;
          if (key && !seenSequences.has(key)) {
            merged.sequenceDefinitions.push(sequence);
            seenSequences.add(key);
          }
        }
      }

      // Merge mounted plugins (avoid duplicates)
      if (knowledge.pluginKnowledge.mountedPlugins) {
        for (const plugin of knowledge.pluginKnowledge.mountedPlugins) {
          const key = plugin.id || plugin.name;
          if (key && !seenPlugins.has(key)) {
            merged.mountedPlugins.push(plugin);
            seenPlugins.add(key);
          }
        }
      }

      // Merge plugin configurations and metadata
      if (knowledge.pluginKnowledge.pluginConfigurations) {
        merged.pluginConfigurations.push(
          ...knowledge.pluginKnowledge.pluginConfigurations
        );
      }

      if (knowledge.pluginKnowledge.pluginMetadata) {
        merged.pluginMetadata.push(...knowledge.pluginKnowledge.pluginMetadata);
      }
    }

    return merged;
  }

  private async mergeEventKnowledge(
    knowledgeFiles: AgentKnowledge[],
    options: MergeOptions
  ): Promise<any> {
    const merged = {
      eventSubscriptions: [] as any[],
      eventHistory: [] as any[],
      eventPatterns: [] as any[],
      domainEvents: [] as any[],
    };

    const seenSubscriptions = new Set<string>();
    const seenPatterns = new Set<string>();

    for (const knowledge of knowledgeFiles) {
      if (!knowledge.eventKnowledge) continue;

      // Merge event subscriptions (avoid duplicates)
      if (knowledge.eventKnowledge.eventSubscriptions) {
        for (const subscription of knowledge.eventKnowledge
          .eventSubscriptions) {
          const key = `${subscription.eventName}-${subscription.pluginId}`;
          if (!seenSubscriptions.has(key)) {
            merged.eventSubscriptions.push(subscription);
            seenSubscriptions.add(key);
          }
        }
      }

      // Merge event history (combine all)
      if (knowledge.eventKnowledge.eventHistory) {
        merged.eventHistory.push(...knowledge.eventKnowledge.eventHistory);
      }

      // Merge event patterns (avoid duplicates)
      if (knowledge.eventKnowledge.eventPatterns) {
        for (const pattern of knowledge.eventKnowledge.eventPatterns) {
          const key = pattern.name || pattern.id || JSON.stringify(pattern);
          if (!seenPatterns.has(key)) {
            merged.eventPatterns.push(pattern);
            seenPatterns.add(key);
          }
        }
      }

      // Merge domain events
      if (knowledge.eventKnowledge.domainEvents) {
        merged.domainEvents.push(...knowledge.eventKnowledge.domainEvents);
      }
    }

    // Sort event history by timestamp
    merged.eventHistory.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));

    return merged;
  }

  private async mergeResourceKnowledge(
    knowledgeFiles: AgentKnowledge[],
    options: MergeOptions
  ): Promise<any> {
    const merged = {
      resourceOwnership: [] as any[],
      resourceConflicts: [] as any[],
      resourceDelegations: [] as any[],
    };

    for (const knowledge of knowledgeFiles) {
      if (!knowledge.resourceKnowledge) continue;

      // Merge resource ownership (use latest for each resource)
      if (knowledge.resourceKnowledge.resourceOwnership) {
        merged.resourceOwnership.push(
          ...knowledge.resourceKnowledge.resourceOwnership
        );
      }

      // Merge resource conflicts
      if (knowledge.resourceKnowledge.resourceConflicts) {
        merged.resourceConflicts.push(
          ...knowledge.resourceKnowledge.resourceConflicts
        );
      }

      // Merge resource delegations
      if (knowledge.resourceKnowledge.resourceDelegations) {
        merged.resourceDelegations.push(
          ...knowledge.resourceKnowledge.resourceDelegations
        );
      }
    }

    return merged;
  }

  private async mergeLearningData(
    knowledgeFiles: AgentKnowledge[],
    options: MergeOptions
  ): Promise<any> {
    const merged = {
      successPatterns: [] as any[],
      errorPatterns: [] as any[],
      optimizationInsights: [] as any[],
      bestPractices: [] as string[],
    };

    const seenPractices = new Set<string>();
    const seenInsights = new Set<string>();

    for (const knowledge of knowledgeFiles) {
      if (!knowledge.learningData) continue;

      // Merge best practices (avoid duplicates)
      if (knowledge.learningData.bestPractices) {
        for (const practice of knowledge.learningData.bestPractices) {
          if (!seenPractices.has(practice)) {
            merged.bestPractices.push(practice);
            seenPractices.add(practice);
          }
        }
      }

      // Merge optimization insights (avoid duplicates by insight text)
      if (knowledge.learningData.optimizationInsights) {
        for (const insight of knowledge.learningData.optimizationInsights) {
          const key = insight.insight || JSON.stringify(insight);
          if (!seenInsights.has(key)) {
            merged.optimizationInsights.push(insight);
            seenInsights.add(key);
          }
        }
      }

      // Merge success patterns
      if (knowledge.learningData.successPatterns) {
        merged.successPatterns.push(...knowledge.learningData.successPatterns);
      }

      // Merge error patterns
      if (knowledge.learningData.errorPatterns) {
        merged.errorPatterns.push(...knowledge.learningData.errorPatterns);
      }
    }

    return merged;
  }

  // Comparison methods for diff functionality
  private compareMetadata(metadataA: any, metadataB: any): any {
    const changes: any = {};

    const keys = new Set([
      ...Object.keys(metadataA),
      ...Object.keys(metadataB),
    ]);

    for (const key of keys) {
      if (metadataA[key] !== metadataB[key]) {
        changes[key] = {
          from: metadataA[key],
          to: metadataB[key],
        };
      }
    }

    return changes;
  }

  private comparePluginKnowledge(
    pluginsA: any,
    pluginsB: any
  ): { added: any[]; removed: any[]; modified: any[] } {
    const result = {
      added: [] as any[],
      removed: [] as any[],
      modified: [] as any[],
    };

    // Compare sequence definitions
    const sequencesA = pluginsA?.sequenceDefinitions || [];
    const sequencesB = pluginsB?.sequenceDefinitions || [];

    const sequenceMapA = new Map(
      sequencesA.map((s: any) => [s.id || s.name, s])
    );
    const sequenceMapB = new Map(
      sequencesB.map((s: any) => [s.id || s.name, s])
    );

    // Find added sequences
    for (const [key, sequence] of sequenceMapB) {
      if (!sequenceMapA.has(key)) {
        result.added.push({ type: "sequence", name: key, data: sequence });
      }
    }

    // Find removed sequences
    for (const [key, sequence] of sequenceMapA) {
      if (!sequenceMapB.has(key)) {
        result.removed.push({ type: "sequence", name: key, data: sequence });
      }
    }

    return result;
  }

  private compareEventKnowledge(
    eventsA: any,
    eventsB: any
  ): { added: any[]; removed: any[]; modified: any[] } {
    const result = {
      added: [] as any[],
      removed: [] as any[],
      modified: [] as any[],
    };

    // Compare event patterns
    const patternsA = eventsA?.eventPatterns || [];
    const patternsB = eventsB?.eventPatterns || [];

    const patternMapA = new Map(patternsA.map((p: any) => [p.name || p.id, p]));
    const patternMapB = new Map(patternsB.map((p: any) => [p.name || p.id, p]));

    // Find added patterns
    for (const [key, pattern] of patternMapB) {
      if (!patternMapA.has(key)) {
        result.added.push({ type: "event-pattern", name: key, data: pattern });
      }
    }

    // Find removed patterns
    for (const [key, pattern] of patternMapA) {
      if (!patternMapB.has(key)) {
        result.removed.push({
          type: "event-pattern",
          name: key,
          data: pattern,
        });
      }
    }

    // Compare event subscriptions count
    const subsA = eventsA?.eventSubscriptions?.length || 0;
    const subsB = eventsB?.eventSubscriptions?.length || 0;

    if (subsA !== subsB) {
      result.modified.push({
        type: "event-subscriptions",
        name: "subscription-count",
        from: subsA,
        to: subsB,
      });
    }

    return result;
  }

  private compareLearningData(
    learningA: any,
    learningB: any
  ): { added: any[]; removed: any[]; modified: any[] } {
    const result = {
      added: [] as any[],
      removed: [] as any[],
      modified: [] as any[],
    };

    // Compare best practices
    const practicesA = new Set(learningA?.bestPractices || []);
    const practicesB = new Set(learningB?.bestPractices || []);

    // Find added practices
    for (const practice of practicesB) {
      if (!practicesA.has(practice)) {
        result.added.push({
          type: "best-practice",
          name: String(practice).substring(0, 50) + "...",
          data: practice,
        });
      }
    }

    // Find removed practices
    for (const practice of practicesA) {
      if (!practicesB.has(practice)) {
        result.removed.push({
          type: "best-practice",
          name: String(practice).substring(0, 50) + "...",
          data: practice,
        });
      }
    }

    // Compare optimization insights count
    const insightsA = learningA?.optimizationInsights?.length || 0;
    const insightsB = learningB?.optimizationInsights?.length || 0;

    if (insightsA !== insightsB) {
      result.modified.push({
        type: "optimization-insights",
        name: "insights-count",
        from: insightsA,
        to: insightsB,
      });
    }

    return result;
  }
}
