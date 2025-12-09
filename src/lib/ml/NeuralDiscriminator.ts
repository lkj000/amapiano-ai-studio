/**
 * Neural Discriminator
 * 
 * A genuine adversarial discriminator network that learns to distinguish
 * between authentic and non-authentic Amapiano productions.
 * 
 * Unlike heuristic-based (if/else) rules, this is a true neural network
 * implementation with proper backpropagation and learned feature representations.
 */

export interface DiscriminatorConfig {
  inputDim: number;
  hiddenDims: number[];
  dropoutRate: number;
  learningRate: number;
}

export interface DiscriminatorOutput {
  isAuthentic: boolean;
  probability: number;
  confidence: number;
  featureActivations: Record<string, number>;
  gradients?: Record<string, number>;
}

interface LayerWeights {
  weights: number[];
  bias: number[];
  inputDim: number;
  outputDim: number;
}

/**
 * True neural network layer with proper matrix operations
 */
class NeuralLayer {
  weights: number[];
  bias: number[];
  inputDim: number;
  outputDim: number;
  
  // Gradient storage for backprop
  weightsGrad: number[];
  biasGrad: number[];
  
  // Cache for backprop
  lastInput?: number[];
  lastPreActivation?: number[];
  lastOutput?: number[];
  
  constructor(inputDim: number, outputDim: number) {
    this.inputDim = inputDim;
    this.outputDim = outputDim;
    
    // Xavier/Glorot initialization
    const scale = Math.sqrt(2.0 / (inputDim + outputDim));
    this.weights = new Array(inputDim * outputDim);
    for (let i = 0; i < this.weights.length; i++) {
      this.weights[i] = (Math.random() * 2 - 1) * scale;
    }
    
    this.bias = new Array(outputDim).fill(0);
    this.weightsGrad = new Array(inputDim * outputDim).fill(0);
    this.biasGrad = new Array(outputDim).fill(0);
  }
  
  forward(input: number[], training: boolean = true): number[] {
    this.lastInput = training ? [...input] : undefined;
    
    const output = new Array(this.outputDim).fill(0);
    
    for (let j = 0; j < this.outputDim; j++) {
      let sum = this.bias[j];
      for (let i = 0; i < this.inputDim; i++) {
        sum += input[i] * this.weights[i * this.outputDim + j];
      }
      output[j] = sum;
    }
    
    this.lastPreActivation = training ? [...output] : undefined;
    return output;
  }
  
  backward(gradOutput: number[]): number[] {
    if (!this.lastInput) throw new Error('No cached input for backprop');
    
    const gradInput = new Array(this.inputDim).fill(0);
    
    // Compute weight gradients
    for (let i = 0; i < this.inputDim; i++) {
      for (let j = 0; j < this.outputDim; j++) {
        this.weightsGrad[i * this.outputDim + j] += this.lastInput[i] * gradOutput[j];
        gradInput[i] += this.weights[i * this.outputDim + j] * gradOutput[j];
      }
    }
    
    // Bias gradients
    for (let j = 0; j < this.outputDim; j++) {
      this.biasGrad[j] += gradOutput[j];
    }
    
    return gradInput;
  }
  
  zeroGrad(): void {
    this.weightsGrad = new Array(this.inputDim * this.outputDim).fill(0);
    this.biasGrad = new Array(this.outputDim).fill(0);
  }
  
  updateWeights(lr: number): void {
    for (let i = 0; i < this.weights.length; i++) {
      this.weights[i] -= lr * this.weightsGrad[i];
    }
    for (let i = 0; i < this.bias.length; i++) {
      this.bias[i] -= lr * this.biasGrad[i];
    }
  }
  
  getParams(): LayerWeights {
    return {
      weights: [...this.weights],
      bias: [...this.bias],
      inputDim: this.inputDim,
      outputDim: this.outputDim
    };
  }
}

/**
 * Leaky ReLU activation
 */
function leakyRelu(x: number[], alpha: number = 0.2): number[] {
  return x.map(v => v > 0 ? v : alpha * v);
}

function leakyReluGrad(preActivation: number[], gradOutput: number[], alpha: number = 0.2): number[] {
  return preActivation.map((v, i) => gradOutput[i] * (v > 0 ? 1 : alpha));
}

/**
 * Sigmoid activation for output
 */
function sigmoid(x: number): number {
  return 1 / (1 + Math.exp(-Math.max(-500, Math.min(500, x))));
}

/**
 * Neural Discriminator Network
 */
export class NeuralDiscriminator {
  private layers: NeuralLayer[] = [];
  private config: DiscriminatorConfig;
  private trainingStep: number = 0;
  
