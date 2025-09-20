import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { runInteractiveCommand } from '../../src/commands/interactive.command';
import { runAutoCommand } from '../../src/commands/auto.command';
import { runDryRunCommand } from '../../src/commands/dryrun.command';
import { runCurrentCommand } from '../../src/commands/current.command';
import { mkdtemp, mkdir, writeFile, rm, utimes, access } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';

// Mock console methods
const consoleSpy = {
  log: vi.spyOn(console, 'log').mockImplementation(() => {}),
  error: vi.spyOn(console, 'error').mockImplementation(() => {}),
};

// Mock inquirer
vi.mock('inquirer', () => ({
  default: {
    prompt: vi.fn().mockResolvedValue({ selected: [], confirm: false }),
  },
}));

// Mock trash
vi.mock('trash', () => ({
  default: vi.fn().mockResolvedValue(undefined),
}));

describe('Commands Integration Tests', () => {
  let testDir: string;

  beforeEach(async () => {
    testDir = await mkdtemp(path.join(os.tmpdir(), 'modkill-cmd-test-'));
    consoleSpy.log.mockClear();
    consoleSpy.error.mockClear();
  });

  afterEach(async () => {
    await rm(testDir, { recursive: true, force: true });
  });

  describe('Interactive Command', () => {
    it('handles no modules found', async () => {
      await runInteractiveCommand({ path: testDir });
      
      const output = consoleSpy.log.mock.calls.flat().join('\n');
      expect(output).toContain('No node_modules found');
    });

    it('outputs JSON when requested', async () => {
      await mkdir(path.join(testDir, 'project', 'node_modules'), { recursive: true });
      await writeFile(path.join(testDir, 'project', 'package.json'), '{}');
      
      await runInteractiveCommand({ path: testDir, json: true });
      
      const output = consoleSpy.log.mock.calls.flat().join('');
      const parsed = JSON.parse(output);
      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed[0]).toHaveProperty('path');
      expect(parsed[0]).toHaveProperty('sizeBytes');
      expect(parsed[0]).toHaveProperty('ageDays');
    });

    it('filters by minimum age', async () => {
      const nmPath = path.join(testDir, 'old', 'node_modules');
      await mkdir(nmPath, { recursive: true });
      
      // Set to 100 days ago
      const oldDate = new Date(Date.now() - 100 * 24 * 60 * 60 * 1000);
      await utimes(nmPath, oldDate, oldDate);
      
      await runInteractiveCommand({ 
        path: testDir, 
        minAge: 90,
        json: true 
      });
      
      const output = consoleSpy.log.mock.calls.flat().join('');
      const parsed = JSON.parse(output);
      expect(parsed.length).toBeGreaterThan(0);
      expect(parsed[0].ageDays).toBeGreaterThan(90);
    });

    it('filters by minimum size', async () => {
      const nmPath = path.join(testDir, 'large', 'node_modules');
      await mkdir(nmPath, { recursive: true });
      await writeFile(path.join(nmPath, 'large.bin'), Buffer.alloc(1024 * 1024)); // 1MB
      
      await runInteractiveCommand({ 
        path: testDir, 
        minSize: 0.5, // 0.5MB
        json: true 
      });
      
      const output = consoleSpy.log.mock.calls.flat().join('');
      const parsed = JSON.parse(output);
      expect(parsed.length).toBeGreaterThan(0);
      expect(parsed[0].sizeBytes).toBeGreaterThan(500000);
    });
  });

  describe('Auto Command', () => {
    it('auto-cleans old modules', async () => {
      const nmPath = path.join(testDir, 'old', 'node_modules');
      await mkdir(nmPath, { recursive: true });
      
      // Set to 40 days ago
      const oldDate = new Date(Date.now() - 40 * 24 * 60 * 60 * 1000);
      await utimes(nmPath, oldDate, oldDate);
      
      await runAutoCommand({ 
        path: testDir,
        dryRun: true // Don't actually delete in tests
      });
      
      const output = consoleSpy.log.mock.calls.flat().join('\n');
      expect(output).toContain('Auto-clean complete');
    });

    it('respects custom age threshold', async () => {
      const nmPath = path.join(testDir, 'medium', 'node_modules');
      await mkdir(nmPath, { recursive: true });
      
      // Set to 50 days ago
      const oldDate = new Date(Date.now() - 50 * 24 * 60 * 60 * 1000);
      await utimes(nmPath, oldDate, oldDate);
      
      await runAutoCommand({ 
        path: testDir,
        minAge: 60, // Should not delete
        json: true
      });
      
      const output = consoleSpy.log.mock.calls.flat().join('');
      const parsed = JSON.parse(output);
      expect(parsed).toHaveLength(0);
    });
  });

  describe('DryRun Command', () => {
    it('shows preview without deleting', async () => {
      const nmPath = path.join(testDir, 'project', 'node_modules');
      await mkdir(nmPath, { recursive: true });
      await writeFile(path.join(nmPath, 'file.js'), 'test');
      
      await runDryRunCommand({ path: testDir });
      
      const output = consoleSpy.log.mock.calls.flat().join('\n');
      expect(output).toContain('Total potential to free');
      expect(output).toContain(nmPath);
      
      // Verify nothing was deleted
      await expect(access(nmPath)).resolves.toBeUndefined();
    });

    it('sorts results correctly', async () => {
      // Create multiple node_modules with different sizes
      const small = path.join(testDir, 'small', 'node_modules');
      const large = path.join(testDir, 'large', 'node_modules');
      
      await mkdir(small, { recursive: true });
      await mkdir(large, { recursive: true });
      
      await writeFile(path.join(small, 'file.js'), Buffer.alloc(100));
      await writeFile(path.join(large, 'file.js'), Buffer.alloc(10000));
      
      await runDryRunCommand({ 
        path: testDir,
        sort: 'size',
        json: true
      });
      
      const output = consoleSpy.log.mock.calls.flat().join('');
      const parsed = JSON.parse(output);
      
      expect(parsed[0].sizeBytes).toBeGreaterThan(parsed[1].sizeBytes);
    });
  });

  describe('Current Command', () => {
    it.skip('cleans current directory only', async () => {
      // Skipped: process.chdir() not supported in Vitest workers
      const nmPath = path.join(testDir, 'node_modules');
      await mkdir(nmPath, { recursive: true });
      
      await runCurrentCommand({ dryRun: true });
      
      const output = consoleSpy.log.mock.calls.flat().join('\n');
      expect(output).toContain('Deleted: 0, Skipped: 1');
    });

    it.skip('handles missing node_modules gracefully', async () => {
      // Skipped: process.chdir() not supported in Vitest workers
      await runCurrentCommand({});
      
      const output = consoleSpy.log.mock.calls.flat().join('\n');
      expect(output).toContain('No node_modules in current directory');
    });
  });
});
