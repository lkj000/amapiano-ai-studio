import { useState, useCallback, useRef } from 'react';

export interface SpectralFeatures {
  spectralCentroid: number;
  spectralRolloff: number;
  zeroCrossingRate: number;
  rmsEnergy: number;
  pitchRange: { low: number; high: number };
  harmonicity: number;
  mfcc: number[];
}

export interface StemAnalysis {
  stemName: string;
  audioUrl: string;
  features: SpectralFeatures;
}

export function useSpectralAnalysis() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const audioContextRef = useRef<AudioContext | null>(null);

  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return audioContextRef.current;
  }, []);

  /**
   * Calculate spectral centroid - the "brightness" of the sound
   * Higher values indicate more high-frequency content
   */
  const calculateSpectralCentroid = (frequencyData: Float32Array, sampleRate: number, fftSize: number): number => {
    let weightedSum = 0;
    let magnitudeSum = 0;
    const binFrequency = sampleRate / fftSize;

    for (let i = 0; i < frequencyData.length; i++) {
      const magnitude = Math.pow(10, frequencyData[i] / 20); // Convert dB to linear
      const frequency = i * binFrequency;
      weightedSum += magnitude * frequency;
      magnitudeSum += magnitude;
    }

    return magnitudeSum > 0 ? weightedSum / magnitudeSum : 0;
  };

  /**
   * Calculate spectral rolloff - frequency below which 85% of energy is concentrated
   */
  const calculateSpectralRolloff = (frequencyData: Float32Array, sampleRate: number, fftSize: number, percentile = 0.85): number => {
    const magnitudes = frequencyData.map(db => Math.pow(10, db / 20));
    const totalEnergy = magnitudes.reduce((sum, m) => sum + m * m, 0);
    const threshold = totalEnergy * percentile;
    
    let cumulativeEnergy = 0;
    const binFrequency = sampleRate / fftSize;
    
    for (let i = 0; i < magnitudes.length; i++) {
      cumulativeEnergy += magnitudes[i] * magnitudes[i];
      if (cumulativeEnergy >= threshold) {
        return i * binFrequency;
      }
    }
    
    return sampleRate / 2;
  };

  /**
   * Calculate zero crossing rate - indicator of percussive vs tonal content
   * High ZCR = noise-like/percussive, Low ZCR = tonal
   */
  const calculateZeroCrossingRate = (samples: Float32Array): number => {
    let crossings = 0;
    for (let i = 1; i < samples.length; i++) {
      if ((samples[i] >= 0 && samples[i - 1] < 0) || (samples[i] < 0 && samples[i - 1] >= 0)) {
        crossings++;
      }
    }
    return crossings / samples.length;
  };

  /**
   * Calculate RMS energy - overall loudness
   */
  const calculateRMSEnergy = (samples: Float32Array): number => {
    let sum = 0;
    for (let i = 0; i < samples.length; i++) {
      sum += samples[i] * samples[i];
    }
    return Math.sqrt(sum / samples.length);
  };

  /**
   * Estimate pitch range using autocorrelation
   */
  const estimatePitchRange = (samples: Float32Array, sampleRate: number): { low: number; high: number } => {
    const minFreq = 50;  // Hz
    const maxFreq = 4000; // Hz
    const minPeriod = Math.floor(sampleRate / maxFreq);
    const maxPeriod = Math.floor(sampleRate / minFreq);
    
    const detectedPitches: number[] = [];
    const frameSize = 2048;
    const hopSize = 1024;
    
    for (let frameStart = 0; frameStart < samples.length - frameSize; frameStart += hopSize) {
      const frame = samples.slice(frameStart, frameStart + frameSize);
      
      // Autocorrelation
      let maxCorrelation = 0;
      let bestPeriod = 0;
      
      for (let period = minPeriod; period < Math.min(maxPeriod, frame.length / 2); period++) {
        let correlation = 0;
        for (let i = 0; i < frame.length - period; i++) {
          correlation += frame[i] * frame[i + period];
        }
        
        if (correlation > maxCorrelation) {
          maxCorrelation = correlation;
          bestPeriod = period;
        }
      }
      
      if (bestPeriod > 0 && maxCorrelation > 0.1) {
        const frequency = sampleRate / bestPeriod;
        if (frequency >= minFreq && frequency <= maxFreq) {
          detectedPitches.push(frequency);
        }
      }
    }
    
    if (detectedPitches.length === 0) {
      return { low: 0, high: 0 };
    }
    
    detectedPitches.sort((a, b) => a - b);
    const p10 = Math.floor(detectedPitches.length * 0.1);
    const p90 = Math.floor(detectedPitches.length * 0.9);
    
    return {
      low: detectedPitches[p10] || detectedPitches[0],
      high: detectedPitches[p90] || detectedPitches[detectedPitches.length - 1]
    };
  };

  /**
   * Estimate harmonicity - how tonal vs noisy the sound is
   * Uses spectral peak analysis
   */
  const calculateHarmonicity = (frequencyData: Float32Array): number => {
    const magnitudes = frequencyData.map(db => Math.pow(10, db / 20));
    const sorted = [...magnitudes].sort((a, b) => b - a);
    
    // Ratio of top 10 peaks to total energy
    const topPeaksEnergy = sorted.slice(0, 10).reduce((sum, m) => sum + m * m, 0);
    const totalEnergy = magnitudes.reduce((sum, m) => sum + m * m, 0);
    
    return totalEnergy > 0 ? topPeaksEnergy / totalEnergy : 0;
  };

  /**
   * Calculate basic MFCC-like features (simplified)
   */
  const calculateMFCC = (frequencyData: Float32Array, numCoeffs = 13): number[] => {
    const numBands = 26;
    const magnitudes = frequencyData.map(db => Math.pow(10, db / 20));
    const bandSize = Math.floor(magnitudes.length / numBands);
    
    // Mel-spaced band energies (simplified)
    const bandEnergies: number[] = [];
    for (let i = 0; i < numBands; i++) {
      const start = i * bandSize;
      const end = Math.min(start + bandSize, magnitudes.length);
      let energy = 0;
      for (let j = start; j < end; j++) {
        energy += magnitudes[j] * magnitudes[j];
      }
      bandEnergies.push(Math.log(energy + 1e-10));
    }
    
    // DCT to get MFCCs (simplified)
    const mfcc: number[] = [];
    for (let k = 0; k < numCoeffs; k++) {
      let sum = 0;
      for (let n = 0; n < bandEnergies.length; n++) {
        sum += bandEnergies[n] * Math.cos(Math.PI * k * (n + 0.5) / bandEnergies.length);
      }
      mfcc.push(sum);
    }
    
    return mfcc;
  };

  /**
   * Analyze an audio buffer and extract spectral features
   */
  const analyzeBuffer = useCallback(async (audioBuffer: AudioBuffer): Promise<SpectralFeatures> => {
    const audioContext = getAudioContext();
    const sampleRate = audioBuffer.sampleRate;
    const channelData = audioBuffer.getChannelData(0);
    
    // Create offline context for analysis
    const offlineContext = new OfflineAudioContext(1, audioBuffer.length, sampleRate);
    const source = offlineContext.createBufferSource();
    const analyser = offlineContext.createAnalyser();
    
    analyser.fftSize = 4096;
    analyser.smoothingTimeConstant = 0.3;
    
    source.buffer = audioBuffer;
    source.connect(analyser);
    analyser.connect(offlineContext.destination);
    
    const frequencyData = new Float32Array(analyser.frequencyBinCount);
    
    // We'll collect features across multiple frames
    const allCentroids: number[] = [];
    const allRolloffs: number[] = [];
    const allZCRs: number[] = [];
    const allRMS: number[] = [];
    
    const frameSize = 4096;
    const hopSize = 2048;
    const numFrames = Math.floor((channelData.length - frameSize) / hopSize);
    
    // Create analyser for each frame
    const fftSize = 4096;
    for (let frame = 0; frame < numFrames; frame++) {
      const start = frame * hopSize;
      const frameSamples = channelData.slice(start, start + frameSize);
      
      // Manual FFT approximation using spectral analysis
      // For real FFT, we'd use a proper library, but this gives us useful features
      allZCRs.push(calculateZeroCrossingRate(frameSamples));
      allRMS.push(calculateRMSEnergy(frameSamples));
    }
    
    // Get frequency domain features using Web Audio analyser
    const tempContext = new OfflineAudioContext(1, audioBuffer.length, sampleRate);
    const tempSource = tempContext.createBufferSource();
    const tempAnalyser = tempContext.createAnalyser();
    tempAnalyser.fftSize = fftSize;
    
    tempSource.buffer = audioBuffer;
    tempSource.connect(tempAnalyser);
    tempAnalyser.connect(tempContext.destination);
    
    // Sample at middle of audio
    tempSource.start();
    await new Promise(resolve => setTimeout(resolve, 100));
    tempAnalyser.getFloatFrequencyData(frequencyData);
    
    const spectralCentroid = calculateSpectralCentroid(frequencyData, sampleRate, fftSize);
    const spectralRolloff = calculateSpectralRolloff(frequencyData, sampleRate, fftSize);
    const harmonicity = calculateHarmonicity(frequencyData);
    const mfcc = calculateMFCC(frequencyData);
    const pitchRange = estimatePitchRange(channelData, sampleRate);
    
    return {
      spectralCentroid,
      spectralRolloff,
      zeroCrossingRate: allZCRs.length > 0 
        ? allZCRs.reduce((a, b) => a + b, 0) / allZCRs.length 
        : calculateZeroCrossingRate(channelData),
      rmsEnergy: allRMS.length > 0 
        ? allRMS.reduce((a, b) => a + b, 0) / allRMS.length 
        : calculateRMSEnergy(channelData),
      pitchRange,
      harmonicity,
      mfcc
    };
  }, [getAudioContext]);

  /**
   * Analyze an audio URL by loading and processing it
   */
  const analyzeAudioUrl = useCallback(async (
    audioUrl: string, 
    stemName: string
  ): Promise<StemAnalysis> => {
    const audioContext = getAudioContext();
    
    const response = await fetch(audioUrl);
    const arrayBuffer = await response.arrayBuffer();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    
    const features = await analyzeBuffer(audioBuffer);
    
    return {
      stemName,
      audioUrl,
      features
    };
  }, [analyzeBuffer, getAudioContext]);

  /**
   * Analyze multiple stems in parallel
   */
  const analyzeStems = useCallback(async (
    stems: { name: string; audioUrl: string }[]
  ): Promise<StemAnalysis[]> => {
    setIsAnalyzing(true);
    setProgress(0);
    
    const results: StemAnalysis[] = [];
    
    for (let i = 0; i < stems.length; i++) {
      const stem = stems[i];
      try {
        const analysis = await analyzeAudioUrl(stem.audioUrl, stem.name);
        results.push(analysis);
        setProgress(((i + 1) / stems.length) * 100);
      } catch (error) {
        console.error(`Error analyzing stem ${stem.name}:`, error);
        // Push default features on error
        results.push({
          stemName: stem.name,
          audioUrl: stem.audioUrl,
          features: {
            spectralCentroid: 0,
            spectralRolloff: 0,
            zeroCrossingRate: 0,
            rmsEnergy: 0,
            pitchRange: { low: 0, high: 0 },
            harmonicity: 0,
            mfcc: []
          }
        });
      }
    }
    
    setIsAnalyzing(false);
    setProgress(100);
    
    return results;
  }, [analyzeAudioUrl]);

  /**
   * Classify instrument based on spectral features (rule-based fallback)
   */
  const classifyFromFeatures = useCallback((features: SpectralFeatures): {
    category: string;
    confidence: number;
    possibleInstruments: string[];
  } => {
    const { spectralCentroid, spectralRolloff, zeroCrossingRate, harmonicity, pitchRange } = features;
    
    // Bass detection: low centroid, low rolloff
    if (spectralCentroid < 500 && spectralRolloff < 2000) {
      return {
        category: 'bass',
        confidence: 0.8,
        possibleInstruments: pitchRange.high < 200 
          ? ['sub_bass', 'log_drum'] 
          : ['synth_bass', 'bass_guitar']
      };
    }
    
    // Percussion detection: high ZCR, transient-heavy
    if (zeroCrossingRate > 0.15 && harmonicity < 0.3) {
      return {
        category: 'percussion',
        confidence: 0.75,
        possibleInstruments: spectralCentroid > 3000 
          ? ['shakers', 'claps'] 
          : ['kick', 'congas', 'bongos']
      };
    }
    
    // Keys/Piano detection: high harmonicity, mid-range centroid
    if (harmonicity > 0.6 && spectralCentroid > 500 && spectralCentroid < 3000) {
      return {
        category: 'keys',
        confidence: 0.7,
        possibleInstruments: spectralCentroid > 1500 
          ? ['acoustic_piano', 'kalimba'] 
          : ['rhodes']
      };
    }
    
    // Brass detection: high harmonicity, mid-high centroid, sustained
    if (harmonicity > 0.5 && spectralCentroid > 1000 && spectralCentroid < 4000 && zeroCrossingRate < 0.1) {
      return {
        category: 'brass',
        confidence: 0.65,
        possibleInstruments: spectralCentroid > 2000 ? ['trumpet'] : ['saxophone']
      };
    }
    
    // Synth detection: very high harmonicity, variable centroid
    if (harmonicity > 0.7 && zeroCrossingRate < 0.05) {
      return {
        category: 'synth',
        confidence: 0.6,
        possibleInstruments: spectralCentroid < 1000 
          ? ['synth_pad'] 
          : ['synth_lead', 'synth_pluck']
      };
    }
    
    // Strings detection: mid-high harmonicity, variable
    if (harmonicity > 0.4 && spectralCentroid > 800 && spectralCentroid < 3500) {
      return {
        category: 'strings',
        confidence: 0.55,
        possibleInstruments: zeroCrossingRate > 0.08 
          ? ['guitar_electric'] 
          : ['guitar_acoustic', 'violin']
      };
    }
    
    // Vocal detection: specific spectral characteristics
    if (spectralCentroid > 300 && spectralCentroid < 5000 && harmonicity > 0.3) {
      return {
        category: 'vocal',
        confidence: 0.5,
        possibleInstruments: ['vocals', 'vocal_chops']
      };
    }
    
    // Default
    return {
      category: 'other',
      confidence: 0.3,
      possibleInstruments: []
    };
  }, []);

  return {
    isAnalyzing,
    progress,
    analyzeBuffer,
    analyzeAudioUrl,
    analyzeStems,
    classifyFromFeatures
  };
}
