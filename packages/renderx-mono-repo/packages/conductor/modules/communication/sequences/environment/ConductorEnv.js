/**
 * ConductorEnv - centralized environment detection and configuration
 *
 * Client apps can explicitly set environment before initializing the conductor:
 *   globalThis.__CONDUCTOR_ENV__ = { dev: true, mode: 'development' }
 * or
 *   import { setConductorEnv } from 'musical-conductor/.../ConductorEnv';
 *   setConductorEnv({ dev: true });
 */
let localEnv = null;
export function setConductorEnv(env) {
    localEnv = { ...(localEnv || {}), ...(env || {}) };
    try {
        const g = typeof globalThis !== 'undefined' ? globalThis : undefined;
        if (g) {
            g.__CONDUCTOR_ENV__ = { ...(g.__CONDUCTOR_ENV__ || {}), ...localEnv };
        }
    }
    catch { }
}
export function getConductorEnv() {
    try {
        if (localEnv)
            return localEnv;
        const g = typeof globalThis !== 'undefined' ? globalThis : undefined;
        const w = typeof window !== 'undefined' ? window : undefined;
        return ((g && g.__CONDUCTOR_ENV__) ||
            (w && w.__CONDUCTOR_ENV__) ||
            {});
    }
    catch {
        return {};
    }
}
export function isDevEnv() {
    // 0) Client-provided environment object takes precedence
    try {
        const ce = getConductorEnv();
        if (ce && (ce.dev === true || ce.mode === 'development'))
            return true;
    }
    catch { }
    // 1) Vite-style flags via import.meta.env
    try {
        const im = (0, eval)('import.meta');
        if (im && im.env) {
            if (im.env.DEV === true)
                return true;
            if (im.env.MODE === 'development')
                return true;
        }
    }
    catch { }
    // 2) Node env vars set by scripts or shells
    try {
        const env = (typeof process !== 'undefined' && process.env) || {};
        if (env.MC_DEV === '1' ||
            env.MC_DEV === 'true' ||
            env.NODE_ENV === 'development' ||
            env.npm_lifecycle_event === 'dev')
            return true;
    }
    catch { }
    // 3) Global toggles (browser or node)
    try {
        const g = typeof globalThis !== 'undefined' ? globalThis : undefined;
        if (g && (g.MC_DEV === true || g.MC_DEV === '1'))
            return true;
    }
    catch { }
    try {
        const w = typeof window !== 'undefined' ? window : undefined;
        if (w && w.MC_DEV)
            return true;
    }
    catch { }
    return false;
}
//# sourceMappingURL=ConductorEnv.js.map