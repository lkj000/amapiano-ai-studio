import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface StudyAudioPair {
  id: string;
  user_id: string;
  region: string;
  baseline_url: string;
  amapianorized_url: string;
  baseline_metrics: AudioQualityMetrics;
  amapianorized_metrics: AudioQualityMetrics;
  created_at: string;
}

export interface AudioQualityMetrics {
  snr: number;
  fadScore: number;
  spectralConvergence: number;
  logSpectralDistance: number;
  peakLevel: number;
  rmsLevel: number;
  dynamicRange: number;
  crestFactor: number;
}

/**
 * Calculate audio quality metrics from an AudioBuffer
 */
export const calculateAudioMetrics = async (audioBuffer: AudioBuffer): Promise<AudioQualityMetrics> => {
  const channelData = audioBuffer.getChannelData(0);
  const samples = channelData.length;
  
  // Peak level
  let peak = 0;
  for (let i = 0; i < samples; i++) {
    const abs = Math.abs(channelData[i]);
    if (abs > peak) peak = abs;
  }
  const peakLevel = peak > 0 ? 20 * Math.log10(peak) : -Infinity;
  
  // RMS level
  let sumSquares = 0;
  for (let i = 0; i < samples; i++) {
    sumSquares += channelData[i] * channelData[i];
  }
  const rms = Math.sqrt(sumSquares / samples);
  const rmsLevel = rms > 0 ? 20 * Math.log10(rms) : -Infinity;
  
  // Dynamic range (simplified)
  const dynamicRange = peakLevel - rmsLevel;
  
  // Crest factor
  const crestFactor = peak / rms;
  
  // SNR estimation (simplified - comparing signal to high-frequency noise)
  const fftSize = 2048;
  const hopSize = 512;
  const numFrames = Math.floor((samples - fftSize) / hopSize);
  
  let totalEnergy = 0;
  let highFreqEnergy = 0;
  
  for (let frame = 0; frame < numFrames; frame++) {
    const start = frame * hopSize;
    for (let i = 0; i < fftSize; i++) {
      const sample = channelData[start + i] || 0;
      totalEnergy += sample * sample;
      
      // High frequency estimation (simple high-pass approximation)
      if (i > 0) {
        const diff = sample - channelData[start + i - 1];
        highFreqEnergy += diff * diff;
      }
    }
  }
  
  const snr = highFreqEnergy > 0 ? 10 * Math.log10(totalEnergy / highFreqEnergy) : 60;
  
  // Spectral metrics (simplified)
  const spectralConvergence = calculateSpectralConvergence(channelData);
  const logSpectralDistance = calculateLogSpectralDistance(channelData);
  
  // FAD score (simplified approximation)
  const fadScore = calculateSimplifiedFAD(channelData);
  
  return {
    snr: Math.max(0, Math.min(100, snr)),
    fadScore,
    spectralConvergence,
    logSpectralDistance,
    peakLevel: isFinite(peakLevel) ? peakLevel : -60,
    rmsLevel: isFinite(rmsLevel) ? rmsLevel : -60,
    dynamicRange: isFinite(dynamicRange) ? dynamicRange : 0,
    crestFactor: isFinite(crestFactor) ? crestFactor : 1,
  };
};

function calculateSpectralConvergence(samples: Float32Array): number {
  // Simplified spectral convergence calculation
  const windowSize = 1024;
  const numWindows = Math.floor(samples.length / windowSize);
  
  if (numWindows < 2) return 0;
  
  let totalVariance = 0;
  
  for (let w = 1; w < numWindows; w++) {
    let diff = 0;
    for (let i = 0; i < windowSize; i++) {
      const curr = samples[w * windowSize + i];
      const prev = samples[(w - 1) * windowSize + i];
      diff += (curr - prev) * (curr - prev);
    }
    totalVariance += Math.sqrt(diff / windowSize);
  }
  
  return totalVariance / (numWindows - 1);
}

