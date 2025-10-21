// Runtime JS version of manifest tools for Node scripts

export function buildInteractionManifest(catalogs, componentOverrideMaps) {
  const routes = {};
  for (const cat of catalogs || []) {
    const r = (cat && cat.routes) || {};
    for (const k of Object.keys(r)) routes[k] = r[k];
  }
  for (const o of componentOverrideMaps || []) {
    for (const k of Object.keys(o || {})) routes[k] = o[k];
  }
  return { version: '1.0.0', routes };
}

export function buildTopicsManifest(catalogs) {
  const topics = {};
  for (const cat of catalogs || []) {
    const t = (cat && cat.topics) || {};
    for (const key of Object.keys(t)) {
      const def = t[key] || {};
      const routes = [];
      if (def.route) routes.push(def.route);
      if (Array.isArray(def.routes)) routes.push(...def.routes);
      topics[key] = {
        routes,
        payloadSchema: def.payloadSchema || null,
        visibility: def.visibility || 'public',
        correlationKeys: Array.isArray(def.correlationKeys) ? def.correlationKeys : [],
        perf: def.perf || {},
        notes: def.notes || ''
      };
    }
  }
  return { version: '1.0.0', topics };
}
