/**
 * Amapiano Groove Preset Library
 * Canonical 16-step patterns for core subgenres.
 */

import type { ControlTimelineGroove, Pattern16, Microtiming16 } from './controlTimeline';

// ============ Pattern Constants ============

/** Classic 3-step log drum pattern (Private School Amapiano) */
const LOGDRUM_3STEP: Pattern16 = [1,0,0,0, 1,0,0,0, 1,0,0,0, 0,0,0,0];

/** Sgija-style fast log drum pattern */
const LOGDRUM_SGIJA: Pattern16 = [1,0,1,0, 1,0,1,0, 1,0,1,0, 1,0,0,0];

/** Bacardi sparse log drum */
const LOGDRUM_BACARDI: Pattern16 = [1,0,0,0, 0,0,0,0, 1,0,0,0, 0,0,1,0];

/** Standard 4-on-the-floor kick */
const KICK_4OTF: Pattern16 = [1,0,0,0, 1,0,0,0, 1,0,0,0, 1,0,0,0];

/** Broken kick (common in Amapiano) */
const KICK_BROKEN: Pattern16 = [1,0,0,0, 0,0,1,0, 1,0,0,0, 0,0,0,0];

/** Offbeat hat */
const HAT_OFFBEAT: Pattern16 = [0,0,1,0, 0,0,1,0, 0,0,1,0, 0,0,1,0];

/** 16th hat */
const HAT_16TH: Pattern16 = [1,1,1,1, 1,1,1,1, 1,1,1,1, 1,1,1,1];

/** Sparse snare (beats 2 & 4) */
const SNARE_24: Pattern16 = [0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0];

/** Clap on beat 3 */
const CLAP_3: Pattern16 = [0,0,0,0, 0,0,0,0, 1,0,0,0, 0,0,0,0];

// ============ Microtiming Templates ============

/** No swing — perfectly quantized */
const MT_STRAIGHT: Microtiming16 = [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0];

/** Subtle Amapiano swing (pushes even 16ths late) */
const MT_AMAPIANO_SWING: Microtiming16 = [
  0, 0.02, 0, 0.03,
  0, 0.02, 0, 0.03,
  0, 0.02, 0, 0.03,
  0, 0.02, 0, 0.01,
];

/** Deeper shuffle feel */
const MT_DEEP_SHUFFLE: Microtiming16 = [
  0, 0.04, 0, 0.05,
  0, 0.04, 0, 0.05,
  0, 0.04, 0, 0.05,
  0, 0.04, 0, 0.03,
];

// ============ Groove Presets ============

export const GROOVE_PRESETS: Record<string, ControlTimelineGroove> = {
  private_school_3step: {
    template_id: 'private_school_3step',
    kick_16: KICK_4OTF,
    snare_clap_16: SNARE_24,
    hat_16: HAT_OFFBEAT,
    logdrum_16: LOGDRUM_3STEP,
    microtiming_16: MT_AMAPIANO_SWING,
  },

  sgija_bounce: {
    template_id: 'sgija_bounce',
    kick_16: KICK_BROKEN,
    snare_clap_16: CLAP_3,
    hat_16: HAT_16TH,
    logdrum_16: LOGDRUM_SGIJA,
    microtiming_16: MT_DEEP_SHUFFLE,
  },

  bacardi_minimal: {
    template_id: 'bacardi_minimal',
    kick_16: KICK_4OTF,
    snare_clap_16: SNARE_24,
    hat_16: HAT_OFFBEAT,
    logdrum_16: LOGDRUM_BACARDI,
    microtiming_16: MT_AMAPIANO_SWING,
  },

  deep_house_straight: {
    template_id: 'deep_house_straight',
    kick_16: KICK_4OTF,
    snare_clap_16: SNARE_24,
    hat_16: HAT_16TH,
    logdrum_16: [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
    microtiming_16: MT_STRAIGHT,
  },

  afro_house_percussive: {
    template_id: 'afro_house_percussive',
    kick_16: KICK_BROKEN,
    snare_clap_16: CLAP_3,
    hat_16: HAT_16TH,
    logdrum_16: [1,0,0,1, 0,0,1,0, 0,1,0,0, 1,0,0,0],
    microtiming_16: MT_DEEP_SHUFFLE,
  },
};

/** Get a groove preset by genre ID, falling back to private_school_3step */
export function getGrooveForGenre(genre: string): ControlTimelineGroove {
  const map: Record<string, string> = {
    amapiano_private_school: 'private_school_3step',
    amapiano_sgija: 'sgija_bounce',
    amapiano_bacardi: 'bacardi_minimal',
    deep_house: 'deep_house_straight',
    afro_house: 'afro_house_percussive',
  };
  
  const presetKey = map[genre] ?? 'private_school_3step';
  return { ...GROOVE_PRESETS[presetKey] };
}
