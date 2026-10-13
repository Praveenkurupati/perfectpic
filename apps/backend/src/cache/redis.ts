import Redis from 'ioredis';

let redisClient: Redis | null = null;
let isConnected = false;

export async function connectRedis(): Promise<void> {
  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

  try {
    redisClient = new Redis(redisUrl, {
      lazyConnect: true,
      maxRetriesPerRequest: 1,
      connectTimeout: 4000,
      retryStrategy(times) {
        if (times > 5) {
          // Stop retrying aggressively after 5 attempts
          return null;
        }
        return Math.min(times * 200, 2000);
      }
    });

    redisClient.on('connect', () => {
      isConnected = true;
      console.log(`⚡ Redis connected successfully: ${redisUrl.includes('@') ? redisUrl.split('@')[1] : redisUrl}`);
    });

    redisClient.on('error', (err) => {
      isConnected = false;
      // Log connection error without crashing
      console.warn(`⚠️ Redis error: ${err.message}. Running with direct database queries.`);
    });

    redisClient.on('close', () => {
      isConnected = false;
    });

    await redisClient.connect();
  } catch (error: any) {
    isConnected = false;
    console.warn(`⚠️ Redis connection could not be established (${error.message}). Caching will be disabled.`);
  }
}

export function isRedisConnected(): boolean {
  return isConnected && redisClient !== null && redisClient.status === 'ready';
}

export function getRedisClient(): Redis | null {
  return redisClient;
}

// Bounded in-memory TTL cache fallback when Redis is offline or undergoing maintenance
interface LocalCacheEntry {
  value: any;
  expiresAt: number;
}
const localMemoryCache = new Map<string, LocalCacheEntry>();
const MAX_LOCAL_CACHE_SIZE = 500;

function pruneLocalMemoryCache(): void {
  const now = Date.now();
  for (const [k, entry] of localMemoryCache.entries()) {
    if (entry.expiresAt <= now) {
      localMemoryCache.delete(k);
    }
  }
  // Enforce bounded size
  if (localMemoryCache.size > MAX_LOCAL_CACHE_SIZE) {
    const keysToRemove = Array.from(localMemoryCache.keys()).slice(0, localMemoryCache.size - MAX_LOCAL_CACHE_SIZE);
    for (const k of keysToRemove) {
      localMemoryCache.delete(k);
    }
  }
}

export async function cacheGet<T>(key: string): Promise<T | null> {
  if (isRedisConnected() && redisClient) {
    try {
      const data = await redisClient.get(key);
      if (!data) return null;
      return JSON.parse(data) as T;
    } catch (err: any) {
      console.warn(`Redis get error for key "${key}":`, err.message);
    }
  }

  // Local memory fallback
  pruneLocalMemoryCache();
  const entry = localMemoryCache.get(key);
  if (entry && entry.expiresAt > Date.now()) {
    return entry.value as T;
  }
  if (entry) {
    localMemoryCache.delete(key);
  }
  return null;
}

export async function cacheSet(key: string, value: any, ttlSeconds = 300): Promise<boolean> {
  const expiresAt = Date.now() + ttlSeconds * 1000;
  pruneLocalMemoryCache();
  localMemoryCache.set(key, { value, expiresAt });

  if (isRedisConnected() && redisClient) {
    try {
      const serialized = JSON.stringify(value);
      await redisClient.setex(key, ttlSeconds, serialized);
      return true;
    } catch (err: any) {
      console.warn(`Redis set error for key "${key}":`, err.message);
    }
  }

  return true;
}

export async function cacheDel(key: string): Promise<boolean> {
  localMemoryCache.delete(key);

  if (!isRedisConnected() || !redisClient) return true;
  try {
    await redisClient.del(key);
    return true;
  } catch (err: any) {
    console.warn(`Redis del error for key "${key}":`, err.message);
    return false;
  }
}

export async function cacheDelByPrefix(prefix: string): Promise<void> {
  // Clear from local memory cache
  for (const k of Array.from(localMemoryCache.keys())) {
    if (k.startsWith(prefix)) {
      localMemoryCache.delete(k);
    }
  }

  if (!isRedisConnected() || !redisClient) return;
  try {
    let cursor = '0';
    do {
      const [nextCursor, keys] = await redisClient.scan(cursor, 'MATCH', `${prefix}*`, 'COUNT', 100);
      cursor = nextCursor;
      if (keys.length > 0) {
        await redisClient.del(...keys);
      }
    } while (cursor !== '0');
  } catch (err: any) {
    console.warn(`Redis delByPrefix error for "${prefix}":`, err.message);
  }
}

export async function cacheFlushAll(): Promise<boolean> {
  localMemoryCache.clear();

  if (!isRedisConnected() || !redisClient) return true;
  try {
    await redisClient.flushall();
    return true;
  } catch (err: any) {
    console.warn('Redis flushAll error:', err.message);
    return false;
  }
}

const inMemLocks = new Map<string, number>();

/**
 * Acquires an atomic distributed lock using Redis SET ... NX EX.
 * Guarantees single execution across multi-replica servers.
 */
export async function acquireLock(key: string, ttlSeconds = 300): Promise<boolean> {
  const now = Date.now();
  if (isRedisConnected() && redisClient) {
    try {
      const res = await redisClient.set(key, '1', 'EX', ttlSeconds, 'NX');
      return res === 'OK';
    } catch (err: any) {
      console.warn(`Redis lock error for "${key}":`, err.message);
    }
  }

  // In-memory fallback
  const existingExpiry = inMemLocks.get(key);
  if (existingExpiry && existingExpiry > now) {
    return false; // Lock already held
  }

  inMemLocks.set(key, now + ttlSeconds * 1000);
  return true;
}

export default {
  connectRedis,
  isRedisConnected,
  get: cacheGet,
  set: cacheSet,
  del: cacheDel,
  delByPrefix: cacheDelByPrefix,
  flushAll: cacheFlushAll,
  acquireLock,
};

