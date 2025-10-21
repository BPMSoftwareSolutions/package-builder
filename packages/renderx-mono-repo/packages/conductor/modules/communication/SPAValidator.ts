/**
 * SPA Runtime Validator
 * Provides runtime enforcement of Symphonic Plugin Architecture (SPA) compliance
 * Prevents plugins from directly accessing eventBus.emit() and enforces conductor.play() usage
 */

import { EventBus, EventCallback } from "./EventBus.js";

// Special-case allow-list for StageCrew stage:cue emissions
interface StageCueLike { meta?: { __stageCrewInternal?: boolean }; }

export interface SPAViolation {
  type: string;
  pluginId: string;
  description: string;
  stackTrace: string;
  timestamp: Date;
  severity: "critical" | "error" | "warning";
  // Optional location and code snippet details for better diagnostics
  fileUrl?: string;
  lineNumber?: number;
  columnNumber?: number;
  codeSnippet?: string;
}

export interface SPAValidatorConfig {
  strictMode: boolean;
  allowedPlugins: string[];
  logViolations: boolean;
  throwOnViolation: boolean;
  enableRuntimeChecks: boolean;
  enforceConductorLogger: "off" | "warn" | "error";
}

export class SPAValidator {
  private violations: SPAViolation[] = [];
  public config: SPAValidatorConfig;
  private originalEventBusEmit: Function | null = null;
  private originalEventBusSubscribe: Function | null = null;
  private registeredPlugins: Set<string> = new Set();

  constructor(config: Partial<SPAValidatorConfig> = {}) {
    this.config = {
      strictMode: true,
      allowedPlugins: [],
      logViolations: true,
      throwOnViolation: false,
      enableRuntimeChecks: true,
      enforceConductorLogger: "warn",
      ...config,
    };

    // In strict mode, elevate logger enforcement to error
    if (
      this.config.strictMode &&
      this.config.enforceConductorLogger !== "off"
    ) {
      this.config.enforceConductorLogger = "error";
    }

    if (this.config.enableRuntimeChecks) {
      this.initializeRuntimeChecks();
    }
  }

  /**
   * Initialize runtime checks by intercepting eventBus.emit calls and subscribe calls
   */
  private initializeRuntimeChecks(): void {
    // Store original emit method
    this.originalEventBusEmit = EventBus.prototype.emit;

    // Override emit method with validation
    (EventBus.prototype.emit as any) = this.createValidatedEmit();

    // Store original subscribe method and override it
    this.originalEventBusSubscribe = EventBus.prototype.subscribe;
    (EventBus.prototype.subscribe as any) = this.createValidatedSubscribe();

    // Intercept global eventBus access
    this.interceptGlobalAccess();

    console.log("🎼 SPA Validator: Runtime checks initialized");
  }

  /**
   * Create validated emit function that checks for plugin violations
   */
  private createValidatedEmit(): Function {
    return function (
      this: EventBus,
      eventName: string,
      data?: any,
      options: any = {}
    ) {
      const validator = SPAValidator.getInstance();

      // Allow internal MC diagnostic/logging events without validation
      if (
        typeof eventName === "string" &&
        (eventName.startsWith("musical-conductor:") || eventName.startsWith("conductor:"))
      ) {
        return validator.originalEventBusEmit!.call(this, eventName, data, options);
      }

      // Special-case: allow StageCrew stage:cue emissions marked as internal
      if (
        eventName === "stage:cue" &&
        data && (data as StageCueLike).meta && (data as StageCueLike).meta!.__stageCrewInternal
      ) {
        return validator.originalEventBusEmit!.call(this, eventName, data, options);
      }

      // Get call stack to identify caller
      const stack = new Error().stack || "";
      const callerInfo = validator.analyzeCallStack(stack);

      // Check if call is from a plugin
      if (validator.isPluginCall(callerInfo)) {
        const loc = validator.extractLocationFromStack(stack);
        const violation = validator.createViolation(
          "RUNTIME_DIRECT_EVENTBUS_EMIT",
          callerInfo.pluginId,
          `Plugin '${callerInfo.pluginId}' directly called eventBus.emit('${eventName}')`,
          stack,
          "critical",
          {
            fileUrl: loc.fileUrl,
            lineNumber: loc.lineNumber,
            columnNumber: loc.columnNumber,
            codeSnippet: loc.stackLine,
          }
        );

        validator.handleViolation(violation);

        // In strict mode, block the call
        if (validator.config.strictMode) {
          console.error(
            `🚫 SPA Validator: Blocked direct eventBus.emit() call from plugin '${callerInfo.pluginId}'`
          );
          console.error(
            `💡 Use conductor.play('${callerInfo.pluginId}', 'SEQUENCE_NAME', data) instead`
          );
          return;
        }
      }

      // Call original emit method
      return validator.originalEventBusEmit!.call(
        this,
        eventName,
        data,
        options
      );
    };
  }

