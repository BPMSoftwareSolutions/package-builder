/**
 * Python Training App - Frontend Logic
 * Handles module loading, workshop interaction, code submission, and progress tracking
 */

// State management
const state = {
  modules: [],
  currentModule: null,
  currentWorkshop: null,
  currentWorkshopIndex: 0,
  currentApproach: null,  // For multi-approach workshops
  currentApproachId: null,
  progress: {},
  timer: null,
  timerSeconds: 0,
  hintsRevealed: 0
};

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
  loadProgress();
  loadModules();
  setupEventListeners();
});

// Load progress from localStorage
function loadProgress() {
  const saved = localStorage.getItem('pythonTrainingProgress');
  if (saved) {
    try {
      state.progress = JSON.parse(saved);
    } catch (e) {
      console.error('Failed to load progress:', e);
      state.progress = {};
    }
  }
}

// Save progress to localStorage
function saveProgress() {
  localStorage.setItem('pythonTrainingProgress', JSON.stringify(state.progress));
}

// Load modules from API
async function loadModules() {
  try {
    const response = await fetch('/api/modules');
    const data = await response.json();
    state.modules = data.modules;
    renderModules();
  } catch (error) {
    console.error('Failed to load modules:', error);
    document.getElementById('modules-container').innerHTML = 
            '<p class="error">Failed to load modules. Please refresh the page.</p>';
  }
}

// Render modules in dashboard
function renderModules() {
  const container = document.getElementById('modules-container');
  container.innerHTML = '';

  state.modules.forEach(module => {
    const moduleProgress = state.progress[module.id] || { completed: 0, scores: {}, lastSeenAt: null };
    const completionPercent = (moduleProgress.completed / module.workshopCount) * 100;
        
    const card = document.createElement('div');
    card.className = 'module-card';
    card.onclick = () => openModule(module.id);
        
    const avgScore = calculateAvgScore(moduleProgress.scores);
    const scoreDisplay = avgScore > 0 ? `📊 Avg: ${avgScore}%` : '🆕 Not started';
        
    card.innerHTML = `
            <h3>${module.title}</h3>
            <p class="summary">${module.summary}</p>
            <div class="progress-bar">
                <div class="progress-fill" style="width: ${completionPercent}%"></div>
            </div>
            <div class="module-stats">
                <span>⏱️ ${module.estimatedMinutes} min</span>
                <span>${scoreDisplay}</span>
                <span>✅ ${moduleProgress.completed}/${module.workshopCount}</span>
            </div>
        `;
        
    container.appendChild(card);
  });
}

// Calculate average score
function calculateAvgScore(scores) {
  const values = Object.values(scores);
  if (values.length === 0) return 0;
  const sum = values.reduce((a, b) => a + b, 0);
  return Math.round(sum / values.length);
}

// Open a module and load its workshops
async function openModule(moduleId, workshopIndex = 0) {
  try {
    const response = await fetch(`/api/modules/${moduleId}`);
    const module = await response.json();
    state.currentModule = module;
    state.currentWorkshopIndex = workshopIndex;

    // Open specified workshop (or first one)
    if (module.workshops && module.workshops.length > 0) {
      openWorkshop(module.workshops[workshopIndex], workshopIndex);
    }
  } catch (error) {
    console.error('Failed to load module:', error);
    alert('Failed to load module. Please try again.');
  }
}

// Open a workshop
function openWorkshop(workshop, workshopIndex) {
  state.currentWorkshop = workshop;
  state.currentWorkshopIndex = workshopIndex;
  state.hintsRevealed = 0;

  // Switch views
  document.getElementById('dashboard-view').classList.add('hidden');
  document.getElementById('workshop-view').classList.remove('hidden');

  // Populate workshop content
  document.getElementById('workshop-title').textContent = workshop.title;
  document.getElementById('module-title').textContent = state.currentModule.title;
  document.getElementById('workshop-prompt').textContent = workshop.prompt;

  // Update progress indicator
  const totalWorkshops = state.currentModule.workshops.length;
  document.getElementById('workshop-progress').textContent = `${workshopIndex + 1} of ${totalWorkshops}`;

  // Update navigation buttons
  updateNavigationButtons();

  // Handle approaches (new format) vs single approach (old format)
  if (workshop.approaches && workshop.approaches.length > 0) {
    // Multi-approach workshop
    setupApproachSelector(workshop);

    // Load saved approach or default to first
    const savedApproachId = getSavedApproachId(state.currentModule.id, workshop.id);
    const approachId = savedApproachId || workshop.approaches[0].id;
    selectApproach(approachId);
  } else {
    // Single approach workshop (backward compatibility)
    hideApproachSelector();
    state.currentApproach = null;
    state.currentApproachId = null;

    // Load saved code or use starter code
    const savedCode = getSavedCode(state.currentModule.id, workshop.id, null);
    document.getElementById('code-editor').value = savedCode || workshop.starterCode;

    // Setup hints
    renderHints(workshop.hints);
  }

  // Hide feedback
  document.getElementById('feedback-section').classList.add('hidden');

  // Start timer
  startTimer(workshop.timeLimitMinutes);
}

