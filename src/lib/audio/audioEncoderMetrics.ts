/**
 * Audio Encoder Quality Metrics
 * Comprehensive metrics for evaluating audio reconstruction quality
 */

export interface AudioEncoderMetrics {
  snr: number;                    // Signal-to-Noise Ratio (dB)
  spectralConvergence: number;    // Spectral convergence (0-1, lower is better)
  logSpectralDistance: number;    // Log spectral distance (dB)
  mse: number;                    // Mean Squared Error
  mae: number;                    // Mean Absolute Error
  peakError: number;              // Peak reconstruction error
  phaseCoherence: number;         // Phase coherence (0-1, higher is better)
  transientPreservation: number;  // Transient preservation (0-1, higher is better)
  stereoImaging: number;          // Stereo imaging preservation (0-1, higher is better)
  dynamicRangePreservation: number; // Dynamic range preservation (0-1, higher is better)
  overallQuality: number;         // Combined quality score (0-100)
}

/**
 * Calculate comprehensive audio quality metrics between original and reconstructed audio
 */
export function calculateEncoderMetrics(
  original: Float32Array,
  reconstructed: Float32Array
): AudioEncoderMetrics {
  const length = Math.min(original.length, reconstructed.length);
  
  // Basic error metrics
  let sumSquaredError = 0;
  let sumAbsoluteError = 0;
  let sumOriginalSquared = 0;
  let maxError = 0;
  
  for (let i = 0; i < length; i++) {
    const error = original[i] - reconstructed[i];
    sumSquaredError += error * error;
    sumAbsoluteError += Math.abs(error);
    sumOriginalSquared += original[i] * original[i];
    maxError = Math.max(maxError, Math.abs(error));
  }
  
  const mse = sumSquaredError / length;
  const mae = sumAbsoluteError / length;
  const peakError = maxError;
  
  // SNR calculation
  const snr = sumOriginalSquared > 0 
    ? 10 * Math.log10(sumOriginalSquared / sumSquaredError)
    : mse === 0 ? Infinity : 0;
  
  // Spectral metrics
  const { spectralConvergence, logSpectralDistance } = calculateSpectralMetrics(original, reconstructed);
  
  // Phase coherence
  const phaseCoherence = calculatePhaseCoherence(original, reconstructed);
  
  // Transient preservation
  const transientPreservation = calculateTransientPreservation(original, reconstructed);
  
  // Dynamic range preservation
  const dynamicRangePreservation = calculateDynamicRangePreservation(original, reconstructed);
  
  // Stereo imaging (for mono, use frequency distribution)
  const stereoImaging = calculateFrequencyDistributionSimilarity(original, reconstructed);
  
  // Overall quality score (weighted combination)
  const overallQuality = calculateOverallQuality({
    snr,
    spectralConvergence,
    logSpectralDistance,
    mse,
    phaseCoherence,
    transientPreservation,
    stereoImaging,
    dynamicRangePreservation,
  });
  
  return {
    snr: isFinite(snr) ? snr : (mse === 0 ? 100 : -Infinity),
    spectralConvergence,
    logSpectralDistance,
    mse,
    mae,
    peakError,
    phaseCoherence,
    transientPreservation,
    stereoImaging,
    dynamicRangePreservation,
    overallQuality,
  };
}

function calculateSpectralMetrics(
  original: Float32Array,
  reconstructed: Float32Array
): { spectralConvergence: number; logSpectralDistance: number } {
  const fftSize = 2048;
  const hopSize = 512;
  const numFrames = Math.floor((Math.min(original.length, reconstructed.length) - fftSize) / hopSize);
  
  if (numFrames < 1) {
    return { spectralConvergence: 1, logSpectralDistance: Infinity };
  }
  
  let totalSpectralDiff = 0;
  let totalOriginalEnergy = 0;
  let totalLogDiff = 0;
  
  for (let frame = 0; frame < numFrames; frame++) {
    const start = frame * hopSize;
    
    // Simple energy-based spectral approximation
    let origEnergy = 0;
    let reconEnergy = 0;
    let diffEnergy = 0;
    
    for (let i = 0; i < fftSize; i++) {
      const orig = original[start + i] || 0;
      const recon = reconstructed[start + i] || 0;
      
      origEnergy += orig * orig;
      reconEnergy += recon * recon;
      diffEnergy += (orig - recon) * (orig - recon);
    }
    
    totalSpectralDiff += diffEnergy;
    totalOriginalEnergy += origEnergy;
    
    // Log spectral distance per frame
    const origLog = origEnergy > 0 ? 10 * Math.log10(origEnergy) : -60;
    const reconLog = reconEnergy > 0 ? 10 * Math.log10(reconEnergy) : -60;
    totalLogDiff += Math.abs(origLog - reconLog);
  }
  
  const spectralConvergence = totalOriginalEnergy > 0 
    ? Math.sqrt(totalSpectralDiff / totalOriginalEnergy)
    : 1;
  
  const logSpectralDistance = totalLogDiff / numFrames;
  
  return { 
    spectralConvergence: Math.min(2, spectralConvergence), 
    logSpectralDistance 
  };
}

