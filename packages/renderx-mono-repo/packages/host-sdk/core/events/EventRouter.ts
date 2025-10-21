// EventRouter (migrated from src/EventRouter.ts)
import { getTopicDef, initTopicsManifest, type TopicRoute } from '../manifests/topicsManifest';
import { isFlagEnabled } from '../environment/feature-flags';
import { REPLAY_TOPICS, lastPayload } from './topic-replay-cache';


export type Unsubscribe = () => void;
export type TopicHandler = (payload: any) => void;

const subscribers = new Map<string, Set<TopicHandler>>();

function throttle(fn: Function, ms: number) {
	let last = 0; let pending: any = null;
	return (arg: any) => {
		const now = Date.now();
		if (now - last >= ms) { last = now; fn(arg); }
		else {
			pending = arg;
			setTimeout(() => {
				const n2 = Date.now();
				if (n2 - last >= ms && pending !== null) { last = n2; const p = pending; pending = null; fn(p); }
			}, ms - (now - last));
		}
	};
}

function debounce(fn: Function, ms: number) {
	let t: any = null; return (arg: any) => { if (t) clearTimeout(t); t = setTimeout(() => fn(arg), ms); }; }

const __publishStack: string[] = [];

export const EventRouter = {
	async init() { await initTopicsManifest(); },

	subscribe(topic: string, handler: TopicHandler): Unsubscribe {
		const set = subscribers.get(topic) || new Set<TopicHandler>();
		set.add(handler); subscribers.set(topic, set);
		try { if (REPLAY_TOPICS.has(topic) && lastPayload.has(topic)) { const payload = lastPayload.get(topic); Promise.resolve().then(() => { try { handler(payload); } catch {} }); } } catch {}
		return () => { const s = subscribers.get(topic); if (!s) return; s.delete(handler); if (s.size === 0) subscribers.delete(topic); };
	},

	async publish(topic: string, payload: any, conductor?: any) {
		if (typeof window !== 'undefined') {
			(window as any).__DEBUG_EVENTROUTER = (window as any).__DEBUG_EVENTROUTER || [];
			(window as any).__DEBUG_EVENTROUTER.push(`publish(${topic})`);
		}
		let def = getTopicDef(topic);
		if (!def && typeof window !== 'undefined') {
			const globalGetTopicDef = (window as any).RenderX?.getTopicDef;
			if (globalGetTopicDef) {
				def = globalGetTopicDef(topic);
				if (typeof window !== 'undefined') (window as any).__DEBUG_EVENTROUTER.push(`used_global_getTopicDef(${topic}): ${!!def}`);
				try { console.log(`[EventRouter] Used global getTopicDef for '${topic}', found: ${!!def}`); } catch {}
			}
		}
		if (!def) { if (typeof window !== 'undefined') (window as any).__DEBUG_EVENTROUTER.push(`no_topic_def(${topic})`); try { console.warn(`[EventRouter] No topic definition found for '${topic}'`); } catch {}; throw new Error(`Unknown topic: ${topic}`); }
		if (typeof window !== 'undefined') (window as any).__DEBUG_EVENTROUTER.push(`found_topic_def(${topic}): routes=${def.routes?.length || 0}`);
		try { console.log(`[EventRouter] Topic '${topic}' definition:`, { routes: def.routes?.length || 0, hasThrottle: !!(def.perf?.throttleMs), hasDebounce: !!(def.perf?.debounceMs) }); } catch {}
		if (__publishStack.includes(topic)) { try { console.warn(`[topics] Blocking immediate republish of '${topic}' to prevent feedback loop`); } catch {}; return; }
		try {
			if (isFlagEnabled('lint.topics.runtime-validate') && def.payloadSchema) {
				const AjvMod: any = await import('ajv');
				const Ajv: any = AjvMod?.default || AjvMod; const ajv: any = new Ajv({ allErrors: true });
				const validate: any = ajv.compile(def.payloadSchema as any);
				if (!validate(payload)) {
					const errs: any[] = (validate.errors || []) as any[];
						const msg = errs.map((e: any) => `${(e.instancePath || e.dataPath || '')} ${(e.message || '')}`.trim()).join('; ');
						throw new Error(`Payload validation failed for ${topic}: ${msg}`);
				}
			}
		} catch {}
		const resolvedConductor = (conductor && typeof conductor.play === 'function') ? conductor : (typeof window !== 'undefined' ? ((window as any).RenderX?.conductor || (window as any).renderxCommunicationSystem?.conductor) : undefined);
		try {
			const cid = (resolvedConductor as any)?.__rxId;
			const gid = (typeof window !== 'undefined') ? ((window as any).RenderX?.conductor as any)?.__rxId : undefined;
			console.log(`[EventRouter] resolvedConductor id=${cid} (global id=${gid}) for '${topic}'`);
		} catch {}
		let deliver = async (p: any) => {
			if (typeof window !== 'undefined') (window as any).__DEBUG_EVENTROUTER.push(`deliver_start(${topic}): routes=${def.routes?.length || 0}`);
			try { console.log(`[EventRouter] Starting delivery for '${topic}' with ${def.routes?.length || 0} routes`); } catch {}
			for (const r of def.routes as TopicRoute[]) {
				if (typeof window !== 'undefined') (window as any).__DEBUG_EVENTROUTER.push(`routing_to: ${r.pluginId}::${r.sequenceId}`);
				try { const hasPlay = !!(resolvedConductor && typeof resolvedConductor.play === 'function'); try { console.log(`[topics] Routing '${topic}' -> ${r.pluginId}::${r.sequenceId} (hasPlay=${hasPlay})`); } catch {}; await resolvedConductor?.play?.(r.pluginId, r.sequenceId, p); if (typeof window !== 'undefined') (window as any).__DEBUG_EVENTROUTER.push(`routed_success: ${r.pluginId}::${r.sequenceId}`); } catch (e) { if (typeof window !== 'undefined') (window as any).__DEBUG_EVENTROUTER.push(`route_error: ${r.pluginId}::${r.sequenceId} - ${e}`); try { console.warn(`[topics] Failed to route '${topic}' -> ${r.pluginId}::${r.sequenceId}:`, e); } catch {} }
			}
			try { if (REPLAY_TOPICS.has(topic)) lastPayload.set(topic, p); } catch {}
			const set = subscribers.get(topic); if (set) for (const h of Array.from(set)) try { h(p); } catch {}
		};
		const perf = def.perf || {};
		if (typeof perf.throttleMs === 'number' && perf.throttleMs > 0) { const d = deliver; const t = throttle((x: any) => d(x), perf.throttleMs); t(payload); return; }
		if (typeof perf.debounceMs === 'number' && perf.debounceMs > 0) { const d = deliver; const f = debounce((x: any) => d(x), perf.debounceMs); f(payload); return; }
		__publishStack.push(topic); try { await deliver(payload); } finally { __publishStack.pop(); }
	},

	reset() { try { subscribers.clear(); lastPayload.clear(); __publishStack.length = 0; } catch {} },
};
