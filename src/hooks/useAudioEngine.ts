import { useState, useEffect, useCallback, useRef } from 'react';
import type { DawProjectData, DawTrack } from '@/types/daw';

export interface AudioEngineState {
  isPlaying: boolean;
  currentTime: number;
  isLooping: boolean;
}

export interface AudioEngineControls {
  play: () => void;
  pause: () => void;
  stop: () => void;
  setCurrentTime: (time: number | ((prev: number) => number)) => void;
  setIsLooping: (looping: boolean) => void;
  setBpm: (bpm: number) => void;
  setMasterVolume: (volume: number) => void;
  setTrackVolume: (trackId: string, volume: number) => void;
}

export function useAudioEngine(projectData: DawProjectData | null) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [isLooping, setIsLooping] = useState(false);
  
  // Audio context and nodes
  const audioContextRef = useRef<AudioContext | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);
  const trackGainsRef = useRef<Map<string, GainNode>>(new Map());
  const playbackIntervalRef = useRef<number | null>(null);
  const oscillatorsRef = useRef<Map<string, OscillatorNode>>(new Map());

  // Initialize Web Audio API
  useEffect(() => {
    const initAudioContext = async () => {
      try {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        masterGainRef.current = audioContextRef.current.createGain();
        masterGainRef.current.connect(audioContextRef.current.destination);
        
        if (projectData) {
          masterGainRef.current.gain.value = projectData.masterVolume || 0.8;
        }
      } catch (error) {
        console.error('Failed to initialize audio context:', error);
      }
    };

    initAudioContext();

    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  // Setup track gains when project data changes
  useEffect(() => {
    if (!audioContextRef.current || !masterGainRef.current || !projectData) return;

    // Clear existing track gains
    trackGainsRef.current.clear();

    // Create gain nodes for each track
    projectData.tracks.forEach((track) => {
      const gainNode = audioContextRef.current!.createGain();
      gainNode.connect(masterGainRef.current!);
      gainNode.gain.value = track.mixer?.volume || 0.8;
      trackGainsRef.current.set(track.id, gainNode);
    });
  }, [projectData]);

  const play = useCallback(() => {
    if (!audioContextRef.current) return;
    
    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }

    setIsPlaying(true);
    
    // Start playback timer
    playbackIntervalRef.current = window.setInterval(() => {
      setCurrentTime(prev => {
        const bpm = projectData?.bpm || 120;
        const increment = (bpm / 60) * 0.1; // 100ms updates
        return prev + increment;
      });
    }, 100);

    // Generate simple test tones for tracks (placeholder for real audio)
    if (projectData) {
      projectData.tracks.forEach((track, index) => {
        if (!track.mixer?.isMuted) {
          const oscillator = audioContextRef.current!.createOscillator();
          const gainNode = trackGainsRef.current.get(track.id);
          
          if (gainNode) {
            oscillator.connect(gainNode);
            oscillator.frequency.value = 200 + (index * 100); // Different frequency per track
            oscillator.type = track.type === 'midi' ? 'sine' : 'sawtooth';
            oscillator.start();
            oscillatorsRef.current.set(track.id, oscillator);
          }
        }
      });
    }
  }, [projectData]);

  const pause = useCallback(() => {
    setIsPlaying(false);
    
    if (playbackIntervalRef.current) {
      clearInterval(playbackIntervalRef.current);
      playbackIntervalRef.current = null;
    }

    // Stop all oscillators
    oscillatorsRef.current.forEach((oscillator) => {
      try {
        oscillator.stop();
      } catch (e) {
        // Oscillator might already be stopped
      }
    });
    oscillatorsRef.current.clear();
  }, []);

  const stop = useCallback(() => {
    pause();
    setCurrentTime(0);
  }, [pause]);

  const setBpm = useCallback((bpm: number) => {
    // In a real implementation, this would adjust the audio engine's tempo
    console.log(`Setting BPM to ${bpm}`);
  }, []);

  const setMasterVolume = useCallback((volume: number) => {
    if (masterGainRef.current) {
      masterGainRef.current.gain.value = volume;
    }
  }, []);

  const setTrackVolume = useCallback((trackId: string, volume: number) => {
    const gainNode = trackGainsRef.current.get(trackId);
    if (gainNode) {
      gainNode.gain.value = volume;
    }
  }, []);

  const handleSetCurrentTime = useCallback((time: number | ((prev: number) => number)) => {
    if (typeof time === 'function') {
      setCurrentTime(time);
    } else {
      setCurrentTime(time);
    }
  }, []);

  const handleSetIsLooping = useCallback((looping: boolean) => {
    setIsLooping(looping);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (playbackIntervalRef.current) {
        clearInterval(playbackIntervalRef.current);
      }
      oscillatorsRef.current.forEach((oscillator) => {
        try {
          oscillator.stop();
        } catch (e) {
          // Oscillator might already be stopped
        }
      });
    };
  }, []);

  return {
    isPlaying,
    currentTime,
    isLooping,
    setCurrentTime: handleSetCurrentTime,
    setIsLooping: handleSetIsLooping,
    play,
    pause,
    stop,
    setBpm,
    setMasterVolume,
    setTrackVolume,
  };
}