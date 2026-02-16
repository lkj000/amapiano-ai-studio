/**
 * Extend Engine — Track Extension & DJ Mix Continuation
 * 
 * Two modes:
 * 1. Track Extend: Detect optimal loop points in a track, extend via crossfade looping
 * 2. Mix Extend: Resume beam search from the last track in a set, continuing the energy arc
 */

import {
  analyzeAudioFromUrl,
  type AnalysisResult,
} from './SharedAnalysisPipeline';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface LoopPoint {
  startSec: number;
  endSec: number;
  lengthSec: number;
  lengthBars: number;
  confidence: number;
  energy: number;
}

export interface TrackExtendResult {
  originalDurationSec: number;
  extendedDurationSec: number;
  loopPoints: LoopPoint[];
  selectedLoop: LoopPoint;
  loopCount: number;
  crossfadeSec: number;
}

export interface MixExtendSuggestion {
  trackId: string;
  trackTitle: string;
  trackArtist?: string;
  score: number;
  harmonicMatch: number;
  bpmDelta: number;
  energyFit: number;
  suggestedTransition: string;
}

export interface MixExtendResult {
  suggestions: MixExtendSuggestion[];
  continuationEnergyCurve: number[];
  extendedDurationSec: number;
}

// ─── Track Extend ────────────────────────────────────────────────────────────

/**
 * Detect optimal loop points in an audio track using energy analysis.
 * Finds segments with stable energy that align to musical phrase boundaries.
 */
export function detectLoopPoints(
  energyCurve: number[],
  durationSec: number,
  bpm: number,
  segments: { type: string; startSec: number; endSec: number; energy: number }[]
): LoopPoint[] {
  const beatDuration = 60 / bpm;
  const barDuration = beatDuration * 4;
  const loopPoints: LoopPoint[] = [];

  // Strategy 1: Use segment boundaries (drop, verse, breakdown)
  const loopableSegments = segments.filter(
    s => ['drop', 'verse', 'breakdown'].includes(s.type) && (s.endSec - s.startSec) >= barDuration * 4
  );

  for (const seg of loopableSegments) {
    const segDuration = seg.endSec - seg.startSec;
    // Try 4-bar, 8-bar, and 16-bar loops within the segment
    for (const bars of [4, 8, 16]) {
      const loopLen = barDuration * bars;
      if (loopLen > segDuration) continue;

      // Find the most energy-stable region within this segment
      const binDuration = durationSec / energyCurve.length;
      const startBin = Math.floor(seg.startSec / binDuration);
      const endBin = Math.min(energyCurve.length - 1, Math.floor(seg.endSec / binDuration));
      const loopBins = Math.ceil(loopLen / binDuration);

      let bestStart = startBin;
      let bestVariance = Infinity;

      for (let i = startBin; i + loopBins <= endBin; i++) {
        const window = energyCurve.slice(i, i + loopBins);
        const mean = window.reduce((a, b) => a + b, 0) / window.length;
        const variance = window.reduce((a, b) => a + (b - mean) ** 2, 0) / window.length;
        if (variance < bestVariance) {
          bestVariance = variance;
          bestStart = i;
        }
      }

      const startSec = bestStart * binDuration;
      const avgEnergy = energyCurve.slice(bestStart, bestStart + loopBins)
        .reduce((a, b) => a + b, 0) / loopBins;

      // Confidence based on energy stability (low variance = good loop)
      const confidence = Math.max(0, Math.min(1, 1 - bestVariance * 10));

      loopPoints.push({
        startSec: Math.round(startSec * 100) / 100,
        endSec: Math.round((startSec + loopLen) * 100) / 100,
        lengthSec: Math.round(loopLen * 100) / 100,
        lengthBars: bars,
        confidence,
        energy: Math.round(avgEnergy * 100) / 100,
      });
    }
  }

  // Strategy 2: Sliding window fallback if no segments found
  if (loopPoints.length === 0) {
    const binDuration = durationSec / energyCurve.length;
    for (const bars of [8, 16]) {
      const loopLen = barDuration * bars;
      const loopBins = Math.ceil(loopLen / binDuration);
      if (loopBins >= energyCurve.length) continue;

      let bestStart = 0;
      let bestVariance = Infinity;
      for (let i = 0; i + loopBins < energyCurve.length; i++) {
        const window = energyCurve.slice(i, i + loopBins);
        const mean = window.reduce((a, b) => a + b, 0) / window.length;
        const variance = window.reduce((a, b) => a + (b - mean) ** 2, 0) / window.length;
        if (variance < bestVariance) {
          bestVariance = variance;
          bestStart = i;
        }
      }

      const startSec = bestStart * binDuration;
      const avgEnergy = energyCurve.slice(bestStart, bestStart + loopBins)
        .reduce((a, b) => a + b, 0) / loopBins;

      loopPoints.push({
        startSec: Math.round(startSec * 100) / 100,
        endSec: Math.round((startSec + loopLen) * 100) / 100,
        lengthSec: Math.round(loopLen * 100) / 100,
        lengthBars: bars,
        confidence: Math.max(0, 1 - bestVariance * 10),
        energy: Math.round(avgEnergy * 100) / 100,
      });
    }
  }

  // Sort by confidence descending
  return loopPoints.sort((a, b) => b.confidence - a.confidence);
}

