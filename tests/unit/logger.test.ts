import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createLogger } from '../../src/ui/logger';

describe('Logger', () => {
  let stdoutSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    stdoutSpy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
  });

  afterEach(() => {
    stdoutSpy.mockRestore();
  });

  describe('log levels', () => {
    it('should log debug messages when level is debug', () => {
      const logger = createLogger({ level: 'debug' });
      logger.debug('test message');
      
      expect(stdoutSpy).toHaveBeenCalled();
      const output = stdoutSpy.mock.calls.map(c => c[0]).join('');
      expect(output).toContain('[debug]');
      expect(output).toContain('test message');
    });

    it('should not log debug messages when level is info', () => {
      const logger = createLogger({ level: 'info' });
      logger.debug('test message');
      
      expect(stdoutSpy).not.toHaveBeenCalled();
    });

    it('should log info messages', () => {
      const logger = createLogger({ level: 'info' });
      logger.info('info message');
      
      expect(stdoutSpy).toHaveBeenCalled();
      const output = stdoutSpy.mock.calls.map(c => c[0]).join('');
      expect(output).toContain('[info]');
      expect(output).toContain('info message');
    });

    it('should log warn messages', () => {
      const logger = createLogger({ level: 'info' });
      logger.warn('warning message');
      
      expect(stdoutSpy).toHaveBeenCalled();
      const output = stdoutSpy.mock.calls.map(c => c[0]).join('');
      expect(output).toContain('[warn]');
      expect(output).toContain('warning message');
    });

    it('should log error messages', () => {
      const logger = createLogger({ level: 'info' });
      logger.error('error message');
      
      expect(stdoutSpy).toHaveBeenCalled();
      const output = stdoutSpy.mock.calls.map(c => c[0]).join('');
      expect(output).toContain('[error]');
      expect(output).toContain('error message');
    });

    it('should log success messages', () => {
      const logger = createLogger({ level: 'info' });
      logger.success('success message');
      
      expect(stdoutSpy).toHaveBeenCalled();
      const output = stdoutSpy.mock.calls.map(c => c[0]).join('');
      expect(output).toContain('[success]');
      expect(output).toContain('success message');
    });
  });

  describe('JSON mode', () => {
    it('should output JSON when json mode is enabled', () => {
      const logger = createLogger({ level: 'info', json: true });
      logger.info('test', { key: 'value' });
      
      expect(stdoutSpy).toHaveBeenCalled();
      const output = stdoutSpy.mock.calls[0]?.[0] as string;
      const parsed = JSON.parse(output);
      
      expect(parsed.level).toBe('info');
      expect(parsed.msg).toBe('test');
      expect(parsed.meta).toEqual({ key: 'value' });
      expect(parsed.ts).toBeDefined();
    });

    it('should handle non-object meta in JSON mode', () => {
      const logger = createLogger({ level: 'info', json: true });
      logger.info('test', 'string meta');
      
      const output = stdoutSpy.mock.calls[0]?.[0] as string;
      const parsed = JSON.parse(output);
      // Meta is passed through as-is when there's no baseMeta
      expect(parsed.meta).toBe('string meta');
    });

    it('should include debug metadata in JSON mode', () => {
      const logger = createLogger({ level: 'debug', json: true });
      logger.debug('test', { details: 'important' });
      
      const output = stdoutSpy.mock.calls[0]?.[0] as string;
      const parsed = JSON.parse(output);
      expect(parsed.meta).toEqual({ details: 'important' });
    });
  });

  describe('silent mode', () => {
    it('should not output anything when silent', () => {
      const logger = createLogger({ level: 'info', silent: true });
      logger.info('test');
      logger.warn('test');
      logger.error('test');
      
      expect(stdoutSpy).not.toHaveBeenCalled();
    });
  });

  describe('utility methods', () => {
    it('should output raw lines', () => {
      const logger = createLogger({ level: 'info' });
      logger.raw('raw output');
      
      expect(stdoutSpy).toHaveBeenCalledWith('raw output\n');
    });

    it('should output horizontal rule', () => {
      const logger = createLogger({ level: 'info' });
      logger.hr(10);
      
      expect(stdoutSpy).toHaveBeenCalled();
      const output = stdoutSpy.mock.calls[0]?.[0] as string;
      expect(output).toContain('─');
    });

    it('should output blank lines', () => {
      const logger = createLogger({ level: 'info' });
      logger.blank(3);
      
      expect(stdoutSpy).toHaveBeenCalledWith('\n\n\n');
    });

    it('should output section headers', () => {
      const logger = createLogger({ level: 'info' });
      logger.section('Test Section');
      
      expect(stdoutSpy).toHaveBeenCalled();
      const calls = stdoutSpy.mock.calls.map(c => c[0]).join('');
      expect(calls).toContain('Test Section');
      expect(calls).toContain('─');
    });

    it('should render table headers', () => {
      const logger = createLogger({ level: 'info' });
      const header = logger.tableHeader([
        { label: 'Name', width: 20, align: 'left' },
        { label: 'Size', width: 10, align: 'right' },
      ]);
      
      expect(header).toContain('Name');
      expect(header).toContain('Size');
    });

    it('should render table rows', () => {
      const logger = createLogger({ level: 'info' });
      const row = logger.tableRow([
        { text: 'Test', width: 20, align: 'left' },
        { text: '100', width: 10, align: 'right' },
      ]);
      
      expect(row).toContain('Test');
      expect(row).toContain('100');
    });

    it('should truncate long cell text with ellipsis', () => {
      const logger = createLogger({ level: 'info' });
      const row = logger.tableRow([
        { text: 'Very long text that should be truncated', width: 10, align: 'left' },
      ]);
      
      expect(row).toContain('…');
      expect(row.length).toBeLessThanOrEqual(12); // 10 + newline
    });
  });

  describe('spinner', () => {
    it('should create spinner in normal mode', () => {
      const logger = createLogger({ level: 'info' });
      const spinner = logger.spinner('Loading...');
      
      expect(spinner).toBeDefined();
      expect(spinner.start).toBeDefined();
      expect(spinner.succeed).toBeDefined();
      expect(spinner.fail).toBeDefined();
      expect(spinner.stop).toBeDefined();
    });

    it('should create no-op spinner in JSON mode', () => {
      const logger = createLogger({ level: 'info', json: true });
      const spinner = logger.spinner('Loading...');
      
      spinner.start();
      spinner.text('Updated');
      spinner.succeed('Done');
      spinner.fail('Failed');
      spinner.stop();
      
      // Should output JSON instead of spinner animation
      expect(stdoutSpy).toHaveBeenCalled();
    });
  });

  describe('color helpers', () => {
    it('should provide color helper methods', () => {
      const logger = createLogger({ level: 'info' });
      
      expect(logger.color.dim('text')).toBeDefined();
      expect(logger.color.ok('text')).toBeDefined();
      expect(logger.color.warn('text')).toBeDefined();
      expect(logger.color.err('text')).toBeDefined();
      expect(logger.color.info('text')).toBeDefined();
    });
  });

  describe('setLevel', () => {
    it('should change log level dynamically', () => {
      const logger = createLogger({ level: 'info' });
      
      logger.debug('should not appear');
      expect(stdoutSpy).not.toHaveBeenCalled();
      
      logger.setLevel('debug');
      logger.debug('should appear');
      expect(stdoutSpy).toHaveBeenCalled();
    });
  });

  describe('child logger', () => {
    it('should create child logger with additional metadata', () => {
      const logger = createLogger({ level: 'info', json: true });
      const child = logger.child({ module: 'test' });
      
      child.info('message');
      
      const output = stdoutSpy.mock.calls[0]?.[0] as string;
      const parsed = JSON.parse(output);
      expect(parsed.meta.module).toBe('test');
    });

    it('should merge metadata from parent and child', () => {
      const logger = createLogger({ level: 'info', json: true }, { parent: 'value' });
      const child = logger.child({ child: 'value' });
      
      child.info('message', { additional: 'data' });
      
      const output = stdoutSpy.mock.calls[0]?.[0] as string;
      const parsed = JSON.parse(output);
      expect(parsed.meta.parent).toBe('value');
      expect(parsed.meta.child).toBe('value');
      expect(parsed.meta.additional).toBe('data');
    });
  });
});

