/**
 * Timer Component
 * Handles timer display and management
 */

import CONFIG from '../config.js';

export class TimerComponent {
  constructor() {
    this.timerInterval = null;
    this.remainingSeconds = 0;
    this.onTimeUp = null;
  }

  /**
   * Start the timer
   * @param {number} minutes - Duration in minutes
   * @param {Function} onTimeUp - Callback when time is up
   */
  start(minutes, onTimeUp = null) {
    this.stop();
    this.remainingSeconds = minutes * 60;
    this.onTimeUp = onTimeUp;
    this.updateDisplay();

    this.timerInterval = setInterval(() => {
      this.remainingSeconds--;
      this.updateDisplay();

      if (this.remainingSeconds <= 0) {
        this.stop();
        if (this.onTimeUp) {
          this.onTimeUp();
        } else {
          alert(CONFIG.MESSAGES.TIME_UP);
        }
      }
    }, CONFIG.TIMER.UPDATE_INTERVAL_MS);
  }

  /**
   * Stop the timer
   */
  stop() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  /**
   * Update timer display
   */
  updateDisplay() {
    const timerEl = document.getElementById(CONFIG.ELEMENTS.TIMER_DISPLAY);
    if (!timerEl) return;

    const minutes = Math.floor(this.remainingSeconds / 60);
    const seconds = this.remainingSeconds % 60;
    const display = `⏱️ ${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

    timerEl.textContent = display;

    // Add warning class if less than threshold
    if (this.remainingSeconds < CONFIG.TIMER.WARNING_THRESHOLD_SECONDS) {
      timerEl.classList.add(CONFIG.CLASSES.WARNING);
    } else {
      timerEl.classList.remove(CONFIG.CLASSES.WARNING);
    }
  }

  /**
   * Get remaining time in seconds
   * @returns {number} Remaining seconds
   */
  getRemainingSeconds() {
    return this.remainingSeconds;
  }

  /**
   * Get remaining time formatted as string
   * @returns {string} Formatted time (MM:SS)
   */
  getFormattedTime() {
    const minutes = Math.floor(this.remainingSeconds / 60);
    const seconds = this.remainingSeconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }

  /**
   * Check if time is running out (less than 1 minute)
   * @returns {boolean} True if less than 1 minute remaining
   */
  isTimeRunningOut() {
    return this.remainingSeconds < CONFIG.TIMER.WARNING_THRESHOLD_SECONDS;
  }

  /**
   * Check if time is up
   * @returns {boolean} True if time is up
   */
  isTimeUp() {
    return this.remainingSeconds <= 0;
  }

  /**
   * Pause the timer
   */
  pause() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  /**
   * Resume the timer
   */
  resume() {
    if (!this.timerInterval && this.remainingSeconds > 0) {
      this.timerInterval = setInterval(() => {
        this.remainingSeconds--;
        this.updateDisplay();

        if (this.remainingSeconds <= 0) {
          this.stop();
          if (this.onTimeUp) {
            this.onTimeUp();
          }
        }
      }, CONFIG.TIMER.UPDATE_INTERVAL_MS);
    }
  }

  /**
   * Reset the timer
   */
  reset() {
    this.stop();
    this.remainingSeconds = 0;
    this.updateDisplay();
  }

  /**
   * Check if timer is running
   * @returns {boolean} True if timer is running
   */
  isRunning() {
    return this.timerInterval !== null;
  }
}

export default TimerComponent;

