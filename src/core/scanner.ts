import { readdir, stat, access, constants } from 'node:fs/promises';
import path from 'node:path';
import { minimatch } from 'minimatch';
import { DEFAULT_EXCLUDES, DEFAULT_MAX_SCAN_DEPTH } from '../constants/defaults';
import { calculateDirectorySize } from '../utils/fs.utils';

export interface ModuleInfo {
  path: string;
  sizeBytes: number;
  mtimeMs: number;
  hasPackageJson: boolean;
}

export interface ScanResult {
  modules: ModuleInfo[];
  skippedNoPermission: string[];
}

export interface ScanOptions {
  rootPath: string;
  depth?: number;
  excludeGlobs?: string[];
  followSymlinks?: boolean;
  onProgress?: (currentPath: string, foundCount: number) => void;
}

function shouldExclude(name: string, customPatterns?: string[]): boolean {
  // Always exclude default patterns
  if (DEFAULT_EXCLUDES.includes(name)) {
    return true;
  }

  // Check custom patterns if provided
  if (customPatterns && customPatterns.length > 0) {
    for (const pattern of customPatterns) {
      if (minimatch(name, pattern, { dot: true })) {
        return true;
      }
    }
  }

  return false;
}

export class ModuleScanner {
  private readonly maxDepth: number;
  private readonly followSymlinks: boolean;

  constructor() {
    this.maxDepth = DEFAULT_MAX_SCAN_DEPTH;
    this.followSymlinks = false;
  }

  async scan(options: ScanOptions): Promise<ScanResult> {
    const depthLimit = options.depth ?? this.maxDepth;
    const results: ModuleInfo[] = [];
    const skippedNoPermission: string[] = [];
    await this.walk(
      options.rootPath,
      0,
      depthLimit,
      results,
      skippedNoPermission,
      options.followSymlinks ?? this.followSymlinks,
      options.excludeGlobs,
      options.onProgress,
    );
    return { modules: results, skippedNoPermission };
  }

  private async walk(
    currentPath: string,
    currentDepth: number,
    depthLimit: number,
    results: ModuleInfo[],
    skippedNoPermission: string[],
    followSymlinks: boolean,
    excludeGlobs?: string[],
    onProgress?: (currentPath: string, foundCount: number) => void,
  ): Promise<void> {
    if (currentDepth > depthLimit) return;

    // Notify progress
    if (onProgress) {
      onProgress(currentPath, results.length);
    }

    let entries;
    try {
      entries = await readdir(currentPath, { withFileTypes: true });
    } catch (error) {
      // Expected: permission denied, path not found, or other FS errors
      // These are normal during filesystem traversal and can be safely ignored
      if (process.env.DEBUG) {
        // eslint-disable-next-line no-console
        console.error(`[scanner] Cannot read directory ${currentPath}:`, error);
      }
      return;
    }

    for (const entry of entries) {
      const full = path.join(currentPath, entry.name);
      if (shouldExclude(entry.name, excludeGlobs)) continue;

      if (entry.isSymbolicLink()) {
        if (!followSymlinks) continue;
      }

      if (entry.isDirectory()) {
        if (entry.name === 'node_modules') {
          try {
            const s = await stat(full);
            const sizeBytes = await calculateDirectorySize(full);
            const hasPackageJson = await this.hasPackageJson(path.dirname(full));
            
            // Check write permissions (non-destructive)
            const canWrite = await this.canWrite(full);
            if (!canWrite) {
              skippedNoPermission.push(full);
              continue;
            }
            
            results.push({ path: full, sizeBytes, mtimeMs: s.mtimeMs, hasPackageJson });
          } catch (error) {
            // Expected: stat/size calculation failures (permissions, symlinks, corruption)
            // These node_modules are skipped but scan continues
            if (process.env.DEBUG) {
              // eslint-disable-next-line no-console
              console.error(`[scanner] Cannot process node_modules at ${full}:`, error);
            }
          }
          continue; // do not descend into node_modules children
        }
        await this.walk(full, currentDepth + 1, depthLimit, results, skippedNoPermission, followSymlinks, excludeGlobs, onProgress);
      }
    }
  }

  private async canWrite(dirPath: string): Promise<boolean> {
    try {
      await access(dirPath, constants.W_OK);
      return true;
    } catch {
      // Expected: permission check failures are normal and indicate read-only dirs
      return false;
    }
  }

  private async hasPackageJson(dirPath: string): Promise<boolean> {
    try {
      await stat(path.join(dirPath, 'package.json'));
      return true;
    } catch {
      // Expected: package.json may not exist (orphan node_modules)
      return false;
    }
  }
}