function calculateLogSpectralDistance(samples: Float32Array): number {
  // Simplified log spectral distance
  const windowSize = 512;
  const numWindows = Math.floor(samples.length / windowSize);
  
  if (numWindows < 1) return 0;
  
  let totalDistance = 0;
  
  for (let w = 0; w < numWindows; w++) {
    let energy = 0;
    for (let i = 0; i < windowSize; i++) {
      energy += samples[w * windowSize + i] * samples[w * windowSize + i];
    }
    const logEnergy = energy > 0 ? 10 * Math.log10(energy / windowSize) : -60;
    totalDistance += Math.abs(logEnergy);
  }
  
  return totalDistance / numWindows;
}

function calculateSimplifiedFAD(samples: Float32Array): number {
  // Simplified Fréchet Audio Distance approximation
  // Real FAD requires neural network embeddings
  const windowSize = 2048;
  const numWindows = Math.floor(samples.length / windowSize);
  
  if (numWindows < 2) return 0.5;
  
  // Calculate mean and variance of windowed energy
  const energies: number[] = [];
  
  for (let w = 0; w < numWindows; w++) {
    let energy = 0;
    for (let i = 0; i < windowSize; i++) {
      energy += samples[w * windowSize + i] * samples[w * windowSize + i];
    }
    energies.push(energy);
  }
  
  const mean = energies.reduce((a, b) => a + b, 0) / energies.length;
  const variance = energies.reduce((a, b) => a + (b - mean) * (b - mean), 0) / energies.length;
  
  // Normalize to 0-1 range
  const normalizedVariance = Math.sqrt(variance) / (mean + 1e-8);
  return Math.min(1, Math.max(0, normalizedVariance));
}

