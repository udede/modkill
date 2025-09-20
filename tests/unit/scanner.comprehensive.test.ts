import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ModuleScanner } from '../../src/core/scanner';
import { mkdtemp, mkdir, writeFile, rm, symlink } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';

describe('ModuleScanner - Comprehensive', () => {
  let testDir: string;

  beforeEach(async () => {
    testDir = await mkdtemp(path.join(os.tmpdir(), 'modkill-test-'));
  });

  afterEach(async () => {
    await rm(testDir, { recursive: true, force: true });
  });

  it('finds node_modules at various depths', async () => {
    // Create nested structure
    await mkdir(path.join(testDir, 'level1', 'node_modules'), { recursive: true });
    await mkdir(path.join(testDir, 'level1', 'level2', 'node_modules'), { recursive: true });
    await mkdir(path.join(testDir, 'level1', 'level2', 'level3', 'node_modules'), { recursive: true });
    
    // Add some files
    await writeFile(path.join(testDir, 'level1', 'node_modules', 'pkg.json'), '{}');
    await writeFile(path.join(testDir, 'level1', 'level2', 'node_modules', 'pkg.json'), '{}');

    const scanner = new ModuleScanner();
    const results = await scanner.scan({ rootPath: testDir, depth: 3 });

    expect(results).toHaveLength(3);
    expect(results.every(r => r.path.includes('node_modules'))).toBe(true);
  });

  it('calculates sizes correctly', async () => {
    const nmPath = path.join(testDir, 'project', 'node_modules');
    await mkdir(nmPath, { recursive: true });
    
    // Create files with known sizes
    await writeFile(path.join(nmPath, 'file1.js'), Buffer.alloc(1024)); // 1KB
    await writeFile(path.join(nmPath, 'file2.js'), Buffer.alloc(2048)); // 2KB
    
    const scanner = new ModuleScanner();
    const results = await scanner.scan({ rootPath: testDir });

    expect(results).toHaveLength(1);
    expect(results[0].sizeBytes).toBeGreaterThanOrEqual(3072);
  });

  it('detects package.json presence', async () => {
    // With package.json
    await mkdir(path.join(testDir, 'with-pkg', 'node_modules'), { recursive: true });
    await writeFile(path.join(testDir, 'with-pkg', 'package.json'), '{"name":"test"}');
    
    // Without package.json
    await mkdir(path.join(testDir, 'without-pkg', 'node_modules'), { recursive: true });

    const scanner = new ModuleScanner();
    const results = await scanner.scan({ rootPath: testDir });

    const withPkg = results.find(r => r.path.includes('with-pkg'));
    const withoutPkg = results.find(r => r.path.includes('without-pkg'));

    expect(withPkg?.hasPackageJson).toBe(true);
    expect(withoutPkg?.hasPackageJson).toBe(false);
  });

  it('respects depth limit', async () => {
    // Create deep structure
    let currentPath = testDir;
    for (let i = 0; i < 10; i++) {
      currentPath = path.join(currentPath, `level${i}`);
      await mkdir(path.join(currentPath, 'node_modules'), { recursive: true });
    }

    const scanner = new ModuleScanner();
    const results = await scanner.scan({ rootPath: testDir, depth: 3 });

    expect(results.length).toBeLessThanOrEqual(3);
  });

  it('excludes system directories', async () => {
    await mkdir(path.join(testDir, '.git', 'node_modules'), { recursive: true });
    await mkdir(path.join(testDir, 'Library', 'node_modules'), { recursive: true });
    await mkdir(path.join(testDir, 'normal', 'node_modules'), { recursive: true });

    const scanner = new ModuleScanner();
    const results = await scanner.scan({ rootPath: testDir });

    expect(results).toHaveLength(1);
    expect(results[0].path).toContain('normal');
  });

  it('handles permission errors gracefully', async () => {
    await mkdir(path.join(testDir, 'accessible', 'node_modules'), { recursive: true });
    
    const scanner = new ModuleScanner();
    // Should not throw even with invalid paths
    const results = await scanner.scan({ rootPath: '/root/invalid/path' });
    
    expect(results).toEqual([]);
  });

  it('does not follow symlinks by default', async () => {
    const realPath = path.join(testDir, 'real', 'node_modules');
    const linkPath = path.join(testDir, 'link');
    
    await mkdir(realPath, { recursive: true });
    await symlink(path.join(testDir, 'real'), linkPath, 'dir');

    const scanner = new ModuleScanner();
    const results = await scanner.scan({ rootPath: testDir, followSymlinks: false });

    expect(results).toHaveLength(1);
  });

  it('skips node_modules within node_modules', async () => {
    const outer = path.join(testDir, 'project', 'node_modules');
    const inner = path.join(outer, 'package', 'node_modules');
    
    await mkdir(inner, { recursive: true });
    await writeFile(path.join(outer, 'file.js'), 'test');
    await writeFile(path.join(inner, 'file.js'), 'test');

    const scanner = new ModuleScanner();
    const results = await scanner.scan({ rootPath: testDir });

    expect(results).toHaveLength(1);
    expect(results[0].path).toBe(outer);
  });
});
