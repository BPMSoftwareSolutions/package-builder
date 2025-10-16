/**
 * Application Configuration
 * Centralized configuration constants for the Python Training App
 */

export const CONFIG = {
  // API Endpoints
  API: {
    MODULES: '/api/modules',
    MODULE_DETAIL: (moduleId) => `/api/modules/${moduleId}`,
    GRADE: '/api/grade',
  },

  // Storage Keys
  STORAGE: {
    PROGRESS: 'pythonTrainingProgress',
    CODE_PREFIX: 'pythonTrainingCode_',
    APPROACH_PREFIX: 'pythonTrainingApproach_',
  },

  // Timer Configuration
  TIMER: {
    WARNING_THRESHOLD_SECONDS: 60, // Show warning when less than 1 minute
    UPDATE_INTERVAL_MS: 1000, // Update display every second
  },

  // UI Configuration
  UI: {
    AUTO_SAVE_DELAY_MS: 1000, // Auto-save code after 1 second of inactivity
    TAB_SIZE: 2, // Number of spaces for tab indentation
  },

  // DOM Element IDs
  ELEMENTS: {
    // Views
    DASHBOARD_VIEW: 'dashboard-view',
    WORKSHOP_VIEW: 'workshop-view',

    // Containers
    MODULES_CONTAINER: 'modules-container',
    VISUALIZATION_CONTAINER: 'visualization-container',
    HINTS_CONTAINER: 'hints-container',
    FEEDBACK_SECTION: 'feedback-section',
    FEEDBACK_CONTENT: 'feedback-content',
    APPROACH_SELECTOR: 'approach-selector',

    // Buttons
    BACK_BTN: 'back-btn',
    SUBMIT_BTN: 'submit-btn',
    RESET_BTN: 'reset-btn',
    PREV_WORKSHOP_BTN: 'prev-workshop-btn',
    NEXT_WORKSHOP_BTN: 'next-workshop-btn',

    // Input/Display
    CODE_EDITOR: 'code-editor',
    TIMER_DISPLAY: 'timer-display',
    APPROACH_SELECT: 'approach-select',
    APPROACH_DESCRIPTION: 'approach-description',

    // Text Content
    WORKSHOP_TITLE: 'workshop-title',
    MODULE_TITLE: 'module-title',
    WORKSHOP_PROMPT: 'workshop-prompt',
    WORKSHOP_PROGRESS: 'workshop-progress',
  },

  // CSS Classes
  CLASSES: {
    HIDDEN: 'hidden',
    WARNING: 'warning',
    MODULE_CARD: 'module-card',
    HINT_BTN: 'hint-btn',
    HINT: 'hint',
    ERROR: 'error',
    SUCCESS: 'success',
  },

  // Messages
  MESSAGES: {
    LOAD_ERROR: 'Failed to load modules. Please refresh the page.',
    TIME_UP: 'Time is up! You can still submit, but try to work faster next time.',
    SUBMISSION_ERROR: 'Failed to submit code. Please try again.',
    SAVE_ERROR: 'Failed to save progress.',
  },

  // Feature Flags
  FEATURES: {
    ENABLE_AUTO_SAVE: true,
    ENABLE_HINTS: true,
    ENABLE_TIMER: true,
    ENABLE_VISUALIZATIONS: true,
  },
};

export default CONFIG;

