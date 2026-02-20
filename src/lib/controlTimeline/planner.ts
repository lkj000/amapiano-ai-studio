/**
 * ControlTimeline Planner
 * 
 * Generates a complete ControlTimelineV1 from a text prompt + minimal parameters.
 * Used when no DAW arrangement exists yet (e.g. "Generate from prompt" flow).
 */

import type {
  ControlTimelineV1,
  ControlTimelineSection,
  ControlTimelineCurves,
  SectionLabel,
  GenreId,
  MixProfile,
} from './controlTimeline';
import { constantCurve, linearRamp } from './controlTimeline';
import { getGrooveForGenre } from './groovePresets';
import { normalizeSections, ControlTimelineV1Schema } from './controlTimeline.zod';

// ============ Plan Configuration ============

export interface PlannerInput {
  /** User's text prompt */
  prompt: string;
  /** Desired duration in seconds (default: 60) */
  durationSeconds?: number;
  /** BPM (default: 113 for Amapiano) */
  bpm?: number;
  /** Genre override */
  genre?: GenreId;
  /** Mix profile override */
  mixProfile?: MixProfile;
  /** Musical key */
  key?: string;
  /** Random seed */
  seed?: number;
}

// ============ Keyword Detection ============

const GENRE_KEYWORDS: Record<string, GenreId> = {
  'private school': 'amapiano_private_school',
  'amapiano': 'amapiano_private_school',
  'sgija': 'amapiano_sgija',
  'bacardi': 'amapiano_bacardi',
  'afro house': 'afro_house',
  'deep house': 'deep_house',
  'afrobeats': 'afrobeats',
  'hip hop': 'hip_hop',
  'hiphop': 'hip_hop',
  'pop': 'pop',
};

const MOOD_KEYWORDS: string[] = [
  'dark', 'bright', 'melancholic', 'uplifting', 'aggressive', 'chill',
  'energetic', 'dreamy', 'groovy', 'minimal', 'heavy', 'atmospheric',
];

const MIX_KEYWORDS: Record<string, MixProfile> = {
  'club': 'club',
  'warm': 'warm',
  'radio': 'radio',
  'lofi': 'lofi',
  'lo-fi': 'lofi',
  'cinematic': 'cinematic',
  'film': 'cinematic',
};

function detectGenre(prompt: string): GenreId {
  const lower = prompt.toLowerCase();
  for (const [keyword, genre] of Object.entries(GENRE_KEYWORDS)) {
    if (lower.includes(keyword)) return genre;
  }
  return 'amapiano_private_school'; // default
}

function detectMoods(prompt: string): string[] {
  const lower = prompt.toLowerCase();
  return MOOD_KEYWORDS.filter((m) => lower.includes(m));
}

function detectMixProfile(prompt: string): MixProfile {
  const lower = prompt.toLowerCase();
  for (const [keyword, profile] of Object.entries(MIX_KEYWORDS)) {
    if (lower.includes(keyword)) return profile;
  }
  return 'club';
}

// ============ Arrangement Templates ============

interface ArrangementTemplate {
  /** Section ratios (will be scaled to total duration) */
  sections: { label: SectionLabel; ratio: number }[];
}

const ARRANGEMENT_TEMPLATES: Record<string, ArrangementTemplate> = {
  standard: {
    sections: [
      { label: 'intro', ratio: 0.1 },
      { label: 'verse', ratio: 0.2 },
      { label: 'chorus', ratio: 0.2 },
      { label: 'verse', ratio: 0.15 },
      { label: 'chorus', ratio: 0.2 },
      { label: 'outro', ratio: 0.15 },
    ],
  },
  drop_focused: {
    sections: [
      { label: 'intro', ratio: 0.12 },
      { label: 'verse', ratio: 0.18 },
      { label: 'pre', ratio: 0.1 },
      { label: 'drop', ratio: 0.25 },
      { label: 'break', ratio: 0.1 },
      { label: 'drop', ratio: 0.15 },
      { label: 'outro', ratio: 0.1 },
    ],
  },
  minimal: {
    sections: [
      { label: 'intro', ratio: 0.15 },
      { label: 'verse', ratio: 0.35 },
      { label: 'chorus', ratio: 0.35 },
      { label: 'outro', ratio: 0.15 },
    ],
  },
};

