// Startup validation & lightweight artifact integrity helpers.
// Migrated from src/startupValidation.ts during Phase 2 refactor.

export type StartupStatsProvider = {
	getPluginManifestStats(): Promise<{ pluginCount: number }>;
	verifyArtifactsIntegrity?(devOnly?: boolean): Promise<null> | null;
};

let startupProvider: StartupStatsProvider | null = null;
export function setStartupStatsProvider(p: StartupStatsProvider) { startupProvider = p; }

// Lightweight manifest presence & counts for host startup logging
export async function getPluginManifestStats() {
	if (startupProvider) { try { return await startupProvider.getPluginManifestStats(); } catch {} }
	try {
		const isBrowser = typeof window !== 'undefined' && typeof (globalThis as any).fetch === 'function';
		let json: any = null;
		if (isBrowser) {
			const res = await fetch('/plugins/plugin-manifest.json');
			if (res.ok) json = await res.json();
		}
		if (!json) {
			// External artifacts dir (env) first
			try {
				const envMod = await import(/* @vite-ignore */ '../environment/env');
				const artifactsDir = (envMod as any).getArtifactsDir?.();
				if (artifactsDir) {
					// @ts-ignore
					const fs = await import('fs/promises');
					// @ts-ignore
					const path = await import('path');
					const procAny: any = (globalThis as any).process;
					const cwd = procAny && typeof procAny.cwd === 'function' ? procAny.cwd() : '';
					const p = path.join(cwd, artifactsDir, 'plugins', 'plugin-manifest.json');
					const raw = await fs.readFile(p, 'utf-8').catch(() => null as any);
					if (raw) json = JSON.parse(raw || '{}');
				}
			} catch {}
			// No raw import fallback when consumed from node_modules; rely on host-served artifacts only.
		}
		const plugins = Array.isArray(json?.plugins) ? json.plugins : [];
		return { pluginCount: plugins.length };
	} catch (e) {
		console.warn('[startupValidation] Failed reading plugin-manifest.json', e);
		return { pluginCount: 0 };
	}
}

// Optional integrity check (dev only) – integrity file must be served from site root or copied to public
export async function verifyArtifactsIntegrity(devOnly = true) {
	if (startupProvider?.verifyArtifactsIntegrity) { try { return await startupProvider.verifyArtifactsIntegrity(devOnly); } catch {} }
	try {
		// @ts-ignore
		if (devOnly && typeof process !== 'undefined' && process.env?.NODE_ENV === 'production') return null;
		// @ts-ignore
		if (typeof process !== 'undefined' && process.env?.RENDERX_DISABLE_INTEGRITY === '1') return null;
		let json: any = null;
		let mode: 'browser' | 'node-fs' | 'none' = 'none';
		try {
			const res = await fetch('/artifacts.integrity.json');
			if (res.ok) {
				json = await res.json();
				mode = 'browser';
			}
		} catch {}
		if (!json) {
			try {
				// @ts-ignore
				const fs = await import('fs/promises');
				// @ts-ignore
				const path = await import('path');
				let artifactsDir: string | null = null;
				try { const envMod = await import(/* @vite-ignore */ '../environment/env'); artifactsDir = (envMod as any).getArtifactsDir?.() || null; } catch {}
				const procAny: any = (globalThis as any).process;
				const cwd = procAny && typeof procAny.cwd === 'function' ? procAny.cwd() : '';
				const integrityFile = artifactsDir ? path.join(cwd, artifactsDir, 'artifacts.integrity.json') : path.join(cwd, 'dist', 'artifacts', 'artifacts.integrity.json');
				const rawTxt = await fs.readFile(integrityFile, 'utf-8').catch(() => null as any);
				if (rawTxt) {
					json = JSON.parse(rawTxt);
					mode = 'node-fs';
				}
			} catch {}
		}
		if (!json) return null;
		const entries = Object.entries(json.files || {});
		if (!entries.length) return null;
		const failed: string[] = [];
		if (mode === 'browser') {
			for (const [file, metaAny] of entries) {
				try {
					const r = await fetch('/' + file);
					if (!r.ok) continue;
					const txt = await r.text();
					const buf = new TextEncoder().encode(txt);
					const digest = await crypto.subtle.digest('SHA-256', buf);
					const hex = Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, '0')).join('');
					const expected = (metaAny as any).hash;
					if (hex !== expected) failed.push(file);
				} catch {}
			}
		} else if (mode === 'node-fs') {
			try {
				// @ts-ignore
				const fs = await import('fs/promises');
				// @ts-ignore
				const path = await import('path');
				let artifactsDir: string | null = null;
				try { const envMod = await import(/* @vite-ignore */ '../environment/env'); artifactsDir = (envMod as any).getArtifactsDir?.() || null; } catch {}
				const procAny: any = (globalThis as any).process;
				const cwd = procAny && typeof procAny.cwd === 'function' ? procAny.cwd() : '';
				const base = artifactsDir ? path.join(cwd, artifactsDir) : path.join(cwd, 'dist', 'artifacts');
				for (const [file, metaAny] of entries) {
					try {
						const filePath = path.join(base, file);
						const txt = await fs.readFile(filePath, 'utf-8');
						const buf = new TextEncoder().encode(txt);
						const digest = await crypto.subtle.digest('SHA-256', buf);
						const hex = Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, '0')).join('');
						const expected = (metaAny as any).hash;
						if (hex !== expected) failed.push(file);
					} catch {}
				}
			} catch {}
		}
		if (failed.length) console.warn('⚠️ Artifact integrity mismatch:', failed, '(mode:', mode, ')');
		else console.log('✅ Artifact integrity verified:', entries.length, 'files', '(mode:', mode, ')');
	} catch {}
	return null;
}
