/**
 * Real-Time Feature Extraction Hook (Option 2 MVP)
 * 
 * Professional music analysis using Essentia.js
 * - <500ms analysis for 30-second files
 * - Industry-standard audio feature extraction
 */

import { useState, useEffect, useCallback } from 'react';
import { EssentiaFeatureExtractor, MusicFeatures, createEssentiaExtractor } from '@/lib/wasm/EssentiaFeatureExtractor';

export const useRealtimeFeatureExtraction = () => {
  const [extractor, setExtractor] = useState<EssentiaFeatureExtractor | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [features, setFeatures] = useState<MusicFeatures | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    let mounted = true;
    let featureExtractor: EssentiaFeatureExtractor | null = null;

    const initExtractor = async () => {
      try {
        // Initialize Essentia.js feature extractor
        featureExtractor = await createEssentiaExtractor();

        if (mounted) {
          setExtractor(featureExtractor);
          setIsInitialized(true);
          console.log('[Hook] ✓ Essentia.js music analysis ready');
        }
      } catch (error) {
        console.error('[Hook] Failed to initialize feature extractor:', error);
      }
    };

    initExtractor();

    return () => {
      mounted = false;
      if (featureExtractor) {
        featureExtractor.dispose();
      }
    };
  }, []);

  // Dummy initialize for backwards compatibility (already auto-initialized)
  const initialize = useCallback(async () => {
    console.log('[Hook] Feature extractor already initialized on mount');
  }, []);

  const extractFeatures = useCallback(
    async (audioBuffer: AudioBuffer) => {
      if (!extractor || !isInitialized || isProcessing) return null;

      setIsProcessing(true);
      try {
        const result = await extractor.extractFeatures(audioBuffer);
        setFeatures(result);
        console.log('[Hook] ✓ Features extracted:', {
          bpm: result.bpm,
          key: result.key,
          mood: result.mood,
          time: `${result.processingTime.toFixed(2)}ms`
        });
        return result;
      } catch (error) {
        console.error('[Hook] Feature extraction failed:', error);
        return null;
      } finally {
        setIsProcessing(false);
      }
    },
    [extractor, isInitialized, isProcessing]
  );

  const analyzeAudioFile = useCallback(
    async (url: string) => {
      if (!extractor || !isInitialized) {
        throw new Error('Feature extractor not initialized');
      }

      setIsProcessing(true);
      try {
        const result = await extractor.analyzeAudioFile(url);
        setFeatures(result);
        return result;
      } finally {
        setIsProcessing(false);
      }
    },
    [extractor, isInitialized]
  );

  // Dummy batchExtract for backwards compatibility
  const batchExtract = useCallback(async (audioBuffer: AudioBuffer, onProgress?: (progress: number) => void) => {
    const result = await extractFeatures(audioBuffer);
    if (onProgress) onProgress(1);
    return result ? [result] : [];
  }, [extractFeatures]);

  return {
    extractor,
    isInitialized,
    features,
    isProcessing,
    extractFeatures,
    analyzeAudioFile,
    initialize, // For backwards compatibility
    batchExtract, // For backwards compatibility
    speedupFactor: features ? (30000 / features.processingTime) : 0, // Estimate
    currentFeatures: features,
    featuresHistory: features ? [features] : [],
  };
};
