/**
 * Per-Stem Crossfade Player
 * Instead of crossfading full mixes, this player crossfades individual
 * stem layers (drums, bass, vocals, etc.) for professional DJ transitions.
 * 
 * Transition strategies per stem:
 * - Drums: hard cut on beat boundary (clean rhythmic transition)
 * - Bass: quick swap at phrase boundary (avoid low-end mud)
 * - Vocals: gradual fade, tease incoming vocals before full swap
 * - Other/Guitar/Piano: standard crossfade for musical continuity
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { GeneratedSet, DJTrackStems } from './DJAgentTypes';
import { toast } from 'sonner';

const STEM_KEYS: (keyof DJTrackStems)[] = ['drums', 'bass', 'vocals', 'guitar', 'piano', 'other'];

interface StemTrackSource {
  id: string;
  fileUrl: string;
  stems?: DJTrackStems;
}

interface StemPlayerState {
  isPlaying: boolean;
  playingIndex: number | null;
  currentTime: number;
  duration: number;
  volume: number;
  /** Which stems are soloed (empty = all playing) */
  soloedStems: Set<string>;
  /** Which stems are muted */
  mutedStems: Set<string>;
}

const CROSSFADE_DRUMS_SEC = 0.5;   // Hard, near-instant swap
const CROSSFADE_BASS_SEC = 2;      // Quick swap
const CROSSFADE_VOCALS_SEC = 6;    // Gradual tease
const CROSSFADE_DEFAULT_SEC = 4;   // Standard for other stems

function getCrossfadeDuration(stemKey: string): number {
  switch (stemKey) {
    case 'drums': return CROSSFADE_DRUMS_SEC;
    case 'bass': return CROSSFADE_BASS_SEC;
    case 'vocals': return CROSSFADE_VOCALS_SEC;
    default: return CROSSFADE_DEFAULT_SEC;
  }
}

