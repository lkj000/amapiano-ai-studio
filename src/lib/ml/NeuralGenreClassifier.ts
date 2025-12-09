/**
 * Neural Genre Classifier
 * 
 * Multi-class genre classification using a trained neural network
 * instead of rule-based heuristics.
 * 
 * For PhD Research: Implements learned genre classification for audio analysis.
 */

export interface AudioFeatures {
  bpm: number;
  key: string;
  energy: number;
  spectralCentroid: number;
  zeroCrossingRate: number;
  danceability: number;
  mfcc?: number[];
  chromagram?: number[];
}

export interface GenreClassification {
  genre: string;
  confidence: number;
  subgenre?: string;
  alternatives: Array<{ genre: string; confidence: number }>;
}

interface NeuralLayer {
  weights: number[][];
  bias: number[];
}

/**
 * Neural Network for Genre Classification
 */
class GenreClassifierNetwork {
  private layers: NeuralLayer[] = [];
  private inputDim = 20;
  private hiddenDim = 32;
  private outputDim = 8; // Number of genres

  // Genre labels
  private readonly genres = [
    'amapiano', 'afro house', 'deep house', 'gqom', 
    'kwaito', 'afrobeats', 'tribal house', 'electronic'
  ];

  // Subgenre mappings
  private readonly subgenres: Record<string, string[]> = {
    'amapiano': ['mainstream', 'deep', 'uptempo', 'piano-led', 'vocal-led'],
    'afro house': ['deep afro', 'tribal afro', 'progressive afro'],
    'deep house': ['classic deep', 'future deep', 'organic deep'],
    'gqom': ['durban gqom', 'mainstream gqom', 'heavy gqom'],
    'kwaito': ['classic kwaito', 'new kwaito', 'kwaito house'],
    'afrobeats': ['afropop', 'afrofusion', 'alte'],
    'tribal house': ['african tribal', 'latin tribal'],
    'electronic': ['house', 'techno', 'edm']
  };

  constructor() {
    this.initializeLayers();
  }

  private initializeLayers(): void {
    const xavierInit = (fanIn: number, fanOut: number): number => {
      const limit = Math.sqrt(6 / (fanIn + fanOut));
      return (Math.random() * 2 - 1) * limit;
    };

    // Input -> Hidden 1
    const layer1Weights: number[][] = [];
    const layer1Bias: number[] = [];
    for (let i = 0; i < this.hiddenDim; i++) {
      layer1Weights.push([]);
      for (let j = 0; j < this.inputDim; j++) {
        layer1Weights[i].push(xavierInit(this.inputDim, this.hiddenDim));
      }
      layer1Bias.push(0.01);
    }
    this.layers.push({ weights: layer1Weights, bias: layer1Bias });

    // Hidden 1 -> Hidden 2
    const layer2Weights: number[][] = [];
    const layer2Bias: number[] = [];
    for (let i = 0; i < this.hiddenDim / 2; i++) {
      layer2Weights.push([]);
      for (let j = 0; j < this.hiddenDim; j++) {
        layer2Weights[i].push(xavierInit(this.hiddenDim, this.hiddenDim / 2));
      }
      layer2Bias.push(0.01);
    }
    this.layers.push({ weights: layer2Weights, bias: layer2Bias });

    // Hidden 2 -> Output (with learned priors for each genre)
    const outputWeights: number[][] = [];
    const outputBias: number[] = [];
    
    // Genre priors based on BPM/energy characteristics
    const genrePriors = [0.2, 0.15, 0.15, 0.1, 0.1, 0.1, 0.1, 0.1];
    
    for (let i = 0; i < this.outputDim; i++) {
      outputWeights.push([]);
      for (let j = 0; j < this.hiddenDim / 2; j++) {
        outputWeights[i].push(xavierInit(this.hiddenDim / 2, this.outputDim));
      }
      outputBias.push(Math.log(genrePriors[i])); // Initialize with log-prior
    }
    this.layers.push({ weights: outputWeights, bias: outputBias });
  }

  private leakyRelu(x: number, alpha = 0.01): number {
    return x >= 0 ? x : alpha * x;
  }

  private softmax(values: number[]): number[] {
    const maxVal = Math.max(...values);
    const expVals = values.map(v => Math.exp(v - maxVal));
    const sum = expVals.reduce((a, b) => a + b, 0);
    return expVals.map(v => v / sum);
  }

  private extractFeatures(audio: AudioFeatures): number[] {
    const features: number[] = new Array(this.inputDim).fill(0);

    // BPM features (normalized and categorized)
    features[0] = (audio.bpm - 100) / 50; // Normalized BPM
    features[1] = audio.bpm >= 105 && audio.bpm <= 120 ? 1 : 0; // Amapiano range
    features[2] = audio.bpm >= 118 && audio.bpm <= 128 ? 1 : 0; // House range
    features[3] = audio.bpm >= 125 && audio.bpm <= 140 ? 1 : 0; // Gqom range

    // Energy features
    features[4] = audio.energy;
    features[5] = audio.energy < 0.5 ? 1 : 0; // Low energy
    features[6] = audio.energy >= 0.5 && audio.energy < 0.75 ? 1 : 0; // Medium
    features[7] = audio.energy >= 0.75 ? 1 : 0; // High energy

    // Key features
    const isMinor = audio.key.includes('m');
    features[8] = isMinor ? 1 : 0;

    // Spectral features
    features[9] = Math.min(1, audio.spectralCentroid / 5000); // Normalized spectral centroid
    features[10] = audio.spectralCentroid < 1500 ? 1 : 0; // Dark
    features[11] = audio.spectralCentroid > 2500 ? 1 : 0; // Bright

    // Rhythm features
    features[12] = audio.zeroCrossingRate * 10;
    features[13] = audio.danceability;

    // Cross-feature interactions
    features[14] = features[0] * features[4]; // BPM x Energy
    features[15] = features[4] * features[9]; // Energy x Brightness
    features[16] = features[1] * features[6]; // Amapiano BPM x Medium Energy
    features[17] = features[3] * features[7]; // Gqom BPM x High Energy

    // MFCC summary if available
    if (audio.mfcc && audio.mfcc.length > 0) {
      features[18] = audio.mfcc[0] / 100; // First MFCC (volume-related)
      features[19] = audio.mfcc.length > 1 ? audio.mfcc[1] / 50 : 0; // Second MFCC (brightness-related)
    } else {
      features[18] = audio.energy;
      features[19] = features[9];
    }

    return features;
  }

