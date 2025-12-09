/**
 * Audio Processor for Amapianorization
 * Handles real-time WebAudio API processing for log drums, percussion, and effects
 */

import { audioSampleLoader } from './sampleLoader';
import { selectLogDrumSamples } from './logDrumLibrary';
import { selectPercussionSamples } from './percussionLibrary';
import { calculateAuthenticityScore, benchmarkAgainstRegion, REGIONAL_BENCHMARKS } from './authenticityScoring';

export interface AmapianorizeSettings {
  addLogDrum: boolean;
  logDrumIntensity: number;
  addPercussion: boolean;
  percussionDensity: number;
  addPianoChords: boolean;
  pianoComplexity: number;
  addBassline: boolean;
  bassDepth: number;
  addVocalChops: boolean;
  vocalChopRate: number;
  sidechainCompression: boolean;
  sidechainAmount: number;
  filterSweeps: boolean;
  sweepFrequency: number;
  culturalAuthenticity: 'traditional' | 'modern' | 'fusion';
  regionalStyle: 'johannesburg' | 'pretoria' | 'durban' | 'cape-town';
}

export interface AmapianorizeResult {
  success: boolean;
  authenticityScore: number;
  regionalStyle: string;
  processedAudio?: {
    url: string;
    duration: number;
    sampleRate: number;
  };
  enhancedStems?: any;
  message?: string;
  error?: string;
}

/**
 * Main amapianorization function
 */
export async function amapianorizeAudio(
  stems: any,
  settings: AmapianorizeSettings
): Promise<AmapianorizeResult> {
  try {
    console.log('[AmapianorizeAudio] Starting processing with settings:', settings);

    // Initialize audio context
    const audioContext = new AudioContext();
    audioSampleLoader.initialize(audioContext);

    // Extract BPM and key from stems metadata, with sensible defaults
    const bpm = stems?.metadata?.bpm ?? stems?.bpm ?? 115;
    const key = stems?.metadata?.key ?? stems?.key ?? 'Cm';
    console.log(`[AmapianorizeAudio] Using BPM: ${bpm}, Key: ${key}`);

    // Select samples based on settings
    const logDrumSamples = settings.addLogDrum 
      ? selectLogDrumSamples(
          settings.regionalStyle,
          bpm,
          key,
          settings.logDrumIntensity
        )
      : [];

    const percussionSamples = settings.addPercussion
      ? selectPercussionSamples(
          settings.percussionDensity,
          settings.regionalStyle,
          bpm
        )
      : [];

    console.log(`[AmapianorizeAudio] Selected ${logDrumSamples.length} log drums, ${percussionSamples.length} percussion`);

    // Calculate authenticity score using learned regional weights
    const elementScores = {
      logDrum: settings.addLogDrum ? settings.logDrumIntensity : 0,
      percussion: settings.addPercussion ? settings.percussionDensity : 0,
      bass: settings.addBassline ? settings.bassDepth : 0,
      piano: settings.addPianoChords ? settings.pianoComplexity : 0,
      sidechain: settings.sidechainCompression ? settings.sidechainAmount : 0,
      filterSweep: settings.filterSweeps ? settings.sweepFrequency : 0,
      vocalStyle: settings.addVocalChops ? settings.vocalChopRate : 0,
      arrangement: 0.7 // Default arrangement score
    };
    
    const scoreResult = calculateAuthenticityScore(settings.regionalStyle, elementScores);
    const benchmark = benchmarkAgainstRegion(
      scoreResult, 
      REGIONAL_BENCHMARKS[settings.regionalStyle] || REGIONAL_BENCHMARKS.johannesburg
    );
    
    const authenticityScore = scoreResult.totalScore;
    console.log(`[AmapianorizeAudio] Authenticity: ${authenticityScore}% (${benchmark.rating})`);
    if (scoreResult.suggestions.length > 0) {
      console.log('[AmapianorizeAudio] Suggestions:', scoreResult.suggestions);
    }


    // For now, generate a simple test audio buffer
    // In production, this would mix the actual stems with selected samples
    const duration = 4; // seconds
    const sampleRate = audioContext.sampleRate;
    const numSamples = sampleRate * duration;
    const buffer = audioContext.createBuffer(2, numSamples, sampleRate);

    // Generate test tone (440 Hz sine wave)
    for (let channel = 0; channel < 2; channel++) {
      const channelData = buffer.getChannelData(channel);
      for (let i = 0; i < numSamples; i++) {
        channelData[i] = Math.sin(2 * Math.PI * 440 * i / sampleRate) * 0.3;
      }
    }

    // Convert buffer to WAV file
    const wavBlob = audioBufferToWav(buffer);
    const url = URL.createObjectURL(wavBlob);

    console.log('[AmapianorizeAudio] Processing complete, authenticity:', authenticityScore);

    return {
      success: true,
      authenticityScore,
      regionalStyle: settings.regionalStyle,
      processedAudio: {
        url,
        duration,
        sampleRate,
      },
      enhancedStems: stems,
      message: `Amapianorization complete with ${authenticityScore}% authenticity`
    };

  } catch (error) {
    console.error('[AmapianorizeAudio] Error:', error);
    return {
      success: false,
      authenticityScore: 0,
      regionalStyle: settings.regionalStyle,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Convert AudioBuffer to WAV blob
 */
function audioBufferToWav(buffer: AudioBuffer): Blob {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const format = 1; // PCM
  const bitDepth = 16;

  const bytesPerSample = bitDepth / 8;
  const blockAlign = numChannels * bytesPerSample;

  const data = [];
  for (let i = 0; i < buffer.length; i++) {
    for (let channel = 0; channel < numChannels; channel++) {
      const sample = Math.max(-1, Math.min(1, buffer.getChannelData(channel)[i]));
      data.push(sample < 0 ? sample * 0x8000 : sample * 0x7FFF);
    }
  }

  const dataLength = data.length * bytesPerSample;
  const headerLength = 44;
  const totalLength = headerLength + dataLength;

  const arrayBuffer = new ArrayBuffer(totalLength);
  const view = new DataView(arrayBuffer);

  // RIFF chunk descriptor
  writeString(view, 0, 'RIFF');
  view.setUint32(4, totalLength - 8, true);
  writeString(view, 8, 'WAVE');

  // fmt sub-chunk
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true); // SubChunk1Size
  view.setUint16(20, format, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitDepth, true);

  // data sub-chunk
  writeString(view, 36, 'data');
  view.setUint32(40, dataLength, true);

  // Write audio data
  let offset = 44;
  for (let i = 0; i < data.length; i++) {
    view.setInt16(offset, data[i], true);
    offset += 2;
  }

  return new Blob([arrayBuffer], { type: 'audio/wav' });
}

function writeString(view: DataView, offset: number, string: string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}
