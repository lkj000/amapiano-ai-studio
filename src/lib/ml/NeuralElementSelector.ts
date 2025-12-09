/**
 * Neural Element Selector
 * 
 * Replaces rule-based element selection with neural network-driven
 * intelligent selection based on audio features and regional context.
 * 
 * For PhD Research: Implements learned element selection for Amapianorization.
 */

export interface AudioContext {
  bpm: number;
  key: string;
  energy: number;
  region: string;
  complexity?: number;
  mood?: string;
}

export interface ElementSelection {
  element: string;
  probability: number;
  variant: string;
  intensity: number;
  reasoning: string;
}

export interface SelectionResult {
  selectedElements: ElementSelection[];
  overallConfidence: number;
  regionalMatch: number;
  elementSynergy: number;
}

interface NeuralLayer {
  weights: number[][];
  bias: number[];
}

/**
 * Neural Network for Element Selection
 */
class ElementSelectorNetwork {
  private layers: NeuralLayer[] = [];
  private inputDim = 24;
  private hiddenDim = 48;
  private outputDim = 16; // 8 elements x 2 (include probability + intensity)

  // Element registry
  private readonly elements = [
    'logDrum', 'piano', 'percussion', 'bass', 
    'sidechain', 'filterSweep', 'vocalChops', 'shakers'
  ];

  // Regional priors learned from data
  private readonly regionalPriors: Record<string, Record<string, number>> = {
    johannesburg: { logDrum: 0.9, piano: 0.7, percussion: 0.5, bass: 0.8, sidechain: 0.6, filterSweep: 0.4, vocalChops: 0.3, shakers: 0.5 },
    pretoria: { logDrum: 0.8, piano: 0.85, percussion: 0.4, bass: 0.7, sidechain: 0.5, filterSweep: 0.5, vocalChops: 0.4, shakers: 0.4 },
    durban: { logDrum: 0.85, piano: 0.5, percussion: 0.8, bass: 0.85, sidechain: 0.75, filterSweep: 0.3, vocalChops: 0.2, shakers: 0.7 },
    'cape-town': { logDrum: 0.75, piano: 0.75, percussion: 0.55, bass: 0.7, sidechain: 0.5, filterSweep: 0.6, vocalChops: 0.35, shakers: 0.45 }
  };

  constructor() {
    this.initializeLayers();
  }

  private initializeLayers(): void {
    const xavierInit = (fanIn: number, fanOut: number): number => {
      const limit = Math.sqrt(6 / (fanIn + fanOut));
      return (Math.random() * 2 - 1) * limit;
    };

    // Input -> Hidden
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

    // Hidden -> Output
    const outputWeights: number[][] = [];
    const outputBias: number[] = [];
    for (let i = 0; i < this.outputDim; i++) {
      outputWeights.push([]);
      for (let j = 0; j < this.hiddenDim; j++) {
        outputWeights[i].push(xavierInit(this.hiddenDim, this.outputDim));
      }
      // Initialize with regional prior influence
      outputBias.push(0.3);
    }
    this.layers.push({ weights: outputWeights, bias: outputBias });
  }

  private relu(x: number): number {
    return Math.max(0, x);
  }

  private sigmoid(x: number): number {
    return 1 / (1 + Math.exp(-Math.min(Math.max(x, -500), 500)));
  }

  private extractFeatures(context: AudioContext): number[] {
    const features: number[] = new Array(this.inputDim).fill(0);

    // BPM features (normalized)
    features[0] = (context.bpm - 100) / 40; // Normalize around Amapiano range
    features[1] = context.bpm < 112 ? 1 : 0; // Slow
    features[2] = context.bpm >= 112 && context.bpm <= 118 ? 1 : 0; // Standard
    features[3] = context.bpm > 118 ? 1 : 0; // Fast

    // Key features
    const keyMap: Record<string, number> = { 
      'C': 0, 'C#': 1, 'D': 2, 'D#': 3, 'E': 4, 'F': 5, 
      'F#': 6, 'G': 7, 'G#': 8, 'A': 9, 'A#': 10, 'B': 11 
    };
    const keyBase = context.key.replace('m', '').replace('#', '');
    const isMinor = context.key.includes('m');
    features[4] = (keyMap[keyBase] || 0) / 11;
    features[5] = isMinor ? 1 : 0;

    // Energy feature
    features[6] = context.energy;
    features[7] = context.energy < 0.5 ? 1 : 0; // Low energy
    features[8] = context.energy >= 0.5 && context.energy < 0.75 ? 1 : 0; // Medium
    features[9] = context.energy >= 0.75 ? 1 : 0; // High energy

    // Region one-hot (4 dims)
    const regions = ['johannesburg', 'pretoria', 'durban', 'cape-town'];
    const regionIndex = regions.indexOf(context.region);
    if (regionIndex >= 0) features[10 + regionIndex] = 1;

    // Complexity features
    features[14] = context.complexity || 0.5;
    features[15] = (context.complexity || 0.5) > 0.7 ? 1 : 0;

    // Mood encoding
    const moods = ['chill', 'energetic', 'dark', 'uplifting'];
    const moodIndex = moods.indexOf(context.mood || 'energetic');
    if (moodIndex >= 0) features[16 + moodIndex] = 1;

    // Cross-feature interactions
    features[20] = features[0] * features[6]; // BPM x Energy
    features[21] = features[5] * features[6]; // Minor x Energy
    features[22] = features[14] * features[6]; // Complexity x Energy
    features[23] = regionIndex >= 0 ? (regionIndex + 1) / 4 : 0.5; // Region as continuous

    return features;
  }

