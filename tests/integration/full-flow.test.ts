import { describe, it, expect } from 'vitest';
import { ModuleScanner } from '../../src/core/scanner.js';
import { Analyzer } from '../../src/core/analyzer.js';
import { SafeCleaner } from '../../src/core/cleaner.js';
import { mkdtemp, mkdir, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

async function createFixture(): Promise<string> {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'modkill-fixture-'));
  const project = path.join(dir, 'proj');
  const nm = path.join(project, 'node_modules');
  await mkdir(nm, { recursive: true });
  await writeFile(path.join(nm, 'dummy.txt'), 'x'.repeat(1024));
  await writeFile(path.join(project, 'package.json'), '{}');
  return dir;
}

describe('Full flow (dry-run)', () => {
  it('finds node_modules and can dry-run delete', async () => {
    const root = await createFixture();
    const scanner = new ModuleScanner();
    const scanResult = await scanner.scan({ rootPath: root, depth: 3 });
    expect(scanResult.modules.length).toBeGreaterThan(0);
    const analyzer = new Analyzer();
    const analyzed = analyzer.analyze(scanResult.modules, { minAgeDays: 0, minSizeMB: 0 });
    expect(analyzed.length).toBeGreaterThan(0);
    const cleaner = new SafeCleaner();
    const res = await cleaner.delete(analyzed.map((m) => m.path), { dryRun: true });
    expect(res.skipped.length).toBeGreaterThan(0);
  });
});

