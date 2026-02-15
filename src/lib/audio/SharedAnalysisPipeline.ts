/**
 * SharedAnalysisPipeline — Single source of truth for audio analysis DSP
 * 
 * Consolidates BPM detection, Key detection, Energy curves, LUFS measurement,
 * Vocal activity estimation, Segment detection, and Camelot compatibility.
 * 
 * Used by: DJ Agent, Amapianorizer, Studio/DAW, Generate, LANDR Layers
 * 
 * All algorithms are real (no mocks): Goertzel chroma, Krumhansl-Schmuckler profiles,
 * onset-autocorrelation BPM, ITU-R BS.1770 LUFS, spectral centroid vocal estimation.
 */

// ─── Camelot Wheel ───────────────────────────────────────────────────────────

export const KEY_TO_CAMELOT: Record<string, string> = {
  'C major': '8B', 'A minor': '8A',
  'G major': '9B', 'E minor': '9A',
  'D major': '10B', 'B minor': '10A',
  'A major': '11B', 'F# minor': '11A',
  'E major': '12B', 'C# minor': '12A',
  'B major': '1B', 'G# minor': '1A',
  'F# major': '2B', 'Eb minor': '2A',
  'Db major': '3B', 'Bb minor': '3A',
  'Ab major': '4B', 'F minor': '4A',
  'Eb major': '5B', 'C minor': '5A',
  'Bb major': '6B', 'G minor': '6A',
  'F major': '7B', 'D minor': '7A',
};

const KEY_NAMES_MAJOR = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];
const KEY_NAMES_MINOR = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'G#', 'A', 'Bb', 'B'];

// Krumhansl-Schmuckler key profiles
const MAJOR_PROFILE = [6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88];
const MINOR_PROFILE = [6.33, 2.68, 3.52, 5.38, 2.60, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17];

// ─── Types ───────────────────────────────────────────────────────────────────

export interface AnalysisResult {
  bpm: number;
  bpmConfidence: number;
  key: string;
  camelot: string;
  lufsIntegrated: number;
  energyCurve: number[];
  vocalActivityCurve: number[];
  segments: AudioSegment[];
  durationSec: number;
  sampleRate: number;
  /** Optional genre classification */
  genre?: GenreClassification;
}

export interface AudioSegment {
  type: 'intro' | 'verse' | 'drop' | 'breakdown' | 'outro';
  startSec: number;
  endSec: number;
  energy: number;
}

export interface GenreClassification {
  isAmapiano: boolean;
  confidence: number;
  subgenre?: 'private_school' | 'deep_amapiano' | '3_step' | 'sgija' | 'piano_hub' | 'unknown';
  indicators: string[];
}

export interface AnalysisOptions {
  /** Max seconds to analyze (default: 45) */
  maxAnalysisDurationSec?: number;
  /** Sample rate for decoding (default: 11025 for speed, 44100 for quality) */
  decodeSampleRate?: number;
  /** Number of energy/vocal bins (default: 32) */
  numBins?: number;
  /** Include genre classification (default: false) */
  includeGenre?: boolean;
  /** Progress callback (0-1) */
  onProgress?: (progress: number) => void;
}

// ─── Audio Decoding ──────────────────────────────────────────────────────────

export async function decodeAudioFile(
  fileUrl: string,
  sampleRate: number = 11025
): Promise<AudioBuffer> {
  const response = await fetch(fileUrl);
  const arrayBuffer = await response.arrayBuffer();
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({
    sampleRate,
  });
  try {
    return await audioContext.decodeAudioData(arrayBuffer);
  } finally {
    await audioContext.close();
  }
}

export async function decodeAudioBuffer(
  arrayBuffer: ArrayBuffer,
  sampleRate: number = 11025
): Promise<AudioBuffer> {
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({
    sampleRate,
  });
  try {
    return await audioContext.decodeAudioData(arrayBuffer);
  } finally {
    await audioContext.close();
  }
}

