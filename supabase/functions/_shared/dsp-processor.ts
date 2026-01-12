/**
 * Real Server-Side DSP Processing Library
 * Implements actual audio processing algorithms for mastering
 */

// ============= DSP UTILITIES =============

/**
 * Convert dB to linear gain
 */
export function dbToLinear(db: number): number {
  return Math.pow(10, db / 20);
}

/**
 * Convert linear gain to dB
 */
export function linearToDb(linear: number): number {
  return 20 * Math.log10(Math.max(linear, 1e-10));
}

/**
 * Soft clip function for saturation - gentle limiting to prevent harsh distortion
 */
export function softClip(sample: number, threshold: number = 0.95): number {
  if (Math.abs(sample) <= threshold) {
    return sample;
  }
  const sign = sample > 0 ? 1 : -1;
  const excess = Math.abs(sample) - threshold;
  // Gentler curve to preserve dynamics
  return sign * (threshold + Math.tanh(excess * 1.5) * (1 - threshold));
}

/**
 * Fast tanh approximation
 */
export function fastTanh(x: number): number {
  if (x < -3) return -1;
  if (x > 3) return 1;
  const x2 = x * x;
  return x * (27 + x2) / (27 + 9 * x2);
}

// ============= BIQUAD FILTER =============

export interface BiquadCoefficients {
  b0: number;
  b1: number;
  b2: number;
  a1: number;
  a2: number;
}

export interface BiquadState {
  x1: number;
  x2: number;
  y1: number;
  y2: number;
}

export function createBiquadState(): BiquadState {
  return { x1: 0, x2: 0, y1: 0, y2: 0 };
}

export function processBiquad(
  sample: number,
  coeffs: BiquadCoefficients,
  state: BiquadState
): number {
  const output = coeffs.b0 * sample + 
                 coeffs.b1 * state.x1 + 
                 coeffs.b2 * state.x2 - 
                 coeffs.a1 * state.y1 - 
                 coeffs.a2 * state.y2;
  
  state.x2 = state.x1;
  state.x1 = sample;
  state.y2 = state.y1;
  state.y1 = output;
  
  return output;
}

// Filter coefficient calculators
export function lowShelfCoeffs(
  sampleRate: number,
  frequency: number,
  gainDb: number,
  q: number = 0.707
): BiquadCoefficients {
  const A = Math.pow(10, gainDb / 40);
  const w0 = 2 * Math.PI * frequency / sampleRate;
  const cosW0 = Math.cos(w0);
  const sinW0 = Math.sin(w0);
  const alpha = sinW0 / (2 * q);
  const sqrtA = Math.sqrt(A);

  const b0 = A * ((A + 1) - (A - 1) * cosW0 + 2 * sqrtA * alpha);
  const b1 = 2 * A * ((A - 1) - (A + 1) * cosW0);
  const b2 = A * ((A + 1) - (A - 1) * cosW0 - 2 * sqrtA * alpha);
  const a0 = (A + 1) + (A - 1) * cosW0 + 2 * sqrtA * alpha;
  const a1 = -2 * ((A - 1) + (A + 1) * cosW0);
  const a2 = (A + 1) + (A - 1) * cosW0 - 2 * sqrtA * alpha;

  return { b0: b0/a0, b1: b1/a0, b2: b2/a0, a1: a1/a0, a2: a2/a0 };
}

export function highShelfCoeffs(
  sampleRate: number,
  frequency: number,
  gainDb: number,
  q: number = 0.707
): BiquadCoefficients {
  const A = Math.pow(10, gainDb / 40);
  const w0 = 2 * Math.PI * frequency / sampleRate;
  const cosW0 = Math.cos(w0);
  const sinW0 = Math.sin(w0);
  const alpha = sinW0 / (2 * q);
  const sqrtA = Math.sqrt(A);

  const b0 = A * ((A + 1) + (A - 1) * cosW0 + 2 * sqrtA * alpha);
  const b1 = -2 * A * ((A - 1) + (A + 1) * cosW0);
  const b2 = A * ((A + 1) + (A - 1) * cosW0 - 2 * sqrtA * alpha);
  const a0 = (A + 1) - (A - 1) * cosW0 + 2 * sqrtA * alpha;
  const a1 = 2 * ((A - 1) - (A + 1) * cosW0);
  const a2 = (A + 1) - (A - 1) * cosW0 - 2 * sqrtA * alpha;

  return { b0: b0/a0, b1: b1/a0, b2: b2/a0, a1: a1/a0, a2: a2/a0 };
}

