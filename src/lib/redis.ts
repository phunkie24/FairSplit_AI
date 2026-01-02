import { Redis } from '@upstash/redis';

// Check if Redis is configured
const isRedisConfigured = process.env.REDIS_URL && process.env.REDIS_TOKEN;

export const redis = isRedisConfigured
  ? new Redis({
      url: process.env.REDIS_URL!,
      token: process.env.REDIS_TOKEN!,
    })
  : null;

// In-memory fallback for development
class InMemoryCache {
  private cache = new Map<string, { value: any; expiresAt: number }>();

  async get<T = any>(key: string): Promise<T | null> {
    const item = this.cache.get(key);
    if (!item) return null;
    
    if (Date.now() > item.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    
    return item.value as T;
  }

  async set(key: string, value: any, expirationSeconds: number = 3600): Promise<string> {
    this.cache.set(key, {
      value,
      expiresAt: Date.now() + expirationSeconds * 1000,
    });
    return 'OK';
  }

  async incr(key: string): Promise<number> {
    const current = (await this.get<number>(key)) || 0;
    const newValue = current + 1;
    await this.set(key, newValue, 60); // 1 minute default
    return newValue;
  }

  async expire(key: string, seconds: number): Promise<number> {
    const item = this.cache.get(key);
    if (!item) return 0;
    
    item.expiresAt = Date.now() + seconds * 1000;
    return 1;
  }

  async del(key: string): Promise<number> {
    return this.cache.delete(key) ? 1 : 0;
  }

  // Cleanup expired entries periodically
  private cleanup() {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiresAt) {
        this.cache.delete(key);
      }
    }
  }
}

const inMemoryCache = new InMemoryCache();

// Run cleanup every minute if using in-memory cache
if (!isRedisConfigured) {
  setInterval(() => {
    (inMemoryCache as any).cleanup();
  }, 60000);
}

// Export unified cache interface
export const cache = redis || inMemoryCache;

// Helper functions
export async function getCached<T>(key: string): Promise<T | null> {
  return cache.get<T>(key);
}

export async function setCached(
  key: string,
  value: any,
  expirationSeconds: number = 3600
): Promise<void> {
  await cache.set(key, value, expirationSeconds);
}

export async function deleteCached(key: string): Promise<void> {
  await cache.del(key);
}

export async function checkRateLimit(
  identifier: string,
  limit: number = 30,
  windowSeconds: number = 60
): Promise<{ allowed: boolean; remaining: number }> {
  const key = `ratelimit:${identifier}`;
  
  const current = await cache.incr(key);
  
  if (current === 1) {
    await cache.expire(key, windowSeconds);
  }
  
  const allowed = current <= limit;
  const remaining = Math.max(0, limit - current);
  
  return { allowed, remaining };
}
