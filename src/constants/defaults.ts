/**
 * Default values and thresholds
 */

export const DEFAULT_MIN_AGE_DAYS = 30;
export const AGE_WARNING_THRESHOLD_DAYS = 30;
export const AGE_ERROR_THRESHOLD_DAYS = 60;
export const DEFAULT_MAX_SCAN_DEPTH = 6;
export const DEFAULT_INTERACTIVE_PAGE_SIZE = 18;

/**
 * Directories to exclude from scanning
 */
export const DEFAULT_EXCLUDES = [
  '.git',
  '.svn',
  '.hg',
  'Library',
  'Windows',
  'System32',
  'AppData',
];
