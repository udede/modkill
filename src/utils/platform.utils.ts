import os from 'node:os';

export function isWindows(): boolean {
  return os.platform() === 'win32';
}

