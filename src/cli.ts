import { Command } from 'commander';
import { createLogger } from './ui/logger';
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

  const logger = createLogger({ level: opts.verbose ? 'debug' : 'info', json: !!opts.json });
  if (!opts.json) {
    logger.raw(logo());
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

 
runCli().catch((err) => {
  const logger = createLogger({ level: 'error' });
  logger.error(String(err?.message || err));
  process.exitCode = 1;
});
