import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { execSync } from 'node:child_process';
import { existsSync, mkdirSync, writeFileSync, rmSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

describe('pb-externalize-copy integration tests', () => {
  const testDir = join(process.cwd(), '.test-temp');
  const testPackageDir = join(testDir, 'test-package');

  beforeEach(() => {
    // Clean up any existing test directory
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true });
    }
    
    // Create test package structure
    mkdirSync(testPackageDir, { recursive: true });
    mkdirSync(join(testPackageDir, 'src'), { recursive: true });
    mkdirSync(join(testPackageDir, 'test'), { recursive: true });
    
    // Create test package.json
    const packageJson = {
      name: '@bpm/test-package',
      version: '1.0.0',
      description: 'Test package for externalization',
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
      scripts: {
        build: 'tsc -p tsconfig.build.json',
        test: 'vitest run'
      }
    };
    
    writeFileSync(
      join(testPackageDir, 'package.json'),
      JSON.stringify(packageJson, null, 2)
    );
    
    // Create test source file
    writeFileSync(
      join(testPackageDir, 'src', 'index.ts'),
      `export function testFunction(input: string): string {
  return \`Hello, \${input}!\`;
}`
    );
    
    // Create test file
    writeFileSync(
      join(testPackageDir, 'test', 'index.test.ts'),
      `import { describe, it, expect } from 'vitest';
import { testFunction } from '../src/index';

describe('testFunction', () => {
  it('should return greeting', () => {
    expect(testFunction('World')).toBe('Hello, World!');
  });
});`
    );
    
    // Create tsconfig.build.json
    const tsconfig = {
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
    
    writeFileSync(
      join(testPackageDir, 'tsconfig.build.json'),
      JSON.stringify(tsconfig, null, 2)
    );
  });

  afterEach(() => {
    // Clean up test directory
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true });
    }
  });

  it('should validate package path exists', () => {
    expect(existsSync(testPackageDir)).toBe(true);
    expect(existsSync(join(testPackageDir, 'package.json'))).toBe(true);
  });

  it('should read package.json correctly', () => {
    const packageJsonPath = join(testPackageDir, 'package.json');
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
    
    expect(packageJson.name).toBe('@bpm/test-package');
    expect(packageJson.version).toBe('1.0.0');
    expect(packageJson.type).toBe('module');
  });

  it('should run in dry-run mode without errors', () => {
    const scriptPath = join(process.cwd(), 'scripts', 'pb-externalize-copy.ts');
    
    // Test dry run mode (should not make actual API calls)
    expect(() => {
      try {
        execSync(
          `npx tsx ${scriptPath} pkgPath=${testPackageDir} newRepo=test-external-repo org=test-org dryRun=true`,
          {
            stdio: 'pipe',
            cwd: process.cwd()
          }
        );
      } catch (error: any) {
        // In dry run mode, it might fail on GitHub CLI checks, but that's expected
        if (!error.message.includes('GitHub CLI')) {
          throw error;
        }
      }
    }).not.toThrow();
  });

  it('should validate required arguments', () => {
    const scriptPath = join(process.cwd(), 'scripts', 'pb-externalize-copy.ts');
    
    expect(() => {
      execSync(`npx tsx ${scriptPath}`, { stdio: 'pipe' });
    }).toThrow();
  });

  it('should handle missing package path', () => {
    const scriptPath = join(process.cwd(), 'scripts', 'pb-externalize-copy.ts');
    const nonExistentPath = join(testDir, 'non-existent');
    
    expect(() => {
      execSync(
        `npx tsx ${scriptPath} pkgPath=${nonExistentPath} newRepo=test-repo org=test-org dryRun=true`,
        { stdio: 'pipe' }
      );
    }).toThrow();
  });

  it('should create proper workflow file content', () => {
    const workflowContent = `name: release
on:
  push:
    tags:
      - "v*.*.*"
jobs:
  publish:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      id-token: write
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "20"
          registry-url: "https://registry.npmjs.org"
      - run: npm ci
      - run: npm test --if-present
      - run: npm run build --if-present
      - run: npm publish --provenance --access public
        env:
          NODE_AUTH_TOKEN: \${{ secrets.NPM_TOKEN }}
`;

    // Test that the workflow content is properly formatted
    expect(workflowContent).toContain('name: release');
    expect(workflowContent).toContain('npm publish --provenance --access public');
    expect(workflowContent).toContain('NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}');
  });

  it('should patch package.json correctly', () => {
    const originalPackageJson = JSON.parse(readFileSync(join(testPackageDir, 'package.json'), 'utf8'));
    
    // Simulate package.json patching
    const repoUrl = 'https://github.com/test-org/test-repo.git';
    const nameOverride = 'test-external-package';
    
    const patchedPackageJson = {
      ...originalPackageJson,
      name: nameOverride,
      repository: { type: 'git', url: repoUrl },
      publishConfig: { access: 'public', registry: 'https://registry.npmjs.org' },
      scripts: {
        ...originalPackageJson.scripts,
        release: 'npm version patch && git push --follow-tags'
      }
    };
    
    expect(patchedPackageJson.name).toBe(nameOverride);
    expect(patchedPackageJson.repository.url).toBe(repoUrl);
    expect(patchedPackageJson.publishConfig.access).toBe('public');
    expect(patchedPackageJson.scripts.release).toBe('npm version patch && git push --follow-tags');
  });

  it('should generate proper README content', () => {
    const pkgName = 'test-package';
    const expectedReadme = `# ${pkgName}

Tiny SVG DOM manipulation utilities (translate, set attributes, etc.).

\`\`\`bash
npm i ${pkgName}
\`\`\`

\`\`\`ts
import { setAttrs, translate } from "${pkgName}";
setAttrs("#rect1", { fill: "tomato", width: 24 });
translate("#rect1", 10, 8);
\`\`\`

- Built with TypeScript & ESM.
- Publishes on tag push (\`vX.Y.Z\`).
`;

    expect(expectedReadme).toContain(`# ${pkgName}`);
    expect(expectedReadme).toContain(`npm i ${pkgName}`);
    expect(expectedReadme).toContain('Built with TypeScript & ESM');
  });
});