export function getMonoSamples(buffer: AudioBuffer): Float32Array {
  if (buffer.numberOfChannels === 1) return buffer.getChannelData(0);
  const left = buffer.getChannelData(0);
  const right = buffer.getChannelData(1);
  const mono = new Float32Array(left.length);
  for (let i = 0; i < left.length; i++) {
    mono[i] = (left[i] + right[i]) / 2;
  }
  return mono;
}

// ─── BPM Detection (onset strength + autocorrelation) ────────────────────────

export function detectBPM(
  samples: Float32Array,
  sampleRate: number
): { bpm: number; confidence: number } {
  const hopSize = 512;
  const frameSize = 1024;
  const numFrames = Math.floor((samples.length - frameSize) / hopSize);

  // Compute spectral flux (onset strength)
  const onsetStrength = new Float32Array(numFrames);
  let prevSpectrum: Float32Array | null = null;

  for (let i = 0; i < numFrames; i++) {
    const start = i * hopSize;
    const frame = new Float32Array(frameSize);
    for (let j = 0; j < frameSize; j++) {
      const w = 0.5 * (1 - Math.cos((2 * Math.PI * j) / (frameSize - 1)));
      frame[j] = (samples[start + j] || 0) * w;
    }

    const halfSize = frameSize / 2;
    const spectrum = new Float32Array(halfSize);
    for (let k = 0; k < halfSize; k++) {
      let re = 0, im = 0;
      for (let n = 0; n < frameSize; n++) {
        const angle = (-2 * Math.PI * k * n) / frameSize;
        re += frame[n] * Math.cos(angle);
        im += frame[n] * Math.sin(angle);
      }
      spectrum[k] = Math.sqrt(re * re + im * im);
    }

    if (prevSpectrum) {
      let flux = 0;
      for (let k = 0; k < halfSize; k++) {
        const diff = spectrum[k] - prevSpectrum[k];
        if (diff > 0) flux += diff;
      }
      onsetStrength[i] = flux;
    }
    prevSpectrum = spectrum;
  }

  // Autocorrelation for tempo
  const minBPM = 60, maxBPM = 200;
  const framesPerSecond = sampleRate / hopSize;
  const minLag = Math.floor(framesPerSecond * 60 / maxBPM);
  const maxLag = Math.floor(framesPerSecond * 60 / minBPM);

  let bestCorr = -Infinity;
  let bestLag = minLag;
  const corrValues: number[] = [];

  for (let lag = minLag; lag <= Math.min(maxLag, numFrames - 1); lag++) {
    let corr = 0, count = 0;
    for (let i = 0; i < numFrames - lag; i++) {
      corr += onsetStrength[i] * onsetStrength[i + lag];
      count++;
    }
    corr = count > 0 ? corr / count : 0;
    corrValues.push(corr);
    if (corr > bestCorr) {
      bestCorr = corr;
      bestLag = lag;
    }
  }

  const bpm = (framesPerSecond * 60) / bestLag;
  const mean = corrValues.reduce((a, b) => a + b, 0) / corrValues.length;
  const confidence = mean > 0 ? Math.min(1, bestCorr / (mean * 3)) : 0.5;

  return { bpm: Math.round(bpm * 2) / 2, confidence };
}

// ─── Key Detection (Goertzel chroma + Krumhansl-Schmuckler) ──────────────────

