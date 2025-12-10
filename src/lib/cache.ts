/**
 * Simple in-memory cache for API responses
 * For production: use Redis or Vercel KV
 */

type CacheEntry<T> = {
  data: T;
  timestamp: number;
};

class SimpleCache {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private defaultTTL = 60 * 1000; // 1 minute default

  get<T>(key: string, ttl?: number): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const age = Date.now() - entry.timestamp;
    const maxAge = ttl ?? this.defaultTTL;

    if (age > maxAge) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  set<T>(key: string, data: T): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  clear(pattern?: string): void {
    if (!pattern) {
      this.cache.clear();
      return;
    }

    // Clear keys matching pattern
    const keys = Array.from(this.cache.keys());
    keys.forEach(key => {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    });
  }

  // Cache statistics
  getStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

export const apiCache = new SimpleCache();

/**
 * Cache wrapper for async functions
 */
export async function cached<T>(
  key: string,
  fn: () => Promise<T>,
  ttl?: number
): Promise<T> {
  // Check cache first
  const cached = apiCache.get<T>(key, ttl);
  if (cached !== null) {
    console.log(`✅ Cache HIT: ${key}`);
    return cached;
  }

  // Cache miss - fetch data
  console.log(`❌ Cache MISS: ${key}`);
  const data = await fn();

  // Store in cache
  apiCache.set(key, data);

  return data;
}

/**
 * Generate cache key from request parameters
 */
export function getCacheKey(prefix: string, params: Record<string, any>): string {
  const sortedParams = Object.keys(params)
    .sort()
    .map(key => `${key}=${params[key] ?? 'null'}`)
    .join('&');

  return `${prefix}:${sortedParams}`;
}

/**
 * HTTP Cache Headers Helper
 * Returns optimized cache headers for API responses
 */
export function getCacheHeaders(options?: {
  maxAge?: number; // Cache duration in seconds (default: 60s)
  staleWhileRevalidate?: number; // Stale-while-revalidate duration (default: 300s)
  public?: boolean; // Public vs private cache (default: public)
}) {
  const maxAge = options?.maxAge ?? 60; // 1 minute default
  const swr = options?.staleWhileRevalidate ?? 300; // 5 minutes default
  const cacheType = options?.public !== false ? 'public' : 'private';

  return {
    'Cache-Control': `${cacheType}, s-maxage=${maxAge}, stale-while-revalidate=${swr}`,
    'CDN-Cache-Control': `max-age=${maxAge}`,
    'Vercel-CDN-Cache-Control': `max-age=${maxAge}`
  };
}

/**
 * No-cache headers for sensitive data
 */
export function getNoCacheHeaders() {
  return {
    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  };
}
