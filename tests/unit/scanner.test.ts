import { describe, it, expect } from 'vitest';
import { ModuleScanner } from '../../src/core/scanner.js';

describe('ModuleScanner', () => {
  it('scans without crashing', async () => {
    const scanner = new ModuleScanner();
    const res = await scanner.scan({ rootPath: process.cwd(), depth: 1 });
    expect(res).toBeDefined();
    expect(res.modules).toBeDefined();
    expect(Array.isArray(res.modules)).toBe(true);
    expect(Array.isArray(res.skippedNoPermission)).toBe(true);
  });
});

