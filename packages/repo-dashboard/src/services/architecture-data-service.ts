/**
 * Architecture Data Service
 * Provides architecture definition and C4 model data from ADF files
 */

import { adfFetcher, ArchitectureDefinition } from './adf-fetcher.js';

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
  private cachedADF: ArchitectureDefinition | null = null;
  private readonly defaultOrg = 'BPMSoftwareSolutions';
  private readonly defaultRepo = 'renderx-plugins-demo';
  private readonly defaultPath = 'docs/renderx-plugins-demo-adf.json';

  /**
   * Get architecture from ADF file
   */
  async getDefaultArchitecture(
    org: string = this.defaultOrg,
    repo: string = this.defaultRepo,
    path: string = this.defaultPath
  ): Promise<ArchitectureData> {
    try {
      // Fetch ADF from GitHub
      const adf = await adfFetcher.fetchADF({ org, repo, branch: 'main', path });
      this.cachedADF = adf;

      // Transform ADF to ArchitectureData format
      return this.transformADFToArchitectureData(adf);
    } catch (error) {
      console.error(`❌ Error fetching ADF from ${org}/${repo}:`, error);
      // Fall back to cached ADF if available
      if (this.cachedADF) {
        console.log('⚠️ Using cached ADF data');
        return this.transformADFToArchitectureData(this.cachedADF);
      }
      throw error;
    }
  }

  /**
   * Transform ADF to ArchitectureData format
   */
  private transformADFToArchitectureData(adf: ArchitectureDefinition): ArchitectureData {
    return {
      version: adf.version || '1.0.0',
      name: adf.name || 'Architecture',
      description: adf.description || '',
      c4Model: {
        level: adf.c4Model?.level || 'container',
        containers: adf.c4Model?.containers || [],
      },
      relationships: adf.c4Model?.relationships || [],
    };
  }

  /**
   * Get C4 diagram in Mermaid format from ADF
   */
  async getC4Diagram(
    org: string = this.defaultOrg,
    repo: string = this.defaultRepo,
    path: string = this.defaultPath
  ): Promise<string> {
    try {
      const architecture = await this.getDefaultArchitecture(org, repo, path);
      return this.generateMermaidDiagram(architecture);
    } catch (error) {
      console.error('❌ Error generating C4 diagram:', error);
      // Return a simple fallback diagram
      return this.generateFallbackDiagram();
    }
  }

  /**
   * Generate Mermaid diagram from architecture data
   */
  private generateMermaidDiagram(architecture: ArchitectureData): string {
    const containers = architecture.c4Model.containers;
    if (!containers || containers.length === 0) {
      return this.generateFallbackDiagram();
    }

    // Build node definitions
    let diagram = 'graph TD\n';
    const nodeMap: Record<string, string> = {};

    containers.forEach((container, index) => {
      const nodeId = String.fromCharCode(65 + index); // A, B, C, etc.
      nodeMap[container.id] = nodeId;
      diagram += `    ${nodeId}["${container.name}"]\n`;
    });

    // Build relationships
    const relationships = architecture.c4Model.relationships || [];
    relationships.forEach((rel) => {
      const fromId = nodeMap[rel.from];
      const toId = nodeMap[rel.to];
      if (fromId && toId) {
        diagram += `    ${fromId} -->|${rel.type}| ${toId}\n`;
      }
    });

    return diagram;
  }

  /**
   * Generate fallback Mermaid diagram
   */
  private generateFallbackDiagram(): string {
    return `graph TD
    A["Architecture"]
    B["Containers"]
    C["Relationships"]
    A --> B
    A --> C`;
  }
}

export const architectureDataService = new ArchitectureDataService();

