/**
 * Authenticity Learning System
 * 
 * Improved ML system with Adam optimizer, validation split,
 * and proper regularization for learning authenticity weights.
 * 
 * For PhD Research: Implements learned authenticity scoring
 * transitioning from rule-based to data-driven assessment.
 */

import { supabase } from '@/integrations/supabase/client';

export interface TrainingDataPoint {
  elements: Record<string, number>;
  region: string;
  userRating: number;
  experience: string;
  familiarity: string;
}

export interface LearnedWeights {
  region: string;
  weights: Record<string, number>;
  bias: number;
  trainingCount: number;
  mse: number;
  validationMse: number;
  lastUpdated: Date;
}

export interface PredictionResult {
  score: number;
  confidence: number;
  contributingFactors: Array<{ element: string; contribution: number }>;
}

interface AdamState {
  m: Record<string, number>;
  v: Record<string, number>;
  t: number;
}

/**
 * Improved Authenticity Learning Model with Adam optimizer
 */
export class AuthenticityLearningModel {
  private weights: Record<string, Record<string, number>> = {};
  private bias: Record<string, number> = {};
  private trainingCounts: Record<string, number> = {};
  private validationMse: Record<string, number> = {};
  
  // Adam optimizer parameters
  private adamState: Record<string, AdamState> = {};
  private learningRate = 0.001;
  private beta1 = 0.9;
  private beta2 = 0.999;
  private epsilon = 1e-8;
  private regularization = 0.0001;
  
  // Validation tracking
  private validationBuffer: Record<string, TrainingDataPoint[]> = {};
  private trainingBuffer: Record<string, TrainingDataPoint[]> = {};
  private validationSplit = 0.2;

  constructor() {
    this.initializeWeights();
  }

