/**
 * Comprehensive Amapiano ML Hook
 * 
 * Unified React hook providing access to all Amapiano AI/ML capabilities:
 * - Feature extraction with scientific parameters
 * - Multi-head genre classification
 * - Authentic element generation
 * - Production rule validation
 * - Authenticity scoring with regional weights
 * 
 * This hook integrates all ML components for easy use in React components.
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { 
  AmapianoFeatureExtractor, 
  AmapianoAudioFeatures,
  extractAmapianoFeatures,
  validateAmapianoAuthenticity,
  AMAPIANO_THRESHOLDS,
  REGIONAL_STYLE_PARAMETERS
} from '@/lib/ml/AmapianoFeatureExtractor';
import {
  AmapianoMultiHeadClassifier,
  ClassificationResult,
  classifyAmapianoAudio
} from '@/lib/ml/AmapianoClassifier';
import {
  AuthenticElementGenerator,
  GeneratedElements,
  generateAmapianoElements
} from '@/lib/ml/AuthenticElementGenerator';
import {
  ProductionRuleEngine,
  ValidationResult,
  validateAmapianoProduction,
  getProductionSuggestions
} from '@/lib/ml/ProductionRuleEngine';
import { authenticityModel, predictAuthenticity } from '@/lib/ml/authenticityLearning';
import { neuralDiscriminator, trainDiscriminatorFromDatabase } from '@/lib/ml/NeuralDiscriminator';

export interface AmapianoMLState {
  isInitialized: boolean;
  isProcessing: boolean;
  error: string | null;
  
  // Feature extraction results
  features: AmapianoAudioFeatures | null;
  
  // Classification results
  classification: ClassificationResult | null;
  
  // Generation results
  generatedElements: GeneratedElements | null;
  
  // Validation results
  validation: ValidationResult | null;
  
  // Authenticity scoring
  authenticityScore: number | null;
  authenticityConfidence: number | null;
}

export interface AmapianoMLActions {
  // Feature extraction
  extractFeatures: (audioBuffer: AudioBuffer) => Promise<AmapianoAudioFeatures>;
  
  // Classification
  classifyAudio: (audioBuffer: AudioBuffer) => Promise<ClassificationResult>;
  classifyFromFeatures: (features: AmapianoAudioFeatures) => ClassificationResult;
  
  // Element generation
  generateElements: (options: {
    region: string;
    bpm: number;
    key: string;
    complexity: number;
    bassStyle?: 'sub' | 'melodic' | 'walking';
  }) => GeneratedElements;
  generateLogDrum: (region: string, bpm: number, complexity: number) => any;
  generatePiano: (key: string, region: string, complexity: number, bars?: number) => any;
  generatePercussion: (region: string, density: number, bpm: number) => any;
  
  // Validation
  validateProduction: (features: AmapianoAudioFeatures, region?: string) => ValidationResult;
  validateElements: (elements: GeneratedElements) => ValidationResult;
  getSuggestions: (features: AmapianoAudioFeatures, region: string) => string[];
  
  // Authenticity
  scoreAuthenticity: (elements: Record<string, number>, region: string) => Promise<{
    score: number;
    confidence: number;
    factors: Array<{ element: string; contribution: number }>;
  }>;
  discriminateAuthenticity: (features: Record<string, number>) => {
    isAuthentic: boolean;
    probability: number;
    confidence: number;
  };
  
  // Training
  trainOnFeedback: (elements: GeneratedElements, rating: number) => void;
  trainDiscriminator: () => Promise<{ loss: number; accuracy: number }>;
  
  // Utilities
  getThresholds: () => typeof AMAPIANO_THRESHOLDS;
  getRegionalStyles: () => typeof REGIONAL_STYLE_PARAMETERS;
  reset: () => void;
}

/**
 * Main Amapiano ML Hook
 */
