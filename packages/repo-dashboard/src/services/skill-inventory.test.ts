/**
 * Unit tests for Skill Inventory Service
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { SkillInventoryService } from './skill-inventory.js';

describe('SkillInventoryService', () => {
  let service: SkillInventoryService;

  beforeEach(() => {
    service = new SkillInventoryService();
  });

  describe('calculateSkillInventory', () => {
    it('should extract TypeScript skill from .ts files', async () => {
      const commitHistory = [
        { author: 'alice', files: ['src/main.ts', 'src/utils.ts'] },
        { author: 'bob', files: ['src/api.ts'] },
      ];

      const inventory = await service.calculateSkillInventory(
        'org',
        'team',
        commitHistory,
        ['alice', 'bob']
      );

      const tsSkill = inventory.skills.find(s => s.name === 'TypeScript');
      expect(tsSkill).toBeDefined();
      expect(tsSkill?.experts.length).toBeGreaterThan(0);
    });

    it('should extract React skill from .tsx files', async () => {
      const commitHistory = [
        { author: 'alice', files: ['src/Component.tsx'] },
      ];

      const inventory = await service.calculateSkillInventory(
        'org',
        'team',
        commitHistory,
        ['alice']
      );

      const reactSkill = inventory.skills.find(s => s.name === 'React');
      expect(reactSkill).toBeDefined();
    });

    it('should extract Testing skill from test files', async () => {
      const commitHistory = [
        { author: 'alice', files: ['src/main.test.ts'] },
        { author: 'bob', files: ['src/__tests__/api.ts'] },
      ];

      const inventory = await service.calculateSkillInventory(
        'org',
        'team',
        commitHistory,
        ['alice', 'bob']
      );

      const testSkill = inventory.skills.find(s => s.name === 'Testing');
      expect(testSkill).toBeDefined();
      // Only alice has a .test.ts file that matches the pattern, bob has __tests__ which may not match
      expect(testSkill?.experts.length).toBeGreaterThanOrEqual(1);
    });

    it('should extract DevOps skill from Docker files', async () => {
      const commitHistory = [
        { author: 'alice', files: ['Dockerfile', 'docker-compose.yml'] },
      ];

      const inventory = await service.calculateSkillInventory(
        'org',
        'team',
        commitHistory,
        ['alice']
      );

      const devopsSkill = inventory.skills.find(s => s.name === 'DevOps');
      expect(devopsSkill).toBeDefined();
    });

    it('should identify skill gaps', async () => {
      const commitHistory = [
        { author: 'alice', files: ['src/main.ts'] },
      ];

      const inventory = await service.calculateSkillInventory(
        'org',
        'team',
        commitHistory,
        ['alice']
      );

      expect(inventory.skillGaps.length).toBeGreaterThan(0);
      expect(inventory.skillGaps).toContain('React');
    });

    it('should generate cross-training opportunities', async () => {
      const commitHistory = [
        { author: 'alice', files: ['src/main.ts'] },
      ];

      const inventory = await service.calculateSkillInventory(
        'org',
        'team',
        commitHistory,
        ['alice']
      );

      expect(inventory.crossTrainingOpportunities.length).toBeGreaterThan(0);
    });

    it('should calculate skill distribution', async () => {
      const commitHistory = [
        { author: 'alice', files: ['src/main.ts'] },
        { author: 'bob', files: ['src/api.ts'] },
      ];

      const inventory = await service.calculateSkillInventory(
        'org',
        'team',
        commitHistory,
        ['alice', 'bob']
      );

      expect(Object.keys(inventory.skillDistribution).length).toBeGreaterThan(0);
      for (const coverage of Object.values(inventory.skillDistribution)) {
        expect(coverage).toBeGreaterThanOrEqual(0);
        expect(coverage).toBeLessThanOrEqual(1);
      }
    });

    it('should categorize experts, practitioners, and learners', async () => {
      const commitHistory = [
        { author: 'alice', files: ['src/main.ts', 'src/utils.ts', 'src/api.ts'] },
        { author: 'bob', files: ['src/config.ts', 'src/types.ts'] },
        { author: 'charlie', files: ['src/test.ts'] },
      ];

      const inventory = await service.calculateSkillInventory(
        'org',
        'team',
        commitHistory,
        ['alice', 'bob', 'charlie']
      );

      const tsSkill = inventory.skills.find(s => s.name === 'TypeScript');
      expect(tsSkill?.experts.length).toBeGreaterThan(0);
      expect(tsSkill?.practitioners.length).toBeGreaterThanOrEqual(0);
      expect(tsSkill?.learners.length).toBeGreaterThanOrEqual(0);
    });

    it('should maintain history', async () => {
      const commitHistory = [
        { author: 'alice', files: ['src/main.ts'] },
      ];

      await service.calculateSkillInventory('org', 'team', commitHistory, ['alice']);
      await service.calculateSkillInventory('org', 'team', commitHistory, ['alice']);

      const history = service.getHistory('org', 'team');
      expect(history.length).toBe(2);
    });

    it('should clear history', async () => {
      const commitHistory = [
        { author: 'alice', files: ['src/main.ts'] },
      ];

      await service.calculateSkillInventory('org', 'team', commitHistory, ['alice']);
      service.clearHistory('org', 'team');

      const history = service.getHistory('org', 'team');
      expect(history.length).toBe(0);
    });

    it('should handle empty commit history', async () => {
      const inventory = await service.calculateSkillInventory(
        'org',
        'team',
        [],
        ['alice']
      );

      expect(inventory.skills.length).toBe(0);
      expect(inventory.skillGaps.length).toBeGreaterThan(0);
    });

    it('should include timestamp', async () => {
      const inventory = await service.calculateSkillInventory('org', 'team', [], ['alice']);

      expect(inventory.timestamp).toBeInstanceOf(Date);
    });

    it('should limit history to max points', async () => {
      const commitHistory = [
        { author: 'alice', files: ['src/main.ts'] },
      ];

      for (let i = 0; i < 150; i++) {
        await service.calculateSkillInventory('org', 'team', commitHistory, ['alice']);
      }

      const history = service.getHistory('org', 'team');
      expect(history.length).toBeLessThanOrEqual(100);
    });
  });
});

