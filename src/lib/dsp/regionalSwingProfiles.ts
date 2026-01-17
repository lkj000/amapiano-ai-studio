/**
 * Regional Swing Profiles - Comprehensive South African Micro-Timing System
 * 
 * Implements authentic regional swing patterns with precise micro-timing offsets
 * derived from analysis of authentic recordings from each region.
 * 
 * Key concept: "Gauteng Swing" - the characteristic 58.3% swing offset that defines
 * the Johannesburg/Pretoria Amapiano sound.
 */

export interface MicroTimingOffset {
  /** Offset in milliseconds from grid position */
  ms: number;
  /** Offset as percentage of beat subdivision */
  percentage: number;
}

export interface RegionalSwingProfile {
  name: string;
  region: string;
  province: SouthAfricanProvince;
  
  /** Primary swing percentage (50% = straight, 66.7% = triplet swing) */
  swingPercentage: number;
  
  /** Characteristic description */
  description: string;
  
  /** Cultural/musical context */
  culturalContext: string;
  
  /** Typical BPM range for this style */
  bpmRange: { min: number; max: number };
  
  /** 16-step micro-timing offsets in ms (one bar of 16th notes) */
  microTimingOffsets: number[];
  
  /** 16-step velocity accents (0.0-1.0) */
  velocityAccents: number[];
  
  /** Ghost note positions (0-15) */
  ghostNotePositions: number[];
  
  /** Beat 1 silence - characteristic "Amapiano Gasp" */
  beat1Silence: Beat1SilenceConfig;
  
  /** Log drum characteristic timing */
  logDrumTiming: LogDrumTimingConfig;
  
  /** Piano (keys) timing feel */
  pianoFeel: PianoFeelConfig;
  
  /** Kick drum placement style */
  kickStyle: KickStyleConfig;
  
  /** Related genres and influences */
  influences: string[];
}

export type SouthAfricanProvince = 
  | 'gauteng'
  | 'western-cape'
  | 'kwazulu-natal'
  | 'eastern-cape'
  | 'free-state'
  | 'mpumalanga'
  | 'limpopo'
  | 'north-west'
  | 'northern-cape';

export interface Beat1SilenceConfig {
  /** Whether to apply beat 1 silence */
  enabled: boolean;
  /** Duration of silence in 16th notes (1-4) */
  duration: number;
  /** Percentage of times to apply (for variation) */
  probability: number;
  /** Whether the silence is a complete rest or reduced velocity */
  type: 'complete' | 'reduced' | 'ghost';
  /** For 'reduced' type, velocity multiplier */
  velocityMultiplier?: number;
}

export interface LogDrumTimingConfig {
  /** Swing applied specifically to log drums */
  swingAmount: number;
  /** Characteristic offset for the log drum "bounce" */
  bounceOffset: number;
  /** Attack sharpness (0-1) */
  attackSharpness: number;
  /** Pattern density (sparse to dense) */
  density: 'sparse' | 'medium' | 'dense';
}

export interface PianoFeelConfig {
  /** Chord strum timing spread in ms */
  strumSpread: number;
  /** Strum direction tendency */
  strumDirection: 'up' | 'down' | 'alternating' | 'random';
  /** Legato vs staccato tendency (0-1) */
  legatoAmount: number;
  /** Bass note anticipation in ms */
  bassAnticipation: number;
}

export interface KickStyleConfig {
  /** Kick placement style */
  placement: 'on-beat' | 'anticipated' | 'lazy' | 'syncopated';
  /** Anticipation/lag amount in ms */
  offsetMs: number;
  /** Four-on-the-floor or pattern-based */
  pattern: 'four-floor' | 'pattern' | 'minimal';
  /** Sidechain duck depth */
  sidechainDepth: number;
}

/**
 * Comprehensive Regional Swing Profiles
 * Based on analysis of regional Amapiano production styles
 */
