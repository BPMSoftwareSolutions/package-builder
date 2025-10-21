// Environment helpers for external artifacts consumption.
// Canonical location after Phase 2 refactor (migrated from src/env.ts)
// Prefer HOST_ARTIFACTS_DIR (new) then ARTIFACTS_DIR (legacy) then Vite env var.
export function getArtifactsDir() {
    try {
        // @ts-ignore process may be undefined in browser
        if (typeof process !== 'undefined' && process?.env) {
            // @ts-ignore
            const dir = process.env.HOST_ARTIFACTS_DIR || process.env.ARTIFACTS_DIR;
            if (dir)
                return dir;
        }
    }
    catch { }
    try {
        // @ts-ignore
        const viteVar = import.meta?.env?.VITE_ARTIFACTS_DIR;
        if (viteVar)
            return viteVar;
    }
    catch { }
    return null;
}
export function artifactsEnabled() {
    return !!getArtifactsDir();
}
//# sourceMappingURL=env.js.map