function calculatePhaseCoherence(
  original: Float32Array,
  reconstructed: Float32Array
): number {
  const windowSize = 256;
  const numWindows = Math.floor(Math.min(original.length, reconstructed.length) / windowSize);
  
  if (numWindows < 2) return 0.5;
  
  let totalCoherence = 0;
  
  for (let w = 0; w < numWindows - 1; w++) {
    const start = w * windowSize;
    
    // Calculate correlation between adjacent windows
    let dotProduct = 0;
    let origNorm = 0;
    let reconNorm = 0;
    
    for (let i = 0; i < windowSize; i++) {
      const orig = original[start + i];
      const recon = reconstructed[start + i];
      
      dotProduct += orig * recon;
      origNorm += orig * orig;
      reconNorm += recon * recon;
    }
    
    const denom = Math.sqrt(origNorm * reconNorm);
    if (denom > 0) {
      totalCoherence += dotProduct / denom;
    }
  }
  
  const avgCoherence = totalCoherence / (numWindows - 1);
  return Math.max(0, Math.min(1, (avgCoherence + 1) / 2)); // Normalize to 0-1
}

function calculateTransientPreservation(
  original: Float32Array,
  reconstructed: Float32Array
): number {
  const windowSize = 128;
  const threshold = 2.0; // Transient detection threshold (std deviations)
  
  // Calculate differences to detect transients
  const origDiffs: number[] = [];
  const reconDiffs: number[] = [];
  
  for (let i = 1; i < original.length - 1; i++) {
    origDiffs.push(Math.abs(original[i] - original[i - 1]));
  }
  for (let i = 1; i < reconstructed.length - 1; i++) {
    reconDiffs.push(Math.abs(reconstructed[i] - reconstructed[i - 1]));
  }
  
  const origMean = origDiffs.reduce((a, b) => a + b, 0) / origDiffs.length;
  const origStd = Math.sqrt(origDiffs.reduce((a, b) => a + (b - origMean) ** 2, 0) / origDiffs.length);
  
  const reconMean = reconDiffs.reduce((a, b) => a + b, 0) / reconDiffs.length;
  const reconStd = Math.sqrt(reconDiffs.reduce((a, b) => a + (b - reconMean) ** 2, 0) / reconDiffs.length);
  
  // Count transients
  const origTransients = origDiffs.filter(d => d > origMean + threshold * origStd).length;
  const reconTransients = reconDiffs.filter(d => d > reconMean + threshold * reconStd).length;
  
  if (origTransients === 0) return 1.0;
  
  const ratio = reconTransients / origTransients;
  return Math.max(0, Math.min(1, 1 - Math.abs(1 - ratio)));
}

function calculateDynamicRangePreservation(
  original: Float32Array,
  reconstructed: Float32Array
): number {
  const origPeak = Math.max(...Array.from(original).map(Math.abs));
  const reconPeak = Math.max(...Array.from(reconstructed).map(Math.abs));
  
  const origRms = Math.sqrt(original.reduce((a, b) => a + b * b, 0) / original.length);
  const reconRms = Math.sqrt(reconstructed.reduce((a, b) => a + b * b, 0) / reconstructed.length);
  
  const origDynamic = origPeak / (origRms + 1e-8);
  const reconDynamic = reconPeak / (reconRms + 1e-8);
  
  const ratio = reconDynamic / (origDynamic + 1e-8);
  return Math.max(0, Math.min(1, 1 - Math.abs(1 - ratio) * 0.5));
}

