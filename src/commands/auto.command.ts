import { ModuleScanner } from '../core/scanner';
import { Analyzer } from '../core/analyzer';
import { SafeCleaner } from '../core/cleaner';
import type { CliOptions } from '../cli';
import type { Logger } from '../ui/logger';
import { createLogger } from '../ui/logger';
import type { SortBy } from '../core/analyzer';

export async function runAutoCommand(opts: CliOptions & { logger?: Logger }): Promise<void> {
  const logger = opts.logger ?? createLogger({ level: opts.verbose ? 'debug' : 'info', json: !!opts.json });
  const root = opts.path || process.cwd();
  const scanner = new ModuleScanner();
  const scanOpts = { rootPath: root, ...(opts.depth !== undefined ? { depth: opts.depth } : {}) };

  const spin = logger.spinner(`Scanning ${root}...`);
  if (!opts.json) spin.start();
  const modules = await scanner.scan(scanOpts);
  if (!opts.json) spin.text('Analyzing modules...');

  const analyzer = new Analyzer();
  const sortBy: SortBy = (opts.sort ?? 'size');
  const analyzeOpts = {
    ...(opts.minAge !== undefined ? { minAgeDays: opts.minAge } : { minAgeDays: 30 }),
    ...(opts.minSize !== undefined ? { minSizeMB: opts.minSize } : {}),
    sortBy,
  };
  const analyzed = analyzer.analyze(modules, analyzeOpts);
  if (!opts.json) spin.succeed(`Scan complete: ${analyzed.length} candidate(s)`);

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
  logger.success(`Auto-clean complete. Deleted: ${res.deleted.length}, Skipped: ${res.skipped.length}`);
}
