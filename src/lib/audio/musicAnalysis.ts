/**
 * Musicality Benchmarking Suite (WP5)
 * 
 * Implements objective metrics for evaluating audio quality:
 * - Beat Consistency Score (tempo stability)
 * - Key Stability Index (pitch drift detection)
 * - Transient Smearing Ratio (attack preservation)
 * - Spectral metrics for fidelity
 */

export interface MusicAnalysisResult {
  beatConsistencyScore: number; // 0-100, higher is better
  keyStabilityIndex: number; // 0-100, higher is better
  transientSmearingRatio: number; // 0-1, lower is better
  spectralFlatness: number; // 0-1
  crestFactor: number; // dB
  dynamicRange: number; // dB
  estimatedBPM: number;
  dominantFrequency: number; // Hz
}

export class MusicAnalyzer {
  private audioContext: AudioContext | null = null;
  private fftSize = 2048;

  initialize(audioContext: AudioContext) {
    this.audioContext = audioContext;
  }

  /**
   * Analyze audio buffer and compute all musicality metrics
   */
  async analyzeAudio(audioBuffer: AudioBuffer): Promise<MusicAnalysisResult> {
    if (!this.audioContext) {
      throw new Error('AudioContext not initialized');
    }

    const channelData = audioBuffer.getChannelData(0);
    const sampleRate = audioBuffer.sampleRate;

    // Compute individual metrics
    const beatConsistency = this.computeBeatConsistency(channelData, sampleRate);
    const keyStability = this.computeKeyStability(channelData, sampleRate);
    const transientSmearing = this.computeTransientSmearing(channelData, sampleRate);
    const spectralMetrics = this.computeSpectralMetrics(channelData, sampleRate);
    const dynamicMetrics = this.computeDynamicMetrics(channelData);

    return {
      beatConsistencyScore: beatConsistency.score,
      keyStabilityIndex: keyStability.stability,
      transientSmearingRatio: transientSmearing,
      spectralFlatness: spectralMetrics.flatness,
      crestFactor: dynamicMetrics.crestFactor,
      dynamicRange: dynamicMetrics.dynamicRange,
      estimatedBPM: beatConsistency.bpm,
      dominantFrequency: spectralMetrics.dominantFreq,
    };
  }

  /**
   * Beat Consistency Score
   * Measures tempo stability by detecting beat intervals and computing variance
   */
  private computeBeatConsistency(data: Float32Array, sampleRate: number): { score: number; bpm: number } {
    // Simplified onset detection using energy envelope
    const hopSize = 512;
    const onsets: number[] = [];
    const energyThreshold = 0.1;

    for (let i = 0; i < data.length - hopSize; i += hopSize) {
      const energy = this.computeEnergy(data.slice(i, i + hopSize));
      const prevEnergy = i > 0 ? this.computeEnergy(data.slice(i - hopSize, i)) : 0;
      
      if (energy > prevEnergy * 1.5 && energy > energyThreshold) {
        onsets.push(i / sampleRate); // Convert to seconds
      }
    }

    if (onsets.length < 4) {
      return { score: 0, bpm: 0 }; // Not enough beats detected
    }

    // Compute inter-onset intervals (IOIs)
    const intervals: number[] = [];
    for (let i = 1; i < onsets.length; i++) {
      intervals.push(onsets[i] - onsets[i - 1]);
    }

    // Calculate mean and variance of intervals
    const meanInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const variance = intervals.reduce((sum, val) => sum + Math.pow(val - meanInterval, 2), 0) / intervals.length;
    const stdDev = Math.sqrt(variance);

    // Beat consistency score: lower variance = higher score
    const coefficientOfVariation = stdDev / meanInterval;
    const consistencyScore = Math.max(0, 100 * (1 - coefficientOfVariation * 2));

    // Estimate BPM from mean interval
    const estimatedBPM = meanInterval > 0 ? 60 / meanInterval : 0;

    return {
      score: Math.min(100, consistencyScore),
      bpm: Math.round(estimatedBPM),
    };
  }

  /**
   * Key Stability Index
   * Measures pitch drift over time using spectral analysis
   */
  private computeKeyStability(data: Float32Array, sampleRate: number): { stability: number } {
    const windowSize = 4096;
    const hopSize = windowSize / 2;
    const pitchHistory: number[] = [];

    // Analyze pitch in overlapping windows
    for (let i = 0; i < data.length - windowSize; i += hopSize) {
      const window = data.slice(i, i + windowSize);
      const dominantFreq = this.findDominantFrequency(window, sampleRate);
      if (dominantFreq > 0) {
        pitchHistory.push(dominantFreq);
      }
    }

    if (pitchHistory.length < 2) {
      return { stability: 100 }; // Default to stable if not enough data
    }

    // Compute pitch variance
    const meanPitch = pitchHistory.reduce((a, b) => a + b, 0) / pitchHistory.length;
    const variance = pitchHistory.reduce((sum, val) => sum + Math.pow(val - meanPitch, 2), 0) / pitchHistory.length;
    const stdDev = Math.sqrt(variance);

    // Stability score: lower pitch drift = higher stability
    const stabilityScore = Math.max(0, 100 * (1 - stdDev / meanPitch));

    return { stability: Math.min(100, stabilityScore) };
  }

