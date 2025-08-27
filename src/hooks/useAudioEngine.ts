import { useState, useEffect, useCallback, useRef } from 'react';
import type { DawProjectData, DawTrack, AudioLevels, MidiNote } from '@/types/daw';
import { useAudioEffects } from './useAudioEffects';

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
  const [audioLevels, setAudioLevels] = useState<Map<string, AudioLevels>>(new Map());
  const [masterLevels, setMasterLevels] = useState<AudioLevels>({ left: 0, right: 0, peak: 0 });
  
  // Audio context and nodes
  const audioContextRef = useRef<AudioContext | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);
  const trackGainsRef = useRef<Map<string, GainNode>>(new Map());
  const playbackIntervalRef = useRef<number | null>(null);
  const oscillatorsRef = useRef<Map<string, OscillatorNode>>(new Map());
  const analyzerRef = useRef<AnalyserNode | null>(null);
  const trackAnalyzers = useRef<Map<string, AnalyserNode>>(new Map());

  // Initialize effects system
  const effects = useAudioEffects(audioContextRef.current);

  // Initialize Web Audio API
  useEffect(() => {
    const initAudioContext = async () => {
      try {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        masterGainRef.current = audioContextRef.current.createGain();
        
        // Create master analyzer
        analyzerRef.current = audioContextRef.current.createAnalyser();
        analyzerRef.current.fftSize = 256;
        
        masterGainRef.current.connect(analyzerRef.current);
        analyzerRef.current.connect(audioContextRef.current.destination);
        
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

  // Setup track gains and effects when project data changes
  useEffect(() => {
    if (!audioContextRef.current || !masterGainRef.current || !projectData) return;

    // Clear existing track gains and analyzers
    trackGainsRef.current.clear();
    trackAnalyzers.current.clear();

    // Create gain nodes and analyzers for each track
    projectData.tracks.forEach(async (track) => {
      const gainNode = audioContextRef.current!.createGain();
      const analyzer = audioContextRef.current!.createAnalyser();
      
      analyzer.fftSize = 256;
      gainNode.gain.value = track.mixer?.volume || 0.8;
      
      // Initialize effects chain for the track
      const effectsChain = await effects.initializeEffectsChain(
        track.id, 
        track.mixer?.effects || [], 
        gainNode
      );
      
      if (effectsChain) {
        // Connect effects output to analyzer then master
        effectsChain.outputGain.connect(analyzer);
        analyzer.connect(masterGainRef.current!);
      } else {
        // Fallback: direct connection
        gainNode.connect(analyzer);
        analyzer.connect(masterGainRef.current!);
      }
      
      trackGainsRef.current.set(track.id, gainNode);
      trackAnalyzers.current.set(track.id, analyzer);
    });
  }, [projectData, effects]);

  // Audio level monitoring
  useEffect(() => {
    if (!isPlaying || !analyzerRef.current) return;

    const updateLevels = () => {
      // Update master levels
      const bufferLength = analyzerRef.current!.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      analyzerRef.current!.getByteFrequencyData(dataArray);
      
      const average = dataArray.reduce((sum, value) => sum + value, 0) / bufferLength;
      const peak = Math.max(...dataArray);
      
      setMasterLevels({
        left: (average / 255) * 100,
        right: (average / 255) * 100,
        peak: (peak / 255) * 100
      });
      
      // Update track levels
      const newTrackLevels = new Map();
      trackAnalyzers.current.forEach((analyzer, trackId) => {
        const trackData = new Uint8Array(analyzer.frequencyBinCount);
        analyzer.getByteFrequencyData(trackData);
        const trackAvg = trackData.reduce((sum, value) => sum + value, 0) / trackData.length;
        const trackPeak = Math.max(...trackData);
        
        newTrackLevels.set(trackId, {
          left: (trackAvg / 255) * 100,
          right: (trackAvg / 255) * 100,
          peak: (trackPeak / 255) * 100
        });
      });
      
      setAudioLevels(newTrackLevels);
    };

    const levelInterval = setInterval(updateLevels, 50);
    return () => clearInterval(levelInterval);
  }, [isPlaying]);

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

  const playNote = useCallback((pitch: number, velocity: number = 80, duration: number = 1) => {
    if (!audioContextRef.current || !masterGainRef.current) return;

    const ctx = audioContextRef.current;
    const frequency = 440 * Math.pow(2, (pitch - 69) / 12); // Convert MIDI note to frequency
    
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    oscillator.type = 'sine';
    oscillator.frequency.value = frequency;
    
    gainNode.gain.value = (velocity / 127) * 0.3; // Convert velocity to gain
    
    oscillator.connect(gainNode);
    gainNode.connect(masterGainRef.current);
    
    oscillator.start();
    oscillator.stop(ctx.currentTime + duration);
    
    const noteId = `note_${Date.now()}_${pitch}`;
    oscillatorsRef.current.set(noteId, oscillator);
    
    // Clean up after note ends
    setTimeout(() => {
      oscillatorsRef.current.delete(noteId);
    }, duration * 1000 + 100);
  }, []);

  const playClip = useCallback((notes: MidiNote[], startTime: number = 0) => {
    if (!audioContextRef.current) return;

    notes.forEach(note => {
      setTimeout(() => {
        playNote(note.pitch, note.velocity, note.duration);
      }, (note.startTime - startTime) * 1000);
    });
  }, [playNote]);

  const getAudioContext = useCallback(() => audioContextRef.current, []);

  const addTrackEffect = useCallback(async (trackId: string, effectType: any) => {
    const trackGain = trackGainsRef.current.get(trackId);
    if (trackGain) {
      await effects.addEffect(trackId, effectType, trackGain);
    }
  }, [effects]);

  const removeTrackEffect = useCallback((trackId: string, effectId: string) => {
    effects.removeEffect(trackId, effectId);
  }, [effects]);

  const updateEffectParam = useCallback((trackId: string, effectId: string, paramName: string, value: any) => {
    effects.updateEffectParam(trackId, effectId, paramName, value);
  }, [effects]);

  const getTrackEffects = useCallback((trackId: string) => {
    const chain = effects.getEffectsChain(trackId);
    return chain?.effects || [];
  }, [effects]);

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
    playNote,
    playClip,
    getAudioContext,
    audioLevels,
    masterLevels,
    addTrackEffect,
    removeTrackEffect,
    updateEffectParam,
    getTrackEffects,
  };
}