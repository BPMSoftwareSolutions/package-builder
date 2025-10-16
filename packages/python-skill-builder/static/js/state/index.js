/**
 * State Management Facade
 * Provides unified access to all state management modules
 */

import StorageManager from './storage.js';
import ProgressState from './progress.js';
import WorkshopState from './workshop.js';

export class StateManager {
  constructor() {
    this.storage = StorageManager;
    this.progress = new ProgressState();
    this.workshop = new WorkshopState();
  }

  /**
   * Initialize the state manager
   * Loads persisted state from storage
   */
  initialize() {
    // Progress is already loaded in ProgressState constructor
    // Additional initialization can be added here if needed
  }

  /**
   * Get the storage manager
   * @returns {StorageManager} Storage manager instance
   */
  getStorage() {
    return this.storage;
  }

  /**
   * Get the progress state
   * @returns {ProgressState} Progress state instance
   */
  getProgress() {
    return this.progress;
  }

  /**
   * Get the workshop state
   * @returns {WorkshopState} Workshop state instance
   */
  getWorkshop() {
    return this.workshop;
  }

  /**
   * Save all state to storage
   */
  saveAll() {
    this.progress.save();
  }

  /**
   * Reset all state
   */
  resetAll() {
    this.progress.resetAll();
    this.workshop.clearCurrentWorkshop();
  }
}

// Create and export singleton instance
export const stateManager = new StateManager();

export default stateManager;

