import { readdir, stat } from 'node:fs/promises';
import path from 'node:path';

export async function calculateDirectorySize(dirPath: string): Promise<number> {
  let total = 0;
  try {
    const entries = await readdir(dirPath, { withFileTypes: true });
    for (const entry of entries) {
      const full = path.join(dirPath, entry.name);
      try {
        if (entry.isFile()) {
          const s = await stat(full);
          total += s.size;
        } else if (entry.isDirectory()) {
          total += await calculateDirectorySize(full);
        }
      } catch {
        // Expected: stat failures for individual files (permissions, broken symlinks)
        // Skip and continue calculating size of accessible files
      }
    }
  } catch {
    // Expected: directory read failure (permissions, deleted during scan)
    // Return 0 or partial total accumulated so far
  }
  return total;
}

