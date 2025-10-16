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

          // First line: badge + name + arguments
          const firstLine = document.createElement('div');
          firstLine.className = 'dashboard-function-line';
          let content = `<span class="${badgeClass}">${badge}</span> ${item.name}`;

          // Add arguments if available
          if (item.arguments && item.arguments.length > 0) {
            const argsStr = item.arguments.map(arg => {
              if (Array.isArray(arg)) {
                return `[${arg.join(', ')}]`;
              } else if (typeof arg === 'object' && arg !== null) {
                return JSON.stringify(arg);
              } else if (typeof arg === 'string') {
                return `"${arg}"`;
              } else {
                return String(arg);
              }
            }).join(', ');
            content += `<span class="dashboard-arguments">(${argsStr})</span>`;
          }

          firstLine.innerHTML = content;
          itemContainer.appendChild(firstLine);

          // Second line: return value
          if (item.return_value !== undefined && item.return_value !== null) {
            const returnLine = document.createElement('div');
            returnLine.className = 'dashboard-return-line';
            const returnValueStr = Array.isArray(item.return_value)
              ? `[${item.return_value.join(', ')}]`
              : String(item.return_value);
            returnLine.innerHTML = `<span class="dashboard-return-value">→ ${returnValueStr}</span>`;
            itemContainer.appendChild(returnLine);
          }

          // Third line: expected results if there's a mismatch
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
              const thirdLine = document.createElement('div');
              thirdLine.className = 'dashboard-expected-line';
              const expectedStr = item.expected_results.map(e =>
                Array.isArray(e) ? `[${e.join(', ')}]` : String(e)
              ).join(' or ');
              thirdLine.innerHTML = `<span class="dashboard-expected-value">(expected: ${expectedStr})</span>`;
              itemContainer.appendChild(thirdLine);
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
 * Animation Renderer
 * Renders SVG/Canvas-based animations for data flow visualization
 * Supports data-flow, state-machine, and tree animation types
 */
class AnimationRenderer extends BaseRenderer {
  constructor() {
    super();
    this.animationId = null;
    this.isPlaying = false;
    this.speed = 1;
    this.currentStep = 0;
    this.totalSteps = 0;
    this.animationFrameId = null;
    this.startTime = 0;
  }

  render(config, executionResults) {
    const container = document.createElement('div');
    container.className = 'animation-visualization';
    container.style.cssText = 'width: 100%; height: 400px; border: 1px solid #ddd; border-radius: 4px; background: #f9f9f9; position: relative;';

    const animationType = config.config?.animationType || 'data-flow';
    const duration = config.config?.duration || 2000;
    const autoPlay = config.config?.autoPlay !== false;

    // Create SVG canvas
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', '100%');
    svg.setAttribute('height', '100%');
    svg.setAttribute('viewBox', '0 0 800 400');
    svg.style.cssText = 'display: block;';

    // Create animation based on type
    if (animationType === 'data-flow') {
      this.createDataFlowAnimation(svg, executionResults, duration);
    } else if (animationType === 'state-machine') {
      this.createStateMachineAnimation(svg, executionResults, duration);
    } else if (animationType === 'tree') {
      this.createTreeAnimation(svg, executionResults, duration);
    }

    container.appendChild(svg);

    // Create controls
    const controls = this.createControls(container, duration, autoPlay);
    container.appendChild(controls);

    // Store animation data for playback
    container.animationData = {
      svg,
      duration,
      animationType,
      executionResults
    };

    // Auto-play if enabled
    if (autoPlay) {
      this.playAnimation(container);
    }

    return container;
  }

