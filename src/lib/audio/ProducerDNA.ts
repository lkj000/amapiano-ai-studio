/**
 * Producer DNA Presets
 * Switchable profiles for Xduppy, Kelvin Momo, Kabza De Small, etc.
 * Based on analysis of their production techniques
 */

export interface ProducerDNAProfile {
  id: string;
  name: string;
  style: 'quantum' | 'soulful' | 'tech' | 'sgija' | 'private_school';
  region: 'gauteng' | 'durban' | 'cape_town' | 'mpumalanga';
  description: string;
  
  // Tempo characteristics
  bpmRange: { min: number; max: number; sweet: number };
  
  // Swing/groove settings per frequency band
  groove: {
    lowSwing: number;      // -15ms to +15ms offset
    midSwing: number;
    highSwing: number;
    microTiming: number;   // FDD (Frequency-Dependent Displacement)
  };
  
  // Log drum characteristics
  logDrum: {
    pitchDecay: number;    // 0-1 how much pitch falls
    attackMs: number;      // 1-50ms
    distortion: number;    // 0-1 saturation amount
    octaveJumps: boolean;  // signature Xduppy technique
    velocityCurve: 'linear' | 'exponential' | 'quantum';
  };
  
  // Bass layer settings
  bass: {
    subLevel: number;      // 0-1
    midGrit: number;       // 0-1 parallel saturation
    sidechainDepth: number; // 0-1
    sidechainRelease: number; // ms
  };
  
  // Pad/atmosphere settings
  pads: {
    filterCutoff: number;  // 0-1
    reverb: number;        // 0-1
    stereoWidth: number;   // 0-1
    voicing: 'sine' | 'saw' | 'analog';
  };
  
  // Percussion mix
  percussion: {
    shakerLevel: number;
    congaLevel: number;
    rimLevel: number;
    highpassHz: number;    // EQ cut for loops
  };
  
  // Arrangement patterns
  arrangement: {
    valleyPosition: number;  // 0-1 where the "bridge" drops energy
    dropIntensity: number;   // 0-1 how aggressive the main drop is
    silenceGap: boolean;     // Xduppy's signature pre-drop silence
  };
}