  /**
   * Create validated subscribe function that checks for React component violations
   */
  private createValidatedSubscribe(): Function {
    return function (
      this: EventBus,
      eventName: string,
      callback: EventCallback,
      context?: any
    ) {
      const validator = SPAValidator.getInstance();
      const stack = new Error().stack || "";
      const callerInfo = validator.analyzeCallStack(stack);

      // Allow MusicalConductor to subscribe directly for internal operations
      if (callerInfo.isMusicalConductor) {
        return validator.originalEventBusSubscribe!.call(
          this,
          eventName,
          callback,
          context
        );
      }

      // Check if React component is directly subscribing
      if (callerInfo.isReactComponent) {
        const loc = validator.extractLocationFromStack(stack);
        const violation = validator.createViolation(
          "RUNTIME_REACT_COMPONENT_EVENTBUS_SUBSCRIBE",
          "react-component",
          `React component directly called eventBus.subscribe('${eventName}') - should use conductor.subscribe()`,
          stack,
          "critical",
          {
            fileUrl: loc.fileUrl,
            lineNumber: loc.lineNumber,
            columnNumber: loc.columnNumber,
            codeSnippet: loc.stackLine,
          }
        );
        validator.handleViolation(violation);

        if (validator.config.strictMode) {
          throw new Error(
            `React component violation: Use conductor.subscribe('${eventName}', callback) instead of eventBus.subscribe()`
          );
        }
      }

      // Check if plugin is subscribing outside mount method
      if (callerInfo.isPlugin && !callerInfo.isInMountMethod) {
        const loc = validator.extractLocationFromStack(stack);
        const violation = validator.createViolation(
          "RUNTIME_PLUGIN_EVENTBUS_SUBSCRIBE_OUTSIDE_MOUNT",
          callerInfo.pluginId,
          `Plugin '${callerInfo.pluginId}' called eventBus.subscribe() outside mount method`,
          stack,
          "error",
          {
            fileUrl: loc.fileUrl,
            lineNumber: loc.lineNumber,
            columnNumber: loc.columnNumber,
            codeSnippet: loc.stackLine,
          }
        );
        validator.handleViolation(violation);
      }

      return validator.originalEventBusSubscribe!.call(
        this,
        eventName,
        callback,
        context
      );
    };
  }

  /**
   * Intercept global eventBus access through window.renderxCommunicationSystem
   */
  private interceptGlobalAccess(): void {
    if (typeof window === "undefined") return;

    // Monitor access to window.renderxCommunicationSystem.eventBus
    const originalDescriptor = Object.getOwnPropertyDescriptor(
      window,
      "renderxCommunicationSystem"
    );

    let communicationSystem: any = null;

    Object.defineProperty(window, "renderxCommunicationSystem", {
      get: () => {
        const stack = new Error().stack || "";
        const callerInfo = this.analyzeCallStack(stack);

        // Check for violations in eventBus access
        if (this.isViolatingGlobalAccess(callerInfo, stack)) {
          this.handleGlobalAccessViolation(callerInfo, stack);
        }

        return communicationSystem;
      },
      set: (value) => {
        communicationSystem = value;
      },
      configurable: true,
    });
  }

  /**
   * Check if global access is violating SPA principles
   */
  private isViolatingGlobalAccess(callerInfo: any, stack: string): boolean {
    // Allow MusicalConductor and AppContent to set up the system
    if (
      callerInfo.source === "MusicalConductor" ||
      stack.includes("AppContent")
    ) {
      return false;
    }

    // Check if accessing .eventBus specifically
    if (stack.includes(".eventBus")) {
      return true;
    }

    return false;
  }

