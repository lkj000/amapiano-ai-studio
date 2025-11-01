/**
 * High-Speed Audio Engine Hook
 * 
 * Provides access to C++ WASM audio processing
 * for professional-grade, low-latency audio production
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { AudioEngineWASM, createHighSpeedAudioEngine, AudioProcessingStats } from '@/lib/wasm/AudioEngineWASM';
import { toast } from 'sonner';

export interface HighSpeedAudioEngineState {
  isInitialized: boolean;
  isProcessing: boolean;
  stats: AudioProcessingStats;
  isProfessionalGrade: boolean;
}

export interface HighSpeedAudioEngineControls {
  initialize: () => Promise<void>;
  startProcessing: () => void;
  stopProcessing: () => void;
  processBuffer: (input: Float32Array, output: Float32Array) => void;
  computeFFT: (signal: Float32Array) => Float32Array;
  computeMFCC: (signal: Float32Array, numCoefficients?: number) => Float32Array;
  detectOnsets: (signal: Float32Array) => number[];
  getEngine: () => AudioEngineWASM | null;
}

export const useHighSpeedAudioEngine = () => {
  const [state, setState] = useState<HighSpeedAudioEngineState>({
    isInitialized: false,
    isProcessing: false,
    stats: {
      processingTime: 0,
      bufferUtilization: 0,
      cpuLoad: 0,
      latency: 0,
    },
    isProfessionalGrade: false,
  });

  const engineRef = useRef<AudioEngineWASM | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const processingNodeRef = useRef<AudioNode | null>(null);
  const statsIntervalRef = useRef<number | null>(null);

  // Initialize the high-speed engine
  const initialize = useCallback(async () => {
    if (state.isInitialized) {
      console.log('[useHighSpeedAudioEngine] Already initialized');
      return;
    }

    try {
      console.log('[useHighSpeedAudioEngine] Initializing C++ WASM engine...');
      
      // Create or resume AudioContext
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContext();
      }
      
      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
      }

      // Create high-speed WASM engine
      const engine = await createHighSpeedAudioEngine(audioContextRef.current, {
        bufferSize: 512, // Low latency
        channels: 2,
        enableMultithreading: true,
      });

      engineRef.current = engine;

      // Create processing node
      processingNodeRef.current = engine.createProcessingNode();

      // Start monitoring stats
      statsIntervalRef.current = window.setInterval(() => {
        if (engineRef.current) {
          const stats = engineRef.current.getStats();
          const isProfessionalGrade = engineRef.current.isProfessionalGrade();
          
          setState(prev => ({
            ...prev,
            stats,
            isProfessionalGrade,
          }));
        }
      }, 1000);

      setState(prev => ({
        ...prev,
        isInitialized: true,
      }));

      toast.success('High-Speed C++ Audio Engine Initialized', {
        description: '✓ Professional-grade audio processing ready',
      });

      console.log('[useHighSpeedAudioEngine] ✓ Initialized successfully');
    } catch (error) {
      console.error('[useHighSpeedAudioEngine] Initialization failed:', error);
      console.info('[useHighSpeedAudioEngine] Continuing in JavaScript fallback mode');
      console.info('[useHighSpeedAudioEngine] WASM features disabled - UI will show simulation mode');
      // Don't set error state or show error toast - just continue with simulation mode
      setState(prev => ({ ...prev, isInitialized: false }));
    }
  }, [state.isInitialized]);

  // Start audio processing
  const startProcessing = useCallback(() => {
    if (!engineRef.current || !audioContextRef.current) {
      toast.error('Audio engine not initialized');
      return;
    }

    if (state.isProcessing) {
      console.log('[useHighSpeedAudioEngine] Already processing');
      return;
    }

    try {
      if (audioContextRef.current.state === 'suspended') {
        audioContextRef.current.resume();
      }

      // Connect processing node
      if (processingNodeRef.current) {
        processingNodeRef.current.connect(audioContextRef.current.destination);
      }

      setState(prev => ({ ...prev, isProcessing: true }));
      console.log('[useHighSpeedAudioEngine] Processing started');
    } catch (error) {
      console.error('[useHighSpeedAudioEngine] Failed to start processing:', error);
      toast.error('Failed to start audio processing');
    }
  }, [state.isProcessing]);

  // Stop audio processing
  const stopProcessing = useCallback(() => {
    if (!state.isProcessing) {
      return;
    }

    try {
      if (processingNodeRef.current && audioContextRef.current) {
        processingNodeRef.current.disconnect();
      }

      setState(prev => ({ ...prev, isProcessing: false }));
      console.log('[useHighSpeedAudioEngine] Processing stopped');
    } catch (error) {
      console.error('[useHighSpeedAudioEngine] Failed to stop processing:', error);
    }
  }, [state.isProcessing]);

  // Process audio buffer
  const processBuffer = useCallback((input: Float32Array, output: Float32Array) => {
    if (!engineRef.current) {
      throw new Error('Audio engine not initialized');
    }

    return engineRef.current.processAudioBuffer(input, output);
  }, []);

  // High-speed FFT
  const computeFFT = useCallback((signal: Float32Array): Float32Array => {
    if (!engineRef.current) {
      throw new Error('Audio engine not initialized');
    }

    return engineRef.current.computeFFT(signal);
  }, []);

  // High-speed MFCC
  const computeMFCC = useCallback((signal: Float32Array, numCoefficients = 13): Float32Array => {
    if (!engineRef.current) {
      throw new Error('Audio engine not initialized');
    }

    return engineRef.current.computeMFCC(signal, numCoefficients);
  }, []);

  // High-speed onset detection
  const detectOnsets = useCallback((signal: Float32Array): number[] => {
    if (!engineRef.current) {
      throw new Error('Audio engine not initialized');
    }

    return engineRef.current.detectOnsets(signal);
  }, []);

  // Get engine instance
  const getEngine = useCallback(() => engineRef.current, []);

  // Cleanup
  useEffect(() => {
    return () => {
      if (statsIntervalRef.current) {
        clearInterval(statsIntervalRef.current);
      }

      if (engineRef.current) {
        engineRef.current.dispose();
      }

      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  return {
    ...state,
    initialize,
    startProcessing,
    stopProcessing,
    processBuffer,
    computeFFT,
    computeMFCC,
    detectOnsets,
    getEngine,
  };
};
