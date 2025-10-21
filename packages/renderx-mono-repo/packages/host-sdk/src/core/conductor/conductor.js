// Physical move of original conductor implementation (was at src/conductor.ts)
// Conductor core (migrated & split from src/conductor.ts)
import { isBareSpecifier } from '../infrastructure/handlers/handlersPath';
import { isFlagEnabled } from '../environment/feature-flags';
import { getTopicsMap } from '../manifests/topicsManifest';
// Resolve dynamic module specifiers (bare package names, paths, URLs) to importable URLs
function resolveModuleSpecifier(spec) {
    try {
        const resolver = import.meta.resolve;
        if (typeof resolver === 'function') {
            const r = resolver(spec);
            if (typeof r === 'string' && r)
                return r;
        }
    }
    catch { }
    try {
        const env = import.meta.env;
        if (env && env.DEV && isBareSpecifier(spec)) {
            return '/@id/' + spec;
        }
    }
    catch { }
    return spec;
}
export async function initConductor() {
    const { initializeCommunicationSystem } = await import('musical-conductor');
    const { conductor } = initializeCommunicationSystem();
    // Tag the conductor instance for identity tracing across the app/tests
    try {
        conductor.__rxId = conductor.__rxId || `rxc-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
        console.log(`[conductor] init id=${conductor.__rxId}`);
    }
    catch { }
    const { EventRouter } = await import('../events/EventRouter');
    window.renderxCommunicationSystem = { conductor, eventRouter: EventRouter };
    window.RenderX = window.RenderX || {};
    window.RenderX.conductor = conductor;
    try {
        if (isFlagEnabled('lint.topics.warn-direct-invocation')) {
            const topics = getTopicsMap();
            const reverse = new Map();
            for (const [topic, def] of Object.entries(topics)) {
                if (!topic.endsWith('.requested'))
                    continue;
                const routes = def?.routes || [];
                for (const r of routes) {
                    const key = `${r.pluginId}::${r.sequenceId}`;
                    const list = reverse.get(key) || [];
                    list.push(topic);
                    reverse.set(key, list);
                }
            }
            const orig = conductor.play?.bind(conductor);
            if (typeof orig === 'function') {
                conductor.play = (pid, sid, payload) => { try {
                    const hits = reverse.get(`${pid}::${sid}`);
                    if (hits && hits.length) {
                        console.warn(`[topics] Direct conductor.play(${pid}, ${sid}) used; prefer EventRouter.publish(${hits.join(', ')}).`);
                    }
                }
                catch { } return orig(pid, sid, payload); };
            }
        }
    }
    catch { }
    return conductor;
}
// Exported for reuse in split files
export { resolveModuleSpecifier };
//# sourceMappingURL=conductor.js.map