export function peakingEQCoeffs(
  sampleRate: number,
  frequency: number,
  gainDb: number,
  q: number = 1.0
): BiquadCoefficients {
  const A = Math.pow(10, gainDb / 40);
  const w0 = 2 * Math.PI * frequency / sampleRate;
  const cosW0 = Math.cos(w0);
  const sinW0 = Math.sin(w0);
  const alpha = sinW0 / (2 * q);

  const b0 = 1 + alpha * A;
  const b1 = -2 * cosW0;
  const b2 = 1 - alpha * A;
  const a0 = 1 + alpha / A;
  const a1 = -2 * cosW0;
  const a2 = 1 - alpha / A;

  return { b0: b0/a0, b1: b1/a0, b2: b2/a0, a1: a1/a0, a2: a2/a0 };
}

export function lowpassCoeffs(
  sampleRate: number,
  frequency: number,
  q: number = 0.707
): BiquadCoefficients {
  const w0 = 2 * Math.PI * frequency / sampleRate;
  const cosW0 = Math.cos(w0);
  const sinW0 = Math.sin(w0);
  const alpha = sinW0 / (2 * q);

  const b0 = (1 - cosW0) / 2;
  const b1 = 1 - cosW0;
  const b2 = (1 - cosW0) / 2;
  const a0 = 1 + alpha;
  const a1 = -2 * cosW0;
  const a2 = 1 - alpha;

  return { b0: b0/a0, b1: b1/a0, b2: b2/a0, a1: a1/a0, a2: a2/a0 };
}

export function highpassCoeffs(
  sampleRate: number,
  frequency: number,
  q: number = 0.707
): BiquadCoefficients {
  const w0 = 2 * Math.PI * frequency / sampleRate;
  const cosW0 = Math.cos(w0);
  const sinW0 = Math.sin(w0);
  const alpha = sinW0 / (2 * q);

  const b0 = (1 + cosW0) / 2;
  const b1 = -(1 + cosW0);
  const b2 = (1 + cosW0) / 2;
  const a0 = 1 + alpha;
  const a1 = -2 * cosW0;
  const a2 = 1 - alpha;

  return { b0: b0/a0, b1: b1/a0, b2: b2/a0, a1: a1/a0, a2: a2/a0 };
}

// ============= COMPRESSOR =============

export interface CompressorState {
  envelope: number;
  gainReduction: number;
}

export interface CompressorSettings {
  threshold: number;     // dB
  ratio: number;         // e.g., 4 for 4:1
  attack: number;        // ms
  release: number;       // ms
  knee: number;          // dB
  makeupGain: number;    // dB
}

export function createCompressorState(): CompressorState {
  return { envelope: 0, gainReduction: 0 };
}

export function processCompressor(
  sample: number,
  settings: CompressorSettings,
  state: CompressorState,
  sampleRate: number
): number {
  // Convert times to coefficients
  const attackCoeff = Math.exp(-1 / (settings.attack * sampleRate / 1000));
  const releaseCoeff = Math.exp(-1 / (settings.release * sampleRate / 1000));
  
  // Get input level in dB
  const inputLevel = linearToDb(Math.abs(sample));
  
  // Envelope follower
  const coeff = inputLevel > state.envelope ? attackCoeff : releaseCoeff;
  state.envelope = coeff * state.envelope + (1 - coeff) * inputLevel;
  
  // Compute gain reduction with soft knee
  let gainReduction = 0;
  const kneeStart = settings.threshold - settings.knee / 2;
  const kneeEnd = settings.threshold + settings.knee / 2;
  
  if (state.envelope > kneeEnd) {
    // Above knee - full compression
    gainReduction = (state.envelope - settings.threshold) * (1 - 1 / settings.ratio);
  } else if (state.envelope > kneeStart) {
    // In knee - interpolated compression
    const kneeRatio = (state.envelope - kneeStart) / settings.knee;
    const kneeGain = kneeRatio * kneeRatio * 0.5;
    gainReduction = kneeGain * (state.envelope - settings.threshold) * (1 - 1 / settings.ratio);
  }
  
  state.gainReduction = gainReduction;
  
  // Apply gain reduction and makeup gain
  const outputGain = dbToLinear(-gainReduction + settings.makeupGain);
  return sample * outputGain;
}

