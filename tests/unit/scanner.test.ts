import { describe, it, expect } from 'vitest';
import { ModuleScanner } from '../../src/core/scanner.js';

describe('ModuleScanner', () => {
  it('scans without crashing', async () => {
    const scanner = new ModuleScanner();
    const res = await scanner.scan({ rootPath: process.cwd(), depth: 1 });
    expect(res).toBeDefined();
    expect(Array.isArray(res)).toBe(true);
  });
});