  // Feature names for interpretability
  private static readonly FEATURE_NAMES = [
    'logDrum', 'piano', 'percussion', 'bass', 'sidechain',
    'filterSweep', 'vocalChops', 'arrangement', 'groove', 'dynamics',
    'bpmNormalized', 'keyCompatibility', 'energyLevel', 'danceability'
  ];
  
  constructor(config: Partial<DiscriminatorConfig> = {}) {
    this.config = {
      inputDim: config.inputDim || NeuralDiscriminator.FEATURE_NAMES.length,
      hiddenDims: config.hiddenDims || [64, 32, 16],
      dropoutRate: config.dropoutRate || 0.3,
      learningRate: config.learningRate || 0.001
    };
    
    this.buildNetwork();
  }
  
  private buildNetwork(): void {
    const dims = [this.config.inputDim, ...this.config.hiddenDims, 1];
    
    this.layers = [];
    for (let i = 0; i < dims.length - 1; i++) {
      this.layers.push(new NeuralLayer(dims[i], dims[i + 1]));
    }
  }
  
  /**
   * Forward pass through the discriminator
   */
  forward(features: Record<string, number>, training: boolean = false): {
    probability: number;
    activations: number[][];
  } {
    // Convert features to input vector
    let x: number[] = new Array(this.config.inputDim).fill(0);
    NeuralDiscriminator.FEATURE_NAMES.forEach((name, i) => {
      x[i] = features[name] ?? 0;
    });
    
    const activations: number[][] = [[...x]];
    
    // Hidden layers with Leaky ReLU
    for (let i = 0; i < this.layers.length - 1; i++) {
      const preAct = this.layers[i].forward(x, training);
      x = leakyRelu(preAct);
      
      // Dropout during training
      if (training && this.config.dropoutRate > 0) {
        x = x.map(v => {
          if (Math.random() < this.config.dropoutRate) {
            return 0;
          }
          return v / (1 - this.config.dropoutRate);
        });
      }
      
      activations.push([...x]);
    }
    
    // Output layer with sigmoid
    const logit = this.layers[this.layers.length - 1].forward(x, training)[0];
    const probability = sigmoid(logit);
    
    activations.push([probability]);
    
    return { probability, activations };
  }
  
  /**
   * Backward pass with proper gradient computation
   */
  private backward(
    activations: number[][],
    target: number
  ): void {
    const output = activations[activations.length - 1][0];
    
    // Binary cross-entropy gradient
    let grad: number[] = [output - target];
    
    // Backprop through output layer
    const outputLayer = this.layers[this.layers.length - 1];
    grad = outputLayer.backward(grad);
    
    // Backprop through hidden layers
    for (let i = this.layers.length - 2; i >= 0; i--) {
      const preAct = this.layers[i].lastPreActivation;
      if (preAct) {
        grad = leakyReluGrad(preAct, grad);
      }
      grad = this.layers[i].backward(grad);
    }
  }
  
  /**
   * Train on a batch of samples
   */
  trainBatch(
    samples: Array<{ features: Record<string, number>; isAuthentic: boolean }>
  ): { loss: number; accuracy: number } {
    // Zero gradients
    this.layers.forEach(l => l.zeroGrad());
    
    let totalLoss = 0;
    let correct = 0;
    
    for (const sample of samples) {
      const target = sample.isAuthentic ? 1 : 0;
      const { probability, activations } = this.forward(sample.features, true);
      
      // Binary cross-entropy loss
      const eps = 1e-7;
      const loss = -target * Math.log(probability + eps) - (1 - target) * Math.log(1 - probability + eps);
      totalLoss += loss;
      
      // Accuracy
      if ((probability > 0.5) === sample.isAuthentic) {
        correct++;
      }
      
      // Backward pass
      this.backward(activations, target);
    }
    
    // Update weights
    const lr = this.config.learningRate;
    this.layers.forEach(l => {
      // Average gradients
      for (let i = 0; i < l.weightsGrad.length; i++) {
        l.weightsGrad[i] /= samples.length;
      }
      for (let i = 0; i < l.biasGrad.length; i++) {
        l.biasGrad[i] /= samples.length;
      }
      l.updateWeights(lr);
    });
    
    this.trainingStep++;
    
    return {
      loss: totalLoss / samples.length,
      accuracy: correct / samples.length
    };
  }
  
  /**
   * Discriminate - predict whether input is authentic Amapiano
   */
  discriminate(features: Record<string, number>): DiscriminatorOutput {
    const { probability } = this.forward(features, false);
    
    // Extract feature activations
    const featureActivations: Record<string, number> = {};
    NeuralDiscriminator.FEATURE_NAMES.forEach((name) => {
      featureActivations[name] = features[name] ?? 0;
    });
    
    // Confidence based on how far from 0.5 decision boundary
    const confidence = Math.abs(probability - 0.5) * 2;
    
    return {
      isAuthentic: probability > 0.5,
      probability,
      confidence,
      featureActivations
    };
  }
  
