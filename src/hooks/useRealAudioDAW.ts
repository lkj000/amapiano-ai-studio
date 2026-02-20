/**
 * useRealAudioDAW Hook
 * Real audio playback integration for the DAW
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import * as Tone from 'tone';
import { RealAudioEngine, getAudioEngine } from '@/lib/audio/RealAudioEngine';
import { PRODUCER_DNA_PRESETS, ProducerDNAProfile } from '@/lib/audio/ProducerDNA';

export interface DAWState {
  isPlaying: boolean;
  isRecording: boolean;
  currentStep: number;
  currentBar: number;
  bpm: number;
  isInitialized: boolean;
  producerProfile: ProducerDNAProfile;
  meterLevel: number;
  lastRecording: Blob | null;
}

export function useRealAudioDAW() {
  const engineRef = useRef<RealAudioEngine | null>(null);
  const animationRef = useRef<number | null>(null);
  
  const [state, setState] = useState<DAWState>({
    isPlaying: false,
    isRecording: false,
    currentStep: 0,
    currentBar: 0,
    bpm: 113,
    isInitialized: false,
    producerProfile: PRODUCER_DNA_PRESETS[0],
    meterLevel: -60,
    lastRecording: null,
  });
  
  // Defer engine initialization until user gesture (audio-started event from AudioStartGate)
  useEffect(() => {
    const engine = getAudioEngine();
    engineRef.current = engine;
    
    const initOnGesture = async () => {
      await engine.initialize();
      engine.createDefaultTracks();
      engine.createDefaultPattern();
      
      engine.onStep((step, bar) => {
        setState(prev => ({ ...prev, currentStep: step, currentBar: bar }));
      });
      
      engine.onPlayback((isPlaying) => {
        setState(prev => ({ ...prev, isPlaying }));
      });
      
      engine.onRecording((isRecording) => {
        setState(prev => ({ ...prev, isRecording }));
      });
      
      setState(prev => ({ 
        ...prev, 
        isInitialized: true,
        bpm: engine.tempo,
      }));
    };
    
    // If audio was already started this session, init immediately
    if (sessionStorage.getItem('audioContextStarted') === 'true') {
      initOnGesture();
    } else {
      // Wait for user gesture via AudioStartGate
      window.addEventListener('audio-started', initOnGesture, { once: true });
    }
    
    // Meter animation loop
    const updateMeter = () => {
      if (engineRef.current?.playing) {
        const level = engineRef.current.getMeterLevel();
        setState(prev => ({ ...prev, meterLevel: level }));
      }
      animationRef.current = requestAnimationFrame(updateMeter);
    };
    animationRef.current = requestAnimationFrame(updateMeter);
    
    return () => {
      window.removeEventListener('audio-started', initOnGesture);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      engine.dispose();
    };
  }, []);
  
  const play = useCallback(async () => {
    if (!engineRef.current) return;
    
    // Ensure audio context is started (requires user gesture)
    await Tone.start();
    engineRef.current.play();
  }, []);
  
  const pause = useCallback(() => {
    engineRef.current?.pause();
  }, []);
  
  const stop = useCallback(() => {
    engineRef.current?.stop();
  }, []);
  
  const toggleRecording = useCallback(async () => {
    if (!engineRef.current) return;
    
    const recording = await engineRef.current.toggleRecording();
    if (recording) {
      setState(prev => ({ ...prev, lastRecording: recording }));
      
      // Auto-download the recording
      const url = URL.createObjectURL(recording);
      const a = document.createElement('a');
      a.href = url;
      a.download = `amapiano-recording-${Date.now()}.webm`;
      a.click();
      URL.revokeObjectURL(url);
    }
  }, []);
  
  const seek = useCallback((bar: number, step: number = 0) => {
    engineRef.current?.seek(bar, step);
  }, []);
  
  const setBPM = useCallback((bpm: number) => {
    if (engineRef.current) {
      engineRef.current.setBPM(bpm);
      setState(prev => ({ ...prev, bpm }));
    }
  }, []);
  
  const setProducerProfile = useCallback((profileId: string) => {
    const profile = PRODUCER_DNA_PRESETS.find(p => p.id === profileId);
    if (profile && engineRef.current) {
      engineRef.current.setProducerProfile(profileId);
      setState(prev => ({ 
        ...prev, 
        producerProfile: profile,
        bpm: profile.bpmRange.sweet,
      }));
    }
  }, []);
  
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
  
  const getWaveformData = useCallback(() => {
    return engineRef.current?.getWaveformData() || new Float32Array(256);
  }, []);
  
  const getTracks = useCallback(() => {
    return engineRef.current?.getAllTracks() || [];
  }, []);
  
  const getPattern = useCallback(() => {
    return engineRef.current?.pattern;
  }, []);
  
  return {
    ...state,
    play,
    pause,
    stop,
    seek,
    toggleRecording,
    setBPM,
    setProducerProfile,
    toggleStep,
    setTrackVolume,
    setTrackPan,
    setTrackMuted,
    setTrackSolo,
    getWaveformData,
    getTracks,
    getPattern,
    engine: engineRef.current,
  };
}