  private initializeWeights(): void {
    const regions = ['johannesburg', 'pretoria', 'durban', 'cape-town'];
    const elements = ['logDrum', 'piano', 'percussion', 'bass', 'sidechain', 'filterSweep', 'vocalStyle', 'arrangement'];
    
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
      this.validationMse[region] = 1.0;
      this.validationBuffer[region] = [];
      this.trainingBuffer[region] = [];
      
      // Initialize Adam state
      this.adamState[region] = {
        m: {},
        v: {},
        t: 0
      };
      for (const element of elements) {
        this.adamState[region].m[element] = 0;
        this.adamState[region].v[element] = 0;
      }
      this.adamState[region].m['bias'] = 0;
      this.adamState[region].v['bias'] = 0;
    }
  }

  /**
   * Add data point with train/validation split
   */
  addDataPoint(dataPoint: TrainingDataPoint): void {
    const region = dataPoint.region;
    if (!this.weights[region]) {
      this.initializeRegion(region);
    }
    
    // Split data into training and validation
    if (Math.random() < this.validationSplit) {
      this.validationBuffer[region].push(dataPoint);
    } else {
      this.trainingBuffer[region].push(dataPoint);
      this.trainOnDataPoint(dataPoint);
    }
  }

  private initializeRegion(region: string): void {
    this.weights[region] = { ...this.weights['johannesburg'] };
    this.bias[region] = 0;
    this.trainingCounts[region] = 0;
    this.validationMse[region] = 1.0;
    this.validationBuffer[region] = [];
    this.trainingBuffer[region] = [];
    this.adamState[region] = { m: {}, v: {}, t: 0 };
  }

  /**
   * Train on a single data point using Adam optimizer
   */
  private trainOnDataPoint(dataPoint: TrainingDataPoint): void {
    const { elements, region, userRating } = dataPoint;
    const normalizedRating = userRating / 10;

    const prediction = this.forwardPass(elements, region);
    const error = normalizedRating - prediction;
    
    // Update Adam state
    this.adamState[region].t += 1;
    const t = this.adamState[region].t;
    
    // Calculate gradients and update weights
    for (const [element, value] of Object.entries(elements)) {
      if (this.weights[region][element] === undefined) {
        this.weights[region][element] = 0.1;
        this.adamState[region].m[element] = 0;
        this.adamState[region].v[element] = 0;
      }
      
      // Gradient with L2 regularization
      const gradient = -error * value + this.regularization * this.weights[region][element];
      
      // Adam update
      const m = this.adamState[region].m[element];
      const v = this.adamState[region].v[element];
      
      const newM = this.beta1 * m + (1 - this.beta1) * gradient;
      const newV = this.beta2 * v + (1 - this.beta2) * gradient * gradient;
      
      // Bias correction
      const mHat = newM / (1 - Math.pow(this.beta1, t));
      const vHat = newV / (1 - Math.pow(this.beta2, t));
      
      // Update weight
      this.weights[region][element] -= this.learningRate * mHat / (Math.sqrt(vHat) + this.epsilon);
      
      // Clamp weights
      this.weights[region][element] = Math.max(0, Math.min(0.5, this.weights[region][element]));
      
      // Store Adam state
      this.adamState[region].m[element] = newM;
      this.adamState[region].v[element] = newV;
    }

    // Update bias with Adam
    const biasGradient = -error;
    const biasM = this.adamState[region].m['bias'] || 0;
    const biasV = this.adamState[region].v['bias'] || 0;
    
    const newBiasM = this.beta1 * biasM + (1 - this.beta1) * biasGradient;
    const newBiasV = this.beta2 * biasV + (1 - this.beta2) * biasGradient * biasGradient;
    
    const biasMHat = newBiasM / (1 - Math.pow(this.beta1, t));
    const biasVHat = newBiasV / (1 - Math.pow(this.beta2, t));
    
    this.bias[region] -= this.learningRate * biasMHat / (Math.sqrt(biasVHat) + this.epsilon);
    
    this.adamState[region].m['bias'] = newBiasM;
    this.adamState[region].v['bias'] = newBiasV;
    
    this.trainingCounts[region]++;

    // Normalize weights periodically
    if (this.trainingCounts[region] % 10 === 0) {
      this.normalizeWeights(region);
      this.calculateValidationMse(region);
    }
  }

  /**
   * Forward pass without gradient computation
   */
  private forwardPass(elements: Record<string, number>, region: string): number {
    const weights = this.weights[region] || this.weights['johannesburg'];
    const bias = this.bias[region] || 0;

    let score = bias;
    for (const [element, value] of Object.entries(elements)) {
      const weight = weights[element] || 0.1;
      score += weight * value;
    }

    return Math.max(0, Math.min(1, score));
  }

  /**
   * Calculate MSE on validation set
   */
  private calculateValidationMse(region: string): void {
    const validationData = this.validationBuffer[region];
    if (validationData.length === 0) {
      this.validationMse[region] = 1.0;
      return;
    }

    let totalSquaredError = 0;
    for (const dataPoint of validationData) {
      const prediction = this.forwardPass(dataPoint.elements, region);
      const normalizedRating = dataPoint.userRating / 10;
      const error = normalizedRating - prediction;
      totalSquaredError += error * error;
    }

    this.validationMse[region] = totalSquaredError / validationData.length;
  }

  /**
   * Batch training with multiple epochs
   */
  trainBatch(dataPoints: TrainingDataPoint[], epochs = 5): { 
    trainMse: number; 
    validationMse: number; 
    samplesProcessed: number 
  } {
    // Add all data points (will be split into train/validation)
    for (const dataPoint of dataPoints) {
      this.addDataPoint(dataPoint);
    }

    // Additional epochs on training data
    for (let epoch = 1; epoch < epochs; epoch++) {
      for (const region of Object.keys(this.trainingBuffer)) {
        // Shuffle training data
        const shuffled = [...this.trainingBuffer[region]].sort(() => Math.random() - 0.5);
        for (const dataPoint of shuffled) {
          this.trainOnDataPoint(dataPoint);
        }
      }
    }

    // Calculate final metrics
    let totalTrainMse = 0;
    let totalValidationMse = 0;
    let regionCount = 0;

    for (const region of Object.keys(this.weights)) {
      this.calculateValidationMse(region);
      
      // Calculate training MSE
      let trainError = 0;
      const trainData = this.trainingBuffer[region];
      for (const dataPoint of trainData) {
        const prediction = this.forwardPass(dataPoint.elements, region);
        const error = dataPoint.userRating / 10 - prediction;
        trainError += error * error;
      }
      
      if (trainData.length > 0) {
        totalTrainMse += trainError / trainData.length;
        totalValidationMse += this.validationMse[region];
        regionCount++;
      }
    }

    return {
      trainMse: regionCount > 0 ? totalTrainMse / regionCount : 0,
      validationMse: regionCount > 0 ? totalValidationMse / regionCount : 0,
      samplesProcessed: dataPoints.length
    };
  }

  /**
   * Predict authenticity score with confidence
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

    score = Math.max(0, Math.min(1, score));

    // Calculate confidence based on training data and validation performance
    const trainingCount = this.trainingCounts[region] || 0;
    const validationError = this.validationMse[region] || 1.0;
    
    // Higher training count and lower validation error = higher confidence
    const trainingConfidence = Math.min(0.5, trainingCount * 0.01);
    const validationConfidence = Math.max(0, 0.5 - validationError);
    const confidence = Math.min(0.95, trainingConfidence + validationConfidence);

    contributingFactors.sort((a, b) => b.contribution - a.contribution);

    return { score, confidence, contributingFactors };
  }

  private normalizeWeights(region: string): void {
    const weights = this.weights[region];
    const sum = Object.values(weights).reduce((a, b) => Math.max(0, a) + Math.max(0, b), 0);
    
    if (sum > 0) {
      for (const element of Object.keys(weights)) {
        weights[element] = Math.max(0, weights[element]) / sum;
      }
    }
  }

  getLearnedWeights(): Record<string, LearnedWeights> {
    const result: Record<string, LearnedWeights> = {};

    for (const region of Object.keys(this.weights)) {
      result[region] = {
        region,
        weights: { ...this.weights[region] },
        bias: this.bias[region],
        trainingCount: this.trainingCounts[region],
        mse: 0,
        validationMse: this.validationMse[region],
        lastUpdated: new Date()
      };
    }

    return result;
  }

  loadWeights(savedWeights: Record<string, LearnedWeights>): void {
    for (const [region, data] of Object.entries(savedWeights)) {
      this.weights[region] = { ...data.weights };
      this.bias[region] = data.bias;
      this.trainingCounts[region] = data.trainingCount;
      this.validationMse[region] = data.validationMse || 1.0;
    }
  }

  exportModel(): string {
    return JSON.stringify({
      weights: this.weights,
      bias: this.bias,
      trainingCounts: this.trainingCounts,
      validationMse: this.validationMse,
      adamState: this.adamState,
      version: '2.0',
      exportedAt: new Date().toISOString()
    });
  }

  importModel(modelJson: string): boolean {
    try {
      const data = JSON.parse(modelJson);
      this.weights = data.weights;
      this.bias = data.bias;
      this.trainingCounts = data.trainingCounts;
      this.validationMse = data.validationMse || {};
      if (data.adamState) {
        this.adamState = data.adamState;
      }
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
  trainingResults: { trainMse: number; validationMse: number; samplesProcessed: number };
}> {
  const model = new AuthenticityLearningModel();

  const { data: responses, error } = await supabase
    .from('user_study_responses')
    .select('*')
    .order('created_at', { ascending: true });

  if (error || !responses) {
    console.error('Failed to fetch training data:', error);
    return { model, trainingResults: { trainMse: 0, validationMse: 0, samplesProcessed: 0 } };
  }

  const trainingData: TrainingDataPoint[] = responses.map(response => {
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

  const trainingResults = model.trainBatch(trainingData, 10);
  
  console.log(`[AuthenticityLearning] Trained on ${trainingResults.samplesProcessed} samples`);
  console.log(`  Train MSE: ${trainingResults.trainMse.toFixed(4)}`);
  console.log(`  Validation MSE: ${trainingResults.validationMse.toFixed(4)}`);

  return { model, trainingResults };
}

/**
 * Get prediction using trained model or fallback to prior weights
 */
export async function predictAuthenticity(
  elements: Record<string, number>,
  region: string
): Promise<PredictionResult> {
  const { model } = await trainFromUserStudyData();
  return model.predict(elements, region);
}

// Singleton instance
export const authenticityModel = new AuthenticityLearningModel();
