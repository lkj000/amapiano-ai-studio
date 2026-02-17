// Genre-aware defaults for BPM, Key, and cultural context
// Reference: https://www.gemtracks.com/resources/song-genres/view-genres.php?genre=amapiano

export interface GenreDefault {
  bpmRange: [number, number];
  suggestedBpm: number;
  commonKeys: string[];
  description: string;
  swingRange: [number, number];
  logDrumDefault: number;
}

export const GENRE_DEFAULTS: Record<string, GenreDefault> = {
  'Amapiano': { 
    bpmRange: [110, 120], suggestedBpm: 115, 
    commonKeys: ['Am', 'Cm', 'Fm', 'Gm'], 
    description: 'Original Amapiano — log drums, deep bass, groovy piano stabs',
    swingRange: [50, 65], logDrumDefault: 60,
  },
  'Amapiano (Soweto)': { 
    bpmRange: [110, 118], suggestedBpm: 114, 
    commonKeys: ['Am', 'Dm', 'Gm'], 
    description: 'Soweto rooted — warm basslines, township soul influences',
    swingRange: [55, 70], logDrumDefault: 55,
  },
  'Amapiano (Pretoria/Pitori)': { 
    bpmRange: [112, 122], suggestedBpm: 118, 
    commonKeys: ['Cm', 'Fm', 'Gm'], 
    description: 'Pitori sound — aggressive log drums, bacardi energy, vocal chants',
    swingRange: [45, 60], logDrumDefault: 75,
  },
  'Amapiano (Durban)': { 
    bpmRange: [108, 116], suggestedBpm: 112, 
    commonKeys: ['Am', 'Em', 'Dm'], 
    description: 'Durban flavor — Gqom undertones, darker textures, tribal percussion',
    swingRange: [40, 55], logDrumDefault: 65,
  },
  'private-school': { 
    bpmRange: [112, 122], suggestedBpm: 118, 
    commonKeys: ['Am', 'Dm', 'Em', 'Cm'], 
    description: 'Jazzy chords, lush pads, sophisticated melodies — Kelvin Momo, Tyler ICU',
    swingRange: [55, 75], logDrumDefault: 40,
  },
  'vocal': { 
    bpmRange: [108, 118], suggestedBpm: 112, 
    commonKeys: ['C', 'F', 'G', 'Am'], 
    description: 'Vocal-driven — soulful melodies, Nkosazana/Boohle harmonies',
    swingRange: [50, 65], logDrumDefault: 45,
  },
  'deep': { 
    bpmRange: [106, 116], suggestedBpm: 110, 
    commonKeys: ['Cm', 'Fm', 'Dm', 'Gm'], 
    description: 'Slow, hypnotic — deep basslines, minimal percussion, late-night energy',
    swingRange: [55, 70], logDrumDefault: 35,
  },
  'Bacardi': { 
    bpmRange: [114, 124], suggestedBpm: 120, 
    commonKeys: ['Cm', 'Gm', 'Fm'], 
    description: 'High-energy dance — aggressive log drums, fast percussion, party anthems',
    swingRange: [40, 55], logDrumDefault: 80,
  },
  'Kwaito': { 
    bpmRange: [100, 115], suggestedBpm: 108, 
    commonKeys: ['Am', 'Dm', 'Em'], 
    description: 'Township roots — slower groove, bass-heavy, storytelling vocals',
    swingRange: [60, 75], logDrumDefault: 50,
  },
  'Afrobeats': { 
    bpmRange: [100, 120], suggestedBpm: 110, 
    commonKeys: ['C', 'G', 'Am', 'Dm'], 
    description: 'West African rhythms — polyrhythmic percussion, melodic hooks',
    swingRange: [45, 60], logDrumDefault: 30,
  },
  'Afro-House': { 
    bpmRange: [118, 128], suggestedBpm: 124, 
    commonKeys: ['Am', 'Cm', 'Dm'], 
    description: 'Deep house meets African rhythms — driving 4/4 with tribal elements',
    swingRange: [35, 50], logDrumDefault: 25,
  },
  'Deep House SA': { 
    bpmRange: [118, 126], suggestedBpm: 122, 
    commonKeys: ['Am', 'Cm', 'Fm'], 
    description: 'South African deep house — smooth chords, sustained pads, soulful vocals',
    swingRange: [40, 55], logDrumDefault: 20,
  },
  'Gqom': { 
    bpmRange: [120, 140], suggestedBpm: 130, 
    commonKeys: ['Cm', 'Dm', 'Fm'], 
    description: 'Durban raw energy — dark, repetitive, heavy bass, industrial percussion',
    swingRange: [30, 45], logDrumDefault: 70,
  },
  'Gospel House': { 
    bpmRange: [110, 122], suggestedBpm: 116, 
    commonKeys: ['C', 'F', 'G', 'Bb'], 
    description: 'Gospel-infused house — uplifting chords, choir harmonies, spiritual energy',
    swingRange: [50, 65], logDrumDefault: 30,
  },
};

// All musical keys (major & minor)
export const MUSICAL_KEYS = [
  'C', 'Cm', 'C#', 'C#m', 'D', 'Dm', 'D#', 'D#m', 
  'E', 'Em', 'F', 'Fm', 'F#', 'F#m', 'G', 'Gm', 
  'G#', 'G#m', 'A', 'Am', 'A#', 'A#m', 'B', 'Bm'
];

// Moods shared across all generators
export const GENERATION_MOODS = [
  'energetic', 'chill', 'melancholic', 'uplifting', 'dark', 
  'romantic', 'aggressive', 'peaceful', 'nostalgic', 'euphoric',
  'groovy', 'deep', 'spiritual', 'party'
] as const;

export type GenerationMood = typeof GENERATION_MOODS[number];

// Gasp timing options
export const GASP_TIMING_OPTIONS = [
  { value: 'beat1', label: 'Classic (Beat 1)', description: 'Traditional gasp placement on the downbeat' },
  { value: 'beat3', label: 'Off-Beat (Beat 3)', description: 'Syncopated gasp for driving energy' },
  { value: 'pre-drop', label: 'Pre-Drop', description: 'Gasp right before the drop for maximum impact' },
  { value: 'none', label: 'No Gasp', description: 'Clean production without vocal gasps' },
] as const;

// Helper to get genre defaults with fallback
// Maps dropdown values to GENRE_DEFAULTS keys
export function getGenreDefaults(genre: string): GenreDefault {
  const aliasMap: Record<string, string> = {
    'classic': 'Amapiano',
  };
  const key = aliasMap[genre] || genre;
  return GENRE_DEFAULTS[key] || GENRE_DEFAULTS['Amapiano'];
}
