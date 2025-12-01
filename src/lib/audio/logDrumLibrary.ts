/**
 * Log Drum Library - Authentic Amapiano Log Drum Samples
 * 
 * This library contains 50+ curated log drum samples categorized by:
 * - Regional style (Johannesburg, Pretoria, Durban, Cape Town)
 * - Pitch range (Low, Mid, High)
 * - Playing style (Muted, Open, Slap, Ghost)
 * - BPM compatibility (105-120 BPM)
 * 
 * For PhD Research: This represents the "Elements Library" component
 * of the Amapianorization Engine documented in the technical report.
 */

export interface LogDrumSample {
  id: string;
  name: string;
  url: string;
  category: 'low' | 'mid' | 'high';
  style: 'muted' | 'open' | 'slap' | 'ghost';
  region: 'johannesburg' | 'pretoria' | 'durban' | 'cape-town';
  bpm: number;
  key: string;
  duration: number; // in seconds
  tags: string[];
  authenticity: number; // 0-100 cultural authenticity score
}

export interface LogDrumPattern {
  id: string;
  name: string;
  description: string;
  samples: string[]; // Array of sample IDs
  pattern: Array<{
    time: number; // Beat position (0-16 for 4 bars)
    sampleId: string;
    velocity: number; // 0-1
    duration: number; // Note length
  }>;
  region: string;
  complexity: number; // 1-10
  authenticityScore: number;
}

/**
 * LOG DRUM SAMPLE LIBRARY
 * 
 * Note: In production, these would be actual audio file URLs from storage.
 * For PhD demo, we're creating a structured library that can be populated
 * with real samples during implementation.
 */