  /**
   * Handle global access violations
   */
  private handleGlobalAccessViolation(callerInfo: any, stack: string): void {
    const loc = this.extractLocationFromStack(stack);
    const violation = this.createViolation(
      "RUNTIME_GLOBAL_EVENTBUS_ACCESS",
      callerInfo.pluginId || callerInfo.source,
      `Global eventBus access detected - should use conductor methods instead`,
      stack,
      "critical",
      {
        fileUrl: loc.fileUrl,
        lineNumber: loc.lineNumber,
        columnNumber: loc.columnNumber,
        codeSnippet: loc.stackLine,
      }
    );
    this.handleViolation(violation);
  }

  /**
   * Analyze call stack to identify plugin calls, React components, and mount methods
   */
  public analyzeCallStack(stack: string): {
    isPlugin: boolean;
    pluginId: string;
    fileName: string;
    isReactComponent: boolean;
    isInMountMethod: boolean;
    source: string;
    isMusicalConductor: boolean;
  } {
    const lines = stack.split("\n");
    let isReactComponent = false;
    let isInMountMethod = false;
    let isMusicalConductor = false;
    let source = "unknown";

    for (const line of lines) {
      const normalized = String(line).replace(/\\\\/g, "/");

      // Strong early detection: any reference within the musical-conductor package
      if (
        normalized.includes("/node_modules/musical-conductor/") ||
        normalized.includes("/musical-conductor/dist/") ||
        normalized.includes("/musical-conductor/") ||
        normalized.includes("/dist/modules/communication/") ||
        normalized.includes("/modules/communication/")
      ) {
        return {
          isPlugin: false,
          pluginId: "MusicalConductor",
          fileName: line,
          isReactComponent: false,
          isInMountMethod: false,
          source: "MusicalConductor",
          isMusicalConductor: true,
        };
      }

      // Check for MusicalConductor internal operations (additional heuristics)
      // Handle both full paths, URLs, and just filenames
      if (
        normalized.includes("MusicalConductor") ||
        normalized.includes("/sequences/MusicalConductor.ts") ||
        normalized.includes("/sequences/core/") ||
        normalized.includes("/sequences/plugins/PluginManager") ||
        normalized.includes("/sequences/plugins/PluginInterfaceFacade") ||
        normalized.includes("/sequences/plugins/PluginLoader") ||
        normalized.includes("/sequences/plugins/PluginValidator") ||
        normalized.includes("/sequences/plugins/PluginManifestLoader") ||
        normalized.includes("SequenceRegistry") ||
        normalized.includes("EventSubscriptionManager") ||
        normalized.includes("ConductorCore") ||
        normalized.includes("EventOrchestrator") ||
        normalized.includes("SequenceOrchestrator") ||
        normalized.includes("/communication/EventBus") ||
        normalized.includes("/communication/SPAValidator") ||
        // Handle filename-only patterns (common in minified/bundled code)
        normalized.includes("PluginManager.js") ||
        normalized.includes("PluginInterfaceFacade.js") ||
        normalized.includes("PluginLoader.js") ||
        normalized.includes("PluginValidator.js") ||
        normalized.includes("PluginManifestLoader.js") ||
        normalized.includes("SequenceRegistry.js") ||
        normalized.includes("EventSubscriptionManager.js") ||
        normalized.includes("ConductorCore.js") ||
        normalized.includes("EventOrchestrator.js") ||
        normalized.includes("SequenceOrchestrator.js") ||
        normalized.includes("EventBus.js") ||
        normalized.includes("SPAValidator.js")
      ) {
        isMusicalConductor = true;
        source = "MusicalConductor";
        // MusicalConductor is allowed to access eventBus directly for internal operations
        return {
          isPlugin: false,
          pluginId: "MusicalConductor",
          fileName: line,
          isReactComponent: false,
          isInMountMethod: false,
          source,
          isMusicalConductor: true,
        };
      }

      // Look for React component patterns
      const reactMatch = normalized.match(/\/components\/([^\/]+\.tsx?)/);
      if (reactMatch) {
        isReactComponent = true;
        source = `React:${reactMatch[1]}`;
      }

      // Look for mount method patterns
      if (line.includes(".mount(") || line.includes("mount:")) {
        isInMountMethod = true;
      }

      // Look for plugin file patterns
      const pluginMatch = line.match(/\/plugins\/([^\/]+)/);
      if (pluginMatch) {
        return {
          isPlugin: true,
          pluginId: pluginMatch[1],
          fileName: line,
          isReactComponent,
          isInMountMethod,
          source: `Plugin:${pluginMatch[1]}`,
          isMusicalConductor: false,
        };
      }

      // Look for symphony patterns
      const symphonyMatch = line.match(/([^\/]+\.symphony)/);
      if (symphonyMatch) {
        return {
          isPlugin: true,
          pluginId: symphonyMatch[1],
          fileName: line,
          isReactComponent,
          isInMountMethod,
          source: `Plugin:${symphonyMatch[1]}`,
          isMusicalConductor: false,
        };
      }

      // Look for MusicalConductor patterns
      if (line.includes("MusicalConductor")) {
        source = "MusicalConductor";
      }
    }

    return {
      isPlugin: false,
      pluginId: "unknown",
      fileName: "unknown",
      isReactComponent,
      isInMountMethod,
      source,
      isMusicalConductor: false,
    };
  }