/**
 * Calculate how many loops are needed and what crossfade to use
 * to extend a track to a target duration.
 */
export function computeTrackExtension(
  originalDurationSec: number,
  targetDurationSec: number,
  loopPoints: LoopPoint[]
): TrackExtendResult {
  if (loopPoints.length === 0) {
    throw new Error('No loop points detected — cannot extend track');
  }

  const selectedLoop = loopPoints[0]; // highest confidence
  const neededExtra = targetDurationSec - originalDurationSec;
  const crossfadeSec = Math.min(2, selectedLoop.lengthSec * 0.1); // 10% of loop or 2s max
  const effectiveLoopLen = selectedLoop.lengthSec - crossfadeSec;
  const loopCount = Math.max(1, Math.ceil(neededExtra / effectiveLoopLen));
  const extendedDuration = originalDurationSec + loopCount * effectiveLoopLen;

  return {
    originalDurationSec,
    extendedDurationSec: Math.round(extendedDuration * 100) / 100,
    loopPoints,
    selectedLoop,
    loopCount,
    crossfadeSec: Math.round(crossfadeSec * 100) / 100,
  };
}

/**
 * Full track extend pipeline: analyze → detect loops → compute extension
 */
export async function extendTrack(
  fileUrl: string,
  targetDurationSec: number
): Promise<TrackExtendResult> {
  const analysis: AnalysisResult = await analyzeAudioFromUrl(fileUrl, {
    maxAnalysisDurationSec: 60,
    decodeSampleRate: 22050,
    numBins: 64,
    includeGenre: false,
  });

  const loopPoints = detectLoopPoints(
    analysis.energyCurve,
    analysis.durationSec,
    analysis.bpm,
    analysis.segments
  );

  return computeTrackExtension(analysis.durationSec, targetDurationSec, loopPoints);
}

// ─── Mix Extend ──────────────────────────────────────────────────────────────

/**
 * Given the last track in a set and a pool of available tracks,
 * score and rank candidates for continuing the mix.
 * Uses the same scoring dimensions as DJSetPlanner beam search.
 */