export const LOG_DRUM_SAMPLES: LogDrumSample[] = [
  // === JOHANNESBURG STYLE (Classic Deep House Influence) ===
  {
    id: 'jhb_low_muted_01',
    name: 'Joburg Deep Muted',
    url: '/audio/log-drums/jhb/low-muted-01.wav',
    category: 'low',
    style: 'muted',
    region: 'johannesburg',
    bpm: 112,
    key: 'Am',
    duration: 0.8,
    tags: ['deep', 'classic', 'soulful'],
    authenticity: 95
  },
  {
    id: 'jhb_low_open_01',
    name: 'Joburg Deep Open',
    url: '/audio/log-drums/jhb/low-open-01.wav',
    category: 'low',
    style: 'open',
    region: 'johannesburg',
    bpm: 112,
    key: 'Am',
    duration: 1.2,
    tags: ['deep', 'resonant', 'classic'],
    authenticity: 98
  },
  {
    id: 'jhb_mid_slap_01',
    name: 'Joburg Mid Slap',
    url: '/audio/log-drums/jhb/mid-slap-01.wav',
    category: 'mid',
    style: 'slap',
    region: 'johannesburg',
    bpm: 115,
    key: 'Cm',
    duration: 0.5,
    tags: ['punchy', 'mid-range', 'rhythmic'],
    authenticity: 92
  },
  {
    id: 'jhb_high_ghost_01',
    name: 'Joburg High Ghost',
    url: '/audio/log-drums/jhb/high-ghost-01.wav',
    category: 'high',
    style: 'ghost',
    region: 'johannesburg',
    bpm: 118,
    key: 'Em',
    duration: 0.3,
    tags: ['subtle', 'ghost-note', 'texture'],
    authenticity: 88
  },
  {
    id: 'jhb_low_muted_02',
    name: 'Joburg Deep Tight',
    url: '/audio/log-drums/jhb/low-muted-02.wav',
    category: 'low',
    style: 'muted',
    region: 'johannesburg',
    bpm: 110,
    key: 'Dm',
    duration: 0.7,
    tags: ['tight', 'controlled', 'deep'],
    authenticity: 94
  },

  // === PRETORIA STYLE (Jazzy, Sophisticated) ===
  {
    id: 'pta_mid_open_01',
    name: 'Pretoria Jazz Open',
    url: '/audio/log-drums/pta/mid-open-01.wav',
    category: 'mid',
    style: 'open',
    region: 'pretoria',
    bpm: 115,
    key: 'Gm',
    duration: 1.0,
    tags: ['jazzy', 'sophisticated', 'melodic'],
    authenticity: 96
  },
  {
    id: 'pta_high_slap_01',
    name: 'Pretoria High Slap',
    url: '/audio/log-drums/pta/high-slap-01.wav',
    category: 'high',
    style: 'slap',
    region: 'pretoria',
    bpm: 118,
    key: 'Fm',
    duration: 0.4,
    tags: ['bright', 'articulate', 'jazzy'],
    authenticity: 93
  },
  {
    id: 'pta_low_open_01',
    name: 'Pretoria Warm Bass',
    url: '/audio/log-drums/pta/low-open-01.wav',
    category: 'low',
    style: 'open',
    region: 'pretoria',
    bpm: 112,
    key: 'Bbm',
    duration: 1.5,
    tags: ['warm', 'jazzy', 'resonant'],
    authenticity: 97
  },
  {
    id: 'pta_mid_ghost_01',
    name: 'Pretoria Subtle Mid',
    url: '/audio/log-drums/pta/mid-ghost-01.wav',
    category: 'mid',
    style: 'ghost',
    region: 'pretoria',
    bpm: 116,
    key: 'Am',
    duration: 0.35,
    tags: ['subtle', 'refined', 'texture'],
    authenticity: 89
  },
  {
    id: 'pta_high_open_01',
    name: 'Pretoria Bright',
    url: '/audio/log-drums/pta/high-open-01.wav',
    category: 'high',
    style: 'open',
    region: 'pretoria',
    bpm: 120,
    key: 'Dm',
    duration: 0.8,
    tags: ['bright', 'clear', 'articulate'],
    authenticity: 94
  },

  // === DURBAN STYLE (Gqom Influence, Energetic) ===
  {
    id: 'dbn_low_slap_01',
    name: 'Durban Heavy Slap',
    url: '/audio/log-drums/dbn/low-slap-01.wav',
    category: 'low',
    style: 'slap',
    region: 'durban',
    bpm: 120,
    key: 'Em',
    duration: 0.6,
    tags: ['heavy', 'gqom', 'energetic'],
    authenticity: 91
  },
  {
    id: 'dbn_mid_open_01',
    name: 'Durban Punchy Mid',
    url: '/audio/log-drums/dbn/mid-open-01.wav',
    category: 'mid',
    style: 'open',
    region: 'durban',
    bpm: 118,
    key: 'Am',
    duration: 0.9,
    tags: ['punchy', 'energetic', 'aggressive'],
    authenticity: 93
  },
  {
    id: 'dbn_high_slap_01',
    name: 'Durban Crack',
    url: '/audio/log-drums/dbn/high-slap-01.wav',
    category: 'high',
    style: 'slap',
    region: 'durban',
    bpm: 122,
    key: 'Gm',
    duration: 0.3,
    tags: ['sharp', 'cutting', 'aggressive'],
    authenticity: 90
  },
  {
    id: 'dbn_low_muted_01',
    name: 'Durban Tight Bass',
    url: '/audio/log-drums/dbn/low-muted-01.wav',
    category: 'low',
    style: 'muted',
    region: 'durban',
    bpm: 116,
    key: 'Dm',
    duration: 0.5,
    tags: ['tight', 'controlled', 'powerful'],
    authenticity: 92
  },
  {
    id: 'dbn_mid_slap_01',
    name: 'Durban Attack',
    url: '/audio/log-drums/dbn/mid-slap-01.wav',
    category: 'mid',
    style: 'slap',
    region: 'durban',
    bpm: 120,
    key: 'Cm',
    duration: 0.4,
    tags: ['aggressive', 'fast-attack', 'punchy'],
    authenticity: 94
  },

  // === CAPE TOWN STYLE (Coastal, Afro-House Fusion) ===
  {
    id: 'cpt_low_open_01',
    name: 'Cape Coast Deep',
    url: '/audio/log-drums/cpt/low-open-01.wav',
    category: 'low',
    style: 'open',
    region: 'cape-town',
    bpm: 115,
    key: 'Am',
    duration: 1.3,
    tags: ['coastal', 'melodic', 'smooth'],
    authenticity: 95
  },
  {
    id: 'cpt_mid_open_01',
    name: 'Cape Melodic Mid',
    url: '/audio/log-drums/cpt/mid-open-01.wav',
    category: 'mid',
    style: 'open',
    region: 'cape-town',
    bpm: 112,
    key: 'Gm',
    duration: 1.0,
    tags: ['melodic', 'afro-house', 'smooth'],
    authenticity: 96
  },
  {
    id: 'cpt_high_ghost_01',
    name: 'Cape Shimmer',
    url: '/audio/log-drums/cpt/high-ghost-01.wav',
    category: 'high',
    style: 'ghost',
    region: 'cape-town',
    bpm: 118,
    key: 'Dm',
    duration: 0.4,
    tags: ['shimmering', 'atmospheric', 'subtle'],
    authenticity: 87
  },
  {
    id: 'cpt_low_muted_01',
    name: 'Cape Warm Bass',
    url: '/audio/log-drums/cpt/low-muted-01.wav',
    category: 'low',
    style: 'muted',
    region: 'cape-town',
    bpm: 110,
    key: 'Fm',
    duration: 0.9,
    tags: ['warm', 'coastal', 'smooth'],
    authenticity: 93
  },
  {
    id: 'cpt_mid_slap_01',
    name: 'Cape Bright Slap',
    url: '/audio/log-drums/cpt/mid-slap-01.wav',
    category: 'mid',
    style: 'slap',
    region: 'cape-town',
    bpm: 116,
    key: 'Bbm',
    duration: 0.5,
    tags: ['bright', 'clear', 'melodic'],
    authenticity: 91
  },

  // === ADDITIONAL JOHANNESBURG SAMPLES ===
  {
    id: 'jhb_low_open_02',
    name: 'Joburg Resonant Boom',
    url: '/audio/log-drums/jhb/low-open-02.wav',
    category: 'low',
    style: 'open',
    region: 'johannesburg',
    bpm: 114,
    key: 'Gm',
    duration: 1.3,
    tags: ['resonant', 'boom', 'foundation'],
    authenticity: 96
  },
  {
    id: 'jhb_mid_muted_01',
    name: 'Joburg Mid Punch',
    url: '/audio/log-drums/jhb/mid-muted-01.wav',
    category: 'mid',
    style: 'muted',
    region: 'johannesburg',
    bpm: 116,
    key: 'Dm',
    duration: 0.6,
    tags: ['punchy', 'mid', 'controlled'],
    authenticity: 93
  },
  {
    id: 'jhb_high_open_01',
    name: 'Joburg High Melodic',
    url: '/audio/log-drums/jhb/high-open-01.wav',
    category: 'high',
    style: 'open',
    region: 'johannesburg',
    bpm: 112,
    key: 'Fm',
    duration: 0.7,
    tags: ['melodic', 'high', 'bright'],
    authenticity: 91
  },
  {
    id: 'jhb_low_slap_01',
    name: 'Joburg Deep Attack',
    url: '/audio/log-drums/jhb/low-slap-01.wav',
    category: 'low',
    style: 'slap',
    region: 'johannesburg',
    bpm: 118,
    key: 'Bbm',
    duration: 0.5,
    tags: ['attack', 'deep', 'percussive'],
    authenticity: 94
  },
  {
    id: 'jhb_mid_open_01',
    name: 'Joburg Mid Soul',
    url: '/audio/log-drums/jhb/mid-open-01.wav',
    category: 'mid',
    style: 'open',
    region: 'johannesburg',
    bpm: 110,
    key: 'Am',
    duration: 0.9,
    tags: ['soulful', 'mid', 'warm'],
    authenticity: 97
  },
  {
    id: 'jhb_high_slap_01',
    name: 'Joburg Snappy High',
    url: '/audio/log-drums/jhb/high-slap-01.wav',
    category: 'high',
    style: 'slap',
    region: 'johannesburg',
    bpm: 115,
    key: 'Cm',
    duration: 0.35,
    tags: ['snappy', 'crisp', 'rhythmic'],
    authenticity: 90
  },

  // === ADDITIONAL PRETORIA SAMPLES ===
  {
    id: 'pta_low_muted_01',
    name: 'Pretoria Deep Thud',
    url: '/audio/log-drums/pta/low-muted-01.wav',
    category: 'low',
    style: 'muted',
    region: 'pretoria',
    bpm: 114,
    key: 'Dm',
    duration: 0.7,
    tags: ['thud', 'controlled', 'jazzy'],
    authenticity: 94
  },
  {
    id: 'pta_low_slap_01',
    name: 'Pretoria Jazz Slap',
    url: '/audio/log-drums/pta/low-slap-01.wav',
    category: 'low',
    style: 'slap',
    region: 'pretoria',
    bpm: 116,
    key: 'Em',
    duration: 0.55,
    tags: ['jazz', 'articulate', 'deep'],
    authenticity: 95
  },
  {
    id: 'pta_mid_muted_01',
    name: 'Pretoria Smooth Mid',
    url: '/audio/log-drums/pta/mid-muted-01.wav',
    category: 'mid',
    style: 'muted',
    region: 'pretoria',
    bpm: 112,
    key: 'Gm',
    duration: 0.6,
    tags: ['smooth', 'sophisticated', 'controlled'],
    authenticity: 92
  },
  {
    id: 'pta_mid_slap_01',
    name: 'Pretoria Funk Slap',
    url: '/audio/log-drums/pta/mid-slap-01.wav',
    category: 'mid',
    style: 'slap',
    region: 'pretoria',
    bpm: 118,
    key: 'Am',
    duration: 0.45,
    tags: ['funky', 'groove', 'jazzy'],
    authenticity: 93
  },
  {
    id: 'pta_high_ghost_01',
    name: 'Pretoria Subtle Touch',
    url: '/audio/log-drums/pta/high-ghost-01.wav',
    category: 'high',
    style: 'ghost',
    region: 'pretoria',
    bpm: 115,
    key: 'Cm',
    duration: 0.28,
    tags: ['subtle', 'texture', 'refined'],
    authenticity: 88
  },
  {
    id: 'pta_low_open_02',
    name: 'Pretoria Rich Bass',
    url: '/audio/log-drums/pta/low-open-02.wav',
    category: 'low',
    style: 'open',
    region: 'pretoria',
    bpm: 110,
    key: 'Fm',
    duration: 1.4,
    tags: ['rich', 'full', 'warm'],
    authenticity: 96
  },

  // === ADDITIONAL DURBAN SAMPLES ===
  {
    id: 'dbn_high_ghost_01',
    name: 'Durban Quick Touch',
    url: '/audio/log-drums/dbn/high-ghost-01.wav',
    category: 'high',
    style: 'ghost',
    region: 'durban',
    bpm: 120,
    key: 'Dm',
    duration: 0.22,
    tags: ['quick', 'subtle', 'gqom'],
    authenticity: 87
  },
  {
    id: 'dbn_low_open_01',
    name: 'Durban Heavy Open',
    url: '/audio/log-drums/dbn/low-open-01.wav',
    category: 'low',
    style: 'open',
    region: 'durban',
    bpm: 118,
    key: 'Am',
    duration: 1.1,
    tags: ['heavy', 'powerful', 'resonant'],
    authenticity: 94
  },
  {
    id: 'dbn_mid_muted_01',
    name: 'Durban Tight Mid',
    url: '/audio/log-drums/dbn/mid-muted-01.wav',
    category: 'mid',
    style: 'muted',
    region: 'durban',
    bpm: 122,
    key: 'Gm',
    duration: 0.45,
    tags: ['tight', 'controlled', 'aggressive'],
    authenticity: 91
  },
  {
    id: 'dbn_high_open_01',
    name: 'Durban Bright Hit',
    url: '/audio/log-drums/dbn/high-open-01.wav',
    category: 'high',
    style: 'open',
    region: 'durban',
    bpm: 116,
    key: 'Em',
    duration: 0.65,
    tags: ['bright', 'energetic', 'cutting'],
    authenticity: 89
  },
  {
    id: 'dbn_low_slap_02',
    name: 'Durban Gqom Slam',
    url: '/audio/log-drums/dbn/low-slap-02.wav',
    category: 'low',
    style: 'slap',
    region: 'durban',
    bpm: 124,
    key: 'Cm',
    duration: 0.48,
    tags: ['slam', 'gqom', 'powerful'],
    authenticity: 95
  },
  {
    id: 'dbn_mid_ghost_01',
    name: 'Durban Groove Ghost',
    url: '/audio/log-drums/dbn/mid-ghost-01.wav',
    category: 'mid',
    style: 'ghost',
    region: 'durban',
    bpm: 118,
    key: 'Bbm',
    duration: 0.32,
    tags: ['groove', 'subtle', 'rhythmic'],
    authenticity: 86
  },

  // === ADDITIONAL CAPE TOWN SAMPLES ===
  {
    id: 'cpt_low_slap_01',
    name: 'Cape Deep Slap',
    url: '/audio/log-drums/cpt/low-slap-01.wav',
    category: 'low',
    style: 'slap',
    region: 'cape-town',
    bpm: 114,
    key: 'Dm',
    duration: 0.6,
    tags: ['deep', 'coastal', 'punchy'],
    authenticity: 92
  },
  {
    id: 'cpt_mid_muted_01',
    name: 'Cape Smooth Muted',
    url: '/audio/log-drums/cpt/mid-muted-01.wav',
    category: 'mid',
    style: 'muted',
    region: 'cape-town',
    bpm: 112,
    key: 'Am',
    duration: 0.55,
    tags: ['smooth', 'controlled', 'melodic'],
    authenticity: 90
  },
  {
    id: 'cpt_high_slap_01',
    name: 'Cape Crisp High',
    url: '/audio/log-drums/cpt/high-slap-01.wav',
    category: 'high',
    style: 'slap',
    region: 'cape-town',
    bpm: 118,
    key: 'Gm',
    duration: 0.38,
    tags: ['crisp', 'bright', 'articulate'],
    authenticity: 89
  },
  {
    id: 'cpt_mid_ghost_01',
    name: 'Cape Atmospheric Ghost',
    url: '/audio/log-drums/cpt/mid-ghost-01.wav',
    category: 'mid',
    style: 'ghost',
    region: 'cape-town',
    bpm: 115,
    key: 'Em',
    duration: 0.3,
    tags: ['atmospheric', 'subtle', 'smooth'],
    authenticity: 85
  },
  {
    id: 'cpt_low_open_02',
    name: 'Cape Ocean Deep',
    url: '/audio/log-drums/cpt/low-open-02.wav',
    category: 'low',
    style: 'open',
    region: 'cape-town',
    bpm: 110,
    key: 'Fm',
    duration: 1.5,
    tags: ['oceanic', 'deep', 'resonant'],
    authenticity: 97
  },
  {
    id: 'cpt_high_open_01',
    name: 'Cape Bright Open',
    url: '/audio/log-drums/cpt/high-open-01.wav',
    category: 'high',
    style: 'open',
    region: 'cape-town',
    bpm: 116,
    key: 'Bbm',
    duration: 0.72,
    tags: ['bright', 'open', 'afro-house'],
    authenticity: 93
  },

  // === UNIVERSAL / CROSS-REGIONAL SAMPLES ===
  {
    id: 'universal_low_deep_01',
    name: 'Universal Deep Boom',
    url: '/audio/log-drums/universal/low-deep-01.wav',
    category: 'low',
    style: 'open',
    region: 'johannesburg',
    bpm: 115,
    key: 'Am',
    duration: 1.4,
    tags: ['deep', 'universal', 'foundational'],
    authenticity: 90
  },
  {
    id: 'universal_mid_balanced_01',
    name: 'Universal Mid Balance',
    url: '/audio/log-drums/universal/mid-balanced-01.wav',
    category: 'mid',
    style: 'open',
    region: 'johannesburg',
    bpm: 115,
    key: 'Dm',
    duration: 0.8,
    tags: ['balanced', 'versatile', 'universal'],
    authenticity: 85
  },
  {
    id: 'universal_high_crisp_01',
    name: 'Universal High Crisp',
    url: '/audio/log-drums/universal/high-crisp-01.wav',
    category: 'high',
    style: 'slap',
    region: 'johannesburg',
    bpm: 118,
    key: 'Gm',
    duration: 0.35,
    tags: ['crisp', 'clear', 'universal'],
    authenticity: 83
  },
  {
    id: 'universal_low_muted_01',
    name: 'Universal Tight Low',
    url: '/audio/log-drums/universal/low-muted-01.wav',
    category: 'low',
    style: 'muted',
    region: 'pretoria',
    bpm: 112,
    key: 'Cm',
    duration: 0.65,
    tags: ['tight', 'controlled', 'universal'],
    authenticity: 86
  },
  {
    id: 'universal_mid_ghost_01',
    name: 'Universal Subtle Mid',
    url: '/audio/log-drums/universal/mid-ghost-01.wav',
    category: 'mid',
    style: 'ghost',
    region: 'durban',
    bpm: 116,
    key: 'Em',
    duration: 0.28,
    tags: ['subtle', 'ghost', 'universal'],
    authenticity: 82
  },
  {
    id: 'universal_high_open_01',
    name: 'Universal Bright High',
    url: '/audio/log-drums/universal/high-open-01.wav',
    category: 'high',
    style: 'open',
    region: 'cape-town',
    bpm: 114,
    key: 'Fm',
    duration: 0.6,
    tags: ['bright', 'versatile', 'universal'],
    authenticity: 84
  },

  // === SPECIALTY SAMPLES ===
  {
    id: 'spec_808_low_01',
    name: '808 Deep Sub',
    url: '/audio/log-drums/specialty/808-low-01.wav',
    category: 'low',
    style: 'open',
    region: 'johannesburg',
    bpm: 115,
    key: 'Am',
    duration: 1.8,
    tags: ['808', 'sub', 'modern'],
    authenticity: 88
  },
  {
    id: 'spec_808_mid_01',
    name: '808 Punch',
    url: '/audio/log-drums/specialty/808-mid-01.wav',
    category: 'mid',
    style: 'slap',
    region: 'durban',
    bpm: 120,
    key: 'Dm',
    duration: 0.5,
    tags: ['808', 'punch', 'electronic'],
    authenticity: 86
  },
  {
    id: 'spec_synth_low_01',
    name: 'Synth Bass Log',
    url: '/audio/log-drums/specialty/synth-low-01.wav',
    category: 'low',
    style: 'open',
    region: 'pretoria',
    bpm: 112,
    key: 'Gm',
    duration: 1.2,
    tags: ['synth', 'electronic', 'modern'],
    authenticity: 84
  },
  {
    id: 'spec_hybrid_mid_01',
    name: 'Hybrid Organic-Electronic',
    url: '/audio/log-drums/specialty/hybrid-mid-01.wav',
    category: 'mid',
    style: 'open',
    region: 'cape-town',
    bpm: 116,
    key: 'Bbm',
    duration: 0.85,
    tags: ['hybrid', 'organic', 'electronic'],
    authenticity: 87
  }
];

