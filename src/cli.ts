import { Command } from 'commander';
import chalk from 'chalk';
import { runInteractiveCommand } from './commands/interactive.command';
import { runAutoCommand } from './commands/auto.command';
import { runDryRunCommand } from './commands/dryrun.command';
import { runCurrentCommand } from './commands/current.command';

export interface CliOptions {
  auto?: boolean;
  dryRun?: boolean;
  current?: boolean;
  minAge?: number;
  minSize?: number;
  sort?: 'size' | 'age' | 'name' | 'path';
  json?: boolean;
  yes?: boolean;
  depth?: number;
  verbose?: boolean;
  path?: string;
}

function logo(): string {
  const text = `
 __  __           _ _ _ _ _ _ _ _ 
|  \/  | ___   __| (_) | | ___ _ __ 
| |\/| |/ _ \ / _` + "`" + ` | | | |/ _ \ '__|
| |  | | (_) | (_| | | | |  __/ |   
|_|  |_|\___/ \__,_|_|_|_|\___|_|   
`;
  return chalk.cyan(text);
}

export async function runCli(argv: string[] = process.argv): Promise<void> {
  const program = new Command();

  program
    .name('modkill')
    .description('Find and remove node_modules to free disk space safely')
    .version('0.1.0')
    .option('--auto', 'Auto-clean old modules (>30 days)')
    .option('--dry-run', 'Preview without deleting')
    .option('--current', 'Clean current directory only')
    .option('--min-age <days>', 'Minimum age in days', (v) => Number(v))
    .option('--min-size <mb>', 'Minimum size in MB', (v) => Number(v))
    .option('--sort <field>', 'Sort by size|age|name|path', 'size')
    .option('--json', 'Output JSON for scripting')
    .option('--yes', 'Assume yes for prompts')
    .option('--depth <n>', 'Maximum scan depth', (v) => Number(v), 6)
    .option('--path <dir>', 'Root path to scan (defaults to CWD)')
    .option('--verbose', 'Verbose logging');

  await program.parseAsync(argv);
  const opts = program.opts<CliOptions>();

  if (!opts.json) {
    console.log(logo());
  }

  if (opts.current) {
    await runCurrentCommand(opts);
    return;
  }

  if (opts.auto || opts.minAge !== undefined || opts.minSize !== undefined) {
    await runAutoCommand(opts);
    return;
  }

  if (opts.dryRun) {
    await runDryRunCommand(opts);
    return;
  }

  await runInteractiveCommand(opts);
}

// eslint-disable-next-line @typescript-eslint/no-floating-promises
runCli().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(chalk.red(String(err?.message || err)));
  process.exitCode = 1;
});
