/**
 * Tone.js-based DAW Playback Hook
 * Provides real audio playback for DAW clips using Tone.js Transport
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import * as Tone from 'tone';
import type { DawProjectData, DawTrack } from '@/types/daw';

export function useTonePlayback(projectData: DawProjectData | null) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [isReady, setIsReady] = useState(false);

  const playersRef = useRef<Map<string, Tone.Player>>(new Map());
  const synthsRef = useRef<Map<string, Tone.PolySynth>>(new Map());
  const trackChannelsRef = useRef<Map<string, Tone.Channel>>(new Map());
  const transportUpdateInterval = useRef<number | null>(null);

  // Initialize on first user gesture
  const initialize = useCallback(async () => {
    if (isReady) return;
    
    try {
      await Tone.start();
      Tone.Transport.bpm.value = projectData?.bpm || 118;
      setIsReady(true);
      console.log('[TonePlayback] ✓ Ready');
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
    synthsRef.current.forEach(s => s.dispose());
    synthsRef.current.clear();
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
        // Create a polySynth for MIDI playback
        const synth = new Tone.PolySynth(Tone.Synth, {
          oscillator: { type: 'triangle' },
          envelope: { attack: 0.005, decay: 0.1, sustain: 0.3, release: 0.5 }
        }).connect(channel);
        synthsRef.current.set(track.id, synth);
      }
    });

    console.log('[TonePlayback] Tracks ready:', trackChannelsRef.current.size);
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
          const synth = synthsRef.current.get(track.id);
          if (!synth) return;

          track.clips.forEach((clip) => {
            if ('notes' in clip && clip.notes) {
              clip.notes.forEach((note) => {
                const noteStartTime = `0:${clip.startTime + note.startTime}:0`;
                const noteDuration = `0:${note.duration}:0`;
                const freq = Tone.Frequency(note.pitch, 'midi').toFrequency();

                Tone.Transport.schedule((time) => {
                  synth.triggerAttackRelease(freq, noteDuration, time, note.velocity / 127);
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
      synthsRef.current.forEach(s => s.dispose());
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
