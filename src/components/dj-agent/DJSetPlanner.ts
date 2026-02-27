/**
 * Real Set Planner — Beam Search with Scoring
 * No mocks. Real algorithmic planning using Camelot compatibility,
 * BPM proximity, energy arc shaping, and novelty constraints.
 */

import {
  DJTrack, SetConfig, GeneratedSet, PerformancePlanItem,
  MixRole, TransitionType, SetScores, PRESET_INFO
} from './DJAgentTypes';
import { getCamelotCompatibility } from './DJAudioAnalyzer';

// Preset energy arc shapes (normalized time 0-1 -> target energy 0-1)
const ENERGY_ARCS: Record<string, (t: number) => number> = {
  private_school_3am_peak: (t) => {
    if (t < 0.15) return 0.3 + t * 2;        // warm up
    if (t < 0.5) return 0.6 + (t - 0.15) * 0.8; // build to peak
    if (t < 0.6) return 0.95 - (t - 0.5) * 2;  // brief release
    if (t < 0.85) return 0.75 + (t - 0.6) * 0.8; // second peak
    return 0.95 - (t - 0.85) * 4;              // cooldown
  },
  deep_soulful: (t) => 0.3 + 0.4 * Math.sin(t * Math.PI),
  sunrise_cooldown: (t) => 0.8 - t * 0.6,
  peak_hour: (t) => 0.7 + 0.25 * Math.sin(t * Math.PI * 2),
  balanced: (t) => {
    if (t < 0.25) return 0.3 + t * 2;
    if (t < 0.5) return 0.7 + (t - 0.25) * 1.2;
    if (t < 0.75) return 1.0 - (t - 0.5) * 1.6;
    return 0.6 - (t - 0.75) * 1.2;
  },
};

interface BeamCandidate {
  sequence: DJTrack[];
  score: number;
  totalDuration: number;
}

/**
 * Score a transition between two tracks
 */
function scoreTransition(
  from: DJTrack,
  to: DJTrack,
  config: SetConfig,
  positionRatio: number, // 0-1 position in set
  usedArtists: Map<string, number> // artist -> last used index
): {
  score: number;
  details: { harmonic: number; bpm: number; energy: number; novelty: number; vocalConflict: number };
} {
  const fFeats = from.features!;
  const tFeats = to.features!;

  // 1. Harmonic compatibility (Camelot wheel)
  const harmonic = getCamelotCompatibility(fFeats.camelot, tFeats.camelot);

  // 2. BPM compatibility
  const bpmDiff = Math.abs(fFeats.bpm - tFeats.bpm);
  const bpmScore = bpmDiff <= config.maxBpmDelta ? 1 - (bpmDiff / config.maxBpmDelta) * 0.3 : Math.max(0, 1 - bpmDiff / 20);

  // 3. Energy arc fit
  const arcFn = ENERGY_ARCS[config.preset] || ENERGY_ARCS.balanced;
  const targetEnergy = arcFn(positionRatio);
  const trackEnergy = tFeats.energyCurve.reduce((a, b) => a + b, 0) / tFeats.energyCurve.length;
  const energyFit = 1 - Math.abs(targetEnergy - trackEnergy);

  // 4. Novelty penalty (avoid repeating same artist too soon)
  let noveltyScore = 1;
  if (to.artist) {
    const lastUsed = usedArtists.get(to.artist);
    if (lastUsed !== undefined) {
      const gap = usedArtists.size - lastUsed;
      if (gap < 3) noveltyScore = 0.3;
      else if (gap < 5) noveltyScore = 0.7;
    }
  }

  // 5. Vocal overlap conflict
  const fromVocalEnd = fFeats.vocalActivityCurve.slice(-3).reduce((a, b) => a + b, 0) / 3;
  const toVocalStart = tFeats.vocalActivityCurve.slice(0, 3).reduce((a, b) => a + b, 0) / 3;
  const vocalConflictScore = config.allowVocalOverlay ? 1 : 1 - (fromVocalEnd * toVocalStart);

  // Weighted sum
  const weights = {
    harmonic: config.harmonicStrictness * 0.4,
    bpm: 0.25,
    energy: 0.2,
    novelty: 0.1,
    vocal: 0.05,
  };
  
  const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0);
  const score = (
    harmonic * weights.harmonic +
    bpmScore * weights.bpm +
    energyFit * weights.energy +
    noveltyScore * weights.novelty +
    vocalConflictScore * weights.vocal
  ) / totalWeight;

  return {
    score,
    details: {
      harmonic: Math.round(harmonic * 100),
      bpm: Math.round(bpmScore * 100),
      energy: Math.round(energyFit * 100),
      novelty: Math.round(noveltyScore * 100),
      vocalConflict: Math.round(vocalConflictScore * 100),
    }
  };
}

