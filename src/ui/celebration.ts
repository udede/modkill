export function maybeCelebrate(bytesFreed: number): void {
  const TEN_GB = 10 * 1024 * 1024 * 1024;
  if (bytesFreed <= TEN_GB) return;
  const art = `
 __   __           _      _ _           _ 
 \ \ / /__  _   _| | ___| (_)_ __   __| |
  \ V / _ \| | | | |/ _ \ | | '_ \ / _` + "`" + ` |
   | | (_) | |_| | |  __/ | | | | | (_| |
   |_|\___/ \__,_|_|\___|_|_|_| |_|\__,_|
`;
  // eslint-disable-next-line no-console
  console.log(art);
  // eslint-disable-next-line no-console
  console.log('🎉 LEGENDARY KILL! Share your achievement!');
}

