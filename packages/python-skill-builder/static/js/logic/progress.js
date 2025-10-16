/**
 * Progress Logic Module
 * Handles progress calculation and tracking algorithms
 */

const COMPLETION_THRESHOLD = 80; // Score threshold for marking workshop as complete

export class ProgressLogic {
  /**
   * Calculate score percentage
   * @param {number} score - Raw score
   * @param {number} maxScore - Maximum possible score
   * @returns {number} Score as percentage (0-100)
   */
  static calculateScorePercentage(score, maxScore) {
    if (maxScore === 0) return 0;
    return Math.round((score / maxScore) * 100);
  }

  /**
   * Check if a score indicates completion
   * @param {number} scorePercent - Score as percentage
   * @returns {boolean} True if score meets completion threshold
   */
  static isComplete(scorePercent) {
    return scorePercent >= COMPLETION_THRESHOLD;
  }

  /**
   * Calculate average score from multiple scores
   * @param {Array<number>} scores - Array of scores
   * @returns {number} Average score
   */
  static calculateAverage(scores) {
    if (scores.length === 0) return 0;
    const sum = scores.reduce((a, b) => a + b, 0);
    return Math.round(sum / scores.length);
  }

  /**
   * Calculate completion percentage
   * @param {number} completed - Number of completed workshops
   * @param {number} total - Total number of workshops
   * @returns {number} Completion percentage (0-100)
   */
  static calculateCompletionPercentage(completed, total) {
    if (total === 0) return 0;
    return Math.round((completed / total) * 100);
  }

  /**
   * Get the highest score from multiple approach scores
   * @param {Object} approachScores - Object with approach IDs as keys and scores as values
   * @returns {number} Highest score
   */
  static getHighestApproachScore(approachScores) {
    const scores = Object.values(approachScores);
    if (scores.length === 0) return 0;
    return Math.max(...scores);
  }

  /**
   * Check if any approach meets completion threshold
   * @param {Object} approachScores - Object with approach IDs as keys and scores as values
   * @returns {boolean} True if any approach is complete
   */
  static isAnyApproachComplete(approachScores) {
    return Object.values(approachScores).some(score => this.isComplete(score));
  }

  /**
   * Determine if workshop completion status changed
   * @param {boolean} wasComplete - Previous completion status
   * @param {boolean} isNowComplete - Current completion status
   * @returns {number} Change in completed count (-1, 0, or 1)
   */
  static getCompletionDelta(wasComplete, isNowComplete) {
    if (wasComplete === isNowComplete) return 0;
    return isNowComplete ? 1 : -1;
  }

  /**
   * Format score for display
   * @param {number} scorePercent - Score as percentage
   * @returns {string} Formatted score string
   */
  static formatScore(scorePercent) {
    if (scorePercent === 0) return '🆕 Not started';
    if (scorePercent < 50) return `📊 ${scorePercent}% (Needs work)`;
    if (scorePercent < 80) return `📊 ${scorePercent}% (Good)`;
    return `✅ ${scorePercent}% (Complete)`;
  }

  /**
   * Get score badge/emoji
   * @param {number} scorePercent - Score as percentage
   * @returns {string} Emoji badge
   */
  static getScoreBadge(scorePercent) {
    if (scorePercent === 0) return '🆕';
    if (scorePercent < 50) return '📊';
    if (scorePercent < 80) return '📈';
    return '✅';
  }
}

export default ProgressLogic;