function calculateFrequencyDistributionSimilarity(
  original: Float32Array,
  reconstructed: Float32Array
): number {
  const numBands = 8;
  const windowSize = Math.floor(original.length / numBands);
  
  const origBands: number[] = [];
  const reconBands: number[] = [];
  
  for (let band = 0; band < numBands; band++) {
    const start = band * windowSize;
    const end = Math.min(start + windowSize, original.length);
    
    let origEnergy = 0;
    let reconEnergy = 0;
    
    for (let i = start; i < end; i++) {
      origEnergy += (original[i] || 0) ** 2;
      reconEnergy += (reconstructed[i] || 0) ** 2;
    }
    
    origBands.push(origEnergy);
    reconBands.push(reconEnergy);
  }
  
  // Normalize
  const origTotal = origBands.reduce((a, b) => a + b, 0) + 1e-8;
  const reconTotal = reconBands.reduce((a, b) => a + b, 0) + 1e-8;
  
  let similarity = 0;
  for (let i = 0; i < numBands; i++) {
    const origRatio = origBands[i] / origTotal;
    const reconRatio = reconBands[i] / reconTotal;
    similarity += Math.min(origRatio, reconRatio);
  }
  
  return similarity;
}

function calculateOverallQuality(metrics: {
  snr: number;
  spectralConvergence: number;
  logSpectralDistance: number;
  mse: number;
  phaseCoherence: number;
  transientPreservation: number;
  stereoImaging: number;
  dynamicRangePreservation: number;
}): number {
  // Weight factors for different metrics
  const weights = {
    snr: 0.25,
    spectral: 0.20,
    phase: 0.15,
    transient: 0.15,
    stereo: 0.10,
    dynamic: 0.15,
  };
  
  // Normalize SNR (0-60dB range to 0-100)
  const snrScore = Math.max(0, Math.min(100, (metrics.snr / 60) * 100));
  
  // Spectral score (lower is better, invert)
  const spectralScore = Math.max(0, 100 - metrics.spectralConvergence * 50 - metrics.logSpectralDistance);
  
  // Other scores already 0-1, multiply by 100
  const phaseScore = metrics.phaseCoherence * 100;
  const transientScore = metrics.transientPreservation * 100;
  const stereoScore = metrics.stereoImaging * 100;
  const dynamicScore = metrics.dynamicRangePreservation * 100;
  
  const overall = 
    weights.snr * snrScore +
    weights.spectral * spectralScore +
    weights.phase * phaseScore +
    weights.transient * transientScore +
    weights.stereo * stereoScore +
    weights.dynamic * dynamicScore;
  
  return Math.max(0, Math.min(100, overall));
}

/**
 * Validate audio quality against thresholds
 */
export function validateAudioQuality(
  metrics: AudioEncoderMetrics,
  thresholds: {
    minSNR?: number;
    maxSpectralConvergence?: number;
    maxLogSpectralDistance?: number;
    minPhaseCoherence?: number;
    minTransientPreservation?: number;
    minOverallQuality?: number;
  } = {}
): { passed: boolean; failures: string[] } {
  const defaults = {
    minSNR: 20,
    maxSpectralConvergence: 0.5,
    maxLogSpectralDistance: 10,
    minPhaseCoherence: 0.7,
    minTransientPreservation: 0.6,
    minOverallQuality: 60,
  };
  
  const t = { ...defaults, ...thresholds };
  const failures: string[] = [];
  
  if (metrics.snr < t.minSNR) {
    failures.push(`SNR ${metrics.snr.toFixed(1)}dB < ${t.minSNR}dB threshold`);
  }
  if (metrics.spectralConvergence > t.maxSpectralConvergence) {
    failures.push(`Spectral convergence ${metrics.spectralConvergence.toFixed(3)} > ${t.maxSpectralConvergence} threshold`);
  }
  if (metrics.logSpectralDistance > t.maxLogSpectralDistance) {
    failures.push(`Log spectral distance ${metrics.logSpectralDistance.toFixed(1)}dB > ${t.maxLogSpectralDistance}dB threshold`);
  }
  if (metrics.phaseCoherence < t.minPhaseCoherence) {
    failures.push(`Phase coherence ${(metrics.phaseCoherence * 100).toFixed(1)}% < ${t.minPhaseCoherence * 100}% threshold`);
  }
  if (metrics.transientPreservation < t.minTransientPreservation) {
    failures.push(`Transient preservation ${(metrics.transientPreservation * 100).toFixed(1)}% < ${t.minTransientPreservation * 100}% threshold`);
  }
  if (metrics.overallQuality < t.minOverallQuality) {
    failures.push(`Overall quality ${metrics.overallQuality.toFixed(1)} < ${t.minOverallQuality} threshold`);
  }
  
  return {
    passed: failures.length === 0,
    failures,
  };
}