/**
 * Choose transition type based on context
 */
function chooseTransitionType(
  from: DJTrack,
  to: DJTrack,
  risk: number,
  positionRatio: number
): TransitionType {
  const fFeats = from.features!;
  const tFeats = to.features!;
  const bpmDiff = Math.abs(fFeats.bpm - tFeats.bpm);
  const energyDiff = Math.abs(
    fFeats.energyCurve.reduce((a, b) => a + b, 0) / fFeats.energyCurve.length -
    tFeats.energyCurve.reduce((a, b) => a + b, 0) / tFeats.energyCurve.length
  );

  // Energy drop → echo out or reverb wash
  if (energyDiff > 0.4 && tFeats.energyCurve[0] < 0.4) {
    return risk > 0.5 ? 'reverb_wash' : 'echo_out';
  }

  // Energy build → loop roll
  if (energyDiff > 0.3 && tFeats.energyCurve[0] > 0.6) {
    return 'loop_roll_build';
  }

  // Large BPM difference → filter sweep
  if (bpmDiff > 4) {
    return 'filter_sweep';
  }

  // Vocal activity at transition point → stem tease
  const toVocalStart = tFeats.vocalActivityCurve[0] || 0;
  if (toVocalStart > 0.5 && risk > 0.3) {
    return 'stem_vocal_tease';
  }

  // High risk + peak → mashup
  if (risk > 0.6 && positionRatio > 0.3 && positionRatio < 0.8) {
    return 'mashup_overlay';
  }

  // Music-theory-based default selection using actual track properties
  const fromEnergy = fFeats.energyCurve.length > 0
    ? fFeats.energyCurve.reduce((a, b) => a + b, 0) / fFeats.energyCurve.length
    : undefined;
  const toEnergy = tFeats.energyCurve.length > 0
    ? tFeats.energyCurve.reduce((a, b) => a + b, 0) / tFeats.energyCurve.length
    : undefined;

  if (fromEnergy !== undefined && toEnergy !== undefined) {
    const energyDelta = Math.abs(fromEnergy - toEnergy);
    const keyCompatibility = getCamelotCompatibility(fFeats.camelot, tFeats.camelot);

    // Large energy change — smooth crossfade with EQ swap
    if (energyDelta > 0.3) return 'phrase_crossfade_eq_swap';

    // BPM difference too large for a clean cut — use filter sweep to mask tempo change
    if (bpmDiff > 4) return 'filter_sweep';

    // Harmonically compatible (same key or perfect 5th) — blend smoothly
    if (keyCompatibility > 0.7) return 'harmonic_blend' as TransitionType;

    // Both tracks at similar energy — clean phrase-boundary cut works well
    if (energyDelta < 0.1) return 'clean_cut_on_phrase';
  }

  // Property-missing fallback
  return 'phrase_crossfade_eq_swap';
}

/**
 * Assign mix role based on position in set
 */
function assignMixRole(positionRatio: number): MixRole {
  if (positionRatio < 0.12) return 'warmup';
  if (positionRatio < 0.3) return 'lift';
  if (positionRatio < 0.55) return 'peak';
  if (positionRatio < 0.7) return 'release';
  if (positionRatio < 0.88) return 'peak2';
  return 'outro';
}

/**
 * Beam search set planner
 */
