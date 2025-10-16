/**
 * Progress State Module
 * Manages progress tracking state for modules and workshops
 */

import StorageManager from './storage.js';

export class ProgressState {
  constructor() {
    this.progress = StorageManager.loadProgress();
  }

  /**
   * Initialize progress for a module
   * @param {string} moduleId - Module ID
   * @param {number} workshopCount - Total number of workshops in the module
   */
  initializeModule(moduleId, workshopCount) {
    if (!this.progress[moduleId]) {
      this.progress[moduleId] = {
        completed: 0,
        scores: {},
        lastSeenAt: null,
        workshopCount: workshopCount,
      };
    }
  }

  /**
   * Update progress for a workshop
   * @param {string} moduleId - Module ID
   * @param {string} workshopId - Workshop ID
   * @param {number} score - Score achieved (0-100)
   */
  updateWorkshopScore(moduleId, workshopId, score) {
    this.initializeModule(moduleId, 0);
    
    const moduleProgress = this.progress[moduleId];
    const previousScore = moduleProgress.scores[workshopId];
    
    // Only increment completed count if this is the first completion
    if (previousScore === undefined && score > 0) {
      moduleProgress.completed++;
    }
    
    moduleProgress.scores[workshopId] = score;
    moduleProgress.lastSeenAt = new Date().toISOString();
    
    this.save();
  }

  /**
   * Get progress for a module
   * @param {string} moduleId - Module ID
   * @returns {Object} Module progress object
   */
  getModuleProgress(moduleId) {
    return this.progress[moduleId] || {
      completed: 0,
      scores: {},
      lastSeenAt: null,
    };
  }

  /**
   * Get score for a specific workshop
   * @param {string} moduleId - Module ID
   * @param {string} workshopId - Workshop ID
   * @returns {number|null} Score or null if not completed
   */
  getWorkshopScore(moduleId, workshopId) {
    const moduleProgress = this.getModuleProgress(moduleId);
    return moduleProgress.scores[workshopId] || null;
  }

  /**
   * Calculate average score for a module
   * @param {string} moduleId - Module ID
   * @returns {number} Average score (0-100)
   */
  calculateAverageScore(moduleId) {
    const moduleProgress = this.getModuleProgress(moduleId);
    const scores = Object.values(moduleProgress.scores);
    
    if (scores.length === 0) return 0;
    
    const sum = scores.reduce((a, b) => a + b, 0);
    return Math.round(sum / scores.length);
  }

  /**
   * Calculate completion percentage for a module
   * @param {string} moduleId - Module ID
   * @param {number} totalWorkshops - Total number of workshops
   * @returns {number} Completion percentage (0-100)
   */
  calculateCompletionPercentage(moduleId, totalWorkshops) {
    const moduleProgress = this.getModuleProgress(moduleId);
    if (totalWorkshops === 0) return 0;
    return Math.round((moduleProgress.completed / totalWorkshops) * 100);
  }

  /**
   * Check if a workshop has been completed
   * @param {string} moduleId - Module ID
   * @param {string} workshopId - Workshop ID
   * @returns {boolean} True if workshop has been completed
   */
  isWorkshopCompleted(moduleId, workshopId) {
    const score = this.getWorkshopScore(moduleId, workshopId);
    return score !== null && score > 0;
  }

  /**
   * Get all progress data
   * @returns {Object} Complete progress object
   */
  getAllProgress() {
    return { ...this.progress };
  }

  /**
   * Save progress to storage
   */
  save() {
    StorageManager.saveProgress(this.progress);
  }

  /**
   * Reset progress for a module
   * @param {string} moduleId - Module ID
   */
  resetModule(moduleId) {
    if (this.progress[moduleId]) {
      this.progress[moduleId] = {
        completed: 0,
        scores: {},
        lastSeenAt: null,
      };
      this.save();
    }
  }

  /**
   * Reset all progress
   */
  resetAll() {
    this.progress = {};
    this.save();
  }
}

export default ProgressState;

