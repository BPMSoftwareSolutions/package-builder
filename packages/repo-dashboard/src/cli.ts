/**
 * CLI command handlers for repo-dashboard
 */

import { parseArgs } from 'node:util';
import { listRepos, listIssues, getWorkflowStatus, countStaleIssues } from './github.js';
import { getPackageReadiness } from './local.js';
import { generateAndSaveCombinedReadme } from './combined-readme.js';
import { StatusOptions, IssuesOptions, PackagesOptions, PackOptions } from './types.js';

export async function handleStatus(args: string[]): Promise<void> {
  const { values } = parseArgs({
    args,
    options: {
      org: { type: 'string' },
      json: { type: 'boolean', default: false },
    },
    allowPositionals: false,
  });

  const org = values.org as string | undefined;
  if (!org) {
    throw new Error('--org is required');
  }

  const options: StatusOptions = { org, json: values.json as boolean };
  
  try {
    const repos = await listRepos({ org, limit: 50 });
    
    const statuses = await Promise.all(
      repos.map(async (repo) => {
        const issues = await listIssues({ repo: `${repo.owner}/${repo.name}`, state: 'open' });
        const prs = issues.filter(i => i.isPullRequest);
        const staleCount = await countStaleIssues(`${repo.owner}/${repo.name}`);
        const workflow = await getWorkflowStatus({ repo: `${repo.owner}/${repo.name}` });
        
        return {
          name: repo.name,
          openIssues: issues.filter(i => !i.isPullRequest).length,
          openPRs: prs.length,
          stalePRs: staleCount,
          lastWorkflow: workflow?.conclusion || 'unknown',
        };
      })
    );

    if (options.json) {
      console.log(JSON.stringify(statuses, null, 2));
    } else {
      console.log(`\n📊 Repository Status for ${org}\n`);
      console.log('Repository'.padEnd(30) + 'Issues'.padEnd(10) + 'PRs'.padEnd(10) + 'Stale'.padEnd(10) + 'Last Workflow');
      console.log('-'.repeat(80));
      
      for (const status of statuses) {
        console.log(
          status.name.padEnd(30) +
          String(status.openIssues).padEnd(10) +
          String(status.openPRs).padEnd(10) +
          String(status.stalePRs).padEnd(10) +
          status.lastWorkflow
        );
      }
      console.log('');
    }
  } catch (error) {
    throw new Error(`Failed to get status: ${error instanceof Error ? error.message : String(error)}`);
  }
}

export async function handleIssues(args: string[]): Promise<void> {
  const { values } = parseArgs({
    args,
    options: {
      repo: { type: 'string' },
      filter: { type: 'string' },
      json: { type: 'boolean', default: false },
    },
    allowPositionals: false,
  });

  const repo = values.repo as string | undefined;
  if (!repo) {
    throw new Error('--repo is required');
  }

  const options: IssuesOptions = {
    repo,
    filter: (values.filter as any) || 'open',
    json: values.json as boolean,
  };

  try {
    let issues = await listIssues({ repo, state: 'open' });
    
    if (options.filter === 'stale') {
      const now = new Date();
      const threshold = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      issues = issues.filter(i => new Date(i.updatedAt) < threshold);
    }

    if (options.json) {
      console.log(JSON.stringify(issues, null, 2));
    } else {
      console.log(`\n🐛 Issues for ${repo}\n`);
      console.log('Number'.padEnd(10) + 'Type'.padEnd(10) + 'Title'.padEnd(50) + 'Author');
      console.log('-'.repeat(80));
      
      for (const issue of issues) {
        const type = issue.isPullRequest ? 'PR' : 'Issue';
        console.log(
          `#${issue.number}`.padEnd(10) +
          type.padEnd(10) +
          issue.title.substring(0, 50).padEnd(50) +
          issue.author
        );
      }
      console.log('');
    }
  } catch (error) {
    throw new Error(`Failed to get issues: ${error instanceof Error ? error.message : String(error)}`);
  }
}

export async function handlePackages(args: string[]): Promise<void> {
  const { values } = parseArgs({
    args,
    options: {
      'list-ready': { type: 'boolean', default: false },
      json: { type: 'boolean', default: false },
      'base-path': { type: 'string', default: './packages' },
    },
    allowPositionals: false,
  });

  const options: PackagesOptions = {
    listReady: (values['list-ready'] as boolean) || false,
    json: values.json as boolean,
    basePath: (values['base-path'] as string) || './packages',
  };

  try {
    const readiness = await getPackageReadiness({ basePath: options.basePath });
    
    let packages = readiness.packages;
    if (options.listReady) {
      packages = packages.filter(p => p.packReady);
    }

    if (options.json) {
      console.log(JSON.stringify(packages, null, 2));
    } else {
      console.log(`\n📦 Local Packages\n`);
      console.log(`Total: ${readiness.total} | Ready: ${readiness.ready}\n`);
      console.log('Package'.padEnd(30) + 'Version'.padEnd(15) + 'Build'.padEnd(10) + 'Pack Ready');
      console.log('-'.repeat(70));
      
      for (const pkg of packages) {
        console.log(
          pkg.name.substring(0, 30).padEnd(30) +
          pkg.version.padEnd(15) +
          (pkg.buildReady ? '✓' : '✗').padEnd(10) +
          (pkg.packReady ? '✓' : '✗')
        );
      }
      console.log('');
    }
  } catch (error) {
    throw new Error(`Failed to get packages: ${error instanceof Error ? error.message : String(error)}`);
  }
}

export async function handlePack(args: string[]): Promise<void> {
  const { values } = parseArgs({
    args,
    options: {
      package: { type: 'string' },
      'dry-run': { type: 'boolean', default: false },
    },
    allowPositionals: false,
  });

  const packagePath = values.package as string | undefined;
  if (!packagePath) {
    throw new Error('--package is required');
  }

  const options: PackOptions = {
    package: packagePath,
    dryRun: (values['dry-run'] as boolean) || false,
  };

  if (options.dryRun) {
    console.log(`\n📦 Dry run: Would pack ${options.package}`);
    console.log('(No changes will be made)\n');
  } else {
    console.log(`\n📦 Packing ${options.package}...`);
    console.log('(Not yet implemented)\n');
  }
}

export async function handleCombinedReadme(args: string[]): Promise<void> {
  const { values } = parseArgs({
    args,
    options: {
      org: { type: 'string' },
      patterns: { type: 'string', multiple: true },
      output: { type: 'string' },
      'case-insensitive': { type: 'boolean', default: false },
      limit: { type: 'string', default: '100' },
    },
    allowPositionals: false,
  });

  const org = values.org as string | undefined;
  if (!org) {
    throw new Error('--org is required');
  }

  const patterns = values.patterns as string[] | undefined;
  if (!patterns || patterns.length === 0) {
    throw new Error('--patterns is required (can be specified multiple times)');
  }

  const output = values.output as string | undefined;
  const caseInsensitive = values['case-insensitive'] as boolean;
  const limit = parseInt(values.limit as string, 10);

  console.log(`\n📚 Generating combined README for ${org}`);
  console.log(`   Patterns: ${patterns.join(', ')}`);
  if (output) {
    console.log(`   Output: ${output}`);
  }
  console.log('');

  await generateAndSaveCombinedReadme({
    org,
    patterns,
    output,
    caseInsensitive,
    limit,
  });
}