export function useAmapianoML(): [AmapianoMLState, AmapianoMLActions] {
  const [state, setState] = useState<AmapianoMLState>({
    isInitialized: false,
    isProcessing: false,
    error: null,
    features: null,
    classification: null,
    generatedElements: null,
    validation: null,
    authenticityScore: null,
    authenticityConfidence: null
  });

  // Refs for ML components (singleton instances)
  const featureExtractor = useRef<AmapianoFeatureExtractor | null>(null);
  const classifier = useRef<AmapianoMultiHeadClassifier | null>(null);
  const generator = useRef<AuthenticElementGenerator | null>(null);
  const ruleEngine = useRef<ProductionRuleEngine | null>(null);

  // Initialize components
  useEffect(() => {
    try {
      featureExtractor.current = new AmapianoFeatureExtractor();
      classifier.current = new AmapianoMultiHeadClassifier();
      generator.current = new AuthenticElementGenerator();
      ruleEngine.current = new ProductionRuleEngine();
      
      setState(prev => ({ ...prev, isInitialized: true }));
      console.log('[useAmapianoML] Initialized all ML components');
    } catch (error) {
      console.error('[useAmapianoML] Initialization error:', error);
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Initialization failed' 
      }));
    }
  }, []);

  // Feature extraction
  const extractFeatures = useCallback(async (audioBuffer: AudioBuffer): Promise<AmapianoAudioFeatures> => {
    setState(prev => ({ ...prev, isProcessing: true, error: null }));
    
    try {
      const features = await extractAmapianoFeatures(audioBuffer);
      setState(prev => ({ ...prev, features, isProcessing: false }));
      return features;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Feature extraction failed';
      setState(prev => ({ ...prev, error: message, isProcessing: false }));
      throw error;
    }
  }, []);

  // Audio classification
  const classifyAudio = useCallback(async (audioBuffer: AudioBuffer): Promise<ClassificationResult> => {
    setState(prev => ({ ...prev, isProcessing: true, error: null }));
    
    try {
      const features = await extractAmapianoFeatures(audioBuffer);
      const classification = classifyAmapianoAudio(features);
      setState(prev => ({ 
        ...prev, 
        features, 
        classification, 
        isProcessing: false 
      }));
      return classification;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Classification failed';
      setState(prev => ({ ...prev, error: message, isProcessing: false }));
      throw error;
    }
  }, []);

  // Classification from features
  const classifyFromFeatures = useCallback((features: AmapianoAudioFeatures): ClassificationResult => {
    const classification = classifyAmapianoAudio(features);
    setState(prev => ({ ...prev, classification }));
    return classification;
  }, []);

  // Element generation
  const generateElements = useCallback((options: {
    region: string;
    bpm: number;
    key: string;
    complexity: number;
    bassStyle?: 'sub' | 'melodic' | 'walking';
  }): GeneratedElements => {
    const elements = generateAmapianoElements(options);
    setState(prev => ({ ...prev, generatedElements: elements }));
    return elements;
  }, []);

  const generateLogDrum = useCallback((region: string, bpm: number, complexity: number) => {
    if (!generator.current) throw new Error('Generator not initialized');
    return generator.current.generateLogDrum(region, bpm, complexity);
  }, []);

  const generatePiano = useCallback((key: string, region: string, complexity: number, bars = 4) => {
    if (!generator.current) throw new Error('Generator not initialized');
    return generator.current.generatePiano(key, region, complexity, bars);
  }, []);

  const generatePercussion = useCallback((region: string, density: number, bpm: number) => {
    if (!generator.current) throw new Error('Generator not initialized');
    return generator.current.generatePercussion(region, density, bpm);
  }, []);

  // Production validation
  const validateProduction = useCallback((features: AmapianoAudioFeatures, region?: string): ValidationResult => {
    const validation = validateAmapianoProduction(features, region);
    setState(prev => ({ ...prev, validation }));
    return validation;
  }, []);

  const validateElements = useCallback((elements: GeneratedElements): ValidationResult => {
    if (!ruleEngine.current) throw new Error('Rule engine not initialized');
    const validation = ruleEngine.current.validateElements(elements);
    setState(prev => ({ ...prev, validation }));
    return validation;
  }, []);

  const getSuggestions = useCallback((features: AmapianoAudioFeatures, region: string): string[] => {
    return getProductionSuggestions(features, region);
  }, []);

  // Authenticity scoring
  const scoreAuthenticity = useCallback(async (
    elements: Record<string, number>, 
    region: string
  ): Promise<{
    score: number;
    confidence: number;
    factors: Array<{ element: string; contribution: number }>;
  }> => {
    try {
      const result = await predictAuthenticity(elements, region);
      setState(prev => ({ 
        ...prev, 
        authenticityScore: result.score * 100,
        authenticityConfidence: result.confidence
      }));
      return {
        score: result.score * 100,
        confidence: result.confidence,
        factors: result.contributingFactors
      };
    } catch (error) {
      console.error('[useAmapianoML] Authenticity scoring error:', error);
      return { score: 0, confidence: 0, factors: [] };
    }
  }, []);

  const discriminateAuthenticity = useCallback((features: Record<string, number>) => {
    const result = neuralDiscriminator.discriminate(features);
    return {
      isAuthentic: result.isAuthentic,
      probability: result.probability,
      confidence: result.confidence
    };
  }, []);

  // Training
  const trainOnFeedback = useCallback((elements: GeneratedElements, rating: number) => {
    if (!generator.current) return;
    generator.current.trainOnFeedback(elements, { overallRating: rating });
  }, []);

  const trainDiscriminator = useCallback(async () => {
    const { metrics } = await trainDiscriminatorFromDatabase();
    return metrics;
  }, []);

  // Utilities
  const getThresholds = useCallback(() => AMAPIANO_THRESHOLDS, []);
  const getRegionalStyles = useCallback(() => REGIONAL_STYLE_PARAMETERS, []);

  const reset = useCallback(() => {
    setState({
      isInitialized: true,
      isProcessing: false,
      error: null,
      features: null,
      classification: null,
      generatedElements: null,
      validation: null,
      authenticityScore: null,
      authenticityConfidence: null
    });
  }, []);

  const actions: AmapianoMLActions = {
    extractFeatures,
    classifyAudio,
    classifyFromFeatures,
    generateElements,
    generateLogDrum,
    generatePiano,
    generatePercussion,
    validateProduction,
    validateElements,
    getSuggestions,
    scoreAuthenticity,
    discriminateAuthenticity,
    trainOnFeedback,
    trainDiscriminator,
    getThresholds,
    getRegionalStyles,
    reset
  };

  return [state, actions];
}