// ============= LIMITER =============

export interface LimiterState {
  delayBuffer: Float32Array;
  delayIndex: number;
  envelope: number;
  gainReduction: number;
}

export interface LimiterSettings {
  ceiling: number;       // dB
  release: number;       // ms
  lookahead: number;     // samples
}

export function createLimiterState(lookaheadSamples: number): LimiterState {
  return {
    delayBuffer: new Float32Array(lookaheadSamples),
    delayIndex: 0,
    envelope: 0,
    gainReduction: 1
  };
}

export function processLimiter(
  sample: number,
  settings: LimiterSettings,
  state: LimiterState,
  sampleRate: number
): number {
  const ceilingLinear = dbToLinear(settings.ceiling);
  const releaseCoeff = Math.exp(-1 / (settings.release * sampleRate / 1000));
  
  // Get delayed sample
  const delayedSample = state.delayBuffer[state.delayIndex];
  
  // Store current sample in delay buffer
  state.delayBuffer[state.delayIndex] = sample;
  state.delayIndex = (state.delayIndex + 1) % state.delayBuffer.length;
  
  // Calculate required gain reduction
  const inputLevel = Math.abs(sample);
  const targetGain = inputLevel > ceilingLinear ? ceilingLinear / inputLevel : 1;
  
  // Smooth gain reduction
  if (targetGain < state.gainReduction) {
    state.gainReduction = targetGain; // Instant attack
  } else {
    state.gainReduction = state.gainReduction + (1 - releaseCoeff) * (targetGain - state.gainReduction);
  }
  
  return delayedSample * state.gainReduction;
}

// ============= STEREO WIDTH =============

export function processStereoWidth(
  leftSample: number,
  rightSample: number,
  width: number  // 0 = mono, 1 = normal, 2 = wide
): [number, number] {
  const mid = (leftSample + rightSample) / 2;
  const side = (leftSample - rightSample) / 2;
  
  const newSide = side * width;
  
  return [mid + newSide, mid - newSide];
}

// ============= SATURATION =============

export function processSaturation(
  sample: number,
  drive: number,  // 0-1
  mix: number     // 0-1 dry/wet
): number {
  if (drive === 0) return sample;
  
  const driveAmount = 1 + drive * 10;
  const saturated = fastTanh(sample * driveAmount) / fastTanh(driveAmount);
  
  return sample * (1 - mix) + saturated * mix;
}

// ============= DE-ESSER =============

export interface DeEsserState {
  detector: BiquadState;
  envelope: number;
  filter: BiquadState;
}

export function createDeEsserState(): DeEsserState {
  return {
    detector: createBiquadState(),
    envelope: 0,
    filter: createBiquadState()
  };
}

export function processDeEsser(
  sample: number,
  threshold: number,  // dB
  reduction: number,  // 0-1
  state: DeEsserState,
  sampleRate: number
): number {
  // High-pass filter to detect sibilance (5-10kHz)
  const detectorCoeffs = highpassCoeffs(sampleRate, 5000, 1.0);
  const detected = processBiquad(sample, detectorCoeffs, state.detector);
  
  // Envelope follower
  const detectedLevel = Math.abs(detected);
  const attackCoeff = Math.exp(-1 / (0.001 * sampleRate));
  const releaseCoeff = Math.exp(-1 / (0.050 * sampleRate));
  
  const coeff = detectedLevel > state.envelope ? attackCoeff : releaseCoeff;
  state.envelope = coeff * state.envelope + (1 - coeff) * detectedLevel;
  
  // Calculate gain reduction
  const thresholdLinear = dbToLinear(threshold);
  let gainReduction = 1;
  if (state.envelope > thresholdLinear) {
    gainReduction = 1 - (reduction * (state.envelope - thresholdLinear) / state.envelope);
  }
  
  // Apply reduction to high frequencies only
  const filterCoeffs = highShelfCoeffs(sampleRate, 5000, linearToDb(gainReduction), 0.707);
  return processBiquad(sample, filterCoeffs, state.filter);
}

