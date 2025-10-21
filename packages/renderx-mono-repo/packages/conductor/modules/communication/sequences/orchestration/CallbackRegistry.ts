/**
 * CallbackRegistry
 * Preserves function-valued fields across nested play() boundaries by
 * extracting callbacks into an in-memory registry keyed by correlationId,
 * replacing them with JSON-safe placeholders, and rehydrating them at
 * handler boundaries.
 */

export interface PreservedCallbacks {
  correlationId: string;
  count: number;
}

interface RegistryEntry {
  fns: Map<string, Function>;
  createdAt: number;
  lastAccess: number;
}

const PLACEHOLDER_KEY = "__mc_cb_ref__";
const CORRELATION_KEY = "__mc_correlation_id__";
const DEFAULT_TTL_MS = 2 * 60 * 1000; // 2 minutes safety TTL

export class CallbackRegistry {
  private static instance: CallbackRegistry | null = null;
  static getInstance(): CallbackRegistry {
    if (!CallbackRegistry.instance) {
      CallbackRegistry.instance = new CallbackRegistry();
    }
    return CallbackRegistry.instance;
  }

  private store: Map<string, RegistryEntry> = new Map();

  /** Ensure a correlation id is attached; return it */
  ensureCorrelationId(obj: any): string {
    if (obj && typeof obj === "object" && typeof obj[CORRELATION_KEY] === "string") {
      return obj[CORRELATION_KEY];
    }
    const id = `mc-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    if (obj && typeof obj === "object") {
      try { (obj as any)[CORRELATION_KEY] = id; } catch {}
    }
    return id;
  }

  /** Extract functions from a payload into the registry, replacing with placeholders */
  preserveInPlace(ctx: any): PreservedCallbacks {
    const correlationId = this.ensureCorrelationId(ctx);
    const entry = this.getOrCreateEntry(correlationId);

    let count = 0;
    const visit = (node: any, path: string) => {
      if (!node || typeof node !== "object") return;
      // Avoid reserved fields
      const keys = Array.isArray(node) ? node.keys?.() : Object.keys(node);
      if (Array.isArray(node)) {
        for (let i = 0; i < node.length; i++) {
          const child = node[i];
          const childPath = `${path}[${i}]`;
          if (typeof child === "function") {
            const ref = `${childPath}`;
            entry.fns.set(ref, child as any);
            node[i] = { [PLACEHOLDER_KEY]: ref };
            count++;
          } else if (child && typeof child === "object") {
            visit(child, childPath);
          }
        }
        return;
      }
      for (const key of Object.keys(node)) {
        if (key === PLACEHOLDER_KEY) continue;
        if (key === CORRELATION_KEY) continue;
        const value = (node as any)[key];
        const childPath = path ? `${path}.${key}` : key;
        if (typeof value === "function") {
          entry.fns.set(childPath, value as any);
          (node as any)[key] = { [PLACEHOLDER_KEY]: childPath };
          count++;
        } else if (value && typeof value === "object") {
          // Skip DOM elements or special objects by duck-typing minimal props
          const tag = (value as any)?.tagName;
          if (typeof tag === "string") continue;
          visit(value, childPath);
        }
      }
    };

    try { visit(ctx, ""); } catch {}
    entry.lastAccess = Date.now();
    this.purgeOldEntries();
    return { correlationId, count };
  }

  /** Rehydrate placeholders back to functions on the given data object (in place) */
  rehydrateInPlace(data: any): number {
    if (!data || typeof data !== "object") return 0;
    const correlationId = (data as any)[CORRELATION_KEY];
    if (!correlationId || typeof correlationId !== "string") return 0;

    const entry = this.store.get(correlationId);
    if (!entry) return 0;

    let count = 0;
    const visit = (node: any) => {
      if (!node || typeof node !== "object") return;
      if (Array.isArray(node)) {
        for (let i = 0; i < node.length; i++) {
          const child = node[i];
          if (child && typeof child === "object" && PLACEHOLDER_KEY in child) {
            const ref = (child as any)[PLACEHOLDER_KEY];
            const fn = entry.fns.get(ref);
            if (typeof fn === "function") {
              node[i] = fn;
              count++;
            }
          } else if (child && typeof child === "object") {
            visit(child);
          }
        }
        return;
      }
      for (const key of Object.keys(node)) {
        const value = (node as any)[key];
        if (value && typeof value === "object" && PLACEHOLDER_KEY in value) {
          const ref = (value as any)[PLACEHOLDER_KEY];
          const fn = entry.fns.get(ref);
          if (typeof fn === "function") {
            (node as any)[key] = fn;
            count++;
          }
        } else if (value && typeof value === "object") {
          visit(value);
        }
      }
    };

    // Phase 1: Replace any placeholders that survived transport
    try { visit(data); } catch {}

    // Phase 2: For any known callback paths, ensure the function exists on data
    const setByPath = (root: any, refPath: string, fn: Function) => {
      // Tokenize path like "foo.bar[0].baz" or "[0].cb"
      const tokens: Array<string | number> = [];
      let buf = "";
      const pushBuf = () => { if (buf) { tokens.push(buf); buf = ""; } };
      for (let i = 0; i < refPath.length; i++) {
        const ch = refPath[i];
        if (ch === ".") {
          pushBuf();
        } else if (ch === "[") {
          pushBuf();
          let j = i + 1;
          let num = "";
          while (j < refPath.length && refPath[j] !== "]") { num += refPath[j++]; }
          tokens.push(parseInt(num, 10));
          i = j; // skip to closing bracket
        } else {
          buf += ch;
        }
      }
      pushBuf();

      let cur = root;
      for (let t = 0; t < tokens.length; t++) {
        const seg = tokens[t];
        const last = t === tokens.length - 1;
        if (typeof seg === "number") {
          if (!Array.isArray(cur)) return; // shape mismatch, abort
          if (last) {
            // Set only if missing or not a function
            if (typeof cur[seg] !== "function") {
              cur[seg] = fn;
            }
            return;
          }
          if (cur[seg] == null || typeof cur[seg] !== "object") {
            cur[seg] = {};
          }
          cur = cur[seg];
        } else {
          if (last) {
            if (typeof cur[seg] !== "function") {
              cur[seg] = fn;
            }
            return;
          }
          if (cur[seg] == null || typeof cur[seg] !== "object") {
            cur[seg] = {};
          }
          cur = cur[seg];
        }
      }
    };

    for (const [ref, fn] of entry.fns.entries()) {
      try { setByPath(data, ref, fn); count++; } catch {}
    }

    entry.lastAccess = Date.now();
    this.purgeOldEntries();
    return count;
  }

  /** Cleanup an entry explicitly */
  cleanup(correlationId: string): void {
    this.store.delete(correlationId);
  }

  private getOrCreateEntry(correlationId: string): RegistryEntry {
    let entry = this.store.get(correlationId);
    if (!entry) {
      entry = { fns: new Map(), createdAt: Date.now(), lastAccess: Date.now() };
      this.store.set(correlationId, entry);
    }
    return entry;
  }

  private purgeOldEntries(now: number = Date.now(), ttlMs: number = DEFAULT_TTL_MS) {
    for (const [key, entry] of this.store.entries()) {
      if (now - entry.lastAccess > ttlMs) {
        this.store.delete(key);
      }
    }
  }
}

export const __internal = { PLACEHOLDER_KEY, CORRELATION_KEY };

