/**
 * Performance Optimization Utilities
 * Handles caching, lazy loading, and performance monitoring
 */

// Audio file cache with LRU eviction
class AudioCache {
  private cache: Map<string, { data: ArrayBuffer; timestamp: number; size: number }>;
  private maxSize: number;
  private currentSize: number;

  constructor(maxSizeMB: number = 100) {
    this.cache = new Map();
    this.maxSize = maxSizeMB * 1024 * 1024; // Convert to bytes
    this.currentSize = 0;
  }

  set(key: string, data: ArrayBuffer): void {
    const size = data.byteLength;

    // Evict oldest entries if needed
    while (this.currentSize + size > this.maxSize && this.cache.size > 0) {
      this.evictOldest();
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      size
    });
    this.currentSize += size;
  }

  get(key: string): ArrayBuffer | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    // Update timestamp (LRU)
    entry.timestamp = Date.now();
    return entry.data;
  }

  has(key: string): boolean {
    return this.cache.has(key);
  }

  private evictOldest(): void {
    let oldestKey: string | null = null;
    let oldestTime = Infinity;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.timestamp < oldestTime) {
        oldestTime = entry.timestamp;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      const entry = this.cache.get(oldestKey);
      if (entry) {
        this.currentSize -= entry.size;
        this.cache.delete(oldestKey);
      }
    }
  }

  clear(): void {
    this.cache.clear();
    this.currentSize = 0;
  }

  getStats() {
    return {
      entries: this.cache.size,
      sizeMB: this.currentSize / (1024 * 1024),
      maxSizeMB: this.maxSize / (1024 * 1024)
    };
  }
}

// Query result cache with TTL
class QueryCache {
  private cache: Map<string, { data: any; timestamp: number; ttl: number }>;

  constructor() {
    this.cache = new Map();
  }

  set(key: string, data: any, ttlSeconds: number = 300): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlSeconds * 1000
    });
  }

  get(key: string): any | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    // Check if expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  invalidate(pattern?: string): void {
    if (!pattern) {
      this.cache.clear();
      return;
    }

    // Invalidate keys matching pattern
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }

  getStats() {
    return {
      entries: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

// Performance monitoring
class PerformanceMonitor {
  private metrics: Map<string, number[]>;
  private maxSamples: number;

  constructor(maxSamples: number = 100) {
    this.metrics = new Map();
    this.maxSamples = maxSamples;
  }

  record(metricName: string, value: number): void {
    if (!this.metrics.has(metricName)) {
      this.metrics.set(metricName, []);
    }

    const samples = this.metrics.get(metricName)!;
    samples.push(value);

    // Keep only last N samples
    if (samples.length > this.maxSamples) {
      samples.shift();
    }
  }

  getStats(metricName: string) {
    const samples = this.metrics.get(metricName);
    if (!samples || samples.length === 0) {
      return null;
    }

    const sorted = [...samples].sort((a, b) => a - b);
    const sum = samples.reduce((acc, val) => acc + val, 0);

    return {
      count: samples.length,
      min: sorted[0],
      max: sorted[sorted.length - 1],
      avg: sum / samples.length,
      median: sorted[Math.floor(sorted.length / 2)],
      p95: sorted[Math.floor(sorted.length * 0.95)],
      p99: sorted[Math.floor(sorted.length * 0.99)]
    };
  }

  getAllMetrics() {
    const result: Record<string, any> = {};
    for (const metricName of this.metrics.keys()) {
      result[metricName] = this.getStats(metricName);
    }
    return result;
  }

  clear(metricName?: string): void {
    if (metricName) {
      this.metrics.delete(metricName);
    } else {
      this.metrics.clear();
    }
  }
}

// Lazy loader for heavy components
export class LazyLoader {
  private loadingCache: Map<string, Promise<any>>;

  constructor() {
    this.loadingCache = new Map();
  }

  async load<T>(key: string, loader: () => Promise<T>): Promise<T> {
    // Return cached promise if already loading
    if (this.loadingCache.has(key)) {
      return this.loadingCache.get(key)!;
    }

    // Start loading
    const promise = loader();
    this.loadingCache.set(key, promise);

    try {
      const result = await promise;
      return result;
    } finally {
      // Remove from cache after loading completes
      this.loadingCache.delete(key);
    }
  }
}

// Singleton instances
export const audioCache = new AudioCache(100); // 100MB cache
export const queryCache = new QueryCache();
export const performanceMonitor = new PerformanceMonitor();
export const lazyLoader = new LazyLoader();

// Performance utilities
export const measurePerformance = async <T>(
  metricName: string,
  operation: () => Promise<T>
): Promise<T> => {
  const start = performance.now();
  try {
    const result = await operation();
    const duration = performance.now() - start;
    performanceMonitor.record(metricName, duration);
    return result;
  } catch (error) {
    const duration = performance.now() - start;
    performanceMonitor.record(`${metricName}_error`, duration);
    throw error;
  }
};

export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  waitMs: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;

  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), waitMs);
  };
};

export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limitMs: number
): ((...args: Parameters<T>) => void) => {
  let lastRun = 0;

  return (...args: Parameters<T>) => {
    const now = Date.now();
    if (now - lastRun >= limitMs) {
      func(...args);
      lastRun = now;
    }
  };
};
