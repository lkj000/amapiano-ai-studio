import { describe, it, expect } from 'vitest';
import {
  detectLoopPoints,
  computeTrackExtension,
  scoreMixExtendCandidates,
  generateContinuationCurve,
} from '../ExtendEngine';

describe('detectLoopPoints', () => {
  const bpm = 120;
  const durationSec = 60;

  it('finds loop points from segments', () => {
    // 64 bins over 60s → ~0.94s per bin
    const energyCurve = Array.from({ length: 64 }, () => 0.5 + Math.random() * 0.05);
    const segments = [
      { type: 'drop', startSec: 10, endSec: 40, energy: 0.7 },
    ];

    const loops = detectLoopPoints(energyCurve, durationSec, bpm, segments);
    expect(loops.length).toBeGreaterThan(0);
    expect(loops[0]).toHaveProperty('startSec');
    expect(loops[0]).toHaveProperty('lengthBars');
    expect(loops[0].confidence).toBeGreaterThanOrEqual(0);
    expect(loops[0].confidence).toBeLessThanOrEqual(1);
  });

  it('uses sliding window fallback when no segments match', () => {
    const energyCurve = Array.from({ length: 64 }, (_, i) => 0.5);
    const segments = [{ type: 'intro', startSec: 0, endSec: 5, energy: 0.3 }];

    const loops = detectLoopPoints(energyCurve, durationSec, bpm, segments);
    expect(loops.length).toBeGreaterThan(0);
  });

  it('returns empty for very short energy curves', () => {
    const loops = detectLoopPoints([0.5], 1, bpm, []);
    expect(loops.length).toBe(0);
  });
});

describe('computeTrackExtension', () => {
  it('calculates correct loop count and extended duration', () => {
    const loopPoints = [
      { startSec: 10, endSec: 18, lengthSec: 8, lengthBars: 4, confidence: 0.9, energy: 0.6 },
    ];
    const result = computeTrackExtension(60, 90, loopPoints);

    expect(result.originalDurationSec).toBe(60);
    expect(result.extendedDurationSec).toBeGreaterThanOrEqual(90);
    expect(result.loopCount).toBeGreaterThanOrEqual(1);
    expect(result.selectedLoop).toBe(loopPoints[0]);
  });

  it('throws when no loop points provided', () => {
    expect(() => computeTrackExtension(60, 90, [])).toThrow('No loop points');
  });
});

describe('scoreMixExtendCandidates', () => {
  const lastTrack = { bpm: 120, camelot: '8A', energy: 0.7 };
  const candidates = [
    { id: '1', title: 'Track A', artist: 'Art1', bpm: 121, camelot: '8A', energy: 0.75, vocalStart: 0.2 },
    { id: '2', title: 'Track B', artist: 'Art2', bpm: 130, camelot: '3B', energy: 0.3, vocalStart: 0.8 },
  ];

  it('ranks harmonically compatible tracks higher', () => {
    const results = scoreMixExtendCandidates(
      lastTrack, candidates, new Set(), new Set(), 0.7
    );
    expect(results.length).toBe(2);
    expect(results[0].trackId).toBe('1');
    expect(results[0].score).toBeGreaterThan(results[1].score);
  });

  it('filters out used tracks', () => {
    const results = scoreMixExtendCandidates(
      lastTrack, candidates, new Set(['1']), new Set(), 0.7
    );
    expect(results.length).toBe(1);
    expect(results[0].trackId).toBe('2');
  });

  it('penalizes repeated artists', () => {
    const withArtist = scoreMixExtendCandidates(
      lastTrack, candidates, new Set(), new Set(['Art1']), 0.7
    );
    const withoutArtist = scoreMixExtendCandidates(
      lastTrack, candidates, new Set(), new Set(), 0.7
    );
    const scoreWith = withArtist.find(r => r.trackId === '1')!.score;
    const scoreWithout = withoutArtist.find(r => r.trackId === '1')!.score;
    expect(scoreWith).toBeLessThan(scoreWithout);
  });
});

describe('generateContinuationCurve', () => {
  it('returns an array trending toward cooldown', () => {
    const existing = [0.3, 0.5, 0.7, 0.8, 0.85, 0.9];
    const curve = generateContinuationCurve(existing, 10, 'balanced');
    expect(curve.length).toBeGreaterThan(0);
    // Should trend down toward 0.3
    expect(curve[curve.length - 1]).toBeLessThan(curve[0]);
  });
});
