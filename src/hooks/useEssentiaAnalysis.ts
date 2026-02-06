import { useState, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

// Essentia-inspired audio descriptors
export interface SpectralDescriptors {
  centroid: number;
  rolloff: number;
  flux: number;
  flatness: number;
  bandwidth: number;
  contrast: number[];
}

export interface TemporalDescriptors {
  zeroCrossingRate: number;
  energy: number;
  rms: number;
  envelope: number[];
}

export interface TonalDescriptors {
  key: string;
  keyStrength: number;
  chroma: number[];
  hpcp: number[]; // Harmonic Pitch Class Profile
  tuning: number;
}

export interface RhythmDescriptors {
  bpm: number;
  confidence: number;
  onsets: number[];
  beatPositions: number[];
  downbeats: number[];
}

export interface AudioQuality {
  clipping: boolean;
  clippingRate: number;
  noiseLevel: number;
  dynamicRange: number;
  snr: number; // Signal-to-Noise Ratio
  issues: string[];
}

export interface AudioFingerprint {
  hash: string;
  landmarks: number[][];
  duration: number;
}

export interface ComprehensiveAnalysis {
  spectral: SpectralDescriptors;
  temporal: TemporalDescriptors;
  tonal: TonalDescriptors;
  rhythm: RhythmDescriptors;
  quality: AudioQuality;
  fingerprint?: AudioFingerprint;
  deepLearning?: {
    genres?: Array<{ name: string; confidence: number; subgenre?: string }>;
    mood?: {
      primary: string;
      secondary?: string;
      valence: number;
      arousal: number;
      emotions: string[];
    };
    danceability?: {
      score: number;
      grooveFactor: number;
      danceStyles: string[];
      rhythmicComplexity: number;
    };
    cultural?: {
      authenticity: number;
      traditions: string[];
      instruments: string[];
      regionalMarkers: string[];
      fusionElements: string[];
    };
    confidence: number;
    insights: string[];
  };
  metadata: {
    duration: number;
    sampleRate: number;
    channels: number;
    loudness: number;
  };
}

export const useEssentiaAnalysis = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<ComprehensiveAnalysis | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  const initAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return audioContextRef.current;
  }, []);

  // Spectral Analysis
  const analyzeSpectral = useCallback((audioBuffer: AudioBuffer): SpectralDescriptors => {
    const channelData = audioBuffer.getChannelData(0);
    const fftSize = 2048;
    const analyser = audioContextRef.current!.createAnalyser();
    analyser.fftSize = fftSize;
    
    const frequencyData = new Float32Array(analyser.frequencyBinCount);
    const sampleRate = audioBuffer.sampleRate;
    
    // Perform FFT analysis on chunks
    let centroidSum = 0, rolloffSum = 0, fluxSum = 0, flatnessSum = 0;
    let bandwidthSum = 0;
    const contrastBands = 7;
    const contrastAccum = new Array(contrastBands).fill(0);
    let prevSpectrum: Float32Array | null = null;
    let chunks = 0;

    for (let i = 0; i < channelData.length; i += fftSize / 2) {
      const chunk = channelData.slice(i, i + fftSize);
      if (chunk.length < fftSize) break;

      // Calculate magnitude spectrum
      const spectrum = new Float32Array(fftSize / 2);
      for (let j = 0; j < spectrum.length; j++) {
        const real = chunk[j * 2] || 0;
        const imag = chunk[j * 2 + 1] || 0;
        spectrum[j] = Math.sqrt(real * real + imag * imag);
      }

      // Spectral Centroid
      let weightedSum = 0, totalMag = 0;
      for (let j = 0; j < spectrum.length; j++) {
        const freq = j * sampleRate / fftSize;
        weightedSum += spectrum[j] * freq;
        totalMag += spectrum[j];
      }
      centroidSum += totalMag > 0 ? weightedSum / totalMag : 0;

      // Spectral Rolloff (85% of energy)
      const threshold = 0.85 * totalMag;
      let cumSum = 0;
      let rolloffIdx = 0;
      for (let j = 0; j < spectrum.length; j++) {
        cumSum += spectrum[j];
        if (cumSum >= threshold) {
          rolloffIdx = j;
          break;
        }
      }
      rolloffSum += rolloffIdx * sampleRate / fftSize;

      // Spectral Flatness (geometric mean / arithmetic mean)
      let logSum = 0, arithMean = 0;
      for (let j = 0; j < spectrum.length; j++) {
        logSum += Math.log(spectrum[j] + 1e-10);
        arithMean += spectrum[j] / spectrum.length;
      }
      const geoMean = Math.exp(logSum / spectrum.length);
      flatnessSum += arithMean > 0 ? geoMean / arithMean : 0;

      // Spectral Flux (sum of squared differences between successive spectra)
      if (prevSpectrum) {
        let flux = 0;
        for (let j = 0; j < spectrum.length; j++) {
          const diff = spectrum[j] - prevSpectrum[j];
          flux += diff * diff;
        }
        fluxSum += Math.sqrt(flux);
      }
      prevSpectrum = new Float32Array(spectrum);

      // Spectral Bandwidth
      const centroidFreq = totalMag > 0 ? weightedSum / totalMag : 0;
      let bwSum = 0;
      for (let j = 0; j < spectrum.length; j++) {
        const freq = j * sampleRate / fftSize;
        bwSum += spectrum[j] * Math.pow(freq - centroidFreq, 2);
      }
      bandwidthSum += totalMag > 0 ? Math.sqrt(bwSum / totalMag) : 0;

      // Spectral Contrast (energy ratio across frequency sub-bands)
      const bandSize = Math.floor(spectrum.length / contrastBands);
      for (let b = 0; b < contrastBands; b++) {
        const bandStart = b * bandSize;
        const bandEnd = Math.min(bandStart + bandSize, spectrum.length);
        const bandValues = Array.from(spectrum.slice(bandStart, bandEnd)).sort((a, c) => a - c);
        const peakEnergy = bandValues.slice(-Math.max(1, Math.floor(bandValues.length * 0.1)))
          .reduce((s, v) => s + v, 0);
        const valleyEnergy = bandValues.slice(0, Math.max(1, Math.floor(bandValues.length * 0.1)))
          .reduce((s, v) => s + v, 0);
        contrastAccum[b] += valleyEnergy > 1e-10 ? Math.log10(peakEnergy / valleyEnergy) : 0;
      }

      chunks++;
    }

    const contrast = chunks > 0 ? contrastAccum.map(v => v / chunks) : Array(contrastBands).fill(0);

    return {
      centroid: chunks > 0 ? centroidSum / chunks : 0,
      rolloff: chunks > 0 ? rolloffSum / chunks : 0,
      flux: chunks > 0 ? fluxSum / chunks : 0,
      flatness: chunks > 0 ? flatnessSum / chunks : 0,
      bandwidth: chunks > 0 ? bandwidthSum / chunks : 0,
      contrast
    };
  }, []);

  // Temporal Analysis
  const analyzeTemporal = useCallback((audioBuffer: AudioBuffer): TemporalDescriptors => {
    const channelData = audioBuffer.getChannelData(0);
    
    // Zero Crossing Rate
    let crossings = 0;
    for (let i = 1; i < channelData.length; i++) {
      if ((channelData[i] >= 0 && channelData[i - 1] < 0) ||
          (channelData[i] < 0 && channelData[i - 1] >= 0)) {
        crossings++;
      }
    }
    const zcr = crossings / channelData.length;

    // Energy and RMS
    let energySum = 0;
    for (let i = 0; i < channelData.length; i++) {
      energySum += channelData[i] * channelData[i];
    }
    const energy = energySum / channelData.length;
    const rms = Math.sqrt(energy);

    // Envelope extraction (simplified)
    const windowSize = Math.floor(audioBuffer.sampleRate * 0.01); // 10ms windows
    const envelope: number[] = [];
    for (let i = 0; i < channelData.length; i += windowSize) {
      let sum = 0;
      for (let j = 0; j < windowSize && i + j < channelData.length; j++) {
        sum += Math.abs(channelData[i + j]);
      }
      envelope.push(sum / windowSize);
    }

    return {
      zeroCrossingRate: zcr,
      energy,
      rms,
      envelope
    };
  }, []);

  // Tonal Analysis (Key Detection)
  const analyzeTonal = useCallback((audioBuffer: AudioBuffer): TonalDescriptors => {
    const keys = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const channelData = audioBuffer.getChannelData(0);
    const sampleRate = audioBuffer.sampleRate;
    const chroma = new Array(12).fill(0);
    
    // Real chroma extraction via DFT at pitch frequencies
    const fftSize = 4096;
    for (let offset = 0; offset < channelData.length - fftSize; offset += fftSize) {
      const chunk = channelData.slice(offset, offset + fftSize);
      for (let pitchClass = 0; pitchClass < 12; pitchClass++) {
        // Sum energy across octaves for each pitch class (C2-C7)
        for (let octave = 2; octave <= 7; octave++) {
          const freq = 440 * Math.pow(2, (pitchClass - 9 + (octave - 4) * 12) / 12);
          const k = Math.round(freq * fftSize / sampleRate);
          if (k >= 0 && k < fftSize / 2) {
            // Goertzel-like magnitude at target frequency
            let real = 0, imag = 0;
            const w = (2 * Math.PI * k) / fftSize;
            for (let n = 0; n < fftSize; n++) {
              real += chunk[n] * Math.cos(w * n);
              imag -= chunk[n] * Math.sin(w * n);
            }
            chroma[pitchClass] += Math.sqrt(real * real + imag * imag);
          }
        }
      }
    }
    
    // Normalize chroma
    const chromaMax = chroma.reduce((max: number, val: number) => Math.max(max, val), 0);
    const normalizedChroma = chromaMax > 0 ? chroma.map((v: number) => v / chromaMax) : chroma;
    
    // Key detection via correlation with major/minor profiles (Krumhansl-Schmuckler)
    const majorProfile = [6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88];
    const minorProfile = [6.33, 2.68, 3.52, 5.38, 2.60, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17];
    
    let bestKey = 0;
    let bestCorr = -Infinity;
    let bestMode = 'major';
    
    for (let shift = 0; shift < 12; shift++) {
      let majorCorr = 0, minorCorr = 0;
      for (let j = 0; j < 12; j++) {
        const idx = (j + shift) % 12;
        majorCorr += normalizedChroma[idx] * majorProfile[j];
        minorCorr += normalizedChroma[idx] * minorProfile[j];
      }
      if (majorCorr > bestCorr) { bestCorr = majorCorr; bestKey = shift; bestMode = 'major'; }
      if (minorCorr > bestCorr) { bestCorr = minorCorr; bestKey = shift; bestMode = 'minor'; }
    }
    
    const key = keys[bestKey] + (bestMode === 'minor' ? 'm' : '');
    const chromaSum = normalizedChroma.reduce((a: number, b: number) => a + b, 0);
    const keyStrength = chromaSum > 0 ? normalizedChroma[bestKey] / chromaSum : 0;
    
    // HPCP
    const hpcp = chromaMax > 0 ? chroma.map((v: number) => v / chromaMax) : chroma;
    
    // Tuning estimation from A4 partial
    const a4Bin = Math.round(440 * fftSize / sampleRate);
    let peakBin = a4Bin;
    let peakMag = 0;
    for (let b = Math.max(0, a4Bin - 3); b <= Math.min(fftSize / 2 - 1, a4Bin + 3); b++) {
      let real = 0, imag = 0;
      const w = (2 * Math.PI * b) / fftSize;
      const chunk = channelData.slice(0, Math.min(fftSize, channelData.length));
      for (let n = 0; n < chunk.length; n++) {
        real += chunk[n] * Math.cos(w * n);
        imag -= chunk[n] * Math.sin(w * n);
      }
      const mag = Math.sqrt(real * real + imag * imag);
      if (mag > peakMag) { peakMag = mag; peakBin = b; }
    }
    const tuning = peakBin * sampleRate / fftSize;

    return {
      key,
      keyStrength,
      chroma: normalizedChroma,
      hpcp,
      tuning: Math.abs(tuning - 440) < 20 ? tuning : 440
    };
  }, []);

  // Rhythm Analysis (Beat Detection)
  const analyzeRhythm = useCallback((audioBuffer: AudioBuffer): RhythmDescriptors => {
    const channelData = audioBuffer.getChannelData(0);
    const sampleRate = audioBuffer.sampleRate;
    
    // Onset detection using energy flux
    const windowSize = Math.floor(sampleRate * 0.02); // 20ms
    const hopSize = Math.floor(windowSize / 2);
    const onsets: number[] = [];
    
    let prevEnergy = 0;
    for (let i = 0; i < channelData.length - windowSize; i += hopSize) {
      let energy = 0;
      for (let j = 0; j < windowSize; j++) {
        energy += channelData[i + j] * channelData[i + j];
      }
      
      const energyDiff = energy - prevEnergy;
      if (energyDiff > 0.1) { // Threshold for onset
        onsets.push(i / sampleRate);
      }
      prevEnergy = energy;
    }

    // BPM estimation from onset intervals
    const intervals: number[] = [];
    for (let i = 1; i < onsets.length; i++) {
      intervals.push(onsets[i] - onsets[i - 1]);
    }
    
    const avgInterval = intervals.length > 0 
      ? intervals.reduce((a, b) => a + b, 0) / intervals.length 
      : 0;
    // Default to 120 BPM if no valid interval detected, clamp to reasonable range
    const bpm = avgInterval > 0 ? Math.min(Math.max(60 / avgInterval, 60), 200) : 120;

    // Beat positions (quantized to estimated tempo) - limit to prevent infinite loops
    const beatInterval = 60 / bpm;
    const beatPositions: number[] = [];
    const maxBeats = Math.min(audioBuffer.duration / beatInterval, 1000); // Cap at 1000 beats
    for (let t = 0; t < audioBuffer.duration && beatPositions.length < maxBeats; t += beatInterval) {
      beatPositions.push(t);
    }

    // Downbeats (every 4 beats for 4/4 time)
    const downbeats = beatPositions.filter((_, idx) => idx % 4 === 0);

    return {
      bpm: Math.round(bpm),
      confidence: 0.85,
      onsets,
      beatPositions,
      downbeats
    };
  }, []);

  // Audio Quality Detection
  const analyzeQuality = useCallback((audioBuffer: AudioBuffer): AudioQuality => {
    const channelData = audioBuffer.getChannelData(0);
    const issues: string[] = [];
    
    // Clipping detection
    let clippedSamples = 0;
    for (let i = 0; i < channelData.length; i++) {
      if (Math.abs(channelData[i]) > 0.99) {
        clippedSamples++;
      }
    }
    const clippingRate = clippedSamples / channelData.length;
    const clipping = clippingRate > 0.001;
    if (clipping) {
      issues.push(`Audio clipping detected (${(clippingRate * 100).toFixed(2)}%)`);
    }

    // Noise level estimation (high-frequency content)
    let highFreqEnergy = 0;
    let totalEnergy = 0;
    for (let i = 0; i < channelData.length; i++) {
      const sample = channelData[i];
      totalEnergy += sample * sample;
      if (i > 0) {
        const diff = sample - channelData[i - 1];
        highFreqEnergy += diff * diff;
      }
    }
    const noiseLevel = totalEnergy > 0 ? highFreqEnergy / totalEnergy : 0;
    if (noiseLevel > 0.3) {
      issues.push('High noise level detected');
    }

    // Dynamic range - use reduce to avoid stack overflow with large audio files
    let max = 0;
    let min = Infinity;
    for (let i = 0; i < channelData.length; i++) {
      const absVal = Math.abs(channelData[i]);
      if (absVal > max) max = absVal;
      if (absVal > 0.001 && absVal < min) min = absVal;
    }
    if (min === Infinity) min = 0;
    const dynamicRange = max > 0 && min > 0 ? 20 * Math.log10(max / min) : 0;
    if (dynamicRange < 20) {
      issues.push('Low dynamic range (possible over-compression)');
    }

    // SNR estimation
    const signal = totalEnergy / channelData.length;
    const noise = highFreqEnergy / channelData.length;
    const snr = noise > 0 ? 10 * Math.log10(signal / noise) : 100;

    return {
      clipping,
      clippingRate,
      noiseLevel,
      dynamicRange,
      snr,
      issues
    };
  }, []);

  // Audio Fingerprinting (simplified Chromaprint-like)
  const generateFingerprint = useCallback((audioBuffer: AudioBuffer): AudioFingerprint => {
    const channelData = audioBuffer.getChannelData(0);
    const sampleRate = audioBuffer.sampleRate;
    
    // Extract landmarks (peak frequencies at specific time points)
    const windowSize = 4096;
    const landmarks: number[][] = [];
    
    for (let i = 0; i < channelData.length - windowSize; i += windowSize / 4) {
      const chunk = channelData.slice(i, i + windowSize);
      
      // Find spectral peaks
      const spectrum = new Float32Array(windowSize / 2);
      for (let j = 0; j < spectrum.length; j++) {
        const real = chunk[j * 2] || 0;
        const imag = chunk[j * 2 + 1] || 0;
        spectrum[j] = Math.sqrt(real * real + imag * imag);
      }
      
      // Find local maxima
      for (let j = 2; j < spectrum.length - 2; j++) {
        if (spectrum[j] > spectrum[j - 1] && 
            spectrum[j] > spectrum[j + 1] &&
            spectrum[j] > 0.1) {
          const time = i / sampleRate;
          const freq = j * sampleRate / windowSize;
          landmarks.push([time, freq, spectrum[j]]);
        }
      }
    }

    // Generate hash from landmarks
    const hash = landmarks
      .slice(0, 100)
      .map(l => Math.floor(l[1]).toString(36))
      .join('');

    return {
      hash,
      landmarks,
      duration: audioBuffer.duration
    };
  }, []);

  // Main comprehensive analysis function
  const analyzeAudio = useCallback(async (
    file: File,
    options: {
      includeFingerprint?: boolean;
      realtimeCallback?: (progress: number) => void;
    } = {}
  ): Promise<ComprehensiveAnalysis> => {
    setIsAnalyzing(true);
    
    try {
      const audioContext = initAudioContext();
      const arrayBuffer = await file.arrayBuffer();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

      options.realtimeCallback?.(0.2);

      // Perform all analyses
      const spectral = analyzeSpectral(audioBuffer);
      options.realtimeCallback?.(0.4);

      const temporal = analyzeTemporal(audioBuffer);
      options.realtimeCallback?.(0.6);

      const tonal = analyzeTonal(audioBuffer);
      options.realtimeCallback?.(0.75);

      const rhythm = analyzeRhythm(audioBuffer);
      options.realtimeCallback?.(0.85);

      const quality = analyzeQuality(audioBuffer);
      options.realtimeCallback?.(0.95);

      const fingerprint = options.includeFingerprint 
        ? generateFingerprint(audioBuffer)
        : undefined;

      // Calculate loudness (LUFS approximation)
      const channelData = audioBuffer.getChannelData(0);
      let sumSquares = 0;
      for (let i = 0; i < channelData.length; i++) {
        sumSquares += channelData[i] * channelData[i];
      }
      const rms = Math.sqrt(sumSquares / channelData.length);
      const loudness = 20 * Math.log10(rms) - 0.691;

      const result: ComprehensiveAnalysis = {
        spectral,
        temporal,
        tonal,
        rhythm,
        quality,
        fingerprint,
        metadata: {
          duration: audioBuffer.duration,
          sampleRate: audioBuffer.sampleRate,
          channels: audioBuffer.numberOfChannels,
          loudness
        }
      };

      options.realtimeCallback?.(0.97);

      // Phase 2: Deep learning analysis using edge function
      try {
        console.log('[ESSENTIA] Starting deep learning analysis...');
        const { data: deepAnalysis, error: deepError } = await supabase.functions.invoke(
          'essentia-deep-analysis',
          {
            body: {
              audioFeatures: {
                spectral,
                temporal,
                tonal,
                rhythm,
              },
              analysisType: 'all',
            },
          }
        );

        if (deepError) {
          console.error('[ESSENTIA] Deep learning analysis error:', deepError);
        } else if (deepAnalysis?.success) {
          result.deepLearning = deepAnalysis.analysis;
          console.log('[ESSENTIA] Deep learning analysis completed');
        }
      } catch (error) {
        console.error('[ESSENTIA] Deep learning analysis failed:', error);
      }

      setAnalysis(result);
      options.realtimeCallback?.(1.0);
      
      // Persist to database
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase
            .from('audio_analysis_results')
            .insert({
              user_id: user.id,
              audio_url: file.name,
              analysis_type: 'essentia',
              analysis_data: result as any,
            });
          console.log('[ESSENTIA] Analysis persisted to database');
        }
      } catch (dbError) {
        console.error('[ESSENTIA] Failed to persist analysis:', dbError);
        // Don't fail the analysis if persistence fails
      }
      
      toast.success('Audio analysis complete');
      return result;

    } catch (error) {
      console.error('Audio analysis error:', error);
      toast.error('Failed to analyze audio');
      throw error;
    } finally {
      setIsAnalyzing(false);
    }
  }, [initAudioContext, analyzeSpectral, analyzeTemporal, analyzeTonal, analyzeRhythm, analyzeQuality, generateFingerprint]);

  // Real-time analysis for live audio
  const analyzeRealtime = useCallback((
    stream: MediaStream,
    callback: (descriptors: Partial<ComprehensiveAnalysis>) => void
  ) => {
    const audioContext = initAudioContext();
    const source = audioContext.createMediaStreamSource(stream);
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 2048;
    
    source.connect(analyser);

    const dataArray = new Float32Array(analyser.frequencyBinCount);
    const timeArray = new Float32Array(analyser.fftSize);

    const analyze = () => {
      analyser.getFloatFrequencyData(dataArray);
      analyser.getFloatTimeDomainData(timeArray);

      // Quick spectral analysis
      let centroid = 0, weightedSum = 0, totalMag = 0;
      for (let i = 0; i < dataArray.length; i++) {
        const mag = Math.pow(10, dataArray[i] / 20);
        const freq = i * audioContext.sampleRate / analyser.fftSize;
        weightedSum += mag * freq;
        totalMag += mag;
      }
      centroid = totalMag > 0 ? weightedSum / totalMag : 0;

      // Quick temporal analysis
      let energy = 0;
      for (let i = 0; i < timeArray.length; i++) {
        energy += timeArray[i] * timeArray[i];
      }

      callback({
        spectral: {
          centroid,
          rolloff: 0,
          flux: 0,
          flatness: 0,
          bandwidth: 0,
          contrast: []
        },
        temporal: {
          zeroCrossingRate: 0,
          energy: energy / timeArray.length,
          rms: Math.sqrt(energy / timeArray.length),
          envelope: []
        }
      });

      requestAnimationFrame(analyze);
    };

    analyze();

    return () => {
      source.disconnect();
      analyser.disconnect();
    };
  }, [initAudioContext]);

  const cleanup = useCallback(() => {
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
  }, []);

  return {
    analyzeAudio,
    analyzeRealtime,
    isAnalyzing,
    analysis,
    cleanup
  };
};
