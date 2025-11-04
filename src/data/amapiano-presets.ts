// Private School Piano & Amapiano Preset Library
// Inspired by Kelvin Momo, Kabza De Small, and professional producers

export interface AmapianoPreset {
  id: string;
  name: string;
  category: 'private-school' | 'classic' | 'bacardi' | 'soulful';
  description: string;
  artist: string;
  settings: {
    bpm: number;
    key: string;
    intensity: number;
    logDrumPattern: string;
    pianoStyle: string;
    bassType: string;
    percussionDensity: number;
    atmosphere: string;
  };
  stockPluginsOnly: boolean;
  tags: string[];
}

export const privateSchoolPresets: AmapianoPreset[] = [
  {
    id: 'kelvin-momo-signature',
    name: 'Kelvin Momo Deep Piano',
    category: 'private-school',
    description: 'Sophisticated log drum patterns with jazzy piano progressions',
    artist: 'Kelvin Momo',
    settings: {
      bpm: 116,
      key: 'F#m',
      intensity: 85,
      logDrumPattern: 'triplet-groove-heavy',
      pianoStyle: 'jazzy-rhodes-delayed',
      bassType: 'deep-sub-808',
      percussionDensity: 75,
      atmosphere: 'spacious-reverb'
    },
    stockPluginsOnly: true,
    tags: ['private-school', 'jazzy', 'deep', 'sophisticated']
  },
  {
    id: 'kabza-bounce',
    name: 'Kabza De Small Bounce',
    category: 'private-school',
    description: 'Energetic bounce with syncopated log drums and gospel chords',
    artist: 'Kabza De Small',
    settings: {
      bpm: 118,
      key: 'Cm',
      intensity: 80,
      logDrumPattern: 'syncopated-bounce',
      pianoStyle: 'gospel-chords-bright',
      bassType: 'rolling-sub-bass',
      percussionDensity: 85,
      atmosphere: 'tight-room'
    },
    stockPluginsOnly: true,
    tags: ['private-school', 'bouncy', 'energetic', 'gospel']
  },
  {
    id: 'private-school-minimal',
    name: 'Private School Minimal',
    category: 'private-school',
    description: 'Less is more - sparse arrangement with maximum impact',
    artist: 'Generic',
    settings: {
      bpm: 115,
      key: 'Am',
      intensity: 70,
      logDrumPattern: 'minimal-triplet',
      pianoStyle: 'single-note-melody',
      bassType: 'sustained-sub',
      percussionDensity: 50,
      atmosphere: 'wide-stereo'
    },
    stockPluginsOnly: true,
    tags: ['private-school', 'minimal', 'spacious', 'subtle']
  },
  {
    id: 'live-instrumentation',
    name: 'Live Instrumentation Style',
    category: 'private-school',
    description: 'Organic feel with live piano and saxophone elements',
    artist: 'Generic',
    settings: {
      bpm: 114,
      key: 'Dm',
      intensity: 75,
      logDrumPattern: 'organic-groove',
      pianoStyle: 'live-grand-piano',
      bassType: 'electric-bass',
      percussionDensity: 65,
      atmosphere: 'natural-room'
    },
    stockPluginsOnly: true,
    tags: ['private-school', 'live', 'organic', 'soulful']
  },
  {
    id: 'classic-log-heavy',
    name: 'Classic Log Drum Heavy',
    category: 'classic',
    description: 'Traditional amapiano with prominent log drums',
    artist: 'Generic',
    settings: {
      bpm: 118,
      key: 'F#m',
      intensity: 90,
      logDrumPattern: 'traditional-heavy',
      pianoStyle: 'classic-stabs',
      bassType: 'deep-sub-808',
      percussionDensity: 80,
      atmosphere: 'tight-compressed'
    },
    stockPluginsOnly: true,
    tags: ['classic', 'traditional', 'log-drums', 'heavy']
  },
  {
    id: 'bacardi-groove',
    name: 'Bacardi Piano Groove',
    category: 'bacardi',
    description: 'Smooth, laid-back groove with melodic focus',
    artist: 'Generic',
    settings: {
      bpm: 112,
      key: 'Gm',
      intensity: 65,
      logDrumPattern: 'laid-back-shuffle',
      pianoStyle: 'melodic-keys',
      bassType: 'warm-sub',
      percussionDensity: 60,
      atmosphere: 'warm-analog'
    },
    stockPluginsOnly: true,
    tags: ['bacardi', 'smooth', 'melodic', 'groove']
  },
  {
    id: 'soulful-vocal-blend',
    name: 'Soulful Vocal Blend',
    category: 'soulful',
    description: 'Emphasis on harmonies and vocal-driven arrangements',
    artist: 'Generic',
    settings: {
      bpm: 116,
      key: 'Eb',
      intensity: 70,
      logDrumPattern: 'supporting-groove',
      pianoStyle: 'harmonic-pads',
      bassType: 'sub-bass-support',
      percussionDensity: 55,
      atmosphere: 'vocal-focused'
    },
    stockPluginsOnly: true,
    tags: ['soulful', 'vocal', 'harmonic', 'emotional']
  }
];

export const getPresetsByCategory = (category: string) => {
  return privateSchoolPresets.filter(preset => preset.category === category);
};

export const getPresetById = (id: string) => {
  return privateSchoolPresets.find(preset => preset.id === id);
};
