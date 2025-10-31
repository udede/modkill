import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import type { CliOptions } from '../cli';

export interface ModkillConfig {
  /**
   * Minimum age in days for auto-clean mode
   */
  minAge?: number;

  /**
   * Minimum size in MB
   */
  minSize?: number;

  /**
   * Sort field for displaying results
   */
  sort?: 'size' | 'age' | 'name' | 'path';

  /**
   * Maximum scan depth
   */
  depth?: number;

  /**
   * Automatically assume yes for prompts
   */
  yes?: boolean;

  /**
   * Verbose logging
   */
  verbose?: boolean;

  /**
   * Output JSON format
   */
  json?: boolean;

  /**
   * Custom exclude patterns (globs)
   */
  exclude?: string[];

  /**
   * Root path to scan (defaults to CWD)
   */
  path?: string;

  /**
   * Use trash for deletion (default: true)
   */
  useTrash?: boolean;
}

const CONFIG_FILE_NAMES = ['.modkillrc', '.modkillrc.json'];

/**
 * Search for config file in current directory and parent directories
 * @param startDir Starting directory (defaults to process.cwd())
 * @returns Path to config file or null if not found
 */
export function findConfigFile(startDir: string = process.cwd()): string | null {
  let currentDir = startDir;
  let previousDir = '';

  // Keep going up until we reach the filesystem root
  while (currentDir !== previousDir) {
    for (const fileName of CONFIG_FILE_NAMES) {
      const configPath = join(currentDir, fileName);
      if (existsSync(configPath)) {
        return configPath;
      }
    }

    previousDir = currentDir;
    currentDir = dirname(currentDir);
  }

  return null;
}

/**
 * Parse and validate config file
 * @param configPath Path to config file
 * @returns Parsed config object
 */
export async function parseConfigFile(configPath: string): Promise<ModkillConfig> {
  try {
    const content = await readFile(configPath, 'utf8');
    const config = JSON.parse(content);

    // Validate config
    validateConfig(config);

    return config;
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error(`Invalid JSON in config file ${configPath}: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Validate config object
 * @param config Config object to validate
 * @throws Error if config is invalid
 */
function validateConfig(config: unknown): asserts config is ModkillConfig {
  if (typeof config !== 'object' || config === null || Array.isArray(config)) {
    throw new Error('Config must be an object');
  }

  const cfg = config as Record<string, unknown>;

  // Validate minAge
  if (cfg.minAge !== undefined) {
    if (typeof cfg.minAge !== 'number' || cfg.minAge < 0) {
      throw new Error('minAge must be a non-negative number');
    }
  }

  // Validate minSize
  if (cfg.minSize !== undefined) {
    if (typeof cfg.minSize !== 'number' || cfg.minSize < 0) {
      throw new Error('minSize must be a non-negative number');
    }
  }

  // Validate sort
  if (cfg.sort !== undefined) {
    const validSorts = ['size', 'age', 'name', 'path'];
    if (!validSorts.includes(cfg.sort as string)) {
      throw new Error(`sort must be one of: ${validSorts.join(', ')}`);
    }
  }

  // Validate depth
  if (cfg.depth !== undefined) {
    if (typeof cfg.depth !== 'number' || cfg.depth < 1) {
      throw new Error('depth must be a positive number');
    }
  }

  // Validate boolean fields
  for (const field of ['yes', 'verbose', 'json', 'useTrash']) {
    if (cfg[field] !== undefined && typeof cfg[field] !== 'boolean') {
      throw new Error(`${field} must be a boolean`);
    }
  }

  // Validate exclude
  if (cfg.exclude !== undefined) {
    if (!Array.isArray(cfg.exclude)) {
      throw new Error('exclude must be an array');
    }
    for (const pattern of cfg.exclude) {
      if (typeof pattern !== 'string') {
        throw new Error('exclude patterns must be strings');
      }
    }
  }

  // Validate path
  if (cfg.path !== undefined && typeof cfg.path !== 'string') {
    throw new Error('path must be a string');
  }
}

/**
 * Load config file and merge with CLI options
 * CLI options take precedence over config file
 * @param cliOpts CLI options from commander
 * @returns Merged options
 */
export async function loadConfig(cliOpts: CliOptions): Promise<CliOptions & ModkillConfig> {
  // Find config file
  const configPath = findConfigFile(cliOpts.path);

  if (!configPath) {
    // No config file found, return CLI options as-is
    return cliOpts;
  }

  try {
    const fileConfig = await parseConfigFile(configPath);

    // Merge config with CLI options (CLI takes precedence)
    // Only use config values if CLI option is undefined
    // For exclude patterns, merge both CLI and config patterns
    const excludePatterns = [
      ...(fileConfig.exclude || []),
      ...(cliOpts.exclude || []),
    ];

    const merged: CliOptions & ModkillConfig = {
      ...fileConfig,
      ...cliOpts,
      // Handle undefined CLI options explicitly
      minAge: cliOpts.minAge !== undefined ? cliOpts.minAge : fileConfig.minAge,
      minSize: cliOpts.minSize !== undefined ? cliOpts.minSize : fileConfig.minSize,
      sort: cliOpts.sort || fileConfig.sort,
      depth: cliOpts.depth !== undefined ? cliOpts.depth : fileConfig.depth,
      yes: cliOpts.yes !== undefined ? cliOpts.yes : fileConfig.yes,
      verbose: cliOpts.verbose !== undefined ? cliOpts.verbose : fileConfig.verbose,
      json: cliOpts.json !== undefined ? cliOpts.json : fileConfig.json,
      path: cliOpts.path || fileConfig.path,
      exclude: excludePatterns.length > 0 ? excludePatterns : undefined,
      useTrash: fileConfig.useTrash,
    };

    return merged;
  } catch (error) {
    if (process.env.DEBUG) {
      // eslint-disable-next-line no-console
      console.error(`[config] Error loading config file ${configPath}:`, error);
    }
    // If config file exists but can't be parsed, throw error
    throw new Error(`Failed to load config file ${configPath}: ${error instanceof Error ? error.message : String(error)}`);
  }
}
