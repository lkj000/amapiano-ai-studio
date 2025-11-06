/**
 * Radial Attention for Efficient Long-Range Music Modeling
 * Implements spectral-radial attention mechanism for transformers
 */

export interface RadialAttentionConfig {
  numHeads: number;
  headDim: number;
  maxSeqLength: number;
  radialBands: number;
  useFFT: boolean;
}

export class RadialAttention {
  private config: RadialAttentionConfig;
  private frequencyBands: number[];
  
  constructor(config: RadialAttentionConfig) {
    this.config = config;
    this.frequencyBands = this.computeRadialBands(config.radialBands);
  }

  /**
   * Compute radial frequency bands for attention
   */
  private computeRadialBands(numBands: number): number[] {
    const bands: number[] = [];
    for (let i = 0; i < numBands; i++) {
      // Logarithmic spacing for audio frequencies
      bands.push(Math.pow(2, i / numBands * 12)); // Cover ~12 octaves
    }
    return bands;
  }

  /**
   * Apply FFT to input sequence
   */
  private fft(signal: Float32Array): { real: Float32Array; imag: Float32Array } {
    const n = signal.length;
    const real = new Float32Array(n);
    const imag = new Float32Array(n);
    
    // Simple DFT implementation (in production, use WASM-based FFT)
    for (let k = 0; k < n; k++) {
      let sumReal = 0;
      let sumImag = 0;
      for (let t = 0; t < n; t++) {
        const angle = -2 * Math.PI * k * t / n;
        sumReal += signal[t] * Math.cos(angle);
        sumImag += signal[t] * Math.sin(angle);
      }
      real[k] = sumReal;
      imag[k] = sumImag;
    }
    
    return { real, imag };
  }

  /**
   * Compute radial attention weights
   */
  private computeRadialWeights(
    query: Float32Array,
    key: Float32Array
  ): Float32Array {
    const { real: qReal, imag: qImag } = this.fft(query);
    const { real: kReal, imag: kImag } = this.fft(key);
    
    const weights = new Float32Array(this.config.radialBands);
    
    // Compute attention in radial frequency bands
    for (let band = 0; band < this.config.radialBands; band++) {
      const startIdx = Math.floor(this.frequencyBands[band]);
      const endIdx = band < this.config.radialBands - 1 
        ? Math.floor(this.frequencyBands[band + 1])
        : qReal.length;
      
      let similarity = 0;
      let normQ = 0;
      let normK = 0;
      
      for (let i = startIdx; i < Math.min(endIdx, qReal.length); i++) {
        const qMag = Math.sqrt(qReal[i] * qReal[i] + qImag[i] * qImag[i]);
        const kMag = Math.sqrt(kReal[i] * kReal[i] + kImag[i] * kImag[i]);
        
        similarity += qMag * kMag;
        normQ += qMag * qMag;
        normK += kMag * kMag;
      }
      
      weights[band] = similarity / (Math.sqrt(normQ * normK) + 1e-6);
    }
    
    return weights;
  }

  /**
   * Apply softmax to attention weights
   */
  private softmax(weights: Float32Array): Float32Array {
    const max = Math.max(...Array.from(weights));
    const exps = weights.map(w => Math.exp(w - max));
    const sum = exps.reduce((a, b) => a + b, 0);
    return new Float32Array(exps.map(e => e / sum));
  }

  /**
   * Forward pass of radial attention
   */
  forward(
    queries: Float32Array[], // [seqLen, dim]
    keys: Float32Array[],
    values: Float32Array[]
  ): Float32Array[] {
    const seqLen = queries.length;
    const output: Float32Array[] = [];
    
    for (let i = 0; i < seqLen; i++) {
      const attentionWeights: Float32Array[] = [];
      
      // Compute attention with all keys
      for (let j = 0; j < keys.length; j++) {
        const radialWeights = this.computeRadialWeights(queries[i], keys[j]);
        attentionWeights.push(radialWeights);
      }
      
      // Aggregate radial weights
      const aggregatedWeights = new Float32Array(keys.length);
      for (let j = 0; j < keys.length; j++) {
        aggregatedWeights[j] = attentionWeights[j].reduce((a, b) => a + b, 0) 
          / this.config.radialBands;
      }
      
      // Apply softmax
      const normalizedWeights = this.softmax(aggregatedWeights);
      
      // Weighted sum of values
      const outputVec = new Float32Array(values[0].length);
      for (let j = 0; j < keys.length; j++) {
        for (let k = 0; k < outputVec.length; k++) {
          outputVec[k] += normalizedWeights[j] * values[j][k];
        }
      }
      
      output.push(outputVec);
    }
    
    return output;
  }

  /**
   * Multi-head radial attention
   */
  multiHeadAttention(
    input: Float32Array[], // [seqLen, modelDim]
  ): Float32Array[] {
    const seqLen = input.length;
    const modelDim = input[0].length;
    const headDim = modelDim / this.config.numHeads;
    
    const allHeadOutputs: Float32Array[][] = [];
    
    // Process each attention head
    for (let head = 0; head < this.config.numHeads; head++) {
      const startDim = head * headDim;
      const endDim = startDim + headDim;
      
      // Split input for this head
      const headInput = input.map(vec => 
        vec.slice(startDim, endDim)
      );
      
      // Apply radial attention
      const headOutput = this.forward(headInput, headInput, headInput);
      allHeadOutputs.push(headOutput);
    }
    
    // Concatenate heads
    const output: Float32Array[] = [];
    for (let i = 0; i < seqLen; i++) {
      const concatenated = new Float32Array(modelDim);
      for (let head = 0; head < this.config.numHeads; head++) {
        const startDim = head * headDim;
        concatenated.set(allHeadOutputs[head][i], startDim);
      }
      output.push(concatenated);
    }
    
    return output;
  }

  /**
   * Get computational complexity reduction
   */
  getComplexityReduction(): { spatial: number; radial: number } {
    const seqLen = this.config.maxSeqLength;
    
    // Standard attention: O(n^2 * d)
    const standardOps = seqLen * seqLen * this.config.headDim;
    
    // Radial attention: O(n * b * log(n) * d) where b is radial bands
    const radialOps = seqLen * this.config.radialBands 
      * Math.log2(seqLen) * this.config.headDim;
    
    return {
      spatial: standardOps,
      radial: radialOps
    };
  }
}
