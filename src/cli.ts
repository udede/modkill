import { Command } from 'commander';
import { createLogger } from './ui/logger';
import { runInteractiveCommand } from './commands/interactive.command';
import { runAutoCommand } from './commands/auto.command';
import { runDryRunCommand } from './commands/dryrun.command';
import { runCurrentCommand } from './commands/current.command';
import { runRestoreCommand } from './commands/restore.command';
import { VERSION } from './version';
import { DEFAULT_MAX_SCAN_DEPTH, DEFAULT_MIN_AGE_DAYS } from './constants/defaults';
import { loadConfig } from './utils/config';

export interface CliOptions {
  auto?: boolean;
  dryRun?: boolean;
  current?: boolean;
  restore?: boolean;
  logFile?: string;
  minAge?: number;
  minSize?: number;
  sort?: 'size' | 'age' | 'name' | 'path';
  json?: boolean;
  yes?: boolean;
  depth?: number;
  verbose?: boolean;
  path?: string;
  exclude?: string[];
}

function logo(): string {
  const text = `
 /$$      /$$  /$$$$$$  /$$$$$$$  /$$   /$$ /$$$$$$ /$$       /$$      
| $$$    /$$$ /$$__  $$| $$__  $$| $$  /$$/|_  $$_/| $$      | $$      
| $$$$  /$$$$| $$  \\ $$| $$  \\ $$| $$ /$$/   | $$  | $$      | $$      
| $$ $$/$$ $$| $$  | $$| $$  | $$| $$$$$/    | $$  | $$      | $$      
| $$  $$$| $$| $$  | $$| $$  | $$| $$  $$    | $$  | $$      | $$      
| $$\\  $ | $$| $$  | $$| $$  | $$| $$\\  $$   | $$  | $$      | $$      
| $$ \\/  | $$|  $$$$$$/| $$$$$$$/| $$ \\  $$ /$$$$$$| $$$$$$$$| $$$$$$$$
|__/     |__/ \\______/ |_______/ |__/  \\__/|______/|________/|________/
`;
  const logger = createLogger({ level: 'info', silent: true });
  return logger.color.info(text);
}

export async function runCli(argv: string[] = process.argv): Promise<void> {
  const program = new Command();

  program
    .name('modkill')
    .description('Find and remove node_modules to free disk space safely')
    .version(VERSION)
    .option('--auto', `Auto-clean old modules (default: >${DEFAULT_MIN_AGE_DAYS} days, configurable with --min-age)`)
    .option('--dry-run', 'Preview without deleting')
    .option('--current', 'Clean current directory only')
    .option('--restore', 'Restore deleted node_modules from log file')
    .option('--log-file <path>', 'Path to restore log file (required with --restore)')
    .option('--min-age <days>', 'Minimum age in days', (v) => Number(v))
    .option('--min-size <mb>', 'Minimum size in MB', (v) => Number(v))
    .option('--sort <field>', 'Sort by size|age|name|path', 'size')
    .option('--json', 'Output JSON for scripting')
    .option('--yes', 'Assume yes for prompts')
    .option('--depth <n>', 'Maximum scan depth', (v) => Number(v), DEFAULT_MAX_SCAN_DEPTH)
    .option('--path <dir>', 'Root path to scan (defaults to CWD)')
    .option('--exclude <patterns...>', 'Exclude patterns (can be specified multiple times)')
    .option('--verbose', 'Verbose logging');

  await program.parseAsync(argv);
  const cliOpts = program.opts<CliOptions>();

  // Load and merge config file with CLI options (CLI takes precedence)
  const opts = await loadConfig(cliOpts);

  const logger = createLogger({ level: opts.verbose ? 'debug' : 'info', json: !!opts.json });
  if (!opts.json) {
    logger.raw(logo());
  }

  if (opts.restore) {
    await runRestoreCommand({ ...opts, logFile: opts.logFile || '', logger });
    return;
  }

  if (opts.current) {
    await runCurrentCommand({ ...opts, logger });
    return;
  }

  if (opts.auto || opts.minAge !== undefined || opts.minSize !== undefined) {
    await runAutoCommand({ ...opts, logger });
    return;
  }

  if (opts.dryRun) {
    await runDryRunCommand({ ...opts, logger });
    return;
  }

  await runInteractiveCommand({ ...opts, logger });
}
