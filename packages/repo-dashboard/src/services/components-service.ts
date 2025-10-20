/**
 * Components Service
 * Provides component data and operations
 */

export interface Component {
  id: string;
  name: string;
  type: 'ui' | 'service' | 'library';
  description: string;
  repositories?: string[];
  packages?: Array<{ name: string; version: string; status: string }>;
  dependencies?: string[];
  metrics?: {
    healthScore: number;
    testCoverage: number;
    buildStatus: string;
  };
}

class ComponentsService {
  private components: Map<string, Component> = new Map();

  constructor() {
    this.initializeComponents();
  }

  private initializeComponents(): void {
    const defaultComponents: Component[] = [
      {
        id: 'web-ui',
        name: 'Web UI',
        type: 'ui',
        description: 'React-based web dashboard',
        repositories: ['package-builder'],
        packages: [{ name: '@bpm/repo-dashboard', version: '0.1.0', status: 'beta' }],
        metrics: { healthScore: 0.85, testCoverage: 0.75, buildStatus: 'success' },
      },
      {
        id: 'api-server',
        name: 'API Server',
        type: 'service',
        description: 'Express.js API server',
        repositories: ['package-builder'],
        packages: [{ name: '@bpm/repo-dashboard', version: '0.1.0', status: 'beta' }],
        metrics: { healthScore: 0.90, testCoverage: 0.80, buildStatus: 'success' },
      },
    ];

    defaultComponents.forEach(component => {
      this.components.set(component.id, component);
    });
  }

  /**
   * Get all components
   */
  getAllComponents(): Component[] {
    return Array.from(this.components.values());
  }

  /**
   * Get a specific component by ID
   */
  getComponent(id: string): Component | undefined {
    return this.components.get(id);
  }

  /**
   * Get component with generated data if not found
   */
  getComponentWithDefaults(id: string): Component {
    const component = this.components.get(id);
    if (component) {
      return component;
    }

    // Generate default component data for unknown IDs
    return {
      id,
      name: id.replace(/-/g, ' ').toUpperCase(),
      type: 'service',
      description: 'Component description',
      repositories: ['package-builder'],
      packages: [{ name: '@bpm/repo-dashboard', version: '0.1.0', status: 'beta' }],
      dependencies: [],
      metrics: { healthScore: 0.85, testCoverage: 0.80, buildStatus: 'success' },
    };
  }

  /**
   * Add or update a component
   */
  setComponent(component: Component): void {
    this.components.set(component.id, component);
  }
}

export const componentsService = new ComponentsService();

