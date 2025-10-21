/**
 * Domain Event System for RenderX
 *
 * Provides a clean, domain-based event system that App.tsx can use
 * without tight coupling to specific plugins.
 *
 * App.tsx only knows about these domains:
 * - App (application shell and core functionality)
 * - ElementLibrary
 * - Canvas
 * - ControlPanel
 */

export interface DomainEvent {
  domain: string;
  action: string;
  data: any;
  timestamp: number;
  source: string;
}

export class DomainEventSystem {
  private eventBus: any;

  constructor(eventBus: any) {
    this.eventBus = eventBus;
  }

  /**
   * Emit a domain-based event
   * Format: Domain:action:subaction
   */
  emit(eventName: string, data: any) {
    const [domain, action, subaction] = eventName.split(":");

    const domainEvent: DomainEvent = {
      domain,
      action: subaction ? `${action}:${subaction}` : action,
      data,
      timestamp: Date.now(),
      source: "app",
    };

    console.log(`🎼 Domain Event: ${eventName}`, domainEvent);
    this.eventBus.emit(eventName, domainEvent);
  }

  /**
   * App domain events
   */
  app = {
    initialized: () => {
      this.emit("App:initialized", {});
    },

    themeChanged: (theme: string) => {
      this.emit("App:theme:changed", { theme });
    },

    layoutModeChanged: (mode: string) => {
      this.emit("App:layout:changed", { mode });
    },

    stateChanged: (state: any) => {
      this.emit("App:state:changed", { state });
    },
  };

  /**
   * ElementLibrary domain events
   */
  elementLibrary = {
    dragStart: (element: any, dragData: any) => {
      this.emit("ElementLibrary:drag:start", { element, dragData });
    },

    dragEnd: () => {
      this.emit("ElementLibrary:drag:end", {});
    },

    componentSelected: (component: any) => {
      this.emit("ElementLibrary:component:selected", { component });
    },
  };

  /**
   * Canvas domain events
   */
  canvas = {
    elementDragStart: (element: any, dragData: any) => {
      this.emit("Canvas:element:drag:start", { element, dragData });
    },

    elementDragMove: (element: any, position: any) => {
      this.emit("Canvas:element:drag:move", { element, position });
    },

    elementDragEnd: (element: any, position: any) => {
      this.emit("Canvas:element:drag:end", { element, position });
    },

    elementDropped: (element: any, position: any) => {
      this.emit("Canvas:element:dropped", { element, position });
    },

    elementSelected: (element: any) => {
      this.emit("Canvas:element:selected", { element });
    },
  };

  /**
   * ControlPanel domain events
   */
  controlPanel = {
    panelToggle: (panelName: string, visible: boolean) => {
      this.emit("ControlPanel:panel:toggle", { panelName, visible });
    },

    propertyChanged: (property: string, value: any) => {
      this.emit("ControlPanel:property:changed", { property, value });
    },
  };
}

/**
 * Initialize domain event system for App.tsx
 */
export function initializeDomainEvents(
  communicationSystem: any
): DomainEventSystem {
  if (!communicationSystem?.eventBus) {
    throw new Error("Communication system with event bus required");
  }

  return new DomainEventSystem(communicationSystem.eventBus);
}
