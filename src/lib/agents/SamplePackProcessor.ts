/**
 * Sample Pack Preprocessing Pipeline for Level 5 Autonomous Music Agents
 * 
 * Handles ingestion, normalization, feature extraction, and tokenization
 * of Amapiano, Private School, and 3-Step sample packs.
 */

// ============= Type Definitions =============

export interface SampleMetadata {
  id: string;
  path: string;
  instrumentRole: InstrumentRole;
  type: 'one_shot' | 'loop';
  lengthBars?: number;
  bpm?: number;
  key?: string;
  mode?: 'major' | 'minor' | 'dorian' | 'mixolydian';
  style: GenreStyle;
  substyle?: SubgenreStyle;
  packId: string;
  tags: string[];
}

export type GenreStyle = 'amapiano' | 'private_school' | 'three_step' | 'gqom' | 'bacardi';

export type SubgenreStyle = 
  | 'soulful' 
  | 'aggressive' 
  | 'mellow' 
  | 'club' 
  | 'jazzy' 
  | 'experimental';

export type InstrumentRole = 
  | 'kick' 
  | 'snare' 
  | 'clap' 
  | 'shaker' 
  | 'log_drum' 
  | 'hi_hat' 
  | 'perc' 
  | 'chord_loop' 
  | 'bass_midi' 
  | 'vocal_chop' 
  | 'fx' 
  | 'pad' 
  | 'lead' 
  | 'keys';

export interface AudioFeatures {
  sampleRate: number;
  duration: number;
  rms: number;
  spectralCentroid: number;
  spectralFlux: number;
  zeroCrossingRate: number;
  mfcc: number[];
  chroma: number[];
  transientDensity: number;
  estimatedBpm?: number;
  estimatedKey?: string;
}

export interface GrooveMetrics {
  syncopationIndex: number;      // Density of off-beat notes
  grooveConsistency: number;     // Micro-timing consistency with grid
  swingAmount: number;           // Deviation from straight timing
  threeStepCompliance: number;   // Match to 3-step pattern
  logDrumBounce: number;         // Characteristic bounce feel
}

export interface SymbolicEvent {
  type: 'note_on' | 'note_off' | 'time_shift' | 'bar' | 'beat' | 'style' | 'track';
  value: number | string;
  velocity?: number;
  channel?: number;
}

export interface ProcessedSample {
  metadata: SampleMetadata;
  audioFeatures: AudioFeatures;
  grooveMetrics?: GrooveMetrics;
  symbolicEvents?: SymbolicEvent[];
  normalizedBuffer?: Float32Array;
}

// ============= Constants =============

export const GENRE_SPECS = {
  amapiano: {
    tempoRange: [110, 115],
    characteristics: ['log_drum', 'syncopated', 'piano_melodies'],
    harmonicStyle: 'jazzy_soulful',
  },
  private_school: {
    tempoRange: [108, 114],
    characteristics: ['soft_drums', 'extended_chords', 'live_instruments'],
    harmonicStyle: 'progressive_jazz',
  },
  three_step: {
    tempoRange: [112, 118],
    characteristics: ['3_kick_framework', 'swung_hats', 'tension_building'],
    harmonicStyle: 'afro_house',
  },
  gqom: {
    tempoRange: [120, 130],
    characteristics: ['aggressive_drums', 'dark_pads', 'heavy_bass'],
    harmonicStyle: 'minimal_dark',
  },
  bacardi: {
    tempoRange: [108, 115],
    characteristics: ['vocal_chops', 'melodic_bass', 'tribal_elements'],
    harmonicStyle: 'hybrid',
  },
} as const;

export const THREE_STEP_PATTERN = {
  // 3-kick framework: kicks on 1, 2, 3 with 4th beat open
  kickPositions: [0, 4, 8], // Out of 16 steps
  expectedSwing: 0.15,       // 15% swing deviation
  logDrumSyncopation: [2, 6, 10, 14], // Off-beat positions
};

// ============= Core Processing Functions =============

/**
 * Normalize audio to target sample rate and amplitude
 */
