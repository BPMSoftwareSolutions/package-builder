// Inlined implementation (Phase 2) formerly at src/sanitizeHtml.ts
const ALLOWED_TAGS = new Set([
	'a','b','strong','i','em','u','s','p','br','span','ul','ol','li','h1','h2','h3','h4','h5','h6','blockquote','code','pre','img','svg','path','rect','circle','g','div','form','button','input','label','table','thead','tbody','tr','th','td','text','line','polyline','polygon','ellipse','defs','lineargradient','stop','animate','animatetransform'
]);
const URL_ATTRS = new Set(['href','src']);
const ALLOWED_PROTOCOLS = ['http:','https:','mailto:','data:'];

function isDataImage(value: string) {
	return /^data:image\/(png|jpe?g|gif|webp|svg\+xml);base64,[a-z0-9+/=\s]+$/i.test(value.trim());
}

export function sanitizeHtml(input: string): string {
	if (!input || typeof input !== 'string') return '';
	const parser = new DOMParser();
	const doc = parser.parseFromString(`<div>${input}</div>`, 'text/html');
	const container = doc.body.firstElementChild as HTMLElement | null;
	if (!container) return '';
	const walker = doc.createTreeWalker(container, NodeFilter.SHOW_ELEMENT, null);
	const remove: Element[] = [];
	while (walker.nextNode()) {
		const el = walker.currentNode as HTMLElement;
		const tag = el.tagName.toLowerCase();
		if (!ALLOWED_TAGS.has(tag)) {
			if (tag === 'script' || tag === 'style') { remove.push(el); continue; }
			while (el.firstChild) el.parentNode?.insertBefore(el.firstChild, el);
			remove.push(el);
			continue;
		}
		for (const attr of Array.from(el.attributes)) {
			const name = attr.name.toLowerCase();
			const value = attr.value;
			if (name.startsWith('on')) { el.removeAttribute(attr.name); continue; }
			if (name === 'style') { if (/expression\s*\(/i.test(value)) el.removeAttribute(attr.name); continue; }
			if (URL_ATTRS.has(name)) {
				try {
					const a = doc.createElement('a');
					a.href = value;
					const protocol = a.protocol;
					if (!ALLOWED_PROTOCOLS.includes(protocol)) { el.removeAttribute(attr.name); continue; }
					if (protocol === 'data:' && !isDataImage(value)) { el.removeAttribute(attr.name); continue; }
				} catch { el.removeAttribute(attr.name); }
			}
		}
	}
	for (const el of remove) el.remove();
	return container.innerHTML;
}

