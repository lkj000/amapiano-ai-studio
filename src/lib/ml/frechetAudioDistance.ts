/**
 * Fréchet Audio Distance (FAD) Calculator
 * 
 * Improved implementation with proper FFT via Web Audio API
 * and correct matrix operations for audio quality assessment.
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
 * FFT using Web Audio API AnalyserNode for O(n log n) complexity
 */
async function computeFFT(audioBuffer: AudioBuffer, frameStart: number, frameSize: number): Promise<Float32Array> {
  const audioContext = new OfflineAudioContext(1, frameSize, audioBuffer.sampleRate);
  const analyser = audioContext.createAnalyser();
  analyser.fftSize = frameSize;
  
  // Create buffer source with the frame data
  const frameBuffer = audioContext.createBuffer(1, frameSize, audioBuffer.sampleRate);
  const frameData = frameBuffer.getChannelData(0);
  const sourceData = audioBuffer.getChannelData(0);
  
  for (let i = 0; i < frameSize && (frameStart + i) < sourceData.length; i++) {
    frameData[i] = sourceData[frameStart + i];
  }
  
  // Simple magnitude spectrum calculation (synchronous fallback)
  const spectrum = new Float32Array(frameSize / 2);
  
  // Apply Hann window
  const windowed = new Float32Array(frameSize);
  for (let i = 0; i < frameSize; i++) {
    windowed[i] = frameData[i] * (0.5 - 0.5 * Math.cos(2 * Math.PI * i / (frameSize - 1)));
  }
  
  // Cooley-Tukey FFT implementation (O(n log n))
  const { real, imag } = cooleyTukeyFFT(windowed);
  
  for (let i = 0; i < frameSize / 2; i++) {
    spectrum[i] = Math.sqrt(real[i] * real[i] + imag[i] * imag[i]);
  }
  
  return spectrum;
}

/**
 * Cooley-Tukey FFT algorithm - O(n log n) complexity
 */
function cooleyTukeyFFT(signal: Float32Array): { real: Float32Array; imag: Float32Array } {
  const n = signal.length;
  
  // Ensure power of 2
  const nextPow2 = Math.pow(2, Math.ceil(Math.log2(n)));
  const paddedSignal = new Float32Array(nextPow2);
  paddedSignal.set(signal);
  
  const real = new Float32Array(nextPow2);
  const imag = new Float32Array(nextPow2);
  real.set(paddedSignal);
  
  // Bit-reversal permutation
  const bits = Math.log2(nextPow2);
  for (let i = 0; i < nextPow2; i++) {
    const j = reverseBits(i, bits);
    if (j > i) {
      [real[i], real[j]] = [real[j], real[i]];
      [imag[i], imag[j]] = [imag[j], imag[i]];
    }
  }
  
  // Cooley-Tukey iterative FFT
  for (let size = 2; size <= nextPow2; size *= 2) {
    const halfSize = size / 2;
    const angle = -2 * Math.PI / size;
    
    for (let i = 0; i < nextPow2; i += size) {
      for (let j = 0; j < halfSize; j++) {
        const k = i + j;
        const l = k + halfSize;
        
        const tReal = Math.cos(angle * j) * real[l] - Math.sin(angle * j) * imag[l];
        const tImag = Math.sin(angle * j) * real[l] + Math.cos(angle * j) * imag[l];
        
        real[l] = real[k] - tReal;
        imag[l] = imag[k] - tImag;
        real[k] = real[k] + tReal;
        imag[k] = imag[k] + tImag;
      }
    }
  }
  
  return { real: real.slice(0, n), imag: imag.slice(0, n) };
}

function reverseBits(x: number, bits: number): number {
  let result = 0;
  for (let i = 0; i < bits; i++) {
    result = (result << 1) | (x & 1);
    x >>= 1;
  }
  return result;
}

/**
 * Extract MFCC-like features from spectrum using proper mel filterbank
 */
