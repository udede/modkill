import path from 'node:path';
import { MS_PER_DAY, BYTES_PER_MB } from '../constants/units';
import { SCORING_WEIGHTS, ORPHAN_BONUS_POINTS } from '../constants/scoring';

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
        const ageDays = Math.max(0, (now - m.mtimeMs) / MS_PER_DAY);
        const sizeMB = m.sizeBytes / BYTES_PER_MB;
        const orphanBonus = m.hasPackageJson ? 0 : ORPHAN_BONUS_POINTS;
        const ageScore = Math.min(100, ageDays);
        const sizeScore = Math.min(100, sizeMB / 10);
        const score = ageScore * SCORING_WEIGHTS.AGE + sizeScore * SCORING_WEIGHTS.SIZE + orphanBonus * SCORING_WEIGHTS.ORPHAN;
        return { ...m, ageDays, score } as AnalyzedModule;
      })
      .filter((m) => m.ageDays >= minAgeDays && m.sizeBytes >= minSizeMB * BYTES_PER_MB)
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