export const useUserStudyAudioPersistence = () => {
  const { toast } = useToast();

  /**
   * Upload audio blob to Supabase Storage and return public URL
   */
  const uploadAudioFile = useCallback(async (
    audioBlob: Blob,
    fileName: string
  ): Promise<string> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const filePath = `user-study/${user.id}/${Date.now()}_${fileName}`;
    
    const { data, error } = await supabase.storage
      .from('samples')
      .upload(filePath, audioBlob, {
        contentType: 'audio/wav',
        upsert: false,
      });

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
      .from('samples')
      .getPublicUrl(data.path);

    return publicUrl;
  }, []);

  /**
   * Save a study audio pair with quality metrics
   */
  const saveStudyPair = useCallback(async (
    region: string,
    baselineAudio: { blob: Blob; buffer: AudioBuffer },
    amapianorizedAudio: { blob: Blob; buffer: AudioBuffer }
  ) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Upload both audio files
      const [baselineUrl, amapianorizedUrl] = await Promise.all([
        uploadAudioFile(baselineAudio.blob, `baseline_${region}.wav`),
        uploadAudioFile(amapianorizedAudio.blob, `amapianorized_${region}.wav`),
      ]);

      // Calculate quality metrics for both
      const [baselineMetrics, amapianorizedMetrics] = await Promise.all([
        calculateAudioMetrics(baselineAudio.buffer),
        calculateAudioMetrics(amapianorizedAudio.buffer),
      ]);

      // Store in database (using generated_samples table for now)
      const { data, error } = await supabase
        .from('generated_samples')
        .insert([
          {
            user_id: user.id,
            sample_type: 'log_drum', // Using existing type for baseline
            sample_url: baselineUrl,
            metadata: JSON.parse(JSON.stringify({
              study_type: 'user_study_pair',
              pair_type: 'baseline',
              region,
              quality_metrics: baselineMetrics,
              paired_url: amapianorizedUrl,
            })),
            region,
          },
          {
            user_id: user.id,
            sample_type: 'percussion', // Using existing type for amapianorized
            sample_url: amapianorizedUrl,
            metadata: JSON.parse(JSON.stringify({
              study_type: 'user_study_pair',
              pair_type: 'amapianorized',
              region,
              quality_metrics: amapianorizedMetrics,
              paired_url: baselineUrl,
            })),
            region,
          },
        ])
        .select();

      if (error) throw error;

      toast({
        title: 'Study Pair Saved',
        description: `Audio pair for ${region} saved with quality metrics`,
      });

      return {
        baseline: { url: baselineUrl, metrics: baselineMetrics },
        amapianorized: { url: amapianorizedUrl, metrics: amapianorizedMetrics },
      };
    } catch (error) {
      console.error('[UserStudyAudioPersistence] Save failed:', error);
      toast({
        title: 'Save Failed',
        description: error instanceof Error ? error.message : 'Failed to save study pair',
        variant: 'destructive',
      });
      throw error;
    }
  }, [toast, uploadAudioFile]);

  /**
   * Load all study pairs for user study
   */
  const loadStudyPairs = useCallback(async (region?: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      let query = supabase
        .from('generated_samples')
        .select('*')
        .eq('user_id', user.id)
        .contains('metadata', { study_type: 'user_study_pair' })
        .order('created_at', { ascending: false });

      if (region) {
        query = query.eq('region', region);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Group into pairs
      const pairs: Map<string, StudyAudioPair> = new Map();
      
      data?.forEach((item: any) => {
        const metadata = item.metadata as any;
        const pairKey = `${item.region}_${item.created_at.slice(0, 16)}`;
        
        if (!pairs.has(pairKey)) {
          pairs.set(pairKey, {
            id: item.id,
            user_id: item.user_id,
            region: item.region,
            baseline_url: '',
            amapianorized_url: '',
            baseline_metrics: {} as AudioQualityMetrics,
            amapianorized_metrics: {} as AudioQualityMetrics,
            created_at: item.created_at,
          });
        }
        
        const pair = pairs.get(pairKey)!;
        if (metadata.pair_type === 'baseline') {
          pair.baseline_url = item.sample_url;
          pair.baseline_metrics = metadata.quality_metrics;
        } else {
          pair.amapianorized_url = item.sample_url;
          pair.amapianorized_metrics = metadata.quality_metrics;
        }
      });

      return Array.from(pairs.values()).filter(p => p.baseline_url && p.amapianorized_url);
    } catch (error) {
      console.error('[UserStudyAudioPersistence] Load failed:', error);
      toast({
        title: 'Load Failed',
        description: error instanceof Error ? error.message : 'Failed to load study pairs',
        variant: 'destructive',
      });
      throw error;
    }
  }, [toast]);

  /**
   * Convert AudioBuffer to WAV Blob
   */
  const audioBufferToWav = useCallback((buffer: AudioBuffer): Blob => {
    const numChannels = buffer.numberOfChannels;
    const sampleRate = buffer.sampleRate;
    const format = 1; // PCM
    const bitDepth = 16;
    
    const bytesPerSample = bitDepth / 8;
    const blockAlign = numChannels * bytesPerSample;
    
    const data = buffer.getChannelData(0);
    const samples = data.length;
    const dataLength = samples * blockAlign;
    
    const arrayBuffer = new ArrayBuffer(44 + dataLength);
    const view = new DataView(arrayBuffer);
    
    // WAV header
    const writeString = (offset: number, str: string) => {
      for (let i = 0; i < str.length; i++) {
        view.setUint8(offset + i, str.charCodeAt(i));
      }
    };
    
    writeString(0, 'RIFF');
    view.setUint32(4, 36 + dataLength, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, format, true);
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * blockAlign, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitDepth, true);
    writeString(36, 'data');
    view.setUint32(40, dataLength, true);
    
    // Audio data
    let offset = 44;
    for (let i = 0; i < samples; i++) {
      const sample = Math.max(-1, Math.min(1, data[i]));
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
      offset += bytesPerSample;
    }
    
    return new Blob([arrayBuffer], { type: 'audio/wav' });
  }, []);

  return {
    saveStudyPair,
    loadStudyPairs,
    uploadAudioFile,
    audioBufferToWav,
    calculateAudioMetrics,
  };
};
