/**
 * Workshop Component
 * Handles workshop view management
 */

import CONFIG from '../config.js';

export class WorkshopComponent {
  /**
   * Show workshop view
   */
  static show() {
    const dashboardView = document.getElementById(CONFIG.ELEMENTS.DASHBOARD_VIEW);
    const workshopView = document.getElementById(CONFIG.ELEMENTS.WORKSHOP_VIEW);

    if (dashboardView) dashboardView.classList.add(CONFIG.CLASSES.HIDDEN);
    if (workshopView) workshopView.classList.remove(CONFIG.CLASSES.HIDDEN);
  }

  /**
   * Hide workshop view
   */
  static hide() {
    const workshopView = document.getElementById(CONFIG.ELEMENTS.WORKSHOP_VIEW);
    if (workshopView) workshopView.classList.add(CONFIG.CLASSES.HIDDEN);
  }

  /**
   * Render workshop content
   * @param {Object} workshop - Workshop object
   * @param {Object} module - Module object
   * @param {number} workshopIndex - Workshop index
   */
  static renderContent(workshop, module, workshopIndex) {
    const titleEl = document.getElementById(CONFIG.ELEMENTS.WORKSHOP_TITLE);
    const moduleEl = document.getElementById(CONFIG.ELEMENTS.MODULE_TITLE);
    const promptEl = document.getElementById(CONFIG.ELEMENTS.WORKSHOP_PROMPT);
    const progressEl = document.getElementById(CONFIG.ELEMENTS.WORKSHOP_PROGRESS);

    if (titleEl) titleEl.textContent = workshop.title;
    if (moduleEl) moduleEl.textContent = module.title;
    if (promptEl) promptEl.textContent = workshop.prompt;

    if (progressEl) {
      const totalWorkshops = module.workshops.length;
      progressEl.textContent = `${workshopIndex + 1} of ${totalWorkshops}`;
    }
  }

  /**
   * Set code editor value
   * @param {string} code - Code to set
   */
  static setCode(code) {
    const editor = document.getElementById(CONFIG.ELEMENTS.CODE_EDITOR);
    if (editor) {
      editor.value = code;
    }
  }

  /**
   * Get code editor value
   * @returns {string} Current code
   */
  static getCode() {
    const editor = document.getElementById(CONFIG.ELEMENTS.CODE_EDITOR);
    return editor ? editor.value : '';
  }

  /**
   * Clear code editor
   */
  static clearCode() {
    this.setCode('');
  }

  /**
   * Focus code editor
   */
  static focusCode() {
    const editor = document.getElementById(CONFIG.ELEMENTS.CODE_EDITOR);
    if (editor) editor.focus();
  }

  /**
   * Show feedback section
   */
  static showFeedback() {
    const section = document.getElementById(CONFIG.ELEMENTS.FEEDBACK_SECTION);
    if (section) section.classList.remove(CONFIG.CLASSES.HIDDEN);
  }

  /**
   * Hide feedback section
   */
  static hideFeedback() {
    const section = document.getElementById(CONFIG.ELEMENTS.FEEDBACK_SECTION);
    if (section) section.classList.add(CONFIG.CLASSES.HIDDEN);
  }

  /**
   * Set feedback content
   * @param {string} html - HTML content for feedback
   */
  static setFeedbackContent(html) {
    const content = document.getElementById(CONFIG.ELEMENTS.FEEDBACK_CONTENT);
    if (content) {
      content.innerHTML = html;
    }
  }

  /**
   * Enable submit button
   */
  static enableSubmit() {
    const btn = document.getElementById(CONFIG.ELEMENTS.SUBMIT_BTN);
    if (btn) {
      btn.disabled = false;
      btn.textContent = '▶️ Run & Grade';
    }
  }

  /**
   * Disable submit button
   */
  static disableSubmit() {
    const btn = document.getElementById(CONFIG.ELEMENTS.SUBMIT_BTN);
    if (btn) {
      btn.disabled = true;
      btn.textContent = '⏳ Grading...';
    }
  }

  /**
   * Show reset button
   */
  static showReset() {
    const btn = document.getElementById(CONFIG.ELEMENTS.RESET_BTN);
    if (btn) btn.style.display = 'inline-block';
  }

  /**
   * Hide reset button
   */
  static hideReset() {
    const btn = document.getElementById(CONFIG.ELEMENTS.RESET_BTN);
    if (btn) btn.style.display = 'none';
  }
}

export default WorkshopComponent;

