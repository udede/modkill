import chalk, { Chalk } from 'chalk';
import ora from 'ora';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'success';

export interface LoggerOptions {
  level?: LogLevel; // default 'info'
  json?: boolean;   // default false
  silent?: boolean; // default false
}

export interface Logger {
  debug(msg: string, meta?: unknown): void;
  info(msg: string, meta?: unknown): void;
  warn(msg: string, meta?: unknown): void;
  error(msg: string, meta?: unknown): void;
  success(msg: string, meta?: unknown): void;
  raw(line: string): void; // print line as-is (used for JSON or preformatted blocks)
  hr(width?: number): void;
  blank(lines?: number): void;
  section(title: string): void;
  tableHeader(cols: TableColumn[]): string;
  tableRow(cells: TableCell[]): string;
  spinner(text: string): Spinner;
  color: {
    dim: (s: string) => string;
    ok: (s: string) => string;
    warn: (s: string) => string;
    err: (s: string) => string;
    info: (s: string) => string;
  };
  setLevel(level: LogLevel): void;
  child(meta: Record<string, unknown>): Logger;
}

const ORDER: LogLevel[] = ['debug', 'info', 'warn', 'error', 'success'];

export function createLogger(opts: LoggerOptions = {}, baseMeta?: Record<string, unknown>): Logger {
  let minIdx = ORDER.indexOf(opts.level ?? 'info');
  const useJson = !!opts.json;
  const silent = !!opts.silent;
  const colorsEnabled = !(process.env.NO_COLOR) && !!process.stdout.isTTY;
  const colorizer = colorsEnabled ? chalk : new Chalk({ level: 0 });

  const emit = (lvl: LogLevel, msg: string, meta?: unknown) => {
    if (silent) return;
    if (ORDER.indexOf(lvl) < minIdx) return;
    if (useJson) {
      const finalMeta = baseMeta 
        ? (typeof meta === 'object' && meta !== null 
            ? { ...baseMeta, ...(meta as Record<string, unknown>) }
            : { ...baseMeta, value: meta })
        : meta;
      const event = { level: lvl, msg, meta: finalMeta, ts: Date.now() };
      process.stdout.write(JSON.stringify(event) + '\n');
      return;
    }
    const color =
      lvl === 'error' ? colorizer.red :
      lvl === 'warn' ? colorizer.yellow :
      lvl === 'success' ? colorizer.green :
      lvl === 'debug' ? colorizer.gray :
      colorizer.white;
    process.stdout.write(color(`[${lvl}] ${msg}`) + '\n');
    if (lvl === 'debug' && meta) {
      process.stdout.write(colorizer.gray('  ' + JSON.stringify(meta)) + '\n');
    }
  };

  return {
    debug: (m, meta) => emit('debug', m, meta),
    info: (m, meta) => emit('info', m, meta),
    warn: (m, meta) => emit('warn', m, meta),
    error: (m, meta) => emit('error', m, meta),
    success: (m, meta) => emit('success', m, meta),
    raw: (line) => { if (!silent) process.stdout.write(line + '\n'); },
    hr: (width = Math.min(process.stdout.columns || 120, 120)) => {
      if (silent) return;
      process.stdout.write(chalk.gray('─'.repeat(width)) + '\n');
    },
    blank: (lines = 1) => {
      if (silent) return;
      process.stdout.write('\n'.repeat(Math.max(1, lines)));
    },
    section: (title: string) => {
      if (silent) return;
      process.stdout.write(chalk.bold(title) + '\n');
      process.stdout.write(chalk.gray('─'.repeat(Math.min(process.stdout.columns || 120, 120))) + '\n');
    },
    tableHeader: (cols) => renderRow(cols.map(c => ({ text: c.label, width: c.width, align: c.align ?? 'left' }))),
    tableRow: (cells) => renderRow(cells),
    spinner: (text: string) => createSpinner(text, { useJson }),
    color: {
      dim: (s: string) => colorizer.gray(s),
      ok: (s: string) => colorizer.green(s),
      warn: (s: string) => colorizer.yellow(s),
      err: (s: string) => colorizer.red(s),
      info: (s: string) => colorizer.cyan(s),
    },
    setLevel: (level: LogLevel) => { minIdx = ORDER.indexOf(level); },
    child: (meta: Record<string, unknown>) => createLogger({ level: ORDER[minIdx] as LogLevel, json: useJson, silent }, baseMeta ? { ...baseMeta, ...meta } : meta),
  };
}

// Table helpers
export type Align = 'left' | 'right';
export interface TableColumn { label: string; width: number; align?: Align }
export interface TableCell { text: string; width: number; align?: Align }

// Avoid control-characters in regex literal to satisfy linters
const ESC = '\u001B';
const ANSI_RE = new RegExp(`${ESC}\\[[0-9;]*m`, 'g');
function visibleLength(s: string): number {
  return s.replace(ANSI_RE, '').length;
}

function padCell(text: string, width: number, align: Align): string {
  const len = visibleLength(text);
  if (len >= width) return text.slice(0, width - 1) + '…';
  const spaces = ' '.repeat(width - len);
  return align === 'right' ? spaces + text : text + spaces;
}

function renderRow(cells: TableCell[]): string {
  const parts = cells.map(c => padCell(c.text, c.width, c.align ?? 'left'));
  return parts.join(' ') + '\n';
}

// Spinner wrapper (respects json mode by suppressing animation)
export interface Spinner {
  start(text?: string): void;
  text(text: string): void;
  succeed(text?: string): void;
  fail(text?: string): void;
  stop(): void;
}

function createSpinner(initial: string, { useJson }: { useJson: boolean }): Spinner {
  if (useJson) {
    // No animation in json mode; print one-time info instead
    return {
      start: (t?: string) => { process.stdout.write(JSON.stringify({ level: 'info', msg: t ?? initial, ts: Date.now() }) + '\n'); },
      text: () => { /* noop */ },
      succeed: (t?: string) => { if (t) process.stdout.write(JSON.stringify({ level: 'info', msg: t, ts: Date.now() }) + '\n'); },
      fail: (t?: string) => { if (t) process.stdout.write(JSON.stringify({ level: 'error', msg: t, ts: Date.now() }) + '\n'); },
      stop: () => { /* noop */ },
    };
  }
  const sp = ora({ text: initial });
  return {
    start: (t?: string) => { if (t) sp.text = t; sp.start(); },
    text: (t: string) => { sp.text = t; },
    succeed: (t?: string) => { sp.succeed(t); },
    fail: (t?: string) => { sp.fail(t); },
    stop: () => { sp.stop(); },
  };
}


