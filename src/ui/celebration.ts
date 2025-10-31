import type { Logger } from './logger';
import { BYTES_PER_GB } from '../constants/units';

export function maybeCelebrate(bytesFreed: number, logger?: Logger): void {
  const TEN_GB = 10 * BYTES_PER_GB;
  if (bytesFreed <= TEN_GB) return;
  const art = `
┏┓┳┓┏┓┏┓┏┳┓╻╻╻
┃┓┣┫┣ ┣┫ ┃ ┃┃┃
┗┛┛┗┗┛┛┗ ┻ •••
  `;
  if (logger) {
    logger.success(art);
    logger.success('🎉 LEGENDARY KILL! Share your achievement!');
  } else {
    // eslint-disable-next-line no-console
    console.log(art);
    // eslint-disable-next-line no-console
    console.log('🎉 LEGENDARY KILL! Share your achievement!');
  }
}