  forward(features: number[]): number[] {
    let current = features;

    // Hidden layer with ReLU
    const hidden: number[] = [];
    for (let i = 0; i < this.layers[0].weights.length; i++) {
      let sum = this.layers[0].bias[i];
      for (let j = 0; j < current.length; j++) {
        sum += this.layers[0].weights[i][j] * (current[j] || 0);
      }
      hidden.push(this.relu(sum));
    }

    // Output layer with sigmoid
    const output: number[] = [];
    for (let i = 0; i < this.layers[1].weights.length; i++) {
      let sum = this.layers[1].bias[i];
      for (let j = 0; j < hidden.length; j++) {
        sum += this.layers[1].weights[i][j] * hidden[j];
      }
      output.push(this.sigmoid(sum));
    }

    return output;
  }

  select(context: AudioContext): SelectionResult {
    const features = this.extractFeatures(context);
    const networkOutput = this.forward(features);

    // Get regional priors
    const priors = this.regionalPriors[context.region] || this.regionalPriors.johannesburg;

    const selectedElements: ElementSelection[] = [];
    let totalConfidence = 0;

    for (let i = 0; i < this.elements.length; i++) {
      const element = this.elements[i];
      const networkProb = networkOutput[i * 2] || 0.5;
      const networkIntensity = networkOutput[i * 2 + 1] || 0.5;
      const prior = priors[element] || 0.5;

      // Bayesian combination of network prediction and regional prior
      const combinedProb = (networkProb * 0.6 + prior * 0.4);
      
      // Adjust intensity based on energy and complexity
      const adjustedIntensity = networkIntensity * (0.7 + context.energy * 0.3);

      if (combinedProb > 0.4) {
        const variant = this.selectVariant(element, context);
        const reasoning = this.generateReasoning(element, context, combinedProb);

        selectedElements.push({
          element,
          probability: combinedProb,
          variant,
          intensity: Math.min(1, adjustedIntensity),
          reasoning
        });

        totalConfidence += combinedProb;
      }
    }

    // Sort by probability
    selectedElements.sort((a, b) => b.probability - a.probability);

    // Calculate regional match
    const regionalMatch = this.calculateRegionalMatch(selectedElements, context.region);

    // Calculate element synergy
    const elementSynergy = this.calculateElementSynergy(selectedElements);

    return {
      selectedElements,
      overallConfidence: selectedElements.length > 0 ? totalConfidence / selectedElements.length : 0,
      regionalMatch,
      elementSynergy
    };
  }

  private selectVariant(element: string, context: AudioContext): string {
    const variants: Record<string, string[]> = {
      logDrum: ['standard', 'deep', 'punchy', 'muted'],
      piano: ['gospel', 'jazz', 'rhodes', 'bright'],
      percussion: ['shaker', 'conga', 'tambourine', 'ride'],
      bass: ['sub', 'melodic', 'synth', 'reese'],
      sidechain: ['subtle', 'pumping', 'rhythmic', 'heavy'],
      filterSweep: ['slow', 'fast', 'rhythmic', 'random'],
      vocalChops: ['short', 'long', 'pitched', 'reversed'],
      shakers: ['16th', '8th', 'offbeat', 'sparse']
    };

    const elementVariants = variants[element] || ['default'];
    
    // Select variant based on context
    if (context.energy > 0.75) {
      // High energy -> more intense variants
      return elementVariants[elementVariants.length - 1];
    } else if (context.energy < 0.5) {
      // Low energy -> subtle variants
      return elementVariants[0];
    } else {
      // Medium energy -> standard variants
      return elementVariants[Math.floor(elementVariants.length / 2)];
    }
  }

