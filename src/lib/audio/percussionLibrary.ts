/**
 * Percussion Library - Authentic Amapiano Percussion Samples
 * 
 * Complementary percussion elements for Amapianorization:
 * - Shakers (high, mid, low)
 * - Congas (open, slap, muted)
 * - Bongos
 * - Cowbells
 * - Rides
 * - Tambourines
 */

export interface PercussionSample {
  id: string;
  name: string;
  url: string;
  type: 'shaker' | 'conga' | 'bongo' | 'cowbell' | 'ride' | 'tambourine';
  intensity: 'soft' | 'medium' | 'hard';
  region: string;
  bpm: number;
  duration: number;
  tags: string[];
}

export const PERCUSSION_SAMPLES: PercussionSample[] = [
  // === SHAKERS ===
  {
    id: 'shaker_soft_01',
    name: 'Soft Shaker Loop',
    url: '/audio/percussion/shaker-soft-01.wav',
    type: 'shaker',
    intensity: 'soft',
    region: 'universal',
    bpm: 115,
    duration: 2.0,
    tags: ['subtle', 'background', 'texture']
  },
  {
    id: 'shaker_medium_01',
    name: 'Medium Shaker Loop',
    url: '/audio/percussion/shaker-medium-01.wav',
    type: 'shaker',
    intensity: 'medium',
    region: 'universal',
    bpm: 115,
    duration: 2.0,
    tags: ['balanced', 'rhythmic', 'groove']
  },
  {
    id: 'shaker_hard_01',
    name: 'Hard Shaker Loop',
    url: '/audio/percussion/shaker-hard-01.wav',
    type: 'shaker',
    intensity: 'hard',
    region: 'universal',
    bpm: 118,
    duration: 2.0,
    tags: ['aggressive', 'driving', 'energetic']
  },

  // === CONGAS ===
  {
    id: 'conga_open_01',
    name: 'Conga Open',
    url: '/audio/percussion/conga-open-01.wav',
    type: 'conga',
    intensity: 'medium',
    region: 'johannesburg',
    bpm: 112,
    duration: 0.8,
    tags: ['warm', 'resonant', 'traditional']
  },
  {
    id: 'conga_slap_01',
    name: 'Conga Slap',
    url: '/audio/percussion/conga-slap-01.wav',
    type: 'conga',
    intensity: 'hard',
    region: 'durban',
    bpm: 120,
    duration: 0.4,
    tags: ['sharp', 'cutting', 'rhythmic']
  },
  {
    id: 'conga_muted_01',
    name: 'Conga Muted',
    url: '/audio/percussion/conga-muted-01.wav',
    type: 'conga',
    intensity: 'soft',
    region: 'pretoria',
    bpm: 115,
    duration: 0.5,
    tags: ['tight', 'controlled', 'subtle']
  },

  // === BONGOS ===
  {
    id: 'bongo_high_01',
    name: 'Bongo High',
    url: '/audio/percussion/bongo-high-01.wav',
    type: 'bongo',
    intensity: 'medium',
    region: 'universal',
    bpm: 115,
    duration: 0.4,
    tags: ['bright', 'articulate', 'rhythmic']
  },
  {
    id: 'bongo_low_01',
    name: 'Bongo Low',
    url: '/audio/percussion/bongo-low-01.wav',
    type: 'bongo',
    intensity: 'medium',
    region: 'universal',
    bpm: 115,
    duration: 0.5,
    tags: ['warm', 'foundational', 'groove']
  },

  // === COWBELLS ===
  {
    id: 'cowbell_bright_01',
    name: 'Bright Cowbell',
    url: '/audio/percussion/cowbell-bright-01.wav',
    type: 'cowbell',
    intensity: 'hard',
    region: 'durban',
    bpm: 120,
    duration: 0.3,
    tags: ['piercing', 'energetic', 'cutting']
  },
  {
    id: 'cowbell_muted_01',
    name: 'Muted Cowbell',
    url: '/audio/percussion/cowbell-muted-01.wav',
    type: 'cowbell',
    intensity: 'soft',
    region: 'johannesburg',
    bpm: 112,
    duration: 0.25,
    tags: ['subtle', 'groove', 'texture']
  },

  // === RIDES ===
  {
    id: 'ride_bell_01',
    name: 'Ride Bell',
    url: '/audio/percussion/ride-bell-01.wav',
    type: 'ride',
    intensity: 'medium',
    region: 'cape-town',
    bpm: 115,
    duration: 1.5,
    tags: ['shimmering', 'melodic', 'atmospheric']
  },
  {
    id: 'ride_tip_01',
    name: 'Ride Tip',
    url: '/audio/percussion/ride-tip-01.wav',
    type: 'ride',
    intensity: 'soft',
    region: 'pretoria',
    bpm: 115,
    duration: 1.2,
    tags: ['subtle', 'jazzy', 'refined']
  },

  // === TAMBOURINES ===
  {
    id: 'tambourine_shake_01',
    name: 'Tambourine Shake',
    url: '/audio/percussion/tambourine-shake-01.wav',
    type: 'tambourine',
    intensity: 'medium',
    region: 'universal',
    bpm: 118,
    duration: 0.5,
    tags: ['bright', 'jingly', 'energetic']
  },
  {
    id: 'tambourine_hit_01',
    name: 'Tambourine Hit',
    url: '/audio/percussion/tambourine-hit-01.wav',
    type: 'tambourine',
    intensity: 'hard',
    region: 'durban',
    bpm: 120,
    duration: 0.3,
    tags: ['sharp', 'cutting', 'accent']
  }
];

