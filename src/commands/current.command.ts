import chalk from 'chalk';
import path from 'node:path';
import { SafeCleaner } from '../core/cleaner.js';
import type { CliOptions } from '../cli.js';
import { access } from 'node:fs/promises';

export async function runCurrentCommand(opts: CliOptions): Promise<void> {
  const cwd = process.cwd();
  const target = path.join(cwd, 'node_modules');
  try {
    await access(target);
  } catch {
    console.log(chalk.yellow('No node_modules in current directory.'));
    return;
  }

  if (opts.json) {
    console.log(JSON.stringify({ path: target }, null, 2));
    return;
  }

  const cleaner = new SafeCleaner();
  const res = await cleaner.delete([target], { useTrash: true, dryRun: !!opts.dryRun });
  console.log(chalk.green(`Deleted: ${res.deleted.length}, Skipped: ${res.skipped.length}`));
}

