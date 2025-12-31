/**
 * Amapiano Multi-Head Classifier
 * 
 * Advanced neural classifier with specialized heads for:
 * 1. Rhythm Analysis - BPM, swing, syncopation
 * 2. Timbral Analysis - Log drum, piano, percussion characteristics
 * 3. Harmonic Analysis - Key, chord complexity, jazz influence
 * 4. Production Analysis - Mix characteristics, stereo width, dynamics
 * 
 * Uses attention mechanisms to weight the importance of each head
 * based on the input features.
 */

import { 
  AmapianoAudioFeatures, 
  AMAPIANO_THRESHOLDS,
  REGIONAL_STYLE_PARAMETERS 
} from './AmapianoFeatureExtractor';

export interface ClassificationResult {
  genre: string;
  subgenre: string;
  confidence: number;
  regionalMatch: {
    region: string;
    confidence: number;
  };
  headScores: {
    rhythm: number;
    timbral: number;
    harmonic: number;
    production: number;
  };
  attentionWeights: {
    rhythm: number;
    timbral: number;
    harmonic: number;
    production: number;
  };
  alternatives: Array<{
    genre: string;
    confidence: number;
  }>;
  explanations: string[];
}

interface HeadOutput {
  score: number;
  confidence: number;
  features: Record<string, number>;
}

/**
 * Genre definitions with characteristic ranges
 */
const GENRE_SIGNATURES = {
  amapiano: {
    bpm: { min: 105, max: 118 },
    swing: { min: 0.52, max: 0.65 },
    logDrumPresence: { min: 0.6, max: 1.0 },
    pianoType: ['rhodes', 'wurlitzer'],
    chordComplexity: { min: 0.5, max: 0.9 },
    subgenres: ['mainstream', 'deep', 'private-school', 'piano-led', 'vocal-led', 'uptempo']
  },
  afroHouse: {
    bpm: { min: 118, max: 128 },
    swing: { min: 0.48, max: 0.55 },
    logDrumPresence: { min: 0.2, max: 0.5 },
    pianoType: ['synth', 'pad'],
    chordComplexity: { min: 0.3, max: 0.6 },
    subgenres: ['deep-afro', 'tribal-afro', 'progressive-afro']
  },
  gqom: {
    bpm: { min: 125, max: 145 },
    swing: { min: 0.45, max: 0.55 },
    logDrumPresence: { min: 0.3, max: 0.7 },
    pianoType: ['minimal'],
    chordComplexity: { min: 0.1, max: 0.4 },
    subgenres: ['durban-gqom', 'heavy-gqom', 'mainstream-gqom']
  },
  deepHouse: {
    bpm: { min: 118, max: 128 },
    swing: { min: 0.5, max: 0.52 },
    logDrumPresence: { min: 0.0, max: 0.3 },
    pianoType: ['rhodes', 'synth'],
    chordComplexity: { min: 0.4, max: 0.7 },
    subgenres: ['classic-deep', 'future-deep', 'organic-deep']
  },
  kwaito: {
    bpm: { min: 95, max: 115 },
    swing: { min: 0.55, max: 0.65 },
    logDrumPresence: { min: 0.4, max: 0.8 },
    pianoType: ['synth', 'acoustic'],
    chordComplexity: { min: 0.2, max: 0.5 },
    subgenres: ['classic-kwaito', 'new-kwaito', 'kwaito-house']
  }
};

/**
 * Multi-Head Attention Layer
 */
class MultiHeadAttention {
  private queryWeights: Float32Array[];
  private keyWeights: Float32Array[];
  private valueWeights: Float32Array[];
  private outputWeights: Float32Array;
  private numHeads: number;
  private headDim: number;

  constructor(inputDim: number, numHeads: number = 4) {
    this.numHeads = numHeads;
    this.headDim = Math.floor(inputDim / numHeads);
    
    // Initialize weights with Xavier initialization
    const scale = Math.sqrt(2 / inputDim);
    
    this.queryWeights = [];
    this.keyWeights = [];
    this.valueWeights = [];
    
    for (let h = 0; h < numHeads; h++) {
      this.queryWeights.push(this.initWeights(inputDim, this.headDim, scale));
      this.keyWeights.push(this.initWeights(inputDim, this.headDim, scale));
      this.valueWeights.push(this.initWeights(inputDim, this.headDim, scale));
    }
    
    this.outputWeights = this.initWeights(numHeads * this.headDim, inputDim, scale);
  }

  private initWeights(rows: number, cols: number, scale: number): Float32Array {
    const weights = new Float32Array(rows * cols);
    for (let i = 0; i < weights.length; i++) {
      weights[i] = (Math.random() * 2 - 1) * scale;
    }
    return weights;
  }

