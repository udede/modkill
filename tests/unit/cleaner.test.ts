import { describe, it, expect } from 'vitest';
import { SafeCleaner } from '../../src/core/cleaner.js';

describe('SafeCleaner', () => {
  it('dry-run skips deletions', async () => {
    const cleaner = new SafeCleaner();
    const res = await cleaner.delete(['/tmp/does-not-exist'], { dryRun: true });
    expect(res.skipped.length).toBe(1);
  });
});

