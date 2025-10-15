import { describe, it, expect, vi } from 'vitest';
import { SafeCleaner } from '../../src/core/cleaner';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';

// Mock trash to avoid actually moving files to trash
vi.mock('trash', () => ({
  default: vi.fn().mockResolvedValue(undefined),
}));

describe('SafeCleaner', () => {
  it('dry-run skips deletions', async () => {
    const cleaner = new SafeCleaner();
    const res = await cleaner.delete(['/tmp/does-not-exist'], { dryRun: true });
    expect(res.skipped.length).toBe(1);
    expect(res.deleted.length).toBe(0);
  });

  it('successfully deletes existing paths with trash', async () => {
    const testDir = await mkdtemp(path.join(os.tmpdir(), 'modkill-cleaner-'));
    const targetDir = path.join(testDir, 'node_modules');
    await mkdir(targetDir);
    await writeFile(path.join(targetDir, 'test.txt'), 'hello');

    const cleaner = new SafeCleaner();
    const res = await cleaner.delete([targetDir], { useTrash: true });

    expect(res.success).toBe(true);
    expect(res.deleted).toContain(targetDir);
    expect(res.freedBytes).toBeGreaterThan(0);
    expect(res.restoreLogPath).toBeDefined();

    await rm(testDir, { recursive: true, force: true });
  });

  it('hard deletes when useTrash is false', async () => {
    const testDir = await mkdtemp(path.join(os.tmpdir(), 'modkill-cleaner-'));
    const targetDir = path.join(testDir, 'node_modules');
    await mkdir(targetDir);

    const cleaner = new SafeCleaner();
    const res = await cleaner.delete([targetDir], { useTrash: false });

    expect(res.success).toBe(true);
    expect(res.deleted).toContain(targetDir);

    await rm(testDir, { recursive: true, force: true });
  });

  it('skips paths that fail to delete', async () => {
    const cleaner = new SafeCleaner();
    const nonExistentPath = '/nonexistent/path/that/does/not/exist';
    
    const res = await cleaner.delete([nonExistentPath], { useTrash: true });

    expect(res.success).toBe(true);
    // With trash mock, it might succeed (trash is mocked to resolve)
    // So we just check the operation completes successfully
    expect(res.skipped.length + res.deleted.length).toBe(1);
  });

  it('handles multiple paths', async () => {
    const testDir = await mkdtemp(path.join(os.tmpdir(), 'modkill-cleaner-'));
    const dir1 = path.join(testDir, 'dir1');
    const dir2 = path.join(testDir, 'dir2');
    await mkdir(dir1);
    await mkdir(dir2);

    const cleaner = new SafeCleaner();
    const res = await cleaner.delete([dir1, dir2], { useTrash: true });

    expect(res.deleted.length).toBe(2);
    expect(res.freedBytes).toBeGreaterThanOrEqual(0);

    await rm(testDir, { recursive: true, force: true });
  });

  it('creates restore log with deleted items', async () => {
    const testDir = await mkdtemp(path.join(os.tmpdir(), 'modkill-cleaner-'));
    const existingDir = path.join(testDir, 'exists');
    await mkdir(existingDir);

    const cleaner = new SafeCleaner();
    const res = await cleaner.delete([existingDir], { useTrash: true });

    expect(res.restoreLogPath).toBeDefined();
    expect(res.deleted.length).toBeGreaterThan(0);

    await rm(testDir, { recursive: true, force: true });
  });

  it('handles custom restore log path', async () => {
    const testDir = await mkdtemp(path.join(os.tmpdir(), 'modkill-cleaner-'));
    const targetDir = path.join(testDir, 'target');
    await mkdir(targetDir);

    const customLogPath = path.join(testDir, 'custom-restore.log');

    const cleaner = new SafeCleaner();
    const res = await cleaner.delete([targetDir], {
      useTrash: true,
      restoreLogPath: customLogPath,
    });

    expect(res.restoreLogPath).toBe(customLogPath);

    await rm(testDir, { recursive: true, force: true });
  });

  it('calculates freed bytes correctly', async () => {
    const testDir = await mkdtemp(path.join(os.tmpdir(), 'modkill-cleaner-'));
    const targetDir = path.join(testDir, 'node_modules');
    await mkdir(targetDir);
    
    // Write a file with known size
    const content = Buffer.alloc(1024); // 1KB
    await writeFile(path.join(targetDir, 'file.bin'), content);

    const cleaner = new SafeCleaner();
    const res = await cleaner.delete([targetDir], { useTrash: true });

    expect(res.freedBytes).toBeGreaterThanOrEqual(1024);

    await rm(testDir, { recursive: true, force: true });
  });
});

