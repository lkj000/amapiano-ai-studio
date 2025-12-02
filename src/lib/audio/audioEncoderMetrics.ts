/**
 * Audio Encoder Quality Metrics
 * Comprehensive metrics for evaluating audio reconstruction quality
 * 
 * Fixed issues:
 * - SNR -inf when reconstruction error > signal energy
 * - Silent/corrupt audio detection
 * - Better edge case handling with epsilon values
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
  warnings: string[];             // Any warnings about input quality
}

const EPSILON = 1e-10;
const MIN_SNR = -60; // Floor for SNR to avoid -Infinity
const MAX_SNR = 100; // Ceiling for SNR

/**
 * Detect if audio is silent or near-silent
 */
function detectSilentAudio(samples: Float32Array, threshold = 1e-6): boolean {
  const rms = Math.sqrt(samples.reduce((acc, s) => acc + s * s, 0) / samples.length);
  return rms < threshold;
}

/**
 * Calculate comprehensive audio quality metrics between original and reconstructed audio
 */
export function calculateEncoderMetrics(
  original: Float32Array,
  reconstructed: Float32Array
): AudioEncoderMetrics {
  const warnings: string[] = [];
  const length = Math.min(original.length, reconstructed.length);
  
  // Input validation
  if (length === 0) {
    warnings.push('Empty audio input');
    return createDefaultMetrics(warnings);
  }
  
  // Check for silent audio
  const originalIsSilent = detectSilentAudio(original);
  const reconstructedIsSilent = detectSilentAudio(reconstructed);
  
  if (originalIsSilent) {
    warnings.push('Original audio appears to be silent or near-silent');
  }
  if (reconstructedIsSilent) {
    warnings.push('Reconstructed audio appears to be silent or near-silent');
  }
  
  // Basic error metrics with epsilon protection
  let sumSquaredError = 0;
  let sumAbsoluteError = 0;
  let sumOriginalSquared = 0;
  let sumReconSquared = 0;
  let maxError = 0;
  
  for (let i = 0; i < length; i++) {
    const orig = original[i];
    const recon = reconstructed[i];
    const error = orig - recon;
    
    sumSquaredError += error * error;
    sumAbsoluteError += Math.abs(error);
    sumOriginalSquared += orig * orig;
    sumReconSquared += recon * recon;
    maxError = Math.max(maxError, Math.abs(error));
  }
  
  const mse = sumSquaredError / length;
  const mae = sumAbsoluteError / length;
  const peakError = maxError;
  
  // Improved SNR calculation with proper edge case handling
  let snr: number;
  if (sumOriginalSquared < EPSILON) {
    // Original is silent
    snr = sumSquaredError < EPSILON ? MAX_SNR : MIN_SNR;
    if (sumSquaredError >= EPSILON) {
      warnings.push('Cannot compute meaningful SNR: original signal is silent');
    }
  } else if (sumSquaredError < EPSILON) {
    // Perfect reconstruction
    snr = MAX_SNR;
  } else {
    const ratio = sumOriginalSquared / sumSquaredError;
    snr = 10 * Math.log10(ratio);
    // Clamp to reasonable range
    snr = Math.max(MIN_SNR, Math.min(MAX_SNR, snr));
  }
  
  // Add warning for very poor SNR
  if (snr < 0) {
    warnings.push(`Poor reconstruction: SNR=${snr.toFixed(1)}dB (noise exceeds signal)`);
  }
  
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
    snr,
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
    warnings,
  };
}

function createDefaultMetrics(warnings: string[]): AudioEncoderMetrics {
  return {
    snr: MIN_SNR,
    spectralConvergence: 1,
    logSpectralDistance: 100,
    mse: 1,
    mae: 1,
    peakError: 1,
    phaseCoherence: 0,
    transientPreservation: 0,
    stereoImaging: 0,
    dynamicRangePreservation: 0,
    overallQuality: 0,
    warnings,
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
    return { spectralConvergence: 1, logSpectralDistance: 100 };
  }
  
  let totalSpectralDiff = 0;
  let totalOriginalEnergy = 0;
  let totalLogDiff = 0;
  let validFrames = 0;
  
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
    
    // Log spectral distance per frame (with floor for silent frames)
    const origLog = origEnergy > EPSILON ? 10 * Math.log10(origEnergy + EPSILON) : -60;
    const reconLog = reconEnergy > EPSILON ? 10 * Math.log10(reconEnergy + EPSILON) : -60;
    totalLogDiff += Math.abs(origLog - reconLog);
    validFrames++;
  }
  
  const spectralConvergence = totalOriginalEnergy > EPSILON 
    ? Math.sqrt(totalSpectralDiff / (totalOriginalEnergy + EPSILON))
    : 1;
  
  const logSpectralDistance = validFrames > 0 ? totalLogDiff / validFrames : 100;
  
  return { 
    spectralConvergence: Math.min(2, spectralConvergence), 
    logSpectralDistance: Math.min(100, logSpectralDistance),
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
  let validWindows = 0;
  
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
    if (denom > EPSILON) {
      totalCoherence += dotProduct / denom;
      validWindows++;
    }
  }
  
  if (validWindows === 0) return 0.5;
  
  const avgCoherence = totalCoherence / validWindows;
  return Math.max(0, Math.min(1, (avgCoherence + 1) / 2)); // Normalize to 0-1
}