/**
 * PRE-BUILT LOG DRUM PATTERNS
 * 
 * These patterns represent common Amapiano log drum rhythms
 * categorized by regional style and complexity.
 */
export const LOG_DRUM_PATTERNS: LogDrumPattern[] = [
  {
    id: 'jhb_classic_4bar',
    name: 'Johannesburg Classic 4-Bar',
    description: 'The foundational Joburg log drum pattern - deep, soulful, with syncopated hits',
    samples: ['jhb_low_muted_01', 'jhb_low_open_01', 'jhb_mid_slap_01', 'jhb_high_ghost_01'],
    pattern: [
      { time: 0, sampleId: 'jhb_low_muted_01', velocity: 0.9, duration: 0.5 },
      { time: 0.75, sampleId: 'jhb_high_ghost_01', velocity: 0.3, duration: 0.25 },
      { time: 1, sampleId: 'jhb_mid_slap_01', velocity: 0.7, duration: 0.4 },
      { time: 2, sampleId: 'jhb_low_open_01', velocity: 1.0, duration: 0.8 },
      { time: 2.5, sampleId: 'jhb_high_ghost_01', velocity: 0.25, duration: 0.2 },
      { time: 3, sampleId: 'jhb_mid_slap_01', velocity: 0.6, duration: 0.4 },
      { time: 3.75, sampleId: 'jhb_low_muted_01', velocity: 0.8, duration: 0.5 },
      // Continue pattern...
    ],
    region: 'johannesburg',
    complexity: 7,
    authenticityScore: 95
  },
  {
    id: 'pta_jazzy_progression',
    name: 'Pretoria Jazzy Progression',
    description: 'Sophisticated, syncopated pattern with jazz influences',
    samples: ['pta_mid_open_01', 'pta_high_slap_01', 'pta_low_open_01'],
    pattern: [
      { time: 0, sampleId: 'pta_low_open_01', velocity: 0.85, duration: 0.7 },
      { time: 0.5, sampleId: 'pta_high_slap_01', velocity: 0.5, duration: 0.3 },
      { time: 1.25, sampleId: 'pta_mid_open_01', velocity: 0.75, duration: 0.6 },
      { time: 2, sampleId: 'pta_low_open_01', velocity: 0.9, duration: 0.7 },
      { time: 2.75, sampleId: 'pta_high_slap_01', velocity: 0.6, duration: 0.3 },
      { time: 3.5, sampleId: 'pta_mid_open_01', velocity: 0.7, duration: 0.5 },
    ],
    region: 'pretoria',
    complexity: 8,
    authenticityScore: 93
  },
  {
    id: 'dbn_energetic_drive',
    name: 'Durban Energetic Drive',
    description: 'Fast, aggressive pattern with Gqom influence',
    samples: ['dbn_low_slap_01', 'dbn_mid_open_01', 'dbn_high_slap_01'],
    pattern: [
      { time: 0, sampleId: 'dbn_low_slap_01', velocity: 1.0, duration: 0.4 },
      { time: 0.5, sampleId: 'dbn_high_slap_01', velocity: 0.8, duration: 0.25 },
      { time: 1, sampleId: 'dbn_mid_open_01', velocity: 0.85, duration: 0.5 },
      { time: 1.5, sampleId: 'dbn_high_slap_01', velocity: 0.75, duration: 0.25 },
      { time: 2, sampleId: 'dbn_low_slap_01', velocity: 0.95, duration: 0.4 },
      { time: 2.75, sampleId: 'dbn_mid_open_01', velocity: 0.8, duration: 0.5 },
      { time: 3.5, sampleId: 'dbn_high_slap_01', velocity: 0.7, duration: 0.25 },
    ],
    region: 'durban',
    complexity: 9,
    authenticityScore: 91
  },
  {
    id: 'cpt_coastal_groove',
    name: 'Cape Town Coastal Groove',
    description: 'Smooth, melodic pattern with afro-house vibes',
    samples: ['cpt_low_open_01', 'cpt_mid_open_01', 'cpt_high_ghost_01'],
    pattern: [
      { time: 0, sampleId: 'cpt_low_open_01', velocity: 0.8, duration: 0.8 },
      { time: 1, sampleId: 'cpt_mid_open_01', velocity: 0.7, duration: 0.6 },
      { time: 1.75, sampleId: 'cpt_high_ghost_01', velocity: 0.4, duration: 0.3 },
      { time: 2.5, sampleId: 'cpt_low_open_01', velocity: 0.85, duration: 0.8 },
      { time: 3.25, sampleId: 'cpt_mid_open_01', velocity: 0.65, duration: 0.6 },
    ],
    region: 'cape-town',
    complexity: 6,
    authenticityScore: 94
  }
];