// ============= LOUDNESS MEASUREMENT =============

export interface LoudnessState {
  kWeightingStage1: BiquadState;
  kWeightingStage2: BiquadState;
  momentarySum: number;
  shortTermSum: number;
  integratedSum: number;
  momentaryCount: number;
  shortTermCount: number;
  integratedCount: number;
}

export function createLoudnessState(): LoudnessState {
  return {
    kWeightingStage1: createBiquadState(),
    kWeightingStage2: createBiquadState(),
    momentarySum: 0,
    shortTermSum: 0,
    integratedSum: 0,
    momentaryCount: 0,
    shortTermCount: 0,
    integratedCount: 0
  };
}

// K-weighting filter stage 1 (high shelf)
export function kWeightingStage1Coeffs(sampleRate: number): BiquadCoefficients {
  return highShelfCoeffs(sampleRate, 1500, 4, 0.707);
}

// K-weighting filter stage 2 (high pass)
export function kWeightingStage2Coeffs(sampleRate: number): BiquadCoefficients {
  return highpassCoeffs(sampleRate, 38, 0.5);
}

export function measureLoudness(
  samples: Float32Array,
  sampleRate: number
): { lufs: number; peak: number; truePeak: number } {
  const state = createLoudnessState();
  const stage1Coeffs = kWeightingStage1Coeffs(sampleRate);
  const stage2Coeffs = kWeightingStage2Coeffs(sampleRate);
  
  let sumOfSquares = 0;
  let peak = 0;
  
  for (let i = 0; i < samples.length; i++) {
    // K-weighting
    let weighted = processBiquad(samples[i], stage1Coeffs, state.kWeightingStage1);
    weighted = processBiquad(weighted, stage2Coeffs, state.kWeightingStage2);
    
    sumOfSquares += weighted * weighted;
    peak = Math.max(peak, Math.abs(samples[i]));
  }
  
  const meanSquare = sumOfSquares / samples.length;
  const lufs = -0.691 + 10 * Math.log10(Math.max(meanSquare, 1e-10));
  
  return {
    lufs,
    peak: linearToDb(peak),
    truePeak: linearToDb(peak * 1.1) // Approximation for true peak
  };
}

// ============= MASTER CHAIN PROCESSOR =============

export interface MasteringSettings {
  style: 'Warm' | 'Balanced' | 'Open';
  loudness: number;      // Target LUFS
  eq: {
    low: number;         // dB boost/cut
    mid: number;
    high: number;
  };
  presence: number;      // 0-100
  compression: number;   // 0-100
  stereoWidth: number;   // 0-100
  saturation: number;    // 0-100
  deEsser: number;       // 0-100
}

export interface MasteringState {
  // EQ states (per channel)
  lowShelfL: BiquadState;
  lowShelfR: BiquadState;
  midL: BiquadState;
  midR: BiquadState;
  highShelfL: BiquadState;
  highShelfR: BiquadState;
  presenceL: BiquadState;
  presenceR: BiquadState;
  
  // Compressor state
  compressor: CompressorState;
  
  // Limiter state
  limiter: LimiterState;
  
  // De-esser states
  deEsserL: DeEsserState;
  deEsserR: DeEsserState;
}

