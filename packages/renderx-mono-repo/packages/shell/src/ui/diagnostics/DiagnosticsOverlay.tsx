import * as React from "react";
import { createPortal } from "react-dom";
import { DiagnosticsPanel } from "./DiagnosticsPanel";
import "./diagnostics.css";

interface DiagnosticsOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  conductor: any;
}

export const DiagnosticsOverlay: React.FC<DiagnosticsOverlayProps> = ({
  isOpen,
  onClose,
  conductor
}) => {
  const overlayRef = React.useRef<HTMLDivElement>(null);

  // Handle Escape key to close
  React.useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Handle click outside to close
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div
      ref={overlayRef}
      className="diagnostics-overlay"
      onClick={handleOverlayClick}
    >
      <div className="diagnostics-modal">
        <div className="diagnostics-modal-header">
          <button
            className="diagnostics-close-btn"
            onClick={onClose}
            aria-label="Close diagnostics"
          >
            ✕
          </button>
        </div>
        <div className="diagnostics-modal-content">
          <DiagnosticsPanel conductor={conductor} />
        </div>
      </div>
    </div>,
    document.body
  );
};