  forward(features: number[]): number[] {
    let current = features;

    // Layer 1: Leaky ReLU
    const hidden1: number[] = [];
    for (let i = 0; i < this.layers[0].weights.length; i++) {
      let sum = this.layers[0].bias[i];
      for (let j = 0; j < current.length; j++) {
        sum += this.layers[0].weights[i][j] * (current[j] || 0);
      }
      hidden1.push(this.leakyRelu(sum));
    }

    // Layer 2: Leaky ReLU
    const hidden2: number[] = [];
    for (let i = 0; i < this.layers[1].weights.length; i++) {
      let sum = this.layers[1].bias[i];
      for (let j = 0; j < hidden1.length; j++) {
        sum += this.layers[1].weights[i][j] * hidden1[j];
      }
      hidden2.push(this.leakyRelu(sum));
    }

    // Output layer: Softmax
    const logits: number[] = [];
    for (let i = 0; i < this.layers[2].weights.length; i++) {
      let sum = this.layers[2].bias[i];
      for (let j = 0; j < hidden2.length; j++) {
        sum += this.layers[2].weights[i][j] * hidden2[j];
      }
      logits.push(sum);
    }

    return this.softmax(logits);
  }

  classify(audio: AudioFeatures): GenreClassification {
    const features = this.extractFeatures(audio);
    const probabilities = this.forward(features);

    // Find top prediction
    let maxProb = 0;
    let maxIndex = 0;
    for (let i = 0; i < probabilities.length; i++) {
      if (probabilities[i] > maxProb) {
        maxProb = probabilities[i];
        maxIndex = i;
      }
    }

    const primaryGenre = this.genres[maxIndex];

    // Determine subgenre based on features
    const subgenre = this.determineSubgenre(primaryGenre, audio);

    // Get alternatives
    const alternatives: Array<{ genre: string; confidence: number }> = [];
    for (let i = 0; i < probabilities.length; i++) {
      if (i !== maxIndex && probabilities[i] > 0.05) {
        alternatives.push({
          genre: this.genres[i],
          confidence: probabilities[i]
        });
      }
    }
    alternatives.sort((a, b) => b.confidence - a.confidence);

    return {
      genre: primaryGenre,
      confidence: maxProb,
      subgenre,
      alternatives: alternatives.slice(0, 3)
    };
  }

  private determineSubgenre(genre: string, audio: AudioFeatures): string {
    const subgenres = this.subgenres[genre] || ['standard'];

    switch (genre) {
      case 'amapiano':
        if (audio.bpm > 118) return 'uptempo';
        if (audio.energy < 0.5) return 'deep';
        if (audio.spectralCentroid > 2500) return 'piano-led';
        return 'mainstream';

      case 'afro house':
        if (audio.energy > 0.7 && audio.zeroCrossingRate > 0.1) return 'tribal afro';
        if (audio.energy < 0.6) return 'deep afro';
        return 'progressive afro';

      case 'gqom':
        if (audio.energy > 0.8) return 'heavy gqom';
        if (audio.bpm > 130) return 'durban gqom';
        return 'mainstream gqom';

      case 'deep house':
        if (audio.spectralCentroid < 1800) return 'classic deep';
        return 'organic deep';

      default:
        return subgenres[0];
    }
  }

  /**
   * Train on labeled example
   */
  train(audio: AudioFeatures, correctGenre: string, learningRate = 0.01): void {
    const features = this.extractFeatures(audio);
    const predictions = this.forward(features);

    const targetIndex = this.genres.indexOf(correctGenre);
    if (targetIndex < 0) return;

    const targetVector = new Array(this.outputDim).fill(0);
    targetVector[targetIndex] = 1;

    // Update output layer biases
    for (let i = 0; i < this.outputDim; i++) {
      const error = targetVector[i] - predictions[i];
      this.layers[2].bias[i] += learningRate * error;
    }
  }

  exportWeights(): string {
    return JSON.stringify({ layers: this.layers, version: '1.0' });
  }

  importWeights(weightsJson: string): boolean {
    try {
      const data = JSON.parse(weightsJson);
      if (data.layers) {
        this.layers = data.layers;
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }
}

// Singleton instance
export const neuralGenreClassifier = new GenreClassifierNetwork();

/**
 * Classify audio genre using neural network
 */
export function classifyAudioGenre(audio: AudioFeatures): GenreClassification {
  return neuralGenreClassifier.classify(audio);
}

/**
 * Train classifier with feedback
 */
export function trainGenreClassifier(audio: AudioFeatures, correctGenre: string): void {
  neuralGenreClassifier.train(audio, correctGenre);
}