export function normalizeAudio(
  buffer: AudioBuffer,
  targetSampleRate: number = 44100,
  targetRms: number = 0.1
): Float32Array {
  const data = buffer.getChannelData(0);
  const output = new Float32Array(data.length);
  
  // Calculate current RMS
  let sumSquares = 0;
  for (let i = 0; i < data.length; i++) {
    sumSquares += data[i] * data[i];
  }
  const currentRms = Math.sqrt(sumSquares / data.length);
  
  // Normalize to target RMS
  const gain = currentRms > 0 ? targetRms / currentRms : 1;
  for (let i = 0; i < data.length; i++) {
    output[i] = Math.max(-1, Math.min(1, data[i] * gain));
  }
  
  return output;
}

/**
 * Trim silence from start and end of audio
 */
export function trimSilence(
  samples: Float32Array,
  threshold: number = 0.01
): Float32Array {
  let startIdx = 0;
  let endIdx = samples.length - 1;
  
  // Find start
  for (let i = 0; i < samples.length; i++) {
    if (Math.abs(samples[i]) > threshold) {
      startIdx = i;
      break;
    }
  }
  
  // Find end
  for (let i = samples.length - 1; i >= 0; i--) {
    if (Math.abs(samples[i]) > threshold) {
      endIdx = i;
      break;
    }
  }
  
  return samples.slice(startIdx, endIdx + 1);
}

/**
 * Extract audio features using Web Audio API analysis
 */
export function extractAudioFeatures(
  buffer: AudioBuffer
): AudioFeatures {
  const data = buffer.getChannelData(0);
  const sampleRate = buffer.sampleRate;
  const duration = buffer.duration;
  
  // RMS
  let sumSquares = 0;
  for (let i = 0; i < data.length; i++) {
    sumSquares += data[i] * data[i];
  }
  const rms = Math.sqrt(sumSquares / data.length);
  
  // Zero Crossing Rate
  let zeroCrossings = 0;
  for (let i = 1; i < data.length; i++) {
    if ((data[i] >= 0 && data[i - 1] < 0) || (data[i] < 0 && data[i - 1] >= 0)) {
      zeroCrossings++;
    }
  }
  const zeroCrossingRate = zeroCrossings / data.length;
  
  // Spectral Centroid approximation via zero-crossing
  const spectralCentroid = (zeroCrossingRate * sampleRate) / 2;
  
  // Spectral Flux (sum of changes in magnitude)
  let spectralFlux = 0;
  const windowSize = 1024;
  let prevEnergy = 0;
  for (let i = 0; i < data.length; i += windowSize) {
    let energy = 0;
    for (let j = i; j < Math.min(i + windowSize, data.length); j++) {
      energy += data[j] * data[j];
    }
    spectralFlux += Math.abs(energy - prevEnergy);
    prevEnergy = energy;
  }
  
  // Transient density (via onset detection)
  const transientDensity = detectTransients(data, sampleRate);
  
  // Simple MFCC placeholder (13 coefficients)
  const mfcc = calculateSimpleMFCC(data, sampleRate);
  
  // Chroma features (12 pitch classes)
  const chroma = calculateChroma(data, sampleRate);
  
  // BPM estimation
  const estimatedBpm = estimateBPM(data, sampleRate);
  
  // Key estimation
  const estimatedKey = estimateKey(chroma);
  
  return {
    sampleRate,
    duration,
    rms,
    spectralCentroid,
    spectralFlux,
    zeroCrossingRate,
    mfcc,
    chroma,
    transientDensity,
    estimatedBpm,
    estimatedKey,
  };
}

/**
 * Detect transient density for drum/percussion analysis
 */
function detectTransients(samples: Float32Array, sampleRate: number): number {
  const windowSize = Math.floor(sampleRate * 0.01); // 10ms windows
  const energies: number[] = [];
  
  for (let i = 0; i < samples.length; i += windowSize) {
    let energy = 0;
    for (let j = i; j < Math.min(i + windowSize, samples.length); j++) {
      energy += samples[j] * samples[j];
    }
    energies.push(energy);
  }
  
  // Count significant energy increases (transients)
  let transients = 0;
  const threshold = 2.0; // Energy increase ratio
  for (let i = 1; i < energies.length; i++) {
    if (energies[i - 1] > 0 && energies[i] / energies[i - 1] > threshold) {
      transients++;
    }
  }
  
  // Return transients per second
  const durationSec = samples.length / sampleRate;
  return transients / durationSec;
}

