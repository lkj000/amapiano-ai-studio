/**
 * DJ Agent Types
 * Level-5 Autonomous Music Performance Intelligence
 */

export type DJPreset = 
  | 'private_school_3am_peak'
  | 'deep_soulful'
  | 'sunrise_cooldown'
  | 'peak_hour'
  | 'balanced';

export type SetDuration = 30 | 45 | 60;

export type TransitionType = 
  | 'phrase_crossfade_eq_swap'
  | 'loop_roll_build'
  | 'echo_out'
  | 'stem_vocal_tease'
  | 'clean_cut_on_phrase'
  | 'reverb_wash'
  | 'filter_sweep'
  | 'mashup_overlay';

export type MixRole = 'warmup' | 'lift' | 'peak' | 'release' | 'peak2' | 'outro';

export type AgentPhase = 
  | 'idle'
  | 'uploading'
  | 'analyzing'
  | 'planning'
  | 'generating_variants'
  | 'rendering'
  | 'complete'
  | 'error';

export interface DJTrack {
  id: string;
  title: string;
  artist?: string;
  fileUrl: string;
  fileFormat: string;
  durationSec?: number;
  features?: TrackFeatures;
}

export interface TrackFeatures {
  bpm: number;
  bpmConfidence: number;
  key: string;
  camelot: string;
  lufsIntegrated: number;
  energyCurve: number[];
  segments: TrackSegment[];
  vocalActivityCurve: number[];
}

export interface TrackSegment {
  type: 'intro' | 'verse' | 'drop' | 'breakdown' | 'outro';
  startSec: number;
  endSec: number;
  energy: number;
}

export interface SetConfig {
  duration: SetDuration;
  preset: DJPreset;
  risk: number; // 0-1
  allowVocalOverlay: boolean;
  harmonicStrictness: number; // 0-1
  maxBpmDelta: number;
}

export interface PerformancePlanItem {
  itemId: string;
  type: 'track' | 'transition' | 'bridge';
  trackId?: string;
  trackTitle?: string;
  trackArtist?: string;
  mixRole?: MixRole;
  transitionType?: TransitionType;
  bars?: number;
  startTimeSec?: number;
  durationSec?: number;
}

export interface SetScores {
  harmonicClash: number;
  tempoJump: number;
  vocalOverlapConflict: number;
  energySmoothness: number;
  transitionCleanliness: number;
  novelty: number;
  overall: number;
}

export interface GeneratedSet {
  planId: string;
  name: string;
  preset: DJPreset;
  durationSec: number;
  items: PerformancePlanItem[];
  scores: SetScores;
  energyCurve: number[];
  tracklist: { time: string; title: string; artist?: string; bpm: number; key: string }[];
}

export const PRESET_INFO: Record<DJPreset, { label: string; description: string; icon: string }> = {
  private_school_3am_peak: {
    label: 'Private School 3AM Peak',
    description: 'Deep, luxurious, emotional — then peak with log-drum power',
    icon: '🌙'
  },
  deep_soulful: {
    label: 'Deep & Soulful',
    description: 'Warm pads, jazz chords, gentle builds',
    icon: '🎷'
  },
  sunrise_cooldown: {
    label: 'Sunrise Cooldown',
    description: 'Gradual energy release, ambient textures, dreamy',
    icon: '🌅'
  },
  peak_hour: {
    label: 'Peak Hour',
    description: 'High energy throughout, aggressive transitions',
    icon: '🔥'
  },
  balanced: {
    label: 'Balanced',
    description: 'Classic arc: warm-up → peak → release → finale',
    icon: '⚖️'
  }
};
