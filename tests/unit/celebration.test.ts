import { describe, it, expect, vi } from 'vitest';
import { maybeCelebrate } from '../../src/ui/celebration';
import type { Logger } from '../../src/ui/logger';

describe('celebration', () => {
  it('should not celebrate for less than 10GB', () => {
    const mockLogger = {
      success: vi.fn(),
    } as unknown as Logger;

    const fiveGB = 5 * 1024 * 1024 * 1024;
    maybeCelebrate(fiveGB, mockLogger);

    expect(mockLogger.success).not.toHaveBeenCalled();
  });

  it('should celebrate for more than 10GB with logger', () => {
    const mockLogger = {
      success: vi.fn(),
    } as unknown as Logger;

    const moreThanTenGB = 10 * 1024 * 1024 * 1024 + 1;
    maybeCelebrate(moreThanTenGB, mockLogger);

    expect(mockLogger.success).toHaveBeenCalledTimes(2);
    expect(mockLogger.success).toHaveBeenCalledWith(expect.stringContaining('┏┓┳┓┏┓┏┓┏┳┓╻╻╻'));
    expect(mockLogger.success).toHaveBeenCalledWith(expect.stringContaining('LEGENDARY KILL'));
  });

  it('should celebrate for more than 10GB without logger (fallback to console)', () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    const fifteenGB = 15 * 1024 * 1024 * 1024;
    maybeCelebrate(fifteenGB);

    expect(consoleSpy).toHaveBeenCalledTimes(2);
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('┏┓┳┓┏┓┏┓┏┳┓╻╻╻'));
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('LEGENDARY KILL'));

    consoleSpy.mockRestore();
  });

  it('should not celebrate for exactly 10GB', () => {
    const mockLogger = {
      success: vi.fn(),
    } as unknown as Logger;

    const exactlyTenGB = 10 * 1024 * 1024 * 1024;
    maybeCelebrate(exactlyTenGB, mockLogger);

    // Should not celebrate for exactly 10GB (> not >=)
    expect(mockLogger.success).not.toHaveBeenCalled();
  });

  it('should celebrate for 10GB + 1 byte', () => {
    const mockLogger = {
      success: vi.fn(),
    } as unknown as Logger;

    const tenGBPlusOne = 10 * 1024 * 1024 * 1024 + 1;
    maybeCelebrate(tenGBPlusOne, mockLogger);

    expect(mockLogger.success).toHaveBeenCalled();
  });
});

