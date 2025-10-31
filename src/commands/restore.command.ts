import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import type { CliOptions } from '../cli';
import type { Logger } from '../ui/logger';
import { createLogger } from '../ui/logger';

const execFileAsync = promisify(execFile);

export interface RestoreOptions extends CliOptions {
  logFile: string;
  logger?: Logger;
}

interface LogEntry {
  type: 'DELETED' | 'SKIPPED';
  path: string;
  reason?: string;
}

async function parseRestoreLog(logPath: string): Promise<LogEntry[]> {
  const content = await readFile(logPath, 'utf8');
  const lines = content.split('\n').filter(Boolean);

  return lines.map((line) => {
    const parts = line.split('\t');
    const type = parts[0] as 'DELETED' | 'SKIPPED';
    const path = parts[1] || '';
    const reason = parts[2] ? parts[2].replace(/^\(|\)$/g, '') : undefined;

    return { type, path, reason };
  });
}

async function restoreFromTrash(path: string): Promise<{ success: boolean; error?: string }> {
  try {
    // Try to restore from trash using OS-specific commands
    const platform = process.platform;

    if (platform === 'darwin') {
      // macOS: use osascript to restore from Trash
      // Note: This is a best-effort approach as programmatic trash restoration is limited
      return { success: false, error: 'macOS trash restoration requires manual action from Trash bin' };
    } else if (platform === 'win32') {
      // Windows: trash restore is complex, would need native module
      return { success: false, error: 'Windows trash restoration requires manual action from Recycle Bin' };
    } else {
      // Linux: check common trash locations
      const trashPaths = [
        `${process.env.HOME}/.local/share/Trash/files`,
        `${process.env.HOME}/.Trash`,
      ];

      // This is a simplified approach - real implementation would need proper trash spec support
      return { success: false, error: 'Linux trash restoration requires manual action or use of trash-cli tools' };
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export async function runRestoreCommand(opts: RestoreOptions): Promise<void> {
  const logger = opts.logger ?? createLogger({ level: opts.verbose ? 'debug' : 'info', json: !!opts.json });

  if (!opts.logFile) {
    logger.error('Error: --log-file is required for restore command');
    process.exitCode = 1;
    return;
  }

  if (!existsSync(opts.logFile)) {
    logger.error(`Error: Log file not found: ${opts.logFile}`);
    process.exitCode = 1;
    return;
  }

  logger.info(`Reading restore log: ${opts.logFile}`);

  try {
    const entries = await parseRestoreLog(opts.logFile);
    const deleted = entries.filter((e) => e.type === 'DELETED');
    const skipped = entries.filter((e) => e.type === 'SKIPPED');

    if (deleted.length === 0) {
      logger.warn('No deleted items found in log file');
      return;
    }

    logger.info(`Found ${deleted.length} deleted item(s) to restore`);
    if (skipped.length > 0) {
      logger.info(`(${skipped.length} item(s) were skipped during deletion and don't need restoration)`);
    }

    logger.blank(1);

    // Show what would be restored
    for (const entry of deleted) {
      logger.info(`  • ${entry.path}`);
    }

    logger.blank(1);
    logger.warn('⚠️  RESTORE LIMITATIONS:');
    logger.warn('Due to OS limitations, programmatic trash restoration is not fully supported.');
    logger.warn('');
    logger.warn('To restore your files:');
    logger.warn('  1. Open your system Trash/Recycle Bin');
    logger.warn('  2. Search for the folder names shown above');
    logger.warn('  3. Right-click and select "Put Back" or "Restore"');
    logger.warn('');
    logger.warn('For automated restoration, you can:');
    logger.warn('  - Use --use-trash=false flag when deleting (uses rm instead of trash)');
    logger.warn('  - Backup important projects before cleaning');
    logger.warn('  - Use --dry-run to preview before deleting');
    logger.blank(1);

    // Try to provide platform-specific guidance
    const platform = process.platform;
    if (platform === 'darwin') {
      logger.info('💡 macOS: Open Finder → Go → Go to Folder → ~/.Trash');
    } else if (platform === 'win32') {
      logger.info('💡 Windows: Open Recycle Bin from Desktop');
    } else {
      logger.info('💡 Linux: Check ~/.local/share/Trash/files or use trash-cli tools');
    }

    if (opts.json) {
      logger.raw(
        JSON.stringify(
          {
            logFile: opts.logFile,
            deleted: deleted.map((e) => e.path),
            skipped: skipped.map((e) => ({ path: e.path, reason: e.reason })),
            restorationSupport: 'manual',
            platform: process.platform,
          },
          null,
          2
        )
      );
    }
  } catch (error) {
    logger.error(`Error reading log file: ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
  }
}
