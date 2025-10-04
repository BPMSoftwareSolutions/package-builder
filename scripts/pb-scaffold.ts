#!/usr/bin/env node
/**
 * pb-scaffold.ts
 * Creates a package skeleton with example tests in a working area
 */

import { mkdir, writeFile } from 'fs/promises';
import { join } from 'path';
import { parseArgs } from 'util';

interface ScaffoldOptions {
  name: string;
  desc: string;
  keywords: string[];
  runtime: 'browser' | 'node' | 'universal';
  entry: string;
}

async function scaffold(options: ScaffoldOptions) {
  const { name, desc, keywords, runtime, entry } = options;
  const workDir = join(process.cwd(), name);

  console.log(`📦 Scaffolding package: ${name}`);
  console.log(`   Description: ${desc}`);
  console.log(`   Runtime: ${runtime}`);
  console.log(`   Working directory: ${workDir}`);

  // Create directory structure
  await mkdir(join(workDir, 'src'), { recursive: true });
  await mkdir(join(workDir, 'test'), { recursive: true });

  // Create src/index.ts
  const indexContent = generateIndexTemplate(name, runtime);
  await writeFile(join(workDir, entry), indexContent);

  // Create test/index.test.ts
  const testContent = generateTestTemplate(name, runtime);
  await writeFile(join(workDir, 'test', 'index.test.ts'), testContent);

  // Create README.md
  const readmeContent = generateReadmeTemplate(name, desc, keywords);
  await writeFile(join(workDir, 'README.md'), readmeContent);

  // Create package.json
  const packageJson = generatePackageJson(name, desc, keywords);
  await writeFile(join(workDir, 'package.json'), JSON.stringify(packageJson, null, 2));

  // Create tsconfig.build.json
  const tsconfigBuild = generateTsConfigBuild();
  await writeFile(join(workDir, 'tsconfig.build.json'), JSON.stringify(tsconfigBuild, null, 2));

  console.log(`✅ Package scaffolded successfully at: ${workDir}`);
  console.log(`\nNext steps:`);
  console.log(`  1. Implement your code in ${entry}`);
  console.log(`  2. Add tests in test/index.test.ts`);
  console.log(`  3. Run: node scripts/pb-move.ts ${name}`);
}

function generateIndexTemplate(name: string, runtime: string): string {
  if (runtime === 'browser') {
    return `/**
 * ${name}
 * Browser-based utilities
 */

export type ExampleType = {
  value: string;
};

/**
 * Example function - replace with your implementation
 */
export function exampleFunction(input: string): ExampleType {
  return { value: input };
}
`;
  }

  return `/**
 * ${name}
 * Universal utilities
 */

export type ExampleType = {
  value: string;
};

/**
 * Example function - replace with your implementation
 */
export function exampleFunction(input: string): ExampleType {
  return { value: input };
}
`;
}

function generateTestTemplate(name: string, runtime: string): string {
  const setupCode = runtime === 'browser' 
    ? `  beforeEach(() => {
    // Setup DOM if needed
    document.body.innerHTML = '<div id="test"></div>';
  });`
    : '';

  return `import { describe, it, expect${runtime === 'browser' ? ', beforeEach' : ''} } from 'vitest';
import { exampleFunction } from '../src/index';

describe('${name}', () => {
${setupCode}

  it('should work with basic input', () => {
    const result = exampleFunction('test');
    expect(result.value).toBe('test');
  });

  it('should handle edge cases', () => {
    const result = exampleFunction('');
    expect(result.value).toBe('');
  });
});
`;
}

function generateReadmeTemplate(name: string, desc: string, keywords: string[]): string {
  return `# @bpm/${name}

${desc}

## Installation

\`\`\`bash
npm install @bpm/${name}
\`\`\`

## Usage

\`\`\`typescript
import { exampleFunction } from '@bpm/${name}';

const result = exampleFunction('hello');
console.log(result.value); // 'hello'
\`\`\`

## API

### \`exampleFunction(input: string): ExampleType\`

Replace this with your actual API documentation.

## Keywords

${keywords.join(', ')}

## License

MIT
`;
}

function generatePackageJson(name: string, desc: string, keywords: string[]) {
  return {
    name: `@bpm/${name}`,
    version: '0.1.0',
    description: desc,
    keywords: keywords,
    type: 'module',
    sideEffects: false,
    exports: {
      '.': {
        types: './dist/index.d.ts',
        import: './dist/index.js'
      }
    },
    main: './dist/index.js',
    types: './dist/index.d.ts',
    files: ['dist', 'README.md', 'LICENSE'],
    scripts: {
      build: 'tsc -p tsconfig.build.json',
      test: 'vitest run',
      'test:watch': 'vitest',
      lint: 'eslint .',
      prepack: 'npm run build'
    },
    devDependencies: {
      typescript: '^5.6.0',
      vitest: '^2.0.0',
      eslint: '^9.0.0'
    }
  };
}

function generateTsConfigBuild() {
  return {
    extends: '../../tsconfig.json',
    compilerOptions: {
      outDir: './dist',
      rootDir: './src',
      declaration: true,
      declarationMap: true,
      sourceMap: true
    },
    include: ['src/**/*'],
    exclude: ['test', 'dist', 'node_modules']
  };
}

// Parse CLI arguments
const { values, positionals } = parseArgs({
  args: process.argv.slice(2),
  options: {
    desc: { type: 'string', default: 'A new package' },
    keywords: { type: 'string', default: '' },
    runtime: { type: 'string', default: 'universal' },
    entry: { type: 'string', default: 'src/index.ts' }
  },
  allowPositionals: true
});

const name = positionals[0];
if (!name) {
  console.error('❌ Error: Package name is required');
  console.error('Usage: node scripts/pb-scaffold.ts <name> [options]');
  console.error('Options:');
  console.error('  --desc <description>');
  console.error('  --keywords <comma-separated>');
  console.error('  --runtime <browser|node|universal>');
  console.error('  --entry <entry-file>');
  process.exit(1);
}

const options: ScaffoldOptions = {
  name,
  desc: values.desc as string,
  keywords: values.keywords ? (values.keywords as string).split(',').map(k => k.trim()) : [],
  runtime: (values.runtime as 'browser' | 'node' | 'universal') || 'universal',
  entry: values.entry as string
};

scaffold(options).catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});

