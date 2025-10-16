/**
 * Grading Service
 * Handles code submission and grading API calls
 */

import APIService from './api.js';
import CONFIG from '../config.js';

export class GradingService {
  /**
   * Submit code for grading
   * @param {string} moduleId - Module ID
   * @param {string} workshopId - Workshop ID
   * @param {string} code - Code to grade
   * @param {string|null} approachId - Approach ID (optional, for multi-approach workshops)
   * @returns {Promise<Object>} Grading result
   * @throws {Error} If submission fails
   */
  static async submitCode(moduleId, workshopId, code, approachId = null) {
    try {
      const payload = {
        moduleId,
        workshopId,
        code,
      };

      // Include approachId for multi-approach workshops
      if (approachId) {
        payload.approachId = approachId;
      }

      const result = await APIService.post(CONFIG.API.GRADE, payload);
      return result;
    } catch (error) {
      console.error('Code submission failed:', error);
      throw new Error(CONFIG.MESSAGES.SUBMISSION_ERROR);
    }
  }

  /**
   * Check if grading result indicates success
   * @param {Object} result - Grading result object
   * @returns {boolean} True if code passed
   */
  static isSuccess(result) {
    return result && result.ok === true;
  }

  /**
   * Extract score from grading result
   * @param {Object} result - Grading result object
   * @returns {number} Score (0-100)
   */
  static getScore(result) {
    if (!result) return 0;
    
    const score = result.score || 0;
    const maxScore = result.max_score || 100;
    
    // Normalize to 0-100 range
    return Math.round((score / maxScore) * 100);
  }

  /**
   * Extract feedback from grading result
   * @param {Object} result - Grading result object
   * @returns {string} Feedback message
   */
  static getFeedback(result) {
    if (!result) return 'No feedback available';
    
    if (result.feedback) {
      return result.feedback;
    }
    
    if (result.error) {
      return `Error: ${result.error}`;
    }
    
    return 'Grading completed';
  }

  /**
   * Extract execution results from grading result
   * @param {Object} result - Grading result object
   * @returns {Object|null} Execution results or null
   */
  static getExecutionResults(result) {
    return result?.execution_results || null;
  }

  /**
   * Extract visualizations from grading result
   * @param {Object} result - Grading result object
   * @returns {Array|null} Visualizations or null
   */
  static getVisualizations(result) {
    return result?.visualizations || null;
  }

  /**
   * Check if result has visualizations
   * @param {Object} result - Grading result object
   * @returns {boolean} True if result has visualizations
   */
  static hasVisualizations(result) {
    const visualizations = this.getVisualizations(result);
    return visualizations && visualizations.length > 0;
  }

  /**
   * Extract error details from grading result
   * @param {Object} result - Grading result object
   * @returns {Object|null} Error details or null
   */
  static getErrorDetails(result) {
    if (!result || !result.error_details) {
      return null;
    }
    
    return {
      type: result.error_details.type || 'Unknown',
      message: result.error_details.message || 'An error occurred',
      line: result.error_details.line || null,
      traceback: result.error_details.traceback || null,
    };
  }

  /**
   * Format grading result for display
   * @param {Object} result - Grading result object
   * @returns {Object} Formatted result
   */
  static formatResult(result) {
    return {
      success: this.isSuccess(result),
      score: this.getScore(result),
      feedback: this.getFeedback(result),
      executionResults: this.getExecutionResults(result),
      visualizations: this.getVisualizations(result),
      errorDetails: this.getErrorDetails(result),
    };
  }
}

export default GradingService;

