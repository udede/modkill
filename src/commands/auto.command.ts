import chalk from 'chalk';
import { ModuleScanner } from '../core/scanner';
import { Analyzer } from '../core/analyzer';
import { SafeCleaner } from '../core/cleaner';
import type { CliOptions } from '../cli';
import type { SortBy } from '../core/analyzer';
import { Progress } from '../ui/progress.ui';

export async function runAutoCommand(opts: CliOptions): Promise<void> {
  const root = opts.path || process.cwd();
  const scanner = new ModuleScanner();
  const scanOpts = { rootPath: root, ...(opts.depth !== undefined ? { depth: opts.depth } : {}) };

  const spin = new Progress();
  if (!opts.json) spin.start(`Scanning ${root}...`);
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
    console.log(JSON.stringify(analyzed, null, 2));
    return;
  }

  if (analyzed.length === 0) {
    console.log(chalk.yellow('Nothing to auto-clean.'));
    return;
  }

  const paths = analyzed.map((m) => m.path);
  const cleaner = new SafeCleaner();
  const res = await cleaner.delete(paths, { useTrash: true, dryRun: !!opts.dryRun });
  console.log(chalk.green(`Auto-clean complete. Deleted: ${res.deleted.length}, Skipped: ${res.skipped.length}`));
}
