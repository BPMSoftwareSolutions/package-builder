/**
 * Hints Logic Module
 * Handles hint system logic
 */

export class HintsLogic {
  /**
   * Check if workshop has hints
   * @param {Object} workshop - Workshop object
   * @returns {boolean} True if workshop has hints
   */
  static hasHints(workshop) {
    return workshop &&
           workshop.hints &&
           Array.isArray(workshop.hints) &&
           workshop.hints.length > 0;
  }

  /**
   * Get all hints for a workshop
   * @param {Object} workshop - Workshop object
   * @returns {Array} Array of hint strings
   */
  static getHints(workshop) {
    if (!this.hasHints(workshop)) {
      return [];
    }
    return workshop.hints;
  }

  /**
   * Get a specific hint by index
   * @param {Object} workshop - Workshop object
   * @param {number} index - Hint index
   * @returns {string|null} Hint text or null
   */
  static getHint(workshop, index) {
    const hints = this.getHints(workshop);
    if (index < 0 || index >= hints.length) {
      return null;
    }
    return hints[index];
  }

  /**
   * Get hint count
   * @param {Object} workshop - Workshop object
   * @returns {number} Number of hints
   */
  static getHintCount(workshop) {
    return this.getHints(workshop).length;
  }

  /**
   * Check if there are more hints to reveal
   * @param {Object} workshop - Workshop object
   * @param {number} hintsRevealed - Number of hints already revealed
   * @returns {boolean} True if there are more hints
   */
  static hasMoreHints(workshop, hintsRevealed) {
    return hintsRevealed < this.getHintCount(workshop);
  }

  /**
   * Get the next hint to reveal
   * @param {Object} workshop - Workshop object
   * @param {number} hintsRevealed - Number of hints already revealed
   * @returns {string|null} Next hint or null
   */
  static getNextHint(workshop, hintsRevealed) {
    if (!this.hasMoreHints(workshop, hintsRevealed)) {
      return null;
    }
    return this.getHint(workshop, hintsRevealed);
  }

  /**
   * Get all revealed hints
   * @param {Object} workshop - Workshop object
   * @param {number} hintsRevealed - Number of hints revealed
   * @returns {Array} Array of revealed hint strings
   */
  static getRevealedHints(workshop, hintsRevealed) {
    const hints = this.getHints(workshop);
    return hints.slice(0, hintsRevealed);
  }

  /**
   * Get all unrevealed hints
   * @param {Object} workshop - Workshop object
   * @param {number} hintsRevealed - Number of hints revealed
   * @returns {Array} Array of unrevealed hint strings
   */
  static getUnrevealedHints(workshop, hintsRevealed) {
    const hints = this.getHints(workshop);
    return hints.slice(hintsRevealed);
  }

  /**
   * Format hint for display
   * @param {string} hint - Hint text
   * @param {number} index - Hint index (0-based)
   * @returns {string} Formatted hint
   */
  static formatHint(hint, index) {
    return `💡 Hint ${index + 1}: ${hint}`;
  }

  /**
   * Get hint button label
   * @param {number} index - Hint index (0-based)
   * @returns {string} Button label
   */
  static getHintButtonLabel(index) {
    return `Show Hint ${index + 1}`;
  }

  /**
   * Check if all hints have been revealed
   * @param {Object} workshop - Workshop object
   * @param {number} hintsRevealed - Number of hints revealed
   * @returns {boolean} True if all hints revealed
   */
  static allHintsRevealed(workshop, hintsRevealed) {
    return hintsRevealed >= this.getHintCount(workshop);
  }

  /**
   * Get hints progress as percentage
   * @param {Object} workshop - Workshop object
   * @param {number} hintsRevealed - Number of hints revealed
   * @returns {number} Percentage of hints revealed (0-100)
   */
  static getHintsProgressPercentage(workshop, hintsRevealed) {
    const total = this.getHintCount(workshop);
    if (total === 0) return 0;
    return Math.round((hintsRevealed / total) * 100);
  }

  /**
   * Get hints summary
   * @param {Object} workshop - Workshop object
   * @param {number} hintsRevealed - Number of hints revealed
   * @returns {string} Summary string (e.g., "2 of 5 hints revealed")
   */
  static getHintsSummary(workshop, hintsRevealed) {
    const total = this.getHintCount(workshop);
    return `${hintsRevealed} of ${total} hints revealed`;
  }
}

export default HintsLogic;