export function createMasteringState(sampleRate: number): MasteringState {
  const lookaheadSamples = Math.floor(5 * sampleRate / 1000); // 5ms lookahead
  
  return {
    lowShelfL: createBiquadState(),
    lowShelfR: createBiquadState(),
    midL: createBiquadState(),
    midR: createBiquadState(),
    highShelfL: createBiquadState(),
    highShelfR: createBiquadState(),
    presenceL: createBiquadState(),
    presenceR: createBiquadState(),
    compressor: createCompressorState(),
    limiter: createLimiterState(lookaheadSamples),
    deEsserL: createDeEsserState(),
    deEsserR: createDeEsserState()
  };
}

export function getStylePresets(style: 'Warm' | 'Balanced' | 'Open'): {
  saturationMix: number;
  highShelfBoost: number;
  compressionRatio: number;
  attackMs: number;
  releaseMs: number;
} {
  switch (style) {
    case 'Warm':
      return {
        saturationMix: 0.3,
        highShelfBoost: -1,
        compressionRatio: 3,
        attackMs: 30,
        releaseMs: 200
      };
    case 'Open':
      return {
        saturationMix: 0.1,
        highShelfBoost: 1.5,
        compressionRatio: 2,
        attackMs: 10,
        releaseMs: 100
      };
    case 'Balanced':
    default:
      return {
        saturationMix: 0.15,
        highShelfBoost: 0,
        compressionRatio: 2.5,
        attackMs: 20,
        releaseMs: 150
      };
  }
}

export function processMasteringSample(
  leftIn: number,
  rightIn: number,
  settings: MasteringSettings,
  state: MasteringState,
  sampleRate: number
): [number, number] {
  const stylePresets = getStylePresets(settings.style);
  
  let left = leftIn;
  let right = rightIn;
  
  // 1. EQ Stage
  const lowShelfCoeffsData = lowShelfCoeffs(sampleRate, 80, settings.eq.low);
  left = processBiquad(left, lowShelfCoeffsData, state.lowShelfL);
  right = processBiquad(right, lowShelfCoeffsData, state.lowShelfR);
  
  const midCoeffsData = peakingEQCoeffs(sampleRate, 1000, settings.eq.mid, 1.5);
  left = processBiquad(left, midCoeffsData, state.midL);
  right = processBiquad(right, midCoeffsData, state.midR);
  
  const highShelfBoost = settings.eq.high + stylePresets.highShelfBoost;
  const highShelfCoeffsData = highShelfCoeffs(sampleRate, 8000, highShelfBoost);
  left = processBiquad(left, highShelfCoeffsData, state.highShelfL);
  right = processBiquad(right, highShelfCoeffsData, state.highShelfR);
  
  // 2. Presence boost (3-5kHz)
  if (settings.presence > 0) {
    const presenceGain = (settings.presence / 100) * 4; // Max 4dB
    const presenceCoeffsData = peakingEQCoeffs(sampleRate, 3500, presenceGain, 1.0);
    left = processBiquad(left, presenceCoeffsData, state.presenceL);
    right = processBiquad(right, presenceCoeffsData, state.presenceR);
  }
  
  // 3. De-esser
  if (settings.deEsser > 0) {
    const deEsserReduction = settings.deEsser / 100;
    left = processDeEsser(left, -20, deEsserReduction, state.deEsserL, sampleRate);
    right = processDeEsser(right, -20, deEsserReduction, state.deEsserR, sampleRate);
  }
  
  // 4. Stereo width
  if (settings.stereoWidth !== 50) {
    const width = settings.stereoWidth / 50; // 0=mono, 1=normal, 2=wide
    [left, right] = processStereoWidth(left, right, width);
  }
  
  // 5. Saturation
  if (settings.saturation > 0) {
    const drive = settings.saturation / 100;
    const mix = stylePresets.saturationMix + (drive * 0.3);
    left = processSaturation(left, drive, mix);
    right = processSaturation(right, drive, mix);
  }
  
  // 6. Compression (process mid signal for linked stereo) - more gentle settings
  if (settings.compression > 0) {
    const compressionAmount = settings.compression / 100;
    const compSettings: CompressorSettings = {
      threshold: -12 + (compressionAmount * 4), // -12 to -8 dB (higher threshold = less compression)
      ratio: 1.5 + (compressionAmount * 1.5), // 1.5:1 to 3:1 (gentler ratios)
      attack: stylePresets.attackMs * 1.5, // Slower attack preserves transients
      release: stylePresets.releaseMs,
      knee: 10, // Wider knee for smoother compression
      makeupGain: compressionAmount * 1.5 // Much less makeup gain to avoid over-loudness
    };
    
    const mid = (left + right) / 2;
    const compressedMid = processCompressor(mid, compSettings, state.compressor, sampleRate);
    const gainRatio = mid !== 0 ? compressedMid / mid : 1;
    
    // Limit the gain ratio to prevent extreme changes
    const clampedRatio = Math.max(0.5, Math.min(1.5, gainRatio));
    left *= clampedRatio;
    right *= clampedRatio;
  }
  
  // 7. Limiting - gentler settings to preserve dynamics
  const limiterSettings: LimiterSettings = {
    ceiling: -1.0, // More headroom for codec and to avoid harshness
    release: 100, // Slower release for smoother limiting
    lookahead: state.limiter.delayBuffer.length
  };
  
  // Process mono for linked limiting
  const mono = (left + right) / 2;
  const limitedMono = processLimiter(mono, limiterSettings, state.limiter, sampleRate);
  const limitGain = mono !== 0 ? limitedMono / mono : 1;
  
  // Clamp limit gain to prevent artifacts
  const clampedLimitGain = Math.max(0.3, Math.min(1.0, limitGain));
  left *= clampedLimitGain;
  right *= clampedLimitGain;
  
  return [left, right];
}

