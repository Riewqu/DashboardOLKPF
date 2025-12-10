/**
 * Simple in-memory rate limiter
 * For production: consider Redis-based rate limiting (Upstash, Vercel KV)
 */

type RateLimitRecord = {
  count: number;
  resetTime: number;
};

export class RateLimiter {
  private requests: Map<string, RateLimitRecord> = new Map();
  private interval: number; // milliseconds
  private maxRequests: number;

  constructor(options: { interval: number; maxRequests: number }) {
    this.interval = options.interval;
    this.maxRequests = options.maxRequests;

    // Cleanup expired entries every minute
    setInterval(() => this.cleanup(), 60 * 1000);
  }

  /**
   * Check if request is allowed
   * @param identifier - Usually IP address
   * @returns true if allowed, false if rate limited
   */
  check(identifier: string): { allowed: boolean; remaining: number; resetTime: number } {
    const now = Date.now();
    const record = this.requests.get(identifier);

    // No record or expired - allow and create new record
    if (!record || now > record.resetTime) {
      this.requests.set(identifier, {
        count: 1,
        resetTime: now + this.interval
      });

      return {
        allowed: true,
        remaining: this.maxRequests - 1,
        resetTime: now + this.interval
      };
    }

    // Check if limit exceeded
    if (record.count >= this.maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: record.resetTime
      };
    }

    // Increment count
    record.count++;
    this.requests.set(identifier, record);

    return {
      allowed: true,
      remaining: this.maxRequests - record.count,
      resetTime: record.resetTime
    };
  }

  /**
   * Reset rate limit for identifier
   */
  reset(identifier: string): void {
    this.requests.delete(identifier);
  }

  /**
   * Cleanup expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, record] of this.requests.entries()) {
      if (now > record.resetTime) {
        this.requests.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      console.log(`🧹 Rate limiter: Cleaned ${cleaned} expired entries`);
    }
  }

  /**
   * Get statistics
   */
  getStats() {
    return {
      totalTracked: this.requests.size,
      interval: this.interval,
      maxRequests: this.maxRequests
    };
  }
}

// Export singleton instances for different use cases
export const apiRateLimiter = new RateLimiter({
  interval: 60 * 1000, // 1 minute
  maxRequests: 60 // 60 requests per minute per IP
});

export const authRateLimiter = new RateLimiter({
  interval: 15 * 60 * 1000, // 15 minutes
  maxRequests: 5 // 5 login attempts per 15 minutes per IP
});

export const uploadRateLimiter = new RateLimiter({
  interval: 60 * 1000, // 1 minute
  maxRequests: 5 // 5 uploads per minute per IP
});

/**
 * Get client IP from request
 */
export function getClientIp(request: Request): string {
  // Check various headers for real IP (for proxy/CDN scenarios)
  const headers = new Headers(request.headers);

  const forwardedFor = headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }

  const realIp = headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }

  const cfConnectingIp = headers.get('cf-connecting-ip');
  if (cfConnectingIp) {
    return cfConnectingIp;
  }

  // Fallback
  return 'unknown';
}

/**
 * Helper to create rate limit response
 */
export function createRateLimitResponse(resetTime: number) {
  const retryAfter = Math.ceil((resetTime - Date.now()) / 1000);

  return new Response(
    JSON.stringify({
      error: 'Too Many Requests',
      message: 'คุณส่งคำขอมากเกินไป กรุณารอสักครู่แล้วลองใหม่อีกครั้ง',
      retryAfter
    }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': String(retryAfter),
        'X-RateLimit-Limit': '60',
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': String(Math.ceil(resetTime / 1000))
      }
    }
  );
}
