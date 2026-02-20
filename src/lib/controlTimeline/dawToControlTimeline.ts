/**
 * DAW → ControlTimeline Mapper
 * 
 * Converts the AURA-X DAW state (Zustand store + track data)
 * into a valid ControlTimelineV1 for generation, automation, and dataset logging.
 */

import type {
  ControlTimelineV1,
  ControlTimelineSection,
  ControlTimelineCurves,
  SectionLabel,
  GenreId,
  MixProfile,
} from './controlTimeline';
import { beatsToFrames, constantCurve, linearRamp } from './controlTimeline';
import { normalizeSections, ControlTimelineV1Schema } from './controlTimeline.zod';
import { getGrooveForGenre } from './groovePresets';
import { sanitizeCurve } from './utils';
import type { TransportState, ProjectState } from '@/stores/dawStore';

// ============ Input Interfaces ============

/** A marker on the DAW timeline (from arrangement view) */
export interface DAWMarker {
  /** Position in beats */
  positionBeats: number;
  /** Label string — will be mapped to SectionLabel */
  label: string;
}

/** A single automation point from a DAW lane */
export interface DAWAutomationPoint {
  /** Time in beats */
  time: number;
  /** Value 0..1 */
  value: number;
}

/** Named automation lane from the DAW */
export interface DAWAutomationLane {
  /** Parameter name: 'energy', 'log_drum_density', 'volume', etc. */
  parameterName: string;
  points: DAWAutomationPoint[];
}

/** Configuration passed into the mapper */
export interface DAWToCTLOptions {
  transport: TransportState;
  project: ProjectState;
  /** Duration of the project in bars */
  durationBars: number;
  /** Arrangement markers / section labels */
  markers?: DAWMarker[];
  /** Automation lanes to convert to curves */
  automationLanes?: DAWAutomationLane[];
  /** Override genre (otherwise inferred from project) */
  genre?: GenreId;
  /** Override mix profile */
  mixProfile?: MixProfile;
  /** Codec identifier */
  codecId?: string;
  /** Random seed */
  seed?: number;
}

// ============ Label Mapping ============

const LABEL_MAP: Record<string, SectionLabel> = {
  intro: 'intro',
  verse: 'verse',
  pre: 'pre',
  'pre-chorus': 'pre',
  prechorus: 'pre',
  chorus: 'chorus',
  hook: 'chorus',
  break: 'break',
  breakdown: 'break',
  drop: 'drop',
  outro: 'outro',
  ending: 'outro',
  bridge: 'break',
};

function mapLabel(raw: string): SectionLabel {
  const key = raw.toLowerCase().trim();
  return LABEL_MAP[key] ?? 'verse';
}

// ============ Curve Resampling ============

/**
 * Resample sparse automation points to a fixed-length 50Hz curve.
 * Points are in beats; output is in frames.
 */
function resampleLane(
  points: DAWAutomationPoint[],
  bpm: number,
  totalFrames: number,
  defaultValue: number = 0.5
): number[] {
  if (points.length === 0) {
    return constantCurve(totalFrames, defaultValue);
  }

  // Sort by time
  const sorted = [...points].sort((a, b) => a.time - b.time);

  // Extend endpoints: anchor first point back to t=0, last point to end
  const endBeats = ((totalFrames - 1) / 50 / 60) * bpm;
  if (sorted[0].time > 0) {
    sorted.unshift({ time: 0, value: sorted[0].value });
  }
  if (sorted[sorted.length - 1].time < endBeats) {
    sorted.push({ time: endBeats, value: sorted[sorted.length - 1].value });
  }

  const curve: number[] = new Array(totalFrames);
  let j = 0;

  for (let f = 0; f < totalFrames; f++) {
    const timeSec = f / 50;
    const timeBeats = (timeSec / 60) * bpm;

    // Advance index
    while (j + 1 < sorted.length && sorted[j + 1].time < timeBeats) j++;

    const a = sorted[j];
    const b = sorted[Math.min(sorted.length - 1, j + 1)];

    if (a.time === b.time) {
      curve[f] = a.value;
    } else {
      const t = (timeBeats - a.time) / (b.time - a.time);
      curve[f] = a.value * (1 - t) + b.value * t;
    }

    // Clamp 0..1
    curve[f] = Math.max(0, Math.min(1, curve[f]));
  }

  return curve;
}


// ============ Genre Inference ============

function inferGenre(project: ProjectState): GenreId {
  // Simple heuristic based on BPM + scale
  const bpm = project.bpm;
  if (bpm >= 108 && bpm <= 120) return 'amapiano_private_school';
  if (bpm >= 120 && bpm <= 130) return 'afro_house';
  if (bpm >= 100 && bpm <= 108) return 'deep_house';
  if (bpm >= 130 && bpm <= 145) return 'afrobeats';
  if (bpm >= 80 && bpm <= 100) return 'hip_hop';
  return 'other';
}