export const REGIONAL_SWING_PROFILES: Record<string, RegionalSwingProfile> = {
  // === GAUTENG PROVINCE ===
  'johannesburg-deep': {
    name: 'Johannesburg Deep',
    region: 'Johannesburg',
    province: 'gauteng',
    swingPercentage: 58.3, // The signature Gauteng Swing
    description: 'The definitive Gauteng swing - laid-back yet driving',
    culturalContext: 'Born in Johannesburg\'s townships, refined in studios across Soweto and Sandton',
    bpmRange: { min: 110, max: 118 },
    microTimingOffsets: [0, 12, -5, 18, 0, 14, -8, 16, 0, 10, -6, 20, 0, 15, -4, 17],
    velocityAccents: [1.0, 0.65, 0.85, 0.70, 0.95, 0.60, 0.88, 0.68, 0.98, 0.62, 0.82, 0.72, 0.92, 0.64, 0.86, 0.66],
    ghostNotePositions: [2, 6, 10, 14],
    beat1Silence: {
      enabled: true,
      duration: 2,
      probability: 0.7,
      type: 'reduced',
      velocityMultiplier: 0.3
    },
    logDrumTiming: {
      swingAmount: 0.60,
      bounceOffset: 8,
      attackSharpness: 0.7,
      density: 'medium'
    },
    pianoFeel: {
      strumSpread: 25,
      strumDirection: 'up',
      legatoAmount: 0.6,
      bassAnticipation: 15
    },
    kickStyle: {
      placement: 'lazy',
      offsetMs: 5,
      pattern: 'pattern',
      sidechainDepth: 0.6
    },
    influences: ['Deep House', 'Kwaito', 'Jazz']
  },

  'johannesburg-private-school': {
    name: 'Private School Amapiano',
    region: 'Johannesburg North',
    province: 'gauteng',
    swingPercentage: 55.0,
    description: 'Cleaner, more polished production style',
    culturalContext: 'The mainstream commercial sound that crossed over internationally',
    bpmRange: { min: 112, max: 120 },
    microTimingOffsets: [0, 8, -3, 12, 0, 10, -5, 14, 0, 6, -4, 10, 0, 9, -3, 11],
    velocityAccents: [1.0, 0.70, 0.88, 0.75, 0.98, 0.68, 0.90, 0.72, 1.0, 0.66, 0.85, 0.70, 0.95, 0.68, 0.88, 0.70],
    ghostNotePositions: [6, 14],
    beat1Silence: {
      enabled: true,
      duration: 1,
      probability: 0.5,
      type: 'ghost'
    },
    logDrumTiming: {
      swingAmount: 0.55,
      bounceOffset: 5,
      attackSharpness: 0.8,
      density: 'medium'
    },
    pianoFeel: {
      strumSpread: 15,
      strumDirection: 'alternating',
      legatoAmount: 0.7,
      bassAnticipation: 10
    },
    kickStyle: {
      placement: 'on-beat',
      offsetMs: 0,
      pattern: 'four-floor',
      sidechainDepth: 0.5
    },
    influences: ['Pop', 'R&B', 'Electronic']
  },

  'soweto-authentic': {
    name: 'Soweto Authentic',
    region: 'Soweto',
    province: 'gauteng',
    swingPercentage: 62.0,
    description: 'Raw, unpolished township feel with heavy swing',
    culturalContext: 'The original township sound - parties, taverns, and street corners',
    bpmRange: { min: 108, max: 115 },
    microTimingOffsets: [0, 18, -8, 25, 0, 20, -10, 22, 0, 16, -9, 28, 0, 22, -6, 24],
    velocityAccents: [0.95, 0.55, 0.80, 0.60, 1.0, 0.50, 0.85, 0.58, 0.92, 0.52, 0.78, 0.62, 0.98, 0.54, 0.82, 0.56],
    ghostNotePositions: [1, 3, 5, 7, 9, 11, 13, 15],
    beat1Silence: {
      enabled: true,
      duration: 3,
      probability: 0.85,
      type: 'complete'
    },
    logDrumTiming: {
      swingAmount: 0.65,
      bounceOffset: 12,
      attackSharpness: 0.5,
      density: 'dense'
    },
    pianoFeel: {
      strumSpread: 35,
      strumDirection: 'down',
      legatoAmount: 0.4,
      bassAnticipation: 25
    },
    kickStyle: {
      placement: 'syncopated',
      offsetMs: 8,
      pattern: 'pattern',
      sidechainDepth: 0.7
    },
    influences: ['Kwaito', 'Maskandi', 'Afro-Jazz']
  },

  'pretoria-bounce': {
    name: 'Pretoria Bounce',
    region: 'Pretoria',
    province: 'gauteng',
    swingPercentage: 56.5,
    description: 'Energetic, bouncy feel with tighter pocket',
    culturalContext: 'Capital city energy meets township roots',
    bpmRange: { min: 112, max: 120 },
    microTimingOffsets: [0, 10, -4, 15, 0, 12, -6, 14, 0, 8, -5, 16, 0, 11, -4, 13],
    velocityAccents: [1.0, 0.68, 0.90, 0.72, 0.98, 0.65, 0.88, 0.70, 0.96, 0.66, 0.86, 0.74, 0.94, 0.67, 0.87, 0.69],
    ghostNotePositions: [2, 6, 10, 14],
    beat1Silence: {
      enabled: true,
      duration: 1,
      probability: 0.6,
      type: 'reduced',
      velocityMultiplier: 0.4
    },
    logDrumTiming: {
      swingAmount: 0.58,
      bounceOffset: 6,
      attackSharpness: 0.75,
      density: 'medium'
    },
    pianoFeel: {
      strumSpread: 20,
      strumDirection: 'alternating',
      legatoAmount: 0.55,
      bassAnticipation: 12
    },
    kickStyle: {
      placement: 'anticipated',
      offsetMs: -3,
      pattern: 'four-floor',
      sidechainDepth: 0.55
    },
    influences: ['House', 'Kwaito', 'Hip-Hop']
  },

  // === KWAZULU-NATAL ===
  'durban-gqom': {
    name: 'Durban Gqom-Piano',
    region: 'Durban',
    province: 'kwazulu-natal',
    swingPercentage: 52.0,
    description: 'Gqom-influenced straight feel with dark undertones',
    culturalContext: 'Where Gqom meets Amapiano - raw Durban energy',
    bpmRange: { min: 115, max: 125 },
    microTimingOffsets: [0, 4, -2, 6, 0, 5, -3, 7, 0, 3, -2, 5, 0, 4, -2, 6],
    velocityAccents: [0.95, 0.75, 0.90, 0.78, 1.0, 0.72, 0.88, 0.76, 0.94, 0.74, 0.86, 0.80, 0.98, 0.73, 0.89, 0.77],
    ghostNotePositions: [4, 12],
    beat1Silence: {
      enabled: false,
      duration: 0,
      probability: 0,
      type: 'complete'
    },
    logDrumTiming: {
      swingAmount: 0.52,
      bounceOffset: 3,
      attackSharpness: 0.9,
      density: 'dense'
    },
    pianoFeel: {
      strumSpread: 10,
      strumDirection: 'down',
      legatoAmount: 0.3,
      bassAnticipation: 5
    },
    kickStyle: {
      placement: 'on-beat',
      offsetMs: 0,
      pattern: 'pattern',
      sidechainDepth: 0.8
    },
    influences: ['Gqom', 'Afro-Tech', 'Tribal']
  },

  'durban-smooth': {
    name: 'Durban Smooth',
    region: 'Durban North',
    province: 'kwazulu-natal',
    swingPercentage: 57.0,
    description: 'Coastal smoothness with Zulu melodic influence',
    culturalContext: 'Beach vibes meet traditional Zulu music',
    bpmRange: { min: 108, max: 116 },
    microTimingOffsets: [0, 14, -6, 18, 0, 12, -7, 16, 0, 10, -5, 15, 0, 13, -4, 17],
    velocityAccents: [1.0, 0.62, 0.84, 0.68, 0.96, 0.60, 0.86, 0.66, 0.98, 0.64, 0.82, 0.70, 0.94, 0.63, 0.85, 0.67],
    ghostNotePositions: [2, 6, 10, 14],
    beat1Silence: {
      enabled: true,
      duration: 2,
      probability: 0.65,
      type: 'reduced',
      velocityMultiplier: 0.35
    },
    logDrumTiming: {
      swingAmount: 0.58,
      bounceOffset: 7,
      attackSharpness: 0.6,
      density: 'medium'
    },
    pianoFeel: {
      strumSpread: 28,
      strumDirection: 'up',
      legatoAmount: 0.7,
      bassAnticipation: 18
    },
    kickStyle: {
      placement: 'lazy',
      offsetMs: 4,
      pattern: 'pattern',
      sidechainDepth: 0.5
    },
    influences: ['Maskandi', 'Afro-Soul', 'Gospel']
  },

  // === WESTERN CAPE ===
  'cape-town-jazzy': {
    name: 'Cape Town Jazzy',
    region: 'Cape Town',
    province: 'western-cape',
    swingPercentage: 64.0,
    description: 'Jazz-influenced heavy swing with sophisticated harmony',
    culturalContext: 'Mother City jazz heritage meets modern electronic',
    bpmRange: { min: 105, max: 115 },
    microTimingOffsets: [0, 20, -8, 24, 0, 18, -10, 22, 0, 16, -7, 26, 0, 19, -6, 23],
    velocityAccents: [1.0, 0.58, 0.82, 0.64, 0.94, 0.55, 0.80, 0.62, 0.96, 0.60, 0.78, 0.66, 0.92, 0.57, 0.81, 0.63],
    ghostNotePositions: [1, 3, 5, 7, 9, 11, 13, 15],
    beat1Silence: {
      enabled: true,
      duration: 2,
      probability: 0.75,
      type: 'ghost'
    },
    logDrumTiming: {
      swingAmount: 0.62,
      bounceOffset: 10,
      attackSharpness: 0.5,
      density: 'sparse'
    },
    pianoFeel: {
      strumSpread: 40,
      strumDirection: 'random',
      legatoAmount: 0.8,
      bassAnticipation: 20
    },
    kickStyle: {
      placement: 'lazy',
      offsetMs: 8,
      pattern: 'minimal',
      sidechainDepth: 0.4
    },
    influences: ['Cape Jazz', 'Deep House', 'Soul']
  },

  'cape-town-township': {
    name: 'Cape Flats',
    region: 'Cape Flats',
    province: 'western-cape',
    swingPercentage: 60.0,
    description: 'Township energy with distinct Cape character',
    culturalContext: 'Gugulethu, Khayelitsha, Langa - authentic Cape township sound',
    bpmRange: { min: 110, max: 118 },
    microTimingOffsets: [0, 16, -6, 20, 0, 14, -8, 18, 0, 12, -5, 22, 0, 15, -7, 19],
    velocityAccents: [0.98, 0.60, 0.85, 0.65, 1.0, 0.58, 0.82, 0.68, 0.96, 0.62, 0.80, 0.70, 0.94, 0.59, 0.83, 0.66],
    ghostNotePositions: [2, 6, 10, 14],
    beat1Silence: {
      enabled: true,
      duration: 2,
      probability: 0.8,
      type: 'complete'
    },
    logDrumTiming: {
      swingAmount: 0.60,
      bounceOffset: 9,
      attackSharpness: 0.65,
      density: 'medium'
    },
    pianoFeel: {
      strumSpread: 30,
      strumDirection: 'down',
      legatoAmount: 0.5,
      bassAnticipation: 15
    },
    kickStyle: {
      placement: 'syncopated',
      offsetMs: 6,
      pattern: 'pattern',
      sidechainDepth: 0.6
    },
    influences: ['Kwaito', 'Ghoema', 'Afro-Soul']
  },

  // === EASTERN CAPE ===
  'eastern-cape-xhosa': {
    name: 'Eastern Cape Xhosa',
    region: 'East London/Mthatha',
    province: 'eastern-cape',
    swingPercentage: 59.0,
    description: 'Xhosa musical traditions meet Amapiano',
    culturalContext: 'Rich Xhosa heritage with click consonant rhythmic influence',
    bpmRange: { min: 108, max: 116 },
    microTimingOffsets: [0, 15, -7, 19, 0, 13, -9, 17, 0, 11, -6, 21, 0, 14, -5, 18],
    velocityAccents: [1.0, 0.58, 0.83, 0.66, 0.95, 0.55, 0.80, 0.64, 0.97, 0.60, 0.78, 0.68, 0.93, 0.57, 0.82, 0.65],
    ghostNotePositions: [1, 5, 9, 13],
    beat1Silence: {
      enabled: true,
      duration: 2,
      probability: 0.7,
      type: 'reduced',
      velocityMultiplier: 0.25
    },
    logDrumTiming: {
      swingAmount: 0.58,
      bounceOffset: 8,
      attackSharpness: 0.55,
      density: 'medium'
    },
    pianoFeel: {
      strumSpread: 32,
      strumDirection: 'up',
      legatoAmount: 0.65,
      bassAnticipation: 16
    },
    kickStyle: {
      placement: 'lazy',
      offsetMs: 6,
      pattern: 'pattern',
      sidechainDepth: 0.55
    },
    influences: ['Umbhaqanga', 'Maskandi', 'Gospel']
  },

  // === FREE STATE ===
  'free-state-seso': {
    name: 'Free State Sesotho',
    region: 'Bloemfontein',
    province: 'free-state',
    swingPercentage: 57.5,
    description: 'Sesotho influence with open, airy production',
    culturalContext: 'Heartland of South Africa with Sotho musical roots',
    bpmRange: { min: 110, max: 118 },
    microTimingOffsets: [0, 13, -5, 17, 0, 11, -7, 15, 0, 9, -4, 18, 0, 12, -6, 16],
    velocityAccents: [1.0, 0.64, 0.86, 0.70, 0.96, 0.62, 0.84, 0.68, 0.98, 0.66, 0.82, 0.72, 0.94, 0.63, 0.85, 0.69],
    ghostNotePositions: [3, 7, 11, 15],
    beat1Silence: {
      enabled: true,
      duration: 1,
      probability: 0.6,
      type: 'reduced',
      velocityMultiplier: 0.4
    },
    logDrumTiming: {
      swingAmount: 0.56,
      bounceOffset: 6,
      attackSharpness: 0.65,
      density: 'medium'
    },
    pianoFeel: {
      strumSpread: 22,
      strumDirection: 'alternating',
      legatoAmount: 0.6,
      bassAnticipation: 12
    },
    kickStyle: {
      placement: 'on-beat',
      offsetMs: 2,
      pattern: 'four-floor',
      sidechainDepth: 0.5
    },
    influences: ['Famo', 'Gospel', 'House']
  },

  // === MPUMALANGA ===
  'mpumalanga-lowveld': {
    name: 'Mpumalanga Lowveld',
    region: 'Nelspruit/Mbombela',
    province: 'mpumalanga',
    swingPercentage: 58.0,
    description: 'Laid-back lowveld groove with Swazi influence',
    culturalContext: 'Where South Africa meets Eswatini and Mozambique',
    bpmRange: { min: 108, max: 116 },
    microTimingOffsets: [0, 14, -6, 18, 0, 12, -8, 16, 0, 10, -5, 20, 0, 13, -4, 17],
    velocityAccents: [1.0, 0.62, 0.84, 0.68, 0.96, 0.60, 0.82, 0.66, 0.98, 0.64, 0.80, 0.70, 0.94, 0.61, 0.83, 0.67],
    ghostNotePositions: [2, 6, 10, 14],
    beat1Silence: {
      enabled: true,
      duration: 2,
      probability: 0.65,
      type: 'ghost'
    },
    logDrumTiming: {
      swingAmount: 0.58,
      bounceOffset: 7,
      attackSharpness: 0.6,
      density: 'medium'
    },
    pianoFeel: {
      strumSpread: 26,
      strumDirection: 'up',
      legatoAmount: 0.65,
      bassAnticipation: 14
    },
    kickStyle: {
      placement: 'lazy',
      offsetMs: 5,
      pattern: 'pattern',
      sidechainDepth: 0.55
    },
    influences: ['Marrabenta', 'Swazi Traditional', 'House']
  },

  // === LIMPOPO ===
  'limpopo-venda': {
    name: 'Limpopo Venda',
    region: 'Thohoyandou',
    province: 'limpopo',
    swingPercentage: 60.5,
    description: 'Venda influence with distinctive drum patterns',
    culturalContext: 'Ancient Venda rhythmic traditions in modern form',
    bpmRange: { min: 106, max: 114 },
    microTimingOffsets: [0, 17, -7, 21, 0, 15, -9, 19, 0, 13, -6, 23, 0, 16, -5, 20],
    velocityAccents: [0.98, 0.56, 0.82, 0.62, 1.0, 0.54, 0.78, 0.60, 0.96, 0.58, 0.76, 0.64, 0.94, 0.55, 0.80, 0.61],
    ghostNotePositions: [1, 3, 5, 7, 9, 11, 13, 15],
    beat1Silence: {
      enabled: true,
      duration: 3,
      probability: 0.8,
      type: 'complete'
    },
    logDrumTiming: {
      swingAmount: 0.62,
      bounceOffset: 10,
      attackSharpness: 0.5,
      density: 'dense'
    },
    pianoFeel: {
      strumSpread: 35,
      strumDirection: 'down',
      legatoAmount: 0.55,
      bassAnticipation: 20
    },
    kickStyle: {
      placement: 'syncopated',
      offsetMs: 7,
      pattern: 'pattern',
      sidechainDepth: 0.6
    },
    influences: ['Tshivenda Traditional', 'Afro-Jazz', 'Gospel']
  },

  'limpopo-pedi': {
    name: 'Limpopo Pedi',
    region: 'Polokwane',
    province: 'limpopo',
    swingPercentage: 58.5,
    description: 'Pedi melodic sensibility with strong bass',
    culturalContext: 'Northern Sotho traditions with modern production',
    bpmRange: { min: 108, max: 116 },
    microTimingOffsets: [0, 15, -6, 19, 0, 13, -8, 17, 0, 11, -5, 21, 0, 14, -4, 18],
    velocityAccents: [1.0, 0.60, 0.84, 0.66, 0.96, 0.58, 0.80, 0.64, 0.98, 0.62, 0.78, 0.68, 0.94, 0.59, 0.82, 0.65],
    ghostNotePositions: [2, 6, 10, 14],
    beat1Silence: {
      enabled: true,
      duration: 2,
      probability: 0.7,
      type: 'reduced',
      velocityMultiplier: 0.3
    },
    logDrumTiming: {
      swingAmount: 0.59,
      bounceOffset: 8,
      attackSharpness: 0.55,
      density: 'medium'
    },
    pianoFeel: {
      strumSpread: 28,
      strumDirection: 'alternating',
      legatoAmount: 0.6,
      bassAnticipation: 15
    },
    kickStyle: {
      placement: 'lazy',
      offsetMs: 5,
      pattern: 'pattern',
      sidechainDepth: 0.55
    },
    influences: ['Sepedi Traditional', 'Kiba', 'Gospel']
  },

  // === NORTH WEST ===
  'north-west-tswana': {
    name: 'North West Tswana',
    region: 'Rustenburg/Mahikeng',
    province: 'north-west',
    swingPercentage: 56.0,
    description: 'Tswana musical heritage with clean production',
    culturalContext: 'Mining belt energy meets Tswana tradition',
    bpmRange: { min: 112, max: 120 },
    microTimingOffsets: [0, 11, -4, 15, 0, 10, -6, 14, 0, 8, -4, 16, 0, 11, -5, 13],
    velocityAccents: [1.0, 0.66, 0.88, 0.72, 0.98, 0.64, 0.86, 0.70, 0.96, 0.68, 0.84, 0.74, 0.94, 0.65, 0.87, 0.71],
    ghostNotePositions: [4, 12],
    beat1Silence: {
      enabled: true,
      duration: 1,
      probability: 0.55,
      type: 'reduced',
      velocityMultiplier: 0.45
    },
    logDrumTiming: {
      swingAmount: 0.56,
      bounceOffset: 5,
      attackSharpness: 0.7,
      density: 'medium'
    },
    pianoFeel: {
      strumSpread: 18,
      strumDirection: 'alternating',
      legatoAmount: 0.6,
      bassAnticipation: 10
    },
    kickStyle: {
      placement: 'on-beat',
      offsetMs: 0,
      pattern: 'four-floor',
      sidechainDepth: 0.5
    },
    influences: ['Kwasa-Kwasa', 'House', 'Setswana Traditional']
  },

  // === NORTHERN CAPE ===
  'northern-cape-karoo': {
    name: 'Northern Cape Karoo',
    region: 'Kimberley/Upington',
    province: 'northern-cape',
    swingPercentage: 54.0,
    description: 'Sparse, spacious sound reflecting the Karoo landscape',
    culturalContext: 'Vast open spaces inspiring minimal, atmospheric production',
    bpmRange: { min: 110, max: 118 },
    microTimingOffsets: [0, 9, -3, 12, 0, 8, -5, 11, 0, 6, -3, 10, 0, 8, -4, 12],
    velocityAccents: [1.0, 0.68, 0.85, 0.74, 0.95, 0.66, 0.82, 0.72, 0.97, 0.70, 0.80, 0.76, 0.93, 0.67, 0.84, 0.73],
    ghostNotePositions: [6, 14],
    beat1Silence: {
      enabled: true,
      duration: 2,
      probability: 0.6,
      type: 'ghost'
    },
    logDrumTiming: {
      swingAmount: 0.54,
      bounceOffset: 4,
      attackSharpness: 0.65,
      density: 'sparse'
    },
    pianoFeel: {
      strumSpread: 20,
      strumDirection: 'up',
      legatoAmount: 0.7,
      bassAnticipation: 8
    },
    kickStyle: {
      placement: 'on-beat',
      offsetMs: 0,
      pattern: 'minimal',
      sidechainDepth: 0.45
    },
    influences: ['Nama Traditional', 'Folk', 'Ambient']
  }
};

