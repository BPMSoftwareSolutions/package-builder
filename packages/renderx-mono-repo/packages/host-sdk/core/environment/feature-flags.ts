// Feature flags canonical location (migrated from src/feature-flags/flags.ts)
// Lightweight runtime evaluation with optional test overrides.

// @ts-ignore optional JSON not present in SDK builds
import flagsJson from '../../../data/feature-flags.json' with { type: 'json' };

export type FlagStatus = 'on' | 'off' | 'experiment';

export interface FlagMeta {
	status: FlagStatus;
	created: string; // ISO date
	verified?: string; // ISO date
	description?: string;
	owner?: string;
}

const FLAGS: Record<string, FlagMeta> = flagsJson as any;

// Optional test overrides for enablement decisions
let enableOverrides = new Map<string, boolean>();

// Simple usage log collector for tests and local debugging
const usageLog: Array<{ id: string; when: number }> = [];

export function isFlagEnabled(id: string): boolean {
	if (enableOverrides.has(id)) {
		const v = enableOverrides.get(id)!;
		usageLog.push({ id, when: Date.now() });
		return v;
	}
	const meta = FLAGS[id];
	usageLog.push({ id, when: Date.now() });
	if (!meta) return false;
	return meta.status === 'on' || meta.status === 'experiment';
}

export function getFlagMeta(id: string): FlagMeta | undefined {
	return FLAGS[id];
}

export function getAllFlags(): Record<string, FlagMeta> {
	return { ...FLAGS };
}

export function getUsageLog() {
	return [...usageLog];
}

// Test-only helpers (no side effects in production code paths)
export function setFlagOverride(id: string, enabled: boolean) {
	enableOverrides.set(id, enabled);
}

export function clearFlagOverrides() {
	enableOverrides.clear();
}