function beamSearchPlan(
  tracks: DJTrack[],
  config: SetConfig,
  beamWidth: number = 20,
  riskVariation: number = 0
): { sequence: DJTrack[]; totalScore: number } {
  const targetDuration = config.duration * 60;
  const effectiveConfig = { ...config, risk: Math.min(1, Math.max(0, config.risk + riskVariation)) };
  
  // Filter tracks that have features
  const analyzedTracks = tracks.filter(t => t.features);
  if (analyzedTracks.length === 0) return { sequence: [], totalScore: 0 };
  
  // Sort by energy for better starting candidates
  const byEnergy = [...analyzedTracks].sort((a, b) => {
    const aE = a.features!.energyCurve.reduce((s, v) => s + v, 0) / a.features!.energyCurve.length;
    const bE = b.features!.energyCurve.reduce((s, v) => s + v, 0) / b.features!.energyCurve.length;
    return aE - bE;
  });
  
  // Initialize beam with individual starting tracks (low energy = good warmup)
  let beam: BeamCandidate[] = byEnergy.slice(0, Math.min(beamWidth, byEnergy.length)).map(track => ({
    sequence: [track],
    score: 0.5, // neutral start score
    totalDuration: track.durationSec || 240,
  }));
  
  // Expand beam until target duration is reached
  let iteration = 0;
  const maxIterations = 50; // safety limit
  
  while (iteration < maxIterations) {
    iteration++;
    const newBeam: BeamCandidate[] = [];
    
    for (const candidate of beam) {
      if (candidate.totalDuration >= targetDuration) {
        newBeam.push(candidate);
        continue;
      }
      
      const usedIds = new Set(candidate.sequence.map(t => t.id));
      const usedArtists = new Map<string, number>();
      candidate.sequence.forEach((t, i) => {
        if (t.artist) usedArtists.set(t.artist, i);
      });
      
      const lastTrack = candidate.sequence[candidate.sequence.length - 1];
      const positionRatio = candidate.totalDuration / targetDuration;
      
      // Score all available next tracks
      const candidates = analyzedTracks
        .filter(t => !usedIds.has(t.id))
        .map(track => {
          const { score } = scoreTransition(lastTrack, track, effectiveConfig, positionRatio, usedArtists);
          return { track, score };
        })
        .sort((a, b) => b.score - a.score)
        .slice(0, 5); // top 5 extensions per beam candidate
      
      if (candidates.length === 0) {
        // No more tracks available, end here
        newBeam.push(candidate);
        continue;
      }
      
      for (const { track, score } of candidates) {
        newBeam.push({
          sequence: [...candidate.sequence, track],
          score: (candidate.score * candidate.sequence.length + score) / (candidate.sequence.length + 1),
          totalDuration: candidate.totalDuration + (track.durationSec || 240),
        });
      }
    }
    
    // Prune beam
    newBeam.sort((a, b) => b.score - a.score);
    beam = newBeam.slice(0, beamWidth);
    
    // Check if all candidates meet duration target
    if (beam.every(c => c.totalDuration >= targetDuration)) break;
  }
  
  // Return best complete candidate
  const best = beam.reduce((a, b) => a.score > b.score ? a : b, beam[0]);
  return { sequence: best.sequence, totalScore: best.score };
}

/**
 * Compute quality scores for a planned set
 */
function computeSetScores(sequence: DJTrack[], config: SetConfig): SetScores {
  if (sequence.length < 2) {
    return { harmonicClash: 100, tempoJump: 100, vocalOverlapConflict: 100, energySmoothness: 100, transitionCleanliness: 100, novelty: 100, overall: 100 };
  }

  let harmonicSum = 0, bpmSum = 0, vocalSum = 0, energySum = 0;
  const usedArtists = new Set<string>();
  let noveltyPenalties = 0;
  
  for (let i = 0; i < sequence.length - 1; i++) {
    const from = sequence[i].features!;
    const to = sequence[i + 1].features!;
    
    harmonicSum += getCamelotCompatibility(from.camelot, to.camelot);
    
    const bpmDiff = Math.abs(from.bpm - to.bpm);
    bpmSum += Math.max(0, 1 - bpmDiff / 10);
    
    const fromVocEnd = from.vocalActivityCurve.slice(-2).reduce((a, b) => a + b, 0) / 2;
    const toVocStart = to.vocalActivityCurve.slice(0, 2).reduce((a, b) => a + b, 0) / 2;
    vocalSum += 1 - fromVocEnd * toVocStart;
    
    const fromE = from.energyCurve.reduce((a, b) => a + b, 0) / from.energyCurve.length;
    const toE = to.energyCurve.reduce((a, b) => a + b, 0) / to.energyCurve.length;
    energySum += 1 - Math.abs(fromE - toE) * 0.5;
    
    if (sequence[i + 1].artist && usedArtists.has(sequence[i + 1].artist!)) {
      noveltyPenalties++;
    }
    if (sequence[i].artist) usedArtists.add(sequence[i].artist!);
  }
  
  const n = sequence.length - 1;
  const harmonic = Math.round((harmonicSum / n) * 100);
  const tempo = Math.round((bpmSum / n) * 100);
  const vocal = Math.round((vocalSum / n) * 100);
  const energy = Math.round((energySum / n) * 100);
  const transition = Math.round(((harmonic + tempo) / 2));
  const novelty = Math.round(Math.max(0, 100 - (noveltyPenalties / n) * 50));
  const overall = Math.round((harmonic * 0.25 + tempo * 0.2 + vocal * 0.1 + energy * 0.2 + transition * 0.15 + novelty * 0.1));

  return {
    harmonicClash: harmonic,
    tempoJump: tempo,
    vocalOverlapConflict: vocal,
    energySmoothness: energy,
    transitionCleanliness: transition,
    novelty,
    overall,
  };
}

/**
 * Generate 3 set variations using beam search
 */
/**
 * Build a single GeneratedSet from a beam search result
 */