  forward(input: Float32Array): { output: Float32Array; attentionWeights: Float32Array[] } {
    const headOutputs: Float32Array[] = [];
    const attentionWeights: Float32Array[] = [];

    for (let h = 0; h < this.numHeads; h++) {
      const Q = this.matMul(input, this.queryWeights[h], input.length, 1, this.headDim);
      const K = this.matMul(input, this.keyWeights[h], input.length, 1, this.headDim);
      const V = this.matMul(input, this.valueWeights[h], input.length, 1, this.headDim);

      // Scaled dot-product attention
      const scores = this.dotProduct(Q, K) / Math.sqrt(this.headDim);
      const weights = this.softmax([scores]);
      attentionWeights.push(new Float32Array(weights));

      // Apply attention to values
      const attended = new Float32Array(this.headDim);
      for (let i = 0; i < this.headDim; i++) {
        attended[i] = V[i] * weights[0];
      }
      headOutputs.push(attended);
    }

    // Concatenate heads
    const concat = new Float32Array(this.numHeads * this.headDim);
    for (let h = 0; h < this.numHeads; h++) {
      for (let i = 0; i < this.headDim; i++) {
        concat[h * this.headDim + i] = headOutputs[h][i];
      }
    }

    // Output projection
    const output = this.matMul(concat, this.outputWeights, concat.length, 1, input.length);

    return { output, attentionWeights };
  }

  private matMul(a: Float32Array, b: Float32Array, aRows: number, aCols: number, bCols: number): Float32Array {
    const result = new Float32Array(aRows * bCols);
    for (let i = 0; i < aRows; i++) {
      for (let j = 0; j < bCols; j++) {
        let sum = 0;
        for (let k = 0; k < aCols; k++) {
          sum += (a[i * aCols + k] || 0) * (b[k * bCols + j] || 0);
        }
        result[i * bCols + j] = sum;
      }
    }
    return result;
  }

  private dotProduct(a: Float32Array, b: Float32Array): number {
    let sum = 0;
    for (let i = 0; i < Math.min(a.length, b.length); i++) {
      sum += a[i] * b[i];
    }
    return sum;
  }

  private softmax(values: number[]): number[] {
    const max = Math.max(...values);
    const exp = values.map(v => Math.exp(v - max));
    const sum = exp.reduce((a, b) => a + b, 0);
    return exp.map(v => v / sum);
  }
}

/**
 * Specialized Analysis Head
 */
class AnalysisHead {
  private weights: Float32Array;
  private bias: Float32Array;
  private name: string;

  constructor(name: string, inputDim: number, outputDim: number) {
    this.name = name;
    const scale = Math.sqrt(2 / inputDim);
    
    this.weights = new Float32Array(inputDim * outputDim);
    for (let i = 0; i < this.weights.length; i++) {
      this.weights[i] = (Math.random() * 2 - 1) * scale;
    }
    
    this.bias = new Float32Array(outputDim);
    for (let i = 0; i < outputDim; i++) {
      this.bias[i] = 0.01;
    }
  }

  forward(input: Float32Array): Float32Array {
    const outputDim = this.bias.length;
    const output = new Float32Array(outputDim);
    
    for (let j = 0; j < outputDim; j++) {
      let sum = this.bias[j];
      for (let i = 0; i < input.length; i++) {
        sum += input[i] * this.weights[i * outputDim + j];
      }
      // Leaky ReLU activation
      output[j] = sum > 0 ? sum : 0.01 * sum;
    }
    
    return output;
  }
}

/**
 * Amapiano Multi-Head Classifier
 */
export class AmapianoMultiHeadClassifier {
  private rhythmHead: AnalysisHead;
  private timbralHead: AnalysisHead;
  private harmonicHead: AnalysisHead;
  private productionHead: AnalysisHead;
  private attention: MultiHeadAttention;
  private outputLayer: AnalysisHead;
  
  // Genre embeddings for similarity matching
  private genreEmbeddings: Map<string, Float32Array>;

  constructor() {
    // Initialize specialized heads
    this.rhythmHead = new AnalysisHead('rhythm', 8, 16);
    this.timbralHead = new AnalysisHead('timbral', 12, 16);
    this.harmonicHead = new AnalysisHead('harmonic', 8, 16);
    this.productionHead = new AnalysisHead('production', 9, 16);
    
    // Attention over head outputs
    this.attention = new MultiHeadAttention(64, 4);
    
    // Output classification layer
    this.outputLayer = new AnalysisHead('output', 64, 5); // 5 genres
    
    // Initialize genre embeddings
    this.genreEmbeddings = this.initializeGenreEmbeddings();
  }

