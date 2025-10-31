import { describe, it, expect, vi, beforeEach } from 'vitest';
import { runCli } from '../../src/cli';
import * as interactiveCommand from '../../src/commands/interactive.command';
import * as autoCommand from '../../src/commands/auto.command';
import * as dryRunCommand from '../../src/commands/dryrun.command';
import * as currentCommand from '../../src/commands/current.command';

// Mock all command modules
vi.mock('../../src/commands/interactive.command');
vi.mock('../../src/commands/auto.command');
vi.mock('../../src/commands/dryrun.command');
vi.mock('../../src/commands/current.command');

describe('CLI routing', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should route to interactive mode by default', async () => {
    const mockInteractive = vi.spyOn(interactiveCommand, 'runInteractiveCommand').mockResolvedValue();

    await runCli(['node', 'modkill']);

    expect(mockInteractive).toHaveBeenCalledTimes(1);
    expect(mockInteractive).toHaveBeenCalledWith(expect.objectContaining({ logger: expect.any(Object) }));
  });

  it('should route to auto mode with --auto flag', async () => {
    const mockAuto = vi.spyOn(autoCommand, 'runAutoCommand').mockResolvedValue();

    await runCli(['node', 'modkill', '--auto']);

    expect(mockAuto).toHaveBeenCalledTimes(1);
    expect(mockAuto).toHaveBeenCalledWith(expect.objectContaining({ auto: true, logger: expect.any(Object) }));
  });

  it('should route to auto mode with --min-age', async () => {
    const mockAuto = vi.spyOn(autoCommand, 'runAutoCommand').mockResolvedValue();

    await runCli(['node', 'modkill', '--min-age', '60']);

    expect(mockAuto).toHaveBeenCalledTimes(1);
    expect(mockAuto).toHaveBeenCalledWith(expect.objectContaining({ minAge: 60, logger: expect.any(Object) }));
  });

  it('should route to auto mode with --min-size', async () => {
    const mockAuto = vi.spyOn(autoCommand, 'runAutoCommand').mockResolvedValue();

    await runCli(['node', 'modkill', '--min-size', '100']);

    expect(mockAuto).toHaveBeenCalledTimes(1);
    expect(mockAuto).toHaveBeenCalledWith(expect.objectContaining({ minSize: 100, logger: expect.any(Object) }));
  });

  it('should route to dry-run mode', async () => {
    const mockDryRun = vi.spyOn(dryRunCommand, 'runDryRunCommand').mockResolvedValue();

    await runCli(['node', 'modkill', '--dry-run']);

    expect(mockDryRun).toHaveBeenCalledTimes(1);
    expect(mockDryRun).toHaveBeenCalledWith(expect.objectContaining({ dryRun: true, logger: expect.any(Object) }));
  });

  it('should route to current directory mode', async () => {
    const mockCurrent = vi.spyOn(currentCommand, 'runCurrentCommand').mockResolvedValue();

    await runCli(['node', 'modkill', '--current']);

    expect(mockCurrent).toHaveBeenCalledTimes(1);
    expect(mockCurrent).toHaveBeenCalledWith(expect.objectContaining({ current: true, logger: expect.any(Object) }));
  });

  it('should prioritize --current over other modes', async () => {
    const mockCurrent = vi.spyOn(currentCommand, 'runCurrentCommand').mockResolvedValue();
    const mockAuto = vi.spyOn(autoCommand, 'runAutoCommand').mockResolvedValue();

    await runCli(['node', 'modkill', '--current', '--auto']);

    expect(mockCurrent).toHaveBeenCalledTimes(1);
    expect(mockAuto).not.toHaveBeenCalled();
  });

  it('should pass custom path option', async () => {
    const mockInteractive = vi.spyOn(interactiveCommand, 'runInteractiveCommand').mockResolvedValue();

    await runCli(['node', 'modkill', '--path', '/custom/path']);

    expect(mockInteractive).toHaveBeenCalledWith(expect.objectContaining({ path: '/custom/path' }));
  });

  it('should pass depth option', async () => {
    const mockInteractive = vi.spyOn(interactiveCommand, 'runInteractiveCommand').mockResolvedValue();

    await runCli(['node', 'modkill', '--depth', '10']);

    expect(mockInteractive).toHaveBeenCalledWith(expect.objectContaining({ depth: 10 }));
  });

  it('should pass verbose flag', async () => {
    const mockInteractive = vi.spyOn(interactiveCommand, 'runInteractiveCommand').mockResolvedValue();

    await runCli(['node', 'modkill', '--verbose']);

    expect(mockInteractive).toHaveBeenCalledWith(expect.objectContaining({ verbose: true }));
  });

  it('should pass json flag', async () => {
    const mockInteractive = vi.spyOn(interactiveCommand, 'runInteractiveCommand').mockResolvedValue();

    await runCli(['node', 'modkill', '--json']);

    expect(mockInteractive).toHaveBeenCalledWith(expect.objectContaining({ json: true }));
  });

  it('should pass yes flag', async () => {
    const mockInteractive = vi.spyOn(interactiveCommand, 'runInteractiveCommand').mockResolvedValue();

    await runCli(['node', 'modkill', '--yes']);

    expect(mockInteractive).toHaveBeenCalledWith(expect.objectContaining({ yes: true }));
  });

  it('should pass sort option', async () => {
    const mockInteractive = vi.spyOn(interactiveCommand, 'runInteractiveCommand').mockResolvedValue();

    await runCli(['node', 'modkill', '--sort', 'age']);

    expect(mockInteractive).toHaveBeenCalledWith(expect.objectContaining({ sort: 'age' }));
  });

  it('should handle multiple flags together', async () => {
    const mockAuto = vi.spyOn(autoCommand, 'runAutoCommand').mockResolvedValue();

    await runCli(['node', 'modkill', '--auto', '--min-age', '90', '--min-size', '200', '--verbose']);

    expect(mockAuto).toHaveBeenCalledWith(
      expect.objectContaining({
        auto: true,
        minAge: 90,
        minSize: 200,
        verbose: true,
      })
    );
  });

  it('should create logger with correct settings for verbose mode', async () => {
    const mockInteractive = vi.spyOn(interactiveCommand, 'runInteractiveCommand').mockResolvedValue();

    await runCli(['node', 'modkill', '--verbose']);

    expect(mockInteractive).toHaveBeenCalledWith(
      expect.objectContaining({
        verbose: true,
        logger: expect.objectContaining({
          debug: expect.any(Function),
        }),
      })
    );
  });

  it('should create logger with json mode', async () => {
    const mockInteractive = vi.spyOn(interactiveCommand, 'runInteractiveCommand').mockResolvedValue();

    await runCli(['node', 'modkill', '--json']);

    expect(mockInteractive).toHaveBeenCalledWith(
      expect.objectContaining({
        json: true,
        logger: expect.any(Object),
      })
    );
  });
});
