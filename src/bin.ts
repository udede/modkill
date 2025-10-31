#!/usr/bin/env node
import { runCli } from './cli';
import { createLogger } from './ui/logger';

runCli().catch((err) => {
  const logger = createLogger({ level: 'error' });
  logger.error(String(err?.message || err));
  process.exitCode = 1;
});
