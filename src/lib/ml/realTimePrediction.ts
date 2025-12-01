/**
 * Real-Time Prediction System
 * 
 * Provides real-time ML predictions for audio features,
 * genre classification, and production suggestions.
 * 
 * Uses lightweight models for instant feedback.
 */

import { authenticityModel, type PredictionResult } from './authenticityLearning';

export interface AudioFeatures {
  bpm?: number;
  key?: string;
  energy?: number;
  danceability?: number;
  spectralCentroid?: number;
  spectralRolloff?: number;
  zeroCrossingRate?: number;
  rms?: number;
}

export interface GenrePrediction {
  genre: string;
  confidence: number;
  subgenre?: string;
}

export interface ProductionSuggestion {
  type: 'add' | 'remove' | 'adjust';
  element: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  expectedImpact: number; // 0-1
}

/**
 * Lightweight genre classifier using audio features
 */
export function classifyGenre(features: AudioFeatures): GenrePrediction[] {
  const predictions: GenrePrediction[] = [];
  const { bpm, energy, spectralCentroid, danceability } = features;

  // Amapiano detection
  let amapianoScore = 0;
  if (bpm && bpm >= 110 && bpm <= 125) amapianoScore += 0.3;
  if (bpm && bpm >= 113 && bpm <= 120) amapianoScore += 0.2;
  if (energy && energy > 0.5 && energy < 0.8) amapianoScore += 0.2;
  if (danceability && danceability > 0.6) amapianoScore += 0.2;
  if (spectralCentroid && spectralCentroid > 1000 && spectralCentroid < 3000) amapianoScore += 0.1;

  if (amapianoScore > 0.3) {
    let subgenre = 'mainstream';
    if (bpm && bpm > 118) subgenre = 'uptempo';
    if (energy && energy < 0.6) subgenre = 'deep';
    
    predictions.push({
      genre: 'Amapiano',
      confidence: Math.min(amapianoScore, 0.95),
      subgenre
    });
  }

  // Afro House detection
  let afroHouseScore = 0;
  if (bpm && bpm >= 118 && bpm <= 128) afroHouseScore += 0.3;
  if (energy && energy > 0.6) afroHouseScore += 0.2;
  if (danceability && danceability > 0.7) afroHouseScore += 0.2;

  if (afroHouseScore > 0.3) {
    predictions.push({
      genre: 'Afro House',
      confidence: afroHouseScore
    });
  }

  // Deep House detection
  let deepHouseScore = 0;
  if (bpm && bpm >= 115 && bpm <= 125) deepHouseScore += 0.2;
  if (energy && energy > 0.4 && energy < 0.7) deepHouseScore += 0.3;
  if (spectralCentroid && spectralCentroid < 2000) deepHouseScore += 0.2;

  if (deepHouseScore > 0.3) {
    predictions.push({
      genre: 'Deep House',
      confidence: deepHouseScore
    });
  }

  // Gqom detection
  let gqomScore = 0;
  if (bpm && bpm >= 120 && bpm <= 130) gqomScore += 0.2;
  if (energy && energy > 0.7) gqomScore += 0.3;
  if (spectralCentroid && spectralCentroid > 2500) gqomScore += 0.2;

  if (gqomScore > 0.3) {
    predictions.push({
      genre: 'Gqom',
      confidence: gqomScore
    });
  }

  // Sort by confidence
  predictions.sort((a, b) => b.confidence - a.confidence);
  
  return predictions.length > 0 ? predictions : [{
    genre: 'Unknown',
    confidence: 0.5
  }];
}

/**
 * Generate production suggestions based on authenticity analysis
 */
