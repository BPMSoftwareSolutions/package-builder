/**
 * Test for localStorage migration bug fix (Issue #29)
 * 
 * This test verifies that code saved in the old string format
 * is properly migrated to the new object format when loading
 * a multi-approach workshop.
 */

// Mock localStorage
class LocalStorageMock {
  constructor() {
    this.store = {};
  }

  getItem(key) {
    return this.store[key] || null;
  }

  setItem(key, value) {
    this.store[key] = value;
  }

  clear() {
    this.store = {};
  }
}

global.localStorage = new LocalStorageMock();

// Mock state object
const state = {
  progress: {}
};

// Copy the functions from app.js that we need to test
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

function saveProgress() {
  localStorage.setItem('pythonTrainingProgress', JSON.stringify(state.progress));
}

// ORIGINAL VERSION (BUGGY) - This should fail the test
function getSavedCode_BUGGY(moduleId, workshopId, approachId) {
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
    const code = workshopCode[approachId] || null;
    console.log('[getSavedCode] Returning approach code:', code ? code.substring(0, 50) + '...' : 'null');
    return code;
  }

  // Otherwise, return code for single-approach workshop
  const code = typeof workshopCode === 'string' ? workshopCode : null;
  console.log('[getSavedCode] Returning single-approach code:', code ? code.substring(0, 50) + '...' : 'null');
  return code;
}

// FIXED VERSION - This should pass the test
function getSavedCode_FIXED(moduleId, workshopId, approachId) {
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

// Test Suite
console.log('\n=== Testing localStorage Migration (Issue #29) ===\n');

// Test 1: BUGGY version should fail to retrieve old format code
console.log('Test 1: BUGGY version with old string format');
localStorage.clear();
state.progress = {
  'python_basics': {
    completed: 1,
    scores: { 'basics_01': 100 },
    code: {
      'basics_01': 'def even_squares(nums):\n    result = []\n    for n in nums:\n        if n % 2 == 0:\n            result.append(n*n)\n    return result'
    }
  }
};
saveProgress();
loadProgress();

const buggyResult = getSavedCode_BUGGY('python_basics', 'basics_01', 'comprehension');
if (buggyResult === null) {
  console.log('✅ EXPECTED: Buggy version returns null (bug confirmed)');
} else {
  console.log('❌ UNEXPECTED: Buggy version returned code:', buggyResult);
}

// Test 2: FIXED version should migrate and retrieve old format code
console.log('\nTest 2: FIXED version with old string format');
localStorage.clear();
state.progress = {
  'python_basics': {
    completed: 1,
    scores: { 'basics_01': 100 },
    code: {
      'basics_01': 'def even_squares(nums):\n    result = []\n    for n in nums:\n        if n % 2 == 0:\n            result.append(n*n)\n    return result'
    }
  }
};
saveProgress();
loadProgress();

const fixedResult = getSavedCode_FIXED('python_basics', 'basics_01', 'comprehension');
if (fixedResult && fixedResult.includes('even_squares')) {
  console.log('✅ PASS: Fixed version returns migrated code');
  console.log('   Code preview:', fixedResult.substring(0, 50) + '...');
} else {
  console.log('❌ FAIL: Fixed version did not return code');
}

// Test 3: Verify migration persisted to localStorage
console.log('\nTest 3: Verify migration persisted');
loadProgress();
const migratedStructure = state.progress['python_basics'].code['basics_01'];
if (typeof migratedStructure === 'object' && migratedStructure['comprehension']) {
  console.log('✅ PASS: Code structure migrated to object format');
  console.log('   Structure:', JSON.stringify(migratedStructure, null, 2).substring(0, 100) + '...');
} else {
  console.log('❌ FAIL: Code structure not migrated');
  console.log('   Structure:', typeof migratedStructure, migratedStructure);
}

// Test 4: FIXED version should work with new format
console.log('\nTest 4: FIXED version with new object format');
localStorage.clear();
state.progress = {
  'python_basics': {
    completed: 1,
    scores: { 'basics_01': 100 },
    code: {
      'basics_01': {
        'loop': 'def even_squares(nums):\n    result = []\n    for n in nums:\n        if n % 2 == 0:\n            result.append(n*n)\n    return result',
        'comprehension': 'def even_squares(nums):\n    return [n*n for n in nums if n % 2 == 0]'
      }
    }
  }
};
saveProgress();
loadProgress();

const newFormatResult = getSavedCode_FIXED('python_basics', 'basics_01', 'comprehension');
if (newFormatResult && newFormatResult.includes('return [n*n')) {
  console.log('✅ PASS: Fixed version works with new format');
  console.log('   Code preview:', newFormatResult.substring(0, 50) + '...');
} else {
  console.log('❌ FAIL: Fixed version did not work with new format');
}

// Test 5: FIXED version should work with single-approach workshops
console.log('\nTest 5: FIXED version with single-approach workshop');
localStorage.clear();
state.progress = {
  'python_basics': {
    completed: 1,
    scores: { 'basics_02': 100 },
    code: {
      'basics_02': 'def single_approach():\n    return "single"'
    }
  }
};
saveProgress();
loadProgress();

const singleApproachResult = getSavedCode_FIXED('python_basics', 'basics_02', null);
if (singleApproachResult && singleApproachResult.includes('single_approach')) {
  console.log('✅ PASS: Fixed version works with single-approach workshops');
  console.log('   Code preview:', singleApproachResult.substring(0, 50) + '...');
} else {
  console.log('❌ FAIL: Fixed version did not work with single-approach');
}

console.log('\n=== Test Suite Complete ===\n');

