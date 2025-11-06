import { useState, useCallback, useEffect, useRef } from "react";
import { SparseInferenceCache } from "@/lib/research/SparseInferenceCache";

export const useSparseInferenceCache = (
  maxSizeMB: number = 512,
  sparsityThreshold: number = 0.3
) => {
  const cacheRef = useRef<SparseInferenceCache | null>(null);
  const [stats, setStats] = useState({
    entries: 0,
    totalSizeMB: 0,
    hitRate: 0,
    utilizationPercent: 0
  });
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    cacheRef.current = new SparseInferenceCache(maxSizeMB, sparsityThreshold);
    setIsInitialized(true);

    // Clean expired cache every 5 minutes
    const cleanupInterval = setInterval(() => {
      cacheRef.current?.cleanExpired();
    }, 5 * 60 * 1000);

    return () => {
      clearInterval(cleanupInterval);
      cacheRef.current?.clear();
    };
  }, [maxSizeMB, sparsityThreshold]);

  const processWithCache = useCallback(
    async (
      layerId: string,
      input: Float32Array,
      processFunc: (input: Float32Array) => Promise<Float32Array>
    ): Promise<Float32Array> => {
      if (!cacheRef.current) {
        throw new Error("Cache not initialized");
      }

      const cache = cacheRef.current;
      const inputHash = cache.hashInput(input);
      const key = cache.generateKey(layerId, inputHash);

      // Check cache
      const cached = await cache.get(key);
      if (cached) {
        setStats(cache.getStats());
        return cached;
      }

      // Process if not cached
      const result = await processFunc(input);

      // Store in cache
      await cache.set(key, result);
      setStats(cache.getStats());

      return result;
    },
    []
  );

  const getStats = useCallback(() => {
    if (cacheRef.current) {
      const currentStats = cacheRef.current.getStats();
      setStats(currentStats);
      return currentStats;
    }
    return stats;
  }, [stats]);

  const clearCache = useCallback(() => {
    cacheRef.current?.clear();
    setStats({
      entries: 0,
      totalSizeMB: 0,
      hitRate: 0,
      utilizationPercent: 0
    });
  }, []);

  return {
    isInitialized,
    processWithCache,
    stats,
    getStats,
    clearCache
  };
};
