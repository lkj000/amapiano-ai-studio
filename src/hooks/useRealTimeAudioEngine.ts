import { useState, useEffect, useCallback } from 'react';
import { RealTimeAudioEngine, AudioPluginConfig, ProcessingStats } from '@/lib/dsp/RealTimeAudioEngine';

export function useRealTimeAudioEngine() {
  const [engine] = useState(() => new RealTimeAudioEngine());
  const [isInitialized, setIsInitialized] = useState(false);
  const [currentPlugin, setCurrentPlugin] = useState<AudioWorkletNode | null>(null);
  const [stats, setStats] = useState<ProcessingStats>({
    latency: 0,
    cpuLoad: 0,
    dropouts: 0,
    sampleRate: 44100
  });

  useEffect(() => {
    const initEngine = async () => {
      try {
        await engine.initialize();
        setIsInitialized(true);
      } catch (error) {
        console.error('Failed to initialize audio engine:', error);
      }
    };

    // Defer until user gesture to avoid AudioContext autoplay warning
    if (sessionStorage.getItem('audioContextStarted') === 'true') {
      initEngine();
    } else {
      const handler = () => initEngine();
      window.addEventListener('audio-started', handler, { once: true });
      // Cleanup listener if component unmounts before gesture
      return () => {
        window.removeEventListener('audio-started', handler);
        engine.dispose();
      };
    }

    // Update stats periodically
    const statsInterval = setInterval(() => {
      if (engine.initialized) {
        setStats(engine.getStats());
      }
    }, 1000);

    return () => {
      clearInterval(statsInterval);
      engine.dispose();
    };
  }, [engine]);

  const createPlugin = useCallback(async (config: AudioPluginConfig) => {
    if (!isInitialized) {
      throw new Error('Audio engine not initialized');
    }

    const plugin = await engine.createPlugin(config);
    setCurrentPlugin(plugin);
    return plugin;
  }, [engine, isInitialized]);

  const setParameter = useCallback((parameterId: string, value: number) => {
    engine.setParameter(parameterId, value);
  }, [engine]);

  const loadAudio = useCallback(async (url: string) => {
    return await engine.loadAudioBuffer(url);
  }, [engine]);

  const playAudio = useCallback((buffer: AudioBuffer) => {
    const source = engine.createBufferSource(buffer);
    source.start();
    return source;
  }, [engine]);

  const getFrequencyData = useCallback(() => {
    return engine.getFrequencyData();
  }, [engine]);

  const getTimeDomainData = useCallback(() => {
    return engine.getTimeDomainData();
  }, [engine]);

  return {
    engine,
    isInitialized,
    currentPlugin,
    stats,
    createPlugin,
    setParameter,
    loadAudio,
    playAudio,
    getFrequencyData,
    getTimeDomainData,
    audioContext: engine.context
  };
}