// Setup approach selector for multi-approach workshops
function setupApproachSelector(workshop) {
  const selector = document.getElementById('approach-selector');
  const select = document.getElementById('approach-select');

  // Clear existing options
  select.innerHTML = '';

  // Populate options
  workshop.approaches.forEach(approach => {
    const option = document.createElement('option');
    option.value = approach.id;
    option.textContent = approach.title;
    select.appendChild(option);
  });

  // Show selector
  selector.style.display = 'block';

  // Add change listener
  select.onchange = () => selectApproach(select.value);
}

// Hide approach selector for single-approach workshops
function hideApproachSelector() {
  document.getElementById('approach-selector').style.display = 'none';
}

// Select a specific approach
function selectApproach(approachId) {
  const workshop = state.currentWorkshop;
  const approach = workshop.approaches.find(a => a.id === approachId);

  if (!approach) {
    console.error('Approach not found:', approachId);
    return;
  }

  state.currentApproach = approach;
  state.currentApproachId = approachId;

  // Update UI
  document.getElementById('approach-select').value = approachId;
  document.getElementById('approach-description').textContent = approach.description;

  // Load saved code for this approach or use starter code
  const savedCode = getSavedCode(state.currentModule.id, workshop.id, approachId);
  document.getElementById('code-editor').value = savedCode || approach.starterCode;

  // Setup hints for this approach
  renderHints(approach.hints);

  // Save selected approach
  saveApproachId(state.currentModule.id, workshop.id, approachId);

  // Hide feedback when switching approaches
  document.getElementById('feedback-section').classList.add('hidden');
}

// Render hints
function renderHints(hints) {
  const container = document.getElementById('hints-container');
  container.innerHTML = '';
    
  hints.forEach((hint, index) => {
    const button = document.createElement('button');
    button.className = 'hint-btn';
    button.textContent = `Show Hint ${index + 1}`;
    button.onclick = () => revealHint(index, hint);
    container.appendChild(button);
  });
}

// Reveal a hint
function revealHint(index, hintText) {
  const container = document.getElementById('hints-container');
  const buttons = container.querySelectorAll('.hint-btn');
    
  // Replace button with hint text
  const hintDiv = document.createElement('div');
  hintDiv.className = 'hint';
  hintDiv.textContent = hintText;
    
  buttons[index].replaceWith(hintDiv);
  state.hintsRevealed++;
}

// Start timer
function startTimer(minutes) {
  stopTimer();
  state.timerSeconds = minutes * 60;
  updateTimerDisplay();
    
  state.timer = setInterval(() => {
    state.timerSeconds--;
    updateTimerDisplay();
        
    if (state.timerSeconds <= 0) {
      stopTimer();
      alert('Time is up! You can still submit, but try to work faster next time.');
    }
  }, 1000);
}

// Stop timer
function stopTimer() {
  if (state.timer) {
    clearInterval(state.timer);
    state.timer = null;
  }
}

