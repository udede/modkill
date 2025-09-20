import prettyBytes from 'pretty-bytes';

export function formatBytes(bytes: number): string {
  return prettyBytes(bytes);
}

export function formatAgeDays(days: number): string {
  if (days < 1) return 'today';
  if (days < 30) return `${Math.floor(days)}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

