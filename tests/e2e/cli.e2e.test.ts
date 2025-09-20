import { describe, it, expect, beforeAll } from 'vitest';
import { mkdtemp, mkdir, writeFile, utimes } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { execFile } from 'node:child_process';

function exec(cmd: string, args: string[], opts: { cwd?: string } = {}): Promise<{ stdout: string; stderr: string; code: number }> {
  return new Promise((resolve) => {
    const child = execFile(cmd, args, { cwd: opts.cwd }, (error, stdout, stderr) => {
      resolve({ stdout: String(stdout), stderr: String(stderr), code: error ? 1 : 0 });
    });
  });
}

let projectRoot = '';

beforeAll(async () => {
  projectRoot = path.resolve(__dirname, '../../');
  await exec('npm', ['run', 'build'], { cwd: projectRoot });
});

describe('CLI E2E', () => {
  it('runs dry-run JSON on a temp workspace', async () => {
    const tmp = await mkdtemp(path.join(os.tmpdir(), 'modkill-e2e-'));
    const proj1 = path.join(tmp, 'proj1');
    const proj2 = path.join(tmp, 'proj2');
    await mkdir(path.join(proj1, 'node_modules', 'pkgA'), { recursive: true });
    await mkdir(path.join(proj2, 'node_modules', 'pkgB'), { recursive: true });
    await writeFile(path.join(proj1, 'package.json'), '{}');
    await writeFile(path.join(proj2, 'package.json'), '{}');
    await writeFile(path.join(proj1, 'node_modules', 'pkgA', 'file.bin'), Buffer.alloc(200 * 1024));
    await writeFile(path.join(proj2, 'node_modules', 'pkgB', 'file.bin'), Buffer.alloc(100 * 1024));
    const nm2 = path.join(proj2, 'node_modules');
    const old = new Date('2022-01-01T00:00:00Z');
    await utimes(nm2, old, old);

    const { stdout, code } = await exec('node', [path.join(projectRoot, 'dist', 'cli.js'), '--dry-run', '--json'], { cwd: tmp });
    expect(code).toBe(0);
    const data = JSON.parse(stdout);
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThan(0);
  });

  it('runs current-dir dry-run', async () => {
    const tmp = await mkdtemp(path.join(os.tmpdir(), 'modkill-e2e-'));
    const proj = path.join(tmp, 'proj');
    await mkdir(path.join(proj, 'node_modules', 'pkgA'), { recursive: true });
    await writeFile(path.join(proj, 'package.json'), '{}');
    await writeFile(path.join(proj, 'node_modules', 'pkgA', 'file.bin'), Buffer.alloc(50 * 1024));

    const { stdout, code } = await exec('node', [path.join(projectRoot, 'dist', 'cli.js'), '--current', '--dry-run'], { cwd: proj });
    expect(code).toBe(0);
    expect(stdout).toMatch(/Deleted:|No node_modules/);
  });

  it('runs auto mode dry-run', async () => {
    const tmp = await mkdtemp(path.join(os.tmpdir(), 'modkill-e2e-'));
    const proj = path.join(tmp, 'proj');
    await mkdir(path.join(proj, 'node_modules', 'pkgA'), { recursive: true });
    await writeFile(path.join(proj, 'package.json'), '{}');
    await writeFile(path.join(proj, 'node_modules', 'pkgA', 'file.bin'), Buffer.alloc(50 * 1024));

    const { stdout, code } = await exec('node', [path.join(projectRoot, 'dist', 'cli.js'), '--auto', '--min-age', '0', '--dry-run'], { cwd: tmp });
    expect(code).toBe(0);
    expect(stdout).toMatch(/Auto-clean complete|Nothing to auto-clean/);
  });
});