  createDataFlowAnimation(svg, executionResults, duration) {
    // Create a simple data flow animation showing array transformation
    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');

    // Define arrow marker
    const marker = document.createElementNS('http://www.w3.org/2000/svg', 'marker');
    marker.setAttribute('id', 'arrowhead');
    marker.setAttribute('markerWidth', '10');
    marker.setAttribute('markerHeight', '10');
    marker.setAttribute('refX', '9');
    marker.setAttribute('refY', '3');
    marker.setAttribute('orient', 'auto');
    const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
    polygon.setAttribute('points', '0 0, 10 3, 0 6');
    polygon.setAttribute('fill', '#4CAF50');
    marker.appendChild(polygon);
    defs.appendChild(marker);
    svg.appendChild(defs);

    // Input array
    const inputGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    inputGroup.setAttribute('class', 'input-group');

    const inputLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    inputLabel.setAttribute('x', '50');
    inputLabel.setAttribute('y', '30');
    inputLabel.setAttribute('font-size', '14');
    inputLabel.setAttribute('font-weight', 'bold');
    inputLabel.textContent = 'Input';
    inputGroup.appendChild(inputLabel);

    const inputRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    inputRect.setAttribute('x', '30');
    inputRect.setAttribute('y', '50');
    inputRect.setAttribute('width', '120');
    inputRect.setAttribute('height', '60');
    inputRect.setAttribute('fill', '#E3F2FD');
    inputRect.setAttribute('stroke', '#1976D2');
    inputRect.setAttribute('stroke-width', '2');
    inputRect.setAttribute('rx', '4');
    inputGroup.appendChild(inputRect);

    const inputText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    inputText.setAttribute('x', '90');
    inputText.setAttribute('y', '85');
    inputText.setAttribute('text-anchor', 'middle');
    inputText.setAttribute('font-size', '12');
    inputText.setAttribute('font-family', 'monospace');
    inputText.textContent = '[1,2,3,4]';
    inputGroup.appendChild(inputText);
    svg.appendChild(inputGroup);

    // Processing arrow
    const arrow1 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    arrow1.setAttribute('x1', '150');
    arrow1.setAttribute('y1', '80');
    arrow1.setAttribute('x2', '250');
    arrow1.setAttribute('y2', '80');
    arrow1.setAttribute('stroke', '#4CAF50');
    arrow1.setAttribute('stroke-width', '2');
    arrow1.setAttribute('marker-end', 'url(#arrowhead)');
    svg.appendChild(arrow1);

    // Processing box
    const processGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    processGroup.setAttribute('class', 'process-group');

    const processLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    processLabel.setAttribute('x', '300');
    processLabel.setAttribute('y', '30');
    processLabel.setAttribute('font-size', '14');
    processLabel.setAttribute('font-weight', 'bold');
    processLabel.textContent = 'Process';
    processGroup.appendChild(processLabel);

    const processRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    processRect.setAttribute('x', '250');
    processRect.setAttribute('y', '50');
    processRect.setAttribute('width', '120');
    processRect.setAttribute('height', '60');
    processRect.setAttribute('fill', '#FFF3E0');
    processRect.setAttribute('stroke', '#F57C00');
    processRect.setAttribute('stroke-width', '2');
    processRect.setAttribute('rx', '4');
    processGroup.appendChild(processRect);

    const processText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    processText.setAttribute('x', '310');
    processText.setAttribute('y', '85');
    processText.setAttribute('text-anchor', 'middle');
    processText.setAttribute('font-size', '12');
    processText.setAttribute('font-family', 'monospace');
    processText.textContent = 'Filter & Map';
    processGroup.appendChild(processText);
    svg.appendChild(processGroup);

    // Output arrow
    const arrow2 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    arrow2.setAttribute('x1', '370');
    arrow2.setAttribute('y1', '80');
    arrow2.setAttribute('x2', '470');
    arrow2.setAttribute('y2', '80');
    arrow2.setAttribute('stroke', '#4CAF50');
    arrow2.setAttribute('stroke-width', '2');
    arrow2.setAttribute('marker-end', 'url(#arrowhead)');
    svg.appendChild(arrow2);

    // Output array
    const outputGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    outputGroup.setAttribute('class', 'output-group');

    const outputLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    outputLabel.setAttribute('x', '500');
    outputLabel.setAttribute('y', '30');
    outputLabel.setAttribute('font-size', '14');
    outputLabel.setAttribute('font-weight', 'bold');
    outputLabel.textContent = 'Output';
    outputGroup.appendChild(outputLabel);

    const outputRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    outputRect.setAttribute('x', '470');
    outputRect.setAttribute('y', '50');
    outputRect.setAttribute('width', '120');
    outputRect.setAttribute('height', '60');
    outputRect.setAttribute('fill', '#E8F5E9');
    outputRect.setAttribute('stroke', '#388E3C');
    outputRect.setAttribute('stroke-width', '2');
    outputRect.setAttribute('rx', '4');
    outputGroup.appendChild(outputRect);

    const outputText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    outputText.setAttribute('x', '530');
    outputText.setAttribute('y', '85');
    outputText.setAttribute('text-anchor', 'middle');
    outputText.setAttribute('font-size', '12');
    outputText.setAttribute('font-family', 'monospace');
    outputText.textContent = '[4,16]';
    outputGroup.appendChild(outputText);
    svg.appendChild(outputGroup);

    // Add animation
    const animateArrow1 = document.createElementNS('http://www.w3.org/2000/svg', 'animate');
    animateArrow1.setAttribute('attributeName', 'stroke-dasharray');
    animateArrow1.setAttribute('values', '0,100;100,0');
    animateArrow1.setAttribute('dur', `${duration}ms`);
    animateArrow1.setAttribute('repeatCount', 'indefinite');
    arrow1.appendChild(animateArrow1);

    const animateArrow2 = document.createElementNS('http://www.w3.org/2000/svg', 'animate');
    animateArrow2.setAttribute('attributeName', 'stroke-dasharray');
    animateArrow2.setAttribute('values', '0,100;100,0');
    animateArrow2.setAttribute('dur', `${duration}ms`);
    animateArrow2.setAttribute('begin', `${duration / 3}ms`);
    animateArrow2.setAttribute('repeatCount', 'indefinite');
    arrow2.appendChild(animateArrow2);
  }

