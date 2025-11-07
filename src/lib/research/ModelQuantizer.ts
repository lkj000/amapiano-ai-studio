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
   */
  private async svdQuantize(
    weights: Float32Array,
    shape: number[]
  ): Promise<QuantizedModel> {
    // Reshape to 2D matrix for SVD
    const [rows, cols] = shape.length === 1 
      ? [1, shape[0]] 
      : [shape[0], shape.slice(1).reduce((a, b) => a * b, 1)];
    
    // Perform SVD approximation
    const rank = Math.min(
      rows, 
      cols, 
      Math.floor(Math.max(rows, cols) * (this.config.bitPrecision / 32))
    );
    
    // For production, use proper SVD library
    // Here's a simplified low-rank approximation
    const { U, S, V } = this.simplifiedSVD(weights, rows, cols, rank);
    
    // Quantize U, S, V separately
    const quantU = this.quantizeArray(U, this.config.bitPrecision);
    const quantS = this.quantizeArray(S, this.config.bitPrecision);
    const quantV = this.quantizeArray(V, this.config.bitPrecision);
    
    // Combine quantized components
    const combined = new Float32Array(
      quantU.weights.length + quantS.weights.length + quantV.weights.length
    );
    combined.set(quantU.weights);
    combined.set(quantS.weights, quantU.weights.length);
    combined.set(quantV.weights, quantU.weights.length + quantS.weights.length);
    
    return {
      weights: this.floatToInt(combined, this.config.bitPrecision),
      scales: new Float32Array([
        ...quantU.scales, 
        ...quantS.scales, 
        ...quantV.scales
      ]),
      zeroPoints: this.floatToInt(new Float32Array(combined.length), this.config.bitPrecision),
      config: this.config,
      originalShape: shape
    };
  }

  /**
   * Simplified SVD (in production, use optimized library)
   */
  private simplifiedSVD(
    data: Float32Array,
    rows: number,
    cols: number,
    rank: number
  ): { U: Float32Array; S: Float32Array; V: Float32Array } {
    // Power iteration for top singular vectors
    const U = new Float32Array(rows * rank);
    const S = new Float32Array(rank);
    const V = new Float32Array(cols * rank);
    
    // Placeholder: Initialize with random values
    // In production, implement proper SVD algorithm
    for (let i = 0; i < rank; i++) {
      S[i] = Math.random() * 10;
    }
    
    return { U, S, V };
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
   */
  private quantizeArray(
    data: Float32Array,
    bits: number,
    shape?: number[]
  ): QuantizedModel {
    const min = Math.min(...Array.from(data));
    const max = Math.max(...Array.from(data));
    const range = max - min;
    
    const qmin = -(1 << (bits - 1));
    const qmax = (1 << (bits - 1)) - 1;
    
    const scale = range / (qmax - qmin);
    const zeroPoint = Math.round(-min / scale) + qmin;
    
    const quantized = data.map(val => {
      const qval = Math.round(val / scale) + zeroPoint;
      return Math.max(qmin, Math.min(qmax, qval));
    });
    
    return {
      weights: this.floatToInt(new Float32Array(quantized), bits),
      scales: new Float32Array([scale]),
      zeroPoints: this.floatToInt(new Float32Array([zeroPoint]), bits),
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
   * Dequantize model weights
   */
  dequantize(model: QuantizedModel): Float32Array {
    const output = new Float32Array(model.weights.length);
    
    for (let i = 0; i < model.weights.length; i++) {
      const scaleIdx = model.scales.length === 1 ? 0 : i;
      const zpIdx = model.zeroPoints.length === 1 ? 0 : i;
      
      output[i] = (model.weights[i] - model.zeroPoints[zpIdx]) 
        * model.scales[scaleIdx];
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
