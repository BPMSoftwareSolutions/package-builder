/**
 * Workshop State Module
 * Manages current workshop and navigation state
 */

export class WorkshopState {
  constructor() {
    this.modules = [];
    this.currentModule = null;
    this.currentWorkshop = null;
    this.currentWorkshopIndex = 0;
    this.currentApproach = null;
    this.currentApproachId = null;
    this.hintsRevealed = 0;
  }

  /**
   * Set the list of modules
   * @param {Array} modules - Array of module objects
   */
  setModules(modules) {
    this.modules = modules;
  }

  /**
   * Get all modules
   * @returns {Array} Array of module objects
   */
  getModules() {
    return this.modules;
  }

  /**
   * Get a module by ID
   * @param {string} moduleId - Module ID
   * @returns {Object|null} Module object or null if not found
   */
  getModule(moduleId) {
    return this.modules.find(m => m.id === moduleId) || null;
  }

  /**
   * Set the current module
   * @param {Object} module - Module object
   */
  setCurrentModule(module) {
    this.currentModule = module;
  }

  /**
   * Get the current module
   * @returns {Object|null} Current module or null
   */
  getCurrentModule() {
    return this.currentModule;
  }

  /**
   * Set the current workshop
   * @param {Object} workshop - Workshop object
   * @param {number} index - Workshop index in the module
   */
  setCurrentWorkshop(workshop, index) {
    this.currentWorkshop = workshop;
    this.currentWorkshopIndex = index;
    this.hintsRevealed = 0;
    this.currentApproach = null;
    this.currentApproachId = null;
  }

  /**
   * Get the current workshop
   * @returns {Object|null} Current workshop or null
   */
  getCurrentWorkshop() {
    return this.currentWorkshop;
  }

  /**
   * Get the current workshop index
   * @returns {number} Current workshop index
   */
  getCurrentWorkshopIndex() {
    return this.currentWorkshopIndex;
  }

  /**
   * Set the current approach for multi-approach workshops
   * @param {Object} approach - Approach object
   * @param {string} approachId - Approach ID
   */
  setCurrentApproach(approach, approachId) {
    this.currentApproach = approach;
    this.currentApproachId = approachId;
  }

  /**
   * Get the current approach
   * @returns {Object|null} Current approach or null
   */
  getCurrentApproach() {
    return this.currentApproach;
  }

  /**
   * Get the current approach ID
   * @returns {string|null} Current approach ID or null
   */
  getCurrentApproachId() {
    return this.currentApproachId;
  }

  /**
   * Check if current workshop has multiple approaches
   * @returns {boolean} True if workshop has approaches
   */
  hasApproaches() {
    return this.currentWorkshop && 
           this.currentWorkshop.approaches && 
           this.currentWorkshop.approaches.length > 0;
  }

  /**
   * Get approaches for current workshop
   * @returns {Array} Array of approach objects
   */
  getApproaches() {
    return this.currentWorkshop?.approaches || [];
  }

  /**
   * Increment hints revealed counter
   */
  revealHint() {
    this.hintsRevealed++;
  }

  /**
   * Get number of hints revealed
   * @returns {number} Number of hints revealed
   */
  getHintsRevealed() {
    return this.hintsRevealed;
  }

  /**
   * Reset hints counter
   */
  resetHints() {
    this.hintsRevealed = 0;
  }

  /**
   * Check if there's a next workshop
   * @returns {boolean} True if there's a next workshop
   */
  hasNextWorkshop() {
    if (!this.currentModule) return false;
    return this.currentWorkshopIndex < this.currentModule.workshops.length - 1;
  }

  /**
   * Check if there's a previous workshop
   * @returns {boolean} True if there's a previous workshop
   */
  hasPreviousWorkshop() {
    return this.currentWorkshopIndex > 0;
  }

  /**
   * Get next workshop
   * @returns {Object|null} Next workshop or null
   */
  getNextWorkshop() {
    if (!this.hasNextWorkshop()) return null;
    return this.currentModule.workshops[this.currentWorkshopIndex + 1];
  }

  /**
   * Get previous workshop
   * @returns {Object|null} Previous workshop or null
   */
  getPreviousWorkshop() {
    if (!this.hasPreviousWorkshop()) return null;
    return this.currentModule.workshops[this.currentWorkshopIndex - 1];
  }

  /**
   * Clear current workshop state
   */
  clearCurrentWorkshop() {
    this.currentWorkshop = null;
    this.currentWorkshopIndex = 0;
    this.currentApproach = null;
    this.currentApproachId = null;
    this.hintsRevealed = 0;
  }
}

export default WorkshopState;

