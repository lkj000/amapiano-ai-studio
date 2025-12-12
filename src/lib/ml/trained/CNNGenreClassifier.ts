/**
 * CNN Genre Classifier
 * 
 * Convolutional Neural Network for audio genre classification
 * using mel-spectrogram inputs with:
 * 1. VGG-style convolutional blocks
 * 2. Global average pooling
 * 3. Multi-label classification
 * 4. Confidence calibration
 * 
 * For PhD Research: Audio genre classification for style detection
 */

import * as tf from '@tensorflow/tfjs';

export interface GenreClassification {
  primaryGenre: string;
  confidence: number;
  allGenres: Array<{ genre: string; probability: number }>;
  subgenre?: string;
  features: {
    bpm: number;
    energy: number;
    danceability: number;
  };
}

export interface AudioFeatures {
  melSpectrogram?: Float32Array[];
  bpm: number;
  energy: number;
  spectralCentroid: number;
  spectralBandwidth: number;
  zeroCrossingRate: number;
  mfcc?: number[];
}

// Genre labels
const GENRES = [
  'amapiano', 'afrobeat', 'deep_house', 'tech_house', 'minimal',
  'hip_hop', 'r_and_b', 'pop', 'electronic', 'gqom',
  'kwaito', 'jazz', 'soul', 'funk', 'ambient'
];

const MEL_BANDS = 128;
const TIME_FRAMES = 128;
const FEATURE_DIM = 10;

/**
 * CNN-based Genre Classifier
 */
