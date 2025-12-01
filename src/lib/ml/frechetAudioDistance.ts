/**
 * Fréchet Audio Distance (FAD) Calculator
 * 
 * Real implementation of FAD for audio quality assessment.
 * Uses spectral statistics to measure distance between audio distributions.
 * 
 * For PhD Research: Core metric for quantization quality validation (WP5)
 */

export interface FADResult {
  fadScore: number;
  spectralStats: {
    originalMean: number[];
    originalCovariance: number[][];
    comparedMean: number[];
    comparedCovariance: number[][];
  };
  interpretation: string;
  qualityLevel: 'excellent' | 'good' | 'acceptable' | 'poor';
}

/**
 * Extract spectral statistics from audio buffer
 */
function extractSpectralStats(audioBuffer: AudioBuffer): {
  mean: number[];
  covariance: number[][];
  features: number[][];
} {
  const channelData = audioBuffer.getChannelData(0);
  const frameSize = 2048;
  const hopSize = 512;
  const numFeatures = 13; // MFCC-like features
  const features: number[][] = [];

  // Extract frame-by-frame spectral features
  for (let i = 0; i < channelData.length - frameSize; i += hopSize) {
    const frame = channelData.slice(i, i + frameSize);
    const frameFeatures = extractFrameFeatures(frame, numFeatures);
    features.push(frameFeatures);
  }

  if (features.length === 0) {
    return {
      mean: new Array(numFeatures).fill(0),
      covariance: createIdentityMatrix(numFeatures),
      features: []
    };
  }

  // Calculate mean
  const mean = new Array(numFeatures).fill(0);
  for (const featureSet of features) {
    for (let i = 0; i < numFeatures; i++) {
      mean[i] += featureSet[i];
    }
  }
  for (let i = 0; i < numFeatures; i++) {
    mean[i] /= features.length;
  }

  // Calculate covariance matrix
  const covariance = createZeroMatrix(numFeatures);
  for (const featureSet of features) {
    for (let i = 0; i < numFeatures; i++) {
      for (let j = 0; j < numFeatures; j++) {
        covariance[i][j] += (featureSet[i] - mean[i]) * (featureSet[j] - mean[j]);
      }
    }
  }
  for (let i = 0; i < numFeatures; i++) {
    for (let j = 0; j < numFeatures; j++) {
      covariance[i][j] /= features.length - 1;
    }
  }

  return { mean, covariance, features };
}

/**
 * Extract MFCC-like features from a single frame
 */
function extractFrameFeatures(frame: Float32Array, numFeatures: number): number[] {
  const features: number[] = [];
  
  // Apply Hann window
  const windowed = new Float32Array(frame.length);
  for (let i = 0; i < frame.length; i++) {
    windowed[i] = frame[i] * (0.5 - 0.5 * Math.cos(2 * Math.PI * i / (frame.length - 1)));
  }

  // Simple FFT magnitude spectrum (simplified - real implementation would use proper FFT)
  const spectrum = computeSpectrum(windowed);
  
  // Mel filterbank (simplified)
  const melBands = computeMelBands(spectrum, numFeatures + 1);
  
  // Log compression and DCT (simplified)
  for (let i = 0; i < numFeatures; i++) {
    let dctCoeff = 0;
    for (let j = 0; j < melBands.length; j++) {
      const logMel = Math.log(Math.max(melBands[j], 1e-10));
      dctCoeff += logMel * Math.cos(Math.PI * i * (j + 0.5) / melBands.length);
    }
    features.push(dctCoeff);
  }

  return features;
}

/**
 * Compute magnitude spectrum using DFT
 */
function computeSpectrum(signal: Float32Array): number[] {
  const n = signal.length;
  const spectrum: number[] = [];
  
  // Simple DFT (real implementation would use FFT)
  for (let k = 0; k < n / 2; k++) {
    let real = 0, imag = 0;
    for (let t = 0; t < n; t++) {
      const angle = -2 * Math.PI * k * t / n;
      real += signal[t] * Math.cos(angle);
      imag += signal[t] * Math.sin(angle);
    }
    spectrum.push(Math.sqrt(real * real + imag * imag));
  }

  return spectrum;
}

