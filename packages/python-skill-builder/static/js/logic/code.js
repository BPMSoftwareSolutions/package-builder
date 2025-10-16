/**
 * Code Logic Module
 * Handles code saving/loading logic with migration support
 */

export class CodeLogic {
  /**
   * Get saved code for a workshop
   * @param {Object} progress - Progress object
   * @param {string} moduleId - Module ID
   * @param {string} workshopId - Workshop ID
   * @param {string|null} approachId - Approach ID (optional)
   * @returns {string|null} Saved code or null
   */
  static getSavedCode(progress, moduleId, workshopId, approachId = null) {
    if (!progress[moduleId] || !progress[moduleId].code) {
      return null;
    }

    const workshopCode = progress[moduleId].code[workshopId];
    
    if (!workshopCode) {
      return null;
    }

    // Handle multi-approach workshops
    if (approachId) {
      // If workshopCode is an object, get the approach-specific code
      if (typeof workshopCode === 'object' && workshopCode !== null) {
        return workshopCode[approachId] || null;
      }
      
      // MIGRATION: If workshopCode is a string (old format), return it for the first approach
      if (typeof workshopCode === 'string') {
        return workshopCode;
      }
      
      return null;
    }

    // Handle single-approach workshops
    if (typeof workshopCode === 'string') {
      return workshopCode;
    }

    // If workshopCode is an object but no approachId provided, return null
    return null;
  }

  /**
   * Save code for a workshop
   * @param {Object} progress - Progress object
   * @param {string} moduleId - Module ID
   * @param {string} workshopId - Workshop ID
   * @param {string} code - Code to save
   * @param {string|null} approachId - Approach ID (optional)
   * @returns {Object} Updated progress object
   */
  static saveCode(progress, moduleId, workshopId, code, approachId = null) {
    // Ensure module progress exists
    if (!progress[moduleId]) {
      progress[moduleId] = {
        completed: 0,
        scores: {},
        code: {},
        approaches: {},
        lastSeenAt: null,
      };
    }

    // Ensure code object exists
    if (!progress[moduleId].code) {
      progress[moduleId].code = {};
    }

    // Save code per approach for multi-approach workshops
    if (approachId) {
      // MIGRATION: If existing code is a string (old format), convert to object
      if (typeof progress[moduleId].code[workshopId] === 'string') {
        const oldCode = progress[moduleId].code[workshopId];
        progress[moduleId].code[workshopId] = {
          [approachId]: oldCode,
        };
      } else if (!progress[moduleId].code[workshopId]) {
        progress[moduleId].code[workshopId] = {};
      }
      
      progress[moduleId].code[workshopId][approachId] = code;
    } else {
      // Save code directly for single-approach workshops
      progress[moduleId].code[workshopId] = code;
    }

    return progress;
  }

  /**
   * Get saved approach ID for a workshop
   * @param {Object} progress - Progress object
   * @param {string} moduleId - Module ID
   * @param {string} workshopId - Workshop ID
   * @returns {string|null} Saved approach ID or null
   */
  static getSavedApproachId(progress, moduleId, workshopId) {
    if (!progress[moduleId] || !progress[moduleId].approaches) {
      return null;
    }
    return progress[moduleId].approaches[workshopId] || null;
  }

  /**
   * Save approach ID for a workshop
   * @param {Object} progress - Progress object
   * @param {string} moduleId - Module ID
   * @param {string} workshopId - Workshop ID
   * @param {string} approachId - Approach ID to save
   * @returns {Object} Updated progress object
   */
  static saveApproachId(progress, moduleId, workshopId, approachId) {
    // Ensure module progress exists
    if (!progress[moduleId]) {
      progress[moduleId] = {
        completed: 0,
        scores: {},
        code: {},
        approaches: {},
        lastSeenAt: null,
      };
    }

    // Ensure approaches object exists
    if (!progress[moduleId].approaches) {
      progress[moduleId].approaches = {};
    }

    progress[moduleId].approaches[workshopId] = approachId;
    return progress;
  }

  /**
   * Migrate old code format to new format
   * @param {Object} progress - Progress object to migrate
   * @returns {Object} Migrated progress object
   */
  static migrateCodeFormat(progress) {
    const migrated = { ...progress };

    Object.keys(migrated).forEach(moduleId => {
      const moduleProgress = migrated[moduleId];
      
      if (moduleProgress.code) {
        Object.keys(moduleProgress.code).forEach(() => {
          // If it's a string, it's already in old format - no migration needed
          // If it's an object, it's already in new format
          // This function is mainly for documentation purposes
        });
      }
    });

    return migrated;
  }

  /**
   * Clear code for a workshop
   * @param {Object} progress - Progress object
   * @param {string} moduleId - Module ID
   * @param {string} workshopId - Workshop ID
   * @param {string|null} approachId - Approach ID (optional)
   * @returns {Object} Updated progress object
   */
  static clearCode(progress, moduleId, workshopId, approachId = null) {
    if (!progress[moduleId] || !progress[moduleId].code) {
      return progress;
    }

    if (approachId) {
      if (typeof progress[moduleId].code[workshopId] === 'object') {
        delete progress[moduleId].code[workshopId][approachId];
      }
    } else {
      delete progress[moduleId].code[workshopId];
    }

    return progress;
  }
}

export default CodeLogic;

