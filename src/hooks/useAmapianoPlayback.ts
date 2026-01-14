/**
 * Amapiano Playback Hook
 * Unified audio playback system with authentic Amapiano instrument sounds
 * Uses Tone.js for professional-grade synthesis
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import * as Tone from 'tone';
import {
  detectInstrumentType,
  createAmapianoInstrument,
  connectSynthWithEffects,
  disposeSynthWithEffects,
  type AmapianoInstrumentType
} from '@/lib/audio/amapianoSynths';
import { safeToneStart, markToneStarted } from '@/lib/audio/toneUtils';

interface PlaybackState {
  isReady: boolean;
  isPlaying: boolean;
  currentInstrument: AmapianoInstrumentType;
}

interface InstrumentInstance {
  synth: Tone.ToneAudioNode;
  effects: Tone.ToneAudioNode[];
  type: AmapianoInstrumentType;
}

interface ChordNote {
  pitch: number;
  velocity?: number;
  duration?: number;
}

interface PatternNote {
  pitch: number;
  time: number;
  duration: number;
  velocity?: number;
}

export function useAmapianoPlayback() {
  const [state, setState] = useState<PlaybackState>({
    isReady: false,
    isPlaying: false,
    currentInstrument: 'default'
  });

  const instrumentsRef = useRef<Map<AmapianoInstrumentType, InstrumentInstance>>(new Map());
  const masterChannelRef = useRef<Tone.Channel | null>(null);
  const scheduledEventsRef = useRef<number[]>([]);

  /**
   * Initialize the audio context (requires user gesture)
   */
  const initialize = useCallback(async () => {
    if (state.isReady) return;

    try {
      const started = await safeToneStart();
      if (!started) {
        console.warn('[AmapianoPlayback] Audio context not started - requires user gesture');
        return;
      }
      markToneStarted();
      
      // Create master channel with limiter
      const limiter = new Tone.Limiter(-1);
      masterChannelRef.current = new Tone.Channel({ volume: 0 }).connect(limiter);
      limiter.toDestination();

      // Pre-create common instruments
      const commonInstruments: AmapianoInstrumentType[] = [
        'log_drum', 'piano', 'bass', 'kick', 'snare', 'hihat', 'shaker'
      ];

      for (const type of commonInstruments) {
        const { synth, effects } = createAmapianoInstrument(type);
        connectSynthWithEffects(synth, effects, masterChannelRef.current);
        instrumentsRef.current.set(type, { synth, effects, type });
      }

      setState(prev => ({ ...prev, isReady: true }));
      console.log('[AmapianoPlayback] ✓ REAL Amapiano synths initialized (not mocked) -', commonInstruments.length, 'instruments');
    } catch (error) {
      console.error('[AmapianoPlayback] Init error:', error);
      throw error;
    }
  }, [state.isReady]);

  /**
   * Get or create an instrument instance
   */
  const getInstrument = useCallback((type: AmapianoInstrumentType): InstrumentInstance | null => {
    if (!state.isReady || !masterChannelRef.current) return null;

    let instrument = instrumentsRef.current.get(type);
    if (!instrument) {
      const { synth, effects } = createAmapianoInstrument(type);
      connectSynthWithEffects(synth, effects, masterChannelRef.current);
      instrument = { synth, effects, type };
      instrumentsRef.current.set(type, instrument);
    }
    return instrument;
  }, [state.isReady]);

  /**
   * Play a single note with the specified instrument
   */
  const playNote = useCallback(async (
    pitch: number | string,
    instrumentType: AmapianoInstrumentType = 'piano',
    velocity: number = 0.8,
    duration: number = 0.5
  ) => {
    if (!state.isReady) {
      await initialize();
    }

    const instrument = getInstrument(instrumentType);
    if (!instrument) return;

    const synth = instrument.synth as any;
    const freq = typeof pitch === 'number' 
      ? Tone.Frequency(pitch, 'midi').toFrequency()
      : Tone.Frequency(pitch).toFrequency();

    try {
      if (synth.triggerAttackRelease) {
        if (['snare', 'hihat', 'shaker'].includes(instrumentType)) {
          // Noise-based synths don't take frequency
          synth.triggerAttackRelease(duration, Tone.now(), velocity);
        } else {
          synth.triggerAttackRelease(freq, duration, Tone.now(), velocity);
        }
      }
    } catch (error) {
      console.error('[AmapianoPlayback] Note error:', error);
    }
  }, [state.isReady, initialize, getInstrument]);

  /**
   * Play a chord (multiple notes simultaneously)
   */
  const playChord = useCallback(async (
    notes: ChordNote[],
    instrumentType: AmapianoInstrumentType = 'piano',
    duration: number = 1
  ) => {
    if (!state.isReady) {
      await initialize();
    }

    const instrument = getInstrument(instrumentType);
    if (!instrument) return;

    const synth = instrument.synth as any;
    const frequencies = notes.map(note => 
      Tone.Frequency(note.pitch, 'midi').toFrequency()
    );

    try {
      if (synth.triggerAttackRelease) {
        synth.triggerAttackRelease(frequencies, duration, Tone.now(), notes[0]?.velocity ?? 0.7);
      }
    } catch (error) {
      console.error('[AmapianoPlayback] Chord error:', error);
    }
  }, [state.isReady, initialize, getInstrument]);

  /**
   * Play a chord progression
   */
  const playChordProgression = useCallback(async (
    chords: string[],
    key: string = 'C',
    bpm: number = 115,
    onComplete?: () => void
  ) => {
    if (!state.isReady) {
      await initialize();
    }

    setState(prev => ({ ...prev, isPlaying: true }));
    
    // Clear any scheduled events
    scheduledEventsRef.current.forEach(id => Tone.Transport.clear(id));
    scheduledEventsRef.current = [];

    const beatDuration = 60 / bpm;
    const instrument = getInstrument('piano');
    if (!instrument) return;

    const synth = instrument.synth as any;
    
    // Simple chord to MIDI conversion
    const chordToMidi = (chord: string, rootKey: string): number[] => {
      const noteToMidi: Record<string, number> = {
        'C': 60, 'D': 62, 'E': 64, 'F': 65, 'G': 67, 'A': 69, 'B': 71
      };
      
      const root = chord.replace(/m|7|maj|dim|aug/g, '');
      const isMinor = chord.includes('m') && !chord.includes('maj');
      const baseMidi = noteToMidi[root] || 60;
      
      if (isMinor) {
        return [baseMidi, baseMidi + 3, baseMidi + 7]; // Minor triad
      }
      return [baseMidi, baseMidi + 4, baseMidi + 7]; // Major triad
    };

    Tone.Transport.bpm.value = bpm;
    
    chords.forEach((chord, index) => {
      const startTime = index * beatDuration * 2; // 2 beats per chord
      const midiNotes = chordToMidi(chord, key);
      const frequencies = midiNotes.map(n => Tone.Frequency(n, 'midi').toFrequency());

      const eventId = Tone.Transport.schedule((time) => {
        synth.triggerAttackRelease(frequencies, beatDuration * 1.8, time, 0.7);
      }, startTime);
      
      scheduledEventsRef.current.push(eventId);
    });

    // Schedule completion callback
    const totalDuration = chords.length * beatDuration * 2;
    const completeId = Tone.Transport.schedule(() => {
      setState(prev => ({ ...prev, isPlaying: false }));
      Tone.Transport.stop();
      onComplete?.();
    }, totalDuration);
    scheduledEventsRef.current.push(completeId);

    Tone.Transport.start();
  }, [state.isReady, initialize, getInstrument]);

  /**
   * Play a drum pattern
   */
  const playDrumPattern = useCallback(async (
    pattern: PatternNote[],
    bpm: number = 115,
    loop: boolean = false,
    onComplete?: () => void
  ) => {
    if (!state.isReady) {
      await initialize();
    }

    setState(prev => ({ ...prev, isPlaying: true }));
    
    // Clear scheduled events
    scheduledEventsRef.current.forEach(id => Tone.Transport.clear(id));
    scheduledEventsRef.current = [];

    Tone.Transport.bpm.value = bpm;
    
    // Map MIDI notes to drum instruments
    const midiToDrum: Record<number, AmapianoInstrumentType> = {
      36: 'kick',    // C1
      38: 'snare',   // D1
      42: 'hihat',   // F#1
      46: 'hihat',   // Bb1 (open)
      37: 'snare',   // C#1 (sidestick)
      39: 'shaker',  // D#1 (clap)
      56: 'shaker',  // Ab2 (cowbell → shaker)
    };

    let maxTime = 0;
    pattern.forEach((note) => {
      const drumType = midiToDrum[note.pitch] || 'percussion';
      const instrument = getInstrument(drumType);
      if (!instrument) return;

      const synth = instrument.synth as any;
      const startTime = note.time * (60 / bpm);
      maxTime = Math.max(maxTime, startTime + note.duration);

      const eventId = Tone.Transport.schedule((time) => {
        const vel = note.velocity ?? 0.8;
        if (['snare', 'hihat', 'shaker'].includes(drumType)) {
          synth.triggerAttackRelease(note.duration, time, vel);
        } else {
          const freq = Tone.Frequency(note.pitch, 'midi').toFrequency();
          synth.triggerAttackRelease(freq, note.duration, time, vel);
        }
      }, startTime);
      
      scheduledEventsRef.current.push(eventId);
    });

    if (!loop) {
      const completeId = Tone.Transport.schedule(() => {
        setState(prev => ({ ...prev, isPlaying: false }));
        Tone.Transport.stop();
        onComplete?.();
      }, maxTime + 0.1);
      scheduledEventsRef.current.push(completeId);
    } else {
      Tone.Transport.loop = true;
      Tone.Transport.loopEnd = maxTime;
    }

    Tone.Transport.start();
  }, [state.isReady, initialize, getInstrument]);

  /**
   * Play a log drum sequence (signature Amapiano sound)
   */
  const playLogDrumSequence = useCallback(async (
    notes: number[] = [60, 62, 64, 65], // Default: C D E F
    bpm: number = 115,
    onComplete?: () => void
  ) => {
    if (!state.isReady) {
      await initialize();
    }

    setState(prev => ({ ...prev, isPlaying: true }));
    
    const instrument = getInstrument('log_drum');
    if (!instrument) return;

    const synth = instrument.synth as any;
    const beatDuration = 60 / bpm;

    Tone.Transport.bpm.value = bpm;
    
    // Clear previous
    scheduledEventsRef.current.forEach(id => Tone.Transport.clear(id));
    scheduledEventsRef.current = [];

    notes.forEach((pitch, index) => {
      const startTime = index * beatDuration * 0.5; // 8th notes
      const freq = Tone.Frequency(pitch, 'midi').toFrequency();

      const eventId = Tone.Transport.schedule((time) => {
        synth.triggerAttackRelease(freq, beatDuration * 0.4, time, 0.8);
      }, startTime);
      
      scheduledEventsRef.current.push(eventId);
    });

    const totalDuration = notes.length * beatDuration * 0.5;
    const completeId = Tone.Transport.schedule(() => {
      setState(prev => ({ ...prev, isPlaying: false }));
      Tone.Transport.stop();
      onComplete?.();
    }, totalDuration + 0.5);
    scheduledEventsRef.current.push(completeId);

    Tone.Transport.start();
  }, [state.isReady, initialize, getInstrument]);

  /**
   * Stop all playback
   */
  const stop = useCallback(() => {
    Tone.Transport.stop();
    Tone.Transport.cancel();
    scheduledEventsRef.current = [];
    setState(prev => ({ ...prev, isPlaying: false }));
  }, []);

  /**
   * Set master volume (0-1)
   */
  const setVolume = useCallback((volume: number) => {
    if (masterChannelRef.current) {
      masterChannelRef.current.volume.value = Tone.gainToDb(Math.max(0, Math.min(1, volume)));
    }
  }, []);

/**
   * Cleanup (only if audio was actually initialized)
   */
  useEffect(() => {
    return () => {
      // Only access Transport if context is running (avoid triggering autoplay warning)
      if (Tone.context.state === 'running') {
        Tone.Transport.stop();
        Tone.Transport.cancel();
      }
      instrumentsRef.current.forEach(inst => {
        disposeSynthWithEffects(inst.synth, inst.effects);
      });
      instrumentsRef.current.clear();
      masterChannelRef.current?.dispose();
    };
  }, []);

  return {
    // State
    isReady: state.isReady,
    isPlaying: state.isPlaying,
    
    // Controls
    initialize,
    stop,
    setVolume,
    
    // Playback methods
    playNote,
    playChord,
    playChordProgression,
    playDrumPattern,
    playLogDrumSequence,
    
    // Utility
    detectInstrumentType,
    getInstrument
  };
}
