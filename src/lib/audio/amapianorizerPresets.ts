/**
 * Amapianorizer Transformation Presets
 * 
 * 5 signature transformation modes based on producer DNA:
 * - Momo Soul-Wash: Private School jazz sophistication
 * - Stixx Flip: Complex rhythmic overhaul with ghost notes
 * - Xduppy Quantum-Leap: Aggressive Sgija club energy
 * - Thakzin 3-Step: Afro-Tech crossover with triplet kicks
 * - Kabza Foundation: Classic Scorpion King authenticity
 */

import type { AmapianorizationOptions } from './amapianorizationEngine';

export type AmapianorizerPresetName = 
  | 'momo-soul-wash'
  | 'stixx-flip'
  | 'xduppy-quantum-leap'
  | 'thakzin-3-step'
  | 'kabza-foundation';

export interface AmapianorizerTransformPreset {
  id: AmapianorizerPresetName;
  name: string;
  description: string;
  producerDNA: string;
  
  // Target specifications
  targetBPM: number;
  targetKey: string;
  targetLUFS: number;
  
  // Core transformation parameters
  options: Partial<AmapianorizationOptions>;
  
  // Processing chain configuration
  processing: {
    // EQ & Filtering
    highCutHz?: number;
    lowCutHz?: number;
    tiltEQDb?: number; // Negative = darker, Positive = brighter
    
    // Dynamics
    sidechainDepthDb: number;
    softClipThreshold: number;
    
    // FM Log Drum
    logDrumModulationIndex: number; // 0-100%
    logDrumGrit: number; // 0-100%
    logDrumPhaseRotation: number; // 0-360 degrees
    
    // NGE (Neural Groove Engine)
    ngeDisplacementLowMs: number;
    ngeDisplacementHighMs: number;
    
    // Spatial
    stereoWidthPercent: number;
    reverbMix: number;
    delaySync: '1/4' | '1/8' | '1/16' | 'dotted-1/8';
    
    // Vocal
    formantShiftPercent: number; // Negative = deeper
    vocalDelaySync?: '1/4' | '1/8';
  };
  
  // Arrangement logic
  arrangement: {
    introFilteredBars: number;
    breachSilenceMs: number;
    dropIntensity: number; // 0-1
    outroStyle: 'fade' | 'breakdown' | '3-step' | 'full-energy';
  };
  
  // Visual identity
  aesthetics: {
    primaryColor: string;
    mood: string;
    energy: 'low' | 'medium' | 'high' | 'extreme';
  };
}

/**
 * The 5 signature Amapianorizer transformation presets
 */