function selectArrangement(prompt: string, genre: GenreId): ArrangementTemplate {
  const lower = prompt.toLowerCase();
  if (lower.includes('drop') || lower.includes('banger') || lower.includes('hard')) {
    return ARRANGEMENT_TEMPLATES.drop_focused;
  }
  if (lower.includes('simple') || lower.includes('minimal') || lower.includes('short')) {
    return ARRANGEMENT_TEMPLATES.minimal;
  }
  return ARRANGEMENT_TEMPLATES.standard;
}

// ============ Curve Generation ============

const SECTION_ENERGY: Record<SectionLabel, number> = {
  intro: 0.3,
  verse: 0.5,
  pre: 0.65,
  chorus: 0.8,
  break: 0.35,
  drop: 0.95,
  outro: 0.25,
};

const SECTION_LOG_DENSITY: Record<SectionLabel, number> = {
  intro: 0.2,
  verse: 0.6,
  pre: 0.5,
  chorus: 0.7,
  break: 0.3,
  drop: 0.9,
  outro: 0.2,
};

function buildCurvesFromSections(
  sections: ControlTimelineSection[],
  totalFrames: number
): ControlTimelineCurves {
  const energy = new Array(totalFrames).fill(0.5);
  const logDrum = new Array(totalFrames).fill(0.5);
  const perc = new Array(totalFrames).fill(0.5);
  const padWarmth = new Array(totalFrames).fill(0.4);
  const bass = new Array(totalFrames).fill(0.5);

  for (const s of sections) {
    const e = SECTION_ENERGY[s.label] ?? 0.5;
    const ld = SECTION_LOG_DENSITY[s.label] ?? 0.5;
    const p = e * 0.8; // perc correlates with energy
    const b = s.label === 'drop' ? 0.9 : s.label === 'intro' ? 0.3 : 0.6;
    const pw = s.label === 'break' ? 0.7 : s.label === 'chorus' ? 0.5 : 0.4;

    for (let f = s.start_frame; f < Math.min(s.end_frame, totalFrames); f++) {
      energy[f] = e;
      logDrum[f] = ld;
      perc[f] = p;
      bass[f] = b;
      padWarmth[f] = pw;
    }
  }

  return {
    energy,
    log_drum_density: logDrum,
    perc_density: perc,
    pad_warmth: padWarmth,
    bass_presence: bass,
  };
}

// ============ Main Planner ============

/**
 * Generate a complete ControlTimelineV1 from a text prompt.
 * No DAW state needed — creates sensible defaults from keywords.
 */
export function planControlTimeline(input: PlannerInput): ControlTimelineV1 {
  const durationSec = input.durationSeconds ?? 60;
  const durationFrames = Math.max(50, Math.ceil(durationSec * 50));
  const genre = input.genre ?? detectGenre(input.prompt);
  const bpm = input.bpm ?? (genre.startsWith('amapiano') ? 113 : 120);
  const mixProfile = input.mixProfile ?? detectMixProfile(input.prompt);
  const moods = detectMoods(input.prompt);
  const groove = getGrooveForGenre(genre);

  // Build arrangement
  const arrangement = selectArrangement(input.prompt, genre);
  let cursor = 0;
  const rawSections: ControlTimelineSection[] = arrangement.sections.map((s) => {
    const startFrame = Math.round(cursor);
    const sectionFrames = Math.round(s.ratio * durationFrames);
    cursor += sectionFrames;
    return {
      start_frame: startFrame,
      end_frame: Math.min(startFrame + sectionFrames, durationFrames),
      label: s.label,
    };
  });

  const sections = normalizeSections(rawSections, durationFrames, 'verse');
  const curves = buildCurvesFromSections(sections, durationFrames);

  const ctl: ControlTimelineV1 = {
    schema_version: 'ctl_v1',
    codec_id: 'encodec_32k_4cb_50hz_v1',
    frame_rate_hz: 50,
    duration_frames: durationFrames,
    seed: input.seed,
    global: {
      title: undefined,
      bpm,
      swing: genre.startsWith('amapiano') ? 0.3 : 0.1,
      key: input.key,
      genre,
      mood_tags: moods.length > 0 ? moods : undefined,
      mix_profile: mixProfile,
    },
    sections,
    curves,
    groove,
  };

  // Validate output against schema before returning
  return ControlTimelineV1Schema.parse(ctl) as ControlTimelineV1;
}
