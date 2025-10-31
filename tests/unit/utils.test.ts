import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { isWindows } from '../../src/utils/platform.utils';
import { calculateDirectorySize } from '../../src/utils/fs.utils';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';

describe('Utils', () => {
  describe('platform.utils', () => {
    it('should detect platform', () => {
      const result = isWindows();
      expect(typeof result).toBe('boolean');

      // Should match os.platform()
      const expected = os.platform() === 'win32';
      expect(result).toBe(expected);
    });
  });

  describe('fs.utils', () => {
    describe('calculateDirectorySize', () => {
      let testDir: string;

      beforeEach(async () => {
        testDir = await mkdtemp(path.join(os.tmpdir(), 'modkill-size-test-'));
      });

      afterEach(async () => {
        await rm(testDir, { recursive: true, force: true });
      });

      it('should calculate size of empty directory', async () => {
        const size = await calculateDirectorySize(testDir);
        expect(size).toBe(0);
      });

      it('should calculate size of directory with files', async () => {
        await writeFile(path.join(testDir, 'file1.txt'), 'hello');
        await writeFile(path.join(testDir, 'file2.txt'), 'world');

        const size = await calculateDirectorySize(testDir);
        expect(size).toBe(10); // 5 + 5 bytes
      });

      it('should calculate size recursively', async () => {
        await mkdir(path.join(testDir, 'subdir'));
        await writeFile(path.join(testDir, 'file1.txt'), 'hello');
        await writeFile(path.join(testDir, 'subdir', 'file2.txt'), 'world');

        const size = await calculateDirectorySize(testDir);
        expect(size).toBe(10); // 5 + 5 bytes
      });

      it('should handle nested directories', async () => {
        await mkdir(path.join(testDir, 'level1', 'level2', 'level3'), { recursive: true });
        await writeFile(path.join(testDir, 'level1', 'level2', 'level3', 'deep.txt'), '12345');

        const size = await calculateDirectorySize(testDir);
        expect(size).toBe(5);
      });

      it('should return 0 for non-existent directory', async () => {
        const size = await calculateDirectorySize('/nonexistent/path/that/does/not/exist');
        expect(size).toBe(0);
      });

      it('should handle permission errors gracefully', async () => {
        // Just ensure it doesn't throw
        const size = await calculateDirectorySize('/root/.ssh');
        expect(typeof size).toBe('number');
      });

      it('should calculate size of larger files', async () => {
        const largeContent = Buffer.alloc(1024); // 1KB
        await writeFile(path.join(testDir, 'large.bin'), largeContent);

        const size = await calculateDirectorySize(testDir);
        expect(size).toBe(1024);
      });

      it('should handle multiple subdirectories', async () => {
        await mkdir(path.join(testDir, 'dir1'));
        await mkdir(path.join(testDir, 'dir2'));
        await mkdir(path.join(testDir, 'dir3'));
        
        await writeFile(path.join(testDir, 'dir1', 'file.txt'), '123');
        await writeFile(path.join(testDir, 'dir2', 'file.txt'), '456');
        await writeFile(path.join(testDir, 'dir3', 'file.txt'), '789');

        const size = await calculateDirectorySize(testDir);
        expect(size).toBe(9); // 3 + 3 + 3 bytes
      });
    });
  });
});

