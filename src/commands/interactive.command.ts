import inquirer from 'inquirer';
import chalk from 'chalk';
import prettyBytes from 'pretty-bytes';
import path from 'node:path';
import { ModuleScanner } from '../core/scanner';
import { Analyzer } from '../core/analyzer';
import { SafeCleaner } from '../core/cleaner';

import type { CliOptions } from '../cli';
import { Progress } from '../ui/progress.ui';
import { maybeCelebrate } from '../ui/celebration';
import type { SortBy } from '../core/analyzer';

function padEnd(str: string, width: number): string {
  return str.length >= width ? str.slice(0, width - 1) + '…' : str + ' '.repeat(width - str.length);
}
function padStart(str: string, width: number): string {
  return str.length >= width ? str.slice(0, width - 1) + '…' : ' '.repeat(width - str.length) + str;
}

export async function runInteractiveCommand(opts: CliOptions): Promise<void> {
  const root = opts.path || process.cwd();
  const scanner = new ModuleScanner();
  const scanOpts = { rootPath: root, ...(opts.depth !== undefined ? { depth: opts.depth } : {}) };

  const scanProgress = new Progress();
  if (!opts.json) scanProgress.start(`Scanning ${root}...`);
  const modules = await scanner.scan(scanOpts);
  if (!opts.json) scanProgress.text('Analyzing modules...');

  const analyzer = new Analyzer();
  const sortBy: SortBy = (opts.sort ?? 'size');
  const analyzeOpts = {
    ...(opts.minAge !== undefined ? { minAgeDays: opts.minAge } : {}),
    ...(opts.minSize !== undefined ? { minSizeMB: opts.minSize } : {}),
    sortBy,
  };
  let analyzed = analyzer.analyze(modules, analyzeOpts);

  // Default: order by size desc then age desc
  analyzed = analyzed.sort((a, b) => (b.sizeBytes - a.sizeBytes) || (b.ageDays - a.ageDays));

  if (!opts.json) scanProgress.succeed(`Scan complete: ${analyzed.length} candidate(s)`);

  if (opts.json) {
    console.log(JSON.stringify(analyzed, null, 2));
    return;
  }

  if (analyzed.length === 0) {
    console.log(chalk.yellow('No node_modules found matching criteria.'));
    return;
  }

  // Table layout
  const columns = process.stdout.columns || 120;
  const sizeCol = 12;
  const ageCol = 8;
  const gap = 2;
  const nameCol = Math.max(20, columns - sizeCol - ageCol - gap * 2);

  const header = padEnd('Project (relative path below)', nameCol) + ' '.repeat(gap) + padStart('Size', sizeCol) + ' '.repeat(gap) + padStart('Age', ageCol);

  const choices = analyzed.map((m) => {
    const projectDir = path.basename(path.dirname(m.path));
    const rel = path.relative(root, path.dirname(m.path)) || '.';
    const size = prettyBytes(m.sizeBytes);
    const ageStr = m.ageDays >= 30 ? (m.ageDays >= 60 ? `${Math.floor(m.ageDays / 30)}mo` : `${Math.floor(m.ageDays)}d`) : `${Math.max(0, Math.floor(m.ageDays))}d`;
    const color = m.ageDays > 60 ? chalk.red : m.ageDays > 30 ? chalk.yellow : chalk.green;

    const row = padEnd(color(projectDir), nameCol) + ' '.repeat(gap) + padStart(chalk.gray(size), sizeCol) + ' '.repeat(gap) + padStart(chalk.gray(ageStr), ageCol);
    const subtitle = chalk.gray('  ' + rel);

    return {
      name: `${row}\n${subtitle}`,
      value: m.path,
      short: projectDir,
      checked: m.ageDays > 30,
    };
  });

  const { selected } = await inquirer.prompt([
    {
      type: 'checkbox',
      name: 'selected',
      message: `Scanning root: ${root}\n${chalk.bold(header)}`,
      pageSize: 20,
      choices,
      loop: false,
      instructions: false,
    },
  ]);

  if (!selected || selected.length === 0) {
    console.log(chalk.gray('Nothing selected.'));
    return;
  }

  const map = new Map(analyzed.map((m) => [m.path, m.sizeBytes] as const));
  const previewTotal = selected.reduce((acc: number, p: string) => acc + (map.get(p) || 0), 0);
  console.log(chalk.blue(`Total to free: ${prettyBytes(previewTotal)}`));

  if (!opts.yes) {
    const { confirm } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirm',
        message: `Proceed to delete ${selected.length} folders?`,
        default: false,
      },
    ]);
    if (!confirm) {
      console.log(chalk.gray('Cancelled.'));
      return;
    }
  }

  const cleaner = new SafeCleaner();
  const progress = new Progress();
  progress.start('Deleting selected node_modules...');
  const res = await cleaner.delete(selected, { useTrash: true, dryRun: !!opts.dryRun });
  progress.succeed('Deletion complete');
  console.log(chalk.green(`Deleted: ${res.deleted.length}, Skipped: ${res.skipped.length}`));
  console.log(chalk.green(`Freed: ${prettyBytes(res.freedBytes)}`));
  maybeCelebrate(res.freedBytes);
}