export function scoreMixExtendCandidates(
  lastTrack: {
    bpm: number;
    camelot: string;
    energy: number;
    artist?: string;
  },
  candidates: {
    id: string;
    title: string;
    artist?: string;
    bpm: number;
    camelot: string;
    energy: number;
    vocalStart: number;
  }[],
  usedTrackIds: Set<string>,
  usedArtists: Set<string>,
  targetEnergy: number,
  maxBpmDelta: number = 6
): MixExtendSuggestion[] {
  // Camelot compatibility (import-free inline for portability)
  const camelotCompat = (a: string, b: string): number => {
    if (!a || !b) return 0.5;
    const numA = parseInt(a), numB = parseInt(b);
    const letterA = a.slice(-1), letterB = b.slice(-1);
    if (a === b) return 1.0;
    if (numA === numB && letterA !== letterB) return 0.9; // relative major/minor
    const diff = Math.abs(numA - numB);
    if (letterA === letterB && (diff === 1 || diff === 11)) return 0.85; // adjacent
    if (diff <= 2) return 0.6;
    return 0.3;
  };

  // Separate unused and used candidates — prefer unused but allow used with penalty
  const unused = candidates.filter(c => !usedTrackIds.has(c.id));
  const pool = unused.length > 0 ? unused : candidates; // Fallback to all if pool exhausted

  return pool
    .map(candidate => {
      const harmonicMatch = camelotCompat(lastTrack.camelot, candidate.camelot);
      const bpmDelta = Math.abs(lastTrack.bpm - candidate.bpm);
      const bpmScore = bpmDelta <= maxBpmDelta ? 1 - (bpmDelta / maxBpmDelta) * 0.3 : Math.max(0, 1 - bpmDelta / 20);
      const energyFit = 1 - Math.abs(targetEnergy - candidate.energy);
      const novelty = candidate.artist && usedArtists.has(candidate.artist) ? 0.5 : 1;
      const reusepenalty = usedTrackIds.has(candidate.id) ? 0.7 : 1; // Penalize reuse

      const score = (harmonicMatch * 0.4 + bpmScore * 0.25 + energyFit * 0.2 + novelty * 0.15) * reusepenalty;

      // Suggest transition type
      const energyDiff = candidate.energy - lastTrack.energy;
      let suggestedTransition = 'phrase_crossfade_eq_swap';
      if (energyDiff > 0.3) suggestedTransition = 'loop_roll_build';
      else if (energyDiff < -0.3) suggestedTransition = 'echo_out';
      else if (bpmDelta > 4) suggestedTransition = 'filter_sweep';
      else if (candidate.vocalStart > 0.5) suggestedTransition = 'stem_vocal_tease';

      return {
        trackId: candidate.id,
        trackTitle: candidate.title,
        trackArtist: candidate.artist,
        score: Math.round(score * 100) / 100,
        harmonicMatch: Math.round(harmonicMatch * 100),
        bpmDelta: Math.round(bpmDelta * 10) / 10,
        energyFit: Math.round(energyFit * 100),
        suggestedTransition,
      };
    })
    .sort((a, b) => b.score - a.score);
}

/**
 * Generate an energy continuation curve from the end of the current set.
 * Predicts what the next N minutes of energy should look like based on
 * the preset's arc function.
 */
export function generateContinuationCurve(
  currentSetEnergyCurve: number[],
  additionalMinutes: number,
  preset: string
): number[] {
  // Simple extension: project the arc from current position forward
  const totalPoints = currentSetEnergyCurve.length;
  const extraPoints = Math.max(5, Math.ceil(totalPoints * (additionalMinutes / 30)));
  const continuation: number[] = [];

  // Use the tail slope to project forward
  const tail = currentSetEnergyCurve.slice(-5);
  const avgTailSlope = tail.length > 1
    ? (tail[tail.length - 1] - tail[0]) / (tail.length - 1)
    : 0;

  let lastEnergy = currentSetEnergyCurve[currentSetEnergyCurve.length - 1] || 0.5;

  for (let i = 0; i < extraPoints; i++) {
    // Gradually trend toward 0.3 (cooldown) with some of the existing slope
    const ratio = i / extraPoints;
    const targetEnd = 0.3;
    const projected = lastEnergy + avgTailSlope * 0.5;
    const blended = projected * (1 - ratio) + targetEnd * ratio;
    const clamped = Math.max(0.1, Math.min(1, blended));
    continuation.push(Math.round(clamped * 100) / 100);
    lastEnergy = clamped;
  }

  return continuation;
}
