// StageCrew.ts
import type { EventBus } from "../../EventBus.js";
import { isDevEnv } from "../environment/ConductorEnv.js";
import { StageDomGuard } from "./StageDomGuard.js";

export type StageOp =
  | { op: "classes.add"; selector: string; value: string }
  | { op: "classes.remove"; selector: string; value: string }
  | { op: "attr.set"; selector: string; key: string; value: string }
  | { op: "style.set"; selector: string; key: string; value: string }
  | {
      op: "create";
      tag: string;
      parent: string;
      attrs?: Record<string, string>;
      classes?: string[];
    }
  | { op: "remove"; selector: string };

export interface BeatTxnMeta {
  handlerName?: string;
  [k: string]: any;
}

export interface StageCueLog {
  pluginId: string;
  correlationId: string;
  operations: StageOp[];
  meta?: BeatTxnMeta;
}

class BeatTxn {
  private ops: StageOp[] = [];
  private batchRequested = false;
  constructor(
    private eventBus: EventBus,
    private pluginId: string,
    private correlationId: string,
    private meta?: BeatTxnMeta
  ) {}

  update(
    selector: string,
    opts: {
      classes?: { add?: string[]; remove?: string[] };
      attrs?: Record<string, string>;
      style?: Record<string, string>;
    }
  ): BeatTxn {
    if (opts?.classes?.add) {
      for (const v of opts.classes.add)
        this.ops.push({ op: "classes.add", selector, value: v });
    }
    if (opts?.classes?.remove) {
      for (const v of opts.classes.remove)
        this.ops.push({ op: "classes.remove", selector, value: v });
    }
    if (opts?.attrs) {
      for (const [k, v] of Object.entries(opts.attrs))
        this.ops.push({ op: "attr.set", selector, key: k, value: v });
    }
    if (opts?.style) {
      for (const [k, v] of Object.entries(opts.style))
        this.ops.push({ op: "style.set", selector, key: k, value: v });
    }
    return this;
  }

  create(
    tag: string,
    opts: { classes?: string[]; attrs?: Record<string, string> }
  ) {
    const record: any = { op: "create", tag };
    if (opts?.classes?.length) record.classes = [...opts.classes];
    if (opts?.attrs) record.attrs = { ...opts.attrs };
    return {
      appendTo: (parent: string) => {
        this.ops.push({ ...record, parent });
        return this;
      },
    } as any;
  }

  remove(selector: string): BeatTxn {
    this.ops.push({ op: "remove", selector });
    return this;
  }

  private applyOpsToDom(): void {
    try {
      if (typeof document === "undefined") return;
      const apply = () => {
        for (const op of this.ops) {
          switch (op.op) {
            case "classes.add": {
              const el = document.querySelector(
                op.selector
              ) as HTMLElement | null;
              if (el) el.classList.add(op.value);
              break;
            }
            case "classes.remove": {
              const el = document.querySelector(
                op.selector
              ) as HTMLElement | null;
              if (el) el.classList.remove(op.value);
              break;
            }
            case "attr.set": {
              const el = document.querySelector(
                op.selector
              ) as HTMLElement | null;
              if (el) el.setAttribute(op.key, op.value);
              break;
            }
            case "style.set": {
              const el = document.querySelector(
                op.selector
              ) as HTMLElement | null;
              if (el) (el.style as any)[op.key] = op.value;
              break;
            }
            case "create": {
              const parent = document.querySelector(
                op.parent
              ) as HTMLElement | null;
              if (!parent) break;
              const el = document.createElement(op.tag);
              if (op.classes) for (const c of op.classes) el.classList.add(c);
              if (op.attrs)
                for (const [k, v] of Object.entries(op.attrs))
                  el.setAttribute(k, v);
              parent.appendChild(el);
              break;
            }
            case "remove": {
              const el = document.querySelector(
                op.selector
              ) as HTMLElement | null;
              if (el && el.parentElement) el.parentElement.removeChild(el);
              break;
            }
          }
        }
      };
      if (isDevEnv()) {
        StageDomGuard.silence(apply);
      } else {
        apply();
      }
    } catch {}
  }

