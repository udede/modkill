import { rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import trash from 'trash';
import { calculateDirectorySize } from '../utils/fs.utils';

export interface DeleteOptions {
  dryRun?: boolean;
  useTrash?: boolean;
  confirm?: boolean;
  restoreLogPath?: string;
}

export interface SkippedItem {
  path: string;
  reason: string;
  errorCode?: string;
}

export interface DeleteResult {
  success: boolean;
  freedBytes: number;
  deleted: string[];
  skipped: SkippedItem[];
  restoreLogPath?: string;
}

export class SafeCleaner {
  async delete(paths: string[], options: DeleteOptions = {}): Promise<DeleteResult> {
    const useTrash = options.useTrash !== false; // default true
    const dryRun = options.dryRun === true;
    const restoreLogPath = options.restoreLogPath ?? path.join(os.tmpdir(), `modkill-restore-${Date.now()}.log`);

    const deleted: string[] = [];
    const skipped: SkippedItem[] = [];
    let freedBytes = 0;

    for (const p of paths) {
      if (dryRun) {
        skipped.push({ path: p, reason: 'dry-run mode' });
        continue;
      }
      try {
        const size = await calculateDirectorySize(p).catch(() => 0);
        if (useTrash) {
          await trash([p]);
        } else {
          await rm(p, { recursive: true, force: true });
        }
        deleted.push(p);
        freedBytes += size;
      } catch (error: unknown) {
        const errorCode = error && typeof error === 'object' && 'code' in error ? (error as { code?: string }).code : undefined;
        const reason = this.getErrorReason(errorCode);
        const skippedItem: SkippedItem = { path: p, reason };
        if (errorCode) {
          skippedItem.errorCode = errorCode;
        }
        skipped.push(skippedItem);
      }
    }

    const content = deleted.map((p) => `DELETED\t${p}`).concat(skipped.map((s) => `SKIPPED\t${s.path}\t(${s.reason})`)).join('\n');
    try {
      await writeFile(restoreLogPath, content, 'utf8');
    } catch {
      // ignore log errors
    }

    return { success: true, freedBytes, deleted, skipped, restoreLogPath };
  }

  private getErrorReason(errorCode?: string): string {
    switch (errorCode) {
      case 'EACCES':
      case 'EPERM':
        return 'permission denied';
      case 'EBUSY':
        return 'file in use';
      case 'ENOENT':
        return 'path not found';
      default:
        return 'unknown error';
    }
  }
}
