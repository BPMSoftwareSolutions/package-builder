/**
 * Python Training App - Main Application Entry Point
 * Orchestrates all modules and manages application flow
 */

// Import configuration
import CONFIG from './config.js';

// Import state management
import stateManager from './state/index.js';

// Import services
import ModulesService from './services/modules.js';
import GradingService from './services/grading.js';

// Import business logic
import CodeLogic from './logic/code.js';
import ApproachesLogic from './logic/approaches.js';
import HintsLogic from './logic/hints.js';

// Import components
import DashboardComponent from './components/dashboard.js';
import WorkshopComponent from './components/workshop.js';
import FeedbackComponent from './components/feedback.js';
import NavigationComponent from './components/navigation.js';
import TimerComponent from './components/timer.js';

// Import visualizations
import { visualizationManager } from './visualizations/index.js';

/**
 * Application Controller
 * Main application logic and event coordination
 */
class PythonTrainingApp {
  constructor() {
    this.stateManager = stateManager;
    this.timer = new TimerComponent();
    this.initialized = false;
  }

  /**
   * Initialize the application
   */
  async initialize() {
    try {
      // Initialize state manager
      this.stateManager.initialize();

      // Load modules from API
      await this.loadModules();

      // Setup event listeners
      this.setupEventListeners();

      // Setup auto-save
      if (CONFIG.FEATURES.ENABLE_AUTO_SAVE) {
        this.setupAutoSave();
      }

      this.initialized = true;
      console.log('Application initialized successfully');
    } catch (error) {
      console.error('Failed to initialize application:', error);
      DashboardComponent.showError(CONFIG.MESSAGES.LOAD_ERROR);
    }
  }

  /**
   * Load modules from API
   */
  async loadModules() {
    try {
      DashboardComponent.showLoading();
      const modules = await ModulesService.loadModules();
      this.stateManager.workshop.setModules(modules);
      this.renderDashboard();
    } catch (error) {
      console.error('Failed to load modules:', error);
      DashboardComponent.showError(CONFIG.MESSAGES.LOAD_ERROR);
    }
  }

  /**
   * Render dashboard
   */
  renderDashboard() {
    const modules = this.stateManager.workshop.getModules();
    DashboardComponent.render(modules, this.stateManager.progress, (moduleId) => {
      this.openModule(moduleId);
    });
  }

  /**
   * Open a module
   */
  async openModule(moduleId, workshopIndex = 0) {
    try {
      const module = await ModulesService.loadModule(moduleId);
      this.stateManager.workshop.setCurrentModule(module);

      if (module.workshops && module.workshops.length > 0) {
        this.openWorkshop(module.workshops[workshopIndex], workshopIndex);
      }
    } catch (error) {
      console.error('Failed to open module:', error);
      alert('Failed to load module. Please try again.');
    }
  }

  /**
   * Open a workshop
   */
  openWorkshop(workshop, workshopIndex) {
    const module = this.stateManager.workshop.getCurrentModule();
    this.stateManager.workshop.setCurrentWorkshop(workshop, workshopIndex);

    // Show workshop view
    WorkshopComponent.show();
    WorkshopComponent.renderContent(workshop, module, workshopIndex);

    // Handle multi-approach workshops
    if (ApproachesLogic.hasApproaches(workshop)) {
      this.setupApproachSelector(workshop);
      const savedApproachId = CodeLogic.getSavedApproachId(
        this.stateManager.progress.getAllProgress(),
        module.id,
        workshop.id
      );
      const approachId = savedApproachId || ApproachesLogic.getFirstApproach(workshop).id;
      this.selectApproach(approachId);
    } else {
      this.setupSingleApproachWorkshop(workshop);
    }

    // Hide feedback and update navigation
    FeedbackComponent.hide();
    this.updateNavigationButtons();

    // Start timer
    if (CONFIG.FEATURES.ENABLE_TIMER && workshop.timeLimitMinutes) {
      this.timer.start(workshop.timeLimitMinutes, () => {
        alert(CONFIG.MESSAGES.TIME_UP);
      });
    }
  }

