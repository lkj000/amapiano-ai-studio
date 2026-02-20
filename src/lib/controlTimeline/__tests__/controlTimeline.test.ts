/**
 * ControlTimeline system unit tests
 * 
 * Test 1: Resample anchors endpoints
 * Test 2: Sections normalize + fill
 * Test 3: Round-trip sanity (CTL → DAW → CTL)
 */

import { describe, it, expect } from 'vitest';
import { dawToControlTimeline, type DAWMarker, type DAWAutomationLane } from '../dawToControlTimeline';
import { controlTimelineToDAW } from '../controlTimelineToDaw';
import { planControlTimeline } from '../planner';
import { normalizeSections, ControlTimelineV1Schema } from '../controlTimeline.zod';
import type { ControlTimelineSection } from '../controlTimeline';
import type { TransportState, ProjectState } from '@/stores/dawStore';

// ============ Helpers ============

function makeTransport(bpm = 113) {
  return {
    bpm,
    isPlaying: false,
    isPaused: false,
    isRecording: false,
    currentBeat: 0,
    currentStep: 0,
    currentBar: 0,
    loopEnabled: false,
    loopStart: 0,
    loopEnd: 0,
    metronomeEnabled: false,
  } as TransportState;
}

function makeProject(bpm = 113) {
  return {
    name: 'Test Project',
    bpm,
    key: 'C',
    scale: 'minor' as const,
    timeSignature: { numerator: 4, denominator: 4 },
  } as ProjectState;
}

// ============ Test 1: Resample anchors endpoints ============

describe('Resample anchors endpoints', () => {
  it('curve[0] and curve[end] match endpoint-extended values when points are only in the middle', () => {
    const transport = makeTransport(120);
    const project = makeProject(120);
    
    // Single point at beat 8 (= 4 seconds at 120bpm), value 0.7
    const lanes: DAWAutomationLane[] = [
      {
        parameterName: 'energy',
        points: [{ time: 8, value: 0.7 }],
      },
    ];

    const ctl = dawToControlTimeline({
      transport,
      project,
      durationBars: 8, // 32 beats = 16 seconds = 800 frames
      automationLanes: lanes,
    });

    // Endpoint extension: first and last frame should equal the nearest point value
    expect(ctl.curves.energy[0]).toBeCloseTo(0.7, 2);
    expect(ctl.curves.energy[ctl.curves.energy.length - 1]).toBeCloseTo(0.7, 2);
    expect(ctl.curves.energy).toHaveLength(ctl.duration_frames);
  });

  it('all curves have length === duration_frames', () => {
    const ctl = dawToControlTimeline({
      transport: makeTransport(),
      project: makeProject(),
      durationBars: 16,
    });

    expect(ctl.curves.energy).toHaveLength(ctl.duration_frames);
    expect(ctl.curves.log_drum_density).toHaveLength(ctl.duration_frames);
    expect(ctl.curves.perc_density).toHaveLength(ctl.duration_frames);
    expect(ctl.curves.pad_warmth).toHaveLength(ctl.duration_frames);
    expect(ctl.curves.bass_presence).toHaveLength(ctl.duration_frames);
  });

  it('curve values are always in [0, 1] even with extreme inputs', () => {
    const lanes: DAWAutomationLane[] = [
      {
        parameterName: 'energy',
        points: [
          { time: 0, value: -5 },
          { time: 4, value: 999 },
        ],
      },
    ];

    const ctl = dawToControlTimeline({
      transport: makeTransport(120),
      project: makeProject(120),
      durationBars: 4,
      automationLanes: lanes,
    });

    for (const v of ctl.curves.energy) {
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(1);
      expect(Number.isFinite(v)).toBe(true);
    }
  });
});

// ============ Test 2: Sections normalize + fill ============

describe('Sections normalize + fill', () => {
  it('fills gaps and trims overlaps to cover full duration', () => {
    const durationFrames = 1000;
    const sections: ControlTimelineSection[] = [
      { start_frame: 100, end_frame: 400, label: 'verse' },
      { start_frame: 350, end_frame: 700, label: 'chorus' }, // overlaps previous
      // gap from 700 to 1000
    ];

    const normalized = normalizeSections(sections, durationFrames, 'verse');

    // First section starts at 0
    expect(normalized[0].start_frame).toBe(0);
    // Last section ends at duration
    expect(normalized[normalized.length - 1].end_frame).toBe(durationFrames);

    // No overlaps
    for (let i = 1; i < normalized.length; i++) {
      expect(normalized[i].start_frame).toBeGreaterThanOrEqual(normalized[i - 1].end_frame);
    }

    // No zero-length sections
    for (const s of normalized) {
      expect(s.end_frame).toBeGreaterThan(s.start_frame);
    }
  });

  it('handles empty sections array', () => {
    const normalized = normalizeSections([], 500, 'verse');
    expect(normalized).toHaveLength(1);
    expect(normalized[0]).toEqual({ start_frame: 0, end_frame: 500, label: 'verse' });
  });

  it('handles out-of-bounds sections', () => {
    const sections: ControlTimelineSection[] = [
      { start_frame: -50, end_frame: 200, label: 'intro' },
      { start_frame: 800, end_frame: 1500, label: 'outro' },
    ];

    const normalized = normalizeSections(sections, 1000, 'verse');

    expect(normalized[0].start_frame).toBe(0);
    expect(normalized[normalized.length - 1].end_frame).toBe(1000);

    for (const s of normalized) {
      expect(s.start_frame).toBeGreaterThanOrEqual(0);
      expect(s.end_frame).toBeLessThanOrEqual(1000);
    }
  });
});

