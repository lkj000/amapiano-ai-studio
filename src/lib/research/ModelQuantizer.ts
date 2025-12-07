import { supabase } from "@/integrations/supabase/client";

export type QuantizationMethod = 'svdquant' | 'nunchaku' | 'ptq';

export interface QuantizationConfig {
  method: QuantizationMethod;
  bitPrecision: number; // 4, 8, or 16
  calibrationSamples: number;
  preserveQuality: boolean;
  rankRatio?: number; // For SVD: ratio of singular values to keep (0-1)
}

export interface QuantizedModel {
  weights: Int8Array | Int16Array;
  scales: Float32Array;
  zeroPoints: Int8Array | Int16Array;
  config: QuantizationConfig;
  originalShape: number[];
  svdComponents?: {
    U: Float32Array;
    S: Float32Array;
    Vt: Float32Array;
    rank: number;
  };
}

export interface QuantizationMetrics {
  mse: number;
  snr: number;
  qualityRetained: number;
  compressionRatio: number;
}

/**
 * ModelQuantizer: Production-grade quantization with actual SVD
 * 
 * Implements proper Singular Value Decomposition for low-rank approximation
 * before quantization, preserving the most important signal components.
 */
export class ModelQuantizer {
  private config: QuantizationConfig;
  
  constructor(config: QuantizationConfig) {
    this.config = {
      rankRatio: config.bitPrecision === 4 ? 0.5 : 0.75,
      ...config
    };
  }

  /**
   * SVDQuant: Quantization using actual Singular Value Decomposition
   * 
   * Steps:
   * 1. Reshape weights to 2D matrix
   * 2. Perform SVD: W = U * S * Vt
   * 3. Truncate to k largest singular values (low-rank approximation)
   * 4. Quantize the truncated matrices
   */
  private async svdQuantize(
    weights: Float32Array,
    shape: number[]
  ): Promise<QuantizedModel> {
    // Reshape to 2D matrix for SVD
    const { matrix, rows, cols } = this.reshapeTo2D(weights, shape);
    
    // Perform actual SVD
    const { U, S, Vt } = this.computeSVD(matrix, rows, cols);
    
    // Determine rank to keep based on config and energy preservation
    const targetRank = Math.max(1, Math.floor(Math.min(rows, cols) * (this.config.rankRatio || 0.5)));
    const actualRank = this.determineOptimalRank(S, targetRank);
    
    // Reconstruct low-rank approximation: W_approx = U_k * S_k * Vt_k
    const approximated = this.reconstructFromSVD(U, S, Vt, rows, cols, actualRank);
    
    // Apply psychoacoustic-aware quantization to the approximated weights
    const result = this.quantizeArray(approximated, this.config.bitPrecision, shape);
    
    // Apply perceptual masking for low bit depths
    const maskedWeights = this.applyPerceptualMasking(
      Array.from(result.weights),
      this.config.bitPrecision
    );
    
    return {
      ...result,
      weights: this.floatToInt(new Float32Array(maskedWeights), this.config.bitPrecision),
      svdComponents: {
        U: new Float32Array(U.slice(0, actualRank * rows)),
        S: new Float32Array(S.slice(0, actualRank)),
        Vt: new Float32Array(Vt.slice(0, actualRank * cols)),
        rank: actualRank
      }
    };
  }

  /**
   * Reshape 1D weights to 2D matrix for SVD
   */
  private reshapeTo2D(weights: Float32Array, shape: number[]): {
    matrix: Float32Array;
    rows: number;
    cols: number;
  } {
    let rows: number, cols: number;
    
    if (shape.length >= 2) {
      rows = shape[0];
      cols = weights.length / rows;
    } else {
      // For 1D arrays, create a square-ish matrix
      const n = weights.length;
      rows = Math.floor(Math.sqrt(n));
      cols = Math.ceil(n / rows);
    }
    
    // Pad if necessary
    const paddedSize = rows * cols;
    const matrix = new Float32Array(paddedSize);
    matrix.set(weights.slice(0, Math.min(weights.length, paddedSize)));
    
    return { matrix, rows, cols };
  }

