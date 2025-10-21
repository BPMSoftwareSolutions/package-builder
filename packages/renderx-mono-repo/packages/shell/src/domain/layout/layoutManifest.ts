// Canonical implementation moved from src/layout to domain.
let cached: any = null;
let loaded = false;

export async function loadLayoutManifest(): Promise<any> {
	if (loaded && cached) return cached;
	try {
		const isBrowser =
			typeof window !== "undefined" &&
			typeof (globalThis as any).fetch === "function";
		if (isBrowser) {
			const res = await fetch("/layout-manifest.json");
			if (res.ok) {
				cached = await res.json();
				loaded = true;
				return cached;
			}
			// In a browser-like environment (including jsdom tests), honor 404 and signal fallback
			loaded = true;
			cached = null;
			return null;
		}
		// Node/tests fallback when not in a browser-like environment: raw import from public
		const mod = await import(
			/* @vite-ignore */ "../../../public/layout-manifest.json?raw"
		);
		const text: string = (mod as any)?.default || (mod as any) || "{}";
		cached = JSON.parse(text);
		loaded = true;
		return cached;
	} catch {
		loaded = true;
		cached = null;
		return null;
	}
}

export function validateLayoutManifest(m: any) {
	if (!m || typeof m !== "object") throw new Error("Invalid layout manifest");
	if (!m.layout || !m.slots)
		throw new Error("Missing layout or slots in manifest");
	return true;
}

export default {
	loadLayoutManifest,
	validateLayoutManifest,
};