/**
 * Simple MFCC calculation (placeholder for more sophisticated implementation)
 */
function calculateSimpleMFCC(samples: Float32Array, sampleRate: number): number[] {
  // This is a simplified version - production would use proper FFT + mel filterbank
  const mfcc = new Array(13).fill(0);
  const windowSize = 2048;
  
  for (let i = 0; i < Math.min(10, samples.length / windowSize); i++) {
    const start = i * windowSize;
    let energy = 0;
    let highEnergy = 0;
    
    for (let j = 0; j < windowSize && start + j < samples.length; j++) {
      const sample = samples[start + j];
      energy += sample * sample;
      if (j > windowSize / 2) {
        highEnergy += sample * sample;
      }
    }
    
    mfcc[0] += Math.log(energy + 1e-10) / 10;
    mfcc[1] += (highEnergy / (energy + 1e-10)) / 10;
  }
  
  return mfcc;
}

/**
 * Calculate chroma features (12 pitch classes)
 */
function calculateChroma(samples: Float32Array, sampleRate: number): number[] {
  const chroma = new Array(12).fill(0);
  // Simplified chroma via zero-crossing frequency estimation
  const windowSize = 1024;
  
  for (let i = 0; i < samples.length - windowSize; i += windowSize) {
    let crossings = 0;
    for (let j = 1; j < windowSize; j++) {
      if ((samples[i + j] >= 0 && samples[i + j - 1] < 0) || 
          (samples[i + j] < 0 && samples[i + j - 1] >= 0)) {
        crossings++;
      }
    }
    
    const freq = (crossings * sampleRate) / (2 * windowSize);
    if (freq > 20 && freq < 4000) {
      const midiNote = Math.round(69 + 12 * Math.log2(freq / 440));
      const chromaIdx = midiNote % 12;
      chroma[chromaIdx]++;
    }
  }
  
  // Normalize
  const sum = chroma.reduce((a, b) => a + b, 0);
  return chroma.map(c => c / (sum || 1));
}

/**
 * Estimate BPM using autocorrelation
 */
function estimateBPM(samples: Float32Array, sampleRate: number): number {
  // Downsample for efficiency
  const downsampleFactor = 4;
  const downsampled = new Float32Array(Math.floor(samples.length / downsampleFactor));
  for (let i = 0; i < downsampled.length; i++) {
    downsampled[i] = Math.abs(samples[i * downsampleFactor]);
  }
  
  const effectiveRate = sampleRate / downsampleFactor;
  const minLag = Math.floor(effectiveRate * 60 / 180); // 180 BPM max
  const maxLag = Math.floor(effectiveRate * 60 / 60);   // 60 BPM min
  
  let bestLag = minLag;
  let bestCorr = -1;
  
  for (let lag = minLag; lag < Math.min(maxLag, downsampled.length / 2); lag++) {
    let corr = 0;
    const n = Math.min(downsampled.length - lag, 10000);
    for (let i = 0; i < n; i++) {
      corr += downsampled[i] * downsampled[i + lag];
    }
    if (corr > bestCorr) {
      bestCorr = corr;
      bestLag = lag;
    }
  }
  
  return Math.round(60 * effectiveRate / bestLag);
}

/**
 * Estimate musical key from chroma features
 */