export interface PercussionPattern {
  id: string;
  name: string;
  description: string;
  complexity: number;
  samples: string[];
  pattern: Array<{
    time: number;
    sampleId: string;
    velocity: number;
  }>;
}

export const PERCUSSION_PATTERNS: PercussionPattern[] = [
  {
    id: 'basic_shaker_pattern',
    name: 'Basic Shaker Pattern',
    description: 'Simple 16th note shaker groove',
    complexity: 3,
    samples: ['shaker_medium_01'],
    pattern: [
      { time: 0, sampleId: 'shaker_medium_01', velocity: 0.7 },
      { time: 0.25, sampleId: 'shaker_medium_01', velocity: 0.4 },
      { time: 0.5, sampleId: 'shaker_medium_01', velocity: 0.7 },
      { time: 0.75, sampleId: 'shaker_medium_01', velocity: 0.4 },
      { time: 1, sampleId: 'shaker_medium_01', velocity: 0.7 },
      { time: 1.25, sampleId: 'shaker_medium_01', velocity: 0.4 },
      { time: 1.5, sampleId: 'shaker_medium_01', velocity: 0.7 },
      { time: 1.75, sampleId: 'shaker_medium_01', velocity: 0.4 }
    ]
  },
  {
    id: 'conga_bongo_combo',
    name: 'Conga + Bongo Combination',
    description: 'Layered conga and bongo pattern',
    complexity: 7,
    samples: ['conga_open_01', 'conga_slap_01', 'bongo_high_01', 'bongo_low_01'],
    pattern: [
      { time: 0, sampleId: 'conga_open_01', velocity: 0.9 },
      { time: 0.5, sampleId: 'bongo_high_01', velocity: 0.6 },
      { time: 1, sampleId: 'conga_slap_01', velocity: 0.8 },
      { time: 1.5, sampleId: 'bongo_low_01', velocity: 0.7 },
      { time: 2, sampleId: 'conga_open_01', velocity: 0.85 },
      { time: 2.75, sampleId: 'bongo_high_01', velocity: 0.5 },
      { time: 3.25, sampleId: 'conga_slap_01', velocity: 0.75 }
    ]
  }
];

export function selectPercussionSamples(
  density: number, // 0-100
  region: string,
  bpm: number
): PercussionSample[] {
  let samples: PercussionSample[] = [];
  
  // Always include shakers (foundation)
  samples.push(
    PERCUSSION_SAMPLES.find(s => s.type === 'shaker' && s.intensity === 'medium')!
  );
  
  // Add more layers based on density
  if (density > 30) {
    samples.push(
      PERCUSSION_SAMPLES.find(s => s.type === 'conga' && s.intensity === 'medium')!
    );
  }
  
  if (density > 50) {
    samples.push(
      PERCUSSION_SAMPLES.find(s => s.type === 'bongo')!
    );
  }
  
  if (density > 70) {
    samples.push(
      PERCUSSION_SAMPLES.find(s => s.type === 'cowbell')!
    );
  }
  
  if (density > 85) {
    samples.push(
      PERCUSSION_SAMPLES.find(s => s.type === 'ride')!
    );
  }
  
  return samples.filter(Boolean);
}
