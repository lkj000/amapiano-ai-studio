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
  currentStep: number;
  currentBar: number;
  bpm: number;
  isInitialized: boolean;
  producerProfile: ProducerDNAProfile;
  meterLevel: number;
}

export function useRealAudioDAW() {
  const engineRef = useRef<RealAudioEngine | null>(null);
  const animationRef = useRef<number | null>(null);
  
  const [state, setState] = useState<DAWState>({
    isPlaying: false,
    currentStep: 0,
    currentBar: 0,
    bpm: 113,
    isInitialized: false,
    producerProfile: PRODUCER_DNA_PRESETS[0],
    meterLevel: -60,
  });
  
  // Initialize engine
  useEffect(() => {
    const engine = getAudioEngine();
    engineRef.current = engine;
    
    const init = async () => {
      await engine.initialize();
      engine.createDefaultTracks();
      engine.createDefaultPattern();
      
      // Set up callbacks
      engine.onStep((step, bar) => {
        setState(prev => ({ ...prev, currentStep: step, currentBar: bar }));
      });
      
      engine.onPlayback((isPlaying) => {
        setState(prev => ({ ...prev, isPlaying }));
      });
      
      setState(prev => ({ 
        ...prev, 
        isInitialized: true,
        bpm: engine.tempo,
      }));
    };
    
    init();
    
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
