import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { writeFile, mkdir, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { findConfigFile, parseConfigFile, loadConfig } from '../../../src/utils/config';
import type { CliOptions } from '../../../src/cli';

describe('config', () => {
  let tempDir: string;
  let testDir: string;

  beforeEach(async () => {
    tempDir = join(tmpdir(), `modkill-config-test-${Date.now()}`);
    await mkdir(tempDir, { recursive: true });
    testDir = join(tempDir, 'project');
    await mkdir(testDir, { recursive: true });
  });

  afterEach(async () => {
    try {
      await rm(tempDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  describe('findConfigFile', () => {
    it('should find .modkillrc in current directory', async () => {
      const configPath = join(testDir, '.modkillrc');
      await writeFile(configPath, '{}');

      const found = findConfigFile(testDir);
      expect(found).toBe(configPath);
    });

    it('should find .modkillrc.json in current directory', async () => {
      const configPath = join(testDir, '.modkillrc.json');
      await writeFile(configPath, '{}');

      const found = findConfigFile(testDir);
      expect(found).toBe(configPath);
    });

    it('should prefer .modkillrc over .modkillrc.json', async () => {
      const modkillrc = join(testDir, '.modkillrc');
      const modkillrcJson = join(testDir, '.modkillrc.json');
      await writeFile(modkillrc, '{}');
      await writeFile(modkillrcJson, '{}');

      const found = findConfigFile(testDir);
      expect(found).toBe(modkillrc);
    });

    it('should find config in parent directory', async () => {
      const nestedDir = join(testDir, 'nested', 'deep');
      await mkdir(nestedDir, { recursive: true });

      const configPath = join(testDir, '.modkillrc');
      await writeFile(configPath, '{}');

      const found = findConfigFile(nestedDir);
      expect(found).toBe(configPath);
    });

    it('should return null if no config file found', () => {
      const found = findConfigFile(testDir);
      expect(found).toBeNull();
    });
  });

  describe('parseConfigFile', () => {
    it('should parse valid config file', async () => {
      const configPath = join(testDir, '.modkillrc');
      const config = {
        minAge: 30,
        minSize: 100,
        sort: 'size',
        depth: 5,
        yes: true,
        verbose: false,
      };
      await writeFile(configPath, JSON.stringify(config));

      const parsed = await parseConfigFile(configPath);
      expect(parsed).toEqual(config);
    });

    it('should parse config with exclude patterns', async () => {
      const configPath = join(testDir, '.modkillrc');
      const config = {
        exclude: ['node_modules', '.git', 'dist'],
      };
      await writeFile(configPath, JSON.stringify(config));

      const parsed = await parseConfigFile(configPath);
      expect(parsed.exclude).toEqual(['node_modules', '.git', 'dist']);
    });

    it('should throw error for invalid JSON', async () => {
      const configPath = join(testDir, '.modkillrc');
      await writeFile(configPath, '{ invalid json }');

      await expect(parseConfigFile(configPath)).rejects.toThrow('Invalid JSON');
    });

    it('should throw error for non-object config', async () => {
      const configPath = join(testDir, '.modkillrc');
      await writeFile(configPath, '[]');

      await expect(parseConfigFile(configPath)).rejects.toThrow('Config must be an object');
    });

    it('should throw error for invalid minAge', async () => {
      const configPath = join(testDir, '.modkillrc');
      await writeFile(configPath, JSON.stringify({ minAge: -1 }));

      await expect(parseConfigFile(configPath)).rejects.toThrow('minAge must be a non-negative number');
    });

    it('should throw error for invalid minSize', async () => {
      const configPath = join(testDir, '.modkillrc');
      await writeFile(configPath, JSON.stringify({ minSize: 'large' }));

      await expect(parseConfigFile(configPath)).rejects.toThrow('minSize must be a non-negative number');
    });

    it('should throw error for invalid sort', async () => {
      const configPath = join(testDir, '.modkillrc');
      await writeFile(configPath, JSON.stringify({ sort: 'invalid' }));

      await expect(parseConfigFile(configPath)).rejects.toThrow('sort must be one of');
    });

    it('should throw error for invalid depth', async () => {
      const configPath = join(testDir, '.modkillrc');
      await writeFile(configPath, JSON.stringify({ depth: 0 }));

      await expect(parseConfigFile(configPath)).rejects.toThrow('depth must be a positive number');
    });

    it('should throw error for invalid boolean fields', async () => {
      const configPath = join(testDir, '.modkillrc');
      await writeFile(configPath, JSON.stringify({ yes: 'true' }));

      await expect(parseConfigFile(configPath)).rejects.toThrow('yes must be a boolean');
    });

    it('should throw error for invalid exclude', async () => {
      const configPath = join(testDir, '.modkillrc');
      await writeFile(configPath, JSON.stringify({ exclude: 'pattern' }));

      await expect(parseConfigFile(configPath)).rejects.toThrow('exclude must be an array');
    });

    it('should throw error for non-string exclude patterns', async () => {
      const configPath = join(testDir, '.modkillrc');
      await writeFile(configPath, JSON.stringify({ exclude: [1, 2, 3] }));

      await expect(parseConfigFile(configPath)).rejects.toThrow('exclude patterns must be strings');
    });

    it('should throw error for invalid path', async () => {
      const configPath = join(testDir, '.modkillrc');
      await writeFile(configPath, JSON.stringify({ path: 123 }));

      await expect(parseConfigFile(configPath)).rejects.toThrow('path must be a string');
    });
  });

  describe('loadConfig', () => {
    it('should return CLI options as-is if no config file', async () => {
      const cliOpts: CliOptions = {
        minAge: 20,
        verbose: true,
      };

      const merged = await loadConfig(cliOpts);
      expect(merged.minAge).toBe(20);
      expect(merged.verbose).toBe(true);
    });

    it('should merge config file with CLI options', async () => {
      const configPath = join(testDir, '.modkillrc');
      await writeFile(
        configPath,
        JSON.stringify({
          minAge: 30,
          minSize: 100,
          sort: 'age',
          verbose: false,
        })
      );

      const cliOpts: CliOptions = {
        minAge: 20, // CLI overrides config
        path: testDir,
      };

      const merged = await loadConfig(cliOpts);
      expect(merged.minAge).toBe(20); // CLI takes precedence
      expect(merged.minSize).toBe(100); // From config
      expect(merged.sort).toBe('age'); // From config
      expect(merged.verbose).toBe(false); // From config
    });

    it('should use config values when CLI options are undefined', async () => {
      const configPath = join(testDir, '.modkillrc');
      await writeFile(
        configPath,
        JSON.stringify({
          minAge: 30,
          minSize: 100,
          yes: true,
          verbose: true,
        })
      );

      const cliOpts: CliOptions = {
        path: testDir,
      };

      const merged = await loadConfig(cliOpts);
      expect(merged.minAge).toBe(30);
      expect(merged.minSize).toBe(100);
      expect(merged.yes).toBe(true);
      expect(merged.verbose).toBe(true);
    });

    it('should handle exclude patterns from config', async () => {
      const configPath = join(testDir, '.modkillrc');
      await writeFile(
        configPath,
        JSON.stringify({
          exclude: ['.git', 'dist', 'coverage'],
        })
      );

      const cliOpts: CliOptions = {
        path: testDir,
      };

      const merged = await loadConfig(cliOpts);
      expect(merged.exclude).toEqual(['.git', 'dist', 'coverage']);
    });

    it('should throw error if config file is invalid', async () => {
      const configPath = join(testDir, '.modkillrc');
      await writeFile(configPath, '{ invalid }');

      const cliOpts: CliOptions = {
        path: testDir,
      };

      await expect(loadConfig(cliOpts)).rejects.toThrow('Failed to load config file');
    });

    it('should find config in parent directory', async () => {
      const nestedDir = join(testDir, 'nested');
      await mkdir(nestedDir, { recursive: true });

      const configPath = join(testDir, '.modkillrc');
      await writeFile(
        configPath,
        JSON.stringify({
          minAge: 45,
          sort: 'name',
        })
      );

      const cliOpts: CliOptions = {
        path: nestedDir,
      };

      const merged = await loadConfig(cliOpts);
      expect(merged.minAge).toBe(45);
      expect(merged.sort).toBe('name');
    });

    it('should handle CLI path option correctly', async () => {
      const configPath = join(testDir, '.modkillrc');
      await writeFile(
        configPath,
        JSON.stringify({
          path: '/default/path',
        })
      );

      const cliOpts: CliOptions = {
        path: testDir, // CLI path used for config search
      };

      const merged = await loadConfig(cliOpts);
      expect(merged.path).toBe(testDir); // CLI takes precedence
    });

    it('should handle boolean flags correctly (false from CLI)', async () => {
      const configPath = join(testDir, '.modkillrc');
      await writeFile(
        configPath,
        JSON.stringify({
          verbose: true,
          json: true,
        })
      );

      const cliOpts: CliOptions = {
        path: testDir,
        verbose: false, // Explicitly false
        json: false, // Explicitly false
      };

      const merged = await loadConfig(cliOpts);
      expect(merged.verbose).toBe(false); // CLI overrides config
      expect(merged.json).toBe(false); // CLI overrides config
    });

    it('should handle all config options', async () => {
      const configPath = join(testDir, '.modkillrc');
      await writeFile(
        configPath,
        JSON.stringify({
          minAge: 30,
          minSize: 50,
          sort: 'size',
          depth: 8,
          yes: true,
          verbose: true,
          json: false,
          exclude: ['.git'],
          path: '/config/path',
          useTrash: false,
        })
      );

      const cliOpts: CliOptions = {
        path: testDir,
      };

      const merged = await loadConfig(cliOpts);
      expect(merged.minAge).toBe(30);
      expect(merged.minSize).toBe(50);
      expect(merged.sort).toBe('size');
      expect(merged.depth).toBe(8);
      expect(merged.yes).toBe(true);
      expect(merged.verbose).toBe(true);
      expect(merged.json).toBe(false);
      expect(merged.exclude).toEqual(['.git']);
      expect(merged.path).toBe(testDir); // CLI overrides
      expect(merged.useTrash).toBe(false);
    });
  });
});
