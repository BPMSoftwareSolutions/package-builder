/**
 * Combined README generation for repo-dashboard
 * Generates a combined README file from multiple repositories matching glob patterns
 */

import { listRepos } from './github.js';
import { minimatch } from 'minimatch';

const GITHUB_API_BASE = 'https://api.github.com';

function getToken(): string {
  const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN || process.env.GH_PAT;
  if (!token) {
    throw new Error('GITHUB_TOKEN, GH_TOKEN, or GH_PAT environment variable is required');
  }
  return token;
}

async function fetchGitHub<T>(endpoint: string, options?: RequestInit): Promise<T | null> {
  const token = getToken();
  const url = `${GITHUB_API_BASE}${endpoint}`;

  const authHeader = token.startsWith('github_pat_')
    ? `Bearer ${token}`
    : `token ${token}`;

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': authHeader,
        'Accept': 'application/vnd.github.v3+json',
        ...options?.headers,
      },
    });

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
    }

    return response.json() as Promise<T>;
  } catch (error) {
    console.error(`Error fetching ${endpoint}:`, error);
    return null;
  }
}

export async function getReadmeContent(owner: string, repo: string): Promise<string | null> {
  const readmeFormats = ['README.md', 'README.rst', 'README.txt', 'readme.md'];

  for (const format of readmeFormats) {
    const endpoint = `/repos/${owner}/${repo}/contents/${format}`;
    const data = await fetchGitHub<any>(endpoint);

    if (data && data.content) {
      try {
        // GitHub returns base64-encoded content
        return Buffer.from(data.content, 'base64').toString('utf-8');
      } catch (error) {
        console.error(`Error decoding ${format} from ${repo}:`, error);
      }
    }
  }

  return null;
}

export function matchesPatterns(
  repoName: string,
  patterns: string[],
  caseInsensitive: boolean = false
): boolean {
  return patterns.some(pattern => {
    if (caseInsensitive) {
      return minimatch(repoName.toLowerCase(), pattern.toLowerCase());
    }
    return minimatch(repoName, pattern);
  });
}

export async function generateCombinedReadme(
  org: string,
  patterns: string[],
  options: {
    caseInsensitive?: boolean;
    limit?: number;
  } = {}
): Promise<string> {
  const { caseInsensitive = false, limit = 100 } = options;

  console.log(`📚 Fetching repositories from ${org} matching patterns: ${patterns.join(', ')}`);

  // Fetch all repositories
  const allRepos = await listRepos({ org, limit });
  console.log(`✅ Found ${allRepos.length} total repositories`);

  // Filter by patterns
  const matchedRepos = allRepos.filter(repo =>
    matchesPatterns(repo.name, patterns, caseInsensitive)
  );
  console.log(`✅ Found ${matchedRepos.length} repositories matching patterns`);

  if (matchedRepos.length === 0) {
    console.warn('⚠️ No repositories matched the patterns');
    return '';
  }

  // Fetch README content for each repository
  console.log('📖 Fetching README files...');
  const readmeContents: Record<string, string | null> = {};

  for (const repo of matchedRepos) {
    const content = await getReadmeContent(repo.owner, repo.name);
    readmeContents[repo.name] = content;
    if (content) {
      console.log(`✅ Found README in ${repo.name}`);
    } else {
      console.warn(`⚠️ No README found in ${repo.name}`);
    }
  }

  // Generate combined README
  console.log('📝 Generating combined README...');

  const timestamp = new Date().toISOString().split('T')[0];
  let combined = `# Combined README - ${org}\n\n`;
  combined += `Generated on: ${timestamp}\n\n`;

  // Table of contents
  combined += '## Table of Contents\n\n';
  for (const repo of matchedRepos) {
    combined += `- [${repo.name}](#${repo.name})\n`;
  }
  combined += '\n---\n\n';

  // Repository sections
  for (const repo of matchedRepos) {
    combined += `## ${repo.name}\n\n`;

    if (repo.description) {
      combined += `**Description**: ${repo.description}\n\n`;
    }

    combined += `**Repository**: ${repo.url}\n\n`;

    if (repo.topics && repo.topics.length > 0) {
      combined += `**Topics**: ${repo.topics.join(', ')}\n\n`;
    }

    const readmeContent = readmeContents[repo.name];
    if (readmeContent) {
      combined += '### README Content\n\n';
      combined += readmeContent;
    } else {
      combined += '*No README found for this repository*\n';
    }

    combined += '\n\n---\n\n';
  }

  return combined;
}

export interface CombinedReadmeOptions {
  org: string;
  patterns: string[];
  output?: string;
  caseInsensitive?: boolean;
  limit?: number;
}

export async function generateAndSaveCombinedReadme(options: CombinedReadmeOptions): Promise<void> {
  const { org, patterns, output, caseInsensitive = false, limit = 100 } = options;

  const combined = await generateCombinedReadme(org, patterns, {
    caseInsensitive,
    limit,
  });

  if (!combined) {
    console.error('❌ Failed to generate combined README');
    return;
  }

  if (output) {
    const fs = await import('fs/promises');
    await fs.writeFile(output, combined, 'utf-8');
    console.log(`✅ Combined README written to ${output}`);
  } else {
    console.log(combined);
  }
}