  createStateMachineAnimation(svg, executionResults, duration) {
    // Create a simple state machine animation
    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');

    // Define arrow marker
    const marker = document.createElementNS('http://www.w3.org/2000/svg', 'marker');
    marker.setAttribute('id', 'arrowhead-state');
    marker.setAttribute('markerWidth', '10');
    marker.setAttribute('markerHeight', '10');
    marker.setAttribute('refX', '9');
    marker.setAttribute('refY', '3');
    marker.setAttribute('orient', 'auto');
    const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
    polygon.setAttribute('points', '0 0, 10 3, 0 6');
    polygon.setAttribute('fill', '#2196F3');
    marker.appendChild(polygon);
    defs.appendChild(marker);
    svg.appendChild(defs);

    // State 1
    const state1 = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    state1.setAttribute('cx', '100');
    state1.setAttribute('cy', '200');
    state1.setAttribute('r', '40');
    state1.setAttribute('fill', '#E3F2FD');
    state1.setAttribute('stroke', '#1976D2');
    state1.setAttribute('stroke-width', '2');
    svg.appendChild(state1);

    const state1Text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    state1Text.setAttribute('x', '100');
    state1Text.setAttribute('y', '205');
    state1Text.setAttribute('text-anchor', 'middle');
    state1Text.setAttribute('font-size', '14');
    state1Text.setAttribute('font-weight', 'bold');
    state1Text.textContent = 'S1';
    svg.appendChild(state1Text);

    // Transition arrow 1
    const trans1 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    trans1.setAttribute('x1', '140');
    trans1.setAttribute('y1', '200');
    trans1.setAttribute('x2', '260');
    trans1.setAttribute('y2', '200');
    trans1.setAttribute('stroke', '#2196F3');
    trans1.setAttribute('stroke-width', '2');
    trans1.setAttribute('marker-end', 'url(#arrowhead-state)');
    svg.appendChild(trans1);

    // State 2
    const state2 = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    state2.setAttribute('cx', '300');
    state2.setAttribute('cy', '200');
    state2.setAttribute('r', '40');
    state2.setAttribute('fill', '#FFF3E0');
    state2.setAttribute('stroke', '#F57C00');
    state2.setAttribute('stroke-width', '2');
    svg.appendChild(state2);

    const state2Text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    state2Text.setAttribute('x', '300');
    state2Text.setAttribute('y', '205');
    state2Text.setAttribute('text-anchor', 'middle');
    state2Text.setAttribute('font-size', '14');
    state2Text.setAttribute('font-weight', 'bold');
    state2Text.textContent = 'S2';
    svg.appendChild(state2Text);

    // Transition arrow 2
    const trans2 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    trans2.setAttribute('x1', '340');
    trans2.setAttribute('y1', '200');
    trans2.setAttribute('x2', '460');
    trans2.setAttribute('y2', '200');
    trans2.setAttribute('stroke', '#2196F3');
    trans2.setAttribute('stroke-width', '2');
    trans2.setAttribute('marker-end', 'url(#arrowhead-state)');
    svg.appendChild(trans2);

    // State 3
    const state3 = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    state3.setAttribute('cx', '500');
    state3.setAttribute('cy', '200');
    state3.setAttribute('r', '40');
    state3.setAttribute('fill', '#E8F5E9');
    state3.setAttribute('stroke', '#388E3C');
    state3.setAttribute('stroke-width', '2');
    svg.appendChild(state3);

    const state3Text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    state3Text.setAttribute('x', '500');
    state3Text.setAttribute('y', '205');
    state3Text.setAttribute('text-anchor', 'middle');
    state3Text.setAttribute('font-size', '14');
    state3Text.setAttribute('font-weight', 'bold');
    state3Text.textContent = 'S3';
    svg.appendChild(state3Text);

    // Add animations
    const animateTrans1 = document.createElementNS('http://www.w3.org/2000/svg', 'animate');
    animateTrans1.setAttribute('attributeName', 'stroke-dasharray');
    animateTrans1.setAttribute('values', '0,100;100,0');
    animateTrans1.setAttribute('dur', `${duration}ms`);
    animateTrans1.setAttribute('repeatCount', 'indefinite');
    trans1.appendChild(animateTrans1);

    const animateTrans2 = document.createElementNS('http://www.w3.org/2000/svg', 'animate');
    animateTrans2.setAttribute('attributeName', 'stroke-dasharray');
    animateTrans2.setAttribute('values', '0,100;100,0');
    animateTrans2.setAttribute('dur', `${duration}ms`);
    animateTrans2.setAttribute('begin', `${duration / 3}ms`);
    animateTrans2.setAttribute('repeatCount', 'indefinite');
    trans2.appendChild(animateTrans2);
  }

