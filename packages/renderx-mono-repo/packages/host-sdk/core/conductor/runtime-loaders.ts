// Runtime loaders & JSON sequence catalog mounting (migrated from src/conductor.ts)
// Type declarations for plugin packages may be absent; dynamic imports are intentionally untyped.
import {
  isBareSpecifier,
  normalizeHandlersImportSpec,
} from "../infrastructure/handlers/handlersPath";
import { resolveModuleSpecifier } from "./conductor";

// Statically known runtime package loaders to ensure Vite can analyze and bundle
export const runtimePackageLoaders: Record<string, () => Promise<any>> = {
  // @ts-ignore missing d.ts (external plugin package)
  "@renderx-plugins/header": () => import("@renderx-plugins/header"),
  // @ts-ignore missing d.ts
  "@renderx-plugins/library": () => import("@renderx-plugins/library"),
  // @ts-ignore missing d.ts
  "@renderx-plugins/library-component": () =>
    import("@renderx-plugins/library-component"),
  // @ts-ignore missing d.ts
  "@renderx-plugins/canvas": () => import("@renderx-plugins/canvas"),
  // @ts-ignore missing d.ts
  "@renderx-plugins/canvas-component": () =>
    import("@renderx-plugins/canvas-component"),
  // @ts-ignore missing d.ts
  "@renderx-plugins/control-panel": () =>
    import("@renderx-plugins/control-panel"),
};

export type ConductorClient = any; // re-declared for local file cohesion