  commit(opts?: { batch?: boolean }): void {
    const cue: StageCueLog = {
      pluginId: this.pluginId,
      correlationId: this.correlationId,
      operations: [...this.ops],
      // Mark as internal StageCrew emission so SPAValidator can allow-list this path
      meta: { ...(this.meta || {}), __stageCrewInternal: true },
    };

    const fire = () => {
      this.applyOpsToDom();
      (this.eventBus as any).emit("stage:cue", cue);
    };

    // Schedule via rAF if requested and available, else immediate
    const raf =
      (typeof window !== "undefined" &&
        (window as any).requestAnimationFrame) ||
      null;
    if (opts?.batch && raf) {
      raf(() => fire());
    } else {
      fire();
    }
  }
}

export class StageCrew {
  constructor(private eventBus: EventBus, private pluginId: string) {}
  beginBeat(correlationId: string, meta?: BeatTxnMeta) {
    return new BeatTxn(this.eventBus, this.pluginId, correlationId, meta);
  }
}

// StageCueLogger.ts
import type { EventBus } from "../../EventBus.js";

// Simple JSONL logger for stage:cue events (Node/test environments)
export class StageCueLogger {
  private filePath: string;
  private fs: any | null = null;

  constructor(private eventBus: EventBus, filePath?: string) {
    const date = new Date();
    const y = String(date.getFullYear());
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    this.filePath = filePath || `./.logs/mc-stage-cues-${y}${m}${d}.log`;
    try {
      // Lazy-require fs to avoid bundler issues in browser
      this.fs = require("fs");
    } catch {
      this.fs = null;
    }
  }

  init(): void {
    this.eventBus.subscribe("stage:cue", (cue: any) => this.writeCue(cue));
  }

  private writeCue(cue: any): void {
    if (!this.fs) return;
    try {
      const line = JSON.stringify(cue);
      this.fs.appendFileSync(this.filePath, line + "\n");
    } catch {
      // swallow errors in tests
    }
  }
}


// StageDomGuard.ts
/**
 * StageDomGuard (dev-mode)
 * Warns when direct DOM writes occur outside StageCrew.
 * Provides a silence() helper to temporarily disable warnings during StageCrew apply.
 */

export class StageDomGuard {
  private static installed = false;
  private static originals: Partial<{
    setAttribute: any;
    removeAttribute: any;
    appendChild: any;
    removeChild: any;
    replaceChild: any;
    insertBefore: any;
    classListAdd: any;
    classListRemove: any;
    styleSetProperty: any;
    createElement: any;
  }> = {};
  private static silenced = 0;