/**
 * Lightweight hook for just feature extraction
 */
export function useAmapianoFeatures() {
  const [features, setFeatures] = useState<AmapianoAudioFeatures | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const extract = useCallback(async (audioBuffer: AudioBuffer) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await extractAmapianoFeatures(audioBuffer);
      setFeatures(result);
      return result;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Extraction failed');
      throw e;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { features, extract, isLoading, error };
}

/**
 * Lightweight hook for element generation
 */
export function useAmapianoGenerator() {
  const [elements, setElements] = useState<GeneratedElements | null>(null);
  
  const generate = useCallback((options: {
    region: string;
    bpm: number;
    key: string;
    complexity: number;
  }) => {
    const result = generateAmapianoElements(options);
    setElements(result);
    return result;
  }, []);

  return { elements, generate };
}

/**
 * Lightweight hook for production validation
 */
export function useAmapianoValidation(region: string = 'johannesburg') {
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const ruleEngine = useRef(new ProductionRuleEngine(region));

  useEffect(() => {
    ruleEngine.current.setRegion(region);
  }, [region]);

  const validate = useCallback((features: AmapianoAudioFeatures) => {
    const result = ruleEngine.current.validate(features);
    setValidation(result);
    return result;
  }, []);

  const validateElements = useCallback((elements: GeneratedElements) => {
    const result = ruleEngine.current.validateElements(elements);
    setValidation(result);
    return result;
  }, []);

  return { validation, validate, validateElements };
}

/**
 * Hook for real-time authenticity scoring
 */
export function useAuthenticityScore(region: string = 'johannesburg') {
  const [score, setScore] = useState<number | null>(null);
  const [confidence, setConfidence] = useState<number | null>(null);
  const [factors, setFactors] = useState<Array<{ element: string; contribution: number }>>([]);

  const calculateScore = useCallback(async (elements: Record<string, number>) => {
    try {
      const result = await predictAuthenticity(elements, region);
      setScore(result.score * 100);
      setConfidence(result.confidence);
      setFactors(result.contributingFactors);
      return result;
    } catch (error) {
      console.error('Authenticity scoring failed:', error);
      return null;
    }
  }, [region]);

  return { score, confidence, factors, calculateScore };
}

export default useAmapianoML;
