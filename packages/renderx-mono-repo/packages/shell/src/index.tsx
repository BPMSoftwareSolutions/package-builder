import * as ReactDOMClient from "react-dom/client";
import App from "./ui/App";
import { initConductor } from "@renderx-plugins/host-sdk/core/conductor/conductor";
import { registerAllSequences } from "@renderx-plugins/host-sdk/core/conductor/sequence-registration";
import { initInteractionManifest, getInteractionManifestStats, resolveInteraction } from "@renderx-plugins/host-sdk/core/manifests/interactionManifest";
import { initTopicsManifest, getTopicsManifestStats, getTopicDef } from "@renderx-plugins/host-sdk/core/manifests/topicsManifest";
import { getPluginManifestStats, verifyArtifactsIntegrity } from "@renderx-plugins/host-sdk/core/startup/startupValidation";
import { EventRouter as HostEventRouter } from "@renderx-plugins/host-sdk/core/events/EventRouter";
import "./global.css";
import * as HostFeatureFlags from "@renderx-plugins/host-sdk/core/environment/feature-flags";

import { listComponents, getComponentById, onInventoryChanged } from "./domain/components/inventory/inventory.service";
import { cssRegistry } from "./domain/css/cssRegistry.facade";
declare const process: { env?: Record<string, string | undefined> } | undefined;

