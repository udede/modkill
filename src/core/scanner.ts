import { readdir, stat, access, constants } from 'node:fs/promises';
import path from 'node:path';
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

function shouldExclude(name: string): boolean {
  return DEFAULT_EXCLUDES.includes(name);
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
    await this.walk(options.rootPath, 0, depthLimit, results, skippedNoPermission, options.followSymlinks ?? this.followSymlinks, options.onProgress);
    return { modules: results, skippedNoPermission };
  }

  private async walk(
    currentPath: string,
    currentDepth: number,
    depthLimit: number,
    results: ModuleInfo[],
    skippedNoPermission: string[],
    followSymlinks: boolean,
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
    } catch {
      return;
    }

    for (const entry of entries) {
      const full = path.join(currentPath, entry.name);
      if (shouldExclude(entry.name)) continue;

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
          } catch {
            // ignore
          }
          continue; // do not descend into node_modules children
        }
        await this.walk(full, currentDepth + 1, depthLimit, results, skippedNoPermission, followSymlinks, onProgress);
      }
    }
  }

  private async canWrite(dirPath: string): Promise<boolean> {
    try {
      await access(dirPath, constants.W_OK);
      return true;
    } catch {
      return false;
    }
  }

  private async hasPackageJson(dirPath: string): Promise<boolean> {
    try {
      await stat(path.join(dirPath, 'package.json'));
      return true;
    } catch {
      return false;
    }
  }
}
