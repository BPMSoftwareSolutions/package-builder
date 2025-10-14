/**
 * Python Training App - Frontend Logic
 * Handles module loading, workshop interaction, code submission, and progress tracking
 */

// State management
const state = {
    modules: [],
    currentModule: null,
    currentWorkshop: null,
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
async function openModule(moduleId) {
    try {
        const response = await fetch(`/api/modules/${moduleId}`);
        const module = await response.json();
        state.currentModule = module;
        
        // Open first workshop
        if (module.workshops && module.workshops.length > 0) {
            openWorkshop(module.workshops[0]);
        }
    } catch (error) {
        console.error('Failed to load module:', error);
        alert('Failed to load module. Please try again.');
    }
}

// Open a workshop
function openWorkshop(workshop) {
    state.currentWorkshop = workshop;
    state.hintsRevealed = 0;
    
    // Switch views
    document.getElementById('dashboard-view').classList.add('hidden');
    document.getElementById('workshop-view').classList.remove('hidden');
    
    // Populate workshop content
    document.getElementById('workshop-title').textContent = workshop.title;
    document.getElementById('module-title').textContent = state.currentModule.title;
    document.getElementById('workshop-prompt').textContent = workshop.prompt;
    document.getElementById('code-editor').value = workshop.starterCode;
    
    // Setup hints
    renderHints(workshop.hints);
    
    // Hide feedback
    document.getElementById('feedback-section').classList.add('hidden');
    
    // Start timer
    startTimer(workshop.timeLimitMinutes);
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
        const response = await fetch('/api/grade', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                moduleId: state.currentModule.id,
                workshopId: state.currentWorkshop.id,
                code: code
            })
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
        `;
    } else {
        section.classList.add('error');
        content.innerHTML = `
            <div class="score-display low">❌ Error</div>
            <div class="feedback-text">${result.error}</div>
            ${result.trace ? `<div class="error-trace">${result.trace.join('\n')}</div>` : ''}
        `;
    }
}

// Update progress
function updateProgress(score, maxScore) {
    const moduleId = state.currentModule.id;
    const workshopId = state.currentWorkshop.id;
    
    if (!state.progress[moduleId]) {
        state.progress[moduleId] = { completed: 0, scores: {}, lastSeenAt: null };
    }
    
    const moduleProgress = state.progress[moduleId];
    const scorePercent = Math.round((score / maxScore) * 100);
    
    // Update score
    const previousScore = moduleProgress.scores[workshopId] || 0;
    moduleProgress.scores[workshopId] = scorePercent;
    
    // Update completed count (80% threshold)
    if (scorePercent >= 80 && previousScore < 80) {
        moduleProgress.completed++;
    } else if (scorePercent < 80 && previousScore >= 80) {
        moduleProgress.completed--;
    }
    
    moduleProgress.lastSeenAt = new Date().toISOString();
    
    saveProgress();
}

// Reset code to starter
function resetCode() {
    if (confirm('Reset code to starter template?')) {
        document.getElementById('code-editor').value = state.currentWorkshop.starterCode;
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

// Setup event listeners
function setupEventListeners() {
    document.getElementById('back-btn').onclick = backToDashboard;
    document.getElementById('submit-btn').onclick = submitCode;
    document.getElementById('reset-btn').onclick = resetCode;
    
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

