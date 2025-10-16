/**
 * Visualization Manager
 * Orchestrates rendering of visualizations based on configuration
 */

export class VisualizationManager {
  constructor() {
    this.renderers = {};
    this.activeVisualizations = [];
  }

  /**
   * Register a renderer
   * @param {string} type - Renderer type identifier
   * @param {Object} renderer - Renderer instance
   */
  registerRenderer(type, renderer) {
    if (!renderer || typeof renderer.render !== 'function') {
      throw new Error(`Invalid renderer for type "${type}": must have render() method`);
    }
    this.renderers[type] = renderer;
  }

  /**
   * Get a registered renderer
   * @param {string} type - Renderer type identifier
   * @returns {Object|null} Renderer instance or null
   */
  getRenderer(type) {
    return this.renderers[type] || null;
  }

  /**
   * Check if a renderer is registered
   * @param {string} type - Renderer type identifier
   * @returns {boolean} True if renderer is registered
   */
  hasRenderer(type) {
    return type in this.renderers;
  }

  /**
   * Get all registered renderer types
   * @returns {Array} Array of renderer type identifiers
   */
  getRendererTypes() {
    return Object.keys(this.renderers);
  }

  /**
   * Render a single visualization
   * @param {Object} vizConfig - Visualization configuration
   * @param {Object} executionResults - Execution results from grading
   * @returns {HTMLElement|null} Rendered element or null
   */
  renderVisualization(vizConfig, executionResults) {
    if (!vizConfig.enabled) {
      return null;
    }

    const renderer = this.getRenderer(vizConfig.type);
    if (!renderer) {
      console.warn(`No renderer found for visualization type: ${vizConfig.type}`);
      return null;
    }

    try {
      const element = renderer.render(vizConfig, executionResults);
      return element;
    } catch (error) {
      console.error(`Failed to render visualization ${vizConfig.id}:`, error);
      return null;
    }
  }

  /**
   * Render all enabled visualizations
   * @param {Array} visualizations - Array of visualization configs
   * @param {Object} executionResults - Execution results from grading
   * @param {HTMLElement} container - Container element for visualizations
   */
  renderAll(visualizations, executionResults, container) {
    this.clearAll();
    
    if (!container) {
      console.error('Container element not provided');
      return;
    }

    container.innerHTML = '';

    if (!visualizations || visualizations.length === 0) {
      return;
    }

    for (const vizConfig of visualizations) {
      const element = this.renderVisualization(vizConfig, executionResults);
      if (element) {
        container.appendChild(element);
        this.activeVisualizations.push({
          renderer: this.getRenderer(vizConfig.type),
          element,
          config: vizConfig,
        });
      }
    }
  }

  /**
   * Clear all active visualizations
   */
  clearAll() {
    for (const { renderer, element } of this.activeVisualizations) {
      if (renderer && typeof renderer.destroy === 'function') {
        try {
          renderer.destroy();
        } catch (error) {
          console.error('Error destroying renderer:', error);
        }
      }
      if (element && element.parentNode) {
        element.parentNode.removeChild(element);
      }
    }
    this.activeVisualizations = [];
  }

  /**
   * Get active visualization count
   * @returns {number} Number of active visualizations
   */
  getActiveCount() {
    return this.activeVisualizations.length;
  }

  /**
   * Check if there are active visualizations
   * @returns {boolean} True if there are active visualizations
   */
  hasActive() {
    return this.activeVisualizations.length > 0;
  }

  /**
   * Get active visualizations
   * @returns {Array} Array of active visualization objects
   */
  getActive() {
    return [...this.activeVisualizations];
  }

  /**
   * Destroy the manager and clean up resources
   */
  destroy() {
    this.clearAll();
    this.renderers = {};
  }
}

// Create and export singleton instance
export const visualizationManager = new VisualizationManager();

export default visualizationManager;

