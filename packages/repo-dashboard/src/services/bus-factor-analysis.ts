/**
 * Bus Factor Analysis Service
 * Analyzes code ownership concentration and identifies key-person dependencies
 */

export interface KeyPerson {
  name: string;
  commits: number;
  ownership: number; // 0-1
  files: string[];
}

export interface BusFactorAnalysis {
  timestamp: Date;
  team: string;
  repo: string;
  org: string;

  // Bus factor (1-5, how many people can be hit by a bus)
  busFactor: number;
  riskLevel: 'critical' | 'high' | 'medium' | 'low';

  // Key people
  keyPeople: KeyPerson[];

  // Orphaned code
  orphanedFiles: string[];
  orphanedPercentage: number;

  // Recommendations
  recommendations: string[];
}

export class BusFactorAnalysisService {
  private analysisHistory: Map<string, BusFactorAnalysis[]> = new Map();
  private readonly maxHistoryPoints = 100;

  /**
   * Analyze bus factor for a repository
   */
  async analyzeBusFactor(
    org: string,
    team: string,
    repo: string,
    commitHistory: Array<{ author: string; files: string[] }> = []
  ): Promise<BusFactorAnalysis> {
    const timestamp = new Date();
    const historyKey = `${org}/${team}/${repo}`;

    try {
      // Calculate code ownership
      const authorStats = new Map<string, { commits: number; files: Set<string> }>();

      for (const commit of commitHistory) {
        if (!authorStats.has(commit.author)) {
          authorStats.set(commit.author, { commits: 0, files: new Set() });
        }
        const stats = authorStats.get(commit.author)!;
        stats.commits++;
        commit.files.forEach(f => stats.files.add(f));
      }

      // Calculate ownership percentages
      const totalCommits = commitHistory.length || 1;
      const keyPeople: KeyPerson[] = Array.from(authorStats.entries())
        .map(([name, stats]) => ({
          name,
          commits: stats.commits,
          ownership: stats.commits / totalCommits,
          files: Array.from(stats.files)
        }))
        .sort((a, b) => b.commits - a.commits);

      // Calculate bus factor (how many people needed to cover 50% of commits)
      let busFactor = 0;
      let cumulativeCommits = 0;
      const threshold = totalCommits * 0.5;

      for (const person of keyPeople) {
        cumulativeCommits += person.commits;
        busFactor++;
        if (cumulativeCommits >= threshold) break;
      }

      // Ensure bus factor is between 1 and 5
      busFactor = Math.max(1, Math.min(5, busFactor));

      // Determine risk level
      let riskLevel: 'critical' | 'high' | 'medium' | 'low' = 'low';
      if (busFactor === 1) riskLevel = 'critical';
      else if (busFactor === 2) riskLevel = 'high';
      else if (busFactor === 3) riskLevel = 'medium';

      // Identify orphaned files (files with only one author)
      const fileAuthors = new Map<string, Set<string>>();
      for (const commit of commitHistory) {
        for (const file of commit.files) {
          if (!fileAuthors.has(file)) {
            fileAuthors.set(file, new Set());
          }
          fileAuthors.get(file)!.add(commit.author);
        }
      }

      const orphanedFiles = Array.from(fileAuthors.entries())
        .filter(([_, authors]) => authors.size === 1)
        .map(([file]) => file);

      const orphanedPercentage = fileAuthors.size > 0
        ? (orphanedFiles.length / fileAuthors.size) * 100
        : 0;

      // Generate recommendations
      const recommendations: string[] = [];
      if (riskLevel === 'critical') {
        recommendations.push('CRITICAL: Only one person has significant knowledge. Implement immediate knowledge transfer.');
        recommendations.push('Schedule pair programming sessions with other team members.');
      } else if (riskLevel === 'high') {
        recommendations.push('HIGH: Only 2 people cover 50% of commits. Increase code review participation.');
        recommendations.push('Encourage cross-team code reviews and documentation.');
      } else if (riskLevel === 'medium') {
        recommendations.push('MEDIUM: Consider increasing knowledge sharing activities.');
      }

      if (orphanedPercentage > 30) {
        recommendations.push(`${Math.round(orphanedPercentage)}% of files have single author. Increase code review coverage.`);
      }

      const analysis: BusFactorAnalysis = {
        timestamp,
        team,
        repo,
        org,
        busFactor,
        riskLevel,
        keyPeople: keyPeople.slice(0, 5), // Top 5 people
        orphanedFiles: orphanedFiles.slice(0, 10), // Top 10 orphaned files
        orphanedPercentage: Math.round(orphanedPercentage * 100) / 100,
        recommendations
      };

      // Store in history
      if (!this.analysisHistory.has(historyKey)) {
        this.analysisHistory.set(historyKey, []);
      }
      const history = this.analysisHistory.get(historyKey)!;
      history.push(analysis);

      if (history.length > this.maxHistoryPoints) {
        history.shift();
      }

      return analysis;
    } catch (error) {
      console.error(`❌ Error analyzing bus factor for ${historyKey}:`, error);
      throw error;
    }
  }

  /**
   * Get analysis history
   */
  getHistory(org: string, team: string, repo: string): BusFactorAnalysis[] {
    const historyKey = `${org}/${team}/${repo}`;
    return this.analysisHistory.get(historyKey) || [];
  }

  /**
   * Clear history
   */
  clearHistory(org: string, team: string, repo: string): void {
    const historyKey = `${org}/${team}/${repo}`;
    this.analysisHistory.delete(historyKey);
  }
}

