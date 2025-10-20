/**
 * Architecture Data Service
 * Provides architecture definition and C4 model data
 */

export interface ArchitectureData {
  version: string;
  name: string;
  description: string;
  c4Model: {
    level: string;
    containers: Array<{
      id: string;
      name: string;
      type: string;
      description: string;
      repositories?: string[];
      packages?: Array<{ name: string; version: string; status: string }>;
      metrics?: Record<string, any>;
    }>;
  };
  relationships: Array<{
    from: string;
    to: string;
    type: string;
    description: string;
  }>;
}

class ArchitectureDataService {
  /**
   * Get default enterprise CI/CD dashboard architecture
   */
  getDefaultArchitecture(): ArchitectureData {
    return {
      version: '1.0.0',
      name: 'Enterprise CI/CD Dashboard',
      description: 'Comprehensive dashboard for CI/CD monitoring and metrics',
      c4Model: {
        level: 'container',
        containers: [
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
          {
            id: 'python-scripts',
            name: 'Python Scripts',
            type: 'library',
            description: 'Python data collection and analysis',
            repositories: ['package-builder'],
            packages: [],
            metrics: { healthScore: 0.88, testCoverage: 0.85, buildStatus: 'success' },
          },
        ],
      },
      relationships: [
        { from: 'web-ui', to: 'api-server', type: 'communicates_with', description: 'HTTP requests' },
        { from: 'api-server', to: 'python-scripts', type: 'depends_on', description: 'Calls Python CLI' },
      ],
    };
  }

  /**
   * Get C4 diagram in Mermaid format
   */
  getC4Diagram(): string {
    return `graph TD
    A[Web UI] -->|HTTP| B[API Server]
    B -->|CLI| C[Python Scripts]
    C -->|Data| D[Database]
    B -->|Queries| D`;
  }
}

export const architectureDataService = new ArchitectureDataService();

