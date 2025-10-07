/**
 * Rate Limiting Middleware for Edge Functions
 * Prevents abuse and ensures fair usage across all API endpoints
 */

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  identifier?: string; // user_id, ip, or custom identifier
}

interface RateLimitStore {
  count: number;
  resetTime: number;
}

// In-memory store for rate limiting (per function instance)
const rateLimitStore = new Map<string, RateLimitStore>();

/**
 * Rate limiter middleware
 * @param config Rate limit configuration
 * @param identifier Unique identifier for rate limiting (user_id, ip, etc)
 * @returns Whether the request is allowed
 */
export async function checkRateLimit(
  config: RateLimitConfig,
  identifier: string
): Promise<{ allowed: boolean; resetTime?: number; remaining?: number }> {
  const now = Date.now();
  const key = `${config.identifier || 'default'}:${identifier}`;
  
  // Get or create rate limit entry
  let entry = rateLimitStore.get(key);
  
  // Reset if window has expired
  if (!entry || now >= entry.resetTime) {
    entry = {
      count: 0,
      resetTime: now + config.windowMs,
    };
    rateLimitStore.set(key, entry);
  }
  
  // Increment request count
  entry.count++;
  
  // Check if limit exceeded
  if (entry.count > config.maxRequests) {
    return {
      allowed: false,
      resetTime: entry.resetTime,
      remaining: 0,
    };
  }
  
  return {
    allowed: true,
    resetTime: entry.resetTime,
    remaining: config.maxRequests - entry.count,
  };
}

/**
 * Create rate limit response headers
 */
export function getRateLimitHeaders(
  limit: number,
  remaining: number,
  resetTime: number
): Record<string, string> {
  return {
    'X-RateLimit-Limit': limit.toString(),
    'X-RateLimit-Remaining': remaining.toString(),
    'X-RateLimit-Reset': resetTime.toString(),
  };
}

/**
 * Default rate limit configurations by function type
 */
export const RATE_LIMITS = {
  // AI generation endpoints - more restrictive
  AI_GENERATION: {
    maxRequests: 10,
    windowMs: 60 * 1000, // 10 requests per minute
    identifier: 'ai_generation',
  },
  
  // Standard API endpoints
  STANDARD: {
    maxRequests: 100,
    windowMs: 60 * 1000, // 100 requests per minute
    identifier: 'standard',
  },
  
  // Read-only endpoints - more lenient
  READ_ONLY: {
    maxRequests: 200,
    windowMs: 60 * 1000, // 200 requests per minute
    identifier: 'read_only',
  },
  
  // Authentication endpoints
  AUTH: {
    maxRequests: 5,
    windowMs: 5 * 60 * 1000, // 5 requests per 5 minutes
    identifier: 'auth',
  },
};

/**
 * Clean up old entries (call periodically)
 */
export function cleanupRateLimitStore() {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now >= entry.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}

// Auto-cleanup every 5 minutes
setInterval(cleanupRateLimitStore, 5 * 60 * 1000);
