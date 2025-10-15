import inquirer from 'inquirer';
import prettyBytes from 'pretty-bytes';
// Suppress inline hints for the checkbox prompt by wrapping its render method
import CheckboxPrompt from 'inquirer/lib/prompts/checkbox.js';
// Narrow the prototype type to avoid using `any`
type CheckboxLike = { render: (error?: unknown) => unknown; dontShowHints?: boolean };
const checkboxProto = (CheckboxPrompt as unknown as { prototype: CheckboxLike }).prototype;
const originalRender = checkboxProto.render;
checkboxProto.render = function (this: CheckboxLike, error?: unknown) {
  this.dontShowHints = true;
  return originalRender.call(this, error);
};
import path from 'node:path';
import { ModuleScanner } from '../core/scanner';
import { Analyzer } from '../core/analyzer';
import { SafeCleaner } from '../core/cleaner';

import type { CliOptions } from '../cli';
import { maybeCelebrate } from '../ui/celebration';
import type { SortBy } from '../core/analyzer';
import type { Logger } from '../ui/logger';
import { createLogger } from '../ui/logger';

// padding helpers removed (replaced by logger.tableHeader/tableRow)

// Combined score used as default ordering in interactive mode
function computeScore(sizeBytes: number, ageDays: number): number {
  const sizeGB = Math.max(sizeBytes / (1024 * 1024 * 1024), 0.001);
  const age = Math.max(ageDays, 1);
  // Heavier weight on size, some influence from age
  return Math.pow(sizeGB, 0.7) * Math.pow(age, 0.3);
}

export async function runInteractiveCommand(opts: CliOptions & { logger?: Logger }): Promise<void> {
  const logger = opts.logger ?? createLogger({ level: opts.verbose ? 'debug' : 'info', json: !!opts.json });
  const root = opts.path || process.cwd();
  const scanner = new ModuleScanner();
  const scanOpts = { rootPath: root, ...(opts.depth !== undefined ? { depth: opts.depth } : {}) };

  const scanProgress = logger.spinner(`Scanning ${root}...`);
  if (!opts.json) scanProgress.start();
  const modules = await scanner.scan(scanOpts);
  if (!opts.json) scanProgress.text('Analyzing modules...');

  const analyzer = new Analyzer();
  const sortByFlag = opts.sort as SortBy | undefined;
  const analyzeOpts = {
    ...(opts.minAge !== undefined ? { minAgeDays: opts.minAge } : {}),
    ...(opts.minSize !== undefined ? { minSizeMB: opts.minSize } : {}),
    ...(sortByFlag ? { sortBy: sortByFlag } : {}),
  };
  let analyzed = analyzer.analyze(modules, analyzeOpts);

  // Default interactive ordering: combined score (size^0.7 * age^0.3)
  if (!sortByFlag) {
    analyzed = analyzed.sort((a, b) => computeScore(b.sizeBytes, b.ageDays) - computeScore(a.sizeBytes, a.ageDays));
  }

  if (!opts.json) scanProgress.succeed(`Scan complete: ${analyzed.length} candidate(s)`);
  // Show root just below the scan summary (compact and grey)
  if (!opts.json) logger.info(logger.color.dim(`📁 Scanning root: ${root}`));

  if (opts.json) {
    logger.raw(JSON.stringify(analyzed, null, 2));
    return;
  }

  if (analyzed.length === 0) {
    logger.warn('No node_modules found matching criteria.');
    return;
  }

  // Static compact table layout (stable rendering)
  const columns = process.stdout.columns || 120;
  const indent = 2;
  const sizeCol = 12;
  const ageCol = 6; // e.g., 16mo, 4d
  const gap = 3;
  const slack = 8; // headroom to prevent wrapping
  const nameCol = Math.max(20, columns - sizeCol - ageCol - gap * 2 - indent - slack);

  // Header string aligned with our own padding to match choice rows
  const header = logger.tableHeader([
    { label: 'Project (relative path below)', width: nameCol, align: 'left' },
    { label: 'Size', width: sizeCol, align: 'right' },
    { label: 'Age', width: ageCol, align: 'right' },
  ]);

  const baseChoices = analyzed.map((m) => {
    const projectDir = path.basename(path.dirname(m.path));
    const rel = path.relative(root, path.dirname(m.path)) || '.';
    const size = prettyBytes(m.sizeBytes);
    const ageStr = m.ageDays >= 30
      ? (m.ageDays >= 60 ? `${Math.floor(m.ageDays / 30)}mo` : `${Math.floor(m.ageDays)}d`)
      : `${Math.max(0, Math.floor(m.ageDays))}d`;
    const color = m.ageDays > 60 ? logger.color.err : m.ageDays > 30 ? logger.color.warn : logger.color.ok;

    const row = logger.tableRow([
      { text: color(projectDir), width: nameCol, align: 'left' },
      { text: logger.color.dim(size), width: sizeCol, align: 'right' },
      { text: logger.color.dim(ageStr), width: ageCol, align: 'right' },
    ]).trimEnd();
    const subtitle = logger.color.dim(' '.repeat(indent + 2) + rel);

    return {
      name: `${row}\n${subtitle}`,
      value: m.path,
      short: projectDir,
      checked: m.ageDays > 30,
    };
  });

  // Interleave a very thin gray separator between rows for subtle spacing
  const thinSep = new inquirer.Separator(logger.color.dim(' '.repeat(indent) + '·'));
  type BaseChoice = (typeof baseChoices)[number];
  type Sep = InstanceType<typeof inquirer.Separator>;
  const choices: Array<BaseChoice | Sep> = [];
  for (let i = 0; i < baseChoices.length; i++) {
    const c = baseChoices[i]!; // non-null: bounded loop
    choices.push(c);
    if (i < baseChoices.length - 1) choices.push(thinSep);
  }
  // Add a couple of blank separators at the end to push paginator help down
  choices.push(new inquirer.Separator(' '));
  choices.push(new inquirer.Separator(' '));

  // Clear line and add spacing
  logger.blank(1);
  logger.raw(header);
  logger.hr(Math.min(columns - 2, 118));
  // Navigation help placed below the header
  logger.raw(logger.color.dim('(Use ↑/↓ to move, <space> to select, <a> to toggle all, <i> to invert, <enter> to proceed)'));

  // No bottom bar, we already showed hints above the table

  const { selected } = await inquirer.prompt([
    {
      type: 'checkbox',
      name: 'selected',
      message: '\u200B',
      pageSize: 18,
      choices,
      loop: false,
      instructions: false,
      prefix: ' ',
      suffix: ' ',
    },
  ]);

  // nothing

  if (!selected || selected.length === 0) {
    logger.info(logger.color.dim('Nothing selected.'));
    return;
  }

  const map = new Map(analyzed.map((m) => [m.path, m.sizeBytes] as const));
  const previewTotal = selected.reduce((acc: number, p: string) => acc + (map.get(p) || 0), 0);
  logger.info(logger.color.info(`Total to free: ${prettyBytes(previewTotal)}`));

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
      logger.info(logger.color.dim('Cancelled.'));
      return;
    }
  }

  const cleaner = new SafeCleaner();
  const progress = logger.spinner('Deleting selected node_modules...');
  progress.start();
  const res = await cleaner.delete(selected, { useTrash: true, dryRun: !!opts.dryRun });
  progress.succeed('Deletion complete');
  logger.success(`Deleted: ${res.deleted.length}, Skipped: ${res.skipped.length}`);
  logger.success(`Freed: ${prettyBytes(res.freedBytes)}`);
  maybeCelebrate(res.freedBytes, logger);
}
