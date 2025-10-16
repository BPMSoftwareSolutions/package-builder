/**
 * Storage Module
 * Provides localStorage abstraction for the application
 */

import CONFIG from '../config.js';

export class StorageManager {
  /**
   * Load progress from localStorage
   * @returns {Object} Progress object or empty object if not found
   */
  static loadProgress() {
    try {
      const saved = localStorage.getItem(CONFIG.STORAGE.PROGRESS);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (error) {
      console.error('Failed to load progress from localStorage:', error);
    }
    return {};
  }

  /**
   * Save progress to localStorage
   * @param {Object} progress - Progress object to save
   */
  static saveProgress(progress) {
    try {
      localStorage.setItem(CONFIG.STORAGE.PROGRESS, JSON.stringify(progress));
    } catch (error) {
      console.error('Failed to save progress to localStorage:', error);
      throw new Error(CONFIG.MESSAGES.SAVE_ERROR);
    }
  }

  /**
   * Get saved code for a specific workshop/approach
   * @param {string} moduleId - Module ID
   * @param {string} workshopId - Workshop ID
   * @param {string|null} approachId - Approach ID (null for non-multi-approach workshops)
   * @returns {string|null} Saved code or null if not found
   */
  static getSavedCode(moduleId, workshopId, approachId) {
    try {
      const key = this._buildCodeKey(moduleId, workshopId, approachId);
      return localStorage.getItem(key);
    } catch (error) {
      console.error('Failed to retrieve saved code:', error);
      return null;
    }
  }

  /**
   * Save code for a specific workshop/approach
   * @param {string} moduleId - Module ID
   * @param {string} workshopId - Workshop ID
   * @param {string|null} approachId - Approach ID (null for non-multi-approach workshops)
   * @param {string} code - Code to save
   */
  static saveCode(moduleId, workshopId, approachId, code) {
    try {
      const key = this._buildCodeKey(moduleId, workshopId, approachId);
      localStorage.setItem(key, code);
    } catch (error) {
      console.error('Failed to save code:', error);
      throw new Error(CONFIG.MESSAGES.SAVE_ERROR);
    }
  }

  /**
   * Get saved approach for a workshop
   * @param {string} moduleId - Module ID
   * @param {string} workshopId - Workshop ID
   * @returns {string|null} Saved approach ID or null if not found
   */
  static getSavedApproach(moduleId, workshopId) {
    try {
      const key = `${CONFIG.STORAGE.APPROACH_PREFIX}${moduleId}_${workshopId}`;
      return localStorage.getItem(key);
    } catch (error) {
      console.error('Failed to retrieve saved approach:', error);
      return null;
    }
  }

  /**
   * Save approach for a workshop
   * @param {string} moduleId - Module ID
   * @param {string} workshopId - Workshop ID
   * @param {string} approachId - Approach ID to save
   */
  static saveApproach(moduleId, workshopId, approachId) {
    try {
      const key = `${CONFIG.STORAGE.APPROACH_PREFIX}${moduleId}_${workshopId}`;
      localStorage.setItem(key, approachId);
    } catch (error) {
      console.error('Failed to save approach:', error);
      throw new Error(CONFIG.MESSAGES.SAVE_ERROR);
    }
  }

  /**
   * Clear all stored data
   */
  static clearAll() {
    try {
      localStorage.clear();
    } catch (error) {
      console.error('Failed to clear localStorage:', error);
      throw new Error('Failed to clear storage');
    }
  }

  /**
   * Build storage key for code
   * @private
   * @param {string} moduleId - Module ID
   * @param {string} workshopId - Workshop ID
   * @param {string|null} approachId - Approach ID
   * @returns {string} Storage key
   */
  static _buildCodeKey(moduleId, workshopId, approachId) {
    if (approachId) {
      return `${CONFIG.STORAGE.CODE_PREFIX}${moduleId}_${workshopId}_${approachId}`;
    }
    return `${CONFIG.STORAGE.CODE_PREFIX}${moduleId}_${workshopId}`;
  }
}

export default StorageManager;