export const PRODUCER_DNA_PRESETS: ProducerDNAProfile[] = [
  {
    id: 'xduppy',
    name: 'Xduppy',
    style: 'quantum',
    region: 'gauteng',
    description: 'Aggressive "Quantum" sound with disrespectful log drums and octave jumps',
    bpmRange: { min: 111, max: 116, sweet: 113 },
    groove: {
      lowSwing: 8,
      midSwing: 5,
      highSwing: 3,
      microTiming: 12,
    },
    logDrum: {
      pitchDecay: 0.85,
      attackMs: 3,
      distortion: 0.75,
      octaveJumps: true,
      velocityCurve: 'quantum',
    },
    bass: {
      subLevel: 0.9,
      midGrit: 0.7,
      sidechainDepth: 0.6,
      sidechainRelease: 80,
    },
    pads: {
      filterCutoff: 0.4,
      reverb: 0.3,
      stereoWidth: 0.5,
      voicing: 'sine',
    },
    percussion: {
      shakerLevel: 0.65,
      congaLevel: 0.5,
      rimLevel: 0.4,
      highpassHz: 400,
    },
    arrangement: {
      valleyPosition: 0.5,
      dropIntensity: 0.95,
      silenceGap: true,
    },
  },
  {
    id: 'kelvin_momo',
    name: 'Kelvin Momo',
    style: 'soulful',
    region: 'gauteng',
    description: 'Deep soulful Private School with warm keys and gentle grooves',
    bpmRange: { min: 108, max: 114, sweet: 110 },
    groove: {
      lowSwing: 4,
      midSwing: 6,
      highSwing: 8,
      microTiming: 6,
    },
    logDrum: {
      pitchDecay: 0.6,
      attackMs: 8,
      distortion: 0.25,
      octaveJumps: false,
      velocityCurve: 'linear',
    },
    bass: {
      subLevel: 0.7,
      midGrit: 0.2,
      sidechainDepth: 0.35,
      sidechainRelease: 150,
    },
    pads: {
      filterCutoff: 0.75,
      reverb: 0.6,
      stereoWidth: 0.8,
      voicing: 'analog',
    },
    percussion: {
      shakerLevel: 0.45,
      congaLevel: 0.6,
      rimLevel: 0.3,
      highpassHz: 300,
    },
    arrangement: {
      valleyPosition: 0.45,
      dropIntensity: 0.5,
      silenceGap: false,
    },
  },
  {
    id: 'kabza_de_small',
    name: 'Kabza De Small',
    style: 'tech',
    region: 'gauteng',
    description: 'The Piano King\'s signature tech-amapiano with punchy drums',
    bpmRange: { min: 112, max: 118, sweet: 115 },
    groove: {
      lowSwing: 6,
      midSwing: 8,
      highSwing: 5,
      microTiming: 9,
    },
    logDrum: {
      pitchDecay: 0.7,
      attackMs: 5,
      distortion: 0.5,
      octaveJumps: true,
      velocityCurve: 'exponential',
    },
    bass: {
      subLevel: 0.85,
      midGrit: 0.5,
      sidechainDepth: 0.5,
      sidechainRelease: 100,
    },
    pads: {
      filterCutoff: 0.6,
      reverb: 0.4,
      stereoWidth: 0.65,
      voicing: 'saw',
    },
    percussion: {
      shakerLevel: 0.55,
      congaLevel: 0.55,
      rimLevel: 0.5,
      highpassHz: 350,
    },
    arrangement: {
      valleyPosition: 0.48,
      dropIntensity: 0.75,
      silenceGap: true,
    },
  },
  {
    id: 'mellow_sleazy',
    name: 'Mellow & Sleazy',
    style: 'sgija',
    region: 'gauteng',
    description: 'Raw Sgija energy with aggressive syncopation and taxi bass',
    bpmRange: { min: 113, max: 120, sweet: 116 },
    groove: {
      lowSwing: 10,
      midSwing: 7,
      highSwing: 4,
      microTiming: 15,
    },
    logDrum: {
      pitchDecay: 0.9,
      attackMs: 2,
      distortion: 0.85,
      octaveJumps: true,
      velocityCurve: 'quantum',
    },
    bass: {
      subLevel: 0.95,
      midGrit: 0.8,
      sidechainDepth: 0.7,
      sidechainRelease: 60,
    },
    pads: {
      filterCutoff: 0.35,
      reverb: 0.2,
      stereoWidth: 0.4,
      voicing: 'sine',
    },
    percussion: {
      shakerLevel: 0.7,
      congaLevel: 0.45,
      rimLevel: 0.55,
      highpassHz: 450,
    },
    arrangement: {
      valleyPosition: 0.55,
      dropIntensity: 1.0,
      silenceGap: true,
    },
  },
  {
    id: 'sun_el',
    name: 'Sun-EL Musician',
    style: 'private_school',
    region: 'durban',
    description: 'Ethereal, dreamy Durban style with lush atmospheres',
    bpmRange: { min: 105, max: 112, sweet: 108 },
    groove: {
      lowSwing: 3,
      midSwing: 5,
      highSwing: 10,
      microTiming: 4,
    },
    logDrum: {
      pitchDecay: 0.5,
      attackMs: 12,
      distortion: 0.15,
      octaveJumps: false,
      velocityCurve: 'linear',
    },
    bass: {
      subLevel: 0.6,
      midGrit: 0.15,
      sidechainDepth: 0.25,
      sidechainRelease: 200,
    },
    pads: {
      filterCutoff: 0.85,
      reverb: 0.75,
      stereoWidth: 0.9,
      voicing: 'analog',
    },
    percussion: {
      shakerLevel: 0.35,
      congaLevel: 0.5,
      rimLevel: 0.25,
      highpassHz: 250,
    },
    arrangement: {
      valleyPosition: 0.4,
      dropIntensity: 0.35,
      silenceGap: false,
    },
  },
];