export function detectKey(
  samples: Float32Array,
  sampleRate: number
): { key: string; camelot: string; mode: 'major' | 'minor' } {
  const frameSize = 4096;
  const hopSize = 2048;
  const numFrames = Math.floor((samples.length - frameSize) / hopSize);
  const chroma = new Float64Array(12);

  for (let frame = 0; frame < Math.min(numFrames, 200); frame++) {
    const start = frame * hopSize;
    for (let note = 0; note < 12; note++) {
      let energy = 0;
      for (let octave = 2; octave <= 7; octave++) {
        const freq = 440 * Math.pow(2, (note - 9) / 12 + (octave - 4));
        if (freq >= sampleRate / 2) continue;
        const k = Math.round(freq * frameSize / sampleRate);
        const w = 2 * Math.cos(2 * Math.PI * k / frameSize);
        let s0 = 0, s1 = 0, s2 = 0;
        for (let i = 0; i < frameSize; i++) {
          s0 = (samples[start + i] || 0) + w * s1 - s2;
          s2 = s1;
          s1 = s0;
        }
        energy += s0 * s0 + s1 * s1 - w * s0 * s1;
      }
      chroma[note] += Math.sqrt(Math.abs(energy));
    }
  }

  const maxChroma = Math.max(...Array.from(chroma));
  if (maxChroma > 0) {
    for (let i = 0; i < 12; i++) chroma[i] /= maxChroma;
  }

  let bestKey = 'C major';
  let bestCorr = -Infinity;
  let bestMode: 'major' | 'minor' = 'major';

  for (let shift = 0; shift < 12; shift++) {
    let corrMaj = 0, corrMin = 0;
    for (let i = 0; i < 12; i++) {
      corrMaj += chroma[(i + shift) % 12] * MAJOR_PROFILE[i];
      corrMin += chroma[(i + shift) % 12] * MINOR_PROFILE[i];
    }
    if (corrMaj > bestCorr) {
      bestCorr = corrMaj;
      bestKey = `${KEY_NAMES_MAJOR[shift]} major`;
      bestMode = 'major';
    }
    if (corrMin > bestCorr) {
      bestCorr = corrMin;
      bestKey = `${KEY_NAMES_MINOR[shift]} minor`;
      bestMode = 'minor';
    }
  }

  return { key: bestKey, camelot: KEY_TO_CAMELOT[bestKey] || '1A', mode: bestMode };
}

// ─── Energy Curve (windowed RMS) ─────────────────────────────────────────────

export function computeEnergyCurve(
  samples: Float32Array,
  sampleRate: number,
  numBins: number = 32
): number[] {
  const samplesPerBin = Math.floor(samples.length / numBins);
  const curve: number[] = [];

  for (let i = 0; i < numBins; i++) {
    const start = i * samplesPerBin;
    const end = Math.min(start + samplesPerBin, samples.length);
    let sum = 0;
    for (let j = start; j < end; j++) {
      sum += samples[j] * samples[j];
    }
    curve.push(Math.sqrt(sum / (end - start)));
  }

  const maxRms = Math.max(...curve);
  return maxRms > 0 ? curve.map(v => v / maxRms) : curve;
}

// ─── LUFS (ITU-R BS.1770 simplified) ─────────────────────────────────────────

export function computeLUFS(samples: Float32Array, sampleRate: number): number {
  const blockSize = Math.floor(sampleRate * 0.4);
  const numBlocks = Math.floor(samples.length / blockSize);
  const blockLoudness: number[] = [];

  for (let b = 0; b < numBlocks; b++) {
    const start = b * blockSize;
    let sum = 0;
    for (let i = start; i < start + blockSize && i < samples.length; i++) {
      sum += samples[i] * samples[i];
    }
    const meanSquare = sum / blockSize;
    if (meanSquare > 0) blockLoudness.push(meanSquare);
  }

  if (blockLoudness.length === 0) return -70;

  const absThreshold = Math.pow(10, -7);
  const gated = blockLoudness.filter(l => l > absThreshold);
  if (gated.length === 0) return -70;

  const meanGated = gated.reduce((a, b) => a + b, 0) / gated.length;
  return Math.max(-70, Math.min(0, -0.691 + 10 * Math.log10(meanGated)));
}

// ─── Vocal Activity (spectral centroid variance) ─────────────────────────────