// ============= FULL AUDIO PROCESSING =============

export interface ProcessedAudioResult {
  samples: Float32Array;
  channels: number;
  sampleRate: number;
  inputLoudness: { lufs: number; peak: number; truePeak: number };
  outputLoudness: { lufs: number; peak: number; truePeak: number };
  processingTimeMs: number;
}

export function processAudioBuffer(
  inputSamples: Float32Array,
  channels: number,
  sampleRate: number,
  settings: MasteringSettings
): ProcessedAudioResult {
  const startTime = Date.now();
  
  // Measure input loudness
  const inputLoudness = measureLoudness(inputSamples, sampleRate);
  
  // Create processing state
  const state = createMasteringState(sampleRate);
  
  // Calculate loudness adjustment - but limit the range to avoid extreme changes
  const targetLufs = settings.loudness;
  const loudnessDiff = targetLufs - inputLoudness.lufs;
  // Clamp adjustment to +/- 6dB to prevent destroying the audio
  const clampedDiff = Math.max(-6, Math.min(6, loudnessDiff));
  const loudnessAdjustment = dbToLinear(clampedDiff);
  
  // Process samples
  const outputSamples = new Float32Array(inputSamples.length);
  const samplesPerChannel = Math.floor(inputSamples.length / channels);
  
  if (channels === 2) {
    // Stereo processing
    for (let i = 0; i < samplesPerChannel; i++) {
      const leftIdx = i * 2;
      const rightIdx = i * 2 + 1;
      
      let left = inputSamples[leftIdx] * loudnessAdjustment;
      let right = inputSamples[rightIdx] * loudnessAdjustment;
      
      [left, right] = processMasteringSample(left, right, settings, state, sampleRate);
      
      // Soft clip to prevent clipping
      outputSamples[leftIdx] = softClip(left);
      outputSamples[rightIdx] = softClip(right);
    }
  } else {
    // Mono processing
    for (let i = 0; i < inputSamples.length; i++) {
      let sample = inputSamples[i] * loudnessAdjustment;
      
      [sample] = processMasteringSample(sample, sample, settings, state, sampleRate);
      
      outputSamples[i] = softClip(sample);
    }
  }
  
  // Measure output loudness
  const outputLoudness = measureLoudness(outputSamples, sampleRate);
  
  return {
    samples: outputSamples,
    channels,
    sampleRate,
    inputLoudness,
    outputLoudness,
    processingTimeMs: Date.now() - startTime
  };
}
