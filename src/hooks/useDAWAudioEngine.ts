/**
 * DAW Audio Engine Hook
 * Bridges Zustand store with RealAudioEngine for synchronized state
 */

import { useEffect, useCallback, useRef } from 'react';
import * as Tone from 'tone';
import { useDAWStore } from '@/stores/dawStore';
import { RealAudioEngine, getAudioEngine } from '@/lib/audio/RealAudioEngine';
import { PRODUCER_DNA_PRESETS, ProducerDNAProfile } from '@/lib/audio/ProducerDNA';

export interface DAWAudioEngineState {
  isInitialized: boolean;
  isContextRunning: boolean;
  meterLevel: number;
  waveformData: Float32Array;
  producerProfile: ProducerDNAProfile;
}

export function useDAWAudioEngine() {
  const engineRef = useRef<RealAudioEngine | null>(null);
  const animationRef = useRef<number | null>(null);
  const meterLevelRef = useRef<number>(-60);
  const waveformDataRef = useRef<Float32Array>(new Float32Array(256));
  
  // Get store actions
  const setTransport = useDAWStore((s) => s.setTransport);
  const setCurrentPosition = useDAWStore((s) => s.setCurrentPosition);
  const play = useDAWStore((s) => s.play);
  const pause = useDAWStore((s) => s.pause);
  const stop = useDAWStore((s) => s.stop);
  const toggleRecord = useDAWStore((s) => s.toggleRecord);
  
  // Get store state
  const transport = useDAWStore((s) => s.transport);
  const project = useDAWStore((s) => s.project);

  // Initialize engine
  useEffect(() => {
    const engine = getAudioEngine();
    engineRef.current = engine;

    const init = async () => {
      await engine.initialize();
      engine.createDefaultTracks();
      engine.createDefaultPattern();

      // Sync engine callbacks to store
      engine.onStep((step, bar) => {
        setCurrentPosition(step, bar);
      });

      engine.onPlayback((isPlaying) => {
        if (isPlaying) {
          play();
        } else {
          pause();
        }
      });

      engine.onRecording((isRecording) => {
        setTransport({ isRecording });
      });

      setTransport({ bpm: engine.tempo });
    };

    init();

    // Meter animation loop
    const updateMeter = () => {
      if (engineRef.current) {
        meterLevelRef.current = engineRef.current.getMeterLevel();
        waveformDataRef.current = engineRef.current.getWaveformData();
      }
      animationRef.current = requestAnimationFrame(updateMeter);
    };
    animationRef.current = requestAnimationFrame(updateMeter);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      engine.dispose();
    };
  }, [setTransport, setCurrentPosition, play, pause]);

  // Sync BPM changes to engine
  useEffect(() => {
    if (engineRef.current && engineRef.current.tempo !== transport.bpm) {
      engineRef.current.setBPM(transport.bpm);
    }
  }, [transport.bpm]);

  // Engine control functions
  const startPlayback = useCallback(async () => {
    if (!engineRef.current) return;
    
    // Ensure audio context is started (requires user gesture)
    await Tone.start();
    engineRef.current.play();
  }, []);

  const pausePlayback = useCallback(() => {
    engineRef.current?.pause();
  }, []);

  const stopPlayback = useCallback(() => {
    engineRef.current?.stop();
    stop();
  }, [stop]);

  const startRecording = useCallback(async () => {
    if (!engineRef.current) return null;
    
    await Tone.start();
    const recording = await engineRef.current.toggleRecording();
    
    if (recording) {
      // Auto-download the recording
      const url = URL.createObjectURL(recording);
      const a = document.createElement('a');
      a.href = url;
      a.download = `amapiano-recording-${Date.now()}.webm`;
      a.click();
      URL.revokeObjectURL(url);
      return recording;
    }
    
    return null;
  }, []);

  const seek = useCallback((bar: number, step: number = 0) => {
    engineRef.current?.seek(bar, step);
  }, []);

  const setBPM = useCallback((bpm: number) => {
    if (engineRef.current) {
      engineRef.current.setBPM(bpm);
      setTransport({ bpm });
    }
  }, [setTransport]);

  const setProducerProfile = useCallback((profileId: string) => {
    const profile = PRODUCER_DNA_PRESETS.find((p) => p.id === profileId);
    if (profile && engineRef.current) {
      engineRef.current.setProducerProfile(profileId);
      setTransport({ bpm: profile.bpmRange.sweet });
    }
  }, [setTransport]);

  const toggleStep = useCallback((trackId: string, stepIndex: number) => {
    engineRef.current?.toggleStep(trackId, stepIndex);
  }, []);

  const setTrackVolume = useCallback((trackId: string, volume: number) => {
    engineRef.current?.setTrackVolume(trackId, volume);
  }, []);

  const setTrackPan = useCallback((trackId: string, pan: number) => {
    engineRef.current?.setTrackPan(trackId, pan);
  }, []);

  const setTrackMuted = useCallback((trackId: string, muted: boolean) => {
    engineRef.current?.setTrackMuted(trackId, muted);
  }, []);

  const setTrackSolo = useCallback((trackId: string, solo: boolean) => {
    engineRef.current?.setTrackSolo(trackId, solo);
  }, []);

  const getMeterLevel = useCallback(() => meterLevelRef.current, []);
  
  const getWaveformData = useCallback(() => waveformDataRef.current, []);

  const getTracks = useCallback(() => {
    return engineRef.current?.getAllTracks() || [];
  }, []);

  const getPattern = useCallback(() => {
    return engineRef.current?.pattern;
  }, []);

  return {
    // State
    isInitialized: !!engineRef.current?.initialized,
    isContextRunning: Tone.context?.state === 'running',
    
    // Transport controls
    startPlayback,
    pausePlayback,
    stopPlayback,
    startRecording,
    seek,
    setBPM,
    
    // Track controls
    toggleStep,
    setTrackVolume,
    setTrackPan,
    setTrackMuted,
    setTrackSolo,
    
    // Producer DNA
    setProducerProfile,
    
    // Metering
    getMeterLevel,
    getWaveformData,
    
    // Data
    getTracks,
    getPattern,
    
    // Raw engine access (for advanced use)
    engine: engineRef.current,
  };
}
