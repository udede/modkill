import prettyBytes from 'pretty-bytes';
import { ModuleScanner } from '../core/scanner';
import { Analyzer } from '../core/analyzer';
import type { CliOptions } from '../cli';
import type { SortBy } from '../core/analyzer';
import type { Logger } from '../ui/logger';
import { createLogger } from '../ui/logger';

export async function runDryRunCommand(opts: CliOptions & { logger?: Logger }): Promise<void> {
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
    ...(opts.minAge !== undefined ? { minAgeDays: opts.minAge } : {}),
    ...(opts.minSize !== undefined ? { minSizeMB: opts.minSize } : {}),
    sortBy,
  };
  const analyzed = analyzer.analyze(modules, analyzeOpts);
  if (!opts.json) spin.succeed(`Scan complete: ${analyzed.length} candidate(s)`);

  if (opts.json) {
    logger.raw(JSON.stringify(analyzed, null, 2));
    return;
  }

  let total = 0;
  for (const m of analyzed) {
    total += m.sizeBytes;
    logger.info(`${m.path}  ${logger.color.dim(prettyBytes(m.sizeBytes))}  ${logger.color.dim(Math.floor(m.ageDays) + 'd')}`);
  }
  logger.info(logger.color.info(`Total potential to free: ${prettyBytes(total)}`));
}
