// Physical move of original conductor implementation (was at src/conductor.ts)
// Conductor core (migrated & split from src/conductor.ts)
import { isBareSpecifier } from '../infrastructure/handlers/handlersPath';
import { isFlagEnabled } from '../environment/feature-flags';
import { getTopicsMap } from '../manifests/topicsManifest';

// Resolve dynamic module specifiers (bare package names, paths, URLs) to importable URLs
function resolveModuleSpecifier(spec: string): string {
	try { const resolver: any = (import.meta as any).resolve; if (typeof resolver === 'function') { const r = resolver(spec); if (typeof r === 'string' && r) return r; } } catch {}
	try { const env: any = (import.meta as any).env; if (env && env.DEV && isBareSpecifier(spec)) { return '/@id/' + spec; } } catch {}
	return spec;
}

export type ConductorClient = any;

export async function initConductor(): Promise<ConductorClient> {
	const { initializeCommunicationSystem } = await import('musical-conductor');
	const { conductor } = initializeCommunicationSystem();
	// Tag the conductor instance for identity tracing across the app/tests
	try { (conductor as any).__rxId = (conductor as any).__rxId || `rxc-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`; console.log(`[conductor] init id=${(conductor as any).__rxId}`); } catch {}
	const { EventRouter } = await import('../events/EventRouter');
	(window as any).renderxCommunicationSystem = { conductor, eventRouter: EventRouter };
	(window as any).RenderX = (window as any).RenderX || {}; (window as any).RenderX.conductor = conductor;
	try {
		if (isFlagEnabled('lint.topics.warn-direct-invocation')) {
			const topics: any = getTopicsMap();
			const reverse = new Map<string, string[]>();
			for (const [topic, def] of Object.entries(topics)) {
				if (!topic.endsWith('.requested')) continue; const routes = (def as any)?.routes || [];
				for (const r of routes as any[]) { const key = `${(r as any).pluginId}::${(r as any).sequenceId}`; const list = reverse.get(key) || []; list.push(topic as string); reverse.set(key, list); }
			}
			const orig = (conductor as any).play?.bind(conductor);
			if (typeof orig === 'function') {
				(conductor as any).play = (pid: string, sid: string, payload: any) => { try { const hits = reverse.get(`${pid}::${sid}`); if (hits && hits.length) { console.warn(`[topics] Direct conductor.play(${pid}, ${sid}) used; prefer EventRouter.publish(${hits.join(', ')}).`); } } catch {} return orig(pid, sid, payload); };
			}
		}
	} catch {}
	return conductor as ConductorClient;
}

// Exported for reuse in split files
export { resolveModuleSpecifier };