export const AMAPIANORIZER_PRESETS: Record<AmapianorizerPresetName, AmapianorizerTransformPreset> = {
  
  /**
   * MOMO SOUL-WASH
   * For tracks with strong vocal melodies and emotional depth
   * Pure emotion, Private School sophistication
   */
  'momo-soul-wash': {
    id: 'momo-soul-wash',
    name: 'Momo Soul-Wash',
    description: 'Private School sophistication with jazz 9th & 11th chord extensions. Perfect for soulful vocals and emotional depth.',
    producerDNA: 'Kelvin Momo',
    
    targetBPM: 110,
    targetKey: 'Ebm',
    targetLUFS: -8.0,
    
    options: {
      region: 'johannesburg',
      intensity: 0.65,
      elements: {
        logDrums: true,
        percussion: true,
        piano: true,
        bass: true,
        sidechain: true,
        filterSweeps: true,
      },
      swingProfile: 'johannesburg-deep',
      beat1Silence: {
        enabled: true,
        preset: 'verse-subtle',
        duration: 2,
        probability: 0.4,
      },
      euclideanPatterns: {
        logDrum: 'shona-mbira',
        percussion: 'zulu-rhythm',
      },
      vocalSettings: {
        language: 'zulu',
        adlibDensity: 'moderate',
        callResponse: true,
      },
    },
    
    processing: {
      highCutHz: 12000,
      lowCutHz: 30,
      tiltEQDb: -1.5,
      
      sidechainDepthDb: -4,
      softClipThreshold: 0.95,
      
      logDrumModulationIndex: 35,
      logDrumGrit: 15,
      logDrumPhaseRotation: 0,
      
      ngeDisplacementLowMs: 10,
      ngeDisplacementHighMs: -2,
      
      stereoWidthPercent: 85,
      reverbMix: 0.35,
      delaySync: '1/4',
      
      formantShiftPercent: -8,
      vocalDelaySync: '1/4',
    },
    
    arrangement: {
      introFilteredBars: 8,
      breachSilenceMs: 400,
      dropIntensity: 0.7,
      outroStyle: 'fade',
    },
    
    aesthetics: {
      primaryColor: '#D4AF37', // Gold
      mood: 'Soulful & Sophisticated',
      energy: 'medium',
    },
  },
  
  /**
   * STIXX FLIP
   * Complex rhythmic overhaul with ghost notes and live feel
   * For tracks needing high-energy percussive transformation
   */
  'stixx-flip': {
    id: 'stixx-flip',
    name: 'Stixx Flip',
    description: 'Complex rhythmic overhaul with ghost-note logic and live drumming feel. High-energy percussive transformation.',
    producerDNA: 'Stixx',
    
    targetBPM: 114,
    targetKey: 'Fm',
    targetLUFS: -7.5,
    
    options: {
      region: 'pretoria',
      intensity: 0.8,
      elements: {
        logDrums: true,
        percussion: true,
        piano: true,
        bass: true,
        sidechain: true,
        filterSweeps: false,
      },
      swingProfile: 'pretoria-bounce',
      beat1Silence: {
        enabled: true,
        preset: 'drop-impact',
        duration: 1,
        probability: 0.6,
      },
      euclideanPatterns: {
        logDrum: 'sotho-groove',
        percussion: 'xhosa-polyrhythm',
        hihat: 'tswana-pulse',
      },
      vocalSettings: {
        language: 'sotho',
        adlibDensity: 'frequent',
        callResponse: true,
      },
    },
    
    processing: {
      highCutHz: 14000,
      lowCutHz: 35,
      tiltEQDb: 0,
      
      sidechainDepthDb: -5,
      softClipThreshold: 0.9,
      
      logDrumModulationIndex: 60,
      logDrumGrit: 40,
      logDrumPhaseRotation: 15,
      
      ngeDisplacementLowMs: 12,
      ngeDisplacementHighMs: -3,
      
      stereoWidthPercent: 70,
      reverbMix: 0.2,
      delaySync: '1/8',
      
      formantShiftPercent: -5,
    },
    
    arrangement: {
      introFilteredBars: 4,
      breachSilenceMs: 250,
      dropIntensity: 0.9,
      outroStyle: 'full-energy',
    },
    
    aesthetics: {
      primaryColor: '#FF6B35', // Energetic Orange
      mood: 'Percussive & Complex',
      energy: 'high',
    },
  },
  
  /**
   * XDUPPY QUANTUM-LEAP
   * Extreme aggression for Sgija club mixes
   * Maximum FM distortion and 1/32nd note rolls
   */
  'xduppy-quantum-leap': {
    id: 'xduppy-quantum-leap',
    name: 'Xduppy Quantum-Leap',
    description: 'Extreme Sgija club energy with maximum FM distortion, demon pitch vocals, and aggressive 1/32nd note rolls.',
    producerDNA: 'Xduppy',
    
    targetBPM: 116,
    targetKey: 'Em',
    targetLUFS: -7.0,
    
    options: {
      region: 'pretoria',
      intensity: 0.95,
      elements: {
        logDrums: true,
        percussion: true,
        piano: false,
        bass: true,
        sidechain: true,
        filterSweeps: true,
      },
      swingProfile: 'pretoria-bounce',
      beat1Silence: {
        enabled: true,
        preset: 'drop-impact',
        duration: 1,
        probability: 0.8,
      },
      euclideanPatterns: {
        logDrum: 'quantum-pulse',
        percussion: 'sgija-attack',
      },
      vocalSettings: {
        language: 'zulu',
        adlibDensity: 'dense',
        callResponse: false,
      },
    },
    
    processing: {
      highCutHz: 16000,
      lowCutHz: 25,
      tiltEQDb: 0.5,
      
      sidechainDepthDb: -6,
      softClipThreshold: 0.85,
      
      logDrumModulationIndex: 85,
      logDrumGrit: 75,
      logDrumPhaseRotation: 180,
      
      ngeDisplacementLowMs: 15,
      ngeDisplacementHighMs: -5,
      
      stereoWidthPercent: 60,
      reverbMix: 0.1,
      delaySync: '1/16',
      
      formantShiftPercent: -15, // "Demon Pitch"
    },
    
    arrangement: {
      introFilteredBars: 2,
      breachSilenceMs: 500,
      dropIntensity: 1.0,
      outroStyle: 'breakdown',
    },
    
    aesthetics: {
      primaryColor: '#9B2335', // Aggressive Red
      mood: 'Aggressive & Disrespectful',
      energy: 'extreme',
    },
  },
  
  /**
   * THAKZIN 3-STEP
   * Afro-Tech crossover with triplet-based kicks
   * Hypnotic, driving rhythm for tech-house fusion
   */
  'thakzin-3-step': {
    id: 'thakzin-3-step',
    name: 'Thakzin 3-Step',
    description: 'Afro-Tech crossover with triplet-based 3-step kick pattern. Hypnotic, driving rhythm for tech-house fusion.',
    producerDNA: 'Thakzin',
    
    targetBPM: 118,
    targetKey: 'Gm',
    targetLUFS: -7.5,
    
    options: {
      region: 'durban',
      intensity: 0.75,
      elements: {
        logDrums: true,
        percussion: true,
        piano: true,
        bass: true,
        sidechain: true,
        filterSweeps: true,
      },
      swingProfile: 'durban-gqom',
      beat1Silence: {
        enabled: true,
        preset: 'build-tension',
        duration: 3,
        probability: 0.5,
      },
      euclideanPatterns: {
        logDrum: 'three-step-pulse',
        percussion: 'afro-tech-groove',
        hihat: 'industrial-16th',
      },
      vocalSettings: {
        language: 'zulu',
        adlibDensity: 'sparse',
        callResponse: false,
      },
    },
    
    processing: {
      highCutHz: 15000,
      lowCutHz: 28,
      tiltEQDb: 1.0, // Brighter for tech feel
      
      sidechainDepthDb: -4,
      softClipThreshold: 0.88,
      
      logDrumModulationIndex: 50,
      logDrumGrit: 35,
      logDrumPhaseRotation: 45,
      
      ngeDisplacementLowMs: 8,
      ngeDisplacementHighMs: -2,
      
      stereoWidthPercent: 90,
      reverbMix: 0.25,
      delaySync: 'dotted-1/8',
      
      formantShiftPercent: -10,
      vocalDelaySync: '1/4',
    },
    
    arrangement: {
      introFilteredBars: 16,
      breachSilenceMs: 300,
      dropIntensity: 0.85,
      outroStyle: '3-step',
    },
    
    aesthetics: {
      primaryColor: '#4ECDC4', // Tech Teal
      mood: 'Hypnotic & Driving',
      energy: 'high',
    },
  },
  
  /**
   * KABZA FOUNDATION
   * Classic Scorpion King authenticity
   * Deep sub, tribal percussion, earthy timelessness
   */
  'kabza-foundation': {
    id: 'kabza-foundation',
    name: 'Kabza Foundation',
    description: 'Classic Scorpion King authenticity with deep sub-bass, tribal congas, and authentic Kwaito roots.',
    producerDNA: 'Kabza De Small',
    
    targetBPM: 113,
    targetKey: 'Cm',
    targetLUFS: -8.0,
    
    options: {
      region: 'johannesburg',
      intensity: 0.7,
      elements: {
        logDrums: true,
        percussion: true,
        piano: true,
        bass: true,
        sidechain: true,
        filterSweeps: false,
      },
      swingProfile: 'soweto-authentic',
      beat1Silence: {
        enabled: true,
        preset: 'verse-subtle',
        duration: 2,
        probability: 0.5,
      },
      euclideanPatterns: {
        logDrum: 'zulu-rhythm',
        percussion: 'tribal-polyrhythm',
      },
      vocalSettings: {
        language: 'zulu',
        adlibDensity: 'moderate',
        callResponse: true,
      },
    },
    
    processing: {
      highCutHz: 11000,
      lowCutHz: 32,
      tiltEQDb: -2.0, // Warmer, earthier
      
      sidechainDepthDb: -5,
      softClipThreshold: 0.92,
      
      logDrumModulationIndex: 25,
      logDrumGrit: 10,
      logDrumPhaseRotation: 0,
      
      ngeDisplacementLowMs: 12,
      ngeDisplacementHighMs: -2,
      
      stereoWidthPercent: 75,
      reverbMix: 0.28,
      delaySync: '1/4',
      
      formantShiftPercent: -6,
    },
    
    arrangement: {
      introFilteredBars: 8,
      breachSilenceMs: 350,
      dropIntensity: 0.75,
      outroStyle: 'fade',
    },
    
    aesthetics: {
      primaryColor: '#8B4513', // Earth Brown
      mood: 'Authentic & Timeless',
      energy: 'medium',
    },
  },
};

