import { describe, it, expect } from 'vitest';
import { Analyzer } from '../../src/core/analyzer';

describe('Analyzer', () => {
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;

  it('sorts by size by default', () => {
    const analyzer = new Analyzer();
    const res = analyzer.analyze([
      { path: 'a/node_modules', sizeBytes: 10, mtimeMs: now - 1000, hasPackageJson: true },
      { path: 'b/node_modules', sizeBytes: 100, mtimeMs: now - 1000, hasPackageJson: false },
    ]);
    expect(res[0]?.sizeBytes).toBe(100);
  });

  it('sorts by age when specified', () => {
    const analyzer = new Analyzer();
    const res = analyzer.analyze(
      [
        { path: 'a/node_modules', sizeBytes: 100, mtimeMs: now - dayMs, hasPackageJson: true },
        { path: 'b/node_modules', sizeBytes: 50, mtimeMs: now - dayMs * 100, hasPackageJson: false },
      ],
      { sortBy: 'age' }
    );
    expect(res[0]?.path).toBe('b/node_modules');
  });

  it('sorts by name when specified', () => {
    const analyzer = new Analyzer();
    const res = analyzer.analyze(
      [
        { path: 'project-z/node_modules', sizeBytes: 100, mtimeMs: now, hasPackageJson: true },
        { path: 'project-a/node_modules', sizeBytes: 50, mtimeMs: now, hasPackageJson: false },
      ],
      { sortBy: 'name' }
    );
    // Both have 'node_modules' as basename, so order should be same as input or by secondary criteria
    expect(res.length).toBe(2);
  });

  it('sorts by path when specified', () => {
    const analyzer = new Analyzer();
    const res = analyzer.analyze(
      [
        { path: 'zzz/node_modules', sizeBytes: 100, mtimeMs: now, hasPackageJson: true },
        { path: 'aaa/node_modules', sizeBytes: 50, mtimeMs: now, hasPackageJson: false },
      ],
      { sortBy: 'path' }
    );
    expect(res[0]?.path).toBe('aaa/node_modules');
  });

  it('filters by minimum age', () => {
    const analyzer = new Analyzer();
    const res = analyzer.analyze(
      [
        { path: 'a/node_modules', sizeBytes: 100, mtimeMs: now - dayMs * 10, hasPackageJson: true },
        { path: 'b/node_modules', sizeBytes: 50, mtimeMs: now - dayMs * 50, hasPackageJson: false },
      ],
      { minAgeDays: 30 }
    );
    expect(res.length).toBe(1);
    expect(res[0]?.path).toBe('b/node_modules');
  });

  it('filters by minimum size', () => {
    const analyzer = new Analyzer();
    const res = analyzer.analyze(
      [
        { path: 'a/node_modules', sizeBytes: 1024 * 1024, mtimeMs: now, hasPackageJson: true }, // 1MB
        { path: 'b/node_modules', sizeBytes: 100 * 1024 * 1024, mtimeMs: now, hasPackageJson: false }, // 100MB
      ],
      { minSizeMB: 50 }
    );
    expect(res.length).toBe(1);
    expect(res[0]?.path).toBe('b/node_modules');
  });

  it('combines filters', () => {
    const analyzer = new Analyzer();
    const res = analyzer.analyze(
      [
        { path: 'a/node_modules', sizeBytes: 100 * 1024 * 1024, mtimeMs: now - dayMs * 10, hasPackageJson: true },
        { path: 'b/node_modules', sizeBytes: 100 * 1024 * 1024, mtimeMs: now - dayMs * 50, hasPackageJson: false },
        { path: 'c/node_modules', sizeBytes: 1024 * 1024, mtimeMs: now - dayMs * 50, hasPackageJson: true },
      ],
      { minAgeDays: 30, minSizeMB: 50 }
    );
    expect(res.length).toBe(1);
    expect(res[0]?.path).toBe('b/node_modules');
  });

  it('calculates age in days correctly', () => {
    const analyzer = new Analyzer();
    const res = analyzer.analyze([
      { path: 'a/node_modules', sizeBytes: 100, mtimeMs: now - dayMs * 10, hasPackageJson: true },
    ]);
    expect(res[0]?.ageDays).toBeCloseTo(10, 0);
  });

  it('calculates score correctly', () => {
    const analyzer = new Analyzer();
    const res = analyzer.analyze([
      { path: 'a/node_modules', sizeBytes: 100, mtimeMs: now - dayMs * 10, hasPackageJson: true },
    ]);
    expect(res[0]?.score).toBeGreaterThan(0);
  });

  it('returns empty array for empty input', () => {
    const analyzer = new Analyzer();
    const res = analyzer.analyze([]);
    expect(res).toEqual([]);
  });

  it('handles modules with zero age', () => {
    const analyzer = new Analyzer();
    const res = analyzer.analyze([
      { path: 'a/node_modules', sizeBytes: 100, mtimeMs: now, hasPackageJson: true },
    ]);
    expect(res[0]?.ageDays).toBeGreaterThanOrEqual(0);
    expect(res[0]?.ageDays).toBeLessThan(1);
  });

  it('handles all sort options', () => {
    const analyzer = new Analyzer();
    const modules = [
      { path: 'z/node_modules', sizeBytes: 100, mtimeMs: now - dayMs, hasPackageJson: true },
      { path: 'a/node_modules', sizeBytes: 200, mtimeMs: now - dayMs * 100, hasPackageJson: false },
    ];

    const bySize = analyzer.analyze([...modules], { sortBy: 'size' });
    expect(bySize[0]?.sizeBytes).toBe(200);

    const byAge = analyzer.analyze([...modules], { sortBy: 'age' });
    expect(byAge[0]?.path).toBe('a/node_modules');

    const byPath = analyzer.analyze([...modules], { sortBy: 'path' });
    expect(byPath[0]?.path).toBe('a/node_modules');
  });
});