function calculateTransientPreservation(
  original: Float32Array,
  reconstructed: Float32Array
): number {
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
  
  if (origDiffs.length === 0 || reconDiffs.length === 0) return 0.5;
  
  const origMean = origDiffs.reduce((a, b) => a + b, 0) / origDiffs.length;
  const origStd = Math.sqrt(origDiffs.reduce((a, b) => a + (b - origMean) ** 2, 0) / origDiffs.length);
  
  const reconMean = reconDiffs.reduce((a, b) => a + b, 0) / reconDiffs.length;
  const reconStd = Math.sqrt(reconDiffs.reduce((a, b) => a + (b - reconMean) ** 2, 0) / reconDiffs.length);
  
  // Count transients
  const origThreshold = origMean + threshold * (origStd + EPSILON);
  const reconThreshold = reconMean + threshold * (reconStd + EPSILON);
  
  const origTransients = origDiffs.filter(d => d > origThreshold).length;
  const reconTransients = reconDiffs.filter(d => d > reconThreshold).length;
  
  if (origTransients === 0) return reconTransients === 0 ? 1.0 : 0.5;
  
  const ratio = reconTransients / origTransients;
  return Math.max(0, Math.min(1, 1 - Math.abs(1 - ratio)));
}

function calculateDynamicRangePreservation(
  original: Float32Array,
  reconstructed: Float32Array
): number {
  // Find peak values (avoiding spread operator for large arrays)
  let origPeak = 0;
  let reconPeak = 0;
  
  for (let i = 0; i < original.length; i++) {
    origPeak = Math.max(origPeak, Math.abs(original[i]));
  }
  for (let i = 0; i < reconstructed.length; i++) {
    reconPeak = Math.max(reconPeak, Math.abs(reconstructed[i]));
  }
  
  // Calculate RMS
  let origSumSq = 0;
  let reconSumSq = 0;
  
  for (let i = 0; i < original.length; i++) {
    origSumSq += original[i] * original[i];
  }
  for (let i = 0; i < reconstructed.length; i++) {
    reconSumSq += reconstructed[i] * reconstructed[i];
  }
  
  const origRms = Math.sqrt(origSumSq / (original.length + EPSILON));
  const reconRms = Math.sqrt(reconSumSq / (reconstructed.length + EPSILON));
  
  const origDynamic = origPeak / (origRms + EPSILON);
  const reconDynamic = reconPeak / (reconRms + EPSILON);
  
  const ratio = reconDynamic / (origDynamic + EPSILON);
  return Math.max(0, Math.min(1, 1 - Math.abs(1 - ratio) * 0.5));
}

function calculateFrequencyDistributionSimilarity(
  original: Float32Array,
  reconstructed: Float32Array
): number {
  const numBands = 8;
  const windowSize = Math.floor(original.length / numBands);
  
  if (windowSize === 0) return 0.5;
  
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
  const origTotal = origBands.reduce((a, b) => a + b, 0) + EPSILON;
  const reconTotal = reconBands.reduce((a, b) => a + b, 0) + EPSILON;
  
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
  
  // Normalize SNR (map from MIN_SNR..MAX_SNR to 0..100)
  const snrNormalized = (metrics.snr - MIN_SNR) / (MAX_SNR - MIN_SNR);
  const snrScore = Math.max(0, Math.min(100, snrNormalized * 100));
  
  // Spectral score (lower is better, invert and clamp)
  const spectralScore = Math.max(0, Math.min(100, 
    100 - metrics.spectralConvergence * 50 - Math.min(metrics.logSpectralDistance, 50)
  ));
  
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
): { passed: boolean; failures: string[]; warnings: string[] } {
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
    warnings: metrics.warnings || [],
  };
}

/**
 * Quick diagnostic for audio quality issues
 */
export function diagnoseAudioQuality(
  original: Float32Array,
  reconstructed: Float32Array
): { diagnosis: string; severity: 'ok' | 'warning' | 'error'; suggestions: string[] } {
  const metrics = calculateEncoderMetrics(original, reconstructed);
  const suggestions: string[] = [];
  
  // Check for silent audio
  if (metrics.warnings.some(w => w.includes('silent'))) {
    return {
      diagnosis: 'Audio input appears to be silent or corrupted',
      severity: 'error',
      suggestions: [
        'Check that audio files are loaded correctly',
        'Verify audio data is not all zeros',
        'Ensure audio format is compatible (Float32Array normalized to -1..1)',
      ],
    };
  }
  
  // Check SNR
  if (metrics.snr < 0) {
    suggestions.push('Reconstruction error exceeds signal - model may need more training');
    suggestions.push('Check if loss function captures perceptual quality');
    suggestions.push('Consider using perceptual loss (e.g., multi-scale spectral loss)');
  } else if (metrics.snr < 20) {
    suggestions.push('Low SNR - consider increasing model capacity or training iterations');
  }
  
  // Check spectral quality
  if (metrics.spectralConvergence > 0.5) {
    suggestions.push('Poor spectral reconstruction - check frequency domain preservation');
    suggestions.push('Consider adding spectral loss term to training objective');
  }
  
  // Check phase
  if (metrics.phaseCoherence < 0.7) {
    suggestions.push('Phase coherence is low - consider phase-aware loss functions');
  }
  
  // Check transients
  if (metrics.transientPreservation < 0.6) {
    suggestions.push('Transients not well preserved - consider transient-aware processing');
  }
  
  // Check dynamic range
  if (metrics.dynamicRangePreservation < 0.7) {
    suggestions.push('Dynamic range compression detected - avoid over-normalization');
  }
  
  const severity = metrics.overallQuality >= 60 ? 'ok' : 
                   metrics.overallQuality >= 30 ? 'warning' : 'error';
  
  return {
    diagnosis: `Overall quality: ${metrics.overallQuality.toFixed(1)}/100, SNR: ${metrics.snr.toFixed(1)}dB`,
    severity,
    suggestions,
  };
}
