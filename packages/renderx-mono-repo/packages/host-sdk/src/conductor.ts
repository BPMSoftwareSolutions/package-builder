// Standalone conductor API for @renderx/host-sdk
// Provides useConductor hook and types without host dependencies

import "./types.js"; // Load global declarations

export type ConductorClient = {
  play(pluginId: string, sequenceId: string, data?: any, callback?: (result: any) => void): Promise<any>;
  // Add other conductor methods as needed
};

export function useConductor(): ConductorClient {
  if (typeof window === "undefined") {
    // Node/SSR fallback - return mock conductor
    return {
      play: async () => ({}),
    };
  }

  const { conductor } = window.renderxCommunicationSystem || {};
  if (!conductor) {
    throw new Error("Conductor not initialized. Ensure the host has called initConductor().");
  }
  
  return conductor;
}