  /**
   * Setup single-approach workshop
   */
  setupSingleApproachWorkshop(workshop) {
    const module = this.stateManager.workshop.getCurrentModule();
    const savedCode = CodeLogic.getSavedCode(
      this.stateManager.progress.getAllProgress(),
      module.id,
      workshop.id,
      null
    );
    WorkshopComponent.setCode(savedCode || workshop.starterCode);

    if (CONFIG.FEATURES.ENABLE_HINTS && HintsLogic.hasHints(workshop)) {
      this.renderHints(workshop);
    }
  }

  /**
   * Setup approach selector
   */
  setupApproachSelector(workshop) {
    const selector = document.getElementById(CONFIG.ELEMENTS.APPROACH_SELECTOR);
    const select = document.getElementById(CONFIG.ELEMENTS.APPROACH_SELECT);

    if (!selector || !select) return;

    selector.style.display = 'block';
    select.innerHTML = '';

    ApproachesLogic.getApproaches(workshop).forEach(approach => {
      const option = document.createElement('option');
      option.value = approach.id;
      option.textContent = approach.title;
      select.appendChild(option);
    });

    select.onchange = (e) => this.selectApproach(e.target.value);
  }

  /**
   * Select an approach
   */
  selectApproach(approachId) {
    const workshop = this.stateManager.workshop.getCurrentWorkshop();
    const module = this.stateManager.workshop.getCurrentModule();
    const approach = ApproachesLogic.getApproach(workshop, approachId);

    if (!approach) return;

    this.stateManager.workshop.setCurrentApproach(approach, approachId);

    // Update UI
    const select = document.getElementById(CONFIG.ELEMENTS.APPROACH_SELECT);
    if (select) select.value = approachId;

    const description = document.getElementById(CONFIG.ELEMENTS.APPROACH_DESCRIPTION);
    if (description) description.textContent = approach.description;

    // Load saved code
    const savedCode = CodeLogic.getSavedCode(
      this.stateManager.progress.getAllProgress(),
      module.id,
      workshop.id,
      approachId
    );
    WorkshopComponent.setCode(savedCode || approach.starterCode);

    // Save approach selection
    const progress = this.stateManager.progress.getAllProgress();
    CodeLogic.saveApproachId(progress, module.id, workshop.id, approachId);
    this.stateManager.progress.save();

    // Hide feedback and render hints
    FeedbackComponent.hide();
    if (CONFIG.FEATURES.ENABLE_HINTS && HintsLogic.hasHints(workshop)) {
      this.renderHints(workshop);
    }
  }

  /**
   * Render hints
   */
  renderHints(workshop) {
    const container = document.getElementById(CONFIG.ELEMENTS.HINTS_CONTAINER);
    if (!container) return;

    container.innerHTML = '';
    const hints = HintsLogic.getHints(workshop);

    hints.forEach((hint, index) => {
      const button = document.createElement('button');
      button.className = CONFIG.CLASSES.HINT_BTN;
      button.textContent = HintsLogic.getHintButtonLabel(index);
      button.onclick = () => this.revealHint(index, hint);
      container.appendChild(button);
    });
  }

  /**
   * Reveal a hint
   */
  revealHint(index, hintText) {
    const container = document.getElementById(CONFIG.ELEMENTS.HINTS_CONTAINER);
    if (!container) return;

    const buttons = container.querySelectorAll(`.${CONFIG.CLASSES.HINT_BTN}`);
    const hintDiv = document.createElement('div');
    hintDiv.className = CONFIG.CLASSES.HINT;
    hintDiv.textContent = hintText;

    buttons[index].replaceWith(hintDiv);
    this.stateManager.workshop.revealHint();
  }

  /**
   * Submit code for grading
   */
  async submitCode() {
    const module = this.stateManager.workshop.getCurrentModule();
    const workshop = this.stateManager.workshop.getCurrentWorkshop();
    const code = WorkshopComponent.getCode();
    const approachId = this.stateManager.workshop.getCurrentApproachId();

    WorkshopComponent.disableSubmit();

    try {
      const result = await GradingService.submitCode(
        module.id,
        workshop.id,
        code,
        approachId
      );

      FeedbackComponent.display(result);

      // Update progress
      if (GradingService.isSuccess(result)) {
        const score = GradingService.getScore(result);
        this.stateManager.progress.updateWorkshopScore(module.id, workshop.id, score);
      }

      // Render visualizations
      if (CONFIG.FEATURES.ENABLE_VISUALIZATIONS && GradingService.hasVisualizations(result)) {
        const vizContainer = document.getElementById(CONFIG.ELEMENTS.VISUALIZATION_CONTAINER);
        if (vizContainer) {
          visualizationManager.renderAll(
            result.visualizations,
            result.execution_results,
            vizContainer
          );
        }
      }
    } catch (error) {
      console.error('Submission failed:', error);
      alert(CONFIG.MESSAGES.SUBMISSION_ERROR);
    } finally {
      WorkshopComponent.enableSubmit();
    }
  }

