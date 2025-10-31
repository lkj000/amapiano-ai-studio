/**
 * Spectral Radial Attention Mechanism
 * Doctoral Thesis Contribution #1: Novel attention mechanism for frequency-domain analysis
 * 
 * This implementation focuses on radial frequency patterns characteristic of Amapiano music,
 * particularly the log drum bass patterns and harmonic structures.
 */

export interface SpectralFeatures {
  lowFrequency: number[];    // 20-250 Hz (bass, log drums)
  midFrequency: number[];    // 250-2000 Hz (piano, vocals)
  highFrequency: number[];   // 2000-20000 Hz (cymbals, hi-hats)
  radialPatterns: number[][]; // Circular frequency analysis
  harmonicContent: number[];  // Harmonic series detection
}

export interface AttentionWeights {
  frequency: number;
  weight: number;
  culturalRelevance: number; // How relevant to Amapiano style
  radialPosition: number;     // Position in circular frequency space
}

export class SpectralRadialAttention {
  private sampleRate: number;
  private fftSize: number;
  private culturalFrequencyBands: Map<string, [number, number]>;

  constructor(sampleRate: number = 44100, fftSize: number = 2048) {
    this.sampleRate = sampleRate;
    this.fftSize = fftSize;
    
    // Amapiano-specific frequency bands based on cultural analysis
    this.culturalFrequencyBands = new Map([
      ['log_drum_fundamental', [50, 80]],      // Characteristic log drum bass
      ['log_drum_harmonics', [100, 200]],      // Log drum overtones
      ['piano_fundamental', [261.63, 523.25]], // C4 to C5 (typical piano range)
      ['piano_jazz_extension', [523.25, 1046.5]], // C5 to C6 (jazz voicings)
      ['vocal_presence', [300, 3400]],         // Human vocal range
      ['rhythmic_elements', [2000, 8000]],     // Hi-hats, shakers
    ]);
  }

  /**
   * Apply spectral radial attention to audio features
   * Returns attention weights that emphasize culturally-relevant frequencies
   */
  applyAttention(spectralData: Float32Array): AttentionWeights[] {
    const weights: AttentionWeights[] = [];
    const binWidth = this.sampleRate / this.fftSize;

    for (let i = 0; i < spectralData.length; i++) {
      const frequency = i * binWidth;
      const magnitude = spectralData[i];
      
      // Calculate cultural relevance score
      const culturalRelevance = this.calculateCulturalRelevance(frequency);
      
      // Calculate radial position (circular frequency mapping)
      const radialPosition = this.calculateRadialPosition(frequency);
      
      // Attention weight combines magnitude, cultural relevance, and radial positioning
      const weight = magnitude * culturalRelevance * this.radialAttentionFunction(radialPosition);
      
      weights.push({
        frequency,
        weight,
        culturalRelevance,
        radialPosition
      });
    }

    // Normalize weights
    const maxWeight = Math.max(...weights.map(w => w.weight));
    return weights.map(w => ({
      ...w,
      weight: w.weight / maxWeight
    }));
  }

  /**
   * Extract spectral features with radial attention
   */
  extractFeatures(audioBuffer: Float32Array): SpectralFeatures {
    // Simplified FFT-like feature extraction
    const features: SpectralFeatures = {
      lowFrequency: [],
      midFrequency: [],
      highFrequency: [],
      radialPatterns: [],
      harmonicContent: []
    };

    // Divide into frequency bands
    const chunkSize = 1024;
    for (let i = 0; i < audioBuffer.length; i += chunkSize) {
      const chunk = audioBuffer.slice(i, i + chunkSize);
      const spectrum = this.computeSpectrum(chunk);
      
      // Extract frequency bands with attention
      features.lowFrequency.push(this.extractBand(spectrum, 20, 250));
      features.midFrequency.push(this.extractBand(spectrum, 250, 2000));
      features.highFrequency.push(this.extractBand(spectrum, 2000, 20000));
      
      // Compute radial patterns
      features.radialPatterns.push(this.computeRadialPattern(spectrum));
      
      // Detect harmonics
      features.harmonicContent.push(this.detectHarmonics(spectrum));
    }

    return features;
  }

  /**
   * Calculate cultural relevance score for a frequency
   * Higher scores for frequencies important in Amapiano
   */
  private calculateCulturalRelevance(frequency: number): number {
    let relevance = 0.5; // Base relevance

    for (const [element, [min, max]] of this.culturalFrequencyBands) {
      if (frequency >= min && frequency <= max) {
        // Weight different elements by importance in Amapiano
        switch (element) {
          case 'log_drum_fundamental':
            relevance = Math.max(relevance, 1.0); // Highest priority
            break;
          case 'log_drum_harmonics':
            relevance = Math.max(relevance, 0.9);
            break;
          case 'piano_fundamental':
            relevance = Math.max(relevance, 0.95);
            break;
          case 'piano_jazz_extension':
            relevance = Math.max(relevance, 0.85);
            break;
          case 'vocal_presence':
            relevance = Math.max(relevance, 0.8);
            break;
          case 'rhythmic_elements':
            relevance = Math.max(relevance, 0.75);
            break;
        }
      }
    }

    return relevance;
  }

