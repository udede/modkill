import chalk from 'chalk';
import prettyBytes from 'pretty-bytes';
import { ModuleScanner } from '../core/scanner';
import { Analyzer } from '../core/analyzer';
import type { CliOptions } from '../cli';
import type { SortBy } from '../core/analyzer';
import { Progress } from '../ui/progress.ui';

export async function runDryRunCommand(opts: CliOptions): Promise<void> {
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
    ...(opts.minAge !== undefined ? { minAgeDays: opts.minAge } : {}),
    ...(opts.minSize !== undefined ? { minSizeMB: opts.minSize } : {}),
    sortBy,
  };
  const analyzed = analyzer.analyze(modules, analyzeOpts);
  if (!opts.json) spin.succeed(`Scan complete: ${analyzed.length} candidate(s)`);

  if (opts.json) {
    console.log(JSON.stringify(analyzed, null, 2));
    return;
  }

  let total = 0;
  for (const m of analyzed) {
    total += m.sizeBytes;
    console.log(`${m.path}  ${chalk.gray(prettyBytes(m.sizeBytes))}  ${chalk.gray(Math.floor(m.ageDays) + 'd')}`);
  }
  console.log(chalk.blue(`Total potential to free: ${prettyBytes(total)}`));
}
