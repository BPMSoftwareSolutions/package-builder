/* Inlined host-side component inventory aggregator (Phase 2) formerly at src/inventory/index.ts
 * Exposes minimal APIs per ADR-0026:
 *  - listComponents(): Promise<ComponentDetail[]>
 *  - getComponentById(id: string): Promise<ComponentDetail | undefined>
 *  - onInventoryChanged(cb): () => void (no-op dev watcher for now)
 *
 * Dev/runtime behavior:
 *  - Browser: fetch from /json-components/index.json and each component JSON under /json-components/<file>
 *  - Node/test: read from repo-local json-components directory using fs
 */

export type ComponentDetail = any; // JSON component object shape (kept flexible)

function isBrowserLike(): boolean {
	try {
		return typeof window !== 'undefined' && typeof (window as any).document !== 'undefined';
	} catch {
		return false;
	}
}

export async function listComponents(): Promise<ComponentDetail[]> {
	const attachId = (obj: any) => ({ ...obj, id: obj?.id ?? obj?.metadata?.type });
	if (isBrowserLike()) {
		// Browser/dev path: fetch from public json-components
		const idxResp = await fetch('/json-components/index.json');
		if (!idxResp.ok) return [];
		const idx = await idxResp.json();
		const files: string[] = idx?.components || [];
		const results: ComponentDetail[] = [];
		for (const f of files) {
			try {
				const r = await fetch(`/json-components/${f}`);
				if (!r.ok) continue;
				const json = await r.json();
				results.push(attachId(json));
			} catch {}
		}
		return results;
	}
	// Node/test path: read from repo json-components dir
	try {
		const { readFile } = await import('node:fs/promises');
		const path = await import('node:path');
		const root = process.cwd();
		const idxPath = path.resolve(root, 'json-components', 'index.json');
		const idxRaw = await readFile(idxPath, 'utf8');
		const idx = JSON.parse(idxRaw);
		const files: string[] = idx?.components || [];
		const results: ComponentDetail[] = [];
		for (const f of files) {
			try {
				const p = path.resolve(root, 'json-components', f);
				const raw = await readFile(p, 'utf8');
				const json = JSON.parse(raw);
				results.push(attachId(json));
			} catch {}
		}
		return results;
	} catch {
		return [];
	}
}

export async function getComponentById(id: string): Promise<ComponentDetail | undefined> {
	const items = await listComponents();
	return items.find((x: any) => (x?.id ?? x?.metadata?.type) === id);
}

export function onInventoryChanged(_cb: (evt: { type: string }) => void): () => void {
	// Dev placeholder: no file watching in tests; return unsubscribe no-op
	return () => {};
}

