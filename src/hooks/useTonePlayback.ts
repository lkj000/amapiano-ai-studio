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

interface TrackInstrument {
  synth: Tone.ToneAudioNode;
  effects: Tone.ToneAudioNode[];
  type: AmapianoInstrumentType;
}

export function useTonePlayback(projectData: DawProjectData | null) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [isReady, setIsReady] = useState(false);

  const playersRef = useRef<Map<string, Tone.Player>>(new Map());
  const instrumentsRef = useRef<Map<string, TrackInstrument>>(new Map());
  const trackChannelsRef = useRef<Map<string, Tone.Channel>>(new Map());
  const transportUpdateInterval = useRef<number | null>(null);

  // Initialize on first user gesture
  const initialize = useCallback(async () => {
    if (isReady) return;
    
    try {
      await Tone.start();
      Tone.Transport.bpm.value = projectData?.bpm || 118;
      setIsReady(true);
      console.log('[TonePlayback] ✓ REAL Tone.js audio engine ready (not mocked)');
    } catch (error) {
      console.error('[TonePlayback] Init error:', error);
      throw error;
    }
  }, [isReady, projectData?.bpm]);

  // Setup tracks when project changes
  useEffect(() => {
    if (!isReady || !projectData) return;

    console.log('[TonePlayback] Setting up tracks...');

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
    });

    console.log('[TonePlayback] Tracks ready:', trackChannelsRef.current.size, 'instruments:', instrumentsRef.current.size);
  }, [isReady, projectData]);

  const play = useCallback(async () => {
    if (!isReady) {
      await initialize();
    }

    Tone.Transport.start();
    setIsPlaying(true);

    // Update current time display
    transportUpdateInterval.current = window.setInterval(() => {
      const beats = Tone.Transport.seconds * (projectData?.bpm || 118) / 60;
      setCurrentTime(beats);
    }, 50);

    // Schedule MIDI notes
    if (projectData) {
      projectData.tracks.forEach((track) => {
        if (track.type === 'midi' && !track.mixer?.isMuted) {
          const instrument = instrumentsRef.current.get(track.id);
          if (!instrument) return;

          track.clips.forEach((clip) => {
            if ('notes' in clip && clip.notes) {
              clip.notes.forEach((note) => {
                const noteStartTime = `0:${clip.startTime + note.startTime}:0`;
                const noteDuration = `0:${note.duration}:0`;
                const freq = Tone.Frequency(note.pitch, 'midi').toFrequency();

                Tone.Transport.schedule((time) => {
                  // Handle different synth types
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

        if (track.type === 'audio' && !track.mixer?.isMuted) {
          track.clips.forEach((clip) => {
            if ('audioUrl' in clip && clip.audioUrl) {
              const clipKey = `${track.id}_${clip.id}`;
              
              // Check if player already exists
              if (!playersRef.current.has(clipKey)) {
                const player = new Tone.Player({
                  url: clip.audioUrl,
                  onload: () => {
                    console.log(`[TonePlayback] Loaded: ${clip.name}`);
                  },
                  onerror: (err) => {
                    console.error(`[TonePlayback] Load error:`, err);
                  }
                });

                const channel = trackChannelsRef.current.get(track.id);
                if (channel) {
                  player.connect(channel);
                }

                playersRef.current.set(clipKey, player);

                // Schedule playback
                const startTime = `0:${clip.startTime}:0`;
                Tone.Transport.schedule((time) => {
                  player.start(time);
                }, startTime);
              }
            }
          });
        }
      });
    }

    console.log('[TonePlayback] ▶️ Playing');
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
    }
  }, []);

  const setTrackSolo = useCallback((trackId: string, solo: boolean) => {
    const channel = trackChannelsRef.current.get(trackId);
    if (channel) {
      channel.solo = solo;
    }
  }, []);

  // Cleanup
  useEffect(() => {
    return () => {
      if (transportUpdateInterval.current) {
        clearInterval(transportUpdateInterval.current);
      }
      Tone.Transport.stop();
      Tone.Transport.cancel();
      playersRef.current.forEach(p => p.dispose());
      instrumentsRef.current.forEach(inst => disposeSynthWithEffects(inst.synth, inst.effects));
      trackChannelsRef.current.forEach(c => c.dispose());
    };
  }, []);

  return {
    isPlaying,
    currentTime,
    isReady,
    initialize,
    play,
    pause,
    stop,
    setMasterVolume,
    setTrackVolume,
    setTrackMute,
    setTrackSolo,
  };
}
