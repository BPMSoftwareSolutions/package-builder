// Inlined implementation (Phase 2) formerly at src/cssRegistry/facade.ts
// Host-side cssRegistry facade
import { EventRouter } from '@renderx-plugins/host-sdk';
import { initConductor } from '@renderx-plugins/host-sdk/core/conductor/conductor';

export type CssRegistryFacade = {
	hasClass: (className: string) => Promise<boolean>;
	createClass: (id: string, className: string, content: string) => Promise<void>;
	updateClass: (id: string, className: string, content: string) => Promise<void>;
};

async function getConductor() {
	try {
		const g: any = (globalThis as any);
		const c = g?.window?.renderxCommunicationSystem?.conductor;
		if (c) return c;
	} catch {}
	return await initConductor();
}

export const cssRegistry: CssRegistryFacade = {
	async hasClass(_className: string) {
		return false;
	},
	async createClass(id: string, className: string, content: string) {
		const conductor = await getConductor();
		await EventRouter.publish('control.panel.css.create.requested', { id, className, content }, conductor);
	},
	async updateClass(id: string, className: string, content: string) {
		const conductor = await getConductor();
		await EventRouter.publish('control.panel.css.edit.requested', { id, className, content }, conductor);
	},
};

