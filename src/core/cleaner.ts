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

export interface DeleteResult {
  success: boolean;
  freedBytes: number;
  deleted: string[];
  skipped: string[];
  restoreLogPath?: string;
}

export class SafeCleaner {
  async delete(paths: string[], options: DeleteOptions = {}): Promise<DeleteResult> {
    const useTrash = options.useTrash !== false; // default true
    const dryRun = options.dryRun === true;
    const restoreLogPath = options.restoreLogPath ?? path.join(os.tmpdir(), `modkill-restore-${Date.now()}.log`);

    const deleted: string[] = [];
    const skipped: string[] = [];
    let freedBytes = 0;

    for (const p of paths) {
      if (dryRun) {
        skipped.push(p);
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
      } catch {
        skipped.push(p);
      }
    }

    const content = deleted.map((p) => `DELETED\t${p}`).concat(skipped.map((p) => `SKIPPED\t${p}`)).join('\n');
    try {
      await writeFile(restoreLogPath, content, 'utf8');
    } catch {
      // ignore log errors
    }

    return { success: true, freedBytes, deleted, skipped, restoreLogPath };
  }
}
