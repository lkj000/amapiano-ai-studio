import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

interface TimeStretchResult {
  stretchedBuffer: AudioBuffer;
  originalTempo: number;
  targetTempo: number;
  stretchRatio: number;
}

export function useAutoTimeStretch() {
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const detectTempo = useCallback((audioBuffer: AudioBuffer): number => {
    // Simple tempo detection using onset detection
    const channelData = audioBuffer.getChannelData(0);
    const sampleRate = audioBuffer.sampleRate;
    
    // Analyze energy in frames
    const frameSize = 512;
    const hopSize = 256;
    const onsets: number[] = [];
    
    for (let i = 0; i < channelData.length - frameSize; i += hopSize) {
      let energy = 0;
      for (let j = 0; j < frameSize; j++) {
        energy += Math.abs(channelData[i + j]);
      }
      
      // Detect onset if energy spike
      if (onsets.length > 0) {
        const prevEnergy = onsets[onsets.length - 1];
        if (energy > prevEnergy * 1.5) {
          onsets.push(i / sampleRate);
        }
      } else if (energy > 0.01) {
        onsets.push(i / sampleRate);
      }
    }
    
    // Calculate average interval between onsets
    if (onsets.length < 4) return 120; // Default
    
    const intervals: number[] = [];
    for (let i = 1; i < onsets.length; i++) {
      intervals.push(onsets[i] - onsets[i - 1]);
    }
    
    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const bpm = 60 / avgInterval;
    
    // Clamp to reasonable Amapiano range
    return Math.max(108, Math.min(118, Math.round(bpm)));
  }, []);

  const timeStretch = useCallback(async (
    audioBuffer: AudioBuffer,
    targetTempo: number,
    audioContext: AudioContext
  ): Promise<TimeStretchResult> => {
    setIsProcessing(true);
    
    try {
      const originalTempo = detectTempo(audioBuffer);
      const stretchRatio = originalTempo / targetTempo;
      
      // Simple time-domain stretching (phase vocoder would be better)
      const channels = audioBuffer.numberOfChannels;
      const sampleRate = audioBuffer.sampleRate;
      const newLength = Math.floor(audioBuffer.length * stretchRatio);
      
      const stretchedBuffer = audioContext.createBuffer(
        channels,
        newLength,
        sampleRate
      );
      
      for (let channel = 0; channel < channels; channel++) {
        const inputData = audioBuffer.getChannelData(channel);
        const outputData = stretchedBuffer.getChannelData(channel);
        
        for (let i = 0; i < newLength; i++) {
          const sourceIndex = i / stretchRatio;
          const index1 = Math.floor(sourceIndex);
          const index2 = Math.min(index1 + 1, inputData.length - 1);
          const fraction = sourceIndex - index1;
          
          // Linear interpolation
          outputData[i] = inputData[index1] * (1 - fraction) + inputData[index2] * fraction;
        }
      }
      
      toast({
        title: "Time-Stretch Complete",
        description: `Adjusted from ${originalTempo} to ${targetTempo} BPM`,
      });
      
      return {
        stretchedBuffer,
        originalTempo,
        targetTempo,
        stretchRatio
      };
    } finally {
      setIsProcessing(false);
    }
  }, [detectTempo, toast]);

  return {
    timeStretch,
    detectTempo,
    isProcessing
  };
}
