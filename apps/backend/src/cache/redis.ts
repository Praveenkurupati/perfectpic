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

export async function cacheGet<T>(key: string): Promise<T | null> {
  if (!isRedisConnected() || !redisClient) return null;
  try {
    const data = await redisClient.get(key);
    if (!data) return null;
    return JSON.parse(data) as T;
  } catch (err: any) {
    console.warn(`Redis get error for key "${key}":`, err.message);
    return null;
  }
}

export async function cacheSet(key: string, value: any, ttlSeconds = 300): Promise<boolean> {
  if (!isRedisConnected() || !redisClient) return false;
  try {
    const serialized = JSON.stringify(value);
    await redisClient.setex(key, ttlSeconds, serialized);
    return true;
  } catch (err: any) {
    console.warn(`Redis set error for key "${key}":`, err.message);
    return false;
  }
}

export async function cacheDel(key: string): Promise<boolean> {
  if (!isRedisConnected() || !redisClient) return false;
  try {
    await redisClient.del(key);
    return true;
  } catch (err: any) {
    console.warn(`Redis del error for key "${key}":`, err.message);
    return false;
  }
}

export async function cacheDelByPrefix(prefix: string): Promise<void> {
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

export async function cacheFlushAll(): Promise<void> {
  if (!isRedisConnected() || !redisClient) return;
  try {
    await redisClient.flushdb();
    console.log('🧹 Redis database flushed successfully.');
  } catch (err: any) {
    console.warn('Redis flush error:', err.message);
  }
}

export default {
  connectRedis,
  isRedisConnected,
  get: cacheGet,
  set: cacheSet,
  del: cacheDel,
  delByPrefix: cacheDelByPrefix,
  flushAll: cacheFlushAll
};