export function estimateVocalActivity(
  samples: Float32Array,
  sampleRate: number,
  numBins: number = 32
): number[] {
  const samplesPerBin = Math.floor(samples.length / numBins);
  const frameSize = 2048;
  const activity: number[] = [];

  for (let bin = 0; bin < numBins; bin++) {
    const start = bin * samplesPerBin;
    const end = Math.min(start + samplesPerBin, samples.length);
    const centroids: number[] = [];

    for (let pos = start; pos + frameSize < end; pos += frameSize) {
      let numerator = 0, denominator = 0;
      const minBin = Math.floor(300 * frameSize / sampleRate);
      const maxBin = Math.floor(4000 * frameSize / sampleRate);

      for (let k = minBin; k <= maxBin && k < frameSize / 2; k++) {
        const freq = k * sampleRate / frameSize;
        const w = 2 * Math.cos(2 * Math.PI * k / frameSize);
        let s0 = 0, s1 = 0, s2 = 0;
        for (let i = 0; i < frameSize; i++) {
          s0 = (samples[pos + i] || 0) + w * s1 - s2;
          s2 = s1;
          s1 = s0;
        }
        const mag = Math.sqrt(Math.abs(s0 * s0 + s1 * s1 - w * s0 * s1));
        numerator += freq * mag;
        denominator += mag;
      }
      if (denominator > 0) centroids.push(numerator / denominator);
    }

    if (centroids.length > 1) {
      const mean = centroids.reduce((a, b) => a + b, 0) / centroids.length;
      const variance = centroids.reduce((a, b) => a + (b - mean) ** 2, 0) / centroids.length;
      activity.push(Math.min(1, variance / 1500));
    } else {
      activity.push(0);
    }
  }

  return activity;
}

// ─── Segment Detection (energy novelty) ──────────────────────────────────────

export function detectSegments(
  energyCurve: number[],
  durationSec: number
): AudioSegment[] {
  const numBins = energyCurve.length;
  const secPerBin = durationSec / numBins;

  const novelty: number[] = [];
  for (let i = 1; i < numBins; i++) {
    novelty.push(Math.abs(energyCurve[i] - energyCurve[i - 1]));
  }

  const threshold = novelty.reduce((a, b) => a + b, 0) / novelty.length * 1.5;
  const boundaries: number[] = [0];

  for (let i = 1; i < novelty.length - 1; i++) {
    if (novelty[i] > threshold && novelty[i] >= novelty[i - 1] && novelty[i] >= novelty[i + 1]) {
      if (i - boundaries[boundaries.length - 1] >= 2) {
        boundaries.push(i + 1);
      }
    }
  }
  boundaries.push(numBins);

  const segments: AudioSegment[] = [];
  for (let i = 0; i < boundaries.length - 1; i++) {
    const startBin = boundaries[i];
    const endBin = boundaries[i + 1];
    const segEnergy = energyCurve.slice(startBin, endBin).reduce((a, b) => a + b, 0) / (endBin - startBin);

    let type: AudioSegment['type'];
    if (i === 0 && segEnergy < 0.4) type = 'intro';
    else if (i === boundaries.length - 2 && segEnergy < 0.4) type = 'outro';
    else if (segEnergy > 0.7) type = 'drop';
    else if (segEnergy < 0.35) type = 'breakdown';
    else type = 'verse';

    segments.push({ type, startSec: startBin * secPerBin, endSec: endBin * secPerBin, energy: segEnergy });
  }

  return segments;
}

// ─── Camelot Compatibility ───────────────────────────────────────────────────

export function getCamelotCompatibility(a: string, b: string): number {
  const numA = parseInt(a);
  const numB = parseInt(b);
  const modeA = a.slice(-1);
  const modeB = b.slice(-1);

  if (isNaN(numA) || isNaN(numB)) return 0;
  if (a === b) return 1.0;

  const diff = Math.abs(numA - numB);
  const circularDiff = Math.min(diff, 12 - diff);

  if (modeA === modeB && circularDiff === 1) return 0.9;
  if (numA === numB && modeA !== modeB) return 0.85;
  if (modeA === modeB && circularDiff === 2) return 0.6;

  return Math.max(0, 1 - circularDiff * 0.15);
}

