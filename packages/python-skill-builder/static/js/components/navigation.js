/**
 * Navigation Component
 * Handles navigation controls
 */

import CONFIG from '../config.js';

export class NavigationComponent {
  /**
   * Update navigation buttons based on workshop position
   * @param {boolean} hasPrevious - True if there's a previous workshop
   * @param {boolean} hasNext - True if there's a next workshop
   */
  static updateButtons(hasPrevious, hasNext) {
    const prevBtn = document.getElementById(CONFIG.ELEMENTS.PREV_WORKSHOP_BTN);
    const nextBtn = document.getElementById(CONFIG.ELEMENTS.NEXT_WORKSHOP_BTN);

    if (prevBtn) {
      prevBtn.disabled = !hasPrevious;
    }

    if (nextBtn) {
      nextBtn.disabled = !hasNext;
    }
  }

  /**
   * Enable previous button
   */
  static enablePrevious() {
    const btn = document.getElementById(CONFIG.ELEMENTS.PREV_WORKSHOP_BTN);
    if (btn) btn.disabled = false;
  }

  /**
   * Disable previous button
   */
  static disablePrevious() {
    const btn = document.getElementById(CONFIG.ELEMENTS.PREV_WORKSHOP_BTN);
    if (btn) btn.disabled = true;
  }

  /**
   * Enable next button
   */
  static enableNext() {
    const btn = document.getElementById(CONFIG.ELEMENTS.NEXT_WORKSHOP_BTN);
    if (btn) btn.disabled = false;
  }

  /**
   * Disable next button
   */
  static disableNext() {
    const btn = document.getElementById(CONFIG.ELEMENTS.NEXT_WORKSHOP_BTN);
    if (btn) btn.disabled = true;
  }

  /**
   * Show back button
   */
  static showBack() {
    const btn = document.getElementById(CONFIG.ELEMENTS.BACK_BTN);
    if (btn) btn.style.display = 'inline-block';
  }

  /**
   * Hide back button
   */
  static hideBack() {
    const btn = document.getElementById(CONFIG.ELEMENTS.BACK_BTN);
    if (btn) btn.style.display = 'none';
  }

  /**
   * Set back button click handler
   * @param {Function} handler - Click handler function
   */
  static onBack(handler) {
    const btn = document.getElementById(CONFIG.ELEMENTS.BACK_BTN);
    if (btn) btn.onclick = handler;
  }

  /**
   * Set previous button click handler
   * @param {Function} handler - Click handler function
   */
  static onPrevious(handler) {
    const btn = document.getElementById(CONFIG.ELEMENTS.PREV_WORKSHOP_BTN);
    if (btn) btn.onclick = handler;
  }

  /**
   * Set next button click handler
   * @param {Function} handler - Click handler function
   */
  static onNext(handler) {
    const btn = document.getElementById(CONFIG.ELEMENTS.NEXT_WORKSHOP_BTN);
    if (btn) btn.onclick = handler;
  }

  /**
   * Show navigation controls
   */
  static show() {
    const prevBtn = document.getElementById(CONFIG.ELEMENTS.PREV_WORKSHOP_BTN);
    const nextBtn = document.getElementById(CONFIG.ELEMENTS.NEXT_WORKSHOP_BTN);
    const backBtn = document.getElementById(CONFIG.ELEMENTS.BACK_BTN);

    if (prevBtn) prevBtn.style.display = 'inline-block';
    if (nextBtn) nextBtn.style.display = 'inline-block';
    if (backBtn) backBtn.style.display = 'inline-block';
  }

  /**
   * Hide navigation controls
   */
  static hide() {
    const prevBtn = document.getElementById(CONFIG.ELEMENTS.PREV_WORKSHOP_BTN);
    const nextBtn = document.getElementById(CONFIG.ELEMENTS.NEXT_WORKSHOP_BTN);
    const backBtn = document.getElementById(CONFIG.ELEMENTS.BACK_BTN);

    if (prevBtn) prevBtn.style.display = 'none';
    if (nextBtn) nextBtn.style.display = 'none';
    if (backBtn) backBtn.style.display = 'none';
  }
}

export default NavigationComponent;