// Loads and mounts sequences from per-plugin JSON catalogs.
export async function loadJsonSequenceCatalogs(
  conductor: ConductorClient,
  pluginIds?: string[]
) {
  let artifactsDir: string | null = null;
  try {
    const envMod = await import(/* @vite-ignore */ "../environment/env");
    artifactsDir = (envMod as any).getArtifactsDir?.() || null;
  } catch {}
  let plugins: string[] = pluginIds || [];
  if (!plugins.length) {
    let manifest: any = null;
    let externalOnly = false;
    try {
      const isBrowser =
        typeof window !== "undefined" &&
        typeof (globalThis as any).fetch === "function";
      if (isBrowser) {
        try {
          const res = await fetch("/plugins/plugin-manifest.json");
          if (res.ok) manifest = await res.json();
        } catch {}
      }
      if (!manifest) {
        if (artifactsDir) {
          externalOnly = true;
          try {
            const fs = await import("fs/promises");
            const path = await import("path");
            const procAny: any = (globalThis as any).process;
            const cwd =
              procAny && typeof procAny.cwd === "function" ? procAny.cwd() : "";
            const p = path.join(
              cwd,
              artifactsDir,
              "plugins",
              "plugin-manifest.json"
            );
            const raw = await fs.readFile(p, "utf-8").catch(() => null as any);
            if (raw) manifest = JSON.parse(raw || "{}");
          } catch {}
        }
        if (!externalOnly) {
          try {
            // @ts-ignore raw JSON import for dev fallback
            const mod = await import(
              /* @vite-ignore */ "../../../public/plugins/plugin-manifest.json?raw"
            );
            const txt: string = (mod as any)?.default || (mod as any) || "{}";
            manifest = JSON.parse(txt);
          } catch {}
        }
      }
    } catch {}
    if (manifest && Array.isArray(manifest.plugins)) {
      plugins = Array.from(
        new Set(
          manifest.plugins
            .map((p: any) => p?.id)
            .filter((id: any) => typeof id === "string" && id.length)
        )
      );
      try {
        const catalogDirs = new Set<string>();
        for (const p of manifest.plugins) {
          const modPath = p?.ui?.module;
          if (typeof modPath === "string") {
            const m = modPath.match(/^\/plugins\/([^\/]+)\//);
            if (m) catalogDirs.add(m[1]);
          }
        }
        catalogDirs.add("library-component");
        catalogDirs.add("canvas-component");
        if (catalogDirs.size) {
          (conductor as any)._sequenceCatalogDirsFromManifest =
            Array.from(catalogDirs);
          plugins = Array.from(
            new Set([...(plugins || []), ...Array.from(catalogDirs)])
          );
        }
      } catch {}
    }
    try {
      const proc: any = (globalThis as any).process;
      if (proc && typeof proc.cwd === "function") {
        const fs = await import("fs/promises");
        const path = await import("path");
        const base = artifactsDir
          ? path.resolve(proc.cwd(), artifactsDir, "json-sequences")
          : path.join(proc.cwd(), "json-sequences");
        const entries = await fs.readdir(base).catch(() => [] as string[]);
        const seqDirs = entries.filter((e: string) => !e.startsWith("."));
        plugins = Array.from(new Set([...(plugins || []), ...seqDirs]));
      }
    } catch {}
  }
  (conductor as any)._discoveredPlugins = plugins;
  try { console.log('🧭 Catalog discovery plugins:', plugins); } catch {}

  const isTestEnv =
    typeof import.meta !== "undefined" && !!(import.meta as any).vitest;
  const forcedBrowser =
    typeof globalThis !== "undefined" &&
    (globalThis as any).__RENDERX_FORCE_BROWSER === true;
  const isBrowser =
    (forcedBrowser || !isTestEnv) &&
    typeof globalThis !== "undefined" &&
    typeof (globalThis as any).window !== "undefined" &&
    typeof (globalThis as any).document !== "undefined" &&
    typeof (globalThis as any).fetch === "function";

  type CatalogEntry = { file: string; handlersPath: string };
  type SequenceJson = {
    pluginId: string;
    id: string;
    name: string;
    movements: Array<{
      id: string;
      name?: string;
      beats: Array<{
        beat: number;
        event: string;
        title?: string;
        dynamics?: string;
        handler: string;
        timing?: string;
        kind?: string;
      }>;
    }>;
  };

  const seen = new Set<string>();
  const runtimeMounted: Set<string> =
    (conductor as any)._runtimeMountedSeqIds instanceof Set
      ? (conductor as any)._runtimeMountedSeqIds
      : new Set<string>(
          Array.isArray((conductor as any)._runtimeMountedSeqIds)
            ? (conductor as any)._runtimeMountedSeqIds
            : []
        );
  const mountFrom = async (seq: SequenceJson, handlersPath: string) => {
    try {
      // Only skip duplicates seen within this loader invocation.
      // If the runtime claims the sequence is already mounted, we still ensure
      // the plugin facade exists for LibraryComponentPlugin by attempting a mount.
      if (seen.has(seq.id)) {
        (conductor as any).logger?.warn?.(
          `Sequence ${seq.id} already processed in loader; skipping`
        );
        try { console.log('\u23ed\ufe0f Sequence already processed in loader; skipping:', seq?.id); } catch {}
        return;
      }
      const alreadyMountedByRuntime = runtimeMounted.has(seq.id);
      let spec = normalizeHandlersImportSpec(isBrowser, handlersPath);
      if (isBrowser && isBareSpecifier(handlersPath)) {
        try {
          spec = resolveModuleSpecifier(handlersPath);
        } catch {}
      }
      let mod: any = null;
      try {
        if (isBrowser && isBareSpecifier(handlersPath) && runtimePackageLoaders[handlersPath]) {
          try { console.log('\uD83D\uDD0D Using runtimePackageLoader for', handlersPath); } catch {}
          mod = await runtimePackageLoaders[handlersPath]!();
        }
      } catch {}
      // Try vendor symphony loader for deep handlersPath under @renderx-plugins/*/symphonies/**
      if (!mod) {
        try {
          if (isBrowser && isBareSpecifier(handlersPath) && /@renderx-plugins\/[^/]+\/symphonies\//.test(handlersPath)) {
            // @ts-ignore optional vendor loader not present in SDK builds
            const vendor = await import(/* @vite-ignore */ '../../vendor/vendor-symphony-loader');
            const loader = (vendor as any)?.getVendorSymphonyLoader?.(handlersPath);
            if (typeof loader === 'function') {
              try { console.log('\uD83D\uDD0D Using vendor symphony loader for', handlersPath); } catch {}
              mod = await loader();
            }
          }
        } catch {}
      }
      if (!mod) {
        try { console.log('\u21AA\uFE0F Dynamic importing handlers module via spec:', spec); } catch {}
        mod = await import(/* @vite-ignore */ spec as any);
      }
      const handlers = (mod as any)?.handlers || mod?.default?.handlers;
      if (!handlers) {
        (conductor as any).logger?.warn?.(
          `No handlers export found at ${handlersPath} for ${seq.id}`
        );
        try { console.log('\u26a0\ufe0f No handlers export found at', handlersPath, 'for', seq?.id); } catch {}
      }
      if (alreadyMountedByRuntime && seq.pluginId !== 'LibraryComponentPlugin') {
        try { console.log('\u23ed\ufe0f Sequence already mounted by runtime; skipping:', seq?.id); } catch {}
      } else {
        if (alreadyMountedByRuntime && seq.pluginId === 'LibraryComponentPlugin') {
          try { console.log('\ud83d\udd01 Forcing mount to ensure facade for LibraryComponentPlugin:', seq?.id); } catch {}
        }
        await (conductor as any)?.mount?.(seq, handlers, seq.pluginId);
        try { console.log('\u2705 Mounted sequence from catalog:', seq?.id, 'plugin:', seq?.pluginId); } catch {}
        try {
          runtimeMounted.add(seq.id);
          (conductor as any)._runtimeMountedSeqIds = runtimeMounted;
        } catch {}
      }
      seen.add(seq.id);
    } catch (e) {
      (conductor as any).logger?.warn?.(
        `Failed to mount sequence ${seq?.id} from ${handlersPath}: ${e}`
      );
      try { console.log('\u26a0\ufe0f Failed to mount sequence from catalog:', seq?.id, 'handlersPath:', handlersPath, 'error:', String(e)); } catch {}
    }
  };

  for (const plugin of plugins) {
    const dir =
      plugin === "CanvasComponentPlugin"
        ? "canvas-component"
        : plugin === "CanvasPlugin"
        ? "canvas-component"
        : plugin === "LibraryPlugin"
        ? "library"
        : plugin === "LibraryComponentPlugin"
        ? "library-component"
        : plugin === "ControlPanelPlugin"
        ? "control-panel"
        : plugin === "HeaderThemePlugin" ||
          plugin === "HeaderControlsPlugin" ||
          plugin === "HeaderTitlePlugin"
        ? "header"
        : plugin;
    try {
      try { console.log('📚 Loading catalog directory', dir, 'for plugin', plugin); } catch {}

      let entries: CatalogEntry[] = [];
      if (isBrowser) {
        try {
          const idxRes = await fetch(`/json-sequences/${dir}/index.json`);
          if (idxRes.ok) {
            const idxJson = await idxRes.json();
            entries = idxJson?.sequences || [];
          }
        } catch {}
      }
      if (!entries.length) {
        if (!isBrowser && artifactsDir) {
          try {
            const fs = await import("fs/promises");
            const path = await import("path");
            const procAny2: any = (globalThis as any).process;
            const cwd =
              procAny2 && typeof procAny2.cwd === "function"
                ? procAny2.cwd()
                : "";
            const idxPath = path.join(
              cwd,
              artifactsDir,
              "json-sequences",
              dir,
              "index.json"
            );
            const raw = await fs
              .readFile(idxPath, "utf-8")
              .catch(() => null as any);
            if (raw) {
              const idxJson = JSON.parse(raw || "{}");
              entries = idxJson?.sequences || [];
            }
          } catch {}
        }
        if (!entries.length && !artifactsDir) {
          // @ts-ignore raw JSON import
          const idxMod = await import(
            /* @vite-ignore */ `../../../json-sequences/${dir}/index.json?raw`
          );
          const idxText: string = (idxMod as any)?.default || (idxMod as any);
          const idxJson = JSON.parse(idxText || "{}");
          entries = idxJson?.sequences || [];
        }
      }
      try { console.log('📖 Catalog entries for', dir, ':', Array.isArray(entries) ? entries.length : 0); } catch {}

      const tasks = entries.map(async (ent) => {
        let seqJson: SequenceJson | null = null;
        if (isBrowser) {
          try {
            const filePath = ent.file.startsWith("/")
              ? ent.file
              : `/json-sequences/${dir}/${ent.file}`;
            try { console.log('[90m[1m[36mFetching sequence[0m', { dir, file: ent.file, url: filePath }); } catch {}
            const seqRes = await fetch(filePath);
            try { console.log('[90m[1m[36mFetch status[0m', { url: filePath, ok: seqRes.ok, status: seqRes.status }); } catch {}
            if (seqRes.ok) { seqJson = await seqRes.json(); try { console.log('[90m[1m[36mLoaded JSON for[0m', { id: (seqJson as any)?.id, pluginId: (seqJson as any)?.pluginId }); } catch {} }
          } catch (e) { try { console.log('[90m[1m[36mFetch error[0m', String(e)); } catch {} }
        }
        if (!seqJson && !isBrowser && artifactsDir) {
          try {
            const fs = await import("fs/promises");
            const path = await import("path");
            const procAny3: any = (globalThis as any).process;
            const cwd =
              procAny3 && typeof procAny3.cwd === "function"
                ? procAny3.cwd()
                : "";
            const seqPath = path.join(
              cwd,
              artifactsDir,
              "json-sequences",
              dir,
              ent.file
            );
            const raw = await fs
              .readFile(seqPath, "utf-8")
              .catch(() => null as any);
            if (raw) seqJson = JSON.parse(raw || "{}");
          } catch {}
        }
        if (!seqJson && !artifactsDir) {
          // @ts-ignore raw JSON import
          const seqMod = await import(
            /* @vite-ignore */ `../../../json-sequences/${dir}/${ent.file}?raw`
          );
          const seqText: string = (seqMod as any)?.default || (seqMod as any);
          seqJson = JSON.parse(seqText || "{}");
          try { console.log('\u2728 Fallback raw import used for', { dir, file: ent.file, id: (seqJson as any)?.id }); } catch {}
        }
        await mountFrom(seqJson as SequenceJson, ent.handlersPath);
      });
      await Promise.all(tasks);
    } catch (e) {
      (conductor as any).logger?.warn?.(
        `Failed to load catalog for ${plugin}: ${e}`
      );
    }
  }
}
