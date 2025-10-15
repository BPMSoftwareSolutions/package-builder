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
 * Visualization Manager
 * Orchestrates rendering of visualizations based on configuration
 */
class VisualizationManager {
  constructor() {
    this.renderers = {
      'cli': new CLIRenderer(),
      // Future renderers will be added here:
      // 'web': new WebUIRenderer(),
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