export function generateProductionSuggestions(
  currentElements: Record<string, number>,
  region: string,
  targetScore?: number
): ProductionSuggestion[] {
  const suggestions: ProductionSuggestion[] = [];
  const prediction = authenticityModel.predict(currentElements, region);
  const target = targetScore || 0.85;

  // Find elements that need improvement
  const sortedFactors = [...prediction.contributingFactors]
    .sort((a, b) => a.contribution - b.contribution);

  // Get regional weights for context
  const regionalWeights: Record<string, Record<string, number>> = {
    johannesburg: { logDrum: 0.25, piano: 0.20, percussion: 0.12, bass: 0.15 },
    pretoria: { logDrum: 0.20, piano: 0.28, percussion: 0.10, bass: 0.12 },
    durban: { logDrum: 0.22, piano: 0.12, percussion: 0.20, bass: 0.18 },
    'cape-town': { logDrum: 0.18, piano: 0.22, percussion: 0.15, bass: 0.15 }
  };
  const weights = regionalWeights[region] || regionalWeights.johannesburg;

  // Generate suggestions for low-scoring elements
  for (const factor of sortedFactors) {
    const elementScore = currentElements[factor.element] || 0;
    const elementWeight = weights[factor.element] || 0.1;

    if (elementScore < 0.5 && elementWeight > 0.1) {
      const descriptions: Record<string, string> = {
        logDrum: `Add authentic ${region} style log drum patterns with proper syncopation`,
        piano: `Incorporate ${region === 'pretoria' ? 'jazz-influenced' : 'gospel-style'} piano voicings`,
        percussion: `Layer ${region === 'durban' ? 'aggressive tribal' : 'subtle shaker'} percussion`,
        bass: `Deepen sub-bass presence with ${region === 'johannesburg' ? 'deep' : 'melodic'} basslines`,
        sidechain: `Apply ${region === 'durban' ? 'heavy' : 'subtle'} sidechain compression`,
        filterSweep: `Add filter sweeps for ${region === 'cape-town' ? 'atmospheric' : 'build-up'} effect`
      };

      suggestions.push({
        type: 'add',
        element: factor.element,
        description: descriptions[factor.element] || `Enhance ${factor.element}`,
        priority: elementWeight > 0.2 ? 'high' : elementWeight > 0.15 ? 'medium' : 'low',
        expectedImpact: elementWeight * (1 - elementScore)
      });
    } else if (elementScore > 0.8 && factor.contribution < 0) {
      // Element might be overdone
      suggestions.push({
        type: 'adjust',
        element: factor.element,
        description: `Balance ${factor.element} - currently may be overpowering the mix`,
        priority: 'low',
        expectedImpact: 0.05
      });
    }
  }

  // Sort by expected impact
  suggestions.sort((a, b) => b.expectedImpact - a.expectedImpact);

  // Add general suggestions if score is low
  if (prediction.score < target) {
    const gap = target - prediction.score;
    
    if (gap > 0.3) {
      suggestions.unshift({
        type: 'add',
        element: 'overall',
        description: `Track needs significant enhancement for ${region} authenticity`,
        priority: 'high',
        expectedImpact: gap
      });
    }
  }

  return suggestions.slice(0, 5); // Top 5 suggestions
}

/**
 * Predict optimal BPM range for genre
 */
export function predictOptimalBPM(genre: string): { min: number; max: number; optimal: number } {
  const bpmRanges: Record<string, { min: number; max: number; optimal: number }> = {
    amapiano: { min: 110, max: 125, optimal: 115 },
    'afro house': { min: 118, max: 128, optimal: 122 },
    'deep house': { min: 115, max: 125, optimal: 120 },
    gqom: { min: 120, max: 130, optimal: 125 },
    kwaito: { min: 95, max: 115, optimal: 105 }
  };

  return bpmRanges[genre.toLowerCase()] || { min: 110, max: 130, optimal: 120 };
}

/**
 * Real-time authenticity prediction with caching
 */
const predictionCache = new Map<string, { result: PredictionResult; timestamp: number }>();
const CACHE_TTL = 5000; // 5 seconds

export function getCachedPrediction(
  elements: Record<string, number>,
  region: string
): PredictionResult {
  const cacheKey = `${region}:${JSON.stringify(elements)}`;
  const cached = predictionCache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.result;
  }

  const result = authenticityModel.predict(elements, region);
  predictionCache.set(cacheKey, { result, timestamp: Date.now() });
  
  // Clean old cache entries
  if (predictionCache.size > 100) {
    const now = Date.now();
    for (const [key, value] of predictionCache.entries()) {
      if (now - value.timestamp > CACHE_TTL) {
        predictionCache.delete(key);
      }
    }
  }

  return result;
}

/**
 * Batch prediction for multiple configurations
 */
export function batchPredict(
  configurations: Array<{ elements: Record<string, number>; region: string }>
): PredictionResult[] {
  return configurations.map(config => 
    authenticityModel.predict(config.elements, config.region)
  );
}

/**
 * Find optimal element configuration for target score
 */
export function optimizeForTarget(
  currentElements: Record<string, number>,
  region: string,
  targetScore: number,
  maxIterations = 50
): { optimizedElements: Record<string, number>; finalScore: number; iterations: number } {
  let elements = { ...currentElements };
  let iterations = 0;
  
  while (iterations < maxIterations) {
    const prediction = authenticityModel.predict(elements, region);
    
    if (prediction.score >= targetScore) {
      return {
        optimizedElements: elements,
        finalScore: prediction.score,
        iterations
      };
    }

    // Find lowest contributing factor and increase it
    const sortedFactors = [...prediction.contributingFactors]
      .sort((a, b) => a.contribution - b.contribution);
    
    const lowestFactor = sortedFactors[0];
    if (lowestFactor && elements[lowestFactor.element] !== undefined) {
      elements[lowestFactor.element] = Math.min(1, elements[lowestFactor.element] + 0.1);
    }

    iterations++;
  }

  const finalPrediction = authenticityModel.predict(elements, region);
  return {
    optimizedElements: elements,
    finalScore: finalPrediction.score,
    iterations
  };
}
