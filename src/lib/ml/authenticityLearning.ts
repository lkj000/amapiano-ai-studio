/**
 * Authenticity Learning System
 * 
 * Machine learning system that learns authenticity weights from user study data.
 * Replaces hard-coded heuristics with data-driven model.
 * 
 * For PhD Research: Implements learned authenticity scoring
 * transitioning from rule-based to data-driven assessment.
 */

import { supabase } from '@/integrations/supabase/client';

export interface TrainingDataPoint {
  elements: Record<string, number>; // Element scores (0-1)
  region: string;
  userRating: number; // User authenticity rating (1-10)
  experience: string; // User experience level
  familiarity: string; // Amapiano familiarity
}

export interface LearnedWeights {
  region: string;
  weights: Record<string, number>;
  bias: number;
  trainingCount: number;
  mse: number; // Mean squared error
  lastUpdated: Date;
}

export interface PredictionResult {
  score: number;
  confidence: number;
  contributingFactors: Array<{ element: string; contribution: number }>;
}

/**
 * Linear regression model for authenticity prediction
 */
export class AuthenticityLearningModel {
  private weights: Record<string, Record<string, number>> = {};
  private bias: Record<string, number> = {};
  private trainingCounts: Record<string, number> = {};
  private learningRate = 0.01;
  private regularization = 0.001;

  constructor() {
    // Initialize with prior weights (from domain knowledge)
    this.initializeWeights();
  }

  private initializeWeights(): void {
    const regions = ['johannesburg', 'pretoria', 'durban', 'cape-town'];
    const elements = ['logDrum', 'piano', 'percussion', 'bass', 'sidechain', 'filterSweep', 'vocalStyle', 'arrangement'];
    
    // Prior weights based on domain knowledge
    const priors: Record<string, Record<string, number>> = {
      johannesburg: { logDrum: 0.25, piano: 0.20, percussion: 0.12, bass: 0.15, sidechain: 0.10, filterSweep: 0.08, vocalStyle: 0.05, arrangement: 0.05 },
      pretoria: { logDrum: 0.20, piano: 0.28, percussion: 0.10, bass: 0.12, sidechain: 0.08, filterSweep: 0.10, vocalStyle: 0.07, arrangement: 0.05 },
      durban: { logDrum: 0.22, piano: 0.12, percussion: 0.20, bass: 0.18, sidechain: 0.15, filterSweep: 0.05, vocalStyle: 0.03, arrangement: 0.05 },
      'cape-town': { logDrum: 0.18, piano: 0.22, percussion: 0.15, bass: 0.15, sidechain: 0.08, filterSweep: 0.12, vocalStyle: 0.05, arrangement: 0.05 }
    };

    for (const region of regions) {
      this.weights[region] = { ...priors[region] };
      this.bias[region] = 0;
      this.trainingCounts[region] = 0;
    }
  }

  /**
   * Train model on a single data point using online gradient descent
   */
  train(dataPoint: TrainingDataPoint): void {
    const { elements, region, userRating } = dataPoint;
    const normalizedRating = userRating / 10; // Normalize to 0-1

    if (!this.weights[region]) {
      this.weights[region] = {};
      this.bias[region] = 0;
      this.trainingCounts[region] = 0;
    }

    // Forward pass: predict
    const prediction = this.predict(elements, region);
    const error = normalizedRating - prediction.score;

    // Backward pass: update weights with L2 regularization
    for (const [element, value] of Object.entries(elements)) {
      if (this.weights[region][element] === undefined) {
        this.weights[region][element] = 0.1; // Initialize new elements
      }
      
      // Gradient descent with regularization
      const gradient = error * value - this.regularization * this.weights[region][element];
      this.weights[region][element] += this.learningRate * gradient;
      
      // Clamp weights to reasonable range
      this.weights[region][element] = Math.max(0, Math.min(0.5, this.weights[region][element]));
    }

    // Update bias
    this.bias[region] += this.learningRate * error;
    this.trainingCounts[region]++;

    // Normalize weights to sum to ~1
    this.normalizeWeights(region);
  }

  /**
   * Batch training on multiple data points
   */
  trainBatch(dataPoints: TrainingDataPoint[]): { mse: number; samplesProcessed: number } {
    let totalSquaredError = 0;

    for (const dataPoint of dataPoints) {
      const prediction = this.predict(dataPoint.elements, dataPoint.region);
      const normalizedRating = dataPoint.userRating / 10;
      const error = normalizedRating - prediction.score;
      totalSquaredError += error * error;

      this.train(dataPoint);
    }

    return {
      mse: dataPoints.length > 0 ? totalSquaredError / dataPoints.length : 0,
      samplesProcessed: dataPoints.length
    };
  }