/**
 * INTELLIGENT ELEMENT SELECTOR
 * 
 * Selects appropriate log drum samples based on:
 * - Regional style
 * - Source track BPM
 * - Key compatibility
 * - Complexity level
 */
export function selectLogDrumSamples(
  region: 'johannesburg' | 'pretoria' | 'durban' | 'cape-town',
  bpm: number,
  key?: string,
  complexity: number = 5
): LogDrumSample[] {
  // Filter by region
  let candidates = LOG_DRUM_SAMPLES.filter(sample => sample.region === region);
  
  // Filter by BPM compatibility (±8 BPM range)
  candidates = candidates.filter(sample => Math.abs(sample.bpm - bpm) <= 8);
  
  // If key specified, prefer matching keys
  if (key) {
    const keyMatches = candidates.filter(sample => sample.key === key);
    if (keyMatches.length >= 3) {
      candidates = keyMatches;
    }
  }
  
  // Sort by authenticity score
  candidates.sort((a, b) => b.authenticity - a.authenticity);
  
  // Select based on complexity
  const sampleCount = Math.min(
    Math.max(3, Math.floor(complexity / 2)),
    candidates.length
  );
  
  return candidates.slice(0, sampleCount);
}

/**
 * SELECT LOG DRUM PATTERN
 * 
 * Chooses the best pre-built pattern for the track
 */
export function selectLogDrumPattern(
  region: string,
  complexity: number = 5
): LogDrumPattern | null {
  const patterns = LOG_DRUM_PATTERNS.filter(p => p.region === region);
  
  if (patterns.length === 0) return null;
  
  // Find pattern closest to desired complexity
  patterns.sort((a, b) => 
    Math.abs(a.complexity - complexity) - Math.abs(b.complexity - complexity)
  );
  
  return patterns[0];
}
