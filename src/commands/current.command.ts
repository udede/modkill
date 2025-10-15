import path from 'node:path';
import { SafeCleaner } from '../core/cleaner';
import type { CliOptions } from '../cli';
import type { Logger } from '../ui/logger';
import { createLogger } from '../ui/logger';
import { access } from 'node:fs/promises';

export async function runCurrentCommand(opts: CliOptions & { logger?: Logger }): Promise<void> {
  const logger = opts.logger ?? createLogger({ level: opts.verbose ? 'debug' : 'info', json: !!opts.json });
  const cwd = process.cwd();
  const target = path.join(cwd, 'node_modules');
  try {
    await access(target);
  } catch {
    logger.warn('No node_modules in current directory.');
    return;
  }

  if (opts.json) {
    logger.raw(JSON.stringify({ path: target }, null, 2));
    return;
  }

  const cleaner = new SafeCleaner();
  const res = await cleaner.delete([target], { useTrash: true, dryRun: !!opts.dryRun });
  logger.success(`Deleted: ${res.deleted.length}, Skipped: ${res.skipped.length}`);
}

