/**
 * Feedback Component
 * Handles feedback display logic
 */

import CONFIG from '../config.js';

export class FeedbackComponent {
  /**
   * Display feedback from grading result
   * @param {Object} result - Grading result object
   */
  static display(result) {
    const section = document.getElementById(CONFIG.ELEMENTS.FEEDBACK_SECTION);
    const content = document.getElementById(CONFIG.ELEMENTS.FEEDBACK_CONTENT);

    if (!section || !content) return;

    const html = this._buildFeedbackHtml(result);
    content.innerHTML = html;
    section.classList.remove(CONFIG.CLASSES.HIDDEN);
  }

  /**
   * Build feedback HTML
   * @private
   * @param {Object} result - Grading result object
   * @returns {string} HTML string
   */
  static _buildFeedbackHtml(result) {
    const parts = [];

    // Status
    if (result.ok) {
      parts.push(`<div class="${CONFIG.CLASSES.SUCCESS}">✅ Code passed!</div>`);
    } else {
      parts.push(`<div class="${CONFIG.CLASSES.ERROR}">❌ Code failed</div>`);
    }

    // Score
    if (result.score !== undefined && result.max_score !== undefined) {
      const scorePercent = Math.round((result.score / result.max_score) * 100);
      parts.push(`<div class="score">Score: ${result.score}/${result.max_score} (${scorePercent}%)</div>`);
    }

    // Feedback message
    if (result.feedback) {
      parts.push(`<div class="feedback-message">${this._escapeHtml(result.feedback)}</div>`);
    }

    // Error details
    if (result.error_details) {
      parts.push(this._buildErrorDetailsHtml(result.error_details));
    }

    // Execution output
    if (result.execution_output) {
      parts.push(`<div class="execution-output"><pre>${this._escapeHtml(result.execution_output)}</pre></div>`);
    }

    return parts.join('');
  }

  /**
   * Build error details HTML
   * @private
   * @param {Object} errorDetails - Error details object
   * @returns {string} HTML string
   */
  static _buildErrorDetailsHtml(errorDetails) {
    const parts = ['<div class="error-details">'];

    if (errorDetails.type) {
      parts.push(`<div class="error-type"><strong>${this._escapeHtml(errorDetails.type)}</strong></div>`);
    }

    if (errorDetails.message) {
      parts.push(`<div class="error-message">${this._escapeHtml(errorDetails.message)}</div>`);
    }

    if (errorDetails.line) {
      parts.push(`<div class="error-line">Line: ${errorDetails.line}</div>`);
    }

    if (errorDetails.traceback) {
      parts.push(`<div class="error-traceback"><pre>${this._escapeHtml(errorDetails.traceback)}</pre></div>`);
    }

    parts.push('</div>');
    return parts.join('');
  }

  /**
   * Show feedback
   */
  static show() {
    const section = document.getElementById(CONFIG.ELEMENTS.FEEDBACK_SECTION);
    if (section) section.classList.remove(CONFIG.CLASSES.HIDDEN);
  }

  /**
   * Hide feedback
   */
  static hide() {
    const section = document.getElementById(CONFIG.ELEMENTS.FEEDBACK_SECTION);
    if (section) section.classList.add(CONFIG.CLASSES.HIDDEN);
  }

  /**
   * Clear feedback
   */
  static clear() {
    const content = document.getElementById(CONFIG.ELEMENTS.FEEDBACK_CONTENT);
    if (content) content.innerHTML = '';
    this.hide();
  }

  /**
   * Escape HTML to prevent XSS
   * @private
   * @param {string} text - Text to escape
   * @returns {string} Escaped text
   */
  static _escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

export default FeedbackComponent;

