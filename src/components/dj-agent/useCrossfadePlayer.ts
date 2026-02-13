/**
 * Crossfade DJ Playback Engine
 * Uses Web Audio API to overlap tracks during transitions,
 * creating a proper DJ mix feel instead of sequential playlist.
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { GeneratedSet, PerformancePlanItem } from './DJAgentTypes';
import { toast } from 'sonner';

interface TrackSource {
  id: string;
  fileUrl: string;
}

interface PlayerState {
  isPlaying: boolean;
  playingIndex: number | null;
  currentTime: number;
  duration: number;
  volume: number;
}

const DEFAULT_CROSSFADE_SEC = 8; // seconds of overlap

export function useCrossfadePlayer(
  activeSet: GeneratedSet | undefined,
  tracks: TrackSource[]
) {
  const [state, setState] = useState<PlayerState>({
    isPlaying: false,
    playingIndex: null,
    currentTime: 0,
    duration: 0,
    volume: 0.8,
  });

  const audioCtxRef = useRef<AudioContext | null>(null);
  const gainNodesRef = useRef<Map<number, GainNode>>(new Map());
  const sourceNodesRef = useRef<Map<number, { source: AudioBufferSourceNode; buffer: AudioBuffer; startedAt: number }>>(new Map());
  const buffersRef = useRef<Map<string, AudioBuffer>>(new Map());
  const masterGainRef = useRef<GainNode | null>(null);
  const animFrameRef = useRef<number>(0);
  const playStartTimeRef = useRef<number>(0);
  const totalDurationRef = useRef<number>(0);

  // Get track items from the set
  const getTrackItems = useCallback(() => {
    if (!activeSet) return [];
    return activeSet.items.filter(item => item.type === 'track');
  }, [activeSet]);

  const getTransitionItems = useCallback(() => {
    if (!activeSet) return [];
    return activeSet.items.filter(item => item.type === 'transition');
  }, [activeSet]);

  // Find audio URL for a track
  const findTrackUrl = useCallback((trackId?: string): string | null => {
    if (!trackId) return null;
    const t = tracks.find(tr => tr.id === trackId);
    return t?.fileUrl || null;
  }, [tracks]);

  // Get or create AudioContext
  const getAudioCtx = useCallback(() => {
    if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') {
      audioCtxRef.current = new AudioContext();
      masterGainRef.current = audioCtxRef.current.createGain();
      masterGainRef.current.gain.value = state.volume;
      masterGainRef.current.connect(audioCtxRef.current.destination);
    }
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  }, [state.volume]);

  // Fetch and decode audio buffer
  const loadBuffer = useCallback(async (url: string): Promise<AudioBuffer> => {
    if (buffersRef.current.has(url)) {
      return buffersRef.current.get(url)!;
    }
    const resp = await fetch(url);
    const arrayBuf = await resp.arrayBuffer();
    const ctx = getAudioCtx();
    const audioBuf = await ctx.decodeAudioData(arrayBuf);
    buffersRef.current.set(url, audioBuf);
    return audioBuf;
  }, [getAudioCtx]);

  // Cleanup
  useEffect(() => {
    return () => {
      cancelAnimationFrame(animFrameRef.current);
      sourceNodesRef.current.forEach(({ source }) => {
        try { source.stop(); } catch {}
      });
      sourceNodesRef.current.clear();
      gainNodesRef.current.clear();
      audioCtxRef.current?.close();
    };
  }, []);

  // Reset on set change
  useEffect(() => {
    stopAll();
    buffersRef.current.clear();
  }, [activeSet?.planId]);

  const stopAll = useCallback(() => {
    cancelAnimationFrame(animFrameRef.current);
    sourceNodesRef.current.forEach(({ source }) => {
      try { source.stop(); } catch {}
    });
    sourceNodesRef.current.clear();
    gainNodesRef.current.clear();
    setState(prev => ({ ...prev, isPlaying: false, playingIndex: null, currentTime: 0 }));
  }, []);

  // Time update loop
  const updateTimeLoop = useCallback(() => {
    if (audioCtxRef.current && playStartTimeRef.current > 0) {
      const elapsed = audioCtxRef.current.currentTime - playStartTimeRef.current;
      setState(prev => ({ ...prev, currentTime: Math.min(elapsed, totalDurationRef.current) }));
      
      // Determine which track is "current" based on elapsed time
      const trackItems = getTrackItems();
      let accTime = 0;
      for (let i = 0; i < trackItems.length; i++) {
        const dur = trackItems[i].durationSec || 240;
        const crossfade = i < trackItems.length - 1 ? DEFAULT_CROSSFADE_SEC : 0;
        const effectiveDur = dur - crossfade;
        if (elapsed < accTime + effectiveDur || i === trackItems.length - 1) {
          setState(prev => prev.playingIndex !== i ? { ...prev, playingIndex: i } : prev);
          break;
        }
        accTime += effectiveDur;
      }
    }
    animFrameRef.current = requestAnimationFrame(updateTimeLoop);
  }, [getTrackItems]);

  /**
   * Play the entire set with crossfading
   * Schedules all tracks with overlapping gain envelopes
   */
  const playSet = useCallback(async (startFromIndex: number = 0) => {
    if (!activeSet) return;
    
    const trackItems = getTrackItems();
    const transitionItems = getTransitionItems();
    if (trackItems.length === 0) return;

    stopAll();
    
    const ctx = getAudioCtx();
    const master = masterGainRef.current!;
    
    // Load all audio buffers from startFromIndex onwards
    const loadPromises: Promise<{ index: number; buffer: AudioBuffer } | null>[] = [];
    for (let i = startFromIndex; i < trackItems.length; i++) {
      const url = findTrackUrl(trackItems[i].trackId);
      if (!url) {
        toast.error(`No audio for "${trackItems[i].trackTitle}" — skipping`);
        continue;
      }
      loadPromises.push(
        loadBuffer(url).then(buffer => ({ index: i, buffer })).catch(() => {
          toast.error(`Failed to load "${trackItems[i].trackTitle}"`);
          return null;
        })
      );
    }

    const loaded = (await Promise.all(loadPromises)).filter(Boolean) as { index: number; buffer: AudioBuffer }[];
    if (loaded.length === 0) {
      toast.error('No tracks could be loaded');
      return;
    }

    // Schedule tracks with crossfade overlaps
    let scheduleTime = ctx.currentTime + 0.1;
    playStartTimeRef.current = scheduleTime;
    let totalMixDuration = 0;

    for (let li = 0; li < loaded.length; li++) {
      const { index, buffer } = loaded[li];
      const trackItem = trackItems[index];
      const dur = buffer.duration;
      
      // Get crossfade duration from transition data
      const transIdx = index - startFromIndex;
      let crossfadeSec = DEFAULT_CROSSFADE_SEC;
      if (transIdx < transitionItems.length) {
        crossfadeSec = Math.min(transitionItems[transIdx]?.durationSec || DEFAULT_CROSSFADE_SEC, dur * 0.3);
      }
      crossfadeSec = Math.min(crossfadeSec, dur * 0.3, DEFAULT_CROSSFADE_SEC);

      // Create gain node for this track
      const gainNode = ctx.createGain();
      gainNode.connect(master);
      gainNodesRef.current.set(index, gainNode);

      // Create source
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(gainNode);

      // Fade-in envelope (except first track)
      if (li > 0) {
        gainNode.gain.setValueAtTime(0, scheduleTime);
        gainNode.gain.linearRampToValueAtTime(1, scheduleTime + crossfadeSec);
      } else {
        gainNode.gain.setValueAtTime(1, scheduleTime);
      }

      // Fade-out envelope (except last track)
      if (li < loaded.length - 1) {
        const fadeOutStart = scheduleTime + dur - crossfadeSec;
        gainNode.gain.setValueAtTime(1, fadeOutStart);
        gainNode.gain.linearRampToValueAtTime(0, fadeOutStart + crossfadeSec);
      }

      source.start(scheduleTime);
      sourceNodesRef.current.set(index, { source, buffer, startedAt: scheduleTime });

      // Next track starts before this one ends (overlap = crossfade)
      if (li < loaded.length - 1) {
        scheduleTime += dur - crossfadeSec;
      } else {
        totalMixDuration = (scheduleTime - playStartTimeRef.current) + dur;
      }
    }

    totalDurationRef.current = totalMixDuration;
    setState(prev => ({
      ...prev,
      isPlaying: true,
      playingIndex: startFromIndex,
      currentTime: 0,
      duration: totalMixDuration,
    }));
    updateTimeLoop();

    // Auto-stop when mix ends
    const stopTimeout = setTimeout(() => {
      stopAll();
    }, totalMixDuration * 1000 + 500);
    
    // Store timeout for cleanup
    (sourceNodesRef.current as any).__stopTimeout = stopTimeout;
  }, [activeSet, getTrackItems, getTransitionItems, findTrackUrl, loadBuffer, getAudioCtx, stopAll, updateTimeLoop]);

  const handlePlayPause = useCallback(() => {
    if (!activeSet) return;
    
    if (state.isPlaying) {
      // Pause - suspend audio context
      audioCtxRef.current?.suspend();
      cancelAnimationFrame(animFrameRef.current);
      setState(prev => ({ ...prev, isPlaying: false }));
    } else if (state.playingIndex !== null && audioCtxRef.current?.state === 'suspended') {
      // Resume
      audioCtxRef.current.resume();
      setState(prev => ({ ...prev, isPlaying: true }));
      updateTimeLoop();
    } else {
      // Start from beginning
      playSet(0);
    }
  }, [activeSet, state.isPlaying, state.playingIndex, playSet, updateTimeLoop]);

  const handleSkip = useCallback((direction: 'next' | 'prev') => {
    if (!activeSet) return;
    const trackItems = getTrackItems();
    const current = state.playingIndex ?? 0;
    const next = direction === 'next' ? current + 1 : current - 1;
    if (next >= 0 && next < trackItems.length) {
      playSet(next);
    }
  }, [activeSet, state.playingIndex, getTrackItems, playSet]);

  const handleVolumeChange = useCallback((val: number[]) => {
    const v = val[0];
    setState(prev => ({ ...prev, volume: v }));
    if (masterGainRef.current) {
      masterGainRef.current.gain.value = v;
    }
  }, []);

  const handleSeek = useCallback((_val: number[]) => {
    // Seeking in a pre-scheduled Web Audio graph is complex.
    // For now, restart from the nearest track.
    // Full seek would require re-scheduling all sources.
    toast.info('Seek not yet supported in crossfade mode — use skip buttons');
  }, []);

  return {
    ...state,
    handlePlayPause,
    handleSkip,
    handleVolumeChange,
    handleSeek,
    stopAll,
    playTrackAtIndex: playSet,
    trackItems: getTrackItems(),
  };
}
