/**
 * KnowledgeValidator - Validate knowledge files for compatibility and integrity
 * Ensures imported knowledge is safe and compatible with the current system
 */

import { AgentKnowledge } from "../knowledge-cli";

export interface ValidationOptions {
  strict?: boolean;
  checkVersionCompatibility?: boolean;
  validatePluginStructure?: boolean;
  validateEventStructure?: boolean;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  score: number; // 0-100, overall validation score
  details: {
    metadata: ValidationDetail;
    systemState: ValidationDetail;
    pluginKnowledge: ValidationDetail;
    eventKnowledge: ValidationDetail;
    resourceKnowledge: ValidationDetail;
    learningData: ValidationDetail;
  };
}

export interface ValidationDetail {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  score: number;
}

export class KnowledgeValidator {
  private readonly SUPPORTED_VERSIONS = ["1.0.0"];
  private readonly REQUIRED_METADATA_FIELDS = [
    "agentId",
    "timestamp",
    "version",
    "musicalConductorVersion",
    "exportType",
  ];

  async validate(
    knowledge: AgentKnowledge,
    options: ValidationOptions = {}
  ): Promise<ValidationResult> {
    const result: ValidationResult = {
      isValid: true,
      errors: [] as string[],
      warnings: [] as string[],
      score: 100,
      details: {
        metadata: this.createEmptyDetail(),
        systemState: this.createEmptyDetail(),
        pluginKnowledge: this.createEmptyDetail(),
        eventKnowledge: this.createEmptyDetail(),
        resourceKnowledge: this.createEmptyDetail(),
        learningData: this.createEmptyDetail(),
      },
    };

    // Validate metadata
    result.details.metadata = await this.validateMetadata(
      knowledge.metadata,
      options
    );

    // Validate system state
    result.details.systemState = await this.validateSystemState(
      knowledge.systemState,
      options
    );

    // Validate plugin knowledge
    result.details.pluginKnowledge = await this.validatePluginKnowledge(
      knowledge.pluginKnowledge,
      options
    );

    // Validate event knowledge
    result.details.eventKnowledge = await this.validateEventKnowledge(
      knowledge.eventKnowledge,
      options
    );

    // Validate resource knowledge
    result.details.resourceKnowledge = await this.validateResourceKnowledge(
      knowledge.resourceKnowledge,
      options
    );

    // Validate learning data
    result.details.learningData = await this.validateLearningData(
      knowledge.learningData,
      options
    );

    // Aggregate results
    this.aggregateResults(result);

    return result;
  }

  private createEmptyDetail(): ValidationDetail {
    return {
      isValid: true,
      errors: [] as string[],
      warnings: [] as string[],
      score: 100,
    };
  }

  private async validateMetadata(
    metadata: any,
    options: ValidationOptions
  ): Promise<ValidationDetail> {
    const detail = this.createEmptyDetail();

    if (!metadata) {
      detail.errors.push("Metadata is required");
      detail.isValid = false;
      detail.score = 0;
      return detail;
    }

    // Check required fields
    for (const field of this.REQUIRED_METADATA_FIELDS) {
      if (!metadata[field]) {
        detail.errors.push(`Required metadata field missing: ${field}`);
        detail.score -= 20;
      }
    }

    // Validate agent ID format
    if (metadata.agentId && !this.isValidAgentId(metadata.agentId)) {
      detail.warnings.push("Agent ID format may not be standard");
      detail.score -= 5;
    }

    // Validate timestamp
    if (metadata.timestamp) {
      if (!this.isValidTimestamp(metadata.timestamp)) {
        detail.errors.push("Invalid timestamp format");
        detail.score -= 10;
      } else if (this.isTimestampTooOld(metadata.timestamp)) {
        detail.warnings.push("Knowledge export is quite old, may be outdated");
        detail.score -= 5;
      }
    }

    // Validate version compatibility
    if (
      options.checkVersionCompatibility !== false &&
      metadata.musicalConductorVersion
    ) {
      if (!this.isVersionSupported(metadata.musicalConductorVersion)) {
        detail.errors.push(
          `Unsupported MusicalConductor version: ${metadata.musicalConductorVersion}`
        );
        detail.score -= 30;
      }
    }

    // Validate export type
    if (
      metadata.exportType &&
      !["full", "partial", "incremental"].includes(metadata.exportType)
    ) {
      detail.warnings.push(`Unknown export type: ${metadata.exportType}`);
      detail.score -= 5;
    }

    detail.isValid = detail.errors.length === 0;
    detail.score = Math.max(0, detail.score);

    return detail;
  }