  /**
   * Transient Smearing Ratio
   * Measures preservation of attack transients (high-frequency content)
   */
  private computeTransientSmearing(data: Float32Array, sampleRate: number): number {
    const windowSize = 256; // Small window for transient detection
    const hopSize = windowSize / 4;
    let transientEnergy = 0;
    let totalEnergy = 0;

    for (let i = 0; i < data.length - windowSize; i += hopSize) {
      const window = data.slice(i, i + windowSize);
      const energy = this.computeEnergy(window);
      const prevWindow = i > 0 ? data.slice(i - hopSize, i - hopSize + windowSize) : new Float32Array(windowSize);
      const prevEnergy = this.computeEnergy(prevWindow);

      totalEnergy += energy;
      
      // Detect transients as sharp energy increases
      if (energy > prevEnergy * 2) {
        transientEnergy += energy;
      }
    }

    // Smearing ratio: lower ratio means better transient preservation
    const smearingRatio = totalEnergy > 0 ? 1 - (transientEnergy / totalEnergy) : 0;
    return Math.max(0, Math.min(1, smearingRatio));
  }

  /**
   * Compute spectral metrics (flatness, dominant frequency)
   */
  private computeSpectralMetrics(data: Float32Array, sampleRate: number): { flatness: number; dominantFreq: number } {
    const spectrum = this.computeFFT(data);
    const magnitudes = spectrum.slice(0, spectrum.length / 2);

    // Spectral flatness (measure of noisiness)
    const geometricMean = Math.pow(
      magnitudes.reduce((prod, val) => prod * (val + 1e-10), 1),
      1 / magnitudes.length
    );
    const arithmeticMean = magnitudes.reduce((sum, val) => sum + val, 0) / magnitudes.length;
    const flatness = arithmeticMean > 0 ? geometricMean / arithmeticMean : 0;

    // Dominant frequency
    const maxMagnitude = Math.max(...magnitudes);
    const maxIndex = magnitudes.indexOf(maxMagnitude);
    const dominantFreq = (maxIndex * sampleRate) / data.length;

    return { flatness, dominantFreq };
  }

  /**
   * Compute dynamic range metrics
   */
  private computeDynamicMetrics(data: Float32Array): { crestFactor: number; dynamicRange: number } {
    const rms = Math.sqrt(data.reduce((sum, val) => sum + val * val, 0) / data.length);
    const peak = Math.max(...data.map(Math.abs));
    
    // Crest factor in dB
    const crestFactor = peak > 0 && rms > 0 ? 20 * Math.log10(peak / rms) : 0;
    
    // Dynamic range (simplified as difference between max and min in dB)
    const maxVal = Math.max(...data);
    const minVal = Math.min(...data.filter(v => Math.abs(v) > 1e-6));
    const dynamicRange = maxVal > 0 && minVal > 0 ? 20 * Math.log10(maxVal / Math.abs(minVal)) : 0;

    return { crestFactor, dynamicRange };
  }

  /**
   * Helper: Compute energy of a signal segment
   */
  private computeEnergy(data: Float32Array): number {
    return Math.sqrt(data.reduce((sum, val) => sum + val * val, 0) / data.length);
  }

  /**
   * Helper: Find dominant frequency using simple peak detection
   */
  private findDominantFrequency(data: Float32Array, sampleRate: number): number {
    const spectrum = this.computeFFT(data);
    const magnitudes = spectrum.slice(0, spectrum.length / 2);
    
    const maxMagnitude = Math.max(...magnitudes);
    const maxIndex = magnitudes.indexOf(maxMagnitude);
    
    return (maxIndex * sampleRate) / data.length;
  }

  /**
   * Helper: Simple FFT computation (placeholder - in production use a library like FFT.js)
   */
  private computeFFT(data: Float32Array): Float32Array {
    // This is a placeholder. In production, use a proper FFT library.
    // For now, return a simple spectral estimation
    const result = new Float32Array(data.length);
    for (let k = 0; k < data.length; k++) {
      let real = 0;
      let imag = 0;
      for (let n = 0; n < data.length; n++) {
        const angle = 2 * Math.PI * k * n / data.length;
        real += data[n] * Math.cos(angle);
        imag -= data[n] * Math.sin(angle);
      }
      result[k] = Math.sqrt(real * real + imag * imag);
    }
    return result;
  }
}

// Singleton instance
export const musicAnalyzer = new MusicAnalyzer();