  createTreeAnimation(svg, executionResults, duration) {
    // Create a simple tree animation
    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');

    // Define arrow marker
    const marker = document.createElementNS('http://www.w3.org/2000/svg', 'marker');
    marker.setAttribute('id', 'arrowhead-tree');
    marker.setAttribute('markerWidth', '10');
    marker.setAttribute('markerHeight', '10');
    marker.setAttribute('refX', '9');
    marker.setAttribute('refY', '3');
    marker.setAttribute('orient', 'auto');
    const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
    polygon.setAttribute('points', '0 0, 10 3, 0 6');
    polygon.setAttribute('fill', '#9C27B0');
    marker.appendChild(polygon);
    defs.appendChild(marker);
    svg.appendChild(defs);

    // Root node
    const root = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    root.setAttribute('cx', '400');
    root.setAttribute('cy', '50');
    root.setAttribute('r', '30');
    root.setAttribute('fill', '#F3E5F5');
    root.setAttribute('stroke', '#9C27B0');
    root.setAttribute('stroke-width', '2');
    svg.appendChild(root);

    const rootText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    rootText.setAttribute('x', '400');
    rootText.setAttribute('y', '55');
    rootText.setAttribute('text-anchor', 'middle');
    rootText.setAttribute('font-size', '12');
    rootText.setAttribute('font-weight', 'bold');
    rootText.textContent = 'Root';
    svg.appendChild(rootText);

    // Left child
    const leftLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    leftLine.setAttribute('x1', '370');
    leftLine.setAttribute('y1', '80');
    leftLine.setAttribute('x2', '250');
    leftLine.setAttribute('y2', '130');
    leftLine.setAttribute('stroke', '#9C27B0');
    leftLine.setAttribute('stroke-width', '2');
    svg.appendChild(leftLine);

    const leftChild = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    leftChild.setAttribute('cx', '250');
    leftChild.setAttribute('cy', '160');
    leftChild.setAttribute('r', '25');
    leftChild.setAttribute('fill', '#E1BEE7');
    leftChild.setAttribute('stroke', '#9C27B0');
    leftChild.setAttribute('stroke-width', '2');
    svg.appendChild(leftChild);

    const leftText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    leftText.setAttribute('x', '250');
    leftText.setAttribute('y', '165');
    leftText.setAttribute('text-anchor', 'middle');
    leftText.setAttribute('font-size', '11');
    leftText.textContent = 'L';
    svg.appendChild(leftText);

    // Right child
    const rightLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    rightLine.setAttribute('x1', '430');
    rightLine.setAttribute('y1', '80');
    rightLine.setAttribute('x2', '550');
    rightLine.setAttribute('y2', '130');
    rightLine.setAttribute('stroke', '#9C27B0');
    rightLine.setAttribute('stroke-width', '2');
    svg.appendChild(rightLine);

    const rightChild = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    rightChild.setAttribute('cx', '550');
    rightChild.setAttribute('cy', '160');
    rightChild.setAttribute('r', '25');
    rightChild.setAttribute('fill', '#E1BEE7');
    rightChild.setAttribute('stroke', '#9C27B0');
    rightChild.setAttribute('stroke-width', '2');
    svg.appendChild(rightChild);

    const rightText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    rightText.setAttribute('x', '550');
    rightText.setAttribute('y', '165');
    rightText.setAttribute('text-anchor', 'middle');
    rightText.setAttribute('font-size', '11');
    rightText.textContent = 'R';
    svg.appendChild(rightText);

    // Add animations
    const animateLeftLine = document.createElementNS('http://www.w3.org/2000/svg', 'animate');
    animateLeftLine.setAttribute('attributeName', 'stroke-dasharray');
    animateLeftLine.setAttribute('values', '0,100;100,0');
    animateLeftLine.setAttribute('dur', `${duration}ms`);
    animateLeftLine.setAttribute('repeatCount', 'indefinite');
    leftLine.appendChild(animateLeftLine);

    const animateRightLine = document.createElementNS('http://www.w3.org/2000/svg', 'animate');
    animateRightLine.setAttribute('attributeName', 'stroke-dasharray');
    animateRightLine.setAttribute('values', '0,100;100,0');
    animateRightLine.setAttribute('dur', `${duration}ms`);
    animateRightLine.setAttribute('begin', `${duration / 2}ms`);
    animateRightLine.setAttribute('repeatCount', 'indefinite');
    rightLine.appendChild(animateRightLine);
  }

