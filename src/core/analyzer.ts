import path from 'node:path';

export type SortBy = 'size' | 'age' | 'name' | 'path';

export interface AnalyzeOptions {
  minAgeDays?: number;
  minSizeMB?: number;
  includeOrphans?: boolean;
  sortBy?: SortBy;
}

export interface AnalyzedModule {
  path: string;
  sizeBytes: number;
  mtimeMs: number;
  ageDays: number;
  hasPackageJson: boolean;
  score: number;
}

export class Analyzer {
  analyze(modules: { path: string; sizeBytes: number; mtimeMs: number; hasPackageJson: boolean }[], opts: AnalyzeOptions = {}): AnalyzedModule[] {
    const now = Date.now();
    const minAgeDays = opts.minAgeDays ?? 0;
    const minSizeMB = opts.minSizeMB ?? 0;

    const scored = modules
      .map((m) => {
        const ageDays = Math.max(0, (now - m.mtimeMs) / (1000 * 60 * 60 * 24));
        const sizeMB = m.sizeBytes / (1024 * 1024);
        const orphanBonus = m.hasPackageJson ? 0 : 10; // Prefer cleaning orphans
        const ageScore = Math.min(100, ageDays);
        const sizeScore = Math.min(100, sizeMB / 10);
        const score = ageScore * 0.5 + sizeScore * 0.4 + orphanBonus * 0.1;
        return { ...m, ageDays, score } as AnalyzedModule;
      })
      .filter((m) => m.ageDays >= minAgeDays && m.sizeBytes >= minSizeMB * 1024 * 1024)
      .filter((m) => (opts.includeOrphans === false ? m.hasPackageJson : true));

    const sortBy = opts.sortBy ?? 'size';
    const sorted = [...scored].sort((a, b) => {
      switch (sortBy) {
        case 'age':
          return b.ageDays - a.ageDays;
        case 'name':
          return path.basename(a.path).localeCompare(path.basename(b.path));
        case 'path':
          return a.path.localeCompare(b.path);
        case 'size':
        default:
          return b.sizeBytes - a.sizeBytes;
      }
    });

    return sorted;
  }
}