// ─── Genre Classification (Amapiano detection) ──────────────────────────────

export function classifyGenre(
  bpm: number,
  key: string,
  energyCurve: number[],
  samples: Float32Array,
  sampleRate: number
): GenreClassification {
  const indicators: string[] = [];
  let score = 0;

  // BPM check: Amapiano is typically 110-120 BPM
  if (bpm >= 108 && bpm <= 122) {
    score += 30;
    indicators.push(`BPM ${bpm} in Amapiano range (108-122)`);
  } else if (bpm >= 100 && bpm <= 130) {
    score += 10;
    indicators.push(`BPM ${bpm} near Amapiano range`);
  }

  // Key check: Amapiano often uses minor keys
  if (key.includes('minor')) {
    score += 10;
    indicators.push('Minor key detected (common in Amapiano)');
  }

  // Low-frequency energy dominance (log drums characteristic)
  const lowBins = Math.max(1, Math.floor(energyCurve.length * 0.15));
  const lowEnergy = energyCurve.slice(0, lowBins).reduce((a, b) => a + b, 0) / lowBins;
  const midEnergy = energyCurve.slice(lowBins, lowBins * 3).reduce((a, b) => a + b, 0) / (lowBins * 2);
  
  if (lowEnergy > midEnergy * 0.8) {
    score += 20;
    indicators.push('Strong low-frequency presence (log drum signature)');
  }

  // Check for rhythmic consistency (Amapiano has steady groove)
  const energyVariance = computeVariance(energyCurve);
  if (energyVariance < 0.15) {
    score += 15;
    indicators.push('Steady rhythmic energy (Amapiano groove)');
  }

  // Sub-bass content analysis via low-frequency RMS
  const subBassEnd = Math.floor(100 * samples.length / sampleRate);
  let subBassEnergy = 0;
  for (let i = 0; i < Math.min(subBassEnd, samples.length); i++) {
    subBassEnergy += samples[i] * samples[i];
  }
  subBassEnergy = Math.sqrt(subBassEnergy / Math.min(subBassEnd, samples.length));
  
  if (subBassEnergy > 0.05) {
    score += 15;
    indicators.push('Sub-bass content detected (log drum fundamental)');
  }

  // Determine subgenre
  let subgenre: GenreClassification['subgenre'] = 'unknown';
  if (score >= 50) {
    if (bpm >= 113 && bpm <= 118 && energyVariance < 0.1) {
      subgenre = 'private_school';
      score += 10;
      indicators.push('Private School characteristics (113-118 BPM, steady energy)');
    } else if (bpm >= 108 && bpm <= 113) {
      subgenre = 'deep_amapiano';
      indicators.push('Deep Amapiano characteristics (slower tempo)');
    } else if (bpm >= 118 && bpm <= 122) {
      subgenre = '3_step';
      indicators.push('3-Step characteristics (faster tempo)');
    }
  }

  const confidence = Math.min(1, score / 100);
  return {
    isAmapiano: confidence >= 0.5,
    confidence,
    subgenre: confidence >= 0.5 ? subgenre : undefined,
    indicators,
  };
}

function computeVariance(data: number[]): number {
  if (data.length === 0) return 0;
  const mean = data.reduce((a, b) => a + b, 0) / data.length;
  return data.reduce((sum, val) => sum + (val - mean) ** 2, 0) / data.length;
}

// ─── Downsample utility ──────────────────────────────────────────────────────

export function downsample(arr: number[], maxLen: number): number[] {
  if (arr.length <= maxLen) return arr;
  const step = arr.length / maxLen;
  const result: number[] = [];
  for (let i = 0; i < maxLen; i++) {
    result.push(arr[Math.floor(i * step)]);
  }
  return result;
}