function extractMFCCFromSpectrum(spectrum: Float32Array, sampleRate: number, numFeatures: number): number[] {
  const numFilters = numFeatures + 2;
  const melBands = computeMelFilterbank(spectrum.length, sampleRate, numFilters);
  
  // Apply filterbank and log compression
  const logMel = new Float32Array(numFilters);
  for (let i = 0; i < numFilters; i++) {
    let sum = 0;
    for (let j = 0; j < spectrum.length; j++) {
      sum += spectrum[j] * melBands[i][j];
    }
    logMel[i] = Math.log(Math.max(sum, 1e-10));
  }
  
  // DCT-II to get MFCCs
  const mfcc: number[] = [];
  for (let i = 0; i < numFeatures; i++) {
    let coeff = 0;
    for (let j = 0; j < numFilters; j++) {
      coeff += logMel[j] * Math.cos(Math.PI * i * (j + 0.5) / numFilters);
    }
    mfcc.push(coeff * Math.sqrt(2 / numFilters));
  }
  
  return mfcc;
}

/**
 * Compute mel filterbank with proper frequency scaling
 */
function computeMelFilterbank(spectrumSize: number, sampleRate: number, numFilters: number): Float32Array[] {
  const fMin = 0;
  const fMax = sampleRate / 2;
  
  // Mel scale conversion
  const melMin = 2595 * Math.log10(1 + fMin / 700);
  const melMax = 2595 * Math.log10(1 + fMax / 700);
  
  // Center frequencies in mel scale
  const melPoints: number[] = [];
  for (let i = 0; i <= numFilters + 1; i++) {
    melPoints.push(melMin + i * (melMax - melMin) / (numFilters + 1));
  }
  
  // Convert back to Hz
  const hzPoints = melPoints.map(mel => 700 * (Math.pow(10, mel / 2595) - 1));
  
  // Convert to FFT bin indices
  const binPoints = hzPoints.map(hz => Math.floor((spectrumSize + 1) * hz / fMax));
  
  // Create triangular filterbank
  const filterbank: Float32Array[] = [];
  for (let i = 0; i < numFilters; i++) {
    const filter = new Float32Array(spectrumSize);
    const start = binPoints[i];
    const center = binPoints[i + 1];
    const end = binPoints[i + 2];
    
    for (let j = start; j < center && j < spectrumSize; j++) {
      filter[j] = (j - start) / (center - start + 1e-10);
    }
    for (let j = center; j < end && j < spectrumSize; j++) {
      filter[j] = (end - j) / (end - center + 1e-10);
    }
    
    filterbank.push(filter);
  }
  
  return filterbank;
}

/**
 * Extract spectral statistics with proper MFCC extraction
 */
async function extractSpectralStats(audioBuffer: AudioBuffer): Promise<{
  mean: number[];
  covariance: number[][];
  features: number[][];
}> {
  const frameSize = 2048;
  const hopSize = 512;
  const numFeatures = 13;
  const features: number[][] = [];
  const channelData = audioBuffer.getChannelData(0);

  // Extract frame-by-frame spectral features
  for (let i = 0; i < channelData.length - frameSize; i += hopSize) {
    const spectrum = await computeFFT(audioBuffer, i, frameSize);
    const frameFeatures = extractMFCCFromSpectrum(spectrum, audioBuffer.sampleRate, numFeatures);
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

  // Calculate covariance matrix with regularization
  const covariance = createZeroMatrix(numFeatures);
  for (const featureSet of features) {
    for (let i = 0; i < numFeatures; i++) {
      for (let j = 0; j < numFeatures; j++) {
        covariance[i][j] += (featureSet[i] - mean[i]) * (featureSet[j] - mean[j]);
      }
    }
  }
  
  // Regularization for numerical stability
  const regularization = 1e-6;
  for (let i = 0; i < numFeatures; i++) {
    for (let j = 0; j < numFeatures; j++) {
      covariance[i][j] /= Math.max(1, features.length - 1);
    }
    covariance[i][i] += regularization; // Add to diagonal
  }

  return { mean, covariance, features };
}

function createIdentityMatrix(size: number): number[][] {
  const matrix: number[][] = [];
  for (let i = 0; i < size; i++) {
    matrix[i] = new Array(size).fill(0);
    matrix[i][i] = 1;
  }
  return matrix;
}

function createZeroMatrix(size: number): number[][] {
  return Array.from({ length: size }, () => new Array(size).fill(0));
}

function trace(matrix: number[][]): number {
  return matrix.reduce((sum, row, i) => sum + row[i], 0);
}

function matmul(a: number[][], b: number[][]): number[][] {
  const n = a.length;
  const m = b[0].length;
  const result = createZeroMatrix(n);
  
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < m; j++) {
      for (let k = 0; k < a[0].length; k++) {
        result[i][j] += a[i][k] * b[k][j];
      }
    }
  }
  
  return result;
}

