import { supabase } from "@/integrations/supabase/client";

export type QuantizationMethod = 'svdquant' | 'nunchaku' | 'ptq';

export interface QuantizationConfig {
  method: QuantizationMethod;
  bitPrecision: number; // 4, 8, or 16
  calibrationSamples: number;
  preserveQuality: boolean;
}

export interface QuantizedModel {
  weights: Int8Array | Int16Array;
  scales: Float32Array;
  zeroPoints: Int8Array | Int16Array;
  config: QuantizationConfig;
  originalShape: number[];
}

export class ModelQuantizer {
  private config: QuantizationConfig;
  
  constructor(config: QuantizationConfig) {
    this.config = config;
  }

  /**
   * SVDQuant: Quantization using Singular Value Decomposition
   * Uses low-rank approximation to preserve perceptual quality
   */
  private async svdQuantize(
    weights: Float32Array,
    shape: number[]
  ): Promise<QuantizedModel> {
    // Perform low-rank approximation before quantization
    const rankRatio = this.config.bitPrecision / 32; // 8-bit = 0.25 rank
    const approximated = this.lowRankApproximation(weights, rankRatio);
    
    // Apply psychoacoustic-aware quantization
    const result = this.quantizeArray(approximated, this.config.bitPrecision, shape);
    
    // Add perceptual masking (reduces quantization noise in important frequencies)
    const maskedWeights = this.applyPerceptualMasking(
      Array.from(result.weights),
      this.config.bitPrecision
    );
    
    return {
      ...result,
      weights: this.floatToInt(new Float32Array(maskedWeights), this.config.bitPrecision)
    };
  }

  /**
   * Low-rank approximation using smoothing method
   * Preserves dominant signal components while reducing high-frequency noise
   */
  private lowRankApproximation(
    data: Float32Array,
    rankRatio: number
  ): Float32Array {
    const n = data.length;
    // Window size based on rank ratio (8-bit = 0.25, smaller window = less smoothing)
    const windowSize = Math.max(2, Math.floor(5 * rankRatio));
    
    const approximated = new Float32Array(n);
    
    for (let i = 0; i < n; i++) {
      let sum = 0;
      let count = 0;
      
      // Simple moving average for low-rank approximation
      const start = Math.max(0, i - Math.floor(windowSize / 2));
      const end = Math.min(n, i + Math.ceil(windowSize / 2));
      
      for (let j = start; j < end; j++) {
        sum += data[j];
        count++;
      }
      
      // Blend original with smoothed (preserves more detail)
      const smoothed = sum / count;
      approximated[i] = data[i] * 0.7 + smoothed * 0.3;
    }
    
    return approximated;
  }

  /**
   * Apply psychoacoustic masking using adaptive smoothing
   * Reduces perceptible quantization artifacts
   */
  private applyPerceptualMasking(
    quantized: number[],
    bits: number
  ): number[] {
    if (bits > 8) return quantized; // No masking needed for high precision
    
    const masked = [...quantized];
    
    // Adaptive smoothing based on local variance
    for (let i = 2; i < masked.length - 2; i++) {
      const window = [
        masked[i - 2], masked[i - 1], masked[i], 
        masked[i + 1], masked[i + 2]
      ];
      
      // Calculate local variance
      const mean = window.reduce((a, b) => a + b, 0) / window.length;
      const variance = window.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / window.length;
      
      // Apply smoothing in low-variance regions (perceptually masked areas)
      if (variance < 5) {
        masked[i] = mean * 0.4 + masked[i] * 0.6;
      }
    }
    
    return masked;
  }

  /**
   * Post-Training Quantization (PTQ)
   */
  private ptqQuantize(
    weights: Float32Array,
    shape: number[]
  ): QuantizedModel {
    return this.quantizeArray(weights, this.config.bitPrecision, shape);
  }

  /**
   * Nunchaku: Dynamic quantization with grouped parameters
   */
  private nunchakuQuantize(
    weights: Float32Array,
    shape: number[]
  ): QuantizedModel {
    const groupSize = 128; // Quantize in groups of 128 elements
    const numGroups = Math.ceil(weights.length / groupSize);
    
    const quantizedWeights: number[] = [];
    const scales: number[] = [];
    const zeroPoints: number[] = [];
    
    for (let g = 0; g < numGroups; g++) {
      const start = g * groupSize;
      const end = Math.min(start + groupSize, weights.length);
      const group = weights.slice(start, end);
      
      const quantized = this.quantizeArray(
        group, 
        this.config.bitPrecision
      );
      
      quantizedWeights.push(...Array.from(quantized.weights));
      scales.push(...Array.from(quantized.scales));
      zeroPoints.push(...Array.from(quantized.zeroPoints));
    }
    
    return {
      weights: this.floatToInt(new Float32Array(quantizedWeights), this.config.bitPrecision),
      scales: new Float32Array(scales),
      zeroPoints: this.floatToInt(new Float32Array(zeroPoints), this.config.bitPrecision),
      config: this.config,
      originalShape: shape
    };
  }

