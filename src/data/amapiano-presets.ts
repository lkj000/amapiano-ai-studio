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
  },
  // MFR Souls Presets
  {
    id: 'mfr-souls-deep',
    name: 'MFR Souls Deep House Piano',
    category: 'private-school',
    description: 'Deep house influenced with soulful piano chords and atmospheric pads',
    artist: 'MFR Souls',
    settings: {
      bpm: 115,
      key: 'Am',
      intensity: 78,
      logDrumPattern: 'deep-house-swing',
      pianoStyle: 'soulful-deep-chords',
      bassType: 'warm-deep-sub',
      percussionDensity: 70,
      atmosphere: 'deep-spacious'
    },
    stockPluginsOnly: true,
    tags: ['mfr-souls', 'deep-house', 'soulful', 'atmospheric']
  },
  {
    id: 'mfr-souls-uplifting',
    name: 'MFR Souls Uplifting',
    category: 'soulful',
    description: 'Uplifting melodies with emotional progression',
    artist: 'MFR Souls',
    settings: {
      bpm: 117,
      key: 'C',
      intensity: 75,
      logDrumPattern: 'uplifting-bounce',
      pianoStyle: 'melodic-uplifting',
      bassType: 'rolling-warm-bass',
      percussionDensity: 72,
      atmosphere: 'bright-open'
    },
    stockPluginsOnly: true,
    tags: ['mfr-souls', 'uplifting', 'emotional', 'melodic']
  },
  // Vigro Deep Presets
  {
    id: 'vigro-deep-signature',
    name: 'Vigro Deep Signature Sound',
    category: 'private-school',
    description: 'Intricate percussion with minimalist piano and deep bass',
    artist: 'Vigro Deep',
    settings: {
      bpm: 113,
      key: 'F#m',
      intensity: 82,
      logDrumPattern: 'intricate-minimal',
      pianoStyle: 'sparse-mysterious',
      bassType: 'deep-808-sub',
      percussionDensity: 88,
      atmosphere: 'dark-minimal'
    },
    stockPluginsOnly: true,
    tags: ['vigro-deep', 'intricate', 'minimal', 'percussion-heavy']
  },
  {
    id: 'vigro-deep-melodic',
    name: 'Vigro Deep Melodic',
    category: 'bacardi',
    description: 'Melodic focus with signature percussion patterns',
    artist: 'Vigro Deep',
    settings: {
      bpm: 114,
      key: 'Gm',
      intensity: 73,
      logDrumPattern: 'signature-shuffle',
      pianoStyle: 'melodic-lead',
      bassType: 'smooth-sub',
      percussionDensity: 85,
      atmosphere: 'melodic-space'
    },
    stockPluginsOnly: true,
    tags: ['vigro-deep', 'melodic', 'signature', 'smooth']
  },
  // De Mthuda Presets
  {
    id: 'de-mthuda-groovy',
    name: 'De Mthuda Groovy Piano',
    category: 'classic',
    description: 'Groovy piano stabs with energetic log drums',
    artist: 'De Mthuda',
    settings: {
      bpm: 118,
      key: 'Dm',
      intensity: 85,
      logDrumPattern: 'groovy-energetic',
      pianoStyle: 'stab-chords',
      bassType: 'punchy-sub',
      percussionDensity: 82,
      atmosphere: 'energetic-tight'
    },
    stockPluginsOnly: true,
    tags: ['de-mthuda', 'groovy', 'energetic', 'piano-stabs']
  },
  {
    id: 'de-mthuda-vocal',
    name: 'De Mthuda Vocal Amapiano',
    category: 'soulful',
    description: 'Vocal-friendly arrangement with supporting instrumentation',
    artist: 'De Mthuda',
    settings: {
      bpm: 116,
      key: 'Bb',
      intensity: 70,
      logDrumPattern: 'vocal-support',
      pianoStyle: 'chord-progression',
      bassType: 'supportive-sub',
      percussionDensity: 65,
      atmosphere: 'vocal-space'
    },
    stockPluginsOnly: true,
    tags: ['de-mthuda', 'vocal', 'supporting', 'commercial']
  },
  // Additional Regional Styles
  {
    id: 'pretoria-sound',
    name: 'Pretoria Underground Sound',
    category: 'private-school',
    description: 'Dark, underground Pretoria style with experimental elements',
    artist: 'Regional Style',
    settings: {
      bpm: 112,
      key: 'Em',
      intensity: 88,
      logDrumPattern: 'experimental-dark',
      pianoStyle: 'dissonant-chords',
      bassType: 'rumbling-sub',
      percussionDensity: 90,
      atmosphere: 'underground-dark'
    },
    stockPluginsOnly: true,
    tags: ['pretoria', 'underground', 'dark', 'experimental']
  },
  {
    id: 'durban-bounce',
    name: 'Durban Gqom Influence',
    category: 'classic',
    description: 'High-energy with Gqom influences and heavy bass',
    artist: 'Regional Style',
    settings: {
      bpm: 120,
      key: 'Cm',
      intensity: 92,
      logDrumPattern: 'gqom-influenced',
      pianoStyle: 'minimal-stabs',
      bassType: 'heavy-808',
      percussionDensity: 95,
      atmosphere: 'energetic-compressed'
    },
    stockPluginsOnly: true,
    tags: ['durban', 'gqom', 'high-energy', 'heavy-bass']
  },
  {
    id: 'joburg-commercial',
    name: 'Johannesburg Commercial',
    category: 'classic',
    description: 'Radio-friendly commercial sound from Johannesburg scene',
    artist: 'Regional Style',
    settings: {
      bpm: 118,
      key: 'G',
      intensity: 75,
      logDrumPattern: 'commercial-bounce',
      pianoStyle: 'catchy-memorable',
      bassType: 'commercial-sub',
      percussionDensity: 75,
      atmosphere: 'bright-polished'
    },
    stockPluginsOnly: true,
    tags: ['johannesburg', 'commercial', 'radio-friendly', 'catchy']
  },
  // Specialized Styles
  {
    id: 'live-band-fusion',
    name: 'Live Band Fusion',
    category: 'private-school',
    description: 'Fusion with live band elements - bass guitar, horns, strings',
    artist: 'Hybrid Style',
    settings: {
      bpm: 114,
      key: 'D',
      intensity: 72,
      logDrumPattern: 'live-feel-groove',
      pianoStyle: 'rhodes-organic',
      bassType: 'electric-bass',
      percussionDensity: 68,
      atmosphere: 'live-room'
    },
    stockPluginsOnly: true,
    tags: ['live-band', 'fusion', 'organic', 'hybrid']
  },
  {
    id: 'afro-tech-blend',
    name: 'Afro-Tech Amapiano',
    category: 'bacardi',
    description: 'Blend of Afro-house and amapiano with tech house elements',
    artist: 'Hybrid Style',
    settings: {
      bpm: 115,
      key: 'Am',
      intensity: 80,
      logDrumPattern: 'tech-house-swing',
      pianoStyle: 'tech-stabs',
      bassType: 'tech-sub-bass',
      percussionDensity: 78,
      atmosphere: 'tech-spacious'
    },
    stockPluginsOnly: true,
    tags: ['afro-tech', 'tech-house', 'hybrid', 'modern']
  },
  {
    id: 'gospel-amapiano',
    name: 'Gospel Amapiano',
    category: 'soulful',
    description: 'Gospel-influenced with uplifting chords and inspirational feel',
    artist: 'Spiritual Style',
    settings: {
      bpm: 116,
      key: 'C',
      intensity: 68,
      logDrumPattern: 'gospel-swing',
      pianoStyle: 'gospel-progression',
      bassType: 'warm-supportive',
      percussionDensity: 60,
      atmosphere: 'uplifting-spacious'
    },
    stockPluginsOnly: true,
    tags: ['gospel', 'spiritual', 'uplifting', 'inspirational']
  }
];

export const getPresetsByCategory = (category: string) => {
  return privateSchoolPresets.filter(preset => preset.category === category);
};

export const getPresetById = (id: string) => {
  return privateSchoolPresets.find(preset => preset.id === id);
};
