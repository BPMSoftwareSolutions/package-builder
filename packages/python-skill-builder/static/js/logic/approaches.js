/**
 * Approaches Logic Module
 * Handles multi-approach workshop logic
 */

export class ApproachesLogic {
  /**
   * Check if a workshop has multiple approaches
   * @param {Object} workshop - Workshop object
   * @returns {boolean} True if workshop has approaches
   */
  static hasApproaches(workshop) {
    return workshop &&
           workshop.approaches &&
           Array.isArray(workshop.approaches) &&
           workshop.approaches.length > 0;
  }

  /**
   * Get all approaches for a workshop
   * @param {Object} workshop - Workshop object
   * @returns {Array} Array of approach objects
   */
  static getApproaches(workshop) {
    if (!this.hasApproaches(workshop)) {
      return [];
    }
    return workshop.approaches;
  }

  /**
   * Get an approach by ID
   * @param {Object} workshop - Workshop object
   * @param {string} approachId - Approach ID
   * @returns {Object|null} Approach object or null
   */
  static getApproach(workshop, approachId) {
    if (!this.hasApproaches(workshop)) {
      return null;
    }
    return workshop.approaches.find(a => a.id === approachId) || null;
  }

  /**
   * Get the first approach
   * @param {Object} workshop - Workshop object
   * @returns {Object|null} First approach or null
   */
  static getFirstApproach(workshop) {
    const approaches = this.getApproaches(workshop);
    return approaches.length > 0 ? approaches[0] : null;
  }

  /**
   * Get the default approach (usually the first one)
   * @param {Object} workshop - Workshop object
   * @returns {Object|null} Default approach or null
   */
  static getDefaultApproach(workshop) {
    return this.getFirstApproach(workshop);
  }

  /**
   * Get approach by index
   * @param {Object} workshop - Workshop object
   * @param {number} index - Approach index
   * @returns {Object|null} Approach object or null
   */
  static getApproachByIndex(workshop, index) {
    const approaches = this.getApproaches(workshop);
    if (index < 0 || index >= approaches.length) {
      return null;
    }
    return approaches[index];
  }

  /**
   * Get index of an approach
   * @param {Object} workshop - Workshop object
   * @param {string} approachId - Approach ID
   * @returns {number} Approach index or -1 if not found
   */
  static getApproachIndex(workshop, approachId) {
    const approaches = this.getApproaches(workshop);
    return approaches.findIndex(a => a.id === approachId);
  }

  /**
   * Get next approach
   * @param {Object} workshop - Workshop object
   * @param {string} currentApproachId - Current approach ID
   * @returns {Object|null} Next approach or null
   */
  static getNextApproach(workshop, currentApproachId) {
    const currentIndex = this.getApproachIndex(workshop, currentApproachId);
    if (currentIndex === -1) return null;
    return this.getApproachByIndex(workshop, currentIndex + 1);
  }

  /**
   * Get previous approach
   * @param {Object} workshop - Workshop object
   * @param {string} currentApproachId - Current approach ID
   * @returns {Object|null} Previous approach or null
   */
  static getPreviousApproach(workshop, currentApproachId) {
    const currentIndex = this.getApproachIndex(workshop, currentApproachId);
    if (currentIndex <= 0) return null;
    return this.getApproachByIndex(workshop, currentIndex - 1);
  }

  /**
   * Check if there's a next approach
   * @param {Object} workshop - Workshop object
   * @param {string} currentApproachId - Current approach ID
   * @returns {boolean} True if there's a next approach
   */
  static hasNextApproach(workshop, currentApproachId) {
    return this.getNextApproach(workshop, currentApproachId) !== null;
  }

  /**
   * Check if there's a previous approach
   * @param {Object} workshop - Workshop object
   * @param {string} currentApproachId - Current approach ID
   * @returns {boolean} True if there's a previous approach
   */
  static hasPreviousApproach(workshop, currentApproachId) {
    return this.getPreviousApproach(workshop, currentApproachId) !== null;
  }

  /**
   * Get approach count
   * @param {Object} workshop - Workshop object
   * @returns {number} Number of approaches
   */
  static getApproachCount(workshop) {
    return this.getApproaches(workshop).length;
  }

  /**
   * Validate approach structure
   * @param {Object} approach - Approach object to validate
   * @returns {boolean} True if approach is valid
   */
  static isValidApproach(approach) {
    return approach &&
           typeof approach.id === 'string' &&
           typeof approach.title === 'string' &&
           typeof approach.description === 'string';
  }
}

export default ApproachesLogic;