  static install(): void {
    if (this.installed) return;
    if (typeof document === "undefined") return;

    try {
      // Element attribute methods
      this.originals.setAttribute = Element.prototype.setAttribute;
      Element.prototype.setAttribute = function (
        this: Element,
        name: string,
        value: string
      ) {
        StageDomGuard.maybeWarn("setAttribute", this);
        return StageDomGuard.originals.setAttribute!.call(this, name, value);
      } as any;

      this.originals.removeAttribute = Element.prototype.removeAttribute;
      Element.prototype.removeAttribute = function (
        this: Element,
        name: string
      ) {
        StageDomGuard.maybeWarn("removeAttribute", this);
        return StageDomGuard.originals.removeAttribute!.call(this, name);
      } as any;

      // Node tree methods
      this.originals.appendChild = Node.prototype.appendChild;
      Node.prototype.appendChild = function <T extends Node>(
        this: Node,
        child: T
      ): T {
        StageDomGuard.maybeWarn("appendChild", this);
        return StageDomGuard.originals.appendChild!.call(this, child);
      } as any;

      this.originals.removeChild = Node.prototype.removeChild;
      Node.prototype.removeChild = function <T extends Node>(
        this: Node,
        child: T
      ): T {
        StageDomGuard.maybeWarn("removeChild", this);
        return StageDomGuard.originals.removeChild!.call(this, child);
      } as any;

      this.originals.replaceChild = Node.prototype.replaceChild;
      Node.prototype.replaceChild = function <T extends Node>(
        this: Node,
        newChild: Node,
        oldChild: T
      ): T {
        StageDomGuard.maybeWarn("replaceChild", this);
        return StageDomGuard.originals.replaceChild!.call(
          this,
          newChild,
          oldChild
        );
      } as any;

      this.originals.insertBefore = Node.prototype.insertBefore;
      Node.prototype.insertBefore = function <T extends Node>(
        this: Node,
        newNode: Node,
        ref: T | null
      ): T {
        StageDomGuard.maybeWarn("insertBefore", this);
        return StageDomGuard.originals.insertBefore!.call(this, newNode, ref);
      } as any;

      // classList add/remove
      this.originals.classListAdd = (DOMTokenList.prototype as any).add;
      (DOMTokenList.prototype as any).add = function (
        this: DOMTokenList,
        ...tokens: string[]
      ) {
        StageDomGuard.maybeWarn("classList.add", (this as any).ownerElement);
        return StageDomGuard.originals.classListAdd!.apply(this, tokens);
      } as any;

      this.originals.classListRemove = (DOMTokenList.prototype as any).remove;
      (DOMTokenList.prototype as any).remove = function (
        this: DOMTokenList,
        ...tokens: string[]
      ) {
        StageDomGuard.maybeWarn("classList.remove", (this as any).ownerElement);
        return StageDomGuard.originals.classListRemove!.apply(this, tokens);
      } as any;

      // style.setProperty
      this.originals.styleSetProperty =
        CSSStyleDeclaration.prototype.setProperty;
      CSSStyleDeclaration.prototype.setProperty = function (
        this: CSSStyleDeclaration,
        prop: string,
        value: string | null,
        priority?: string
      ) {
        StageDomGuard.maybeWarn(
          "style.setProperty",
          (this as any).ownerElement
        );
        return StageDomGuard.originals.styleSetProperty!.call(
          this,
          prop,
          value,
          priority
        );
      } as any;

      // document.createElement (for visibility)
      this.originals.createElement = Document.prototype.createElement;
      Document.prototype.createElement = function (
        this: Document,
        tagName: string,
        options?: any
      ) {
        StageDomGuard.maybeWarn("document.createElement", this);
        return StageDomGuard.originals.createElement!.call(
          this,
          tagName,
          options
        );
      } as any;

      this.installed = true;
    } catch (e) {
      console.warn(
        "⚠️ StageDomGuard: install failed:",
        (e as any)?.message || e
      );
    }
  }

  static uninstall(): void {
    if (!this.installed) return;
    try {
      if (this.originals.setAttribute)
        Element.prototype.setAttribute = this.originals.setAttribute;
      if (this.originals.removeAttribute)
        Element.prototype.removeAttribute = this.originals.removeAttribute;
      if (this.originals.appendChild)
        Node.prototype.appendChild = this.originals.appendChild;
      if (this.originals.removeChild)
        Node.prototype.removeChild = this.originals.removeChild;
      if (this.originals.replaceChild)
        Node.prototype.replaceChild = this.originals.replaceChild;
      if (this.originals.insertBefore)
        Node.prototype.insertBefore = this.originals.insertBefore;
      if (this.originals.classListAdd)
        (DOMTokenList.prototype as any).add = this.originals.classListAdd;
      if (this.originals.classListRemove)
        (DOMTokenList.prototype as any).remove = this.originals.classListRemove;
      if (this.originals.styleSetProperty)
        CSSStyleDeclaration.prototype.setProperty =
          this.originals.styleSetProperty;
      if (this.originals.createElement)
        Document.prototype.createElement = this.originals.createElement;
    } catch {}
    this.installed = false;
  }

  static silence<T>(fn: () => T): T {
    this.silenced++;
    try {
      return fn();
    } finally {
      this.silenced--;
    }
  }

  private static maybeWarn(op: string, _el: any): void {
    try {
      if (this.silenced > 0) return;
      // In tests/CI, keep output concise
      console.warn(
        `⚠️ StageDomGuard: Direct DOM write detected via ${op}. Use ctx.stageCrew instead.`
      );
    } catch {}
  }
}

