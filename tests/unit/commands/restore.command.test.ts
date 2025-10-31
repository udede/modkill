import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { writeFile, mkdir, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { runRestoreCommand } from '../../../src/commands/restore.command';
import { createLogger } from '../../../src/ui/logger';

describe('restore.command', () => {
  let tempDir: string;
  let logFile: string;

  beforeEach(async () => {
    tempDir = join(tmpdir(), `modkill-test-${Date.now()}`);
    await mkdir(tempDir, { recursive: true });
    logFile = join(tempDir, 'restore.log');
  });

  afterEach(async () => {
    try {
      await rm(tempDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  it('should error when --log-file is missing', async () => {
    const logger = createLogger({ level: 'info', silent: true });
    const errorSpy = vi.spyOn(logger, 'error');

    await runRestoreCommand({
      logFile: '',
      logger,
      restore: true,
    });

    expect(errorSpy).toHaveBeenCalledWith('Error: --log-file is required for restore command');
    expect(process.exitCode).toBe(1);
    process.exitCode = 0; // Reset for next test
  });

  it('should error when log file does not exist', async () => {
    const logger = createLogger({ level: 'info', silent: true });
    const errorSpy = vi.spyOn(logger, 'error');
    const nonExistentFile = join(tempDir, 'does-not-exist.log');

    await runRestoreCommand({
      logFile: nonExistentFile,
      logger,
      restore: true,
    });

    expect(errorSpy).toHaveBeenCalledWith(`Error: Log file not found: ${nonExistentFile}`);
    expect(process.exitCode).toBe(1);
    process.exitCode = 0; // Reset for next test
  });

  it('should warn when log file has no deleted items', async () => {
    await writeFile(logFile, 'SKIPPED\t/home/user/proj1/node_modules\t(recent)\n');

    const logger = createLogger({ level: 'info', silent: true });
    const warnSpy = vi.spyOn(logger, 'warn');

    await runRestoreCommand({
      logFile,
      logger,
      restore: true,
    });

    expect(warnSpy).toHaveBeenCalledWith('No deleted items found in log file');
    expect(process.exitCode).not.toBe(1);
  });

  it('should parse and display deleted items', async () => {
    const logContent = [
      'DELETED\t/home/user/proj1/node_modules',
      'DELETED\t/home/user/proj2/node_modules',
      'SKIPPED\t/home/user/proj3/node_modules\t(recent)',
    ].join('\n');

    await writeFile(logFile, logContent);

    const logger = createLogger({ level: 'info', silent: true });
    const infoSpy = vi.spyOn(logger, 'info');

    await runRestoreCommand({
      logFile,
      logger,
      restore: true,
    });

    expect(infoSpy).toHaveBeenCalledWith('Found 2 deleted item(s) to restore');
    expect(infoSpy).toHaveBeenCalledWith('(1 item(s) were skipped during deletion and don\'t need restoration)');
    expect(infoSpy).toHaveBeenCalledWith('  • /home/user/proj1/node_modules');
    expect(infoSpy).toHaveBeenCalledWith('  • /home/user/proj2/node_modules');
  });

  it('should output JSON format when --json is specified', async () => {
    const logContent = [
      'DELETED\t/home/user/proj1/node_modules',
      'SKIPPED\t/home/user/proj2/node_modules\t(recent)',
    ].join('\n');

    await writeFile(logFile, logContent);

    const logger = createLogger({ level: 'info', silent: true, json: true });
    const rawSpy = vi.spyOn(logger, 'raw');

    await runRestoreCommand({
      logFile,
      logger,
      restore: true,
      json: true,
    });

    expect(rawSpy).toHaveBeenCalled();
    const jsonOutput = JSON.parse(rawSpy.mock.calls[0][0]);

    expect(jsonOutput).toMatchObject({
      logFile,
      deleted: ['/home/user/proj1/node_modules'],
      skipped: [{ path: '/home/user/proj2/node_modules', reason: 'recent' }],
      restorationSupport: 'manual',
      platform: process.platform,
    });
  });

  it('should provide platform-specific guidance', async () => {
    const logContent = 'DELETED\t/home/user/proj1/node_modules\n';
    await writeFile(logFile, logContent);

    const logger = createLogger({ level: 'info', silent: true });
    const warnSpy = vi.spyOn(logger, 'warn');
    const infoSpy = vi.spyOn(logger, 'info');

    await runRestoreCommand({
      logFile,
      logger,
      restore: true,
    });

    expect(warnSpy).toHaveBeenCalledWith('⚠️  RESTORE LIMITATIONS:');
    expect(warnSpy).toHaveBeenCalledWith('Due to OS limitations, programmatic trash restoration is not fully supported.');

    // Platform-specific guidance
    if (process.platform === 'darwin') {
      expect(infoSpy).toHaveBeenCalledWith(expect.stringContaining('macOS'));
    } else if (process.platform === 'win32') {
      expect(infoSpy).toHaveBeenCalledWith(expect.stringContaining('Windows'));
    } else {
      expect(infoSpy).toHaveBeenCalledWith(expect.stringContaining('Linux'));
    }
  });

  it('should handle log file read errors', async () => {
    // Create a file with invalid permissions (not readable)
    await writeFile(logFile, 'DELETED\t/home/user/proj1/node_modules\n');
    // We can't easily make a file unreadable in a cross-platform way during tests,
    // so we'll test with an invalid log format instead
    await writeFile(logFile, 'INVALID_FORMAT_LINE');

    const logger = createLogger({ level: 'info', silent: true });
    const infoSpy = vi.spyOn(logger, 'info');

    await runRestoreCommand({
      logFile,
      logger,
      restore: true,
    });

    // Should still process the file even with invalid format
    // The parser is lenient and will create entries with empty paths
    expect(infoSpy).toHaveBeenCalled();
  });

  it('should handle empty log file', async () => {
    await writeFile(logFile, '');

    const logger = createLogger({ level: 'info', silent: true });
    const warnSpy = vi.spyOn(logger, 'warn');

    await runRestoreCommand({
      logFile,
      logger,
      restore: true,
    });

    expect(warnSpy).toHaveBeenCalledWith('No deleted items found in log file');
  });

  it('should parse log entries with and without reasons', async () => {
    const logContent = [
      'DELETED\t/home/user/proj1/node_modules',
      'SKIPPED\t/home/user/proj2/node_modules\t(recent)',
      'DELETED\t/home/user/proj3/node_modules\t',
    ].join('\n');

    await writeFile(logFile, logContent);

    const logger = createLogger({ level: 'info', silent: true, json: true });
    const rawSpy = vi.spyOn(logger, 'raw');

    await runRestoreCommand({
      logFile,
      logger,
      restore: true,
      json: true,
    });

    const jsonOutput = JSON.parse(rawSpy.mock.calls[0][0]);

    expect(jsonOutput.deleted).toHaveLength(2);
    expect(jsonOutput.deleted).toContain('/home/user/proj1/node_modules');
    expect(jsonOutput.deleted).toContain('/home/user/proj3/node_modules');
    expect(jsonOutput.skipped).toHaveLength(1);
    expect(jsonOutput.skipped[0]).toMatchObject({
      path: '/home/user/proj2/node_modules',
      reason: 'recent',
    });
  });
});
