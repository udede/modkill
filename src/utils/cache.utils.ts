type CacheValue<T> = { value: T; timestamp: number };

const memory = new Map<string, CacheValue<unknown>>();

export function cacheSet<T>(key: string, value: T): void {
  memory.set(key, { value, timestamp: Date.now() });
}

export function cacheGet<T>(key: string): T | undefined {
  const item = memory.get(key) as CacheValue<T> | undefined;
  return item?.value;
}