// Update timer display
function updateTimerDisplay() {
  const minutes = Math.floor(state.timerSeconds / 60);
  const seconds = state.timerSeconds % 60;
  const display = `⏱️ ${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    
  const timerEl = document.getElementById('timer-display');
  timerEl.textContent = display;
    
  // Add warning class if less than 1 minute
  if (state.timerSeconds < 60) {
    timerEl.classList.add('warning');
  } else {
    timerEl.classList.remove('warning');
  }
}

// Submit code for grading
async function submitCode() {
  const code = document.getElementById('code-editor').value;
  const submitBtn = document.getElementById('submit-btn');
    
  // Disable button during submission
  submitBtn.disabled = true;
  submitBtn.textContent = '⏳ Grading...';
    
  try {
    const payload = {
      moduleId: state.currentModule.id,
      workshopId: state.currentWorkshop.id,
      code: code
    };

    // Include approachId for multi-approach workshops
    if (state.currentApproachId) {
      payload.approachId = state.currentApproachId;
    }

    const response = await fetch('/api/grade', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const result = await response.json();
    displayFeedback(result);

    // Update progress
    if (result.ok) {
      updateProgress(result.score, result.max_score);
    }

  } catch (error) {
    console.error('Submission failed:', error);
    alert('Failed to submit code. Please try again.');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = '▶️ Run & Grade';
  }
}

// Display feedback
function displayFeedback(result) {
  const section = document.getElementById('feedback-section');
  const content = document.getElementById('feedback-content');

  section.classList.remove('hidden', 'success', 'error');

  if (result.ok) {
    const scorePercent = Math.round((result.score / result.max_score) * 100);
    const scoreClass = scorePercent >= 80 ? 'high' : scorePercent >= 60 ? 'medium' : 'low';

    section.classList.add(scorePercent >= 80 ? 'success' : 'error');

    content.innerHTML = `
            <div class="score-display ${scoreClass}">
                ${result.score} / ${result.max_score} (${scorePercent}%)
            </div>
            <div class="feedback-text">
                ${result.feedback}
            </div>
            <p style="margin-top: 10px; color: var(--text-secondary);">
                ⏱️ Execution time: ${result.elapsed_ms}ms
            </p>
            <div id="visualization-container"></div>
        `;

    // Render visualizations if present
    if (result.visualizations && result.execution_results) {
      const vizContainer = document.getElementById('visualization-container');
      visualizationManager.renderAll(result.visualizations, result.execution_results, vizContainer);
    }
  } else {
    section.classList.add('error');
    content.innerHTML = `
            <div class="score-display low">❌ Error</div>
            <div class="feedback-text">${result.error}</div>
            ${result.trace ? `<div class="error-trace">${result.trace.join('\n')}</div>` : ''}
        `;
  }
}

// Get saved code for a workshop (with optional approach)
function getSavedCode(moduleId, workshopId, approachId) {
  console.log('[getSavedCode]', { moduleId, workshopId, approachId });

  if (!state.progress[moduleId]) {
    console.log('[getSavedCode] No progress for module');
    return null;
  }
  if (!state.progress[moduleId].code) {
    console.log('[getSavedCode] No code object for module');
    return null;
  }

  const workshopCode = state.progress[moduleId].code[workshopId];
  if (!workshopCode) {
    console.log('[getSavedCode] No code for workshop');
    return null;
  }

  // If approachId is provided, get code for that specific approach
  if (approachId) {
    // MIGRATION: If workshopCode is a string (old format), migrate it
    if (typeof workshopCode === 'string') {
      console.log('[getSavedCode] Migrating old string format to object format');
      // Convert string to object format and save it
      const oldCode = workshopCode;
      state.progress[moduleId].code[workshopId] = {
        [approachId]: oldCode
      };
      saveProgress();
      return oldCode;
    }

    // New format: workshopCode is an object
    const code = workshopCode[approachId] || null;
    console.log('[getSavedCode] Returning approach code:', code ? code.substring(0, 50) + '...' : 'null');
    return code;
  }

  // Otherwise, return code for single-approach workshop
  const code = typeof workshopCode === 'string' ? workshopCode : null;
  console.log('[getSavedCode] Returning single-approach code:', code ? code.substring(0, 50) + '...' : 'null');
  return code;
}

// Save code for current workshop
function saveCode() {
  const moduleId = state.currentModule.id;
  const workshopId = state.currentWorkshop.id;
  const code = document.getElementById('code-editor').value;

  console.log('[saveCode]', { moduleId, workshopId, approachId: state.currentApproachId, codeLength: code.length });

  if (!state.progress[moduleId]) {
    state.progress[moduleId] = { completed: 0, scores: {}, code: {}, approaches: {}, lastSeenAt: null };
  }

  if (!state.progress[moduleId].code) {
    state.progress[moduleId].code = {};
  }

  // Save code per approach for multi-approach workshops
  if (state.currentApproachId) {
    // MIGRATION: If existing code is a string (old format), convert to object
    if (typeof state.progress[moduleId].code[workshopId] === 'string') {
      console.log('[saveCode] Migrating existing string format to object format');
      const oldCode = state.progress[moduleId].code[workshopId];
      state.progress[moduleId].code[workshopId] = {
        [state.currentApproachId]: oldCode
      };
    } else if (!state.progress[moduleId].code[workshopId]) {
      state.progress[moduleId].code[workshopId] = {};
    }
    state.progress[moduleId].code[workshopId][state.currentApproachId] = code;
    console.log('[saveCode] Saved approach code to:', `progress.${moduleId}.code.${workshopId}.${state.currentApproachId}`);
  } else {
    // Save code directly for single-approach workshops
    state.progress[moduleId].code[workshopId] = code;
    console.log('[saveCode] Saved single-approach code to:', `progress.${moduleId}.code.${workshopId}`);
  }

  saveProgress();
  console.log('[saveCode] Progress saved to localStorage');
}

// Get saved approach ID for a workshop
function getSavedApproachId(moduleId, workshopId) {
  if (!state.progress[moduleId]) return null;
  if (!state.progress[moduleId].approaches) return null;
  return state.progress[moduleId].approaches[workshopId];
}

// Save selected approach ID
function saveApproachId(moduleId, workshopId, approachId) {
  if (!state.progress[moduleId]) {
    state.progress[moduleId] = { completed: 0, scores: {}, code: {}, approaches: {}, lastSeenAt: null };
  }

  if (!state.progress[moduleId].approaches) {
    state.progress[moduleId].approaches = {};
  }

  state.progress[moduleId].approaches[workshopId] = approachId;
  saveProgress();
}

// Update progress
function updateProgress(score, maxScore) {
  const moduleId = state.currentModule.id;
  const workshopId = state.currentWorkshop.id;
  const approachId = state.currentApproachId;

  if (!state.progress[moduleId]) {
    state.progress[moduleId] = { completed: 0, scores: {}, code: {}, approaches: {}, approachScores: {}, lastSeenAt: null };
  }

  const moduleProgress = state.progress[moduleId];
  const scorePercent = Math.round((score / maxScore) * 100);

  // For multi-approach workshops, track scores per approach
  if (approachId) {
    if (!moduleProgress.approachScores) {
      moduleProgress.approachScores = {};
    }
    if (!moduleProgress.approachScores[workshopId]) {
      moduleProgress.approachScores[workshopId] = {};
    }

    // Store the approach score
    moduleProgress.approachScores[workshopId][approachId] = scorePercent;

    // Workshop is complete if ANY approach scores >= 80%
    const workshopComplete = Object.values(moduleProgress.approachScores[workshopId]).some(s => s >= 80);
    const wasComplete = moduleProgress.scores[workshopId] >= 80;

    // Update workshop-level score to highest approach score
    const maxApproachScore = Math.max(...Object.values(moduleProgress.approachScores[workshopId]));
    moduleProgress.scores[workshopId] = maxApproachScore;

    // Update completed count
    if (workshopComplete && !wasComplete) {
      moduleProgress.completed++;
    } else if (!workshopComplete && wasComplete) {
      moduleProgress.completed--;
    }
  } else {
    // Single approach workshop (backward compatibility)
    const previousScore = moduleProgress.scores[workshopId] || 0;
    moduleProgress.scores[workshopId] = scorePercent;

    // Update completed count (80% threshold)
    if (scorePercent >= 80 && previousScore < 80) {
      moduleProgress.completed++;
    } else if (scorePercent < 80 && previousScore >= 80) {
      moduleProgress.completed--;
    }
  }

  moduleProgress.lastSeenAt = new Date().toISOString();

  // Save code as well
  saveCode();
}

// Reset code to starter
function resetCode() {
  if (confirm('Reset code to starter template?')) {
    const starterCode = state.currentApproach
      ? state.currentApproach.starterCode
      : state.currentWorkshop.starterCode;
    document.getElementById('code-editor').value = starterCode;
    document.getElementById('feedback-section').classList.add('hidden');
  }
}

// Back to dashboard
function backToDashboard() {
  stopTimer();
  document.getElementById('workshop-view').classList.add('hidden');
  document.getElementById('dashboard-view').classList.remove('hidden');
  renderModules(); // Refresh to show updated progress
}

// Navigate to previous workshop
function previousWorkshop() {
  if (state.currentWorkshopIndex > 0) {
    const prevIndex = state.currentWorkshopIndex - 1;
    const prevWorkshop = state.currentModule.workshops[prevIndex];
    openWorkshop(prevWorkshop, prevIndex);
  }
}

// Navigate to next workshop
function nextWorkshop() {
  if (state.currentWorkshopIndex < state.currentModule.workshops.length - 1) {
    const nextIndex = state.currentWorkshopIndex + 1;
    const nextWorkshop = state.currentModule.workshops[nextIndex];
    openWorkshop(nextWorkshop, nextIndex);
  }
}

// Update navigation button visibility
function updateNavigationButtons() {
  const prevBtn = document.getElementById('prev-workshop-btn');
  const nextBtn = document.getElementById('next-workshop-btn');

  // Show/hide previous button
  if (state.currentWorkshopIndex > 0) {
    prevBtn.style.display = 'block';
  } else {
    prevBtn.style.display = 'none';
  }

  // Show/hide next button
  if (state.currentWorkshopIndex < state.currentModule.workshops.length - 1) {
    nextBtn.style.display = 'block';
  } else {
    nextBtn.style.display = 'none';
  }
}

// Setup event listeners
function setupEventListeners() {
  document.getElementById('back-btn').onclick = backToDashboard;
  document.getElementById('submit-btn').onclick = submitCode;
  document.getElementById('reset-btn').onclick = resetCode;
  document.getElementById('prev-workshop-btn').onclick = previousWorkshop;
  document.getElementById('next-workshop-btn').onclick = nextWorkshop;

  // Auto-save code as user types (debounced)
  let saveTimeout;
  document.getElementById('code-editor').addEventListener('input', () => {
    clearTimeout(saveTimeout);
    saveTimeout = setTimeout(() => {
      if (state.currentModule && state.currentWorkshop) {
        saveCode();
      }
    }, 1000); // Save 1 second after user stops typing
  });

  // Keyboard shortcuts
  document.getElementById('code-editor').addEventListener('keydown', (e) => {
    // Tab key inserts spaces
    if (e.key === 'Tab') {
      e.preventDefault();
      const start = e.target.selectionStart;
      const end = e.target.selectionEnd;
      e.target.value = e.target.value.substring(0, start) + '    ' + e.target.value.substring(end);
      e.target.selectionStart = e.target.selectionEnd = start + 4;
    }

    // Ctrl+Enter to submit
    if (e.ctrlKey && e.key === 'Enter') {
      submitCode();
    }
  });
}

// ============================================================================
// Visualization System
// ============================================================================

/**
 * Base Renderer Interface
 * All visualization renderers must implement this interface
 */
class BaseRenderer {
  /**
   * Render visualization
   * @param {Object} _config - Visualization configuration (unused in base class)
   * @param {Object} _executionResults - Execution results from grading (unused in base class)
   * @returns {HTMLElement} - Rendered visualization element
   */
  render(_config, _executionResults) {
    throw new Error('render() must be implemented by subclass');
  }

  /**
   * Clean up resources when visualization is removed
   */
  destroy() {
    // Override if cleanup is needed
  }
}

/**
 * CLI Dashboard Renderer
 * Renders text-based dashboards with ASCII art
 */
class CLIRenderer extends BaseRenderer {
  render(config, executionResults) {
    const container = document.createElement('div');
    container.className = 'cli-visualization';

    // Get template and placeholders from config
    const template = config.config?.template || '';
    const placeholders = config.config?.placeholders || {};

    // Replace placeholders with actual values
    let output = template;
    for (const [key, path] of Object.entries(placeholders)) {
      const value = this.resolvePath(path, executionResults);
      output = output.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
    }

    // Create pre element for formatted text
    const pre = document.createElement('pre');
    pre.className = 'cli-output';
    pre.textContent = output;

    container.appendChild(pre);
    return container;
  }

  /**
   * Resolve a dot-notation path in execution results
   * @param {string} path - Dot-notation path (e.g., "execution.variables.x.value")
   * @param {Object} executionResults - Execution results object
   * @returns {string} - Resolved value or placeholder
   */
  resolvePath(path, executionResults) {
    // Handle literal values (not paths)
    if (!path.startsWith('execution.')) {
      return path;
    }

    // Remove 'execution.' prefix and split path
    const parts = path.replace('execution.', '').split('.');
    let current = executionResults;

    for (const part of parts) {
      if (current && typeof current === 'object' && part in current) {
        current = current[part];
      } else {
        return `{${path}}`;  // Return placeholder if path not found
      }
    }

    // Convert arrays to comma-separated strings
    if (Array.isArray(current)) {
      return current.join(', ');
    }

    return String(current);
  }
}

/**
 * Web UI Renderer
 * Renders interactive web-based visualizations with split-panel layout
 * Left panel: Monaco editor with user code
 * Right panel: Dynamic results panel
 */
class WebUIRenderer extends BaseRenderer {
  constructor() {
    super();
    this.monacoEditor = null;
    this.editorContainer = null;
  }

  render(config, executionResults) {
    const container = document.createElement('div');
    container.className = 'web-visualization';

    // Create split-panel layout
    const layout = config.config?.layout || 'split-horizontal';
    const panels = config.config?.panels || [];

    if (layout === 'split-horizontal') {
      this.createSplitHorizontalLayout(container, panels, executionResults);
    } else if (layout === 'split-vertical') {
      this.createSplitVerticalLayout(container, panels, executionResults);
    } else if (layout === 'tabbed') {
      this.createTabbedLayout(container, panels, executionResults);
    }

    return container;
  }

  /**
   * Create horizontal split layout (left-right)
   */
  createSplitHorizontalLayout(container, panels, executionResults) {
    container.classList.add('split-horizontal');

    const wrapper = document.createElement('div');
    wrapper.className = 'split-panel-wrapper';

    for (const panel of panels) {
      const panelElement = this.createPanel(panel, executionResults);
      wrapper.appendChild(panelElement);
    }

    container.appendChild(wrapper);
  }

  /**
   * Create vertical split layout (top-bottom)
   */
  createSplitVerticalLayout(container, panels, executionResults) {
    container.classList.add('split-vertical');

    const wrapper = document.createElement('div');
    wrapper.className = 'split-panel-wrapper';

    for (const panel of panels) {
      const panelElement = this.createPanel(panel, executionResults);
      wrapper.appendChild(panelElement);
    }

    container.appendChild(wrapper);
  }

  /**
   * Create tabbed layout
   */
  createTabbedLayout(container, panels, executionResults) {
    container.classList.add('tabbed-layout');

    const tabContainer = document.createElement('div');
    tabContainer.className = 'tab-container';

    const tabButtons = document.createElement('div');
    tabButtons.className = 'tab-buttons';

    const tabContents = document.createElement('div');
    tabContents.className = 'tab-contents';

    panels.forEach((panel, index) => {
      const button = document.createElement('button');
      button.className = `tab-button ${index === 0 ? 'active' : ''}`;
      button.textContent = panel.title || `Panel ${index + 1}`;
      button.onclick = () => this.switchTab(tabContents, index);
      tabButtons.appendChild(button);

      const content = document.createElement('div');
      content.className = `tab-content ${index === 0 ? 'active' : ''}`;
      content.appendChild(this.createPanel(panel, executionResults));
      tabContents.appendChild(content);
    });

    tabContainer.appendChild(tabButtons);
    tabContainer.appendChild(tabContents);
    container.appendChild(tabContainer);
  }

  /**
   * Switch active tab
   */
  switchTab(tabContents, index) {
    const contents = tabContents.querySelectorAll('.tab-content');
    const buttons = tabContents.parentElement.querySelectorAll('.tab-button');

    contents.forEach((content, i) => {
      content.classList.toggle('active', i === index);
    });

    buttons.forEach((button, i) => {
      button.classList.toggle('active', i === index);
    });
  }

  /**
   * Create individual panel based on type
   */
  createPanel(panel, executionResults) {
    const panelElement = document.createElement('div');
    panelElement.className = `panel panel-${panel.type}`;

    // Add title if present
    if (panel.title) {
      const title = document.createElement('div');
      title.className = 'panel-title';
      title.textContent = panel.title;
      panelElement.appendChild(title);
    }

    const content = document.createElement('div');
    content.className = 'panel-content';

    if (panel.type === 'code-editor') {
      this.createCodeEditor(content, panel, executionResults);
    } else if (panel.type === 'results') {
      this.createResultsPanel(content, panel, executionResults);
    } else if (panel.type === 'code') {
      this.createCodeDisplay(content, panel, executionResults);
    } else if (panel.type === 'dashboard') {
      this.createDashboardPanel(content, panel, executionResults);
    }

    panelElement.appendChild(content);
    return panelElement;
  }

  /**
   * Create code editor panel with Monaco
   */
  createCodeEditor(container, panel, executionResults) {
    this.editorContainer = document.createElement('div');
    this.editorContainer.className = 'monaco-editor-container';
    this.editorContainer.style.height = '400px';

    container.appendChild(this.editorContainer);

    // Load Monaco Editor dynamically
    this.loadMonacoEditor(this.editorContainer, panel, executionResults);
  }

  /**
   * Load Monaco Editor
   */
  loadMonacoEditor(container, panel, executionResults) {
    // Check if Monaco is available
    if (typeof require !== 'undefined' && typeof monaco !== 'undefined') {
      this.initializeMonaco(container, panel, executionResults);
    } else {
      // Fallback to simple code display if Monaco not available
      this.createCodeDisplay(container, panel, executionResults);
    }
  }

  /**
   * Initialize Monaco Editor
   */
  initializeMonaco(container, panel, executionResults) {
    try {
      // Get user code from execution results
      const userCode = executionResults.user_code || '# No code available';

      // Create editor
      const editor = monaco.editor.create(container, {
        value: userCode,
        language: 'python',
        theme: 'vs-dark',
        readOnly: true,
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        automaticLayout: true
      });

      this.monacoEditor = editor;
    } catch (error) {
      console.error('Failed to initialize Monaco Editor:', error);
      // Fallback to simple code display
      this.createCodeDisplay(container, panel, executionResults);
    }
  }

  /**
   * Create simple code display (fallback)
   */
  createCodeDisplay(container, panel, executionResults) {
    const code = executionResults.user_code || '# No code available';

    const pre = document.createElement('pre');
    pre.className = 'code-display';
    pre.textContent = code;

    container.appendChild(pre);
  }

  /**
   * Create dashboard panel with card-based layout
   */
  createDashboardPanel(container, panel, executionResults) {
    const dashboard = document.createElement('div');
    dashboard.className = 'dashboard-container';

    // Create header
    const header = document.createElement('div');
    header.className = 'dashboard-header';
    header.innerHTML = `<h3>${panel.title || 'Execution Dashboard'}</h3>`;
    dashboard.appendChild(header);

    // Create cards grid
    const cardsGrid = document.createElement('div');
    cardsGrid.className = 'dashboard-grid';

    // Functions card
    if (executionResults.functions && Object.keys(executionResults.functions).length > 0) {
      const functionItems = Object.values(executionResults.functions);
      const functionsCard = this.createDashboardCard(
        'Functions',
        '⚙️',
        functionItems,
        'function'
      );
      cardsGrid.appendChild(functionsCard);
    }

    // Classes card
    if (executionResults.classes && Object.keys(executionResults.classes).length > 0) {
      const classNames = Object.keys(executionResults.classes);
      const classesCard = this.createDashboardCard(
        'Classes',
        '🏗️',
        classNames,
        'class'
      );
      cardsGrid.appendChild(classesCard);
    }

    // Variables card
    if (executionResults.variables && Object.keys(executionResults.variables).length > 0) {
      const varEntries = Object.entries(executionResults.variables).map(
        ([name, info]) => `${name}: ${info.value}`
      );
      const variablesCard = this.createDashboardCard(
        'Variables',
        '📊',
        varEntries,
        'variable'
      );
      cardsGrid.appendChild(variablesCard);
    }

    dashboard.appendChild(cardsGrid);
    container.appendChild(dashboard);
  }

  /**
   * Create a dashboard card
   */
  createDashboardCard(title, icon, items, type) {
    const card = document.createElement('div');
    card.className = `dashboard-card dashboard-card-${type}`;

    const cardHeader = document.createElement('div');
    cardHeader.className = 'dashboard-card-header';
    cardHeader.innerHTML = `<span class="dashboard-icon">${icon}</span><h4>${title}</h4>`;
    card.appendChild(cardHeader);

    const cardBody = document.createElement('div');
    cardBody.className = 'dashboard-card-body';

    if (items.length === 0) {
      cardBody.textContent = 'None';
    } else {
      const list = document.createElement('ul');
      list.className = 'dashboard-item-list';
      for (const item of items) {
        const li = document.createElement('li');
        li.className = 'dashboard-item';

        // Handle both string items and objects with return values
        if (typeof item === 'string') {
          li.innerHTML = `<span class="dashboard-badge">✓</span> ${item}`;
        } else if (typeof item === 'object' && item !== null) {
          // Object with name and return_value (for functions)
          let badge = '✓';
          let badgeClass = 'dashboard-badge';

          // Check if there are expected results that don't match
          if (item.expected_results && item.return_value !== undefined) {
            const actualStr = Array.isArray(item.return_value)
              ? JSON.stringify(item.return_value)
              : String(item.return_value);

            // Check if actual matches any expected result
            let matches = false;
            for (const expected of item.expected_results) {
              const expectedStr = Array.isArray(expected)
                ? JSON.stringify(expected)
                : String(expected);
              if (actualStr === expectedStr) {
                matches = true;
                break;
              }
            }

            if (!matches) {
              badge = '✗';
              badgeClass = 'dashboard-badge dashboard-badge-error';
            }
          }

          // Create a container for the function item
          const itemContainer = document.createElement('div');
          itemContainer.className = 'dashboard-function-item';

          // First line: badge + name + actual return value
          const firstLine = document.createElement('div');
          firstLine.className = 'dashboard-function-line';
          let content = `<span class="${badgeClass}">${badge}</span> ${item.name}`;
          if (item.return_value !== undefined && item.return_value !== null) {
            const returnValueStr = Array.isArray(item.return_value)
              ? `[${item.return_value.join(', ')}]`
              : String(item.return_value);
            content += `<span class="dashboard-return-value"> → ${returnValueStr}</span>`;
          }
          firstLine.innerHTML = content;
          itemContainer.appendChild(firstLine);

          // Second line: expected results if there's a mismatch
          if (item.expected_results && item.return_value !== undefined) {
            const actualStr = Array.isArray(item.return_value)
              ? JSON.stringify(item.return_value)
              : String(item.return_value);

            let matches = false;
            for (const expected of item.expected_results) {
              const expectedStr = Array.isArray(expected)
                ? JSON.stringify(expected)
                : String(expected);
              if (actualStr === expectedStr) {
                matches = true;
                break;
              }
            }

            if (!matches) {
              // Show expected results on new line
              const secondLine = document.createElement('div');
              secondLine.className = 'dashboard-expected-line';
              const expectedStr = item.expected_results.map(e =>
                Array.isArray(e) ? `[${e.join(', ')}]` : String(e)
              ).join(' or ');
              secondLine.innerHTML = `<span class="dashboard-expected-value">(expected: ${expectedStr})</span>`;
              itemContainer.appendChild(secondLine);
            }
          }

          li.appendChild(itemContainer);
        }

        list.appendChild(li);
      }
      cardBody.appendChild(list);
    }

    card.appendChild(cardBody);
    return card;
  }

  /**
   * Create results panel with dynamic sections
   */
  createResultsPanel(container, panel, executionResults) {
    const sections = panel.sections || [];

    if (sections.length === 0) {
      // Default: show all execution results
      this.createDefaultResultsDisplay(container, executionResults);
    } else {
      // Render configured sections
      for (const section of sections) {
        this.createResultSection(container, section, executionResults);
      }
    }
  }

  /**
   * Create default results display
   */
  createDefaultResultsDisplay(container, executionResults) {
    const resultsDiv = document.createElement('div');
    resultsDiv.className = 'results-display';

    // Display classes
    if (executionResults.classes && Object.keys(executionResults.classes).length > 0) {
      const classesSection = document.createElement('div');
      classesSection.className = 'results-section';
      classesSection.innerHTML = '<h4>Classes</h4>';

      const classList = document.createElement('ul');
      for (const [name, classInfo] of Object.entries(executionResults.classes)) {
        const li = document.createElement('li');
        li.textContent = `${name}: ${classInfo.methods?.join(', ') || 'no methods'}`;
        classList.appendChild(li);
      }
      classesSection.appendChild(classList);
      resultsDiv.appendChild(classesSection);
    }

    // Display functions
    if (executionResults.functions && Object.keys(executionResults.functions).length > 0) {
      const functionsSection = document.createElement('div');
      functionsSection.className = 'results-section';
      functionsSection.innerHTML = '<h4>Functions</h4>';

      const functionList = document.createElement('ul');
      for (const name of Object.keys(executionResults.functions)) {
        const li = document.createElement('li');
        li.textContent = name;
        functionList.appendChild(li);
      }
      functionsSection.appendChild(functionList);
      resultsDiv.appendChild(functionsSection);
    }

    // Display variables
    if (executionResults.variables && Object.keys(executionResults.variables).length > 0) {
      const variablesSection = document.createElement('div');
      variablesSection.className = 'results-section';
      variablesSection.innerHTML = '<h4>Variables</h4>';

      const varList = document.createElement('ul');
      for (const [name, varInfo] of Object.entries(executionResults.variables)) {
        const li = document.createElement('li');
        li.textContent = `${name}: ${varInfo.value}`;
        varList.appendChild(li);
      }
      variablesSection.appendChild(varList);
      resultsDiv.appendChild(variablesSection);
    }

    container.appendChild(resultsDiv);
  }

  /**
   * Create individual result section
   */
  createResultSection(container, section, executionResults) {
    const sectionDiv = document.createElement('div');
    sectionDiv.className = 'results-section';

    if (section.title) {
      const title = document.createElement('h4');
      title.textContent = section.title;
      sectionDiv.appendChild(title);
    }

    if (section.type === 'table') {
      this.createTableDisplay(sectionDiv, section, executionResults);
    } else if (section.type === 'key-value') {
      this.createKeyValueDisplay(sectionDiv, section, executionResults);
    } else if (section.type === 'list') {
      this.createListDisplay(sectionDiv, section, executionResults);
    }

    container.appendChild(sectionDiv);
  }

  /**
   * Create table display
   */
  createTableDisplay(container, section, executionResults) {
    const data = this.resolvePath(section.data, executionResults);

    if (!Array.isArray(data) || data.length === 0) {
      container.textContent = 'No data available';
      return;
    }

    const table = document.createElement('table');
    table.className = 'results-table';

    // Create header
    const headerRow = document.createElement('tr');
    const firstItem = data[0];
    if (typeof firstItem === 'object') {
      for (const key of Object.keys(firstItem)) {
        const th = document.createElement('th');
        th.textContent = key;
        headerRow.appendChild(th);
      }
    }
    table.appendChild(headerRow);

    // Create rows
    for (const item of data) {
      const row = document.createElement('tr');
      if (typeof item === 'object') {
        for (const value of Object.values(item)) {
          const td = document.createElement('td');
          td.textContent = String(value);
          row.appendChild(td);
        }
      } else {
        const td = document.createElement('td');
        td.textContent = String(item);
        row.appendChild(td);
      }
      table.appendChild(row);
    }

    container.appendChild(table);
  }

  /**
   * Create key-value display
   */
  createKeyValueDisplay(container, section, executionResults) {
    const data = this.resolvePath(section.data, executionResults);

    if (typeof data !== 'object' || data === null) {
      container.textContent = 'No data available';
      return;
    }

    const list = document.createElement('dl');
    list.className = 'key-value-list';

    for (const [key, value] of Object.entries(data)) {
      const dt = document.createElement('dt');
      dt.textContent = key;
      const dd = document.createElement('dd');
      dd.textContent = String(value);
      list.appendChild(dt);
      list.appendChild(dd);
    }

    container.appendChild(list);
  }

  /**
   * Create list display
   */
  createListDisplay(container, section, executionResults) {
    const data = this.resolvePath(section.data, executionResults);

    if (!data) {
      container.textContent = 'No data available';
      return;
    }

    // Handle both arrays and objects (convert object keys to array)
    let items = Array.isArray(data) ? data : Object.keys(data);

    if (items.length === 0) {
      container.textContent = 'No data available';
      return;
    }

    const list = document.createElement('ul');
    list.className = 'results-list';

    for (const item of items) {
      const li = document.createElement('li');
      li.textContent = String(item);
      list.appendChild(li);
    }

    container.appendChild(list);
  }

  /**
   * Resolve a dot-notation path in execution results
   */
  resolvePath(path, executionResults) {
    if (!path || !path.startsWith('execution.')) {
      return null;
    }

    const parts = path.replace('execution.', '').split('.');
    let current = executionResults;

    for (const part of parts) {
      if (current && typeof current === 'object' && part in current) {
        current = current[part];
      } else {
        return null;
      }
    }

    return current;
  }

  /**
   * Clean up resources
   */
  destroy() {
    if (this.monacoEditor) {
      this.monacoEditor.dispose();
      this.monacoEditor = null;
    }
  }
}

/**
 * Visualization Manager
 * Orchestrates rendering of visualizations based on configuration
 */
class VisualizationManager {
  constructor() {
    this.renderers = {
      'cli': new CLIRenderer(),
      'web': new WebUIRenderer(),
      // Future renderers will be added here:
      // 'animation': new AnimationRenderer(),
      // 'agentic': new AgenticRenderer()
    };
    this.activeVisualizations = [];
  }

  /**
   * Render all enabled visualizations
   * @param {Array} visualizations - Array of visualization configs
   * @param {Object} executionResults - Execution results from grading
   * @param {HTMLElement} container - Container element for visualizations
   */
  renderAll(visualizations, executionResults, container) {
    // Clear previous visualizations
    this.clearAll();
    container.innerHTML = '';

    if (!visualizations || visualizations.length === 0) {
      return;
    }

    // Render each enabled visualization
    for (const vizConfig of visualizations) {
      if (!vizConfig.enabled) {
        continue;
      }

      const renderer = this.renderers[vizConfig.type];
      if (!renderer) {
        console.warn(`No renderer found for visualization type: ${vizConfig.type}`);
        continue;
      }

      try {
        const element = renderer.render(vizConfig, executionResults);
        container.appendChild(element);
        this.activeVisualizations.push({ renderer, element });
      } catch (error) {
        console.error(`Failed to render visualization ${vizConfig.id}:`, error);
      }
    }
  }

  /**
   * Clear all active visualizations
   */
  clearAll() {
    for (const { renderer, element } of this.activeVisualizations) {
      if (renderer.destroy) {
        renderer.destroy();
      }
      if (element.parentNode) {
        element.parentNode.removeChild(element);
      }
    }
    this.activeVisualizations = [];
  }
}

// Create global visualization manager instance
const visualizationManager = new VisualizationManager();