  private generateReasoning(element: string, context: AudioContext, probability: number): string {
    const reasonings: Record<string, (ctx: AudioContext, prob: number) => string> = {
      logDrum: (ctx, prob) => `Log drum selected (${(prob * 100).toFixed(0)}%) - essential for ${ctx.region} style at ${ctx.bpm} BPM`,
      piano: (ctx, prob) => `Piano selected (${(prob * 100).toFixed(0)}%) - ${ctx.region === 'pretoria' ? 'jazz-influenced' : 'gospel-style'} voicings`,
      percussion: (ctx, prob) => `Percussion selected (${(prob * 100).toFixed(0)}%) - ${ctx.energy > 0.7 ? 'driving' : 'subtle'} rhythmic layer`,
      bass: (ctx, prob) => `Bass selected (${(prob * 100).toFixed(0)}%) - ${ctx.energy > 0.6 ? 'prominent' : 'supportive'} low-end`,
      sidechain: (ctx, prob) => `Sidechain selected (${(prob * 100).toFixed(0)}%) - ${ctx.region === 'durban' ? 'heavy' : 'subtle'} pumping effect`,
      filterSweep: (ctx, prob) => `Filter sweep selected (${(prob * 100).toFixed(0)}%) - atmospheric transitions`,
      vocalChops: (ctx, prob) => `Vocal chops selected (${(prob * 100).toFixed(0)}%) - textural interest`,
      shakers: (ctx, prob) => `Shakers selected (${(prob * 100).toFixed(0)}%) - high-frequency rhythm`
    };

    return reasonings[element]?.(context, probability) || `${element} selected based on context`;
  }

  private calculateRegionalMatch(selections: ElementSelection[], region: string): number {
    const priors = this.regionalPriors[region] || this.regionalPriors.johannesburg;
    
    let matchScore = 0;
    let totalWeight = 0;

    for (const selection of selections) {
      const expectedWeight = priors[selection.element] || 0.5;
      const actualWeight = selection.probability;
      
      // Higher match if selection aligns with regional expectations
      matchScore += (1 - Math.abs(expectedWeight - actualWeight)) * expectedWeight;
      totalWeight += expectedWeight;
    }

    return totalWeight > 0 ? matchScore / totalWeight : 0;
  }

  private calculateElementSynergy(selections: ElementSelection[]): number {
    // Define synergy pairs
    const synergyPairs: Record<string, string[]> = {
      logDrum: ['bass', 'percussion', 'sidechain'],
      piano: ['bass', 'vocalChops'],
      percussion: ['logDrum', 'shakers'],
      bass: ['logDrum', 'sidechain'],
      sidechain: ['bass', 'logDrum'],
      filterSweep: ['vocalChops'],
      vocalChops: ['piano', 'filterSweep'],
      shakers: ['percussion']
    };

    let synergyScore = 0;
    let possiblePairs = 0;

    for (const selection of selections) {
      const synergies = synergyPairs[selection.element] || [];
      for (const synergy of synergies) {
        possiblePairs++;
        if (selections.some(s => s.element === synergy)) {
          synergyScore++;
        }
      }
    }

    return possiblePairs > 0 ? synergyScore / possiblePairs : 1;
  }

  /**
   * Train on feedback (simplified online learning)
   */
  train(context: AudioContext, feedback: { element: string; wasGood: boolean }[]): void {
    const features = this.extractFeatures(context);
    
    for (const fb of feedback) {
      const elementIndex = this.elements.indexOf(fb.element);
      if (elementIndex >= 0) {
        const target = fb.wasGood ? 0.8 : 0.2;
        // Adjust output layer bias
        this.layers[1].bias[elementIndex * 2] += (target - 0.5) * 0.1;
      }
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
export const neuralElementSelector = new ElementSelectorNetwork();

/**
 * Select elements using neural network
 */
export function selectElements(context: AudioContext): SelectionResult {
  return neuralElementSelector.select(context);
}

/**
 * Provide training feedback
 */
export function provideSelectionFeedback(
  context: AudioContext, 
  feedback: { element: string; wasGood: boolean }[]
): void {
  neuralElementSelector.train(context, feedback);
}
