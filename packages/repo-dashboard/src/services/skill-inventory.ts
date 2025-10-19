/**
 * Skill Inventory Service
 * Maps team skills and expertise from commit history
 */

export interface Skill {
  name: string;
  experts: string[];
  practitioners: string[];
  learners: string[];
}

export interface SkillInventory {
  timestamp: Date;
  team: string;
  org: string;

  // Skills
  skills: Skill[];

  // Distribution
  skillDistribution: Record<string, number>; // skill -> coverage (0-1)
  skillGaps: string[];

  // Recommendations
  crossTrainingOpportunities: string[];
}

export class SkillInventoryService {
  private skillHistory: Map<string, SkillInventory[]> = new Map();
  private readonly maxHistoryPoints = 100;

  /**
   * Calculate skill inventory for a team
   */
  async calculateSkillInventory(
    org: string,
    team: string,
    commitHistory: Array<{ author: string; files: string[] }> = [],
    teamMembers: string[] = []
  ): Promise<SkillInventory> {
    const timestamp = new Date();
    const historyKey = `${org}/${team}`;

    try {
      // Extract skills from file types
      const skillMap = new Map<string, Set<string>>();
      const fileTypeSkills = this.extractSkillsFromFiles(commitHistory);

      // Map authors to skills
      for (const [skill, authors] of fileTypeSkills.entries()) {
        skillMap.set(skill, authors);
      }

      // Create skill objects
      const skills: Skill[] = [];
      const skillDistribution: Record<string, number> = {};

      for (const [skill, authors] of skillMap.entries()) {
        const authorList = Array.from(authors);
        const experts = authorList.slice(0, Math.ceil(authorList.length * 0.2));
        const practitioners = authorList.slice(Math.ceil(authorList.length * 0.2), Math.ceil(authorList.length * 0.6));
        const learners = authorList.slice(Math.ceil(authorList.length * 0.6));

        skills.push({
          name: skill,
          experts,
          practitioners,
          learners
        });

        // Calculate coverage
        const coverage = Math.min(1, authorList.length / Math.max(1, teamMembers.length));
        skillDistribution[skill] = Math.round(coverage * 100) / 100;
      }

      // Identify skill gaps
      const commonSkills = ['TypeScript', 'React', 'Node.js', 'Testing', 'DevOps', 'Architecture'];
      const skillGaps = commonSkills.filter(skill => !skillMap.has(skill));

      // Generate cross-training opportunities
      const crossTrainingOpportunities: string[] = [];
      for (const skill of skills) {
        if (skill.experts.length === 1 && skill.practitioners.length === 0) {
          crossTrainingOpportunities.push(`Cross-train on ${skill.name} - currently only ${skill.experts[0]} is expert`);
        }
      }

      if (skillGaps.length > 0) {
        crossTrainingOpportunities.push(`Consider training on: ${skillGaps.join(', ')}`);
      }

      const inventory: SkillInventory = {
        timestamp,
        team,
        org,
        skills: skills.sort((a, b) => b.experts.length - a.experts.length),
        skillDistribution,
        skillGaps,
        crossTrainingOpportunities
      };

      // Store in history
      if (!this.skillHistory.has(historyKey)) {
        this.skillHistory.set(historyKey, []);
      }
      const history = this.skillHistory.get(historyKey)!;
      history.push(inventory);

      if (history.length > this.maxHistoryPoints) {
        history.shift();
      }

      return inventory;
    } catch (error) {
      console.error(`❌ Error calculating skill inventory for ${historyKey}:`, error);
      throw error;
    }
  }

  /**
   * Extract skills from file types
   */
  private extractSkillsFromFiles(commitHistory: Array<{ author: string; files: string[] }>): Map<string, Set<string>> {
    const skillMap = new Map<string, Set<string>>();

    const skillPatterns: Record<string, RegExp> = {
      'TypeScript': /\.(ts|tsx)$/,
      'React': /\.(tsx|jsx)$/,
      'Node.js': /\.(js|ts)$|package\.json/,
      'Testing': /\.test\.(ts|js|tsx|jsx)$|__tests__/,
      'DevOps': /Dockerfile|\.yml|\.yaml|docker-compose/,
      'Python': /\.py$/,
      'SQL': /\.sql$/,
      'CSS': /\.(css|scss|less)$/,
      'Architecture': /adf\.json|architecture/
    };

    for (const commit of commitHistory) {
      for (const file of commit.files) {
        for (const [skill, pattern] of Object.entries(skillPatterns)) {
          if (pattern.test(file)) {
            if (!skillMap.has(skill)) {
              skillMap.set(skill, new Set());
            }
            skillMap.get(skill)!.add(commit.author);
          }
        }
      }
    }

    return skillMap;
  }

  /**
   * Get history
   */
  getHistory(org: string, team: string): SkillInventory[] {
    const historyKey = `${org}/${team}`;
    return this.skillHistory.get(historyKey) || [];
  }

  /**
   * Clear history
   */
  clearHistory(org: string, team: string): void {
    const historyKey = `${org}/${team}`;
    this.skillHistory.delete(historyKey);
  }
}

