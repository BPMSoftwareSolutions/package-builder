/**
 * GitHub API wrapper for repo-dashboard
 */

import { Repository, Issue, WorkflowRun, ListReposOptions, ListIssuesOptions, WorkflowStatusOptions } from './types.js';

const GITHUB_API_BASE = 'https://api.github.com';

function getToken(): string {
  const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN || process.env.GH_PAT;
  if (!token) {
    throw new Error(
      'GITHUB_TOKEN, GH_TOKEN, or GH_PAT environment variable is required.\n' +
      'Set it with: $env:GITHUB_TOKEN = "your_token" (PowerShell) or export GITHUB_TOKEN=your_token (bash)\n' +
      'Create a token at: https://github.com/settings/tokens/new?scopes=repo,workflow\n\n' +
      'Available environment variables:\n' +
      `  GITHUB_TOKEN: ${process.env.GITHUB_TOKEN ? '✓ set' : '✗ not set'}\n` +
      `  GH_TOKEN: ${process.env.GH_TOKEN ? '✓ set' : '✗ not set'}\n` +
      `  GH_PAT: ${process.env.GH_PAT ? '✓ set' : '✗ not set'}`
    );
  }
  console.log(`✅ GitHub token found (${token.substring(0, 10)}...)`);
  return token;
}

async function fetchGitHub<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const token = getToken();
  const url = `${GITHUB_API_BASE}${endpoint}`;

  // Fine-grained tokens (github_pat_*) use Bearer auth, classic tokens use token auth
  const authHeader = token.startsWith('github_pat_')
    ? `Bearer ${token}`
    : `token ${token}`;

  console.log(`🔗 GitHub API Request: ${endpoint}`);

  const response = await fetch(url, {
    ...options,
    headers: {
      'Authorization': authHeader,
      'Accept': 'application/vnd.github.v3+json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    console.error(`❌ GitHub API Error: ${response.status} ${response.statusText}`);
    console.error(`Response: ${error}`);

    let errorMessage = `GitHub API error: ${response.status} ${response.statusText}`;
    try {
      const errorJson = JSON.parse(error);
      if (errorJson.message) {
        errorMessage = errorJson.message;
      }
    } catch {
      errorMessage = error || errorMessage;
    }

    const err = new Error(errorMessage);
    (err as any).status = response.status;
    throw err;
  }

  return response.json() as Promise<T>;
}

export async function listRepos(options: ListReposOptions): Promise<Repository[]> {
  const { org, topic, limit = 100 } = options;

  let endpoint = `/orgs/${org}/repos?per_page=${Math.min(limit, 100)}&sort=updated&direction=desc`;
  if (topic) {
    endpoint += `&topic=${topic}`;
  }

  try {
    const data = await fetchGitHub<any[]>(endpoint);

    return data.map(repo => ({
      name: repo.name,
      owner: repo.owner.login,
      url: repo.html_url,
      description: repo.description,
      isPrivate: repo.private,
      topics: repo.topics,
      lastUpdated: repo.updated_at,
    }));
  } catch (error) {
    // If org endpoint fails with 404, try user endpoint
    const status = (error as any).status;
    if (status === 404) {
      console.log(`⚠️ Organization "${org}" not found or not accessible. Trying user repositories...`);
      try {
        const userEndpoint = `/user/repos?per_page=${Math.min(limit, 100)}&sort=updated&direction=desc&type=owner`;
        const data = await fetchGitHub<any[]>(userEndpoint);

        console.log(`✅ Fetched ${data.length} user repositories`);

        return data.map(repo => ({
          name: repo.name,
          owner: repo.owner.login,
          url: repo.html_url,
          description: repo.description,
          isPrivate: repo.private,
          topics: repo.topics,
          lastUpdated: repo.updated_at,
        }));
      } catch (userError) {
        throw new Error(
          `Cannot access organization "${org}". ` +
          `Make sure you have access to the organization or use your own repositories. ` +
          `Original error: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }
    throw error;
  }
}

export async function listIssues(options: ListIssuesOptions): Promise<Issue[]> {
  const { repo, state = 'open', limit = 100 } = options;
  
  const endpoint = `/repos/${repo}/issues?state=${state}&per_page=${Math.min(limit, 100)}&sort=updated&direction=desc`;
  
  const data = await fetchGitHub<any[]>(endpoint);
  
  return data.map(issue => ({
    number: issue.number,
    title: issue.title,
    state: issue.state,
    isPullRequest: !!issue.pull_request,
    createdAt: issue.created_at,
    updatedAt: issue.updated_at,
    url: issue.html_url,
    author: issue.user.login,
  }));
}

export async function getWorkflowStatus(options: WorkflowStatusOptions): Promise<WorkflowRun | null> {
  const { repo, branch = 'main' } = options;
  
  try {
    const endpoint = `/repos/${repo}/actions/runs?branch=${branch}&per_page=1`;
    const data = await fetchGitHub<{ workflow_runs: any[] }>(endpoint);
    
    if (!data.workflow_runs || data.workflow_runs.length === 0) {
      return null;
    }

    const run = data.workflow_runs[0];
    return {
      id: run.id,
      name: run.name,
      status: run.status,
      conclusion: run.conclusion,
      createdAt: run.created_at,
      updatedAt: run.updated_at,
      url: run.html_url,
    };
  } catch (error) {
    // Workflow runs might not be available for all repos
    return null;
  }
}

export async function getRepositoryStatus(repo: string) {
  const [owner, name] = repo.split('/');
  if (!owner || !name) {
    throw new Error('Invalid repo format. Use owner/name');
  }

  const endpoint = `/repos/${repo}`;
  const data = await fetchGitHub<any>(endpoint);
  
  return {
    name: data.name,
    owner: data.owner.login,
    url: data.html_url,
    description: data.description,
    isPrivate: data.private,
    topics: data.topics,
    lastUpdated: data.updated_at,
    openIssues: data.open_issues_count,
  };
}

export async function countStaleIssues(repo: string, daysThreshold: number = 30): Promise<number> {
  const issues = await listIssues({ repo, state: 'open', limit: 100 });
  const now = new Date();
  const threshold = new Date(now.getTime() - daysThreshold * 24 * 60 * 60 * 1000);
  
  return issues.filter(issue => {
    const updatedAt = new Date(issue.updatedAt);
    return updatedAt < threshold;
  }).length;
}