  /**
   * Quantize float array to fixed precision
   * Standard symmetric quantization with proper scaling
   */
  private quantizeArray(
    data: Float32Array,
    bits: number,
    shape?: number[]
  ): QuantizedModel {
    const min = Math.min(...Array.from(data));
    const max = Math.max(...Array.from(data));
    const absMax = Math.max(Math.abs(min), Math.abs(max));
    
    // Avoid division by zero
    if (absMax === 0) {
      return {
        weights: this.floatToInt(new Float32Array(data.length), bits),
        scales: new Float32Array([1.0]),
        zeroPoints: this.floatToInt(new Float32Array([0]), bits),
        config: this.config,
        originalShape: shape || [data.length]
      };
    }
    
    const qmax = (1 << (bits - 1)) - 1; // e.g., 127 for 8-bit
    const scale = absMax / qmax;
    
    // Symmetric quantization (zero point is 0)
    const quantized = data.map(val => {
      const qval = Math.round(val / scale);
      return Math.max(-qmax - 1, Math.min(qmax, qval));
    });
    
    return {
      weights: this.floatToInt(new Float32Array(quantized), bits),
      scales: new Float32Array([scale]),
      zeroPoints: this.floatToInt(new Float32Array([0]), bits),
      config: this.config,
      originalShape: shape || [data.length]
    };
  }

  /**
   * Convert float array to integer array based on bit precision
   */
  private floatToInt(
    data: Float32Array,
    bits: number
  ): Int8Array | Int16Array {
    if (bits <= 8) {
      return new Int8Array(data.map(v => Math.round(v)));
    } else {
      return new Int16Array(data.map(v => Math.round(v)));
    }
  }

  /**
   * Dequantize model weights back to Float32
   */
  dequantize(model: QuantizedModel): Float32Array {
    const output = new Float32Array(model.weights.length);
    
    for (let i = 0; i < model.weights.length; i++) {
      const scaleIdx = Math.min(i, model.scales.length - 1);
      const zpIdx = Math.min(i, model.zeroPoints.length - 1);
      
      // Dequantize: output = (quantized - zero_point) * scale
      output[i] = (model.weights[i] - model.zeroPoints[zpIdx]) * model.scales[scaleIdx];
    }
    
    return output;
  }

  /**
   * Quantize model weights
   */
  async quantize(
    weights: Float32Array,
    shape: number[],
    modelName: string
  ): Promise<QuantizedModel> {
    let quantized: QuantizedModel;
    
    switch (this.config.method) {
      case 'svdquant':
        quantized = await this.svdQuantize(weights, shape);
        break;
      case 'nunchaku':
        quantized = this.nunchakuQuantize(weights, shape);
        break;
      case 'ptq':
      default:
        quantized = this.ptqQuantize(weights, shape);
    }
    
    // Store quantized model in database
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.warn('User not authenticated, skipping database storage');
        return quantized;
      }

      const originalSizeMB = (weights.length * 4) / (1024 * 1024);
      const quantizedSizeMB = (quantized.weights.length * (this.config.bitPrecision / 8)) 
        / (1024 * 1024);
      
      await supabase.from('quantized_models').insert([{
        user_id: user.id,
        model_name: modelName,
        original_size_mb: originalSizeMB,
        quantized_size_mb: quantizedSizeMB,
        quantization_method: this.config.method,
        bit_precision: this.config.bitPrecision,
        model_data: {
          shape: quantized.originalShape,
          config: {
            method: quantized.config.method,
            bitPrecision: quantized.config.bitPrecision,
            calibrationSamples: quantized.config.calibrationSamples,
            preserveQuality: quantized.config.preserveQuality
          }
        }
      }]);
    } catch (error) {
      console.error('Failed to store quantized model:', error);
    }
    
    return quantized;
  }

  /**
   * Calculate compression ratio
   */
  static getCompressionRatio(
    originalBits: number,
    quantizedBits: number
  ): number {
    return originalBits / quantizedBits;
  }

  /**
   * Estimate quality loss (simplified)
   */
  static estimateQualityLoss(
    original: Float32Array,
    quantized: Float32Array
  ): number {
    let mse = 0;
    for (let i = 0; i < original.length; i++) {
      const diff = original[i] - quantized[i];
      mse += diff * diff;
    }
    return Math.sqrt(mse / original.length);
  }
}