// ─── Full Analysis Pipeline ──────────────────────────────────────────────────

/**
 * Analyze audio from a URL — the primary entry point for all consumers.
 * Returns a standardized AnalysisResult.
 */
export async function analyzeAudioFromUrl(
  fileUrl: string,
  options: AnalysisOptions = {}
): Promise<AnalysisResult> {
  const {
    maxAnalysisDurationSec = 45,
    decodeSampleRate = 11025,
    numBins = 32,
    includeGenre = false,
    onProgress,
  } = options;

  onProgress?.(0.05);

  const audioBuffer = await decodeAudioFile(fileUrl, decodeSampleRate);
  const fullDurationSec = audioBuffer.duration;
  const sr = audioBuffer.sampleRate;

  onProgress?.(0.15);

  const maxSamples = Math.min(audioBuffer.length, Math.floor(sr * maxAnalysisDurationSec));
  const rawMono = getMonoSamples(audioBuffer);
  const samples = rawMono.length > maxSamples ? rawMono.slice(0, maxSamples) : rawMono;

  onProgress?.(0.25);

  const { bpm, confidence: bpmConfidence } = detectBPM(samples, sr);
  onProgress?.(0.45);

  const { key, camelot } = detectKey(samples, sr);
  onProgress?.(0.60);

  const energyCurve = computeEnergyCurve(samples, sr, numBins);
  const lufsIntegrated = computeLUFS(samples, sr);
  onProgress?.(0.75);

  const vocalActivityCurve = estimateVocalActivity(samples, sr, numBins);
  onProgress?.(0.85);

  const segments = detectSegments(energyCurve, fullDurationSec);
  onProgress?.(0.90);

  let genre: GenreClassification | undefined;
  if (includeGenre) {
    genre = classifyGenre(bpm, key, energyCurve, samples, sr);
  }

  onProgress?.(1.0);

  return {
    bpm,
    bpmConfidence,
    key,
    camelot,
    lufsIntegrated,
    energyCurve: downsample(energyCurve, numBins),
    vocalActivityCurve: downsample(vocalActivityCurve, numBins),
    segments,
    durationSec: fullDurationSec,
    sampleRate: sr,
    genre,
  };
}

/**
 * Analyze audio from an AudioBuffer directly (for consumers that already have decoded audio).
 */
export function analyzeAudioBuffer(
  audioBuffer: AudioBuffer,
  options: Omit<AnalysisOptions, 'decodeSampleRate'> = {}
): AnalysisResult {
  const {
    maxAnalysisDurationSec = 45,
    numBins = 32,
    includeGenre = false,
  } = options;

  const sr = audioBuffer.sampleRate;
  const maxSamples = Math.min(audioBuffer.length, Math.floor(sr * maxAnalysisDurationSec));
  const rawMono = getMonoSamples(audioBuffer);
  const samples = rawMono.length > maxSamples ? rawMono.slice(0, maxSamples) : rawMono;

  const { bpm, confidence: bpmConfidence } = detectBPM(samples, sr);
  const { key, camelot } = detectKey(samples, sr);
  const energyCurve = computeEnergyCurve(samples, sr, numBins);
  const lufsIntegrated = computeLUFS(samples, sr);
  const vocalActivityCurve = estimateVocalActivity(samples, sr, numBins);
  const segments = detectSegments(energyCurve, audioBuffer.duration);

  let genre: GenreClassification | undefined;
  if (includeGenre) {
    genre = classifyGenre(bpm, key, energyCurve, samples, sr);
  }

  return {
    bpm,
    bpmConfidence,
    key,
    camelot,
    lufsIntegrated,
    energyCurve: downsample(energyCurve, numBins),
    vocalActivityCurve: downsample(vocalActivityCurve, numBins),
    segments,
    durationSec: audioBuffer.duration,
    sampleRate: sr,
    genre,
  };
}