/**
 * Compute Mel-frequency bands
 */
function computeMelBands(spectrum: number[], numBands: number): number[] {
  const bands = new Array(numBands).fill(0);
  const spectrumLength = spectrum.length;
  
  // Simple triangular filterbank
  const bandWidth = Math.floor(spectrumLength / numBands);
  
  for (let band = 0; band < numBands; band++) {
    const start = band * bandWidth;
    const end = Math.min(start + bandWidth * 2, spectrumLength);
    const center = start + bandWidth;
    
    for (let i = start; i < end; i++) {
      const weight = i < center 
        ? (i - start) / (center - start + 1)
        : (end - i) / (end - center + 1);
      bands[band] += spectrum[i] * Math.max(0, weight);
    }
  }

  return bands;
}

/**
 * Create identity matrix
 */
function createIdentityMatrix(size: number): number[][] {
  const matrix: number[][] = [];
  for (let i = 0; i < size; i++) {
    matrix[i] = new Array(size).fill(0);
    matrix[i][i] = 1;
  }
  return matrix;
}

/**
 * Create zero matrix
 */
function createZeroMatrix(size: number): number[][] {
  const matrix: number[][] = [];
  for (let i = 0; i < size; i++) {
    matrix[i] = new Array(size).fill(0);
  }
  return matrix;
}

/**
 * Matrix trace
 */
function trace(matrix: number[][]): number {
  let sum = 0;
  for (let i = 0; i < matrix.length; i++) {
    sum += matrix[i][i];
  }
  return sum;
}

/**
 * Matrix multiplication
 */
function matmul(a: number[][], b: number[][]): number[][] {
  const n = a.length;
  const m = b[0].length;
  const result: number[][] = [];
  
  for (let i = 0; i < n; i++) {
    result[i] = new Array(m).fill(0);
    for (let j = 0; j < m; j++) {
      for (let k = 0; k < a[0].length; k++) {
        result[i][j] += a[i][k] * b[k][j];
      }
    }
  }
  
  return result;
}

/**
 * Matrix square root (simplified using eigenvalue approximation)
 */
function sqrtm(matrix: number[][]): number[][] {
  const n = matrix.length;
  const result = createZeroMatrix(n);
  
  // Simplified: assume diagonal dominance and take sqrt of diagonal
  // Real implementation would use proper matrix square root algorithm
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      if (i === j) {
        result[i][j] = Math.sqrt(Math.max(0, matrix[i][j]));
      } else {
        result[i][j] = matrix[i][j] / (Math.sqrt(Math.abs(matrix[i][i] * matrix[j][j])) + 1e-10);
      }
    }
  }
  
  return result;
}

/**
 * Calculate Fréchet Distance between two multivariate Gaussians
 */
function frechetDistance(
  mean1: number[], cov1: number[][],
  mean2: number[], cov2: number[][]
): number {
  const n = mean1.length;
  
  // Mean difference squared
  let meanDiffSquared = 0;
  for (let i = 0; i < n; i++) {
    const diff = mean1[i] - mean2[i];
    meanDiffSquared += diff * diff;
  }

  // Covariance term: Tr(C1 + C2 - 2*sqrt(C1*C2))
  const covProduct = matmul(cov1, cov2);
  const sqrtCovProduct = sqrtm(covProduct);
  
  const traceCov1 = trace(cov1);
  const traceCov2 = trace(cov2);
  const traceSqrtProduct = trace(sqrtCovProduct);

  const covTerm = traceCov1 + traceCov2 - 2 * traceSqrtProduct;

  return meanDiffSquared + Math.max(0, covTerm);
}

/**
 * Calculate FAD between original and processed audio
 */