// ============ Test 3: Round-trip sanity ============

describe('Round-trip CTL → DAW → CTL', () => {
  it('preserves section count and labels', () => {
    const markers: DAWMarker[] = [
      { positionBeats: 0, label: 'intro' },
      { positionBeats: 16, label: 'verse' },
      { positionBeats: 48, label: 'chorus' },
      { positionBeats: 80, label: 'outro' },
    ];

    const original = dawToControlTimeline({
      transport: makeTransport(120),
      project: makeProject(120),
      durationBars: 24,
      markers,
    });

    const dawState = controlTimelineToDAW(original);

    // Section count preserved as marker count
    expect(dawState.markers).toHaveLength(original.sections.length);

    // Labels preserved
    const originalLabels = original.sections.map((s) => s.label);
    const roundTripLabels = dawState.markers.map((m) => m.label);
    expect(roundTripLabels).toEqual(originalLabels);
  });

  it('curve averages are within tolerance after round-trip', () => {
    const original = dawToControlTimeline({
      transport: makeTransport(113),
      project: makeProject(113),
      durationBars: 32,
    });

    const dawState = controlTimelineToDAW(original);
    const avgOriginal = original.curves.energy.reduce((a, b) => a + b, 0) / original.curves.energy.length;

    // The DAW automation lane points should represent a similar average
    const laneEnergy = dawState.automationLanes.find((l) => l.parameterName === 'energy');
    expect(laneEnergy).toBeDefined();

    const avgLane = laneEnergy!.points.reduce((a, p) => a + p.value, 0) / laneEnergy!.points.length;
    expect(Math.abs(avgOriginal - avgLane)).toBeLessThan(0.05);
  });

  it('BPM is preserved exactly', () => {
    const original = dawToControlTimeline({
      transport: makeTransport(128),
      project: makeProject(128),
      durationBars: 16,
    });

    const dawState = controlTimelineToDAW(original);
    expect(dawState.bpm).toBe(128);
  });
});

// ============ Test 4: Planner determinism ============

describe('Planner produces valid CTL', () => {
  it('works with empty prompt', () => {
    const ctl = planControlTimeline({ prompt: '' });
    const result = ControlTimelineV1Schema.safeParse(ctl);
    expect(result.success).toBe(true);
  });

  it('is deterministic (same prompt = same output)', () => {
    const a = planControlTimeline({ prompt: 'dark amapiano drop', seed: 42 });
    const b = planControlTimeline({ prompt: 'dark amapiano drop', seed: 42 });
    expect(a.sections).toEqual(b.sections);
    expect(a.curves.energy).toEqual(b.curves.energy);
    expect(a.global.genre).toEqual(b.global.genre);
  });

  it('all curves are within [0, 1] with no NaN', () => {
    const ctl = planControlTimeline({ prompt: 'energetic afro house club banger', durationSeconds: 120 });
    const allCurves = [
      ctl.curves.energy,
      ctl.curves.log_drum_density,
      ctl.curves.perc_density,
      ctl.curves.pad_warmth,
      ctl.curves.bass_presence,
    ];
    for (const curve of allCurves) {
      for (const v of curve) {
        expect(v).toBeGreaterThanOrEqual(0);
        expect(v).toBeLessThanOrEqual(1);
        expect(Number.isFinite(v)).toBe(true);
      }
    }
  });
});

// ============ Test 5: Curve length mismatch throws ============

describe('Schema rejects curve length mismatch', () => {
  it('throws when energy length !== duration_frames', () => {
    const ctl = planControlTimeline({ prompt: 'test', durationSeconds: 10 });
    // Corrupt the energy curve to be 1 frame short
    const bad = { ...ctl, curves: { ...ctl.curves, energy: ctl.curves.energy.slice(0, -1) } };
    const result = ControlTimelineV1Schema.safeParse(bad);
    expect(result.success).toBe(false);
  });
});