(async () => {
  const conductor = await initConductor();
  await Promise.all([
    registerAllSequences(conductor),
    initInteractionManifest(),
    initTopicsManifest(),
  ]);

  (window as any).RenderX = (window as any).RenderX || {};
  // Expose the initialized conductor globally so SDK/hooks/events resolve the same instance
  if (!(window as any).RenderX.conductor) {
    (window as any).RenderX.conductor = conductor;
  }
  if (!(window as any).RenderX.resolveInteraction) {
    (window as any).RenderX.resolveInteraction = resolveInteraction;
  }
  if (!(window as any).RenderX.getTopicDef) {
    (window as any).RenderX.getTopicDef = getTopicDef;
  }
  if (!(window as any).RenderX.EventRouter) {
    (window as any).RenderX.EventRouter = HostEventRouter as any;
  }

	  if (!(window as any).RenderX.featureFlags) {
	    (window as any).RenderX.featureFlags = {
	      isFlagEnabled: HostFeatureFlags.isFlagEnabled,
	      getFlagMeta: HostFeatureFlags.getFlagMeta,
	      getAllFlags: HostFeatureFlags.getAllFlags,
	    } as any;
	  }


  if (!(window as any).RenderX.inventory) {
    (window as any).RenderX.inventory = {
      listComponents,
      getComponentById,
      onInventoryChanged,
    } as any;
  }
  if (!(window as any).RenderX.cssRegistry) {
    (window as any).RenderX.cssRegistry = cssRegistry as any;
  }
  (window as any).RenderX.sequencesReady = true;

  (window as any).testEventRouter = function() {
    console.log('🧪 Testing EventRouter...');
    const testPayload = { id: 'test-node-manual', type: 'button' };
    console.log('📤 Publishing control.panel.selection.updated with:', testPayload);
    (window as any).RenderX.EventRouter.publish('control.panel.selection.updated', testPayload);
    console.log('✅ Publish complete');
  };

  (window as any).testCanvasSelection = function() {
    console.log('🧪 Testing canvas selection event...');
    const testPayload = { id: 'test-node-manual-canvas' };
    console.log('📤 Publishing canvas.component.selection.changed with:', testPayload);
    (window as any).RenderX.EventRouter.publish('canvas.component.selection.changed', testPayload);
    console.log('✅ Canvas selection publish complete');
  };

  if (!(typeof process !== 'undefined' && process.env?.RENDERX_DISABLE_STARTUP_VALIDATION === '1')) {
    try {
      const interactionStats = getInteractionManifestStats();
      const topicsStats = getTopicsManifestStats();
      const pluginStats = await getPluginManifestStats();
      console.log("🧪 Startup validation:", {
        routes: interactionStats.routeCount,
        topics: topicsStats.topicCount,
        plugins: pluginStats.pluginCount,
      });

      // E2E readiness beacon: expose minimal, test-friendly object and fire an event
      try {
        const mountedIds = (conductor as any).getMountedPluginIds?.() || [];
        const readiness = {
          flag: false, // Will be set to true when Library components are loaded
          routes: interactionStats.routeCount,
          topics: topicsStats.topicCount,
          plugins: pluginStats.pluginCount,
          mountedCount: mountedIds.length,
          pluginIds: mountedIds,
          libraryComponentsLoaded: false,
          when: Date.now(),
        };
        (window as any).__rx = (window as any).__rx || {};
        (window as any).__rx.ready = readiness;

        // Optional startup debug and validation (enable with ?debug=1 or ?failFast=1)
        try {
          const params = new URLSearchParams(window.location.search || '');
          const debug = params.get('debug') === '1' || (typeof process !== 'undefined' && process.env?.RENDERX_DEBUG_STARTUP === '1');
          const failFast = params.get('failFast') === '1' || (typeof process !== 'undefined' && process.env?.RENDERX_FAIL_FAST_VALIDATE === '1');
          if (debug) {
            const mountedIdsDbg = (conductor as any).getMountedPluginIds?.() || [];
            const seqSet = (conductor as any)._runtimeMountedSeqIds;
            const seqIdsDbg = Array.isArray(seqSet) ? seqSet : (seqSet instanceof Set ? Array.from(seqSet) : []);
            console.info('🔎 Startup debug:', {
              routes: readiness.routes,
              topics: readiness.topics,
              plugins: readiness.plugins,
              mountedCount: readiness.mountedCount,
              mountedIds: mountedIdsDbg,
              sequenceIds: seqIdsDbg,
            });

            // Selection logs: observe selection request chain → CP show
            try {
              let pendingTimer: any = null;
              const selLog = (...args: any[]) => { try { console.info('🔎 Selection', ...args); } catch {} };
              // canvas select requested
              HostEventRouter.subscribe('canvas.component.select.requested', (p: any) => {
                selLog('canvas.component.select.requested', p);
                if (pendingTimer) clearTimeout(pendingTimer);
                pendingTimer = setTimeout(() => {
                  selLog('control.panel.selection.show.requested NOT observed within 300ms after select.requested');
                }, 300);
              });
              // canvas selection changed (post-select)
              HostEventRouter.subscribe('canvas.component.selection.changed', (p: any) => {
                selLog('canvas.component.selection.changed', p);
              });
              // control panel should show selection
              HostEventRouter.subscribe('control.panel.selection.show.requested', (p: any) => {
                selLog('control.panel.selection.show.requested', p);
                if (pendingTimer) { clearTimeout(pendingTimer); pendingTimer = null; }
              });
            } catch {}
          }
          const requiredTopics = [
            'control.panel.ui.render.requested',
            'control.panel.selection.show.requested',
            'library.component.drop.requested',
            'canvas.component.drag.move',
          ];
          const missing: string[] = [];
          for (const t of requiredTopics) { if (!getTopicDef(t)) missing.push(t); }
          if ((debug || failFast) && missing.length) {
            console.error('❌ Missing required topics:', missing);
            if (failFast) throw new Error('Missing required topics: ' + missing.join(', '));
          }
        } catch {}


        // Set up a function to mark Library components as loaded and complete readiness
        (window as any).__rx.markLibraryComponentsLoaded = () => {
          if ((window as any).__rx?.ready) {
            (window as any).__rx.ready.libraryComponentsLoaded = true;
            (window as any).__rx.ready.flag = true; // Now fully ready
            try { window.dispatchEvent(new CustomEvent('renderx:ready', { detail: readiness })); } catch {}
          }
        };

        // Start a timer to check for Library components in the DOM
        // This is a fallback approach since we can't modify the external Library plugin
        const checkLibraryComponents = () => {
          const librarySlot = document.querySelector('[data-slot="library"]');
          if (librarySlot) {
            const draggableElements = librarySlot.querySelectorAll('[draggable="true"], [draggable]');
            if (draggableElements.length > 0) {
              (window as any).__rx.markLibraryComponentsLoaded();
              return;
            }
          }
          // Check again in 100ms if components not found yet
          setTimeout(checkLibraryComponents, 100);
        };

        // Start checking after a short delay to allow UI to mount
        setTimeout(checkLibraryComponents, 500);

      } catch {}
    } catch (e) {
      console.warn("Startup validation failed", e);
    }
    verifyArtifactsIntegrity(true);
  }

  const rootEl = document.getElementById("root");
  if (!rootEl) {
    const el = document.createElement("div");
    el.id = "root";
    document.body.appendChild(el);
  }
  const root = ReactDOMClient.createRoot(document.getElementById("root")!);
  root.render(<App />);
})();