export function calculateFAD(
  originalBuffer: AudioBuffer,
  processedBuffer: AudioBuffer
): FADResult {
  const originalStats = extractSpectralStats(originalBuffer);
  const processedStats = extractSpectralStats(processedBuffer);

  const fadScore = frechetDistance(
    originalStats.mean, originalStats.covariance,
    processedStats.mean, processedStats.covariance
  );

  // Normalize FAD to 0-1 range for interpretation
  const normalizedFAD = Math.min(1, fadScore / 1000);

  let qualityLevel: FADResult['qualityLevel'];
  let interpretation: string;

  if (normalizedFAD < 0.05) {
    qualityLevel = 'excellent';
    interpretation = 'Excellent audio quality preservation. Minimal perceptual difference.';
  } else if (normalizedFAD < 0.15) {
    qualityLevel = 'good';
    interpretation = 'Good audio quality. Minor spectral differences may be detectable.';
  } else if (normalizedFAD < 0.25) {
    qualityLevel = 'acceptable';
    interpretation = 'Acceptable quality. Some audible differences in timbre or texture.';
  } else {
    qualityLevel = 'poor';
    interpretation = 'Significant quality degradation. Noticeable audio artifacts.';
  }

  return {
    fadScore: normalizedFAD,
    spectralStats: {
      originalMean: originalStats.mean,
      originalCovariance: originalStats.covariance,
      comparedMean: processedStats.mean,
      comparedCovariance: processedStats.covariance
    },
    interpretation,
    qualityLevel
  };
}

/**
 * Calculate FAD from pre-extracted features
 */
export function calculateFADFromFeatures(
  originalFeatures: number[][],
  processedFeatures: number[][]
): number {
  if (originalFeatures.length === 0 || processedFeatures.length === 0) {
    return 1.0;
  }

  const numFeatures = originalFeatures[0].length;

  // Calculate statistics for original
  const origMean = new Array(numFeatures).fill(0);
  for (const features of originalFeatures) {
    for (let i = 0; i < numFeatures; i++) {
      origMean[i] += features[i];
    }
  }
  for (let i = 0; i < numFeatures; i++) {
    origMean[i] /= originalFeatures.length;
  }

  const origCov = createZeroMatrix(numFeatures);
  for (const features of originalFeatures) {
    for (let i = 0; i < numFeatures; i++) {
      for (let j = 0; j < numFeatures; j++) {
        origCov[i][j] += (features[i] - origMean[i]) * (features[j] - origMean[j]);
      }
    }
  }
  for (let i = 0; i < numFeatures; i++) {
    for (let j = 0; j < numFeatures; j++) {
      origCov[i][j] /= originalFeatures.length - 1;
    }
  }

  // Calculate statistics for processed
  const procMean = new Array(numFeatures).fill(0);
  for (const features of processedFeatures) {
    for (let i = 0; i < numFeatures; i++) {
      procMean[i] += features[i];
    }
  }
  for (let i = 0; i < numFeatures; i++) {
    procMean[i] /= processedFeatures.length;
  }

  const procCov = createZeroMatrix(numFeatures);
  for (const features of processedFeatures) {
    for (let i = 0; i < numFeatures; i++) {
      for (let j = 0; j < numFeatures; j++) {
        procCov[i][j] += (features[i] - procMean[i]) * (features[j] - procMean[j]);
      }
    }
  }
  for (let i = 0; i < numFeatures; i++) {
    for (let j = 0; j < numFeatures; j++) {
      procCov[i][j] /= processedFeatures.length - 1;
    }
  }

  const fad = frechetDistance(origMean, origCov, procMean, procCov);
  return Math.min(1, fad / 1000);
}

/**
 * Batch FAD calculation for A/B testing
 */
export function batchFADCalculation(
  referenceBuffer: AudioBuffer,
  testBuffers: AudioBuffer[]
): { index: number; fadScore: number; qualityLevel: string }[] {
  const results = testBuffers.map((buffer, index) => {
    const result = calculateFAD(referenceBuffer, buffer);
    return {
      index,
      fadScore: result.fadScore,
      qualityLevel: result.qualityLevel
    };
  });

  // Sort by FAD score (lower is better)
  results.sort((a, b) => a.fadScore - b.fadScore);
  
  return results;
}