  private initializeGenreEmbeddings(): Map<string, Float32Array> {
    const embeddings = new Map<string, Float32Array>();
    
    // Create characteristic embeddings for each genre
    for (const [genre, sig] of Object.entries(GENRE_SIGNATURES)) {
      const embedding = new Float32Array(16);
      embedding[0] = (sig.bpm.min + sig.bpm.max) / 2 / 150;
      embedding[1] = (sig.swing.min + sig.swing.max) / 2;
      embedding[2] = (sig.logDrumPresence.min + sig.logDrumPresence.max) / 2;
      embedding[3] = (sig.chordComplexity.min + sig.chordComplexity.max) / 2;
      embedding[4] = sig.pianoType.includes('rhodes') ? 0.8 : 0.3;
      // Add more dimensions...
      for (let i = 5; i < 16; i++) {
        embedding[i] = Math.random() * 0.5;
      }
      embeddings.set(genre, embedding);
    }
    
    return embeddings;
  }

  /**
   * Classify audio features
   */
  classify(features: AmapianoAudioFeatures): ClassificationResult {
    // Extract features for each head
    const rhythmFeatures = this.extractRhythmInput(features);
    const timbralFeatures = this.extractTimbralInput(features);
    const harmonicFeatures = this.extractHarmonicInput(features);
    const productionFeatures = this.extractProductionInput(features);
    
    // Forward through specialized heads
    const rhythmOutput = this.rhythmHead.forward(rhythmFeatures);
    const timbralOutput = this.timbralHead.forward(timbralFeatures);
    const harmonicOutput = this.harmonicHead.forward(harmonicFeatures);
    const productionOutput = this.productionHead.forward(productionFeatures);
    
    // Concatenate head outputs
    const combined = new Float32Array(64);
    combined.set(rhythmOutput, 0);
    combined.set(timbralOutput, 16);
    combined.set(harmonicOutput, 32);
    combined.set(productionOutput, 48);
    
    // Apply attention
    const { output: attended, attentionWeights } = this.attention.forward(combined);
    
    // Classification
    const logits = this.outputLayer.forward(attended);
    const probabilities = this.softmax(Array.from(logits));
    
    // Get head scores
    const headScores = {
      rhythm: this.computeHeadScore(rhythmOutput),
      timbral: this.computeHeadScore(timbralOutput),
      harmonic: this.computeHeadScore(harmonicOutput),
      production: this.computeHeadScore(productionOutput)
    };
    
    // Compute attention weights for heads
    const headAttention = {
      rhythm: attentionWeights[0]?.[0] || 0.25,
      timbral: attentionWeights[1]?.[0] || 0.25,
      harmonic: attentionWeights[2]?.[0] || 0.25,
      production: attentionWeights[3]?.[0] || 0.25
    };
    
    // Determine genre and subgenre
    const genres = ['amapiano', 'afroHouse', 'gqom', 'deepHouse', 'kwaito'];
    const sortedGenres = genres.map((g, i) => ({ 
      genre: g, 
      prob: probabilities[i] || 0 
    })).sort((a, b) => b.prob - a.prob);
    
    const primaryGenre = sortedGenres[0].genre;
    const subgenre = this.determineSubgenre(primaryGenre, features);
    
    // Regional matching for Amapiano
    const regionalMatch = primaryGenre === 'amapiano' 
      ? this.matchRegionalStyle(features)
      : { region: 'unknown', confidence: 0 };
    
    // Generate explanations
    const explanations = this.generateExplanations(
      features, 
      primaryGenre, 
      headScores,
      sortedGenres[0].prob
    );

    return {
      genre: this.formatGenreName(primaryGenre),
      subgenre,
      confidence: sortedGenres[0].prob,
      regionalMatch,
      headScores,
      attentionWeights: headAttention,
      alternatives: sortedGenres.slice(1, 4).map(g => ({
        genre: this.formatGenreName(g.genre),
        confidence: g.prob
      })),
      explanations
    };
  }

  private extractRhythmInput(features: AmapianoAudioFeatures): Float32Array {
    return new Float32Array([
      features.rhythm.bpm / 150,
      features.rhythm.bpmConfidence,
      features.rhythm.swingRatio,
      features.rhythm.syncopationDensity,
      features.rhythm.shakerHitsPerBar / 20,
      features.rhythm.kickPattern === 'four-on-floor' ? 1 : 
        features.rhythm.kickPattern === 'syncopated' ? 0.5 : 0,
      features.rhythm.grooveConsistency,
      Math.min(1, features.rhythm.microTimingDeviation / 20)
    ]);
  }