/**
 * Matrix square root using Newton-Schulz iteration
 * More accurate than diagonal approximation
 */
function sqrtm(matrix: number[][]): number[][] {
  const n = matrix.length;
  
  // Initialize with scaled identity
  const scale = Math.sqrt(trace(matrix) / n);
  let Y = matrix.map(row => row.map(val => val / (scale * scale + 1e-10)));
  let Z = createIdentityMatrix(n);
  
  // Newton-Schulz iteration: Y_{k+1} = 0.5 * Y_k * (3I - Z_k * Y_k)
  for (let iter = 0; iter < 15; iter++) {
    const ZY = matmul(Z, Y);
    const threeI = createIdentityMatrix(n).map(row => row.map(val => val * 3));
    
    // 3I - ZY
    const diff = threeI.map((row, i) => row.map((val, j) => val - ZY[i][j]));
    
    const newY = matmul(Y, diff).map(row => row.map(val => val * 0.5));
    const newZ = matmul(diff, Z).map(row => row.map(val => val * 0.5));
    
    // Check convergence
    let maxDiff = 0;
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        maxDiff = Math.max(maxDiff, Math.abs(newY[i][j] - Y[i][j]));
      }
    }
    
    Y = newY;
    Z = newZ;
    
    if (maxDiff < 1e-10) break;
  }
  
  // Scale back
  return Y.map(row => row.map(val => val * scale));
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
export async function calculateFAD(
  originalBuffer: AudioBuffer,
  processedBuffer: AudioBuffer
): Promise<FADResult> {
  const originalStats = await extractSpectralStats(originalBuffer);
  const processedStats = await extractSpectralStats(processedBuffer);

  const fadScore = frechetDistance(
    originalStats.mean, originalStats.covariance,
    processedStats.mean, processedStats.covariance
  );

  // Normalize FAD to 0-1 range using sigmoid-like function
  const normalizedFAD = 1 - 1 / (1 + fadScore / 100);

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
  const regularization = 1e-6;

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
      origCov[i][j] /= Math.max(1, originalFeatures.length - 1);
    }
    origCov[i][i] += regularization;
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
      procCov[i][j] /= Math.max(1, processedFeatures.length - 1);
    }
    procCov[i][i] += regularization;
  }

  const fad = frechetDistance(origMean, origCov, procMean, procCov);
  return 1 - 1 / (1 + fad / 100);
}

/**
 * Batch FAD calculation for A/B testing
 */
export async function batchFADCalculation(
  referenceBuffer: AudioBuffer,
  testBuffers: AudioBuffer[]
): Promise<{ index: number; fadScore: number; qualityLevel: string }[]> {
  const results = await Promise.all(
    testBuffers.map(async (buffer, index) => {
      const result = await calculateFAD(referenceBuffer, buffer);
      return {
        index,
        fadScore: result.fadScore,
        qualityLevel: result.qualityLevel
      };
    })
  );

  return results.sort((a, b) => a.fadScore - b.fadScore);
}
