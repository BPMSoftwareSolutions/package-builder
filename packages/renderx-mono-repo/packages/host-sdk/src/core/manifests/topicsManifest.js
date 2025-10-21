let topics = {};
let loaded = false;
let topicsProvider = null;
export function setTopicsManifestProvider(p) {
    topicsProvider = p;
    loaded = true;
}
async function loadTopics() {
    try {
        const isBrowser = typeof globalThis !== 'undefined' && typeof globalThis.fetch === 'function';
        if (isBrowser) {
            const res = await fetch('/topics-manifest.json');
            if (res.ok) {
                const json = await res.json();
                topics = json?.topics || {};
                loaded = true;
                return;
            }
        }
        // Node/tests fallback: use artifactsDir if provided by env helper
        try {
            const envMod = await import(/* @vite-ignore */ '../environment/env');
            const artifactsDir = envMod.getArtifactsDir?.() || null;
            if (artifactsDir) {
                // @ts-ignore
                const fs = await import('fs/promises');
                // @ts-ignore
                const path = await import('path');
                const procAny = globalThis.process;
                const cwd = procAny && typeof procAny.cwd === 'function' ? procAny.cwd() : '';
                const p = path.join(cwd, artifactsDir, 'topics-manifest.json');
                const raw = await fs.readFile(p, 'utf-8').catch(() => null);
                if (raw) {
                    const json = JSON.parse(raw || '{}');
                    topics = json?.topics || {};
                    loaded = true;
                    return;
                }
            }
        }
        catch { }
    }
    catch { }
    // Final fallback: empty set
    loaded = true;
}
export async function initTopicsManifest() {
    if (topicsProvider?.init) {
        try {
            await topicsProvider.init();
        }
        catch { }
    }
    if (!loaded && !topicsProvider)
        await loadTopics();
}
export function getTopicDef(key) {
    if (topicsProvider) {
        try {
            return topicsProvider.getTopicDef(key);
        }
        catch { }
    }
    if (!loaded && !topicsProvider) { /* lazy kick */
        loadTopics();
    }
    return topics[key];
}
// test-only: allow injection of topics (maintain API)
export function __setTopics(map) {
    topics = map || {};
    loaded = true;
}
export function getTopicsManifestStats() {
    if (topicsProvider?.getStats) {
        try {
            return topicsProvider.getStats();
        }
        catch { }
    }
    return { loaded, topicCount: Object.keys(topics).length };
}
// Expose full topics map for internal callers that need to analyze the manifest
// (kept out of public API surface; prefer getTopicDef for most use cases)
export function getTopicsMap() {
    if (topicsProvider?.getTopicsMap) {
        try {
            return topicsProvider.getTopicsMap();
        }
        catch { }
    }
    return topics;
}
//# sourceMappingURL=topicsManifest.js.map