import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { cacheSet, cacheGet } from '../../src/utils/cache.utils';
import { isWindows, supportsLongPaths } from '../../src/utils/platform.utils';
import { isSystemPath, calculateDirectorySize } from '../../src/utils/fs.utils';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';

describe('Utils', () => {
  describe('cache.utils', () => {
    beforeEach(() => {
      // Clear cache between tests
      const key = 'test-key-unique-' + Date.now();
      cacheSet(key, null);
    });

    it('should store and retrieve values', () => {
      cacheSet('test', 'value');
      expect(cacheGet<string>('test')).toBe('value');
    });

    it('should return undefined for non-existent keys', () => {
      expect(cacheGet('nonexistent')).toBeUndefined();
    });

    it('should handle different types', () => {
      cacheSet('string', 'hello');
      cacheSet('number', 42);
      cacheSet('object', { key: 'value' });
      cacheSet('array', [1, 2, 3]);

      expect(cacheGet<string>('string')).toBe('hello');
      expect(cacheGet<number>('number')).toBe(42);
      expect(cacheGet<{ key: string }>('object')).toEqual({ key: 'value' });
      expect(cacheGet<number[]>('array')).toEqual([1, 2, 3]);
    });

    it('should overwrite existing values', () => {
      cacheSet('key', 'first');
      expect(cacheGet<string>('key')).toBe('first');

      cacheSet('key', 'second');
      expect(cacheGet<string>('key')).toBe('second');
    });
  });

  describe('platform.utils', () => {
    it('should detect platform', () => {
      const result = isWindows();
      expect(typeof result).toBe('boolean');
      
      // Should match os.platform()
      const expected = os.platform() === 'win32';
      expect(result).toBe(expected);
    });

    it('should determine long path support', () => {
      const result = supportsLongPaths();
      expect(typeof result).toBe('boolean');
      
      // Currently returns same as isWindows()
      expect(result).toBe(isWindows());
    });
  });

  describe('fs.utils', () => {
    describe('isSystemPath', () => {
      it('should detect system paths', () => {
        expect(isSystemPath('/System/Library')).toBe(true);
        expect(isSystemPath('/Windows/System32')).toBe(true);
        expect(isSystemPath('/Library/Application Support')).toBe(true);
        expect(isSystemPath('C:\\Program Files\\Node')).toBe(true);
      });

      it('should not flag normal paths as system paths', () => {
        expect(isSystemPath('/Users/username/projects')).toBe(false);
        expect(isSystemPath('/home/user/workspace')).toBe(false);
        expect(isSystemPath('C:\\Users\\username\\Desktop')).toBe(false);
        expect(isSystemPath('/opt/myapp')).toBe(false);
      });

      it('should be case insensitive', () => {
        expect(isSystemPath('/SYSTEM/test')).toBe(true);
        expect(isSystemPath('/system/test')).toBe(true);
        expect(isSystemPath('/System/test')).toBe(true);
      });
    });

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

