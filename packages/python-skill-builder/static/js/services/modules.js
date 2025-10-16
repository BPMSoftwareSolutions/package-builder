/**
 * Modules Service
 * Handles module-related API calls
 */

import APIService from './api.js';
import CONFIG from '../config.js';

export class ModulesService {
  /**
   * Load all modules
   * @returns {Promise<Array>} Array of module objects
   * @throws {Error} If API call fails
   */
  static async loadModules() {
    try {
      const data = await APIService.get(CONFIG.API.MODULES);
      return data.modules || [];
    } catch (error) {
      console.error('Failed to load modules:', error);
      throw new Error('Unable to load modules. Please refresh the page.');
    }
  }

  /**
   * Load a specific module with its workshops
   * @param {string} moduleId - Module ID
   * @returns {Promise<Object>} Module object with workshops
   * @throws {Error} If API call fails
   */
  static async loadModule(moduleId) {
    try {
      const endpoint = CONFIG.API.MODULE_DETAIL(moduleId);
      const module = await APIService.get(endpoint);
      return module;
    } catch (error) {
      console.error(`Failed to load module ${moduleId}:`, error);
      throw new Error('Unable to load module. Please try again.');
    }
  }

  /**
   * Get a workshop from a module
   * @param {Object} module - Module object
   * @param {number} workshopIndex - Index of the workshop
   * @returns {Object|null} Workshop object or null if not found
   */
  static getWorkshop(module, workshopIndex) {
    if (!module || !module.workshops || workshopIndex < 0 || workshopIndex >= module.workshops.length) {
      return null;
    }
    return module.workshops[workshopIndex];
  }

  /**
   * Check if a workshop has multiple approaches
   * @param {Object} workshop - Workshop object
   * @returns {boolean} True if workshop has approaches
   */
  static hasApproaches(workshop) {
    return workshop && workshop.approaches && workshop.approaches.length > 0;
  }

  /**
   * Get an approach from a workshop
   * @param {Object} workshop - Workshop object
   * @param {string} approachId - Approach ID
   * @returns {Object|null} Approach object or null if not found
   */
  static getApproach(workshop, approachId) {
    if (!this.hasApproaches(workshop)) {
      return null;
    }
    return workshop.approaches.find(a => a.id === approachId) || null;
  }

  /**
   * Get the first approach from a workshop
   * @param {Object} workshop - Workshop object
   * @returns {Object|null} First approach or null if none exist
   */
  static getFirstApproach(workshop) {
    if (!this.hasApproaches(workshop)) {
      return null;
    }
    return workshop.approaches[0];
  }

  /**
   * Validate module structure
   * @param {Object} module - Module object to validate
   * @returns {boolean} True if module is valid
   */
  static isValidModule(module) {
    return module &&
           typeof module.id === 'string' &&
           typeof module.title === 'string' &&
           Array.isArray(module.workshops);
  }

  /**
   * Validate workshop structure
   * @param {Object} workshop - Workshop object to validate
   * @returns {boolean} True if workshop is valid
   */
  static isValidWorkshop(workshop) {
    return workshop &&
           typeof workshop.id === 'string' &&
           typeof workshop.title === 'string' &&
           typeof workshop.prompt === 'string';
  }
}

export default ModulesService;

