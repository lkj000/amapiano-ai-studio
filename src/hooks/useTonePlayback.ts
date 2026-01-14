/**
 * Tone.js-based DAW Playback Hook
 * Provides real audio playback for DAW clips using Tone.js Transport
 * Enhanced with Amapiano-specific instrument sounds
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import * as Tone from 'tone';
import type { DawProjectData, DawTrack } from '@/types/daw';
import { 
  detectInstrumentType, 
  createAmapianoInstrument, 
  connectSynthWithEffects,
  disposeSynthWithEffects,
  type AmapianoInstrumentType
} from '@/lib/audio/amapianoSynths';
import { safeToneStart, isToneReady, markToneStarted } from '@/lib/audio/toneUtils';

interface TrackInstrument {
  synth: Tone.ToneAudioNode;
  effects: Tone.ToneAudioNode[];
  type: AmapianoInstrumentType;
}

export function useTonePlayback(projectData: DawProjectData | null) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [isReady, setIsReady] = useState(false);
  const [audioLoadingCount, setAudioLoadingCount] = useState(0);

  const playersRef = useRef<Map<string, Tone.Player>>(new Map());
  const instrumentsRef = useRef<Map<string, TrackInstrument>>(new Map());
  const trackChannelsRef = useRef<Map<string, Tone.Channel>>(new Map());
  const transportUpdateInterval = useRef<number | null>(null);
  const scheduledRef = useRef(false);

  // Initialize on first user gesture
  const initialize = useCallback(async () => {
    if (isReady) return;
    
    try {
      const started = await safeToneStart();
      if (!started) {
        console.warn('[TonePlayback] Audio context not started - requires user gesture');
        return;
      }
      markToneStarted();
      Tone.Transport.bpm.value = projectData?.bpm || 118;
      setIsReady(true);
      console.log('[TonePlayback] ✅ REAL Tone.js audio engine initialized and ready');
      console.log('[TonePlayback] 🎛️ All controls (play, stop, mute, solo, pan, volume) are REAL - not simulated');
    } catch (error) {
      console.error('[TonePlayback] Init error:', error);
      throw error;
    }
  }, [isReady, projectData?.bpm]);

// Keep BPM in sync with project settings (only after audio context is running)
  useEffect(() => {
    if (!isReady || !isToneReady()) return;
    Tone.Transport.bpm.value = projectData?.bpm || 118;
  }, [isReady, projectData?.bpm]);

// Setup tracks when project changes - preload audio files
  useEffect(() => {
    // Only proceed if audio context is actually running
    if (!isReady || !projectData || !isToneReady()) return;

    console.log('[TonePlayback] Setting up tracks...');

    // Reset any previously scheduled events when switching projects
    Tone.Transport.cancel();
    scheduledRef.current = false;

    // Clear existing
    playersRef.current.forEach(p => p.dispose());
    playersRef.current.clear();
    instrumentsRef.current.forEach(inst => disposeSynthWithEffects(inst.synth, inst.effects));
    instrumentsRef.current.clear();
    trackChannelsRef.current.forEach(c => c.dispose());
    trackChannelsRef.current.clear();

    // Create channels and instruments for each track
    projectData.tracks.forEach((track) => {
      const channel = new Tone.Channel({
        volume: Tone.gainToDb(track.mixer?.volume || 0.8),
        pan: track.mixer?.pan || 0,
        mute: track.mixer?.isMuted || false,
        solo: track.mixer?.isSolo || false,
      }).toDestination();

      trackChannelsRef.current.set(track.id, channel);

      if (track.type === 'midi') {
        // Detect instrument type from track name
        const instrumentType = detectInstrumentType(track.name);
        console.log(`[TonePlayback] Track "${track.name}" → ${instrumentType} synth`);

        // Create Amapiano-specific instrument
        const { synth, effects } = createAmapianoInstrument(instrumentType);

        // Connect through effects chain to channel
        connectSynthWithEffects(synth, effects, channel);

        instrumentsRef.current.set(track.id, { synth, effects, type: instrumentType });
      }

      // PRE-LOAD audio clips for audio tracks
      if (track.type === 'audio') {
        track.clips.forEach((clip) => {
          if ('audioUrl' in clip && clip.audioUrl) {
            const clipKey = `${track.id}_${clip.id}`;
            
            // Skip if already loaded
            if (playersRef.current.has(clipKey)) return;
            
            console.log(`[TonePlayback] 🔄 Pre-loading audio: ${clip.name || clipKey}`);
            setAudioLoadingCount(prev => prev + 1);
            
            const player = new Tone.Player({
              url: clip.audioUrl,
              onload: () => {
                console.log(`[TonePlayback] ✅ Loaded audio: ${clip.name || clipKey}`);
                setAudioLoadingCount(prev => Math.max(0, prev - 1));
              },
              onerror: (err) => {
                console.error(`[TonePlayback] ❌ Failed to load audio: ${clip.name || clipKey}`, err);
                setAudioLoadingCount(prev => Math.max(0, prev - 1));
              },
            });

            const trackChannel = trackChannelsRef.current.get(track.id);
            if (trackChannel) {
              player.connect(trackChannel);
            } else {
              player.toDestination();
            }

            playersRef.current.set(clipKey, player);
          }
        });
      }
    });

    console.log('[TonePlayback] Tracks ready:', trackChannelsRef.current.size, 
      'instruments:', instrumentsRef.current.size, 
      'audio players:', playersRef.current.size);
  }, [isReady, projectData]);

  const play = useCallback(async () => {
    if (!isReady) {
      await initialize();
    }

    if (!projectData) {
      if (Tone.Transport.state !== 'started') {
        Tone.Transport.start();
        setIsPlaying(true);
      }
      return;
    }

    // No-op if already playing
    if (Tone.Transport.state === 'started') return;

    // Only (re)schedule when starting from stopped (or after a stop/cancel)
    if (Tone.Transport.state === 'stopped' || !scheduledRef.current) {
      Tone.Transport.cancel();

      // Schedule MIDI notes + audio clips for the whole project
      projectData.tracks.forEach((track) => {
        // Skip muted tracks
        const channel = trackChannelsRef.current.get(track.id);
        
        if (track.type === 'midi') {
          const instrument = instrumentsRef.current.get(track.id);
          if (!instrument) return;

          track.clips.forEach((clip) => {
            if ('notes' in clip && clip.notes) {
              clip.notes.forEach((note) => {
                const noteStartTime = `0:${(clip.startTime || 0) + note.startTime}:0`;
                const noteDuration = `0:${note.duration}:0`;
                const freq = Tone.Frequency(note.pitch, 'midi').toFrequency();

                Tone.Transport.schedule((time) => {
                  const synth = instrument.synth as any;
                  if (synth.triggerAttackRelease) {
                    synth.triggerAttackRelease(freq, noteDuration, time, note.velocity / 127);
                  } else if (synth.triggerAttack) {
                    // For NoiseSynth/MetalSynth that don't take frequency
                    synth.triggerAttackRelease(noteDuration, time, note.velocity / 127);
                  }
                }, noteStartTime);
              });
            }
          });
        }

        if (track.type === 'audio') {
          track.clips.forEach((clip) => {
            if ('audioUrl' in clip && clip.audioUrl) {
              const clipKey = `${track.id}_${clip.id}`;

              // Use pre-loaded player if available
              let player = playersRef.current.get(clipKey);
              
              if (!player) {
                // Create player if not pre-loaded (shouldn't happen normally)
                console.log(`[TonePlayback] 🔄 Creating player on-the-fly: ${clip.name || clipKey}`);
                player = new Tone.Player({
                  url: clip.audioUrl,
                  onload: () => {
                    console.log(`[TonePlayback] ✅ Loaded: ${clip.name || clipKey}`);
                  },
                  onerror: (err) => {
                    console.error(`[TonePlayback] ❌ Load error:`, err);
                  },
                });

                if (channel) {
                  player.connect(channel);
                } else {
                  player.toDestination();
                }

                playersRef.current.set(clipKey, player);
              }

              // Schedule audio playback
              const startTime = `0:${clip.startTime || 0}:0`;
              const playerRef = player; // Capture for closure
              
              Tone.Transport.schedule((time) => {
                try {
                  // Check if player is loaded before playing
                  if (playerRef.loaded) {
                    playerRef.start(time);
                    console.log(`[TonePlayback] 🎵 Playing audio: ${clip.name || clipKey}`);
                  } else {
                    console.warn(`[TonePlayback] ⚠️ Audio not loaded yet: ${clip.name || clipKey}`);
                  }
                } catch (err) {
                  console.error(`[TonePlayback] Play error:`, err);
                }
              }, startTime);
            }
          });
        }
      });

      scheduledRef.current = true;
    }

    Tone.Transport.start();
    setIsPlaying(true);

    // Update current time display
    transportUpdateInterval.current = window.setInterval(() => {
      const beats = Tone.Transport.seconds * (projectData?.bpm || 118) / 60;
      setCurrentTime(beats);
    }, 50);

    console.log('[TonePlayback] ▶️ Playing with', playersRef.current.size, 'audio players');
  }, [isReady, initialize, projectData]);

  const pause = useCallback(() => {
    Tone.Transport.pause();
    setIsPlaying(false);

    if (transportUpdateInterval.current) {
      clearInterval(transportUpdateInterval.current);
      transportUpdateInterval.current = null;
    }

    console.log('[TonePlayback] ⏸️ Paused');
  }, []);

  const stop = useCallback(() => {
    Tone.Transport.stop();
    Tone.Transport.cancel(); // Clear scheduled events
    scheduledRef.current = false;

    setIsPlaying(false);
    setCurrentTime(0);

    if (transportUpdateInterval.current) {
      clearInterval(transportUpdateInterval.current);
      transportUpdateInterval.current = null;
    }

    // Stop all players
    playersRef.current.forEach(player => {
      try { player.stop(); } catch {}
    });

    console.log('[TonePlayback] ⏹️ Stopped');
  }, []);

  const setPositionBeats = useCallback(async (beats: number) => {
    if (!isReady) {
      await initialize();
    }

    const bpm = projectData?.bpm || 118;
    Tone.Transport.seconds = (beats * 60) / bpm;
    setCurrentTime(beats);
  }, [isReady, initialize, projectData?.bpm]);

  const setMasterVolume = useCallback((volume: number) => {
    Tone.Destination.volume.value = Tone.gainToDb(volume);
  }, []);

  const setTrackVolume = useCallback((trackId: string, volume: number) => {
    const channel = trackChannelsRef.current.get(trackId);
    if (channel) {
      channel.volume.value = Tone.gainToDb(volume);
    }
  }, []);

  const setTrackMute = useCallback((trackId: string, muted: boolean) => {
    const channel = trackChannelsRef.current.get(trackId);
    if (channel) {
      channel.mute = muted;
      console.log(`[TonePlayback] Track ${trackId} mute: ${muted}`);
    }
  }, []);

  const setTrackSolo = useCallback((trackId: string, solo: boolean) => {
    const channel = trackChannelsRef.current.get(trackId);
    if (channel) {
      channel.solo = solo;
      console.log(`[TonePlayback] Track ${trackId} solo: ${solo}`);
    }
  }, []);

  const setTrackPan = useCallback((trackId: string, pan: number) => {
    const channel = trackChannelsRef.current.get(trackId);
    if (channel) {
      channel.pan.value = pan;
      console.log(`[TonePlayback] Track ${trackId} pan: ${pan}`);
    }
  }, []);

  /**
   * Play a single note using the track's instrument (or fallback to default synth)
   */
  const playNote = useCallback(async (
    pitch: number,
    velocity: number = 80,
    duration: number = 0.5,
    trackId?: string
  ) => {
    if (!isReady) {
      await initialize();
    }

    // Try to use the track's existing instrument
    let instrument = trackId ? instrumentsRef.current.get(trackId) : null;

    // If no track instrument, create a temporary one
    if (!instrument) {
      const { synth, effects } = createAmapianoInstrument('piano');
      connectSynthWithEffects(synth, effects, Tone.Destination);

      const freq = Tone.Frequency(pitch, 'midi').toFrequency();
      const normalizedVelocity = velocity / 127;

      try {
        const synthAny = synth as any;
        if (synthAny.triggerAttackRelease) {
          synthAny.triggerAttackRelease(freq, duration, Tone.now(), normalizedVelocity);
        }
      } catch (error) {
        console.error('[TonePlayback] Note error:', error);
      }

      // Dispose after note finishes
      setTimeout(() => {
        disposeSynthWithEffects(synth, effects);
      }, duration * 1000 + 500);

      return;
    }

    // Use track's instrument
    const freq = Tone.Frequency(pitch, 'midi').toFrequency();
    const normalizedVelocity = velocity / 127;

    try {
      const synthAny = instrument.synth as any;
      if (synthAny.triggerAttackRelease) {
        // Handle noise-based synths that don't take frequency
        if (['snare', 'hihat', 'shaker'].includes(instrument.type)) {
          synthAny.triggerAttackRelease(duration, Tone.now(), normalizedVelocity);
        } else {
          synthAny.triggerAttackRelease(freq, duration, Tone.now(), normalizedVelocity);
        }
      }
      console.log(`[TonePlayback] 🎵 Note: pitch=${pitch}, vel=${velocity}, dur=${duration}, track=${trackId || 'temp'}`);
    } catch (error) {
      console.error('[TonePlayback] Note error:', error);
    }
  }, [isReady, initialize]);

// Cleanup (only if audio was actually initialized)
  useEffect(() => {
    return () => {
      if (transportUpdateInterval.current) {
        clearInterval(transportUpdateInterval.current);
      }
      // Only access Transport if Tone is ready (avoid triggering autoplay warning)
      if (isToneReady()) {
        Tone.Transport.stop();
        Tone.Transport.cancel();
      }
      playersRef.current.forEach(p => p.dispose());
      instrumentsRef.current.forEach(inst => disposeSynthWithEffects(inst.synth, inst.effects));
      trackChannelsRef.current.forEach(c => c.dispose());
    };
  }, []);

  // Check if all audio is loaded
  const isAudioLoading = audioLoadingCount > 0;
  const audioPlayerCount = playersRef.current.size;

  return {
    isPlaying,
    currentTime,
    isReady,
    isAudioLoading,
    audioPlayerCount,
    initialize,
    play,
    pause,
    stop,
    setPositionBeats,
    setMasterVolume,
    setTrackVolume,
    setTrackMute,
    setTrackSolo,
    setTrackPan,
    playNote,
  };
}