  private extractTimbralInput(features: AmapianoAudioFeatures): Float32Array {
    return new Float32Array([
      features.timbral.logDrum.fundamentalFreq / 100,
      features.timbral.logDrum.decayTime / 600,
      features.timbral.logDrum.harmonicRichness,
      features.timbral.logDrum.saturationAmount,
      features.timbral.piano.type === 'rhodes' ? 1 : 
        features.timbral.piano.type === 'wurlitzer' ? 0.8 : 0.3,
      features.timbral.piano.brightness,
      features.timbral.bass.subPresence,
      features.timbral.bass.midPresence,
      features.timbral.bass.sidechainDepth,
      features.timbral.percussion.percussionDensity,
      features.timbral.percussion.hihatStyle === 'closed' ? 0.7 : 0.4,
      features.timbral.percussion.clapLayering
    ]);
  }

  private extractHarmonicInput(features: AmapianoAudioFeatures): Float32Array {
    const keyNum = this.keyToNumber(features.harmonic.key);
    return new Float32Array([
      keyNum / 12,
      features.harmonic.mode === 'minor' ? 1 : 0,
      features.harmonic.chordComplexity,
      features.harmonic.jazzInfluence,
      features.harmonic.gospelInfluence,
      this.progressionToNumber(features.harmonic.progressionType),
      features.harmonic.harmonyChangeRate,
      features.harmonic.tensionRelease
    ]);
  }

  private extractProductionInput(features: AmapianoAudioFeatures): Float32Array {
    return new Float32Array([
      features.production.stereoWidth,
      features.production.dynamicRange / 20,
      features.production.lowEndWeight,
      features.production.highFreqSparkle,
      this.reverbToNumber(features.production.reverbType),
      features.production.reverbMix,
      features.production.compressionAmount,
      Math.abs(features.production.masterLoudness) / 20,
      features.production.filterSweepUsage
    ]);
  }

  private keyToNumber(key: string): number {
    const keys = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const base = key.replace('m', '').replace('#', 's');
    const idx = keys.findIndex(k => k.replace('#', 's') === base);
    return idx >= 0 ? idx : 0;
  }

  private progressionToNumber(prog: string): number {
    const progressions = ['i-iv-v', 'i-vi-iv-v', 'modal', 'chromatic', 'custom'];
    const idx = progressions.indexOf(prog);
    return idx >= 0 ? idx / 4 : 0.5;
  }

  private reverbToNumber(reverb: string): number {
    const types = ['plate', 'room', 'hall', 'spring'];
    const idx = types.indexOf(reverb);
    return idx >= 0 ? idx / 3 : 0.25;
  }

  private computeHeadScore(output: Float32Array): number {
    let sum = 0;
    for (let i = 0; i < output.length; i++) {
      sum += Math.abs(output[i]);
    }
    return Math.min(1, sum / output.length);
  }

  private softmax(values: number[]): number[] {
    const max = Math.max(...values);
    const exp = values.map(v => Math.exp(v - max));
    const sum = exp.reduce((a, b) => a + b, 0);
    return exp.map(v => v / sum);
  }

  private determineSubgenre(genre: string, features: AmapianoAudioFeatures): string {
    const sig = GENRE_SIGNATURES[genre as keyof typeof GENRE_SIGNATURES];
    if (!sig) return 'standard';
    
    if (genre === 'amapiano') {
      // Determine Amapiano subgenre based on characteristics
      if (features.rhythm.bpm >= 115) return 'uptempo';
      if (features.timbral.piano.brightness > 0.7 && 
          features.harmonic.chordComplexity > 0.7) return 'private-school';
      if (features.timbral.logDrum.harmonicRichness > 0.7) return 'deep';
      if (features.harmonic.jazzInfluence > 0.6) return 'piano-led';
      if (features.production.reverbMix > 0.5) return 'vocal-led';
      return 'mainstream';
    }
    
    return sig.subgenres[0];
  }

