/**
 * Dashboard Component
 * Handles dashboard rendering and interaction
 */

import CONFIG from '../config.js';

export class DashboardComponent {
  /**
   * Render all modules in the dashboard
   * @param {Array} modules - Array of module objects
   * @param {Object} progressState - Progress state instance
   * @param {Function} onModuleClick - Callback when module is clicked
   */
  static render(modules, progressState, onModuleClick) {
    const container = document.getElementById(CONFIG.ELEMENTS.MODULES_CONTAINER);
    if (!container) {
      console.error('Modules container not found');
      return;
    }

    container.innerHTML = '';

    modules.forEach(module => {
      const moduleProgress = progressState.getModuleProgress(module.id);
      const completionPercent = progressState.calculateCompletionPercentage(
        module.id,
        module.workshopCount
      );
      const avgScore = progressState.calculateAverageScore(module.id);

      const card = this._createModuleCard(module, moduleProgress, completionPercent, avgScore);
      card.onclick = () => onModuleClick(module.id);
      container.appendChild(card);
    });
  }

  /**
   * Create a module card element
   * @private
   * @param {Object} module - Module object
   * @param {Object} moduleProgress - Module progress object
   * @param {number} completionPercent - Completion percentage
   * @param {number} avgScore - Average score
   * @returns {HTMLElement} Module card element
   */
  static _createModuleCard(module, moduleProgress, completionPercent, avgScore) {
    const card = document.createElement('div');
    card.className = CONFIG.CLASSES.MODULE_CARD;

    const scoreDisplay = avgScore > 0
      ? `📊 Avg: ${avgScore}%`
      : '🆕 Not started';

    card.innerHTML = `
      <h3>${this._escapeHtml(module.title)}</h3>
      <p class="summary">${this._escapeHtml(module.summary)}</p>
      <div class="progress-bar">
        <div class="progress-fill" style="width: ${completionPercent}%"></div>
      </div>
      <div class="module-stats">
        <span>⏱️ ${module.estimatedMinutes} min</span>
        <span>${scoreDisplay}</span>
        <span>✅ ${moduleProgress.completed}/${module.workshopCount}</span>
      </div>
    `;

    return card;
  }

  /**
   * Show error message in dashboard
   * @param {string} message - Error message
   */
  static showError(message) {
    const container = document.getElementById(CONFIG.ELEMENTS.MODULES_CONTAINER);
    if (!container) return;

    container.innerHTML = `<p class="${CONFIG.CLASSES.ERROR}">${this._escapeHtml(message)}</p>`;
  }

  /**
   * Show loading state
   */
  static showLoading() {
    const container = document.getElementById(CONFIG.ELEMENTS.MODULES_CONTAINER);
    if (!container) return;

    container.innerHTML = '<p>Loading modules...</p>';
  }

  /**
   * Clear dashboard
   */
  static clear() {
    const container = document.getElementById(CONFIG.ELEMENTS.MODULES_CONTAINER);
    if (!container) return;

    container.innerHTML = '';
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

export default DashboardComponent;

