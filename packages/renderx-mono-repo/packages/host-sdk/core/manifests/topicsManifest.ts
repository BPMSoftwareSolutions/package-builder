// Topics manifest (migrated from src/topicsManifest.ts)
export interface TopicRoute { pluginId: string; sequenceId: string }
export interface TopicDef {
	routes: TopicRoute[];
	payloadSchema?: any;
	visibility?: 'public' | 'internal';
	correlationKeys?: string[];
	perf?: { throttleMs?: number; debounceMs?: number; dedupeWindowMs?: number };
	notes?: string;
}

let topics: Record<string, TopicDef> = {};
let loaded = false;

export type TopicsManifestProvider = {
	init?(): Promise<void>;
	getTopicDef(key: string): TopicDef | undefined;
	getTopicsMap?(): Record<string, TopicDef>;
	getStats?(): { loaded: boolean; topicCount: number };
};

let topicsProvider: TopicsManifestProvider | null = null;
export function setTopicsManifestProvider(p: TopicsManifestProvider) {
	topicsProvider = p;
	loaded = true;
}

async function loadTopics(): Promise<void> {
	try {
		const isBrowser = typeof globalThis !== 'undefined' && typeof (globalThis as any).fetch === 'function';
		if (isBrowser) {
			const res = await fetch('/topics-manifest.json');
			if (res.ok) {
				const json = await res.json();
				topics = (json as any)?.topics || {};
				loaded = true;
				return;
			}
		}
		// Node/tests fallback: use artifactsDir if provided by env helper
		try {
			const envMod = await import(/* @vite-ignore */ '../environment/env');
			const artifactsDir = (envMod as any).getArtifactsDir?.() || null;
			if (artifactsDir) {
				// @ts-ignore
				const fs = await import('fs/promises');
				// @ts-ignore
				const path = await import('path');
				const procAny: any = (globalThis as any).process;
				const cwd = procAny && typeof procAny.cwd === 'function' ? procAny.cwd() : '';
				const p = path.join(cwd, artifactsDir, 'topics-manifest.json');
				const raw = await fs.readFile(p, 'utf-8').catch(() => null as any);
				if (raw) { const json = JSON.parse(raw || '{}'); topics = (json as any)?.topics || {}; loaded = true; return; }
			}
		} catch {}
	} catch {}
	// Final fallback: empty set
	loaded = true;
}

export async function initTopicsManifest(): Promise<void> {
	if (topicsProvider?.init) { try { await topicsProvider.init(); } catch {} }
	if (!loaded && !topicsProvider) await loadTopics();
}

export function getTopicDef(key: string): TopicDef | undefined {
	if (topicsProvider) { try { return topicsProvider.getTopicDef(key); } catch {} }
	if (!loaded && !topicsProvider) { /* lazy kick */ loadTopics(); }
	return topics[key];
}

// test-only: allow injection of topics (maintain API)
export function __setTopics(map: Record<string, TopicDef>) {
	topics = map || {};
	loaded = true;
}

export function getTopicsManifestStats() {
	if (topicsProvider?.getStats) { try { return topicsProvider.getStats(); } catch {} }
	return { loaded, topicCount: Object.keys(topics).length };
}

// Expose full topics map for internal callers that need to analyze the manifest
// (kept out of public API surface; prefer getTopicDef for most use cases)
export function getTopicsMap(): Record<string, TopicDef> {
	if (topicsProvider?.getTopicsMap) { try { return topicsProvider.getTopicsMap(); } catch {} }
	return topics;
}