// ============ Main Mapper ============

/**
 * Convert DAW state into a ControlTimelineV1.
 */
export function dawToControlTimeline(opts: DAWToCTLOptions): ControlTimelineV1 {
  const { transport, project, durationBars, markers, automationLanes } = opts;
  const bpm = transport.bpm;

  // Duration: bars → beats → seconds → frames (ceil to avoid truncation drift)
  const beatsPerBar = project.timeSignature.numerator;
  const totalBeats = durationBars * beatsPerBar;
  const totalSeconds = (totalBeats / bpm) * 60;
  const durationFrames = Math.max(50, Math.ceil(totalSeconds * 50));

  // Genre
  const genre = opts.genre ?? inferGenre(project);
  const mixProfile = opts.mixProfile ?? 'club';

  // Sections from markers
  let sections: ControlTimelineSection[] = [];
  if (markers && markers.length > 0) {
    const sortedMarkers = [...markers].sort((a, b) => a.positionBeats - b.positionBeats);

    for (let i = 0; i < sortedMarkers.length; i++) {
      const startFrame = beatsToFrames(sortedMarkers[i].positionBeats, bpm);
      const endFrame = i < sortedMarkers.length - 1
        ? beatsToFrames(sortedMarkers[i + 1].positionBeats, bpm)
        : durationFrames;

      sections.push({
        start_frame: startFrame,
        end_frame: endFrame,
        label: mapLabel(sortedMarkers[i].label),
      });
    }
  }

  // Normalize sections to fill gaps and clip overlaps
  sections = normalizeSections(sections, durationFrames, 'verse');

  // Curves from automation lanes
  const laneMap = new Map<string, DAWAutomationLane>();
  if (automationLanes) {
    for (const lane of automationLanes) {
      laneMap.set(lane.parameterName, lane);
    }
  }

  const resample = (name: string, fallback: number) =>
    laneMap.has(name)
      ? resampleLane(laneMap.get(name)!.points, bpm, durationFrames, fallback)
      : constantCurve(durationFrames, fallback);

  // Build energy curve from sections if no explicit lane
  const energyCurve = laneMap.has('energy')
    ? resampleLane(laneMap.get('energy')!.points, bpm, durationFrames, 0.5)
    : buildEnergyCurveFromSections(sections, durationFrames);

  const curves: ControlTimelineCurves = {
    energy: sanitizeCurve(energyCurve),
    log_drum_density: sanitizeCurve(resample('log_drum_density', 0.6)),
    perc_density: sanitizeCurve(resample('perc_density', 0.5)),
    pad_warmth: sanitizeCurve(resample('pad_warmth', 0.4)),
    bass_presence: sanitizeCurve(resample('bass_presence', 0.6)),
    vocal_presence: laneMap.has('vocal_presence')
      ? sanitizeCurve(resampleLane(laneMap.get('vocal_presence')!.points, bpm, durationFrames, 0))
      : undefined,
  };

  // Groove
  const groove = getGrooveForGenre(genre);

  // Key mapping
  const keyStr = project.key && project.scale
    ? `${project.key}${project.scale === 'minor' ? 'min' : 'maj'}`
    : undefined;

  const ctl: ControlTimelineV1 = {
    schema_version: 'ctl_v1',
    codec_id: opts.codecId ?? 'encodec_32k_4cb_50hz_v1',
    frame_rate_hz: 50,
    duration_frames: durationFrames,
    seed: opts.seed,
    global: {
      title: project.name !== 'Untitled Project' ? project.name : undefined,
      bpm,
      swing: 0.3,
      key: keyStr,
      genre,
      mix_profile: mixProfile,
    },
    sections,
    curves,
    groove,
  };

  // Validate output against schema before returning
  return ControlTimelineV1Schema.parse(ctl) as ControlTimelineV1;
}

// ============ Section → Energy Heuristic ============

/** Build an energy curve from section labels (intelligent defaults) */
function buildEnergyCurveFromSections(
  sections: ControlTimelineSection[],
  totalFrames: number
): number[] {
  const SECTION_ENERGY: Record<SectionLabel, number> = {
    intro: 0.3,
    verse: 0.5,
    pre: 0.6,
    chorus: 0.8,
    break: 0.35,
    drop: 0.95,
    outro: 0.25,
  };

  const curve = new Array(totalFrames).fill(0.5);

  for (const s of sections) {
    const energy = SECTION_ENERGY[s.label] ?? 0.5;
    for (let f = s.start_frame; f < Math.min(s.end_frame, totalFrames); f++) {
      curve[f] = energy;
    }
  }

  return curve;
}