  /**
   * Compute gradients for feature importance (saliency)
   */
  computeFeatureSaliency(features: Record<string, number>): Record<string, number> {
    const { probability } = this.forward(features, true);
    
    // Compute gradients with respect to input
    let grad: number[] = [probability * (1 - probability)]; // sigmoid grad
    
    // Backprop to get input gradients
    for (let i = this.layers.length - 1; i >= 0; i--) {
      if (i < this.layers.length - 1) {
        const preAct = this.layers[i].lastPreActivation;
        if (preAct) {
          grad = leakyReluGrad(preAct, grad);
        }
      }
      
      if (i > 0) {
        const layer = this.layers[i];
        const newGrad = new Array(layer.inputDim).fill(0);
        for (let j = 0; j < layer.inputDim; j++) {
          for (let k = 0; k < layer.outputDim; k++) {
            newGrad[j] += layer.weights[j * layer.outputDim + k] * grad[k];
          }
        }
        grad = newGrad;
      }
    }
    
    // Map to feature names
    const saliency: Record<string, number> = {};
    NeuralDiscriminator.FEATURE_NAMES.forEach((name, i) => {
      saliency[name] = Math.abs(grad[i] || 0);
    });
    
    return saliency;
  }
  
  /**
   * Export model state
   */
  exportModel(): string {
    return JSON.stringify({
      config: this.config,
      layers: this.layers.map(l => l.getParams()),
      trainingStep: this.trainingStep
    });
  }
  
  /**
   * Import model state
   */
  importModel(json: string): boolean {
    try {
      const data = JSON.parse(json);
      this.config = data.config;
      this.trainingStep = data.trainingStep;
      
      this.layers = data.layers.map((lp: LayerWeights) => {
        const layer = new NeuralLayer(lp.inputDim, lp.outputDim);
        layer.weights = [...lp.weights];
        layer.bias = [...lp.bias];
        return layer;
      });
      
      return true;
    } catch {
      console.error('[NeuralDiscriminator] Import failed');
      return false;
    }
  }
  
  getTrainingStep(): number {
    return this.trainingStep;
  }
}

/**
 * Train discriminator from database samples
 */
export async function trainDiscriminatorFromDatabase(): Promise<{
  discriminator: NeuralDiscriminator;
  metrics: { loss: number; accuracy: number };
}> {
  const { supabase } = await import('@/integrations/supabase/client');
  
  const discriminator = new NeuralDiscriminator();
  
  const { data: responses, error } = await supabase
    .from('user_study_responses')
    .select('*');
  
  if (error || !responses || responses.length < 5) {
    console.log('[NeuralDiscriminator] Insufficient training data');
    return { discriminator, metrics: { loss: 0, accuracy: 0 } };
  }
  
  // Convert responses to training samples
  const samples = responses.map(r => {
    const feedback = r.feedback as any || {};
    return {
      features: {
        logDrum: feedback.logDrumScore || 0.5,
        piano: feedback.pianoScore || 0.5,
        percussion: feedback.percussionScore || 0.5,
        bass: feedback.bassScore || 0.5,
        sidechain: feedback.sidechainScore || 0.3,
        filterSweep: feedback.filterScore || 0.3,
        vocalChops: feedback.vocalScore || 0.2,
        arrangement: feedback.arrangementScore || 0.5,
        groove: feedback.grooveScore || 0.6,
        dynamics: feedback.dynamicsScore || 0.5,
        bpmNormalized: (feedback.bpm || 115) / 150,
        keyCompatibility: 0.7,
        energyLevel: feedback.energyScore || 0.6,
        danceability: feedback.danceabilityScore || 0.7
      },
      isAuthentic: (r.authenticity_rating || 5) >= 7
    };
  });
  
  // Train for multiple epochs
  let metrics = { loss: 0, accuracy: 0 };
  for (let epoch = 0; epoch < 20; epoch++) {
    // Shuffle samples
    const shuffled = [...samples].sort(() => Math.random() - 0.5);
    
    // Mini-batch training
    const batchSize = Math.min(16, shuffled.length);
    for (let i = 0; i < shuffled.length; i += batchSize) {
      const batch = shuffled.slice(i, i + batchSize);
      metrics = discriminator.trainBatch(batch);
    }
    
    if (epoch % 5 === 0) {
      console.log(`[NeuralDiscriminator] Epoch ${epoch}: loss=${metrics.loss.toFixed(4)}, acc=${(metrics.accuracy * 100).toFixed(1)}%`);
    }
  }
  
  return { discriminator, metrics };
}

// Singleton instance
export const neuralDiscriminator = new NeuralDiscriminator();
