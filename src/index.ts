export { runCli } from './cli';
export { ModuleScanner } from './core/scanner';
export { Analyzer } from './core/analyzer';
export { SafeCleaner } from './core/cleaner';

export type { ModuleInfo, ScanOptions } from './core/scanner';
export type { AnalyzeOptions, SortBy } from './core/analyzer';
export type { DeleteOptions, DeleteResult } from './core/cleaner';

// Version info
export const VERSION = '0.1.0';