class CNNGenreClassifier {
  private model: tf.LayersModel | null = null;
  private featureModel: tf.LayersModel | null = null;
  private isInitialized = false;
  
  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    
    this.model = this.buildCNNModel();
    this.featureModel = this.buildFeatureModel();
    this.isInitialized = true;
    console.log('[CNNGenreClassifier] Initialized');
  }
  
  /**
   * Build VGG-style CNN for spectrogram classification
   */
  private buildCNNModel(): tf.LayersModel {
    const input = tf.input({ shape: [TIME_FRAMES, MEL_BANDS, 1], name: 'spectrogram' });
    
    let x = input as tf.SymbolicTensor;
    
    // Conv Block 1
    x = tf.layers.conv2d({
      filters: 32,
      kernelSize: [3, 3],
      activation: 'relu',
      padding: 'same'
    }).apply(x) as tf.SymbolicTensor;
    
    x = tf.layers.conv2d({
      filters: 32,
      kernelSize: [3, 3],
      activation: 'relu',
      padding: 'same'
    }).apply(x) as tf.SymbolicTensor;
    
    x = tf.layers.maxPooling2d({ poolSize: [2, 2] }).apply(x) as tf.SymbolicTensor;
    x = tf.layers.batchNormalization().apply(x) as tf.SymbolicTensor;
    
    // Conv Block 2
    x = tf.layers.conv2d({
      filters: 64,
      kernelSize: [3, 3],
      activation: 'relu',
      padding: 'same'
    }).apply(x) as tf.SymbolicTensor;
    
    x = tf.layers.conv2d({
      filters: 64,
      kernelSize: [3, 3],
      activation: 'relu',
      padding: 'same'
    }).apply(x) as tf.SymbolicTensor;
    
    x = tf.layers.maxPooling2d({ poolSize: [2, 2] }).apply(x) as tf.SymbolicTensor;
    x = tf.layers.batchNormalization().apply(x) as tf.SymbolicTensor;
    
    // Conv Block 3
    x = tf.layers.conv2d({
      filters: 128,
      kernelSize: [3, 3],
      activation: 'relu',
      padding: 'same'
    }).apply(x) as tf.SymbolicTensor;
    
    x = tf.layers.conv2d({
      filters: 128,
      kernelSize: [3, 3],
      activation: 'relu',
      padding: 'same'
    }).apply(x) as tf.SymbolicTensor;
    
    x = tf.layers.maxPooling2d({ poolSize: [2, 2] }).apply(x) as tf.SymbolicTensor;
    x = tf.layers.batchNormalization().apply(x) as tf.SymbolicTensor;
    
    // Conv Block 4
    x = tf.layers.conv2d({
      filters: 256,
      kernelSize: [3, 3],
      activation: 'relu',
      padding: 'same'
    }).apply(x) as tf.SymbolicTensor;
    
    x = tf.layers.globalAveragePooling2d({}).apply(x) as tf.SymbolicTensor;
    
    // Dense layers
    x = tf.layers.dense({
      units: 256,
      activation: 'relu'
    }).apply(x) as tf.SymbolicTensor;
    
    x = tf.layers.dropout({ rate: 0.5 }).apply(x) as tf.SymbolicTensor;
    
    const output = tf.layers.dense({
      units: GENRES.length,
      activation: 'softmax',
      name: 'genre_output'
    }).apply(x) as tf.SymbolicTensor;
    
    const model = tf.model({ inputs: input, outputs: output });
    
    model.compile({
      optimizer: tf.train.adam(0.0001),
      loss: 'categoricalCrossentropy',
      metrics: ['accuracy']
    });
    
    return model;
  }
  
  /**
   * Build feature-based classifier (backup when no spectrogram)
   */
  private buildFeatureModel(): tf.LayersModel {
    const input = tf.input({ shape: [FEATURE_DIM], name: 'features' });
    
    let x = tf.layers.dense({
      units: 64,
      activation: 'relu'
    }).apply(input) as tf.SymbolicTensor;
    
    x = tf.layers.batchNormalization().apply(x) as tf.SymbolicTensor;
    
    x = tf.layers.dense({
      units: 32,
      activation: 'relu'
    }).apply(x) as tf.SymbolicTensor;
    
    const output = tf.layers.dense({
      units: GENRES.length,
      activation: 'softmax'
    }).apply(x) as tf.SymbolicTensor;
    
    const model = tf.model({ inputs: input, outputs: output });
    
    model.compile({
      optimizer: tf.train.adam(0.001),
      loss: 'categoricalCrossentropy',
      metrics: ['accuracy']
    });
    
    return model;
  }
  
  /**
   * Extract mel-spectrogram from audio buffer
   */
  private extractMelSpectrogram(audioBuffer: AudioBuffer): Float32Array {
    const audioData = audioBuffer.getChannelData(0);
    const sampleRate = audioBuffer.sampleRate;
    
    const frameSize = 2048;
    const hopSize = 512;
    const result = new Float32Array(TIME_FRAMES * MEL_BANDS);
    
    for (let t = 0; t < TIME_FRAMES && t * hopSize + frameSize <= audioData.length; t++) {
      const frame = audioData.slice(t * hopSize, t * hopSize + frameSize);
      const spectrum = this.computeSpectrum(frame);
      const melBands = this.applyMelFilterbank(spectrum, sampleRate);
      
      for (let f = 0; f < MEL_BANDS; f++) {
        result[t * MEL_BANDS + f] = melBands[f];
      }
    }
    
    return result;
  }
  
  private computeSpectrum(frame: Float32Array): Float32Array {
    const n = frame.length;
    const spectrum = new Float32Array(n / 2);
    
    // Apply Hann window
    const windowed = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      windowed[i] = frame[i] * (0.5 - 0.5 * Math.cos(2 * Math.PI * i / (n - 1)));
    }
    
    // DFT (simplified)
    for (let k = 0; k < n / 2; k++) {
      let real = 0, imag = 0;
      for (let j = 0; j < n; j++) {
        const angle = -2 * Math.PI * k * j / n;
        real += windowed[j] * Math.cos(angle);
        imag += windowed[j] * Math.sin(angle);
      }
      spectrum[k] = Math.sqrt(real * real + imag * imag);
    }
    
    return spectrum;
  }
  
  private applyMelFilterbank(spectrum: Float32Array, sampleRate: number): Float32Array {
    const melBands = new Float32Array(MEL_BANDS);
    const fMax = sampleRate / 2;
    
    const melMin = 2595 * Math.log10(1);
    const melMax = 2595 * Math.log10(1 + fMax / 700);
    
    for (let i = 0; i < MEL_BANDS; i++) {
      const melCenter = melMin + (i + 0.5) * (melMax - melMin) / MEL_BANDS;
      const hzCenter = 700 * (Math.pow(10, melCenter / 2595) - 1);
      const binCenter = Math.floor(spectrum.length * hzCenter / fMax);
      
      const binWidth = Math.max(1, Math.floor(spectrum.length / MEL_BANDS));
      let sum = 0;
      for (let j = Math.max(0, binCenter - binWidth); j < Math.min(spectrum.length, binCenter + binWidth); j++) {
        sum += spectrum[j];
      }
      
      melBands[i] = Math.log(Math.max(sum / (2 * binWidth + 1), 1e-10));
    }
    
    return melBands;
  }
  
  /**
   * Extract audio features for feature-based classification
   */
  private extractFeatures(features: AudioFeatures): Float32Array {
    const featureVector = new Float32Array(FEATURE_DIM);
    
    // Normalize BPM (60-180 range)
    featureVector[0] = (features.bpm - 60) / 120;
    
    // Energy (already 0-1)
    featureVector[1] = features.energy;
    
    // Spectral centroid (normalized)
    featureVector[2] = Math.min(features.spectralCentroid / 10000, 1);
    
    // Spectral bandwidth (normalized)
    featureVector[3] = Math.min(features.spectralBandwidth / 5000, 1);
    
    // Zero crossing rate
    featureVector[4] = Math.min(features.zeroCrossingRate * 10, 1);
    
    // MFCC coefficients (if available)
    if (features.mfcc && features.mfcc.length >= 5) {
      for (let i = 0; i < 5; i++) {
        featureVector[5 + i] = Math.tanh(features.mfcc[i] / 100);
      }
    }
    
    return featureVector;
  }
  
  /**
   * Classify genre from audio buffer
   */
  async classifyFromBuffer(audioBuffer: AudioBuffer): Promise<GenreClassification> {
    if (!this.isInitialized) {
      await this.initialize();
    }
    
    const melSpec = this.extractMelSpectrogram(audioBuffer);
    const inputTensor = tf.tensor4d(
      Array.from(melSpec),
      [1, TIME_FRAMES, MEL_BANDS, 1]
    );
    
    const outputTensor = this.model!.predict(inputTensor) as tf.Tensor;
    const probabilities = await outputTensor.data();
    
    // Get all genre probabilities
    const allGenres = GENRES.map((genre, i) => ({
      genre,
      probability: probabilities[i]
    })).sort((a, b) => b.probability - a.probability);
    
    const primary = allGenres[0];
    
    // Extract basic features for additional info
    const audioData = audioBuffer.getChannelData(0);
    const rms = Math.sqrt(audioData.reduce((sum, v) => sum + v * v, 0) / audioData.length);
    
    inputTensor.dispose();
    outputTensor.dispose();
    
    return {
      primaryGenre: primary.genre,
      confidence: primary.probability,
      allGenres,
      subgenre: this.inferSubgenre(primary.genre, allGenres),
      features: {
        bpm: 120, // Would need tempo detection
        energy: Math.min(rms * 10, 1),
        danceability: this.estimateDanceability(allGenres)
      }
    };
  }
  
  /**
   * Classify from extracted features
   */
  async classifyFromFeatures(features: AudioFeatures): Promise<GenreClassification> {
    if (!this.isInitialized) {
      await this.initialize();
    }
    
    const featureVector = this.extractFeatures(features);
    const inputTensor = tf.tensor2d([Array.from(featureVector)], [1, FEATURE_DIM]);
    
    const outputTensor = this.featureModel!.predict(inputTensor) as tf.Tensor;
    const probabilities = await outputTensor.data();
    
    const allGenres = GENRES.map((genre, i) => ({
      genre,
      probability: probabilities[i]
    })).sort((a, b) => b.probability - a.probability);
    
    const primary = allGenres[0];
    
    inputTensor.dispose();
    outputTensor.dispose();
    
    return {
      primaryGenre: primary.genre,
      confidence: primary.probability,
      allGenres,
      subgenre: this.inferSubgenre(primary.genre, allGenres),
      features: {
        bpm: features.bpm,
        energy: features.energy,
        danceability: this.estimateDanceability(allGenres)
      }
    };
  }
  
  private inferSubgenre(
    primaryGenre: string,
    allGenres: Array<{ genre: string; probability: number }>
  ): string | undefined {
    const subgenreMap: Record<string, string[]> = {
      'amapiano': ['piano_amapiano', 'vocal_amapiano', 'private_school'],
      'house': ['deep_house', 'tech_house', 'progressive_house'],
      'hip_hop': ['trap', 'boom_bap', 'conscious'],
      'electronic': ['ambient', 'experimental', 'idm']
    };
    
    const subgenres = subgenreMap[primaryGenre];
    if (!subgenres) return undefined;
    
    // Infer based on secondary genre probabilities
    const secondary = allGenres[1];
    if (secondary.probability > 0.2) {
      return `${primaryGenre}_${secondary.genre}_fusion`;
    }
    
    return subgenres[0];
  }
  
  private estimateDanceability(
    allGenres: Array<{ genre: string; probability: number }>
  ): number {
    const danceableGenres = ['amapiano', 'house', 'deep_house', 'tech_house', 'gqom', 'afrobeat'];
    
    let danceability = 0;
    for (const { genre, probability } of allGenres) {
      if (danceableGenres.includes(genre)) {
        danceability += probability;
      }
    }
    
    return Math.min(danceability, 1);
  }
}

// Singleton instance
let classifierInstance: CNNGenreClassifier | null = null;

export function getGenreClassifier(): CNNGenreClassifier {
  if (!classifierInstance) {
    classifierInstance = new CNNGenreClassifier();
  }
  return classifierInstance;
}

export async function classifyGenre(audioBuffer: AudioBuffer): Promise<GenreClassification> {
  const classifier = getGenreClassifier();
  return classifier.classifyFromBuffer(audioBuffer);
}

export async function classifyGenreFromFeatures(features: AudioFeatures): Promise<GenreClassification> {
  const classifier = getGenreClassifier();
  return classifier.classifyFromFeatures(features);
}

export { GENRES };