function estimateKey(chroma: number[]): string {
  const keyNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const majorProfile = [6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88];
  const minorProfile = [6.33, 2.68, 3.52, 5.38, 2.60, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17];
  
  let bestKey = 'C';
  let bestCorr = -1;
  
  for (let i = 0; i < 12; i++) {
    // Rotate chroma to match key
    const rotated = [...chroma.slice(i), ...chroma.slice(0, i)];
    
    // Major correlation
    let majorCorr = 0;
    for (let j = 0; j < 12; j++) {
      majorCorr += rotated[j] * majorProfile[j];
    }
    if (majorCorr > bestCorr) {
      bestCorr = majorCorr;
      bestKey = keyNames[i] + ' Major';
    }
    
    // Minor correlation
    let minorCorr = 0;
    for (let j = 0; j < 12; j++) {
      minorCorr += rotated[j] * minorProfile[j];
    }
    if (minorCorr > bestCorr) {
      bestCorr = minorCorr;
      bestKey = keyNames[i] + ' Minor';
    }
  }
  
  return bestKey;
}

/**
 * Calculate groove metrics for Amapiano-specific analysis
 */
export function calculateGrooveMetrics(
  onsets: number[], // Onset times in seconds
  bpm: number,
  style: GenreStyle
): GrooveMetrics {
  const beatDuration = 60 / bpm;
  const stepDuration = beatDuration / 4; // 16th notes
  
  // Map onsets to 16-step grid
  const gridPositions = onsets.map(t => {
    const beat = t / beatDuration;
    return Math.round((beat % 1) * 16) % 16;
  });
  
  // Syncopation Index: count off-beat positions
  const onBeatPositions = [0, 4, 8, 12];
  const syncopatedCount = gridPositions.filter(p => !onBeatPositions.includes(p)).length;
  const syncopationIndex = syncopatedCount / gridPositions.length;
  
  // Groove Consistency: measure deviation from quantized grid
  let deviationSum = 0;
  for (const onset of onsets) {
    const nearestStep = Math.round(onset / stepDuration) * stepDuration;
    deviationSum += Math.abs(onset - nearestStep);
  }
  const grooveConsistency = 1 - Math.min(1, (deviationSum / onsets.length) / stepDuration);
  
  // Swing Amount: measure deviation toward shuffle feel
  let swingDeviation = 0;
  for (const onset of onsets) {
    const beatPos = (onset % beatDuration) / beatDuration;
    // Check for shuffle timing (offset toward 2/3 instead of 1/2)
    if (beatPos > 0.4 && beatPos < 0.7) {
      swingDeviation += Math.abs(beatPos - 0.5);
    }
  }
  const swingAmount = swingDeviation / Math.max(1, onsets.length);
  
  // 3-Step Compliance: match 3-kick framework
  const kickPattern = THREE_STEP_PATTERN.kickPositions;
  const matchingKicks = gridPositions.filter(p => kickPattern.includes(p)).length;
  const threeStepCompliance = matchingKicks / kickPattern.length;
  
  // Log Drum Bounce: syncopation on expected positions
  const logDrumPositions = THREE_STEP_PATTERN.logDrumSyncopation;
  const matchingLogDrum = gridPositions.filter(p => logDrumPositions.includes(p)).length;
  const logDrumBounce = matchingLogDrum / Math.max(1, gridPositions.length);
  
  return {
    syncopationIndex,
    grooveConsistency,
    swingAmount,
    threeStepCompliance,
    logDrumBounce,
  };
}

/**
 * Tokenize audio events for transformer-based models
 */
export function tokenizeEvents(
  events: Array<{ time: number; pitch?: number; velocity?: number; type: string }>,
  style: GenreStyle,
  bpm: number
): SymbolicEvent[] {
  const tokens: SymbolicEvent[] = [];
  const beatDuration = 60 / bpm;
  
  // Add style token
  tokens.push({ type: 'style', value: style.toUpperCase() });
  tokens.push({ type: 'beat', value: bpm });
  
  let currentTime = 0;
  let currentBar = 0;
  
  for (const event of events) {
    // Add bar markers
    const eventBar = Math.floor(event.time / (beatDuration * 4));
    while (currentBar < eventBar) {
      tokens.push({ type: 'bar', value: currentBar });
      currentBar++;
    }
    
    // Add time shift
    const timeShift = Math.round((event.time - currentTime) / (beatDuration / 4));
    if (timeShift > 0) {
      tokens.push({ type: 'time_shift', value: timeShift });
    }
    
    // Add note event
    if (event.pitch !== undefined) {
      tokens.push({
        type: 'note_on',
        value: event.pitch,
        velocity: event.velocity || 100,
      });
    }
    
    currentTime = event.time;
  }
  
  return tokens;
}