  /**
   * Map frequency to radial position in circular space
   * Low frequencies at center, high frequencies at periphery
   */
  private calculateRadialPosition(frequency: number): number {
    // Logarithmic mapping (human hearing is logarithmic)
    const minFreq = 20;
    const maxFreq = 20000;
    const logFreq = Math.log(frequency / minFreq) / Math.log(maxFreq / minFreq);
    
    return Math.max(0, Math.min(1, logFreq));
  }

  /**
   * Radial attention function
   * Emphasizes mid-range frequencies where most musical content exists
   */
  private radialAttentionFunction(radialPosition: number): number {
    // Gaussian-like attention centered around 0.4-0.6 (mid frequencies)
    const center = 0.5;
    const width = 0.3;
    const attention = Math.exp(-Math.pow(radialPosition - center, 2) / (2 * width * width));
    
    // Boost for culturally important positions
    if (radialPosition < 0.2) {
      // Low frequencies (log drums) - high importance
      return attention * 1.2;
    } else if (radialPosition > 0.3 && radialPosition < 0.6) {
      // Mid frequencies (piano, vocals) - high importance
      return attention * 1.15;
    }
    
    return attention;
  }

  /**
   * Simplified spectrum computation
   */
  private computeSpectrum(chunk: Float32Array): Float32Array {
    // In production, use Web Audio API FFT
    // This is a simplified placeholder
    const spectrum = new Float32Array(chunk.length / 2);
    
    for (let i = 0; i < spectrum.length; i++) {
      // Compute magnitude (simplified)
      spectrum[i] = Math.abs(chunk[i] || 0);
    }
    
    return spectrum;
  }

  /**
   * Extract energy in a frequency band
   */
  private extractBand(spectrum: Float32Array, minFreq: number, maxFreq: number): number {
    const binWidth = this.sampleRate / this.fftSize;
    const startBin = Math.floor(minFreq / binWidth);
    const endBin = Math.floor(maxFreq / binWidth);
    
    let energy = 0;
    for (let i = startBin; i < endBin && i < spectrum.length; i++) {
      energy += spectrum[i] * spectrum[i];
    }
    
    return Math.sqrt(energy);
  }

  /**
   * Compute radial pattern (circular frequency distribution)
   */
  private computeRadialPattern(spectrum: Float32Array): number[] {
    const pattern: number[] = [];
    const numSegments = 8; // Divide circle into 8 segments
    
    for (let segment = 0; segment < numSegments; segment++) {
      const startIdx = Math.floor((segment / numSegments) * spectrum.length);
      const endIdx = Math.floor(((segment + 1) / numSegments) * spectrum.length);
      
      let energy = 0;
      for (let i = startIdx; i < endIdx; i++) {
        energy += spectrum[i];
      }
      
      pattern.push(energy / (endIdx - startIdx));
    }
    
    return pattern;
  }

  /**
   * Detect harmonic content
   */
  private detectHarmonics(spectrum: Float32Array): number {
    let harmonicStrength = 0;
    const fundamentalBin = 10; // Approximate fundamental frequency bin
    
    // Check for harmonic series (2f, 3f, 4f, etc.)
    for (let harmonic = 2; harmonic <= 8; harmonic++) {
      const harmonicBin = fundamentalBin * harmonic;
      if (harmonicBin < spectrum.length) {
        harmonicStrength += spectrum[harmonicBin];
      }
    }
    
    return harmonicStrength;
  }

  /**
   * Analyze cultural authenticity based on spectral features
   */
  analyzeCulturalAuthenticity(features: SpectralFeatures): {
    score: number;
    details: Record<string, number>;
  } {
    const details: Record<string, number> = {};
    
    // Log drum presence (critical for Amapiano)
    const logDrumEnergy = features.lowFrequency.reduce((a, b) => a + b, 0) / features.lowFrequency.length;
    details.logDrumPresence = Math.min(100, logDrumEnergy * 10);
    
    // Piano harmonic richness
    const pianoHarmonics = features.harmonicContent.reduce((a, b) => a + b, 0) / features.harmonicContent.length;
    details.pianoComplexity = Math.min(100, pianoHarmonics * 15);
    
    // Rhythmic consistency (from high frequencies)
    const rhythmicConsistency = this.calculateVariance(features.highFrequency);
    details.rhythmicConsistency = Math.max(0, 100 - rhythmicConsistency * 50);
    
    // Overall balance
    const lowMid = features.lowFrequency.reduce((a, b) => a + b, 0);
    const midMid = features.midFrequency.reduce((a, b) => a + b, 0);
    const highMid = features.highFrequency.reduce((a, b) => a + b, 0);
    const balance = 1 - Math.abs(lowMid - midMid) / (lowMid + midMid + 1);
    details.frequencyBalance = balance * 100;
    
    // Calculate overall score (weighted average)
    const score = (
      details.logDrumPresence * 0.35 +
      details.pianoComplexity * 0.30 +
      details.rhythmicConsistency * 0.20 +
      details.frequencyBalance * 0.15
    );
    
    return { score, details };
  }

  /**
   * Calculate variance (for consistency measurement)
   */
  private calculateVariance(data: number[]): number {
    const mean = data.reduce((a, b) => a + b, 0) / data.length;
    const variance = data.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / data.length;
    return Math.sqrt(variance);
  }
}

// Export singleton instance
export const spectralRadialAttention = new SpectralRadialAttention();