function buildGeneratedSet(
  sequence: DJTrack[],
  config: SetConfig,
  label: string,
  riskOffset: number,
  isStemmed: boolean = false
): GeneratedSet {
  const effectiveRisk = Math.min(1, Math.max(0, config.risk + riskOffset));

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  let time = 0;
  const totalDuration = sequence.reduce((s, t) => s + (t.durationSec || 240), 0);
  const items: PerformancePlanItem[] = [];

  for (let i = 0; i < sequence.length; i++) {
    const track = sequence[i];
    const dur = track.durationSec || 240;
    const positionRatio = time / totalDuration;

    items.push({
      itemId: crypto.randomUUID(),
      type: 'track',
      trackId: track.id,
      trackTitle: track.title,
      trackArtist: track.artist,
      mixRole: assignMixRole(positionRatio),
      startTimeSec: time,
      durationSec: dur,
    });

    if (i < sequence.length - 1) {
      const transType = chooseTransitionType(track, sequence[i + 1], effectiveRisk, positionRatio);
      const transitionBars = transType === 'clean_cut_on_phrase' ? 4
        : transType === 'mashup_overlay' ? 32
        : 16;

      items.push({
        itemId: crypto.randomUUID(),
        type: 'transition',
        transitionType: transType,
        bars: transitionBars,
        startTimeSec: time + dur - (transitionBars * 60 / (track.features?.bpm || 120)),
        durationSec: transitionBars * 60 / (track.features?.bpm || 120),
      });
    }

    time += dur;
  }

  const scores = computeSetScores(sequence, config);

  // If stemmed, boost transition cleanliness score (per-stem crossfade is inherently cleaner)
  if (isStemmed) {
    scores.transitionCleanliness = Math.min(100, Math.round(scores.transitionCleanliness * 1.15));
    scores.vocalOverlapConflict = Math.min(100, Math.round(scores.vocalOverlapConflict * 1.2));
    scores.overall = Math.round(
      scores.harmonicClash * 0.25 + scores.tempoJump * 0.2 + scores.vocalOverlapConflict * 0.1 +
      scores.energySmoothness * 0.2 + scores.transitionCleanliness * 0.15 + scores.novelty * 0.1
    );
  }

  const energyCurve: number[] = [];
  const arcFn = ENERGY_ARCS[config.preset] || ENERGY_ARCS.balanced;
  for (let i = 0; i < 30; i++) {
    const t = i / 29;
    const trackIdx = Math.floor(t * sequence.length);
    const actualTrack = sequence[Math.min(trackIdx, sequence.length - 1)];
    const actualEnergy = actualTrack.features
      ? actualTrack.features.energyCurve.reduce((a, b) => a + b, 0) / actualTrack.features.energyCurve.length
      : 0.5;
    const targetEnergy = arcFn(t);
    energyCurve.push(actualEnergy * 0.6 + targetEnergy * 0.4);
  }

  const tracklist = sequence.map((t, i) => ({
    time: formatTime(items.filter(it => it.type === 'track')[i]?.startTimeSec || 0),
    title: t.title,
    artist: t.artist,
    bpm: Math.round(t.features?.bpm || 120),
    key: t.features?.key || 'Unknown',
  }));

  return {
    planId: crypto.randomUUID(),
    name: `${label} Mix — ${PRESET_INFO[config.preset].label}`,
    preset: config.preset,
    durationSec: time,
    items,
    scores,
    energyCurve,
    tracklist,
    isStemmed,
  };
}

/**
 * Generate 3 set variations (Safe, Balanced, Wild) using beam search.
 * Optionally generates a 4th "Stemmed" variation when stem mode is enabled
 * and tracks have stems attached.
 */
export function planSets(tracks: DJTrack[], config: SetConfig): GeneratedSet[] {
  const variations = [
    { label: 'Safe', riskOffset: -config.risk * 0.5 },
    { label: 'Balanced', riskOffset: 0 },
    { label: 'Wild', riskOffset: Math.min(0.4, (1 - config.risk) * 0.6) },
  ];

  const sets = variations.map(({ label, riskOffset }) => {
    const { sequence } = beamSearchPlan(tracks, config, 20, riskOffset);
    return buildGeneratedSet(sequence, config, label, riskOffset, false);
  });

  // 4th variation: Stemmed (uses balanced risk, but marked as stemmed)
  if (config.enableStemMode) {
    const stemmedTracks = tracks.filter(t => t.stems && Object.values(t.stems).some(Boolean));
    if (stemmedTracks.length >= 3) {
      const { sequence } = beamSearchPlan(tracks, config, 20, 0);
      const stemmedSet = buildGeneratedSet(sequence, config, 'Stemmed', 0, true);
      sets.push(stemmedSet);
      console.log(`[DJ Planner] 🎛️ Stemmed variation generated with ${stemmedTracks.length} stem-separated tracks`);
    } else {
      console.warn(`[DJ Planner] ⚠️ Stem mode enabled but only ${stemmedTracks.length} tracks have stems (need 3+)`);
    }
  }

  return sets;
}
