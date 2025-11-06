import { supabase } from "@/integrations/supabase/client";

export interface CacheEntry {
  key: string;
  data: Float32Array;
  timestamp: number;
  hitCount: number;
}

export class SparseInferenceCache {
  private cache: Map<string, CacheEntry> = new Map();
  private maxSize: number;
  private sessionId: string;
  private sparsityThreshold: number;
  
  constructor(maxSizeMB: number = 512, sparsityThreshold: number = 0.3) {
    this.maxSize = maxSizeMB * 1024 * 1024 / 4; // Convert MB to float32 elements
    this.sessionId = crypto.randomUUID();
    this.sparsityThreshold = sparsityThreshold;
  }

  /**
   * Calculate sparsity of an activation tensor
   */
  private calculateSparsity(data: Float32Array): number {
    let zeroCount = 0;
    for (let i = 0; i < data.length; i++) {
      if (Math.abs(data[i]) < 1e-6) zeroCount++;
    }
    return zeroCount / data.length;
  }

  /**
   * Check if activation should be cached based on sparsity
   */
  private shouldCache(data: Float32Array): boolean {
    return this.calculateSparsity(data) >= this.sparsityThreshold;
  }

  /**
   * Generate cache key from layer ID and input hash
   */
  generateKey(layerId: string, inputHash: string): string {
    return `${layerId}_${inputHash}`;
  }

  /**
   * Hash input data for cache key
   */
  hashInput(input: Float32Array): string {
    let hash = 0;
    const step = Math.max(1, Math.floor(input.length / 100)); // Sample 100 points
    for (let i = 0; i < input.length; i += step) {
      hash = ((hash << 5) - hash) + input[i];
      hash |= 0; // Convert to 32bit integer
    }
    return hash.toString(36);
  }

  /**
   * Get cached activation if available
   */
  async get(key: string): Promise<Float32Array | null> {
    const entry = this.cache.get(key);
    
    if (entry) {
      entry.hitCount++;
      entry.timestamp = Date.now();
      
      // Update hit count in database
      try {
        await supabase.rpc('increment_cache_hit', {
          p_cache_key: key,
          p_session_id: this.sessionId
        });
      } catch (error) {
        console.error('Failed to update cache hit count:', error);
      }
      
      return entry.data;
    }
    
    return null;
  }

  /**
   * Store activation in cache
   */
  async set(key: string, data: Float32Array): Promise<void> {
    // Check if data is sparse enough to cache
    if (!this.shouldCache(data)) {
      return;
    }

    // Evict old entries if cache is full
    if (this.getCurrentSize() + data.length > this.maxSize) {
      this.evictLRU();
    }

    this.cache.set(key, {
      key,
      data: new Float32Array(data),
      timestamp: Date.now(),
      hitCount: 0
    });

    // Store in database for persistence
    try {
      const buffer = new Uint8Array(data.buffer);
      const base64 = btoa(String.fromCharCode(...buffer));
      await supabase.from('sparse_inference_cache').insert({
        session_id: this.sessionId,
        cache_key: key,
        activation_data: base64
      });
    } catch (error) {
      console.error('Failed to persist cache to database:', error);
    }
  }

  /**
   * Get current cache size in elements
   */
  private getCurrentSize(): number {
    let size = 0;
    for (const entry of this.cache.values()) {
      size += entry.data.length;
    }
    return size;
  }

  /**
   * Evict least recently used entries
   */
  private evictLRU(): void {
    const entries = Array.from(this.cache.values());
    entries.sort((a, b) => a.timestamp - b.timestamp);
    
    const toRemove = Math.ceil(entries.length * 0.2); // Remove 20%
    for (let i = 0; i < toRemove; i++) {
      this.cache.delete(entries[i].key);
    }
  }

  /**
   * Get cache statistics
   */
  getStats() {
    let totalHits = 0;
    let totalSize = 0;
    
    for (const entry of this.cache.values()) {
      totalHits += entry.hitCount;
      totalSize += entry.data.length * 4; // bytes
    }
    
    return {
      entries: this.cache.size,
      totalSizeMB: totalSize / (1024 * 1024),
      hitRate: totalHits / Math.max(1, this.cache.size),
      utilizationPercent: (totalSize / (this.maxSize * 4)) * 100
    };
  }

  /**
   * Clear cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Clean expired cache entries from database
   */
  async cleanExpired(): Promise<void> {
    try {
      await supabase.rpc('clean_expired_cache');
    } catch (error) {
      console.error('Failed to clean expired cache:', error);
    }
  }
}
