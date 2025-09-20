import { describe, it, expect } from 'vitest';
import { Analyzer } from '../../src/core/analyzer.js';

describe('Analyzer', () => {
  it('sorts by size by default', () => {
    const now = Date.now();
    const analyzer = new Analyzer();
    const res = analyzer.analyze([
      { path: 'a/node_modules', sizeBytes: 10, mtimeMs: now - 1000, hasPackageJson: true },
      { path: 'b/node_modules', sizeBytes: 100, mtimeMs: now - 1000, hasPackageJson: false },
    ]);
    expect(res[0].sizeBytes).toBe(100);
  });
});