  /**
   * Reset code
   */
  resetCode() {
    const workshop = this.stateManager.workshop.getCurrentWorkshop();
    const approachId = this.stateManager.workshop.getCurrentApproachId();

    const starterCode = approachId
      ? ApproachesLogic.getApproach(workshop, approachId)?.starterCode
      : workshop.starterCode;

    WorkshopComponent.setCode(starterCode || '');
    FeedbackComponent.hide();
  }

  /**
   * Navigate to previous workshop
   */
  previousWorkshop() {
    if (!this.stateManager.workshop.hasPreviousWorkshop()) return;

    const module = this.stateManager.workshop.getCurrentModule();
    const currentIndex = this.stateManager.workshop.getCurrentWorkshopIndex();
    const previousWorkshop = module.workshops[currentIndex - 1];

    this.openWorkshop(previousWorkshop, currentIndex - 1);
  }

  /**
   * Navigate to next workshop
   */
  nextWorkshop() {
    if (!this.stateManager.workshop.hasNextWorkshop()) return;

    const module = this.stateManager.workshop.getCurrentModule();
    const currentIndex = this.stateManager.workshop.getCurrentWorkshopIndex();
    const nextWorkshop = module.workshops[currentIndex + 1];

    this.openWorkshop(nextWorkshop, currentIndex + 1);
  }

  /**
   * Update navigation buttons
   */
  updateNavigationButtons() {
    const hasPrevious = this.stateManager.workshop.hasPreviousWorkshop();
    const hasNext = this.stateManager.workshop.hasNextWorkshop();
    NavigationComponent.updateButtons(hasPrevious, hasNext);
  }

  /**
   * Back to dashboard
   */
  backToDashboard() {
    this.timer.stop();
    WorkshopComponent.hide();
    FeedbackComponent.clear();
    this.stateManager.workshop.clearCurrentWorkshop();
    this.renderDashboard();
  }

  /**
   * Setup auto-save
   */
  setupAutoSave() {
    const editor = document.getElementById(CONFIG.ELEMENTS.CODE_EDITOR);
    if (!editor) return;

    let saveTimeout;
    editor.addEventListener('input', () => {
      clearTimeout(saveTimeout);
      saveTimeout = setTimeout(() => {
        this.saveCode();
      }, CONFIG.UI.AUTO_SAVE_DELAY_MS);
    });
  }

  /**
   * Save code
   */
  saveCode() {
    const module = this.stateManager.workshop.getCurrentModule();
    const workshop = this.stateManager.workshop.getCurrentWorkshop();
    const code = WorkshopComponent.getCode();
    const approachId = this.stateManager.workshop.getCurrentApproachId();

    if (!module || !workshop) return;

    const progress = this.stateManager.progress.getAllProgress();
    CodeLogic.saveCode(progress, module.id, workshop.id, code, approachId);
    this.stateManager.progress.save();
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    const backBtn = document.getElementById(CONFIG.ELEMENTS.BACK_BTN);
    const submitBtn = document.getElementById(CONFIG.ELEMENTS.SUBMIT_BTN);
    const resetBtn = document.getElementById(CONFIG.ELEMENTS.RESET_BTN);
    const prevBtn = document.getElementById(CONFIG.ELEMENTS.PREV_WORKSHOP_BTN);
    const nextBtn = document.getElementById(CONFIG.ELEMENTS.NEXT_WORKSHOP_BTN);

    if (backBtn) backBtn.onclick = () => this.backToDashboard();
    if (submitBtn) submitBtn.onclick = () => this.submitCode();
    if (resetBtn) resetBtn.onclick = () => this.resetCode();
    if (prevBtn) prevBtn.onclick = () => this.previousWorkshop();
    if (nextBtn) nextBtn.onclick = () => this.nextWorkshop();
  }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  const app = new PythonTrainingApp();
  app.initialize();
});

