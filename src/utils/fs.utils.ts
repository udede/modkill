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
        // skip
      }
    }
  } catch {
    // skip
  }
  return total;
}

export function isSystemPath(p: string): boolean {
  const lower = p.toLowerCase();
  return (
    lower.includes('/system') ||
    lower.includes('/windows') ||
    lower.includes('/library') ||
    lower.includes('program files')
  );
}

