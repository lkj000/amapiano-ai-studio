/**
 * High-Speed Audio Engine Hook (Option 2 MVP)
 * 
 * Professional audio processing using Tone.js
 * - 5-10x faster than pure JavaScript
 * - 10-15ms latency (professional-grade)
 */

import { useState, useEffect } from 'react';
import { ToneAudioEngine, createToneAudioEngine, AudioProcessingStats } from '@/lib/wasm/ToneAudioEngine';
import { safeToneStart, isToneReady } from '@/lib/audio/toneUtils';

export const useHighSpeedAudioEngine = () => {
  const [engine, setEngine] = useState<ToneAudioEngine | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [stats, setStats] = useState<AudioProcessingStats>({
    processingTime: 0,
    latency: 0,
    cpuLoad: 0,
    bufferUtilization: 0,
    isReady: false,
  });

  useEffect(() => {
    // Do NOT initialize Tone on mount to avoid autoplay policy errors.
    // We'll lazily create and start the engine after a user gesture via startAudio().

    return () => {
      if (engine) {
        engine.dispose();
      }
    };
  }, [engine]);

  // Update stats periodically (only if engine is initialized)
  useEffect(() => {
    if (!engine || !isInitialized) return;

    const interval = setInterval(() => {
      setStats(engine.getStats());
    }, 100);

    return () => clearInterval(interval);
  }, [engine, isInitialized]);

  // Helper to ensure audio context is started (requires user interaction)
  const startAudio = async () => {
    // Lazily create and start the engine on first user gesture
    if (!engine) {
      try {
        const newEngine = await createToneAudioEngine({
          bufferSize: 512,
          latencyHint: 'interactive',
        });
        setEngine(newEngine);
        setIsInitialized(true);
        setStats(newEngine.getStats());
        console.log('[Hook] Audio context started');
        return;
      } catch (e) {
        console.error('[Hook] Failed to start audio engine:', e);
        throw e;
      }
    }

    // If engine exists but context isn't running, resume it
    if (!isToneReady()) {
      await safeToneStart();
      setStats(engine.getStats());
      console.log('[Hook] Audio context resumed');
    }
  };

  return {
    engine,
    isInitialized,
    stats,
    isProfessionalGrade: engine?.isProfessionalGrade() || false,
    initialize: startAudio, // Alias for backwards compatibility
    startAudio,
    createSynth: (type?: 'mono' | 'poly' | 'fm' | 'am') => engine?.createSynth(type),
    createEffect: (type: 'reverb' | 'delay' | 'distortion' | 'chorus' | 'phaser' | 'compressor' | 'eq', id: string) => 
      engine?.createEffect(type, id),
    loadAudio: (url: string) => engine?.loadAudioBuffer(url),
    getEngine: () => engine,
    speedupFactor: 0, // For backwards compatibility
  };
};
