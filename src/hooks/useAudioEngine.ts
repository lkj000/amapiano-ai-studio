import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import type { DawProjectData, DawTrack, AudioLevels, MidiNote } from '@/types/daw';

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
  const effectsRef = useRef<any>(null);
  const scheduledNotesRef = useRef<Set<string>>(new Set());
  const scheduledTimeoutsRef = useRef<Set<number>>(new Set());
  const nextNoteTimeRef = useRef<number>(0);
  const audioBufferSourcesRef = useRef<Map<string, AudioBufferSourceNode>>(new Map());
  const scheduledAudioClipsRef = useRef<Set<string>>(new Set());

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
        
        // Initialize effects system with the AudioContext
        const { createAudioEffectsSystem } = await import('./useAudioEffects');
        effectsRef.current = createAudioEffectsSystem(audioContextRef.current);
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

  // Derive a stable key that only changes when track structure changes (not mixer params)
  const trackStructureKey = useMemo(() => {
    if (!projectData?.tracks) return '';
    return projectData.tracks.map(t => {
      const clipKey = t.clips.map(c => ('audioUrl' in c ? (c as any).audioUrl : c.id)).join(',');
      return `${t.id}:${t.type}:${clipKey}`;
    }).join('|');
  }, [projectData?.tracks]);

  // Setup track gains and effects when track structure changes (NOT on mixer updates)
  useEffect(() => {
    if (!audioContextRef.current || !masterGainRef.current || !projectData || !effectsRef.current) {
      return;
    }

    // Clear existing track gains and analyzers
    trackGainsRef.current.clear();
    trackAnalyzers.current.clear();

    // Create gain nodes and analyzers for each track
    if (projectData.tracks && Array.isArray(projectData.tracks)) {
      projectData.tracks.forEach(async (track, index) => {
        try {
          const gainNode = audioContextRef.current!.createGain();
          const analyzer = audioContextRef.current!.createAnalyser();

          analyzer.fftSize = 256;
          gainNode.gain.value = track.mixer?.volume || 0.8;

          // Initialize effects chain for the track
          const trackEffects = track.mixer?.effects || [];
          
          if (trackEffects.length > 0) {
            const effectsChain = await effectsRef.current.initializeEffectsChain(
              track.id, 
              trackEffects, 
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
          } else {
            // Direct connection when no effects
            gainNode.connect(analyzer);
            analyzer.connect(masterGainRef.current!);
          }
          
          trackGainsRef.current.set(track.id, gainNode);
          trackAnalyzers.current.set(track.id, analyzer);
        } catch (error) {
          console.error(`AudioEngine: Error setting up track ${track.id}:`, error);
        }
      });
    }
  }, [trackStructureKey]);

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
    if (!audioContextRef.current) {
      return;
    }
    
    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }

    setIsPlaying(true);
    
    // Clear scheduled notes safely
    if (scheduledNotesRef.current) {
      scheduledNotesRef.current.clear();
    }
    if (nextNoteTimeRef.current !== undefined) {
      nextNoteTimeRef.current = 0;
    }
    
    // Start playback timer
    playbackIntervalRef.current = window.setInterval(() => {
      setCurrentTime(prev => {
        const bpm = projectData?.bpm || 120;
        const increment = (bpm / 60) * 0.1; // 100ms updates
        const newTime = prev + increment;
        const windowStart = prev;
        
        // Schedule MIDI notes from clips
        if (projectData && audioContextRef.current) {
          const ctx = audioContextRef.current;
          const scheduleAheadTime = 0.2; // Schedule 200ms ahead
          
          projectData.tracks.forEach((track) => {
            if (track.type === 'midi' && !track.mixer?.isMuted && track.clips) {
              track.clips.forEach((clip) => {
                if ('notes' in clip && clip.notes) {
                  clip.notes.forEach((note) => {
                    const absoluteNoteTime = clip.startTime + note.startTime;
                    const noteKey = `${clip.id}_${note.id}`;
                    
                    // Check if note should be scheduled
                    if (
                      scheduledNotesRef.current &&
                      absoluteNoteTime >= windowStart &&
                      absoluteNoteTime < newTime + scheduleAheadTime &&
                      !scheduledNotesRef.current.has(noteKey)
                    ) {
                      // Calculate when to play the note (in seconds)
                      const secsPerBeat = 60 / (bpm || 120);
                      const delaySec = Math.max(0, (absoluteNoteTime - newTime) * secsPerBeat);
                      const noteDuration = note.duration * secsPerBeat;

                      // Schedule with setTimeout so we can cancel on stop/pause
                      const timeoutId = window.setTimeout(() => {
                        const osc = synthNote(note.pitch, note.velocity, noteDuration, track.instrument || '', track.id);

                        // Cleanup tracking after note start
                        if (scheduledNotesRef.current) scheduledNotesRef.current.delete(noteKey);
                        if (scheduledTimeoutsRef.current) scheduledTimeoutsRef.current.delete(timeoutId);
                      }, delaySec * 1000);

                      if (scheduledNotesRef.current) {
                        scheduledNotesRef.current.add(noteKey);
                      }
                      if (scheduledTimeoutsRef.current) {
                        scheduledTimeoutsRef.current.add(timeoutId);
                      }
                    }
                  });
                }
              });
            }
            
            // Schedule audio clips
            if (track.type === 'audio' && !track.mixer?.isMuted && track.clips) {
              track.clips.forEach((clip) => {
                if ('audioUrl' in clip && clip.audioUrl) {
                  const clipKey = `${clip.id}`;
                  const clipStartTime = clip.startTime;
                  const clipEndTime = clipStartTime + clip.duration;
                  
                  // Check if audio clip should play now
                  if (
                    clipStartTime >= windowStart &&
                    clipStartTime < newTime &&
                    !scheduledAudioClipsRef.current.has(clipKey)
                  ) {
                    scheduledAudioClipsRef.current.add(clipKey);
                    
                    // Load and play audio
                    playAudioClip(clip.audioUrl, track.id, clipStartTime, newTime)
                      .catch(err => {
                        console.error('AudioEngine: Failed to play audio clip:', err);
                        scheduledAudioClipsRef.current.delete(clipKey);
                      });
                  }
                }
              });
            }
          });
        }
        
        return newTime;
      });
    }, 100);
  }, [projectData]);

  const pause = useCallback(() => {
    setIsPlaying(false);
    
    if (playbackIntervalRef.current) {
      clearInterval(playbackIntervalRef.current);
      playbackIntervalRef.current = null;
    }

    // Stop all oscillators and clear scheduled notes safely
    oscillatorsRef.current.forEach((oscillator) => {
      try {
        oscillator.stop();
      } catch (e) {
        // Oscillator might already be stopped
      }
    });
    oscillatorsRef.current.clear();
    
    if (scheduledNotesRef.current) {
      scheduledNotesRef.current.clear();
    }
    if (scheduledTimeoutsRef.current) {
      scheduledTimeoutsRef.current.forEach((id) => clearTimeout(id));
      scheduledTimeoutsRef.current.clear();
    }
    
    // Stop all audio buffer sources
    audioBufferSourcesRef.current.forEach((source) => {
      try {
        source.stop();
      } catch (e) {
        // Source might already be stopped
      }
    });
    audioBufferSourcesRef.current.clear();
    scheduledAudioClipsRef.current.clear();
  }, []);

  const stop = useCallback(() => {
    pause();
    setCurrentTime(0);
  }, [pause]);

  const setBpm = useCallback((bpm: number) => {
    // In a real implementation, this would adjust the audio engine's tempo
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

  const synthNote = useCallback((pitch: number, velocity: number, durationSec: number, instrument?: string, trackId?: string) => {
    if (!audioContextRef.current || !masterGainRef.current) return null;
    const ctx = audioContextRef.current;
    const frequency = 440 * Math.pow(2, (pitch - 69) / 12);

    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    const inst = instrument?.toLowerCase() || '';
    if (inst.includes('drum') || inst.includes('log')) {
      oscillator.type = 'square';
      gainNode.gain.setValueAtTime((velocity / 127) * 0.4, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + Math.min(durationSec, 0.1));
    } else if (inst.includes('bass')) {
      oscillator.type = 'sawtooth';
      gainNode.gain.value = (velocity / 127) * 0.35;
    } else if (inst.includes('piano')) {
      oscillator.type = 'triangle';
      gainNode.gain.value = (velocity / 127) * 0.25;
    } else if (inst.includes('vocal') || inst.includes('sampler')) {
      oscillator.type = 'sine';
      gainNode.gain.value = (velocity / 127) * 0.3;
    } else {
      oscillator.type = 'sine';
      gainNode.gain.value = (velocity / 127) * 0.3;
    }

    oscillator.frequency.value = frequency;
    oscillator.connect(gainNode);

    const trackGain = trackId ? trackGainsRef.current.get(trackId) : null;
    if (trackGain) {
      gainNode.connect(trackGain);
    } else {
      if (trackId && projectData?.tracks) {
        const tr = projectData.tracks.find(t => t.id === trackId) as any;
        if (tr?.mixer?.volume != null) {
          try { gainNode.gain.value *= tr.mixer.volume; } catch {}
        }
      }
      gainNode.connect(masterGainRef.current);
    }

    oscillator.start();
    oscillator.stop(ctx.currentTime + durationSec);

    return oscillator;
  }, [projectData]);

  const playNote = useCallback((pitch: number, velocity: number = 80, duration: number = 1, instrument?: string, trackId?: string) => {
    const osc = synthNote(pitch, velocity, duration, instrument, trackId);
    if (!osc) return;
    const noteId = `note_${Date.now()}_${pitch}`;
    oscillatorsRef.current.set(noteId, osc);
    setTimeout(() => {
      oscillatorsRef.current.delete(noteId);
    }, duration * 1000 + 100);
  }, [synthNote]);

  const playAudioClip = useCallback(async (audioUrl: string, trackId: string, clipStartBeat: number, currentBeat: number) => {
    if (!audioContextRef.current) return;
    
    try {
      const ctx = audioContextRef.current;
      const bpm = projectData?.bpm || 120;
      const secsPerBeat = 60 / bpm;
      
      // Calculate offset into the audio file based on current playback position
      const beatOffset = currentBeat - clipStartBeat;
      const timeOffset = Math.max(0, beatOffset * secsPerBeat);
      
      
      // Fetch and decode audio
      const response = await fetch(audioUrl);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
      
      // Create buffer source
      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      
      // Connect to track gain
      const trackGain = trackGainsRef.current.get(trackId);
      if (trackGain) {
        source.connect(trackGain);
      } else {
        source.connect(masterGainRef.current!);
      }
      
      // Store reference
      const sourceId = `${audioUrl}_${Date.now()}`;
      audioBufferSourcesRef.current.set(sourceId, source);
      
      // Start playback from the calculated offset
      source.start(0, timeOffset);
      
      // Clean up when done
      source.onended = () => {
        audioBufferSourcesRef.current.delete(sourceId);
      };
      
    } catch (error) {
      console.error('AudioEngine: Failed to play audio clip:', error);
      throw error;
    }
  }, [projectData]);

  const playClip = useCallback((notes: MidiNote[], startBeat: number = 0, instrument?: string, trackId?: string) => {
    if (!audioContextRef.current) return;

    const bpm = projectData?.bpm || 120;
    const secsPerBeat = 60 / bpm;

    notes.forEach(note => {
      const delayMs = Math.max(0, (note.startTime - startBeat) * secsPerBeat * 1000);
      const timeoutId = window.setTimeout(() => {
        synthNote(note.pitch, note.velocity, note.duration * secsPerBeat, instrument, trackId);
      }, delayMs);
      if (scheduledTimeoutsRef.current) {
        scheduledTimeoutsRef.current.add(timeoutId);
      }
    });
  }, [synthNote, projectData]);

  const getAudioContext = useCallback(() => audioContextRef.current, []);

  const addTrackEffect = useCallback(async (trackId: string, effectType: any) => {
    const trackGain = trackGainsRef.current.get(trackId);
    if (trackGain && effectsRef.current) {
      await effectsRef.current.addEffect(trackId, effectType, trackGain);
    }
  }, []);

  const removeTrackEffect = useCallback((trackId: string, effectId: string) => {
    if (effectsRef.current) {
      effectsRef.current.removeEffect(trackId, effectId);
    }
  }, []);

  const updateEffectParam = useCallback((trackId: string, effectId: string, paramName: string, value: any) => {
    if (effectsRef.current) {
      effectsRef.current.updateEffectParam(trackId, effectId, paramName, value);
    }
  }, []);

  const getTrackEffects = useCallback((trackId: string) => {
    if (effectsRef.current) {
      const chain = effectsRef.current.getEffectsChain(trackId);
      return chain?.effects || [];
    }
    return [];
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