/**
 * Classify sample by instrument role using audio features
 */
export function classifyInstrumentRole(features: AudioFeatures): InstrumentRole {
  const { spectralCentroid, transientDensity, rms, zeroCrossingRate, mfcc } = features;
  
  // Low spectral centroid + high transient = kick/bass
  if (spectralCentroid < 500 && transientDensity > 5) {
    return features.duration < 0.5 ? 'kick' : 'log_drum';
  }
  
  // High spectral centroid + high transient = hi-hat/shaker
  if (spectralCentroid > 3000 && transientDensity > 10) {
    return zeroCrossingRate > 0.1 ? 'shaker' : 'hi_hat';
  }
  
  // Mid-range + burst transient = snare/clap
  if (spectralCentroid > 1000 && spectralCentroid < 3000 && transientDensity > 3) {
    return 'clap';
  }
  
  // Longer duration + varied content = loops/pads
  if (features.duration > 2) {
    if (zeroCrossingRate < 0.05) {
      return 'pad';
    }
    if (spectralCentroid > 1500) {
      return 'chord_loop';
    }
    return 'keys';
  }
  
  // Default to percussion
  return 'perc';
}

/**
 * Full sample pack processing pipeline
 */
export async function processSamplePack(
  files: File[],
  packId: string,
  style: GenreStyle
): Promise<ProcessedSample[]> {
  const audioContext = new AudioContext();
  const processedSamples: ProcessedSample[] = [];
  
  for (const file of files) {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      
      // Normalize audio
      const normalized = normalizeAudio(audioBuffer);
      const trimmed = trimSilence(normalized);
      
      // Extract features
      const features = extractAudioFeatures(audioBuffer);
      
      // Classify instrument role
      const instrumentRole = classifyInstrumentRole(features);
      
      // Determine if loop or one-shot
      const isLoop = audioBuffer.duration > 1 && features.transientDensity > 2;
      
      // Create metadata
      const metadata: SampleMetadata = {
        id: `${packId}_${file.name.replace(/\.[^.]+$/, '')}`,
        path: file.name,
        instrumentRole,
        type: isLoop ? 'loop' : 'one_shot',
        bpm: features.estimatedBpm,
        key: features.estimatedKey,
        style,
        packId,
        tags: [instrumentRole, style, isLoop ? 'loop' : 'one_shot'],
      };
      
      // Calculate groove metrics for rhythmic content
      let grooveMetrics: GrooveMetrics | undefined;
      if (['kick', 'snare', 'log_drum', 'perc', 'shaker', 'hi_hat'].includes(instrumentRole)) {
        // Simplified onset detection for groove analysis
        const onsets: number[] = [];
        const threshold = features.rms * 2;
        let lastOnset = -0.05;
        
        for (let i = 0; i < audioBuffer.length; i++) {
          const time = i / audioBuffer.sampleRate;
          if (Math.abs(normalized[i]) > threshold && time - lastOnset > 0.05) {
            onsets.push(time);
            lastOnset = time;
          }
        }
        
        if (onsets.length > 2) {
          grooveMetrics = calculateGrooveMetrics(onsets, features.estimatedBpm || 112, style);
        }
      }
      
      processedSamples.push({
        metadata,
        audioFeatures: features,
        grooveMetrics,
        normalizedBuffer: trimmed,
      });
      
    } catch (error) {
      console.error(`Failed to process ${file.name}:`, error);
    }
  }
  
  await audioContext.close();
  return processedSamples;
}

export default {
  processSamplePack,
  normalizeAudio,
  trimSilence,
  extractAudioFeatures,
  calculateGrooveMetrics,
  tokenizeEvents,
  classifyInstrumentRole,
  GENRE_SPECS,
  THREE_STEP_PATTERN,
};
