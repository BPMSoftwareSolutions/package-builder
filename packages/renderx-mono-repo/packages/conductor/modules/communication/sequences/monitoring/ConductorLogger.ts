/**
 * ConductorLogger - Phase 1
 * Nested logging of sequence/movement/beat and plugin handler messages.
 */

import { EventBus } from "../../EventBus.js";
import { MUSICAL_CONDUCTOR_EVENT_TYPES } from "../SequenceTypes.js";
import { DataBaton } from "./DataBaton.js";

interface Scope {
  type: "sequence" | "movement" | "beat" | "handler";
  label: string;
}

interface LogEvent {
  level: "log" | "info" | "warn" | "error";
  message: any[];
  requestId?: string;
  pluginId?: string;
  handlerName?: string;
}

export class ConductorLogger {
  private eventBus: EventBus;
  private stacks: Map<string, Scope[]> = new Map();
  private enabled: boolean;

  constructor(eventBus: EventBus, enabled = true) {
    this.eventBus = eventBus;
    this.enabled = enabled;
    // Expose logger to DataBaton for indent computation
    (this.eventBus as any).__conductorLogger = this;
    DataBaton.eventBus = this.eventBus as any;
  }

  init(): void {
    if (!this.enabled) return;

    // Sequence scope
    this.eventBus.subscribe(
      MUSICAL_CONDUCTOR_EVENT_TYPES.SEQUENCE_STARTED,
      (data: any) =>
        this.push(data.requestId, {
          type: "sequence",
          label: `🎼 ${data.sequenceName}`,
        })
    );
    this.eventBus.subscribe(
      MUSICAL_CONDUCTOR_EVENT_TYPES.SEQUENCE_COMPLETED,
      (data: any) => this.pop(data.requestId, "sequence")
    );

    // Movement scope
    this.eventBus.subscribe(
      MUSICAL_CONDUCTOR_EVENT_TYPES.MOVEMENT_STARTED,
      (data: any) =>
        this.push(data.requestId, {
          type: "movement",
          label: `🎵 ${data.movementName}`,
        })
    );
    this.eventBus.subscribe(
      MUSICAL_CONDUCTOR_EVENT_TYPES.MOVEMENT_COMPLETED,
      (data: any) => this.pop(data.requestId, "movement")
    );

    // Beat scope
    this.eventBus.subscribe(
      MUSICAL_CONDUCTOR_EVENT_TYPES.BEAT_STARTED,
      (data: any) =>
        this.push(data.requestId, {
          type: "beat",
          label: `🥁 ${data.beat}: ${data.event}`,
        })
    );
    this.eventBus.subscribe(
      MUSICAL_CONDUCTOR_EVENT_TYPES.BEAT_COMPLETED,
      (data: any) => this.pop(data.requestId, "beat")
    );
    this.eventBus.subscribe(
      MUSICAL_CONDUCTOR_EVENT_TYPES.BEAT_FAILED,
      (data: any) => this.pop(data.requestId, "beat")
    );

    // Handler scopes (emitted by PluginManager wrapping)
    this.eventBus.subscribe("plugin:handler:start", (data: any) =>
      this.push(data.requestId, {
        type: "handler",
        label: `🔧 ${data.pluginId}.${data.handlerName}`,
      })
    );
    this.eventBus.subscribe("plugin:handler:end", (data: any) =>
      this.pop(data.requestId, "handler")
    );

    // Plugin log messages
    this.eventBus.subscribe("musical-conductor:log", (evt: LogEvent) => {
      const indent = this.getIndent(evt.requestId);
      const prefix = evt.pluginId
        ? `🧩 ${evt.pluginId}${evt.handlerName ? "." + evt.handlerName : ""}`
        : "🎼";
      const line = `${indent}${prefix}`;
      switch (evt.level) {
        case "warn":
          console.warn(line, ...evt.message);
          break;
        case "error":
          console.error(line, ...evt.message);
          break;
        case "info":
        case "log":
        default:
          console.log(line, ...evt.message);
      }
    });

    // Stage crew commit logging
    this.eventBus.subscribe("stage:cue", (cue: any) => {
      this.logStageCue(cue);
    });
  }

  private push(requestId: string | undefined, scope: Scope): void {
    const key = requestId || "__global__";
    const stack = this.stacks.get(key) || [];
    stack.push(scope);
    this.stacks.set(key, stack);
    const indent = this.getIndent(requestId);
    console.log(`${indent}${scope.label}`);
  }

  private pop(requestId: string | undefined, type: Scope["type"]): void {
    const key = requestId || "__global__";
    const stack = this.stacks.get(key) || [];
    // Pop last matching type
    for (let i = stack.length - 1; i >= 0; i--) {
      if (stack[i].type === type) {
        stack.splice(i, 1);
        break;
      }
    }
    this.stacks.set(key, stack);
  }

  /** Expose current depth for a request so other loggers can align indent */
  public getDepth(requestId?: string): number {
    const key = requestId || "__global__";
    return (this.stacks.get(key) || []).length;
  }

  private getIndent(requestId?: string): string {
    const key = requestId || "__global__";
    const depth = (this.stacks.get(key) || []).length;
    return "  ".repeat(Math.max(0, depth));
  }

  /**
   * Log stage crew commits in debug mode
   * @param cue - Stage cue data containing operations and metadata
   */
  private logStageCue(cue: any): void {
    if (!cue || !cue.operations || cue.operations.length === 0) {
      return;
    }

    const indent = this.getIndent();
    const pluginPrefix = cue.pluginId ? `${cue.pluginId}` : "unknown";
    const correlationId = cue.correlationId || "no-correlation";
    const handlerName = cue.meta?.handlerName ? `.${cue.meta.handlerName}` : "";

    console.log(`${indent}🎭 Stage Crew: ${pluginPrefix}${handlerName} (${correlationId})`);

    // Log each operation with proper indentation
    cue.operations.forEach((op: any, index: number) => {
      const opIndent = `${indent}  `;
      const isLast = index === cue.operations.length - 1;
      const connector = isLast ? "└─" : "├─";

      switch (op.op) {
        case "classes.add":
          console.log(`${opIndent}${connector} Add class "${op.value}" to ${op.selector}`);
          break;
        case "classes.remove":
          console.log(`${opIndent}${connector} Remove class "${op.value}" from ${op.selector}`);
          break;
        case "attr.set":
          console.log(`${opIndent}${connector} Set ${op.key}="${op.value}" on ${op.selector}`);
          break;
        case "style.set":
          console.log(`${opIndent}${connector} Set style ${op.key}="${op.value}" on ${op.selector}`);
          break;
        case "create":
          const classes = op.classes ? ` classes=[${op.classes.join(", ")}]` : "";
          const attrs = op.attrs ? ` attrs=${JSON.stringify(op.attrs)}` : "";
          console.log(`${opIndent}${connector} Create <${op.tag}>${classes}${attrs} in ${op.parent}`);
          break;
        case "remove":
          console.log(`${opIndent}${connector} Remove ${op.selector}`);
          break;
        default:
          console.log(`${opIndent}${connector} Unknown operation: ${JSON.stringify(op)}`);
      }
    });
  }
}
