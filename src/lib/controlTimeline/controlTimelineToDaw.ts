/**
 * ControlTimeline → DAW Mapper (Round-trip)
 * 
 * Converts a ControlTimelineV1 back into DAW-compatible structures
 * for loading a CTL as project state.
 */

import type {
  ControlTimelineV1,
  SectionLabel,
} from './controlTimeline';
import { framesToSeconds } from './controlTimeline';
import type { DAWMarker, DAWAutomationPoint, DAWAutomationLane } from './dawToControlTimeline';

// ============ Output Interfaces ============

export interface CTLToDAWResult {
  bpm: number;
  key: string;
  scale: 'major' | 'minor';
  durationSeconds: number;
  durationBars: number;
  markers: DAWMarker[];
  automationLanes: DAWAutomationLane[];
  genre: string;
  mixProfile: string;
  swing: number;
}

// ============ Helpers ============

function frameToBeats(frame: number, bpm: number): number {
  const seconds = frame / 50;
  return (seconds / 60) * bpm;
}

function parseKey(keyStr?: string): { key: string; scale: 'major' | 'minor' } {
  if (!keyStr) return { key: 'C', scale: 'minor' };
  const match = keyStr.match(/^([A-G](?:#|b)?)(maj|min)$/);
  if (!match) return { key: 'C', scale: 'minor' };
  return {
    key: match[1],
    scale: match[2] === 'maj' ? 'major' : 'minor',
  };
}

/**
 * Downsample a 50Hz curve to sparse automation points at ~1Hz.
 * Keeps point count bounded: max ~durationSeconds points + 1 endpoint.
 */
function curveToAutomationPoints(
  curve: number[],
  bpm: number,
): DAWAutomationPoint[] {
  if (curve.length === 0) return [];

  const FR = 50;
  const totalFrames = curve.length;
  // 1Hz = one point per second = every 50 frames
  const step = Math.max(1, FR);
  const points: DAWAutomationPoint[] = [];

  for (let f = 0; f < totalFrames; f += step) {
    points.push({
      time: frameToBeats(f, bpm),
      value: curve[f],
    });
  }

  // Always include last frame
  const lastFrame = totalFrames - 1;
  const lastTime = frameToBeats(lastFrame, bpm);
  if (points.length === 0 || points[points.length - 1].time < lastTime) {
    points.push({
      time: lastTime,
      value: curve[lastFrame],
    });
  }

  return points;
}

// ============ Main Mapper ============

/**
 * Convert a ControlTimelineV1 into DAW-compatible state.
 */
export function controlTimelineToDAW(ctl: ControlTimelineV1): CTLToDAWResult {
  const bpm = ctl.global.bpm;
  const durationSeconds = framesToSeconds(ctl.duration_frames);

  // Beats & bars
  const totalBeats = (durationSeconds / 60) * bpm;
  const durationBars = Math.ceil(totalBeats / 4); // assumes 4/4

  // Key
  const { key, scale } = parseKey(ctl.global.key);

  // Markers from sections
  const markers: DAWMarker[] = ctl.sections.map((s) => ({
    positionBeats: frameToBeats(s.start_frame, bpm),
    label: s.label,
  }));

  // Automation lanes from curves
  const automationLanes: DAWAutomationLane[] = [];
  const curveEntries: [string, number[]][] = [
    ['energy', ctl.curves.energy],
    ['log_drum_density', ctl.curves.log_drum_density],
    ['perc_density', ctl.curves.perc_density],
    ['pad_warmth', ctl.curves.pad_warmth],
    ['bass_presence', ctl.curves.bass_presence],
  ];

  if (ctl.curves.vocal_presence) {
    curveEntries.push(['vocal_presence', ctl.curves.vocal_presence]);
  }

  for (const [name, curve] of curveEntries) {
    automationLanes.push({
      parameterName: name,
      points: curveToAutomationPoints(curve, bpm),
    });
  }

  return {
    bpm,
    key,
    scale,
    durationSeconds,
    durationBars,
    markers,
    automationLanes,
    genre: ctl.global.genre,
    mixProfile: ctl.global.mix_profile,
    swing: ctl.global.swing,
  };
}
