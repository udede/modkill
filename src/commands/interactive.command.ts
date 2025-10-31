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
import { BYTES_PER_GB } from '../constants/units';
import { AGE_WARNING_THRESHOLD_DAYS, AGE_ERROR_THRESHOLD_DAYS, DEFAULT_INTERACTIVE_PAGE_SIZE } from '../constants/defaults';
import { UI_LAYOUT } from '../constants/ui';
import { INTERACTIVE_SCORE_EXPONENTS } from '../constants/scoring';

// padding helpers removed (replaced by logger.tableHeader/tableRow)

// Combined score used as default ordering in interactive mode
function computeScore(sizeBytes: number, ageDays: number): number {
  const sizeGB = Math.max(sizeBytes / BYTES_PER_GB, 0.001);
  const age = Math.max(ageDays, 1);
  return Math.pow(sizeGB, INTERACTIVE_SCORE_EXPONENTS.SIZE) * Math.pow(age, INTERACTIVE_SCORE_EXPONENTS.AGE);
}

export async function runInteractiveCommand(opts: CliOptions & { logger?: Logger }): Promise<void> {
  const logger = opts.logger ?? createLogger({ level: opts.verbose ? 'debug' : 'info', json: !!opts.json });
  const root = opts.path || process.cwd();
  const scanner = new ModuleScanner();
  const scanOpts = {
    rootPath: root,
    ...(opts.depth !== undefined ? { depth: opts.depth } : {}),
    ...(opts.exclude ? { excludeGlobs: opts.exclude } : {}),
  };

  const scanProgress = logger.spinner(`Scanning ${root}...`);
  if (!opts.json) scanProgress.start();
  const scanResult = await scanner.scan({
    ...scanOpts,
    onProgress: (currentPath: string, foundCount: number) => {
      if (!opts.json) {
        const relative = currentPath.replace(root, '').replace(/^\//, '');
        const parts = relative.split('/').filter(Boolean);
        const display = parts.length > 0 ? parts[parts.length - 1] : '';
        if (display) {
          scanProgress.text(`Scanning ${root}... ${logger.color.ok(`[${foundCount}]`)} ${logger.color.dim(display)}`);
        }
      }
    }
  });
  if (!opts.json) scanProgress.text('Analyzing modules...');

  const analyzer = new Analyzer();
  const sortByFlag = opts.sort as SortBy | undefined;
  const analyzeOpts = {
    ...(opts.minAge !== undefined ? { minAgeDays: opts.minAge } : {}),
    ...(opts.minSize !== undefined ? { minSizeMB: opts.minSize } : {}),
    ...(sortByFlag ? { sortBy: sortByFlag } : {}),
  };
  let analyzed = analyzer.analyze(scanResult.modules, analyzeOpts);

  // Default interactive ordering: combined score (size^0.7 * age^0.3)
  if (!sortByFlag) {
    analyzed = analyzed.sort((a, b) => computeScore(b.sizeBytes, b.ageDays) - computeScore(a.sizeBytes, a.ageDays));
  }

  if (!opts.json) {
    const total = analyzed.length + scanResult.skippedNoPermission.length;
    if (scanResult.skippedNoPermission.length === 0) {
      scanProgress.succeed(`Scan complete: ${analyzed.length} candidate(s)`);
    } else if (analyzed.length === 0) {
      scanProgress.fail(`Found ${total} node_modules but none can be deleted (insufficient permissions)`);
      logger.info('Try closing projects or running with elevated privileges.');
    } else {
      scanProgress.succeed(`Scan complete: ${analyzed.length} candidate(s), ${logger.color.warn(`${scanResult.skippedNoPermission.length} skipped (no permissions)`)}`);
    }
  }

  if (opts.json) {
    logger.raw(JSON.stringify(analyzed, null, 2));
    return;
  }

  if (analyzed.length === 0) {
    logger.warn('No node_modules found matching criteria.');
    return;
  }

  // Static compact table layout (stable rendering)
  const columns = process.stdout.columns || UI_LAYOUT.DEFAULT_COLUMNS;
  const indent = UI_LAYOUT.TABLE_INDENT;
  const sizeCol = UI_LAYOUT.SIZE_COLUMN_WIDTH;
  const ageCol = UI_LAYOUT.AGE_COLUMN_WIDTH;
  const gap = UI_LAYOUT.COLUMN_GAP;
  const slack = UI_LAYOUT.SLACK_SPACE;
  const nameCol = Math.max(UI_LAYOUT.MIN_NAME_COLUMN_WIDTH, columns - sizeCol - ageCol - gap * 2 - indent - slack);

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
    const ageStr = m.ageDays >= AGE_WARNING_THRESHOLD_DAYS
      ? (m.ageDays >= AGE_ERROR_THRESHOLD_DAYS ? `${Math.floor(m.ageDays / 30)}mo` : `${Math.floor(m.ageDays)}d`)
      : `${Math.max(0, Math.floor(m.ageDays))}d`;
    const color = m.ageDays > AGE_ERROR_THRESHOLD_DAYS ? logger.color.err : m.ageDays > AGE_WARNING_THRESHOLD_DAYS ? logger.color.warn : logger.color.ok;

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
      checked: m.ageDays > AGE_WARNING_THRESHOLD_DAYS,
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
      pageSize: DEFAULT_INTERACTIVE_PAGE_SIZE,
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
  
  if (res.skipped.length > 0) {
    logger.success(`Deleted: ${res.deleted.length}`);
    logger.warn(`Skipped: ${res.skipped.length} (files in use or permission issues)`);
    if (opts.verbose) {
      res.skipped.forEach(s => logger.debug(`  ${s.path} (${s.reason})`));
    }
  } else {
    logger.success(`Deleted: ${res.deleted.length}`);
  }
  
  logger.success(`Freed: ${prettyBytes(res.freedBytes)}`);
  maybeCelebrate(res.freedBytes, logger);
}
