/**
 * Tests for local package discovery
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { findLocalPackages, getPackageReadiness } from './local.js';
import { readdir, readFile, stat } from 'node:fs/promises';

// Mock fs/promises
vi.mock('node:fs/promises', () => ({
  readdir: vi.fn(),
  readFile: vi.fn(),
  stat: vi.fn(),
}));

describe('Local Package Discovery', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('findLocalPackages', () => {
    it('should find packages in a directory', async () => {
      const mockEntries = [
        { name: 'package1', isDirectory: () => true },
        { name: 'package2', isDirectory: () => true },
        { name: 'file.txt', isDirectory: () => false },
      ];

      const mockPackageJson1 = {
        name: '@bpm/package1',
        version: '1.0.0',
        description: 'Package 1',
        private: false,
        exports: { '.': './dist/index.js' },
      };

      const mockPackageJson2 = {
        name: '@bpm/package2',
        version: '2.0.0',
        description: 'Package 2',
        private: false,
        main: './dist/index.js',
      };

      (readdir as any).mockResolvedValueOnce(mockEntries);
      (readFile as any)
        .mockResolvedValueOnce(JSON.stringify(mockPackageJson1))
        .mockResolvedValueOnce(JSON.stringify(mockPackageJson2));

      (stat as any)
        .mockRejectedValueOnce(new Error('not found')) // dist for package1
        .mockRejectedValueOnce(new Error('not found')) // artifacts for package1
        .mockRejectedValueOnce(new Error('not found')) // dist for package2
        .mockRejectedValueOnce(new Error('not found')); // artifacts for package2

      const packages = await findLocalPackages({ basePath: './packages' });

      expect(packages).toHaveLength(2);
      expect(packages[0].name).toBe('@bpm/package1');
      expect(packages[1].name).toBe('@bpm/package2');
    });

    it('should skip private packages when includePrivate is false', async () => {
      const mockEntries = [
        { name: 'package1', isDirectory: () => true },
      ];

      const mockPackageJson = {
        name: '@bpm/package1',
        version: '1.0.0',
        private: true,
      };

      (readdir as any).mockResolvedValueOnce(mockEntries);
      (readFile as any).mockResolvedValueOnce(JSON.stringify(mockPackageJson));

      const packages = await findLocalPackages({ basePath: './packages', includePrivate: false });

      expect(packages).toHaveLength(0);
    });

    it('should include private packages when includePrivate is true', async () => {
      const mockEntries = [
        { name: 'package1', isDirectory: () => true },
      ];

      const mockPackageJson = {
        name: '@bpm/package1',
        version: '1.0.0',
        private: true,
        exports: { '.': './dist/index.js' },
      };

      (readdir as any).mockResolvedValueOnce(mockEntries);
      (readFile as any).mockResolvedValueOnce(JSON.stringify(mockPackageJson));
      (stat as any)
        .mockRejectedValueOnce(new Error('not found'))
        .mockRejectedValueOnce(new Error('not found'));

      const packages = await findLocalPackages({ basePath: './packages', includePrivate: true });

      expect(packages).toHaveLength(1);
      expect(packages[0].private).toBe(true);
    });

    it('should detect build readiness', async () => {
      const mockEntries = [
        { name: 'package1', isDirectory: () => true },
      ];

      const mockPackageJson = {
        name: '@bpm/package1',
        version: '1.0.0',
        exports: { '.': './dist/index.js' },
      };

      (readdir as any).mockResolvedValueOnce(mockEntries);
      (readFile as any).mockResolvedValueOnce(JSON.stringify(mockPackageJson));

      // Mock dist exists
      (stat as any)
        .mockResolvedValueOnce({ isDirectory: () => true })
        .mockRejectedValueOnce(new Error('not found'));

      const packages = await findLocalPackages({ basePath: './packages' });

      expect(packages[0].buildReady).toBe(true);
      expect(packages[0].distExists).toBe(true);
    });
  });

  describe('getPackageReadiness', () => {
    it('should calculate package readiness statistics', async () => {
      const mockEntries = [
        { name: 'package1', isDirectory: () => true },
        { name: 'package2', isDirectory: () => true },
      ];

      const mockPackageJson1 = {
        name: '@bpm/package1',
        version: '1.0.0',
        exports: { '.': './dist/index.js' },
      };

      const mockPackageJson2 = {
        name: '@bpm/package2',
        version: '2.0.0',
        main: './dist/index.js',
      };

      (readdir as any).mockResolvedValueOnce(mockEntries);
      (readFile as any)
        .mockResolvedValueOnce(JSON.stringify(mockPackageJson1))
        .mockResolvedValueOnce(JSON.stringify(mockPackageJson2));

      // Mock dist exists for package1, not for package2
      (stat as any)
        .mockResolvedValueOnce({ isDirectory: () => true })
        .mockRejectedValueOnce(new Error('not found'))
        .mockRejectedValueOnce(new Error('not found'))
        .mockRejectedValueOnce(new Error('not found'));

      const readiness = await getPackageReadiness({ basePath: './packages' });

      expect(readiness.total).toBe(2);
      expect(readiness.ready).toBe(1);
    });
  });
});