  /**
   * Best-effort extraction of file URL, line and column from a JS stack trace
   */
  private extractLocationFromStack(stack: string): {
    fileUrl?: string;
    lineNumber?: number;
    columnNumber?: number;
    stackLine?: string;
  } {
    if (!stack) return {};
    const lines = stack.split("\n");
    // Prefer the first line that is not from SPAValidator or EventBus internals
    for (const raw of lines) {
      const line = String(raw).trim();
      if (!line) continue;
      if (line.includes("SPAValidator") || line.includes("EventBus")) continue;
      // Common patterns:
      //   at func (http://host/path/file.js:123:45)
      //   at http://host/path/file.js:123:45
      //   file:///path/file.js:123:45
      const match = line.match(/(https?:\/\/[^\s\)]+|file:\/\/[^\s\)]+|\/[\w\-\.\/]+):(\d+):(\d+)/);
      if (match) {
        const fileUrl = match[1];
        const lineNumber = Number(match[2]);
        const columnNumber = Number(match[3]);
        return { fileUrl, lineNumber, columnNumber, stackLine: line };
      }
      // Vite style with parentheses
      const parenMatch = line.match(/\(([^\s\)]+):(\d+):(\d+)\)/);
      if (parenMatch) {
        const fileUrl = parenMatch[1];
        const lineNumber = Number(parenMatch[2]);
        const columnNumber = Number(parenMatch[3]);
        return { fileUrl, lineNumber, columnNumber, stackLine: line };
      }
    }
    return { stackLine: lines[1] || lines[0] };
  }


  /**
   * Check if call is from a plugin
   */
  private isPluginCall(callerInfo: {
    isPlugin: boolean;
    pluginId: string;
    isReactComponent?: boolean;
    isInMountMethod?: boolean;
    source?: string;
    isMusicalConductor?: boolean;
  }): boolean {
    if (!callerInfo.isPlugin) return false;

    // MusicalConductor is not considered a plugin for violation purposes
    if (callerInfo.isMusicalConductor) return false;

    // Allow calls from whitelisted plugins
    if (this.config.allowedPlugins.includes(callerInfo.pluginId)) {
      return false;
    }

    return true;
  }

  /**
   * Create violation record
   */
  public createViolation(
    type: string,
    pluginId: string,
    description: string,
    stackTrace: string,
    severity: "critical" | "error" | "warning",
    extras: Partial<SPAViolation> = {}
  ): SPAViolation {
    return {
      type,
      pluginId,
      description,
      stackTrace,
      timestamp: new Date(),
      severity,
      ...extras,
    };
  }

  /**
   * Handle violation based on configuration
   */
  public handleViolation(violation: SPAViolation): void {
    this.violations.push(violation);

    if (this.config.logViolations) {
      console.error(
        `🎼 SPA Violation [${violation.severity.toUpperCase()}]: ${
          violation.description
        }`
      );
      console.error(`   Plugin: ${violation.pluginId}`);
      console.error(`   Time: ${violation.timestamp.toISOString()}`);
      if (violation.fileUrl && typeof violation.lineNumber === "number") {
        const col = typeof violation.columnNumber === "number" ? `:${violation.columnNumber}` : "";
        console.error(`   Location: ${violation.fileUrl}:${violation.lineNumber}${col}`);
      }
      if (violation.codeSnippet) {
        console.error(`   Code: ${violation.codeSnippet.trim()}`);
      }
      if (violation.severity === "critical") {
        console.error(
          `   Stack: ${violation.stackTrace.split("\n").slice(0, 3).join("\n")}`
        );
      }
    }

    if (this.config.throwOnViolation && violation.severity === "critical") {
      throw new Error(`SPA Violation: ${violation.description}`);
    }
  }

  /**
   * Register a plugin as allowed to use eventBus directly (for migration)
   */
  public registerPlugin(pluginId: string): void {
    this.registeredPlugins.add(pluginId);
    // Plugin registered - logging disabled for cleaner output
  }

  /**
   * Validate plugin compliance before mounting
   */
  /**
   * Detect direct console usage in a function's source
   */
  public detectDirectConsoleUsage(fn: Function): boolean {
    try {
      const src = Function.prototype.toString.call(fn);
      return /(\b|\.)console\.(log|info|warn|error|debug)\b/.test(src);
    } catch {
      return false;
    }
  }

  public validatePluginMount(
    pluginId: string,
    pluginCode: string
  ): { valid: boolean; violations: string[] } {
    const violations: string[] = [];

    const lines = pluginCode.split(/\r?\n/);

    // Direct eventBus.emit calls (line-aware, skip obvious strings/comments quickly)
    const directEmitRegex = /(^|[^\.\w])eventBus\.emit\s*\(/;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = String(line).trim();
      // Skip comment-only lines
      if (/^\s*\/\//.test(trimmed) || /^\s*$/.test(trimmed)) continue;
      if (directEmitRegex.test(line)) {
        violations.push(
          `eventBus.emit() at line ${i + 1}: ${trimmed}`
        );
      }
    }

    // Global eventBus access
    const globalEmitRegex = /window\..*eventBus\.emit\s*\(/;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = String(line).trim();
      if (/^\s*\/\//.test(trimmed) || /^\s*$/.test(trimmed)) continue;
      if (globalEmitRegex.test(line)) {
        violations.push(
          `global eventBus access at line ${i + 1}: ${trimmed}`
        );
      }
    }

    // Check for proper conductor.play usage if any emit usage found
    const hasEmitFindings = violations.some(v => v.includes("eventBus"));
    if (hasEmitFindings && !/conductor\.play\s*\(/.test(pluginCode)) {
      violations.push(
        `Uses eventBus.emit() but no conductor.play() - migrate to SPA`
      );
    }

    return {
      valid: violations.length === 0,
      violations,
    };
  }

  /**
   * Get all violations
   */
  public getViolations(): SPAViolation[] {
    return [...this.violations];
  }

  /**
   * Get violations by plugin
   */
  public getViolationsByPlugin(pluginId: string): SPAViolation[] {
    return this.violations.filter((v) => v.pluginId === pluginId);
  }

  /**
   * Clear violations
   */
  public clearViolations(): void {
    this.violations = [];
  }

  /**
   * Generate compliance report
   */
  public generateComplianceReport(): {
    totalViolations: number;
    violationsByPlugin: Record<string, number>;
    violationsBySeverity: Record<string, number>;
    recommendations: string[];
  } {
    const violationsByPlugin: Record<string, number> = {};
    const violationsBySeverity: Record<string, number> = {};
    const recommendations: string[] = [];

    for (const violation of this.violations) {
      violationsByPlugin[violation.pluginId] =
        (violationsByPlugin[violation.pluginId] || 0) + 1;
      violationsBySeverity[violation.severity] =
        (violationsBySeverity[violation.severity] || 0) + 1;
    }

    // Generate recommendations
    for (const [pluginId, count] of Object.entries(violationsByPlugin)) {
      recommendations.push(
        `Plugin '${pluginId}' has ${count} violation(s) - migrate to conductor.play() pattern`
      );
    }

    return {
      totalViolations: this.violations.length,
      violationsByPlugin,
      violationsBySeverity,
      recommendations,
    };
  }

  /**
   * Singleton instance
   */
  private static instance: SPAValidator;

  public static getInstance(): SPAValidator {
    if (!SPAValidator.instance) {
      SPAValidator.instance = new SPAValidator();
    }
    return SPAValidator.instance;
  }

  /**
   * Initialize SPA validation with configuration
   */
  public static initialize(
    config: Partial<SPAValidatorConfig> = {}
  ): SPAValidator {
    SPAValidator.instance = new SPAValidator(config);
    return SPAValidator.instance;
  }

  /**
   * Disable runtime checks (for testing or migration)
   */
  public disableRuntimeChecks(): void {
    if (this.originalEventBusEmit) {
      (EventBus.prototype.emit as any) = this.originalEventBusEmit!;
      console.log("🎼 SPA Validator: Runtime checks disabled");
    }
  }
}