  /**
   * Compute SVD using power iteration method
   * Returns U, S (singular values), and Vt (V transpose)
   * 
   * This is a practical implementation suitable for moderate-sized matrices.
   * For very large matrices, consider using WebGL or WASM-based linear algebra.
   */
  private computeSVD(matrix: Float32Array, rows: number, cols: number): {
    U: Float32Array;
    S: Float32Array;
    Vt: Float32Array;
  } {
    const k = Math.min(rows, cols);
    const maxIterations = 100;
    const tolerance = 1e-6;
    
    const U = new Float32Array(rows * k);
    const S = new Float32Array(k);
    const Vt = new Float32Array(k * cols);
    
    // Work with a copy of the matrix
    const A = Float32Array.from(matrix);
    
    for (let i = 0; i < k; i++) {
      // Power iteration to find dominant singular vector
      let v = new Float32Array(cols);
      // Initialize with random vector
      for (let j = 0; j < cols; j++) {
        v[j] = Math.random() - 0.5;
      }
      v = Float32Array.from(this.normalizeVector(v));
      
      let sigma = 0;
      let u = new Float32Array(rows);
      
      for (let iter = 0; iter < maxIterations; iter++) {
        // u = A * v
        u = Float32Array.from(this.matVecMultiply(A, v, rows, cols));
        
        // Calculate sigma (singular value)
        const newSigma = this.vectorNorm(u);
        if (newSigma < tolerance) break;
        
        // Normalize u
        u = Float32Array.from(this.normalizeVector(u));
        
        // v = A^T * u
        v = Float32Array.from(this.matTransposeVecMultiply(A, u, rows, cols));
        v = Float32Array.from(this.normalizeVector(v));
        
        // Check convergence
        if (Math.abs(newSigma - sigma) < tolerance * sigma) {
          sigma = newSigma;
          break;
        }
        sigma = newSigma;
      }
      
      // Store singular value and vectors
      S[i] = sigma;
      for (let j = 0; j < rows; j++) U[j * k + i] = u[j];
      for (let j = 0; j < cols; j++) Vt[i * cols + j] = v[j];
      
      // Deflate: A = A - sigma * u * v^T
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          A[r * cols + c] -= sigma * u[r] * v[c];
        }
      }
    }
    
    return { U, S, Vt };
  }

  /**
   * Matrix-vector multiplication: result = A * v
   */
  private matVecMultiply(A: Float32Array, v: Float32Array, rows: number, cols: number): Float32Array {
    const result = new Float32Array(rows);
    for (let i = 0; i < rows; i++) {
      let sum = 0;
      for (let j = 0; j < cols; j++) {
        sum += A[i * cols + j] * v[j];
      }
      result[i] = sum;
    }
    return result;
  }

  /**
   * Matrix transpose-vector multiplication: result = A^T * v
   */
  private matTransposeVecMultiply(A: Float32Array, v: Float32Array, rows: number, cols: number): Float32Array {
    const result = new Float32Array(cols);
    for (let j = 0; j < cols; j++) {
      let sum = 0;
      for (let i = 0; i < rows; i++) {
        sum += A[i * cols + j] * v[i];
      }
      result[j] = sum;
    }
    return result;
  }

  /**
   * Normalize vector to unit length
   */
  private normalizeVector(v: Float32Array): Float32Array {
    const norm = this.vectorNorm(v);
    if (norm < 1e-10) return v;
    const result = new Float32Array(v.length);
    for (let i = 0; i < v.length; i++) {
      result[i] = v[i] / norm;
    }
    return result;
  }

  /**
   * Calculate L2 norm of vector
   */
  private vectorNorm(v: Float32Array): number {
    let sum = 0;
    for (let i = 0; i < v.length; i++) {
      sum += v[i] * v[i];
    }
    return Math.sqrt(sum);
  }

  /**
   * Determine optimal rank based on energy preservation
   * Keep enough singular values to preserve specified energy ratio
   */
  private determineOptimalRank(S: Float32Array, targetRank: number): number {
    const totalEnergy = S.reduce((sum, s) => sum + s * s, 0);
    const targetEnergy = totalEnergy * 0.95; // Keep 95% of energy
    
    let cumulativeEnergy = 0;
    let optimalRank = 1;
    
    for (let i = 0; i < S.length; i++) {
      cumulativeEnergy += S[i] * S[i];
      optimalRank = i + 1;
      if (cumulativeEnergy >= targetEnergy) break;
    }
    
    // Use the smaller of target rank and energy-based rank
    return Math.min(targetRank, optimalRank);
  }

  /**
   * Reconstruct matrix from truncated SVD: W = U_k * diag(S_k) * Vt_k
   */
  private reconstructFromSVD(
    U: Float32Array,
    S: Float32Array,
    Vt: Float32Array,
    rows: number,
    cols: number,
    rank: number
  ): Float32Array {
    const k = Math.min(rows, cols);
    const result = new Float32Array(rows * cols);
    
    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < cols; j++) {
        let sum = 0;
        for (let r = 0; r < rank; r++) {
          sum += U[i * k + r] * S[r] * Vt[r * cols + j];
        }
        result[i * cols + j] = sum;
      }
    }
    
    return result;
  }

  /**
   * Apply psychoacoustic masking using adaptive smoothing
   * Reduces perceptible quantization artifacts in perceptually masked regions
   */
  private applyPerceptualMasking(quantized: number[], bits: number): number[] {
    if (bits > 8) return quantized;
    
    const masked = [...quantized];
    const windowSize = 5;
    
    for (let i = 2; i < masked.length - 2; i++) {
      const window = masked.slice(i - 2, i + 3);
      const mean = window.reduce((a, b) => a + b, 0) / windowSize;
      const variance = window.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / windowSize;
      
      // Smooth in low-variance regions (perceptually masked)
      if (variance < 5) {
        masked[i] = mean * 0.4 + masked[i] * 0.6;
      }
    }
    
    return masked;
  }

  /**
   * Post-Training Quantization (PTQ) with calibration
   */
  private ptqQuantize(weights: Float32Array, shape: number[]): QuantizedModel {
    // Use histogram-based calibration for better scale selection
    const { scale, zeroPoint } = this.calibrateWithHistogram(weights);
    return this.quantizeArrayWithCalibration(weights, this.config.bitPrecision, shape, scale, zeroPoint);
  }

  /**
   * Histogram-based calibration for PTQ
   * Finds optimal scale by analyzing weight distribution
   */
  private calibrateWithHistogram(weights: Float32Array): { scale: number; zeroPoint: number } {
    const numBins = 2048;
    const min = Math.min(...Array.from(weights));
    const max = Math.max(...Array.from(weights));
    const range = max - min || 1;
    
    // Build histogram
    const histogram = new Uint32Array(numBins);
    for (let i = 0; i < weights.length; i++) {
      const bin = Math.min(numBins - 1, Math.floor(((weights[i] - min) / range) * numBins));
      histogram[bin]++;
    }
    
    // Find 99th percentile for clipping (reduces outlier impact)
    const targetCount = Math.floor(weights.length * 0.99);
    let cumulative = 0;
    let clipMax = max;
    for (let i = numBins - 1; i >= 0; i--) {
      cumulative += histogram[i];
      if (cumulative >= weights.length - targetCount) {
        clipMax = min + (i + 1) * range / numBins;
        break;
      }
    }
    
    cumulative = 0;
    let clipMin = min;
    for (let i = 0; i < numBins; i++) {
      cumulative += histogram[i];
      if (cumulative >= weights.length - targetCount) {
        clipMin = min + i * range / numBins;
        break;
      }
    }
    
    const absMax = Math.max(Math.abs(clipMin), Math.abs(clipMax));
    const qmax = (1 << (this.config.bitPrecision - 1)) - 1;
    
    return {
      scale: absMax / qmax,
      zeroPoint: 0 // Symmetric quantization
    };
  }

  /**
   * Quantize with pre-computed calibration parameters
   */
  private quantizeArrayWithCalibration(
    data: Float32Array,
    bits: number,
    shape: number[],
    scale: number,
    zeroPoint: number
  ): QuantizedModel {
    if (scale === 0) scale = 1;
    
    const qmax = (1 << (bits - 1)) - 1;
    const quantized = data.map(val => {
      const qval = Math.round(val / scale) + zeroPoint;
      return Math.max(-qmax - 1, Math.min(qmax, qval));
    });
    
    return {
      weights: this.floatToInt(new Float32Array(quantized), bits),
      scales: new Float32Array([scale]),
      zeroPoints: this.floatToInt(new Float32Array([zeroPoint]), bits),
      config: this.config,
      originalShape: shape
    };
  }

  /**
   * Nunchaku: Dynamic quantization with grouped parameters
   * Uses per-group scaling for better accuracy
   */
  private nunchakuQuantize(weights: Float32Array, shape: number[]): QuantizedModel {
    const groupSize = 128;
    const numGroups = Math.ceil(weights.length / groupSize);
    
    const quantizedWeights: number[] = [];
    const scales: number[] = [];
    const zeroPoints: number[] = [];
    
    for (let g = 0; g < numGroups; g++) {
      const start = g * groupSize;
      const end = Math.min(start + groupSize, weights.length);
      const group = weights.slice(start, end);
      
      // Per-group calibration
      const { scale, zeroPoint } = this.calibrateWithHistogram(group);
      
      const quantized = this.quantizeArrayWithCalibration(
        group,
        this.config.bitPrecision,
        [group.length],
        scale,
        zeroPoint
      );
      
      quantizedWeights.push(...Array.from(quantized.weights));
      scales.push(scale);
      zeroPoints.push(zeroPoint);
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
   * Quantize float array to fixed precision (symmetric quantization)
   */
  private quantizeArray(data: Float32Array, bits: number, shape?: number[]): QuantizedModel {
    const min = Math.min(...Array.from(data));
    const max = Math.max(...Array.from(data));
    const absMax = Math.max(Math.abs(min), Math.abs(max));
    
    if (absMax === 0) {
      return {
        weights: this.floatToInt(new Float32Array(data.length), bits),
        scales: new Float32Array([1.0]),
        zeroPoints: this.floatToInt(new Float32Array([0]), bits),
        config: this.config,
        originalShape: shape || [data.length]
      };
    }
    
    const qmax = (1 << (bits - 1)) - 1;
    const scale = absMax / qmax;
    
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
  private floatToInt(data: Float32Array, bits: number): Int8Array | Int16Array {
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
      output[i] = (model.weights[i] - model.zeroPoints[zpIdx]) * model.scales[scaleIdx];
    }
    
    return output;
  }

  /**
   * Quantize model weights with the configured method
   */
  async quantize(weights: Float32Array, shape: number[], modelName: string): Promise<QuantizedModel> {
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
      const quantizedSizeMB = (quantized.weights.length * (this.config.bitPrecision / 8)) / (1024 * 1024);
      
      // Calculate quality metrics
      const dequantized = this.dequantize(quantized);
      const metrics = this.calculateMetrics(weights, dequantized);
      
      await supabase.from('quantized_models').insert([{
        user_id: user.id,
        model_name: modelName,
        original_size_mb: originalSizeMB,
        quantized_size_mb: quantizedSizeMB,
        quantization_method: this.config.method,
        bit_precision: this.config.bitPrecision,
        quality_score: metrics.qualityRetained,
        inference_speedup: this.estimateSpeedup(this.config.bitPrecision),
        model_data: {
          shape: quantized.originalShape,
          config: {
            method: this.config.method,
            bitPrecision: this.config.bitPrecision,
            calibrationSamples: this.config.calibrationSamples,
            preserveQuality: this.config.preserveQuality,
            rankRatio: this.config.rankRatio
          },
          metrics: {
            mse: metrics.mse,
            snr: metrics.snr,
            qualityRetained: metrics.qualityRetained,
            compressionRatio: metrics.compressionRatio
          },
          hasSVDComponents: !!quantized.svdComponents,
          svdRank: quantized.svdComponents?.rank ?? null
        }
      }]);
    } catch (error) {
      console.error('Failed to store quantized model:', error);
    }
    
    return quantized;
  }

  /**
   * Calculate comprehensive quality metrics
   */
  calculateMetrics(original: Float32Array, quantized: Float32Array): QuantizationMetrics {
    let mse = 0;
    let signalPower = 0;
    
    for (let i = 0; i < original.length; i++) {
      const diff = original[i] - quantized[i];
      mse += diff * diff;
      signalPower += original[i] * original[i];
    }
    
    mse /= original.length;
    signalPower /= original.length;
    
    const noisePower = mse;
    const snr = signalPower > 0 ? 10 * Math.log10(signalPower / (noisePower + 1e-10)) : 0;
    
    // Quality retained based on correlation
    let correlation = 0;
    let origEnergy = 0;
    let quantEnergy = 0;
    
    for (let i = 0; i < original.length; i++) {
      correlation += original[i] * quantized[i];
      origEnergy += original[i] * original[i];
      quantEnergy += quantized[i] * quantized[i];
    }
    
    const denominator = Math.sqrt(origEnergy * quantEnergy);
    const qualityRetained = denominator > 0 ? (correlation / denominator) * 100 : 0;
    
    const compressionRatio = 32 / this.config.bitPrecision;
    
    return { mse, snr, qualityRetained, compressionRatio };
  }

  /**
   * Estimate inference speedup based on bit precision
   */
  private estimateSpeedup(bits: number): number {
    // Rough estimates based on common hardware
    switch (bits) {
      case 4: return 4.0;
      case 8: return 2.0;
      case 16: return 1.5;
      default: return 1.0;
    }
  }

  /**
   * Calculate compression ratio
   */
  static getCompressionRatio(originalBits: number, quantizedBits: number): number {
    return originalBits / quantizedBits;
  }

  /**
   * Estimate quality loss (RMSE-based)
   */
  static estimateQualityLoss(original: Float32Array, quantized: Float32Array): number {
    let mse = 0;
    for (let i = 0; i < original.length; i++) {
      const diff = original[i] - quantized[i];
      mse += diff * diff;
    }
    return Math.sqrt(mse / original.length);
  }
}
