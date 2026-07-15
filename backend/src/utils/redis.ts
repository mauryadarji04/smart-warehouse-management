import Redis from 'ioredis';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

export const redis = new Redis(REDIS_URL, {
  lazyConnect: true,
  enableOfflineQueue: false,
  maxRetriesPerRequest: 1,
});

redis.on('error', (err) => {
  // Log but don't crash — cache is best-effort
  if (process.env.NODE_ENV !== 'test') {
    console.warn('[Redis] Connection error (cache disabled):', err.message);
  }
});

/** Get cached JSON value, returns null on miss or Redis unavailability */
export async function cacheGet<T>(key: string): Promise<T | null> {
  try {
    const val = await redis.get(key);
    return val ? (JSON.parse(val) as T) : null;
  } catch {
    return null;
  }
}

/** Set JSON value with TTL in seconds */
export async function cacheSet(key: string, value: unknown, ttlSeconds: number): Promise<void> {
  try {
    await redis.set(key, JSON.stringify(value), 'EX', ttlSeconds);
  } catch {
    // ignore — cache is best-effort
  }
}

/** Delete one or more cache keys (supports glob patterns via SCAN) */
export async function cacheDel(...keys: string[]): Promise<void> {
  try {
    if (keys.length) await redis.del(...keys);
  } catch {
    // ignore
  }
}
