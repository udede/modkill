import type { Logger } from './logger';

export function maybeCelebrate(bytesFreed: number, logger?: Logger): void {
  const TEN_GB = 10 * 1024 * 1024 * 1024;
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