  /**
   * Predict authenticity score
   */
  predict(elements: Record<string, number>, region: string): PredictionResult {
    const weights = this.weights[region] || this.weights['johannesburg'];
    const bias = this.bias[region] || 0;

    let score = bias;
    const contributingFactors: Array<{ element: string; contribution: number }> = [];

    for (const [element, value] of Object.entries(elements)) {
      const weight = weights[element] || 0.1;
      const contribution = weight * value;
      score += contribution;
      contributingFactors.push({ element, contribution });
    }

    // Clamp score to 0-1 range
    score = Math.max(0, Math.min(1, score));

    // Calculate confidence based on training data
    const trainingCount = this.trainingCounts[region] || 0;
    const confidence = Math.min(0.95, 0.5 + trainingCount * 0.01);

    // Sort contributing factors by contribution
    contributingFactors.sort((a, b) => b.contribution - a.contribution);

    return {
      score,
      confidence,
      contributingFactors
    };
  }

  /**
   * Normalize weights to sum to approximately 1
   */
  private normalizeWeights(region: string): void {
    const weights = this.weights[region];
    const sum = Object.values(weights).reduce((a, b) => a + b, 0);
    
    if (sum > 0) {
      for (const element of Object.keys(weights)) {
        weights[element] /= sum;
      }
    }
  }

  /**
   * Get current learned weights
   */
  getLearnedWeights(): Record<string, LearnedWeights> {
    const result: Record<string, LearnedWeights> = {};

    for (const region of Object.keys(this.weights)) {
      result[region] = {
        region,
        weights: { ...this.weights[region] },
        bias: this.bias[region],
        trainingCount: this.trainingCounts[region],
        mse: 0, // Would be calculated from validation set
        lastUpdated: new Date()
      };
    }

    return result;
  }

  /**
   * Load weights from persisted storage
   */
  loadWeights(savedWeights: Record<string, LearnedWeights>): void {
    for (const [region, data] of Object.entries(savedWeights)) {
      this.weights[region] = { ...data.weights };
      this.bias[region] = data.bias;
      this.trainingCounts[region] = data.trainingCount;
    }
  }

  /**
   * Export model for persistence
   */
  exportModel(): string {
    return JSON.stringify({
      weights: this.weights,
      bias: this.bias,
      trainingCounts: this.trainingCounts,
      version: '1.0',
      exportedAt: new Date().toISOString()
    });
  }

  /**
   * Import model from persisted data
   */
  importModel(modelJson: string): boolean {
    try {
      const data = JSON.parse(modelJson);
      this.weights = data.weights;
      this.bias = data.bias;
      this.trainingCounts = data.trainingCounts;
      return true;
    } catch {
      console.error('Failed to import model');
      return false;
    }
  }
}

/**
 * Train model from user study responses stored in database
 */
export async function trainFromUserStudyData(): Promise<{
  model: AuthenticityLearningModel;
  trainingResults: { mse: number; samplesProcessed: number };
}> {
  const model = new AuthenticityLearningModel();

  // Fetch user study responses
  const { data: responses, error } = await supabase
    .from('user_study_responses')
    .select('*')
    .order('created_at', { ascending: true });

  if (error || !responses) {
    console.error('Failed to fetch training data:', error);
    return { model, trainingResults: { mse: 0, samplesProcessed: 0 } };
  }

  // Transform responses to training data
  const trainingData: TrainingDataPoint[] = responses.map(response => {
    // Parse the feedback JSON for element information
    const feedback = response.feedback as any || {};
    
    return {
      elements: {
        logDrum: feedback.logDrumScore || 0.5,
        piano: feedback.pianoScore || 0.5,
        percussion: feedback.percussionScore || 0.5,
        bass: feedback.bassScore || 0.5,
        sidechain: feedback.sidechainScore || 0.5,
        filterSweep: feedback.filterScore || 0.5,
        vocalStyle: feedback.vocalScore || 0.5,
        arrangement: feedback.arrangementScore || 0.5
      },
      region: feedback.region || 'johannesburg',
      userRating: response.authenticity_rating || 5,
      experience: (feedback as any).experience || 'intermediate',
      familiarity: (feedback as any).familiarity || 'familiar'
    };
  });

  // Train model
  const trainingResults = model.trainBatch(trainingData);
  
  console.log(`[AuthenticityLearning] Trained on ${trainingResults.samplesProcessed} samples, MSE: ${trainingResults.mse.toFixed(4)}`);

  return { model, trainingResults };
}

/**
 * Get prediction using trained model or fallback to prior weights
 */
export async function predictAuthenticity(
  elements: Record<string, number>,
  region: string
): Promise<PredictionResult> {
  // Try to train from existing data
  const { model } = await trainFromUserStudyData();
  
  return model.predict(elements, region);
}

// Singleton instance for runtime use
export const authenticityModel = new AuthenticityLearningModel();
