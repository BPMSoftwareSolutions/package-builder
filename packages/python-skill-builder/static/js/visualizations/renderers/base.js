/**
 * Base Renderer Interface
 * All visualization renderers must implement this interface
 */

export class BaseRenderer {
  /**
   * Render visualization
   * @param {Object} config - Visualization configuration
   * @param {Object} executionResults - Execution results from grading
   * @returns {HTMLElement} Rendered visualization element
   * @throws {Error} Must be implemented by subclass
   */
  render() {
    throw new Error('render() method must be implemented by subclass');
  }

  /**
   * Clean up resources when visualization is removed
   */
  destroy() {
    // Override in subclass if cleanup is needed
  }

  /**
   * Validate configuration
   * @param {Object} config - Configuration to validate
   * @returns {boolean} True if configuration is valid
   */
  validateConfig(config) {
    return config && typeof config === 'object';
  }

  /**
   * Validate execution results
   * @param {Object} executionResults - Execution results to validate
   * @returns {boolean} True if execution results are valid
   */
  validateExecutionResults(executionResults) {
    return executionResults && typeof executionResults === 'object';
  }

  /**
   * Create a container element
   * @param {string} className - CSS class name
   * @param {Object} styles - Optional inline styles
   * @returns {HTMLElement} Container element
   */
  createContainer(className, styles = {}) {
    const container = document.createElement('div');
    container.className = className;
    
    if (styles && typeof styles === 'object') {
      Object.assign(container.style, styles);
    }
    
    return container;
  }

  /**
   * Create a title element
   * @param {string} text - Title text
   * @returns {HTMLElement} Title element
   */
  createTitle(text) {
    const title = document.createElement('h3');
    title.textContent = text;
    title.style.margin = '0 0 10px 0';
    return title;
  }

  /**
   * Create a section element
   * @param {string} title - Section title
   * @param {HTMLElement} content - Section content
   * @returns {HTMLElement} Section element
   */
  createSection(title, content) {
    const section = document.createElement('div');
    section.style.marginBottom = '15px';
    
    if (title) {
      const titleEl = this.createTitle(title);
      section.appendChild(titleEl);
    }
    
    if (content) {
      section.appendChild(content);
    }
    
    return section;
  }

  /**
   * Escape HTML to prevent XSS
   * @param {string} text - Text to escape
   * @returns {string} Escaped text
   */
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Format value for display
   * @param {*} value - Value to format
   * @returns {string} Formatted value
   */
  formatValue(value) {
    if (value === null || value === undefined) {
      return 'null';
    }
    
    if (typeof value === 'object') {
      return JSON.stringify(value, null, 2);
    }
    
    return String(value);
  }

  /**
   * Get data from execution results
   * @param {Object} executionResults - Execution results
   * @param {string} key - Data key
   * @param {*} defaultValue - Default value if key not found
   * @returns {*} Data value or default
   */
  getExecutionData(executionResults, key, defaultValue = null) {
    if (!executionResults || typeof executionResults !== 'object') {
      return defaultValue;
    }
    
    return executionResults[key] !== undefined ? executionResults[key] : defaultValue;
  }

  /**
   * Check if execution was successful
   * @param {Object} executionResults - Execution results
   * @returns {boolean} True if execution was successful
   */
  isExecutionSuccessful(executionResults) {
    return this.getExecutionData(executionResults, 'success', false);
  }

  /**
   * Get execution error
   * @param {Object} executionResults - Execution results
   * @returns {string|null} Error message or null
   */
  getExecutionError(executionResults) {
    return this.getExecutionData(executionResults, 'error', null);
  }

  /**
   * Get execution output
   * @param {Object} executionResults - Execution results
   * @returns {string|null} Output or null
   */
  getExecutionOutput(executionResults) {
    return this.getExecutionData(executionResults, 'output', null);
  }
}

export default BaseRenderer;