/**
 * Get profile by province
 */
export function getProfilesByProvince(province: SouthAfricanProvince): RegionalSwingProfile[] {
  return Object.values(REGIONAL_SWING_PROFILES).filter(p => p.province === province);
}

/**
 * Get profile names grouped by province
 */
export function getProfilesByProvinceGrouped(): Record<SouthAfricanProvince, string[]> {
  const grouped: Record<string, string[]> = {};
  
  for (const [key, profile] of Object.entries(REGIONAL_SWING_PROFILES)) {
    if (!grouped[profile.province]) {
      grouped[profile.province] = [];
    }
    grouped[profile.province].push(key);
  }
  
  return grouped as Record<SouthAfricanProvince, string[]>;
}

/**
 * Calculate swing offset in milliseconds based on BPM and swing percentage
 */
export function calculateSwingOffsetMs(bpm: number, swingPercentage: number): number {
  const sixteenthNoteDuration = (60000 / bpm) / 4;
  const swingRatio = swingPercentage / 100;
  return sixteenthNoteDuration * (swingRatio - 0.5);
}

/**
 * Apply beat 1 silence configuration to velocity
 */
export function applyBeat1Silence(
  velocity: number,
  stepIndex: number,
  config: Beat1SilenceConfig,
  stepsPerBar: number = 16
): number {
  if (!config.enabled) return velocity;
  
  const positionInBar = stepIndex % stepsPerBar;
  const isInSilenceZone = positionInBar < config.duration;
  
  if (!isInSilenceZone) return velocity;
  
  // Apply probability
  if (Math.random() > config.probability) return velocity;
  
  switch (config.type) {
    case 'complete':
      return 0;
    case 'reduced':
      return Math.round(velocity * (config.velocityMultiplier || 0.3));
    case 'ghost':
      return Math.round(velocity * 0.15);
    default:
      return velocity;
  }
}

/**
 * Get all available profile keys
 */
export function getAllProfileKeys(): string[] {
  return Object.keys(REGIONAL_SWING_PROFILES);
}

/**
 * Get profile by key with fallback
 */
export function getProfile(key: string): RegionalSwingProfile {
  return REGIONAL_SWING_PROFILES[key] || REGIONAL_SWING_PROFILES['johannesburg-deep'];
}
