import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdir, rm, readFile, readdir, access } from 'fs/promises';
import { join } from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

describe('pb-create-renderx-lab', () => {
  const testDir = join(process.cwd(), 'test-renderx-lab');

  beforeEach(async () => {
    // Clean up test directory if it exists
    try {
      await rm(testDir, { recursive: true, force: true });
    } catch (err) {
      // Ignore if directory doesn't exist
    }
  });

  afterEach(async () => {
    // Clean up after tests
    try {
      await rm(testDir, { recursive: true, force: true });
    } catch (err) {
      // Ignore cleanup errors
    }
  });

  it('should create the repository structure', async () => {
    // Run the script
    await execAsync(`npx tsx scripts/pb-create-renderx-lab.ts ${testDir}`);

    // Verify main directories exist
    const dirs = [
      'src',
      'src/host',
      'src/orchestration',
      'src/validators',
      'plugins',
      'plugins/library-panel',
      'plugins/control-panel',
      'plugins/canvas-ui',
      'plugins/example-ai-enhancement',
      'docs',
      'tests',
      'tests/unit',
      'tests/e2e',
      'scripts'
    ];

    for (const dir of dirs) {
      const dirPath = join(testDir, dir);
      await expect(access(dirPath)).resolves.not.toThrow();
    }
  }, 30000);

  it('should create package.json with correct structure', async () => {
    await execAsync(`npx tsx scripts/pb-create-renderx-lab.ts ${testDir}`);

    const packageJsonPath = join(testDir, 'package.json');
    const content = await readFile(packageJsonPath, 'utf-8');
    const packageJson = JSON.parse(content);

    expect(packageJson.name).toBe('renderx-plugin-lab');
    expect(packageJson.version).toBe('0.1.0');
    expect(packageJson.private).toBe(true);
    expect(packageJson.scripts).toHaveProperty('dev');
    expect(packageJson.scripts).toHaveProperty('build');
    expect(packageJson.scripts).toHaveProperty('test');
    expect(packageJson.scripts).toHaveProperty('test:cia');
    expect(packageJson.scripts).toHaveProperty('test:spa');
    expect(packageJson.dependencies).toHaveProperty('react');
    expect(packageJson.devDependencies).toHaveProperty('typescript');
    expect(packageJson.devDependencies).toHaveProperty('vite');
    expect(packageJson.devDependencies).toHaveProperty('vitest');
  }, 30000);

  it('should create tsconfig.json', async () => {
    await execAsync(`npx tsx scripts/pb-create-renderx-lab.ts ${testDir}`);

    const tsconfigPath = join(testDir, 'tsconfig.json');
    const content = await readFile(tsconfigPath, 'utf-8');
    const tsconfig = JSON.parse(content);

    expect(tsconfig.compilerOptions).toBeDefined();
    expect(tsconfig.compilerOptions.target).toBe('ES2020');
    expect(tsconfig.compilerOptions.jsx).toBe('react-jsx');
    expect(tsconfig.include).toContain('src');
  }, 30000);

  it('should create .gitignore', async () => {
    await execAsync(`npx tsx scripts/pb-create-renderx-lab.ts ${testDir}`);

    const gitignorePath = join(testDir, '.gitignore');
    const content = await readFile(gitignorePath, 'utf-8');

    expect(content).toContain('node_modules/');
    expect(content).toContain('dist/');
    expect(content).toContain('.env');
  }, 30000);

  it('should create README.md with correct content', async () => {
    await execAsync(`npx tsx scripts/pb-create-renderx-lab.ts ${testDir}`);

    const readmePath = join(testDir, 'README.md');
    const content = await readFile(readmePath, 'utf-8');

    expect(content).toContain('# RenderX Plugin Lab');
    expect(content).toContain('Conductor Integration Architecture');
    expect(content).toContain('Symphonic Plugin Architecture');
    expect(content).toContain('Getting Started');
  }, 30000);

  it('should create source files', async () => {
    await execAsync(`npx tsx scripts/pb-create-renderx-lab.ts ${testDir}`);

    const files = [
      'src/index.ts',
      'src/host/thin-host.tsx',
      'src/orchestration/conductor-setup.ts',
      'src/validators/spa-validator.ts'
    ];

    for (const file of files) {
      const filePath = join(testDir, file);
      await expect(access(filePath)).resolves.not.toThrow();
    }
  }, 30000);

  it('should create plugin manifests', async () => {
    await execAsync(`npx tsx scripts/pb-create-renderx-lab.ts ${testDir}`);

    const plugins = [
      'library-panel',
      'control-panel',
      'canvas-ui',
      'example-ai-enhancement'
    ];

    for (const plugin of plugins) {
      const manifestPath = join(testDir, 'plugins', plugin, 'manifest.json');
      const content = await readFile(manifestPath, 'utf-8');
      const manifest = JSON.parse(content);

      expect(manifest.name).toBe(plugin);
      expect(manifest.version).toBe('0.1.0');
      expect(manifest.type).toBeDefined();
      expect(manifest.exports).toBeInstanceOf(Array);
    }
  }, 30000);

  it('should create documentation files', async () => {
    await execAsync(`npx tsx scripts/pb-create-renderx-lab.ts ${testDir}`);

    const docs = [
      'docs/architecture-overview.md',
      'docs/canvas-files.md',
      'docs/ai-enhancements.md',
      'docs/cia-spa-guide.md'
    ];

    for (const doc of docs) {
      const docPath = join(testDir, doc);
      await expect(access(docPath)).resolves.not.toThrow();
    }
  }, 30000);

  it('should create test files', async () => {
    await execAsync(`npx tsx scripts/pb-create-renderx-lab.ts ${testDir}`);

    const testFiles = [
      'tests/unit/conductor.test.ts',
      'tests/unit/spa-validator.test.ts',
      'tests/e2e/README.md'
    ];

    for (const file of testFiles) {
      const filePath = join(testDir, file);
      await expect(access(filePath)).resolves.not.toThrow();
    }
  }, 30000);

  it('should create build scripts', async () => {
    await execAsync(`npx tsx scripts/pb-create-renderx-lab.ts ${testDir}`);

    const scripts = [
      'scripts/simulateCanvas.js',
      'scripts/showStats.js'
    ];

    for (const script of scripts) {
      const scriptPath = join(testDir, script);
      await expect(access(scriptPath)).resolves.not.toThrow();
    }
  }, 30000);

  it('should create vitest config files', async () => {
    await execAsync(`npx tsx scripts/pb-create-renderx-lab.ts ${testDir}`);

    const configs = [
      'vitest.cia.config.ts',
      'vitest.spa.config.ts'
    ];

    for (const config of configs) {
      const configPath = join(testDir, config);
      const content = await readFile(configPath, 'utf-8');
      expect(content).toContain('defineConfig');
      expect(content).toContain('vitest/config');
    }
  }, 30000);

  it('should create valid TypeScript files', async () => {
    await execAsync(`npx tsx scripts/pb-create-renderx-lab.ts ${testDir}`);

    const indexPath = join(testDir, 'src', 'index.ts');
    const content = await readFile(indexPath, 'utf-8');

    expect(content).toContain('export');
    expect(content).toContain('RenderX Plugin Lab');
  }, 30000);

  it('should create conductor with proper structure', async () => {
    await execAsync(`npx tsx scripts/pb-create-renderx-lab.ts ${testDir}`);

    const conductorPath = join(testDir, 'src', 'orchestration', 'conductor-setup.ts');
    const content = await readFile(conductorPath, 'utf-8');

    expect(content).toContain('class Conductor');
    expect(content).toContain('async play()');
    expect(content).toContain('createConductor');
  }, 30000);

  it('should create SPA validator with validation logic', async () => {
    await execAsync(`npx tsx scripts/pb-create-renderx-lab.ts ${testDir}`);

    const validatorPath = join(testDir, 'src', 'validators', 'spa-validator.ts');
    const content = await readFile(validatorPath, 'utf-8');

    expect(content).toContain('class SPAValidator');
    expect(content).toContain('validate');
    expect(content).toContain('PluginManifest');
  }, 30000);
});

