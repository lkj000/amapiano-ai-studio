/**
 * ControlTimeline v1 — Core TypeScript Types
 * 
 * The formal interface between the AURA-X UI/DAW and backend generative engines.
 * Serves as: generation contract, project automation state, and dataset logging artifact.
 * 
 * @see https://aura-x.dev/schemas/control_timeline_v1.json
 */

// ============ Enums & Primitives ============

export type GenreId =
  | 'amapiano_private_school'
  | 'amapiano_sgija'
  | 'amapiano_bacardi'
  | 'afro_house'
  | 'deep_house'
  | 'afrobeats'
  | 'hip_hop'
  | 'pop'
  | 'other';

export type MixProfile = 'club' | 'warm' | 'radio' | 'lofi' | 'cinematic';

export type SectionLabel = 'intro' | 'verse' | 'pre' | 'chorus' | 'break' | 'drop' | 'outro';

/** 16-step binary pattern (one bar at 16th-note resolution) */
export type Pattern16 = [
  0|1, 0|1, 0|1, 0|1,
  0|1, 0|1, 0|1, 0|1,
  0|1, 0|1, 0|1, 0|1,
  0|1, 0|1, 0|1, 0|1
];

/** 16-step microtiming offsets in seconds (range: -0.08 to 0.08) */
export type Microtiming16 = [
  number, number, number, number,
  number, number, number, number,
  number, number, number, number,
  number, number, number, number
];

// ============ Section ============

export interface ControlTimelineSection {
  /** Inclusive start frame */
  start_frame: number;
  /** Exclusive end frame */
  end_frame: number;
  label: SectionLabel;
  notes?: string;
}

// ============ Global Parameters ============

export interface ControlTimelineVocals {
  enabled?: boolean;
  /** ISO 639 language tags, e.g. ["zu", "xh", "ts"] */
  language_tags?: string[];
  /** Vocal presence 0..1 */
  presence?: number;
}

export interface ControlTimelineGlobal {
  title?: string;
  /** Tempo: 40–220 BPM */
  bpm: number;
  /** Swing amount: 0 (straight) to 1 (full shuffle) */
  swing: number;
  /** Musical key, e.g. "F#min" or "Cmaj" */
  key?: string;
  genre: GenreId;
  /** Mood/style descriptors (max 12) */
  mood_tags?: string[];
  mix_profile: MixProfile;
  vocals?: ControlTimelineVocals;
}

// ============ Automation Curves ============

export interface ControlTimelineCurves {
  /** Energy envelope (0..1), length = duration_frames */
  energy: number[];
  /** Log drum density (0..1) */
  log_drum_density: number[];
  /** Percussion density (0..1) */
  perc_density: number[];
  /** Pad warmth (0..1) */
  pad_warmth: number[];
  /** Bass presence (0..1) */
  bass_presence: number[];
  /** Optional vocal presence curve (0..1) */
  vocal_presence?: number[];
}

// ============ Groove Template ============

export interface ControlTimelineGroove {
  /** Reference to a groove preset, e.g. "private_school_3step" */
  template_id: string;

  kick_16: Pattern16;
  snare_clap_16: Pattern16;
  hat_16: Pattern16;
  logdrum_16: Pattern16;

  /** Per-step timing offsets in seconds */
  microtiming_16: Microtiming16;
}

// ============ Top-Level Schema ============

export interface ControlTimelineV1 {
  schema_version: 'ctl_v1';

  /** Codec identifier, e.g. "encodec_32k_4cb_50hz_v1" */
  codec_id: string;
  /** Frames per second — fixed at 50 for v1 */
  frame_rate_hz: 50;
  /** Total duration in frames (minimum 50 = 1 second) */
  duration_frames: number;
  /** Optional random seed for reproducibility */
  seed?: number;

  global: ControlTimelineGlobal;
  sections: ControlTimelineSection[];
  curves: ControlTimelineCurves;
  groove: ControlTimelineGroove;
}

// ============ Helpers ============

/** Convert frames to seconds at 50Hz */
export function framesToSeconds(frames: number): number {
  return frames / 50;
}

/** Convert seconds to frames at 50Hz */
export function secondsToFrames(seconds: number): number {
  return Math.round(seconds * 50);
}

/** Convert BPM + beats to frames */
export function beatsToFrames(beats: number, bpm: number): number {
  const seconds = (beats / bpm) * 60;
  return secondsToFrames(seconds);
}

/** Create a constant curve of given length and value */
export function constantCurve(length: number, value: number): number[] {
  return new Array(length).fill(Math.max(0, Math.min(1, value)));
}

/** Create a linear ramp curve */
export function linearRamp(length: number, from: number, to: number): number[] {
  return Array.from({ length }, (_, i) => {
    const t = length > 1 ? i / (length - 1) : 0;
    return from + (to - from) * t;
  });
}
