/**
 * useMLPredictions Hook
 * 
 * React hook for accessing ML prediction capabilities.
 * Provides real-time genre classification, authenticity scoring,
 * and production suggestions.
 */

import { useState, useCallback, useEffect } from 'react';
import { 
  authenticityModel, 
  trainFromUserStudyData,
  type PredictionResult 
} from '@/lib/ml/authenticityLearning';
import { 
  classifyGenre, 
  generateProductionSuggestions,
  getCachedPrediction,
  optimizeForTarget,
  type AudioFeatures,
  type GenrePrediction,
  type ProductionSuggestion
} from '@/lib/ml/realTimePrediction';
import { calculateFAD, type FADResult } from '@/lib/ml/frechetAudioDistance';
import { semanticSearch, type SearchResult } from '@/lib/ml/vectorEmbeddings';

export interface MLPredictionState {
  isLoading: boolean;
  modelTrained: boolean;
  trainingError: string | null;
  lastPrediction: PredictionResult | null;
  genrePredictions: GenrePrediction[];
  suggestions: ProductionSuggestion[];
}

export function useMLPredictions() {
  const [state, setState] = useState<MLPredictionState>({
    isLoading: false,
    modelTrained: false,
    trainingError: null,
    lastPrediction: null,
    genrePredictions: [],
    suggestions: []
  });

  // Train model on mount
  useEffect(() => {
    const initModel = async () => {
      setState(prev => ({ ...prev, isLoading: true }));
      try {
        await trainFromUserStudyData();
        setState(prev => ({ 
          ...prev, 
          isLoading: false, 
          modelTrained: true 
        }));
      } catch (error) {
        setState(prev => ({ 
          ...prev, 
          isLoading: false, 
          trainingError: error instanceof Error ? error.message : 'Training failed'
        }));
      }
    };

    initModel();
  }, []);

  /**
   * Predict authenticity score for given elements
   */
  const predictAuthenticity = useCallback((
    elements: Record<string, number>,
    region: string
  ): PredictionResult => {
    const prediction = getCachedPrediction(elements, region);
    setState(prev => ({ ...prev, lastPrediction: prediction }));
    return prediction;
  }, []);

  /**
   * Classify genre from audio features
   */
  const classifyAudioGenre = useCallback((
    features: AudioFeatures
  ): GenrePrediction[] => {
    const predictions = classifyGenre(features);
    setState(prev => ({ ...prev, genrePredictions: predictions }));
    return predictions;
  }, []);

  /**
   * Get production suggestions
   */
  const getSuggestions = useCallback((
    elements: Record<string, number>,
    region: string,
    targetScore?: number
  ): ProductionSuggestion[] => {
    const suggestions = generateProductionSuggestions(elements, region, targetScore);
    setState(prev => ({ ...prev, suggestions }));
    return suggestions;
  }, []);

  /**
   * Optimize elements to reach target score
   */
  const optimizeElements = useCallback((
    currentElements: Record<string, number>,
    region: string,
    targetScore: number
  ) => {
    return optimizeForTarget(currentElements, region, targetScore);
  }, []);

  /**
   * Calculate FAD between audio buffers
   */
  const calculateAudioFAD = useCallback((
    originalBuffer: AudioBuffer,
    processedBuffer: AudioBuffer
  ): FADResult => {
    return calculateFAD(originalBuffer, processedBuffer);
  }, []);

  /**
   * Perform semantic search
   */
  const search = useCallback(async (
    query: string,
    documents: Array<{ id: string; text: string }>
  ): Promise<SearchResult[]> => {
    return semanticSearch(query, documents);
  }, []);

  /**
   * Retrain model with latest data
   */
  const retrain = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true }));
    try {
      const { trainingResults } = await trainFromUserStudyData();
      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        modelTrained: true,
        trainingError: null
      }));
      return trainingResults;
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        trainingError: error instanceof Error ? error.message : 'Retraining failed'
      }));
      throw error;
    }
  }, []);

  /**
   * Export trained model
   */
  const exportModel = useCallback(() => {
    return authenticityModel.exportModel();
  }, []);

  /**
   * Import trained model
   */
  const importModel = useCallback((modelJson: string) => {
    return authenticityModel.importModel(modelJson);
  }, []);

  return {
    ...state,
    predictAuthenticity,
    classifyAudioGenre,
    getSuggestions,
    optimizeElements,
    calculateAudioFAD,
    search,
    retrain,
    exportModel,
    importModel
  };
}

/**
 * Lightweight hook for just authenticity predictions
 */
export function useAuthenticityPrediction(
  elements: Record<string, number>,
  region: string
) {
  const [prediction, setPrediction] = useState<PredictionResult | null>(null);

  useEffect(() => {
    const result = getCachedPrediction(elements, region);
    setPrediction(result);
  }, [elements, region]);

  return prediction;
}

/**
 * Hook for genre classification
 */
export function useGenreClassification(features: AudioFeatures | null) {
  const [genres, setGenres] = useState<GenrePrediction[]>([]);

  useEffect(() => {
    if (features) {
      const predictions = classifyGenre(features);
      setGenres(predictions);
    }
  }, [features]);

  return genres;
}