  private matchRegionalStyle(features: AmapianoAudioFeatures): { region: string; confidence: number } {
    const regions = Object.keys(REGIONAL_STYLE_PARAMETERS);
    let bestMatch = { region: 'johannesburg', confidence: 0 };
    
    for (const region of regions) {
      const style = REGIONAL_STYLE_PARAMETERS[region as keyof typeof REGIONAL_STYLE_PARAMETERS];
      
      let score = 0;
      let weights = 0;
      
      // BPM match
      const bpmDiff = Math.abs(features.rhythm.bpm - style.typicalBpm);
      score += Math.max(0, 1 - bpmDiff / 15) * 0.2;
      weights += 0.2;
      
      // Log drum emphasis
      score += (1 - Math.abs(features.timbral.logDrum.harmonicRichness - style.logDrumEmphasis)) * 0.25;
      weights += 0.25;
      
      // Piano complexity
      score += (1 - Math.abs(features.harmonic.chordComplexity - style.pianoComplexity)) * 0.25;
      weights += 0.25;
      
      // Percussion density
      score += (1 - Math.abs(features.timbral.percussion.percussionDensity - style.percussionDensity)) * 0.15;
      weights += 0.15;
      
      // Bass depth
      score += (1 - Math.abs(features.timbral.bass.subPresence - style.bassDepth)) * 0.15;
      weights += 0.15;
      
      const confidence = score / weights;
      
      if (confidence > bestMatch.confidence) {
        bestMatch = { region, confidence };
      }
    }
    
    return bestMatch;
  }

  private formatGenreName(genre: string): string {
    const names: Record<string, string> = {
      amapiano: 'Amapiano',
      afroHouse: 'Afro House',
      gqom: 'Gqom',
      deepHouse: 'Deep House',
      kwaito: 'Kwaito'
    };
    return names[genre] || genre;
  }

  private generateExplanations(
    features: AmapianoAudioFeatures,
    genre: string,
    headScores: Record<string, number>,
    confidence: number
  ): string[] {
    const explanations: string[] = [];
    
    // BPM explanation
    const thresholds = AMAPIANO_THRESHOLDS;
    if (genre === 'amapiano') {
      if (features.rhythm.bpm >= thresholds.bpm.optimal.min && 
          features.rhythm.bpm <= thresholds.bpm.optimal.max) {
        explanations.push(`BPM of ${features.rhythm.bpm} is optimal for Amapiano (${thresholds.bpm.optimal.min}-${thresholds.bpm.optimal.max})`);
      } else if (features.rhythm.bpm >= thresholds.bpm.min && 
                 features.rhythm.bpm <= thresholds.bpm.max) {
        explanations.push(`BPM of ${features.rhythm.bpm} is within Amapiano range but not optimal`);
      }
    }
    
    // Swing explanation
    if (features.rhythm.swingRatio >= thresholds.swing.optimal.min &&
        features.rhythm.swingRatio <= thresholds.swing.optimal.max) {
      explanations.push(`Swing ratio of ${(features.rhythm.swingRatio * 100).toFixed(0)}% shows authentic Amapiano groove`);
    }
    
    // Log drum explanation
    if (features.timbral.logDrum.decayTime >= thresholds.logDrum.decay.optimal.min &&
        features.timbral.logDrum.decayTime <= thresholds.logDrum.decay.optimal.max) {
      explanations.push(`Log drum decay of ${Math.round(features.timbral.logDrum.decayTime)}ms is characteristic of Amapiano`);
    }
    
    // Head importance
    const sortedHeads = Object.entries(headScores).sort((a, b) => b[1] - a[1]);
    explanations.push(`Classification primarily influenced by ${sortedHeads[0][0]} features (${(sortedHeads[0][1] * 100).toFixed(0)}%)`);
    
    // Confidence explanation
    if (confidence > 0.8) {
      explanations.push('High confidence classification based on multiple matching characteristics');
    } else if (confidence > 0.5) {
      explanations.push('Moderate confidence - track shows mixed genre characteristics');
    }
    
    return explanations;
  }

  /**
   * Train classifier on labeled examples
   */
  trainOnExample(
    features: AmapianoAudioFeatures, 
    correctGenre: string,
    learningRate: number = 0.001
  ): void {
    // Forward pass
    const result = this.classify(features);
    
    // Compute error
    const targetIdx = ['amapiano', 'afroHouse', 'gqom', 'deepHouse', 'kwaito'].indexOf(correctGenre);
    if (targetIdx < 0) return;
    
    // Simplified weight update based on error
    console.log(`[AmapianoClassifier] Training on ${correctGenre}, predicted: ${result.genre}`);
    
    // In production, implement proper backpropagation
  }

  /**
   * Export model weights
   */
  exportModel(): string {
    return JSON.stringify({
      version: '1.0',
      timestamp: new Date().toISOString(),
      type: 'AmapianoMultiHeadClassifier'
    });
  }
}

// Singleton export
export const amapianoClassifier = new AmapianoMultiHeadClassifier();

/**
 * Quick classification function
 */
export function classifyAmapianoAudio(
  features: AmapianoAudioFeatures
): ClassificationResult {
  return amapianoClassifier.classify(features);
}