/**
 * Get preset by ID
 */
export function getAmapianorizerPreset(id: AmapianorizerPresetName): AmapianorizerTransformPreset {
  return AMAPIANORIZER_PRESETS[id];
}

/**
 * Get all available preset IDs
 */
export function getAvailablePresets(): AmapianorizerPresetName[] {
  return Object.keys(AMAPIANORIZER_PRESETS) as AmapianorizerPresetName[];
}

/**
 * Get presets filtered by energy level
 */
export function getPresetsByEnergy(energy: 'low' | 'medium' | 'high' | 'extreme'): AmapianorizerTransformPreset[] {
  return Object.values(AMAPIANORIZER_PRESETS).filter(p => p.aesthetics.energy === energy);
}

/**
 * Get preset recommendation based on source audio characteristics
 */
export function recommendPreset(characteristics: {
  hasSoulfulVocals: boolean;
  isPercussive: boolean;
  originalBPM: number;
  energy: 'low' | 'medium' | 'high';
}): AmapianorizerPresetName {
  // Soulful vocals → Momo Soul-Wash
  if (characteristics.hasSoulfulVocals && characteristics.energy === 'low') {
    return 'momo-soul-wash';
  }
  
  // High energy + percussive → Stixx Flip
  if (characteristics.isPercussive && characteristics.energy === 'high') {
    return 'stixx-flip';
  }
  
  // Very high BPM or high energy → Xduppy Quantum-Leap
  if (characteristics.originalBPM > 115 || characteristics.energy === 'high') {
    return 'xduppy-quantum-leap';
  }
  
  // Medium energy, not too soulful → Thakzin 3-Step
  if (characteristics.energy === 'medium' && !characteristics.hasSoulfulVocals) {
    return 'thakzin-3-step';
  }
  
  // Default to classic foundation
  return 'kabza-foundation';
}
