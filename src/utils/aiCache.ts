/**
 * Simple in-memory cache for AI responses
 * Prevents redundant API calls for identical requests
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class AICache {
  private cache: Map<string, CacheEntry<any>>;
  private maxSize: number;

  constructor(maxSize: number = 100) {
    this.cache = new Map();
    this.maxSize = maxSize;
  }

  /**
   * Generate cache key from request parameters
   */
  private generateKey(params: Record<string, any>): string {
    return JSON.stringify(params, Object.keys(params).sort());
  }

  /**
   * Get cached data if it exists and is not expired
   */
  get<T>(params: Record<string, any>): T | null {
    const key = this.generateKey(params);
    const entry = this.cache.get(key);

    if (!entry) return null;

    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    console.log('✅ Cache hit:', key.slice(0, 50) + '...');
    return entry.data;
  }

  /**
   * Set cache entry with TTL (time to live in ms)
   */
  set<T>(params: Record<string, any>, data: T, ttl: number = 5 * 60 * 1000): void {
    const key = this.generateKey(params);

    // Evict oldest entry if cache is full
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });

    console.log('💾 Cache set:', key.slice(0, 50) + '...');
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
    console.log('🗑️ Cache cleared');
  }

  /**
   * Remove expired entries
   */
  cleanup(): void {
    const now = Date.now();
    let removed = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
        removed++;
      }
    }

    if (removed > 0) {
      console.log(`🧹 Cleaned up ${removed} expired cache entries`);
    }
  }

  /**
   * Get cache stats
   */
  getStats(): { size: number; maxSize: number; hitRate?: number } {
    return {
      size: this.cache.size,
      maxSize: this.maxSize
    };
  }
}

// Export singleton instance
export const aiCache = new AICache();

// Run cleanup every 5 minutes
setInterval(() => aiCache.cleanup(), 5 * 60 * 1000);