  private async validateSystemState(
    systemState: any,
    options: ValidationOptions
  ): Promise<ValidationDetail> {
    const detail = this.createEmptyDetail();

    if (!systemState || Object.keys(systemState).length === 0) {
      detail.warnings.push("No system state data to validate");
      return detail;
    }

    // Validate conductor statistics
    if (systemState.conductorStatistics) {
      const statsValidation = this.validateConductorStatistics(
        systemState.conductorStatistics
      );
      detail.errors.push(...statsValidation.errors);
      detail.warnings.push(...statsValidation.warnings);
      detail.score -= statsValidation.penalty;
    }

    // Validate queue state
    if (systemState.queueState) {
      const queueValidation = this.validateQueueState(systemState.queueState);
      detail.errors.push(...queueValidation.errors);
      detail.warnings.push(...queueValidation.warnings);
      detail.score -= queueValidation.penalty;
    }

    // Validate performance metrics
    if (systemState.performanceMetrics) {
      const perfValidation = this.validatePerformanceMetrics(
        systemState.performanceMetrics
      );
      detail.errors.push(...perfValidation.errors);
      detail.warnings.push(...perfValidation.warnings);
      detail.score -= perfValidation.penalty;
    }

    detail.isValid = detail.errors.length === 0;
    detail.score = Math.max(0, detail.score);

    return detail;
  }

  private async validatePluginKnowledge(
    pluginKnowledge: any,
    options: ValidationOptions
  ): Promise<ValidationDetail> {
    const detail = this.createEmptyDetail();

    if (!pluginKnowledge) {
      detail.warnings.push("No plugin knowledge to validate");
      return detail;
    }

    // Validate sequence definitions
    if (
      pluginKnowledge.sequenceDefinitions &&
      Array.isArray(pluginKnowledge.sequenceDefinitions)
    ) {
      for (const sequence of pluginKnowledge.sequenceDefinitions) {
        const seqValidation = this.validateSequenceDefinition(sequence);
        detail.errors.push(...seqValidation.errors);
        detail.warnings.push(...seqValidation.warnings);
        detail.score -= seqValidation.penalty;
      }
    }

    // Validate mounted plugins
    if (
      pluginKnowledge.mountedPlugins &&
      Array.isArray(pluginKnowledge.mountedPlugins)
    ) {
      for (const plugin of pluginKnowledge.mountedPlugins) {
        const pluginValidation = this.validateMountedPlugin(plugin);
        detail.errors.push(...pluginValidation.errors);
        detail.warnings.push(...pluginValidation.warnings);
        detail.score -= pluginValidation.penalty;
      }
    }

    detail.isValid = detail.errors.length === 0;
    detail.score = Math.max(0, detail.score);

    return detail;
  }

  private async validateEventKnowledge(
    eventKnowledge: any,
    options: ValidationOptions
  ): Promise<ValidationDetail> {
    const detail = this.createEmptyDetail();

    if (!eventKnowledge) {
      detail.warnings.push("No event knowledge to validate");
      return detail;
    }

    // Validate event subscriptions
    if (
      eventKnowledge.eventSubscriptions &&
      Array.isArray(eventKnowledge.eventSubscriptions)
    ) {
      for (const subscription of eventKnowledge.eventSubscriptions) {
        if (!subscription.eventName || !subscription.id) {
          detail.errors.push(
            "Event subscription missing required fields (eventName, id)"
          );
          detail.score -= 10;
        }
      }
    }

    // Validate event history
    if (
      eventKnowledge.eventHistory &&
      Array.isArray(eventKnowledge.eventHistory)
    ) {
      for (const event of eventKnowledge.eventHistory) {
        if (!event.eventName || !event.timestamp) {
          detail.warnings.push(
            "Event history entry missing eventName or timestamp"
          );
          detail.score -= 5;
        }
      }
    }

    detail.isValid = detail.errors.length === 0;
    detail.score = Math.max(0, detail.score);

    return detail;
  }

  private async validateResourceKnowledge(
    resourceKnowledge: any,
    options: ValidationOptions
  ): Promise<ValidationDetail> {
    const detail = this.createEmptyDetail();

    if (!resourceKnowledge) {
      detail.warnings.push("No resource knowledge to validate");
      return detail;
    }

    // Validate resource ownership
    if (
      resourceKnowledge.resourceOwnership &&
      Array.isArray(resourceKnowledge.resourceOwnership)
    ) {
      for (const ownership of resourceKnowledge.resourceOwnership) {
        if (!ownership.resourceId || !ownership.symphonyName) {
          detail.errors.push(
            "Resource ownership missing required fields (resourceId, symphonyName)"
          );
          detail.score -= 10;
        }
      }
    }

    detail.isValid = detail.errors.length === 0;
    detail.score = Math.max(0, detail.score);

    return detail;
  }

  private async validateLearningData(
    learningData: any,
    options: ValidationOptions
  ): Promise<ValidationDetail> {
    const detail = this.createEmptyDetail();

    if (!learningData) {
      detail.warnings.push("No learning data to validate");
      return detail;
    }

    // Validate best practices
    if (
      learningData.bestPractices &&
      Array.isArray(learningData.bestPractices)
    ) {
      for (const practice of learningData.bestPractices) {
        if (typeof practice !== "string" || practice.length < 10) {
          detail.warnings.push("Best practice should be a meaningful string");
          detail.score -= 2;
        }
      }
    }

    // Validate optimization insights
    if (
      learningData.optimizationInsights &&
      Array.isArray(learningData.optimizationInsights)
    ) {
      for (const insight of learningData.optimizationInsights) {
        if (!insight.type || !insight.insight) {
          detail.warnings.push(
            "Optimization insight missing type or insight text"
          );
          detail.score -= 5;
        }
      }
    }

    detail.isValid = detail.errors.length === 0;
    detail.score = Math.max(0, detail.score);

    return detail;
  }