export function useStemCrossfadePlayer(
  activeSet: GeneratedSet | undefined,
  tracks: StemTrackSource[]
) {
  const [state, setState] = useState<StemPlayerState>({
    isPlaying: false,
    playingIndex: null,
    currentTime: 0,
    duration: 0,
    volume: 0.8,
    soloedStems: new Set(),
    mutedStems: new Set(),
  });

  const audioCtxRef = useRef<AudioContext | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);
  const stemGainsRef = useRef<Map<string, GainNode>>(new Map()); // "trackIdx-stemKey" -> GainNode
  const stemSourcesRef = useRef<Map<string, AudioBufferSourceNode>>(new Map());
  const buffersRef = useRef<Map<string, AudioBuffer>>(new Map());
  const animFrameRef = useRef<number>(0);
  const playStartTimeRef = useRef<number>(0);
  const totalDurationRef = useRef<number>(0);

  const getTrackItems = useCallback(() => {
    if (!activeSet) return [];
    return activeSet.items.filter(item => item.type === 'track');
  }, [activeSet]);

  const findTrackData = useCallback((trackId?: string): StemTrackSource | null => {
    if (!trackId) return null;
    return tracks.find(t => t.id === trackId) || null;
  }, [tracks]);

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

  const loadBuffer = useCallback(async (url: string): Promise<AudioBuffer> => {
    if (buffersRef.current.has(url)) return buffersRef.current.get(url)!;
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
      stemSourcesRef.current.forEach(source => { try { source.stop(); } catch {} });
      stemSourcesRef.current.clear();
      stemGainsRef.current.clear();
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
    stemSourcesRef.current.forEach(source => { try { source.stop(); } catch {} });
    stemSourcesRef.current.clear();
    stemGainsRef.current.clear();
    setState(prev => ({ ...prev, isPlaying: false, playingIndex: null, currentTime: 0 }));
  }, []);

  const updateTimeLoop = useCallback(() => {
    if (audioCtxRef.current && playStartTimeRef.current > 0) {
      const elapsed = audioCtxRef.current.currentTime - playStartTimeRef.current;
      setState(prev => ({ ...prev, currentTime: Math.min(elapsed, totalDurationRef.current) }));

      // Determine which track is current
      const trackItems = getTrackItems();
      let accTime = 0;
      for (let i = 0; i < trackItems.length; i++) {
        const dur = trackItems[i].durationSec || 240;
        const overlap = i < trackItems.length - 1 ? CROSSFADE_DEFAULT_SEC : 0;
        const effective = dur - overlap;
        if (elapsed < accTime + effective || i === trackItems.length - 1) {
          setState(prev => prev.playingIndex !== i ? { ...prev, playingIndex: i } : prev);
          break;
        }
        accTime += effective;
      }
    }
    animFrameRef.current = requestAnimationFrame(updateTimeLoop);
  }, [getTrackItems]);

  /**
   * Play the set with per-stem crossfading.
   * For each track, loads stem URLs and schedules them with stem-specific crossfade envelopes.
   * Falls back to full mix if stems aren't available.
   */
  const playSet = useCallback(async (startFromIndex: number = 0) => {
    if (!activeSet) return;
    const trackItems = getTrackItems();
    if (trackItems.length === 0) return;

    stopAll();
    const ctx = getAudioCtx();
    const master = masterGainRef.current!;

    let scheduleTime = ctx.currentTime + 0.1;
    playStartTimeRef.current = scheduleTime;
    let totalMixDuration = 0;

    for (let li = 0; li < trackItems.length - startFromIndex; li++) {
      const idx = li + startFromIndex;
      const trackItem = trackItems[idx];
      const trackData = findTrackData(trackItem.trackId);
      if (!trackData) continue;

      const hasStemUrls = trackData.stems && Object.values(trackData.stems).some(Boolean);
      const stemUrls = hasStemUrls ? trackData.stems! : { other: trackData.fileUrl } as any;
      const activeStemKeys = Object.keys(stemUrls).filter(k => stemUrls[k as keyof DJTrackStems]);

      // Load all stems for this track
      const stemBuffers: { key: string; buffer: AudioBuffer }[] = [];
      for (const stemKey of activeStemKeys) {
        const url = stemUrls[stemKey as keyof DJTrackStems];
        if (!url) continue;
        try {
          const buffer = await loadBuffer(url);
          stemBuffers.push({ key: stemKey, buffer });
        } catch {
          console.warn(`[Stem Player] Failed to load ${stemKey} for "${trackItem.trackTitle}"`);
        }
      }

      if (stemBuffers.length === 0) {
        toast.error(`No audio loaded for "${trackItem.trackTitle}"`);
        continue;
      }

      // Use the longest stem as the track duration
      const trackDuration = Math.max(...stemBuffers.map(s => s.buffer.duration));
      const isFirst = li === 0;
      const isLast = li === trackItems.length - startFromIndex - 1;

      // Schedule each stem with its own crossfade envelope
      for (const { key: stemKey, buffer } of stemBuffers) {
        const cfDuration = getCrossfadeDuration(stemKey);
        const nodeKey = `${idx}-${stemKey}`;

        const gainNode = ctx.createGain();
        gainNode.connect(master);
        stemGainsRef.current.set(nodeKey, gainNode);

        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.connect(gainNode);

        // Fade-in (not first track)
        if (!isFirst) {
          gainNode.gain.setValueAtTime(0, scheduleTime);
          gainNode.gain.linearRampToValueAtTime(1, scheduleTime + cfDuration);
        } else {
          gainNode.gain.setValueAtTime(1, scheduleTime);
        }

        // Fade-out (not last track)
        if (!isLast) {
          const fadeOutStart = scheduleTime + trackDuration - cfDuration;
          gainNode.gain.setValueAtTime(1, Math.max(scheduleTime, fadeOutStart));
          gainNode.gain.linearRampToValueAtTime(0, fadeOutStart + cfDuration);
        }

        source.start(scheduleTime);
        stemSourcesRef.current.set(nodeKey, source);
      }

      // Next track overlaps using the default crossfade (longest stem overlap)
      if (!isLast) {
        scheduleTime += trackDuration - CROSSFADE_DEFAULT_SEC;
      } else {
        totalMixDuration = (scheduleTime - playStartTimeRef.current) + trackDuration;
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

    setTimeout(() => stopAll(), totalMixDuration * 1000 + 500);
  }, [activeSet, getTrackItems, findTrackData, loadBuffer, getAudioCtx, stopAll, updateTimeLoop]);

  const handlePlayPause = useCallback(() => {
    if (!activeSet) return;
    if (state.isPlaying) {
      audioCtxRef.current?.suspend();
      cancelAnimationFrame(animFrameRef.current);
      setState(prev => ({ ...prev, isPlaying: false }));
    } else if (state.playingIndex !== null && audioCtxRef.current?.state === 'suspended') {
      audioCtxRef.current.resume();
      setState(prev => ({ ...prev, isPlaying: true }));
      updateTimeLoop();
    } else {
      playSet(0);
    }
  }, [activeSet, state.isPlaying, state.playingIndex, playSet, updateTimeLoop]);

  const handleSkip = useCallback((direction: 'next' | 'prev') => {
    const trackItems = getTrackItems();
    const current = state.playingIndex ?? 0;
    const next = direction === 'next' ? current + 1 : current - 1;
    if (next >= 0 && next < trackItems.length) playSet(next);
  }, [state.playingIndex, getTrackItems, playSet]);

  const handleVolumeChange = useCallback((val: number[]) => {
    const v = val[0];
    setState(prev => ({ ...prev, volume: v }));
    if (masterGainRef.current) masterGainRef.current.gain.value = v;
  }, []);

  const handleSeek = useCallback((_val: number[]) => {
    toast.info('Seek not yet supported in stem crossfade mode — use skip buttons');
  }, []);

  const toggleStemMute = useCallback((stemKey: string) => {
    setState(prev => {
      const next = new Set(prev.mutedStems);
      if (next.has(stemKey)) next.delete(stemKey); else next.add(stemKey);
      // Apply to all active gain nodes for this stem
      stemGainsRef.current.forEach((gain, nodeKey) => {
        if (nodeKey.endsWith(`-${stemKey}`)) {
          gain.gain.value = next.has(stemKey) ? 0 : 1;
        }
      });
      return { ...prev, mutedStems: next };
    });
  }, []);

  const toggleStemSolo = useCallback((stemKey: string) => {
    setState(prev => {
      const next = new Set(prev.soloedStems);
      if (next.has(stemKey)) next.delete(stemKey); else { next.clear(); next.add(stemKey); }
      // Apply: if soloed set is non-empty, mute everything not in it
      stemGainsRef.current.forEach((gain, nodeKey) => {
        const nk = nodeKey.split('-').pop() || '';
        if (next.size === 0) {
          gain.gain.value = prev.mutedStems.has(nk) ? 0 : 1;
        } else {
          gain.gain.value = next.has(nk) ? 1 : 0;
        }
      });
      return { ...prev, soloedStems: next };
    });
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
    toggleStemMute,
    toggleStemSolo,
    isStemMode: true,
  };
}
