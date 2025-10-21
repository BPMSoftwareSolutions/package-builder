/**
 * ConductorEnv - centralized environment detection and configuration
 *
 * Client apps can explicitly set environment before initializing the conductor:
 *   globalThis.__CONDUCTOR_ENV__ = { dev: true, mode: 'development' }
 * or
 *   import { setConductorEnv } from 'musical-conductor/.../ConductorEnv';
 *   setConductorEnv({ dev: true });
 */

export type ConductorEnvironment = {
  dev?: boolean;
  mode?: string;
  flags?: Record<string, any>;
};

let localEnv: ConductorEnvironment | null = null;

export function setConductorEnv(env: ConductorEnvironment): void {
  localEnv = { ...(localEnv || {}), ...(env || {}) };
  try {
    const g: any = typeof globalThis !== 'undefined' ? (globalThis as any) : undefined;
    if (g) {
      g.__CONDUCTOR_ENV__ = { ...(g.__CONDUCTOR_ENV__ || {}), ...localEnv };
    }
  } catch {}
}

export function getConductorEnv(): ConductorEnvironment {
  try {
    if (localEnv) return localEnv;
    const g: any = typeof globalThis !== 'undefined' ? (globalThis as any) : undefined;
    const w: any = typeof window !== 'undefined' ? (window as any) : undefined;
    return (
      (g && g.__CONDUCTOR_ENV__) ||
      (w && w.__CONDUCTOR_ENV__) ||
      {}
    );
  } catch {
    return {};
  }
}

export function isDevEnv(): boolean {
  // 0) Client-provided environment object takes precedence
  try {
    const ce = getConductorEnv();
    if (ce && (ce.dev === true || ce.mode === 'development')) return true;
  } catch {}

  // 1) Vite-style flags via import.meta.env
  try {
    const im: any = (0, eval)('import.meta');
    if (im && im.env) {
      if (im.env.DEV === true) return true;
      if (im.env.MODE === 'development') return true;
    }
  } catch {}

  // 2) Node env vars set by scripts or shells
  try {
    const env = (typeof process !== 'undefined' && (process as any).env) || {};
    if (
      env.MC_DEV === '1' ||
      env.MC_DEV === 'true' ||
      env.NODE_ENV === 'development' ||
      env.npm_lifecycle_event === 'dev'
    )
      return true;
  } catch {}

  // 3) Global toggles (browser or node)
  try {
    const g: any = typeof globalThis !== 'undefined' ? (globalThis as any) : undefined;
    if (g && (g.MC_DEV === true || g.MC_DEV === '1')) return true;
  } catch {}
  try {
    const w: any = typeof window !== 'undefined' ? (window as any) : undefined;
    if (w && w.MC_DEV) return true;
  } catch {}

  return false;
}