// Style morphing: interpolate between two producer profiles
export function morphProducerDNA(
  profileA: ProducerDNAProfile,
  profileB: ProducerDNAProfile,
  blend: number // 0 = full A, 1 = full B
): ProducerDNAProfile {
  const lerp = (a: number, b: number) => a + (b - a) * blend;
  
  return {
    id: `morph_${profileA.id}_${profileB.id}`,
    name: `${profileA.name} → ${profileB.name}`,
    style: blend < 0.5 ? profileA.style : profileB.style,
    region: blend < 0.5 ? profileA.region : profileB.region,
    description: `Morphed: ${Math.round((1 - blend) * 100)}% ${profileA.name}, ${Math.round(blend * 100)}% ${profileB.name}`,
    bpmRange: {
      min: Math.round(lerp(profileA.bpmRange.min, profileB.bpmRange.min)),
      max: Math.round(lerp(profileA.bpmRange.max, profileB.bpmRange.max)),
      sweet: Math.round(lerp(profileA.bpmRange.sweet, profileB.bpmRange.sweet)),
    },
    groove: {
      lowSwing: lerp(profileA.groove.lowSwing, profileB.groove.lowSwing),
      midSwing: lerp(profileA.groove.midSwing, profileB.groove.midSwing),
      highSwing: lerp(profileA.groove.highSwing, profileB.groove.highSwing),
      microTiming: lerp(profileA.groove.microTiming, profileB.groove.microTiming),
    },
    logDrum: {
      pitchDecay: lerp(profileA.logDrum.pitchDecay, profileB.logDrum.pitchDecay),
      attackMs: lerp(profileA.logDrum.attackMs, profileB.logDrum.attackMs),
      distortion: lerp(profileA.logDrum.distortion, profileB.logDrum.distortion),
      octaveJumps: blend < 0.5 ? profileA.logDrum.octaveJumps : profileB.logDrum.octaveJumps,
      velocityCurve: blend < 0.5 ? profileA.logDrum.velocityCurve : profileB.logDrum.velocityCurve,
    },
    bass: {
      subLevel: lerp(profileA.bass.subLevel, profileB.bass.subLevel),
      midGrit: lerp(profileA.bass.midGrit, profileB.bass.midGrit),
      sidechainDepth: lerp(profileA.bass.sidechainDepth, profileB.bass.sidechainDepth),
      sidechainRelease: lerp(profileA.bass.sidechainRelease, profileB.bass.sidechainRelease),
    },
    pads: {
      filterCutoff: lerp(profileA.pads.filterCutoff, profileB.pads.filterCutoff),
      reverb: lerp(profileA.pads.reverb, profileB.pads.reverb),
      stereoWidth: lerp(profileA.pads.stereoWidth, profileB.pads.stereoWidth),
      voicing: blend < 0.5 ? profileA.pads.voicing : profileB.pads.voicing,
    },
    percussion: {
      shakerLevel: lerp(profileA.percussion.shakerLevel, profileB.percussion.shakerLevel),
      congaLevel: lerp(profileA.percussion.congaLevel, profileB.percussion.congaLevel),
      rimLevel: lerp(profileA.percussion.rimLevel, profileB.percussion.rimLevel),
      highpassHz: lerp(profileA.percussion.highpassHz, profileB.percussion.highpassHz),
    },
    arrangement: {
      valleyPosition: lerp(profileA.arrangement.valleyPosition, profileB.arrangement.valleyPosition),
      dropIntensity: lerp(profileA.arrangement.dropIntensity, profileB.arrangement.dropIntensity),
      silenceGap: blend < 0.5 ? profileA.arrangement.silenceGap : profileB.arrangement.silenceGap,
    },
  };
}

// Calculate cultural authenticity score based on profile adherence
export function calculateCulturalScore(
  profile: ProducerDNAProfile,
  actualSettings: Partial<ProducerDNAProfile>
): { score: number; breakdown: Record<string, number>; suggestions: string[] } {
  const scores: Record<string, number> = {};
  const suggestions: string[] = [];
  
  // Check BPM
  if (actualSettings.bpmRange) {
    const bpmDiff = Math.abs(actualSettings.bpmRange.sweet - profile.bpmRange.sweet);
    scores.bpm = Math.max(0, 1 - bpmDiff / 20);
    if (bpmDiff > 5) {
      suggestions.push(`Adjust BPM closer to ${profile.bpmRange.sweet} for authentic ${profile.name} vibe`);
    }
  } else {
    scores.bpm = 0.5;
  }
  
  // Check log drum settings
  if (actualSettings.logDrum) {
    const distDiff = Math.abs(actualSettings.logDrum.distortion - profile.logDrum.distortion);
    scores.logDrum = Math.max(0, 1 - distDiff);
    if (distDiff > 0.3) {
      const direction = actualSettings.logDrum.distortion < profile.logDrum.distortion ? 'more' : 'less';
      suggestions.push(`Add ${direction} saturation to log drum for ${profile.style} style`);
    }
  } else {
    scores.logDrum = 0.5;
  }
  
  // Check groove/swing
  if (actualSettings.groove) {
    const swingDiff = Math.abs(actualSettings.groove.microTiming - profile.groove.microTiming);
    scores.groove = Math.max(0, 1 - swingDiff / 15);
    if (swingDiff > 5) {
      suggestions.push(`Adjust micro-timing to ${profile.groove.microTiming}ms for proper ${profile.region} bounce`);
    }
  } else {
    scores.groove = 0.5;
  }
  
  // Check bass settings
  if (actualSettings.bass) {
    const gritDiff = Math.abs(actualSettings.bass.midGrit - profile.bass.midGrit);
    scores.bass = Math.max(0, 1 - gritDiff);
  } else {
    scores.bass = 0.5;
  }
  
  // Check pads
  if (actualSettings.pads) {
    const reverbDiff = Math.abs(actualSettings.pads.reverb - profile.pads.reverb);
    scores.atmosphere = Math.max(0, 1 - reverbDiff);
  } else {
    scores.atmosphere = 0.5;
  }
  
  // Overall score (weighted average)
  const weights = { bpm: 0.15, logDrum: 0.3, groove: 0.25, bass: 0.2, atmosphere: 0.1 };
  const totalScore = Object.entries(scores).reduce((sum, [key, val]) => {
    return sum + val * (weights[key as keyof typeof weights] || 0.1);
  }, 0);
  
  return {
    score: Math.round(totalScore * 100),
    breakdown: Object.fromEntries(Object.entries(scores).map(([k, v]) => [k, Math.round(v * 100)])),
    suggestions,
  };
}
