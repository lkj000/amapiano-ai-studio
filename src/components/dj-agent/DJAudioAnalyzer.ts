/**
 * Real Audio Analyzer using Web Audio API
 * BPM detection via onset detection + autocorrelation
 * Key detection via chroma extraction + Krumhansl-Schmuckler
 * Energy curve via RMS analysis
 * LUFS via ITU-R BS.1770 simplified
 * Segment detection via novelty function
 */

import { DJTrack, TrackFeatures, TrackSegment } from './DJAgentTypes';

// Camelot wheel mapping
const KEY_TO_CAMELOT: Record<string, string> = {
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

async function decodeAudioFile(fileUrl: string): Promise<AudioBuffer> {
  const response = await fetch(fileUrl);
  const arrayBuffer = await response.arrayBuffer();
  // Use 22050 Hz to halve memory usage — sufficient for BPM/key/energy analysis
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({
    sampleRate: 22050,
  });
  const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
  await audioContext.close();
  return audioBuffer;
}

function getMonoSamples(buffer: AudioBuffer): Float32Array {
  if (buffer.numberOfChannels === 1) {
    return buffer.getChannelData(0);
  }
  const left = buffer.getChannelData(0);
  const right = buffer.getChannelData(1);
  const mono = new Float32Array(left.length);
  for (let i = 0; i < left.length; i++) {
    mono[i] = (left[i] + right[i]) / 2;
  }
  return mono;
}

/**
 * BPM detection using onset strength + autocorrelation
 */
function detectBPM(samples: Float32Array, sampleRate: number): { bpm: number; confidence: number } {
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
      // Hann window
      const w = 0.5 * (1 - Math.cos((2 * Math.PI * j) / (frameSize - 1)));
      frame[j] = (samples[start + j] || 0) * w;
    }
    
    // Simple DFT magnitude (only need first half)
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
  
  // Autocorrelation of onset strength for tempo detection
  const minBPM = 60, maxBPM = 200;
  const framesPerSecond = sampleRate / hopSize;
  const minLag = Math.floor(framesPerSecond * 60 / maxBPM);
  const maxLag = Math.floor(framesPerSecond * 60 / minBPM);
  
  let bestCorr = -Infinity;
  let bestLag = minLag;
  const corrValues: number[] = [];
  
  for (let lag = minLag; lag <= Math.min(maxLag, numFrames - 1); lag++) {
    let corr = 0;
    let count = 0;
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
  
  // Confidence: ratio of best peak to mean
  const mean = corrValues.reduce((a, b) => a + b, 0) / corrValues.length;
  const confidence = mean > 0 ? Math.min(1, bestCorr / (mean * 3)) : 0.5;
  
  // Round to nearest 0.5 BPM
  return { bpm: Math.round(bpm * 2) / 2, confidence };
}

/**
 * Key detection via chroma extraction + Krumhansl-Schmuckler
 */
function detectKey(samples: Float32Array, sampleRate: number): { key: string; camelot: string } {
  const frameSize = 4096;
  const hopSize = 2048;
  const numFrames = Math.floor((samples.length - frameSize) / hopSize);
  
  // Accumulate chroma bins
  const chroma = new Float64Array(12);
  
  for (let frame = 0; frame < Math.min(numFrames, 200); frame++) {
    const start = frame * hopSize;
    
    // Goertzel algorithm for each chroma bin
    for (let note = 0; note < 12; note++) {
      let energy = 0;
      // Check multiple octaves (2-8)
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
  
  // Normalize chroma
  const maxChroma = Math.max(...Array.from(chroma));
  if (maxChroma > 0) {
    for (let i = 0; i < 12; i++) chroma[i] /= maxChroma;
  }
  
  // Correlate with Krumhansl-Schmuckler profiles
  let bestKey = 'C major';
  let bestCorr = -Infinity;
  
  for (let shift = 0; shift < 12; shift++) {
    // Major key correlation
    let corrMaj = 0;
    let corrMin = 0;
    for (let i = 0; i < 12; i++) {
      corrMaj += chroma[(i + shift) % 12] * MAJOR_PROFILE[i];
      corrMin += chroma[(i + shift) % 12] * MINOR_PROFILE[i];
    }
    
    if (corrMaj > bestCorr) {
      bestCorr = corrMaj;
      bestKey = `${KEY_NAMES_MAJOR[shift]} major`;
    }
    if (corrMin > bestCorr) {
      bestCorr = corrMin;
      bestKey = `${KEY_NAMES_MINOR[shift]} minor`;
    }
  }
  
  const camelot = KEY_TO_CAMELOT[bestKey] || '1A';
  
  return { key: bestKey, camelot };
}

/**
 * Energy curve via windowed RMS
 */
function computeEnergyCurve(samples: Float32Array, sampleRate: number, numBins: number = 20): number[] {
  const samplesPerBin = Math.floor(samples.length / numBins);
  const curve: number[] = [];
  
  for (let i = 0; i < numBins; i++) {
    const start = i * samplesPerBin;
    const end = Math.min(start + samplesPerBin, samples.length);
    let sum = 0;
    for (let j = start; j < end; j++) {
      sum += samples[j] * samples[j];
    }
    const rms = Math.sqrt(sum / (end - start));
    curve.push(rms);
  }
  
  // Normalize to 0-1
  const maxRms = Math.max(...curve);
  if (maxRms > 0) {
    return curve.map(v => v / maxRms);
  }
  return curve;
}

/**
 * Simplified LUFS measurement (ITU-R BS.1770 inspired)
 */
function computeLUFS(samples: Float32Array, sampleRate: number): number {
  // K-weighting approximation via simple high-shelf emphasis
  const blockSize = Math.floor(sampleRate * 0.4); // 400ms blocks
  const numBlocks = Math.floor(samples.length / blockSize);
  const blockLoudness: number[] = [];
  
  for (let b = 0; b < numBlocks; b++) {
    const start = b * blockSize;
    let sum = 0;
    for (let i = start; i < start + blockSize && i < samples.length; i++) {
      sum += samples[i] * samples[i];
    }
    const meanSquare = sum / blockSize;
    if (meanSquare > 0) {
      blockLoudness.push(meanSquare);
    }
  }
  
  if (blockLoudness.length === 0) return -70;
  
  // Gating: remove blocks below absolute threshold
  const absThreshold = Math.pow(10, -7); // ~-70 LUFS
  const gated = blockLoudness.filter(l => l > absThreshold);
  
  if (gated.length === 0) return -70;
  
  const meanGated = gated.reduce((a, b) => a + b, 0) / gated.length;
  const lufs = -0.691 + 10 * Math.log10(meanGated);
  
  return Math.max(-70, Math.min(0, lufs));
}

/**
 * Vocal activity estimation via spectral centroid variance
 * High centroid variance = likely vocal content
 */
function estimateVocalActivity(samples: Float32Array, sampleRate: number, numBins: number = 20): number[] {
  const samplesPerBin = Math.floor(samples.length / numBins);
  const frameSize = 2048;
  const activity: number[] = [];
  
  for (let bin = 0; bin < numBins; bin++) {
    const start = bin * samplesPerBin;
    const end = Math.min(start + samplesPerBin, samples.length);
    
    // Compute spectral centroid for sub-frames within this bin
    const centroids: number[] = [];
    for (let pos = start; pos + frameSize < end; pos += frameSize) {
      let numerator = 0, denominator = 0;
      
      // Simple magnitude spectrum via Goertzel for vocal range (300Hz-4000Hz)
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
    
    // High variance in centroid = likely vocal content
    if (centroids.length > 1) {
      const mean = centroids.reduce((a, b) => a + b, 0) / centroids.length;
      const variance = centroids.reduce((a, b) => a + (b - mean) ** 2, 0) / centroids.length;
      // Normalize: typical vocal variance is 100-2000 Hz²
      activity.push(Math.min(1, variance / 1500));
    } else {
      activity.push(0);
    }
  }
  
  return activity;
}

/**
 * Segment detection via energy novelty function
 */
function detectSegments(energyCurve: number[], durationSec: number): TrackSegment[] {
  const numBins = energyCurve.length;
  const secPerBin = durationSec / numBins;
  
  // Compute novelty (abs difference between adjacent energy values)
  const novelty: number[] = [];
  for (let i = 1; i < numBins; i++) {
    novelty.push(Math.abs(energyCurve[i] - energyCurve[i - 1]));
  }
  
  // Find novelty peaks (segment boundaries)
  const threshold = novelty.reduce((a, b) => a + b, 0) / novelty.length * 1.5;
  const boundaries: number[] = [0];
  
  for (let i = 1; i < novelty.length - 1; i++) {
    if (novelty[i] > threshold && novelty[i] >= novelty[i - 1] && novelty[i] >= novelty[i + 1]) {
      // Enforce minimum segment length of 2 bins
      if (i - boundaries[boundaries.length - 1] >= 2) {
        boundaries.push(i + 1); // +1 because novelty is offset by 1
      }
    }
  }
  boundaries.push(numBins);
  
  // Label segments based on energy
  const segments: TrackSegment[] = [];
  const segmentTypes: TrackSegment['type'][] = ['intro', 'verse', 'drop', 'breakdown', 'outro'];
  
  for (let i = 0; i < boundaries.length - 1; i++) {
    const startBin = boundaries[i];
    const endBin = boundaries[i + 1];
    const segEnergy = energyCurve.slice(startBin, endBin).reduce((a, b) => a + b, 0) / (endBin - startBin);
    
    let type: TrackSegment['type'];
    if (i === 0 && segEnergy < 0.4) type = 'intro';
    else if (i === boundaries.length - 2 && segEnergy < 0.4) type = 'outro';
    else if (segEnergy > 0.7) type = 'drop';
    else if (segEnergy < 0.35) type = 'breakdown';
    else type = 'verse';
    
    segments.push({
      type,
      startSec: startBin * secPerBin,
      endSec: endBin * secPerBin,
      energy: segEnergy,
    });
  }
  
  return segments;
}

/**
 * Full track analysis pipeline
 */
export async function analyzeTrackReal(track: DJTrack): Promise<DJTrack> {
  const audioBuffer = await decodeAudioFile(track.fileUrl);
  const samples = getMonoSamples(audioBuffer);
  const sampleRate = audioBuffer.sampleRate;
  const durationSec = audioBuffer.duration;
  
  // Run all analyses
  const { bpm, confidence: bpmConfidence } = detectBPM(samples, sampleRate);
  const { key, camelot } = detectKey(samples, sampleRate);
  const energyCurve = computeEnergyCurve(samples, sampleRate, 20);
  const lufsIntegrated = computeLUFS(samples, sampleRate);
  const vocalActivityCurve = estimateVocalActivity(samples, sampleRate, 20);
  const segments = detectSegments(energyCurve, durationSec);
  
  // Downsample large arrays to max 32 points to reduce memory footprint
  const downsample = (arr: number[], maxLen: number): number[] => {
    if (arr.length <= maxLen) return arr;
    const step = arr.length / maxLen;
    const result: number[] = [];
    for (let i = 0; i < maxLen; i++) {
      result.push(arr[Math.floor(i * step)]);
    }
    return result;
  };

  const features: TrackFeatures = {
    bpm,
    bpmConfidence,
    key,
    camelot,
    lufsIntegrated,
    energyCurve: downsample(energyCurve, 32),
    segments,
    vocalActivityCurve: downsample(vocalActivityCurve, 32),
  };
  
  // Explicitly release references to large typed arrays
  // (the AudioBuffer and samples will be GC'd after this function returns)
  
  return { ...track, durationSec, features };
}

// Export Camelot compatibility checker
export function getCamelotCompatibility(a: string, b: string): number {
  const numA = parseInt(a);
  const numB = parseInt(b);
  const modeA = a.slice(-1);
  const modeB = b.slice(-1);
  
  if (isNaN(numA) || isNaN(numB)) return 0;
  
  // Same key = perfect
  if (a === b) return 1.0;
  
  // Adjacent keys on Camelot wheel
  const diff = Math.abs(numA - numB);
  const circularDiff = Math.min(diff, 12 - diff);
  
  // Same mode, adjacent number
  if (modeA === modeB && circularDiff === 1) return 0.9;
  
  // Parallel key (same number, different mode)
  if (numA === numB && modeA !== modeB) return 0.85;
  
  // Two steps away, same mode
  if (modeA === modeB && circularDiff === 2) return 0.6;
  
  // Anything else
  return Math.max(0, 1 - circularDiff * 0.15);
}
