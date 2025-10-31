import { ModuleScanner } from '../core/scanner';
import { Analyzer } from '../core/analyzer';
import { SafeCleaner } from '../core/cleaner';
import type { CliOptions } from '../cli';
import type { Logger } from '../ui/logger';
import { createLogger } from '../ui/logger';
import type { SortBy } from '../core/analyzer';
import { DEFAULT_MIN_AGE_DAYS } from '../constants/defaults';

export async function runAutoCommand(opts: CliOptions & { logger?: Logger }): Promise<void> {
  const logger = opts.logger ?? createLogger({ level: opts.verbose ? 'debug' : 'info', json: !!opts.json });
  const root = opts.path || process.cwd();
  const scanner = new ModuleScanner();
  const scanOpts = {
    rootPath: root,
    ...(opts.depth !== undefined ? { depth: opts.depth } : {}),
    ...(opts.exclude ? { excludeGlobs: opts.exclude } : {}),
  };

  const spin = logger.spinner(`Scanning ${root}...`);
  if (!opts.json) spin.start();
  const scanResult = await scanner.scan({
    ...scanOpts,
    onProgress: (currentPath: string, foundCount: number) => {
      if (!opts.json) {
        const relative = currentPath.replace(root, '').replace(/^\//, '');
        const parts = relative.split('/').filter(Boolean);
        const display = parts.length > 0 ? parts[parts.length - 1] : '';
        if (display) {
          spin.text(`Scanning ${root}... ${logger.color.ok(`[${foundCount}]`)} ${logger.color.dim(display)}`);
        }
      }
    }
  });
  if (!opts.json) spin.text('Analyzing modules...');

  const analyzer = new Analyzer();
  const sortBy: SortBy = (opts.sort ?? 'size');
  const analyzeOpts = {
    ...(opts.minAge !== undefined ? { minAgeDays: opts.minAge } : { minAgeDays: DEFAULT_MIN_AGE_DAYS }),
    ...(opts.minSize !== undefined ? { minSizeMB: opts.minSize } : {}),
    sortBy,
  };
  const analyzed = analyzer.analyze(scanResult.modules, analyzeOpts);
  
  if (!opts.json) {
    const total = analyzed.length + scanResult.skippedNoPermission.length;
    if (scanResult.skippedNoPermission.length === 0) {
      spin.succeed(`Scan complete: ${analyzed.length} candidate(s)`);
    } else if (analyzed.length === 0) {
      spin.fail(`Found ${total} node_modules but none can be deleted (insufficient permissions)`);
      logger.info('Try closing projects or running with elevated privileges.');
    } else {
      spin.succeed(`Scan complete: ${analyzed.length} candidate(s), ${logger.color.warn(`${scanResult.skippedNoPermission.length} skipped (no permissions)`)}`);
    }
  }

  if (opts.json) {
    logger.raw(JSON.stringify(analyzed, null, 2));
    return;
  }

  if (analyzed.length === 0) {
    logger.warn('Nothing to auto-clean.');
    return;
  }

  const paths = analyzed.map((m) => m.path);
  const cleaner = new SafeCleaner();
  const res = await cleaner.delete(paths, { useTrash: true, dryRun: !!opts.dryRun });
  
  if (res.skipped.length > 0) {
    logger.warn(`Auto-clean complete. Deleted: ${res.deleted.length}, Skipped: ${res.skipped.length} (files in use or permission issues)`);
    if (opts.verbose) {
      res.skipped.forEach(s => logger.debug(`Skipped: ${s.path} (${s.reason})`));
    }
  } else {
    logger.success(`Auto-clean complete. Deleted: ${res.deleted.length}`);
  }
}
