import * as React from "react";
import { LayoutEngine } from "../../domain/layout/LayoutEngine";
import { isFlagEnabled } from "@renderx-plugins/host-sdk";
import { SlotContainer } from "../../domain/layout/SlotContainer";
import { wireUiEvents } from "../events/wiring";
import uiEventDefs from "../../core/manifests/uiEvents.json";
import { DiagnosticsOverlay } from "../diagnostics";
import "../../domain/layout/legacyLayout.css";

export default function App() {
  const [diagnosticsOpen, setDiagnosticsOpen] = React.useState(false);
  const [diagnosticsBadgeVisible, setDiagnosticsBadgeVisible] = React.useState(false);

  React.useEffect(() => {
    const cleanup = wireUiEvents(uiEventDefs as any);
    return () => cleanup();
  }, []);

  // Global keyboard shortcut for diagnostics (Ctrl+Shift+D)
  React.useEffect(() => {
    const diagnosticsEnabled = isFlagEnabled("diagnostics.enabled");
    if (!diagnosticsEnabled) return;

    setDiagnosticsBadgeVisible(true);

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+Shift+D or Cmd+Shift+D
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'D') {
        e.preventDefault();
        setDiagnosticsOpen(prev => !prev);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const useLayoutManifest = isFlagEnabled("ui.layout-manifest");

  // Get conductor from global window object
  const conductor = React.useMemo(() => {
    return (window as any).RenderX?.conductor;
  }, []);

  if (useLayoutManifest) {
    return (
      <>
        <React.Suspense fallback={<div className="p-3">Loading Layout…</div>}>
          <LayoutEngine />
        </React.Suspense>
        {diagnosticsBadgeVisible && (
          <div
            className="diagnostics-badge"
            onClick={() => setDiagnosticsOpen(true)}
            title="Open Diagnostics (Ctrl+Shift+D)"
          >
            🔍
            <span className="diagnostics-badge-tooltip">
              Diagnostics (Ctrl+Shift+D)
            </span>
          </div>
        )}
        <DiagnosticsOverlay
          isOpen={diagnosticsOpen}
          onClose={() => setDiagnosticsOpen(false)}
          conductor={conductor}
        />
      </>
    );
  }

  return (
    <>
      <div className="legacy-grid">
        <div data-slot="library" className="slot-wrapper">
          <React.Suspense fallback={<div className="p-3">Loading Library…</div>}>
            <SlotContainer slot="library" />
          </React.Suspense>
        </div>
        <div data-slot="canvas" className="slot-wrapper">
          <React.Suspense fallback={<div className="p-3">Loading Canvas…</div>}>
            <SlotContainer slot="canvas" capabilities={{ droppable: true }} />
          </React.Suspense>
        </div>
        <div data-slot="controlPanel" className="slot-wrapper">
          <React.Suspense fallback={<div className="p-3">Loading Control Panel…</div>}>
            <SlotContainer slot="controlPanel" />
          </React.Suspense>
        </div>
      </div>
      {diagnosticsBadgeVisible && (
        <div
          className="diagnostics-badge"
          onClick={() => setDiagnosticsOpen(true)}
          title="Open Diagnostics (Ctrl+Shift+D)"
        >
          🔍
          <span className="diagnostics-badge-tooltip">
            Diagnostics (Ctrl+Shift+D)
          </span>
        </div>
      )}
      <DiagnosticsOverlay
        isOpen={diagnosticsOpen}
        onClose={() => setDiagnosticsOpen(false)}
        conductor={conductor}
      />
    </>
  );
}