  createControls(container, duration, autoPlay) {
    const controlsDiv = document.createElement('div');
    controlsDiv.className = 'animation-controls';
    controlsDiv.style.cssText = 'display: flex; gap: 10px; padding: 10px; background: #f0f0f0; border-top: 1px solid #ddd; align-items: center;';

    // Play/Pause button
    const playPauseBtn = document.createElement('button');
    playPauseBtn.textContent = autoPlay ? '⏸ Pause' : '▶ Play';
    playPauseBtn.style.cssText = 'padding: 6px 12px; background: #2196F3; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px;';
    playPauseBtn.onclick = () => this.togglePlayPause(container, playPauseBtn);
    controlsDiv.appendChild(playPauseBtn);

    // Speed control
    const speedLabel = document.createElement('label');
    speedLabel.textContent = 'Speed: ';
    speedLabel.style.cssText = 'font-size: 12px; margin-left: 10px;';
    controlsDiv.appendChild(speedLabel);

    const speedSelect = document.createElement('select');
    speedSelect.style.cssText = 'padding: 4px 8px; font-size: 12px; border-radius: 4px; border: 1px solid #ccc;';
    speedSelect.innerHTML = '<option value="0.5">0.5x</option><option value="1" selected>1x</option><option value="1.5">1.5x</option><option value="2">2x</option>';
    speedSelect.onchange = (e) => this.changeSpeed(container, parseFloat(e.target.value));
    controlsDiv.appendChild(speedSelect);

    // Step button
    const stepBtn = document.createElement('button');
    stepBtn.textContent = '⏭ Step';
    stepBtn.style.cssText = 'padding: 6px 12px; background: #4CAF50; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px; margin-left: 10px;';
    stepBtn.onclick = () => this.stepAnimation(container);
    controlsDiv.appendChild(stepBtn);

    // Reset button
    const resetBtn = document.createElement('button');
    resetBtn.textContent = '↻ Reset';
    resetBtn.style.cssText = 'padding: 6px 12px; background: #FF9800; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px; margin-left: 10px;';
    resetBtn.onclick = () => this.resetAnimation(container);
    controlsDiv.appendChild(resetBtn);

    // Progress indicator
    const progressDiv = document.createElement('div');
    progressDiv.className = 'animation-progress';
    progressDiv.style.cssText = 'margin-left: auto; font-size: 12px; color: #666;';
    progressDiv.textContent = '0%';
    controlsDiv.appendChild(progressDiv);

    container.playPauseBtn = playPauseBtn;
    container.progressDiv = progressDiv;

    return controlsDiv;
  }

