// Environment helpers for external artifacts consumption.
// Canonical location after Phase 2 refactor (migrated from src/env.ts)
// Prefer HOST_ARTIFACTS_DIR (new) then ARTIFACTS_DIR (legacy) then Vite env var.

export function getArtifactsDir(): string | null {
	try {
		// @ts-ignore process may be undefined in browser
		if (typeof process !== 'undefined' && (process as any)?.env) {
			// @ts-ignore
			const dir = (process as any).env.HOST_ARTIFACTS_DIR || (process as any).env.ARTIFACTS_DIR;
			if (dir) return dir as string;
		}
	} catch {}
	try {
		// @ts-ignore
		const viteVar = (import.meta as any)?.env?.VITE_ARTIFACTS_DIR;
		if (viteVar) return viteVar;
	} catch {}
	return null;
}

export function artifactsEnabled(): boolean {
	return !!getArtifactsDir();
}