  // Helper validation methods
  private validateConductorStatistics(stats: any): {
    errors: string[];
    warnings: string[];
    penalty: number;
  } {
    const result = {
      errors: [] as string[],
      warnings: [] as string[],
      penalty: 0,
    };

    if (
      typeof stats.totalSequencesExecuted !== "number" ||
      stats.totalSequencesExecuted < 0
    ) {
      result.warnings.push(
        "Invalid totalSequencesExecuted in conductor statistics"
      );
      result.penalty += 5;
    }

    if (
      typeof stats.successRate !== "number" ||
      stats.successRate < 0 ||
      stats.successRate > 1
    ) {
      result.warnings.push(
        "Invalid successRate in conductor statistics (should be 0-1)"
      );
      result.penalty += 5;
    }

    return result;
  }

  private validateQueueState(queueState: any): {
    errors: string[];
    warnings: string[];
    penalty: number;
  } {
    const result = {
      errors: [] as string[],
      warnings: [] as string[],
      penalty: 0,
    };

    if (!Array.isArray(queueState.queuedSequences)) {
      result.errors.push("Queue state queuedSequences should be an array");
      result.penalty += 10;
    }

    if (!queueState.timestamp || !this.isValidTimestamp(queueState.timestamp)) {
      result.warnings.push("Queue state missing or invalid timestamp");
      result.penalty += 5;
    }

    return result;
  }

  private validatePerformanceMetrics(metrics: any): {
    errors: string[];
    warnings: string[];
    penalty: number;
  } {
    const result = {
      errors: [] as string[],
      warnings: [] as string[],
      penalty: 0,
    };

    if (!metrics.timestamp || !this.isValidTimestamp(metrics.timestamp)) {
      result.warnings.push("Performance metrics missing or invalid timestamp");
      result.penalty += 5;
    }

    return result;
  }

  private validateSequenceDefinition(sequence: any): {
    errors: string[];
    warnings: string[];
    penalty: number;
  } {
    const result = {
      errors: [] as string[],
      warnings: [] as string[],
      penalty: 0,
    };

    if (!sequence.id || !sequence.name) {
      result.errors.push(
        "Sequence definition missing required fields (id, name)"
      );
      result.penalty += 15;
    }

    if (!sequence.movements || !Array.isArray(sequence.movements)) {
      result.errors.push("Sequence definition missing movements array");
      result.penalty += 10;
    }

    if (
      sequence.tempo &&
      (typeof sequence.tempo !== "number" || sequence.tempo <= 0)
    ) {
      result.warnings.push("Invalid tempo in sequence definition");
      result.penalty += 5;
    }

    return result;
  }

  private validateMountedPlugin(plugin: any): {
    errors: string[];
    warnings: string[];
    penalty: number;
  } {
    const result = {
      errors: [] as string[],
      warnings: [] as string[],
      penalty: 0,
    };

    if (!plugin.id && !plugin.name) {
      result.errors.push("Mounted plugin missing identifier (id or name)");
      result.penalty += 10;
    }

    if (!plugin.sequence) {
      result.errors.push("Mounted plugin missing sequence definition");
      result.penalty += 15;
    }

    return result;
  }

  private aggregateResults(result: ValidationResult): void {
    // Collect all errors and warnings
    Object.values(result.details).forEach((detail) => {
      result.errors.push(...detail.errors);
      result.warnings.push(...detail.warnings);
    });

    // Calculate overall score (weighted average)
    const weights = {
      metadata: 0.3,
      systemState: 0.2,
      pluginKnowledge: 0.2,
      eventKnowledge: 0.15,
      resourceKnowledge: 0.1,
      learningData: 0.05,
    };

    result.score = Object.entries(result.details).reduce(
      (total, [key, detail]) => {
        const weight = weights[key as keyof typeof weights] || 0;
        return total + detail.score * weight;
      },
      0
    );

    result.score = Math.round(result.score);
    result.isValid = result.errors.length === 0;
  }

  // Utility validation methods
  private isValidAgentId(agentId: string): boolean {
    // Agent ID should follow pattern: agent-{timestamp}-{random}
    return /^agent-[a-z0-9]+-[a-z0-9]+$/.test(agentId);
  }

  private isValidTimestamp(timestamp: number): boolean {
    // Check if timestamp is a valid number and within reasonable range
    const now = Date.now();
    const oneYearAgo = now - 365 * 24 * 60 * 60 * 1000;
    const oneHourFromNow = now + 60 * 60 * 1000;

    return (
      typeof timestamp === "number" &&
      timestamp > oneYearAgo &&
      timestamp < oneHourFromNow
    );
  }

  private isTimestampTooOld(timestamp: number): boolean {
    const now = Date.now();
    const oneWeekAgo = now - 7 * 24 * 60 * 60 * 1000;
    return timestamp < oneWeekAgo;
  }

  private isVersionSupported(version: string): boolean {
    return this.SUPPORTED_VERSIONS.includes(version);
  }
}
