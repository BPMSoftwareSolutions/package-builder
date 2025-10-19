#!/usr/bin/env node

/**
 * repo-dashboard CLI entry point
 */

import { handleStatus, handleIssues, handlePackages, handlePack, handleCombinedReadme } from '../cli.js';

const command = process.argv[2];
const args = process.argv.slice(3);

async function main() {
  try {
    // Check for help flag in args
    if (args.includes('--help') || args.includes('-h')) {
      printCommandHelp(command);
      return;
    }

    switch (command) {
      case 'status':
        await handleStatus(args);
        break;
      case 'issues':
        await handleIssues(args);
        break;
      case 'packages':
        await handlePackages(args);
        break;
      case 'pack':
        await handlePack(args);
        break;
      case 'combined-readme':
        await handleCombinedReadme(args);
        break;
      case '--help':
      case '-h':
      case 'help':
        printHelp();
        break;
      case '--version':
      case '-v':
        printVersion();
        break;
      default:
        if (command) {
          console.error(`Unknown command: ${command}`);
        }
        printHelp();
        process.exit(1);
    }
  } catch (error) {
    console.error(`❌ Error: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }
}

function printCommandHelp(cmd: string | undefined) {
  switch (cmd) {
    case 'status':
      console.log(`
repo-dashboard status - Show health summary for repositories

USAGE:
  repo-dashboard status --org <organization> [options]

OPTIONS:
  --org <org>     Organization name (required)
  --json          Output as JSON
  --help, -h      Show this help message

EXAMPLES:
  repo-dashboard status --org BPMSoftwareSolutions
  repo-dashboard status --org BPMSoftwareSolutions --json
`);
      break;
    case 'issues':
      console.log(`
repo-dashboard issues - Report open issues and stale PRs

USAGE:
  repo-dashboard issues --repo <owner/repo> [options]

OPTIONS:
  --repo <repo>   Repository in format owner/repo (required)
  --filter <type> Filter type: all, open, stale (default: all)
  --json          Output as JSON
  --help, -h      Show this help message

EXAMPLES:
  repo-dashboard issues --repo BPMSoftwareSolutions/package-builder
  repo-dashboard issues --repo BPMSoftwareSolutions/package-builder --filter stale
  repo-dashboard issues --repo BPMSoftwareSolutions/package-builder --json
`);
      break;
    case 'packages':
      console.log(`
repo-dashboard packages - Find and report on local packages

USAGE:
  repo-dashboard packages [options]

OPTIONS:
  --list-ready    Show only packages ready for publishing
  --base-path     Base path for packages (default: ./packages)
  --json          Output as JSON
  --help, -h      Show this help message

EXAMPLES:
  repo-dashboard packages
  repo-dashboard packages --list-ready
  repo-dashboard packages --base-path ./packages --json
`);
      break;
    case 'pack':
      console.log(`
repo-dashboard pack - Pack a specific package

USAGE:
  repo-dashboard pack --package <path> [options]

OPTIONS:
  --package <path>  Package path (required)
  --dry-run         Show what would be packed without actually packing
  --help, -h        Show this help message

EXAMPLES:
  repo-dashboard pack --package packages/repo-dashboard
  repo-dashboard pack --package packages/repo-dashboard --dry-run
`);
      break;
    case 'combined-readme':
      console.log(`
repo-dashboard combined-readme - Generate combined README from repositories

USAGE:
  repo-dashboard combined-readme --org <org> --patterns <pattern> [options]

OPTIONS:
  --org <org>           Organization or user name (required)
  --patterns <pattern>  Glob patterns to match (required, can be specified multiple times)
  --output <file>       Output file path (default: stdout)
  --case-insensitive    Use case-insensitive pattern matching
  --limit <number>      Maximum repositories to fetch (default: 100)
  --help, -h            Show this help message

EXAMPLES:
  repo-dashboard combined-readme --org BPMSoftwareSolutions --patterns "renderx-*"
  repo-dashboard combined-readme --org BPMSoftwareSolutions --patterns "renderx-*" "musical-*" --output combined-README.md
  repo-dashboard combined-readme --org BPMSoftwareSolutions --patterns "renderx-*" --case-insensitive
`);
      break;
    default:
      printHelp();
  }
}

function printHelp() {
  console.log(`
repo-dashboard - Repository and package management dashboard

USAGE:
  repo-dashboard <command> [options]

COMMANDS:
  status            Show health summary for repositories
  issues            Report open issues and stale PRs
  packages          Find and report on local packages
  pack              Pack a specific package
  combined-readme   Generate combined README from repositories
  help              Show this help message

OPTIONS:
  --help, -h      Show help
  --version, -v   Show version
  --json          Output as JSON

EXAMPLES:
  repo-dashboard status --org BPMSoftwareSolutions
  repo-dashboard issues --repo BPMSoftwareSolutions/package-builder --filter stale
  repo-dashboard packages --list-ready
  repo-dashboard pack --package packages/repo-dashboard --dry-run
  repo-dashboard combined-readme --org BPMSoftwareSolutions --patterns "renderx-*"

For more information, visit: https://github.com/BPMSoftwareSolutions/package-builder
`);
}

function printVersion() {
  console.log('repo-dashboard 0.1.0');
}

main();

