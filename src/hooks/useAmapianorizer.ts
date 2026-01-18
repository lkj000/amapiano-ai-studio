/**
 * useAmapianorizer Hook
 * 
 * React hook for accessing the Amapianorizer transformation engine
 * with real-time progress tracking and preset management.
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { 
  AmapianorizerTransformer, 
  TransformationRequest, 
  TransformationResult,
  TransformationProgress 
} from '@/lib/audio/amapianorizerTransformer';
import { 
  AmapianorizerPresetName, 
  AmapianorizerTransformPreset,
  AMAPIANORIZER_PRESETS 
} from '@/lib/audio/amapianorizerPresets';

export interface UseAmapianorizerReturn {
  // State
  isTransforming: boolean;
  progress: TransformationProgress | null;
  result: TransformationResult | null;
  error: string | null;
  
  // Actions
  transformTrack: (request: TransformationRequest) => Promise<TransformationResult>;
  previewTransformation: (sourceUrl: string, presetId: AmapianorizerPresetName) => Promise<void>;
  detectBestPreset: (sourceUrl: string) => Promise<{
    recommendedPreset: AmapianorizerPresetName;
    confidence: number;
  }>;
  reset: () => void;
  
  // Presets
  presets: AmapianorizerTransformPreset[];
  getPreset: (id: AmapianorizerPresetName) => AmapianorizerTransformPreset;
  
  // Preview state
  previewResult: { previewUrl: string; estimatedVibeScore: number } | null;
  isPreviewing: boolean;
}

export function useAmapianorizer(): UseAmapianorizerReturn {
  const transformerRef = useRef<AmapianorizerTransformer | null>(null);
  
  const [isTransforming, setIsTransforming] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [progress, setProgress] = useState<TransformationProgress | null>(null);
  const [result, setResult] = useState<TransformationResult | null>(null);
  const [previewResult, setPreviewResult] = useState<{ previewUrl: string; estimatedVibeScore: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Initialize transformer
  useEffect(() => {
    transformerRef.current = new AmapianorizerTransformer();
    
    // Set up progress callback
    transformerRef.current.onProgress((prog) => {
      setProgress(prog);
    });
    
    return () => {
      transformerRef.current?.dispose();
    };
  }, []);
  
  // Transform track with selected preset
  const transformTrack = useCallback(async (request: TransformationRequest): Promise<TransformationResult> => {
    if (!transformerRef.current) {
      throw new Error('Transformer not initialized');
    }
    
    setIsTransforming(true);
    setError(null);
    setResult(null);
    setProgress(null);
    
    try {
      const transformResult = await transformerRef.current.transformTrack(request);
      setResult(transformResult);
      
      if (!transformResult.success && transformResult.error) {
        setError(transformResult.error);
      }
      
      return transformResult;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Transformation failed';
      setError(errorMessage);
      throw err;
    } finally {
      setIsTransforming(false);
    }
  }, []);
  
  // Preview transformation (quick, low-quality)
  const previewTransformation = useCallback(async (
    sourceUrl: string, 
    presetId: AmapianorizerPresetName
  ): Promise<void> => {
    if (!transformerRef.current) {
      throw new Error('Transformer not initialized');
    }
    
    setIsPreviewing(true);
    setPreviewResult(null);
    
    try {
      const preview = await transformerRef.current.previewTransformation(sourceUrl, presetId);
      setPreviewResult(preview);
    } finally {
      setIsPreviewing(false);
    }
  }, []);
  
  // Detect best preset for source audio
  const detectBestPreset = useCallback(async (sourceUrl: string): Promise<{
    recommendedPreset: AmapianorizerPresetName;
    confidence: number;
  }> => {
    if (!transformerRef.current) {
      throw new Error('Transformer not initialized');
    }
    
    const detection = await transformerRef.current.detectBestPreset(sourceUrl);
    return {
      recommendedPreset: detection.recommendedPreset,
      confidence: detection.confidence,
    };
  }, []);
  
  // Reset state
  const reset = useCallback(() => {
    setIsTransforming(false);
    setIsPreviewing(false);
    setProgress(null);
    setResult(null);
    setPreviewResult(null);
    setError(null);
  }, []);
  
  // Get preset by ID
  const getPreset = useCallback((id: AmapianorizerPresetName): AmapianorizerTransformPreset => {
    return AMAPIANORIZER_PRESETS[id];
  }, []);
  
  // Get all presets
  const presets = Object.values(AMAPIANORIZER_PRESETS);
  
  return {
    isTransforming,
    progress,
    result,
    error,
    transformTrack,
    previewTransformation,
    detectBestPreset,
    reset,
    presets,
    getPreset,
    previewResult,
    isPreviewing,
  };
}
