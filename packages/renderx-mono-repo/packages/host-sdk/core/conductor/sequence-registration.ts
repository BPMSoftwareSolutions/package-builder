// Sequence registration (migrated from src/conductor.ts)
import { runtimePackageLoaders, loadJsonSequenceCatalogs } from './runtime-loaders';
import { resolveModuleSpecifier } from './conductor';

export type ConductorClient = any; // local alias

let registrationInProgress = false;
let registrationComplete = false;

// Shared readiness promise that resolves exactly once when registration completes
let registrationResolve: (() => void) | null = null;
let registrationPromise: Promise<void> | null = null;

export function isPluginsReady(): boolean {
	return registrationComplete === true;
}

export function whenPluginsReady(): Promise<void> {
	if (registrationComplete) return Promise.resolve();
	if (!registrationPromise) {
		registrationPromise = new Promise<void>((resolve) => {
			registrationResolve = resolve;
		});
	}
	return registrationPromise;
}

export async function registerAllSequences(conductor: ConductorClient) {
	// Prevent multiple simultaneous registrations
	// Global/HMR-safe guard: if a prior registration completed in this session, skip
	try {
		if (typeof globalThis !== 'undefined' && (globalThis as any).__RENDERX_PLUGINS_READY === true) {
			console.log('✅ Plugins already ready (global flag), skipping registration');
			return;
		}
	} catch {}
	if (registrationInProgress) {
		console.log('🔄 Registration already in progress, skipping...');
		return;
	}
	if (registrationComplete) {
		console.log('✅ Registration already complete, skipping...');
		return;
	}

	registrationInProgress = true;
	console.log('🚀 Starting plugin registration...');
	// 1) Discover runtime registration modules via plugin manifest (ui + optional runtime section)
	let manifest: any = null;
	try {
		const isBrowser = typeof window !== 'undefined' && typeof (globalThis as any).fetch === 'function';
		if (isBrowser) {
			try { const res = await fetch('/plugins/plugin-manifest.json'); if (res.ok) manifest = await res.json(); } catch {}
		}
		if (!manifest) {
			try {
				const envMod = await import(/* @vite-ignore */ '../environment/env');
				const artifactsDir2 = (envMod as any).getArtifactsDir?.();
				if (artifactsDir2) {
					try {
						const fs = await import('fs/promises');
						const path = await import('path');
						const procAny4: any = (globalThis as any).process;
						const cwd = procAny4 && typeof procAny4.cwd === 'function' ? procAny4.cwd() : '';
						const p = path.join(cwd, artifactsDir2, 'plugins', 'plugin-manifest.json');
						const raw = await fs.readFile(p, 'utf-8').catch(()=>null as any);
						if (raw) manifest = JSON.parse(raw || '{}');
					} catch {}
				}
			} catch {}
			if (!manifest) {
				try {
					// @ts-ignore raw JSON import fallback
					const mod = await import(/* @vite-ignore */ '../../../public/plugins/plugin-manifest.json?raw');
					const txt: string = (mod as any)?.default || (mod as any) || '{}';
					manifest = JSON.parse(txt);
				} catch {}
			}
		}
	} catch { manifest = { plugins: [] }; }
	const plugins = Array.isArray(manifest.plugins) ? manifest.plugins : [];

	// 2) Register runtime modules (prioritize certain ids)
	const prioritized = plugins.slice().sort((a: any, b: any) => {
		const prio = (x: any) => (x?.id === 'LibraryComponentPlugin' || x?.id === 'CanvasComponentPlugin') ? 1 : 0;
		return prio(b) - prio(a);
	});
	for (const p of prioritized) {
		const runtime = p.runtime;
		if (!runtime || !runtime.module || !runtime.export) continue;
		try {
			const isTestEnv = typeof import.meta !== 'undefined' && !!(import.meta as any).vitest;
			const forceLibraryResolutionError = isTestEnv && typeof globalThis !== 'undefined' && (globalThis as any).__RENDERX_FORCE_LIBRARY_RESOLUTION_ERROR === true;
			if (forceLibraryResolutionError && runtime.module === '@renderx-plugins/library') {
				throw new TypeError("Failed to resolve module specifier '@renderx-plugins/library'");
			}
			const loader = runtimePackageLoaders[runtime.module];
			const mod = loader ? await loader() : await import(/* @vite-ignore */ resolveModuleSpecifier(runtime.module));
			console.log('🔌 Registered plugin runtime:', p.id);
			const reg = (mod as any)?.[runtime.export] || (mod as any)?.default?.[runtime.export];
			if (typeof reg === 'function') { await reg(conductor); }
		} catch (e) { console.warn('⚠️ Failed runtime register for', p.id, e); }
	}

	// 3) Mount sequences from JSON catalogs
	await loadJsonSequenceCatalogs(conductor);

	// 3b) Fallback for library-component only if specific sequences are missing
	try {
		const isBrowser = typeof window !== 'undefined' && typeof (globalThis as any).fetch === 'function';
		if (isBrowser) {
			const seqSet = (conductor as any)._runtimeMountedSeqIds;
			const seqIds = Array.isArray(seqSet) ? seqSet : (seqSet instanceof Set ? Array.from(seqSet) : []);
			const required = ['library-component-drag-symphony', 'library-component-drop-symphony', 'library-component-container-drop-symphony'];
			const missing = required.filter(id => !seqIds.includes(id));
			if (missing.length) {
				try {
					const spec = resolveModuleSpecifier('@renderx-plugins/library-component');
					const mod: any = await import(/* @vite-ignore */ spec as any);
					const handlers = (mod as any)?.handlers || mod?.default?.handlers;
					if (handlers) {
						const pull = async (file: string) => { try { const r = await fetch(`/json-sequences/library-component/${file}`); if (r.ok) return await r.json(); } catch {}; return null; };
						const files = [
							{ id: 'library-component-drag-symphony', file: 'drag.json' },
							{ id: 'library-component-drop-symphony', file: 'drop.json' },
							{ id: 'library-component-container-drop-symphony', file: 'container.drop.json' }
						];
						for (const f of files) {
							if (!seqIds.includes(f.id)) {
								const s = await pull(f.file);
								if (s) { try { await (conductor as any).mount?.(s, handlers, s.pluginId); } catch {} }
							}
						}
					}
				} catch {}
			}
		}
	} catch {}

	// 4) Debug logs
	try {
		const ids = (conductor as any).getMountedPluginIds?.() || [];
		console.log('🔎 Mounted plugin IDs after registration:', ids);
		for (const id of ids) { try { console.log('Plugin mounted successfully:', id); } catch {} }
	} catch {}

	registrationInProgress = false;
	registrationComplete = true;

	// Expose a browser-friendly readiness signal for tests and host UIs
	try {
		const ids = (conductor as any).getMountedPluginIds?.() || [];
		const seqSet = (conductor as any)._runtimeMountedSeqIds;
		const seqIds = Array.isArray(seqSet)
			? seqSet
			: (seqSet instanceof Set ? Array.from(seqSet) : []);
		(globalThis as any).__RENDERX_PLUGINS_READY = true;
		(globalThis as any).__RENDERX_MOUNTED_PLUGIN_IDS = ids;
		(globalThis as any).__RENDERX_MOUNTED_SEQUENCE_IDS = seqIds;
		const w: any = typeof window !== 'undefined' ? window : null;
		if (w && typeof w.dispatchEvent === 'function' && typeof (w as any).CustomEvent === 'function') {
			w.dispatchEvent(new CustomEvent('renderx:plugins:ready', { detail: { pluginIds: ids, sequenceIds: seqIds } }));
		}
	} catch {}

	// Resolve readiness promise
	try { if (registrationResolve) { registrationResolve(); registrationResolve = null; } } catch {}
	console.log('✅ Plugin registration complete!');
}