  togglePlayPause(container, button) {
    this.isPlaying = !this.isPlaying;
    button.textContent = this.isPlaying ? '⏸ Pause' : '▶ Play';

    if (this.isPlaying) {
      this.playAnimation(container);
    } else {
      this.pauseAnimation(container);
    }
  }

  playAnimation(container) {
    this.isPlaying = true;
    if (container.playPauseBtn) {
      container.playPauseBtn.textContent = '⏸ Pause';
    }

    // Resume SVG animations
    const svgs = container.querySelectorAll('svg');
    svgs.forEach(svg => {
      const animates = svg.querySelectorAll('animate');
      animates.forEach(animate => {
        if (animate.pauseAnimation) {
          animate.pauseAnimation();
        }
      });
    });
  }

  pauseAnimation(container) {
    this.isPlaying = false;
    if (container.playPauseBtn) {
      container.playPauseBtn.textContent = '▶ Play';
    }

    // Pause SVG animations
    const svgs = container.querySelectorAll('svg');
    svgs.forEach(svg => {
      const animates = svg.querySelectorAll('animate');
      animates.forEach(animate => {
        if (animate.pauseAnimation) {
          animate.pauseAnimation();
        }
      });
    });
  }

  changeSpeed(container, speed) {
    this.speed = speed;
    const svgs = container.querySelectorAll('svg');
    svgs.forEach(svg => {
      const animates = svg.querySelectorAll('animate');
      animates.forEach(animate => {
        const originalDur = animate.getAttribute('dur');
        if (originalDur) {
          const baseDuration = parseInt(originalDur);
          const newDuration = baseDuration / speed;
          animate.setAttribute('dur', `${newDuration}ms`);
        }
      });
    });
  }

  stepAnimation(container) {
    // Step through animation frame by frame
    this.currentStep++;
    if (container.progressDiv) {
      const progress = Math.min((this.currentStep * 10) % 100, 100);
      container.progressDiv.textContent = `${progress}%`;
    }
  }

  resetAnimation(container) {
    this.currentStep = 0;
    this.isPlaying = false;
    if (container.playPauseBtn) {
      container.playPauseBtn.textContent = '▶ Play';
    }
    if (container.progressDiv) {
      container.progressDiv.textContent = '0%';
    }

    // Reset SVG animations
    const svgs = container.querySelectorAll('svg');
    svgs.forEach(svg => {
      const animates = svg.querySelectorAll('animate');
      animates.forEach(animate => {
        animate.beginElement();
      });
    });
  }

  destroy() {
    // Clean up animation resources
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
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
      'animation': new AnimationRenderer(),
      // Future renderers will be added here:
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

