/**
 * Professional Mastering Presets
 * Genre-specific mastering chains with Amapiano specialization
 */

import type { PresetDefinition } from './types';

/**
 * Extended mastering preset with full processing chain parameters
 */
export interface MasteringPreset extends PresetDefinition {
  chain: {
    eq: {
      lowShelfFreq: number;
      lowShelfGain: number;
      midFreq: number;
      midGain: number;
      midQ: number;
      highShelfFreq: number;
      highShelfGain: number;
    };
    compressor: {
      threshold: number;
      ratio: number;
      attack: number;
      release: number;
      knee: number;
      makeup: number;
    };
    multiband?: {
      lowCrossover: number;
      highCrossover: number;
      lowThreshold: number;
      midThreshold: number;
      highThreshold: number;
      lowRatio: number;
      midRatio: number;
      highRatio: number;
    };
    stereoImager: {
      width: number;
      midGain: number;
      sideGain: number;
      lowCrossover: number;
      highEnhance: number;
    };
    saturation?: {
      drive: number;
      mix: number;
      type: 'tube' | 'tape' | 'digital';
    };
    limiter: {
      ceiling: number;
      release: number;
      lookahead: number;
    };
  };
  targetLUFS: number;
  truePeakLimit: number;
}

/**
 * Amapiano-specific mastering presets
 */
export const AmapianoMasteringPresets: MasteringPreset[] = [
  {
    name: 'Amapiano Club',
    description: 'Heavy bass, punchy log drums, wide stereo - perfect for club play',
    genre: 'amapiano',
    parameters: {},
    chain: {
      eq: {
        lowShelfFreq: 60,
        lowShelfGain: 3,           // Boost sub bass
        midFreq: 350,
        midGain: -2,               // Cut muddy mids
        midQ: 1.2,
        highShelfFreq: 10000,
        highShelfGain: 1.5         // Air and shimmer
      },
      compressor: {
        threshold: -18,
        ratio: 3,
        attack: 15,                // Let transients through
        release: 150,              // Musical release
        knee: 6,
        makeup: 4
      },
      multiband: {
        lowCrossover: 120,
        highCrossover: 4000,
        lowThreshold: -20,
        midThreshold: -16,
        highThreshold: -14,
        lowRatio: 2.5,
        midRatio: 2,
        highRatio: 1.5
      },
      stereoImager: {
        width: 130,                // Wide for club feel
        midGain: 0,
        sideGain: 2,               // Boost sides
        lowCrossover: 120,         // Mono bass below 120Hz
        highEnhance: 40
      },
      saturation: {
        drive: 2,
        mix: 30,
        type: 'tape'
      },
      limiter: {
        ceiling: -0.3,
        release: 50,
        lookahead: 5
      }
    },
    targetLUFS: -8,
    truePeakLimit: -0.3
  },
  {
    name: 'Amapiano Streaming',
    description: 'Optimized for Spotify/Apple Music with streaming loudness normalization',
    genre: 'amapiano',
    parameters: {},
    chain: {
      eq: {
        lowShelfFreq: 55,
        lowShelfGain: 2,
        midFreq: 300,
        midGain: -1.5,
        midQ: 1.5,
        highShelfFreq: 8000,
        highShelfGain: 1
      },
      compressor: {
        threshold: -22,
        ratio: 2.5,
        attack: 20,
        release: 200,
        knee: 8,
        makeup: 3
      },
      stereoImager: {
        width: 115,
        midGain: 0,
        sideGain: 1,
        lowCrossover: 100,
        highEnhance: 25
      },
      limiter: {
        ceiling: -1.0,
        release: 100,
        lookahead: 5
      }
    },
    targetLUFS: -14,
    truePeakLimit: -1.0
  },
  {
    name: 'Amapiano Log Drum Focus',
    description: 'Emphasis on log drum punch and clarity',
    genre: 'amapiano',
    parameters: {},
    chain: {
      eq: {
        lowShelfFreq: 80,
        lowShelfGain: 2.5,
        midFreq: 1200,             // Log drum presence
        midGain: 2,
        midQ: 2,
        highShelfFreq: 6000,
        highShelfGain: 0.5
      },
      compressor: {
        threshold: -16,
        ratio: 4,
        attack: 10,                // Fast to catch log drum transients
        release: 100,
        knee: 4,
        makeup: 5
      },
      multiband: {
        lowCrossover: 150,
        highCrossover: 3000,
        lowThreshold: -18,
        midThreshold: -14,
        highThreshold: -16,
        lowRatio: 3,
        midRatio: 2.5,
        highRatio: 2
      },
      stereoImager: {
        width: 100,                // Keep log drums centered
        midGain: 1,
        sideGain: 0,
        lowCrossover: 150,
        highEnhance: 20
      },
      saturation: {
        drive: 1.5,
        mix: 20,
        type: 'tube'
      },
      limiter: {
        ceiling: -0.5,
        release: 40,               // Fast release for punchy transients
        lookahead: 3
      }
    },
    targetLUFS: -9,
    truePeakLimit: -0.5
  },
  {
    name: 'Amapiano Piano & Keys',
    description: 'Warm, full piano sound with gentle processing',
    genre: 'amapiano',
    parameters: {},
    chain: {
      eq: {
        lowShelfFreq: 100,
        lowShelfGain: 1,
        midFreq: 2500,             // Piano clarity
        midGain: 1.5,
        midQ: 1,
        highShelfFreq: 12000,
        highShelfGain: 2           // Shimmer
      },
      compressor: {
        threshold: -24,
        ratio: 2,
        attack: 30,
        release: 300,
        knee: 10,
        makeup: 2
      },
      stereoImager: {
        width: 140,                // Wide piano image
        midGain: 0,
        sideGain: 3,
        lowCrossover: 80,
        highEnhance: 50
      },
      saturation: {
        drive: 0.5,
        mix: 15,
        type: 'tube'
      },
      limiter: {
        ceiling: -1.0,
        release: 150,
        lookahead: 5
      }
    },
    targetLUFS: -12,
    truePeakLimit: -1.0
  },
  {
    name: 'Amapiano Vocal Mix',
    description: 'Vocal-forward mix with clear articulation',
    genre: 'amapiano',
    parameters: {},
    chain: {
      eq: {
        lowShelfFreq: 100,
        lowShelfGain: 0.5,
        midFreq: 3000,             // Vocal presence
        midGain: 2,
        midQ: 1.5,
        highShelfFreq: 10000,
        highShelfGain: 1.5
      },
      compressor: {
        threshold: -20,
        ratio: 3,
        attack: 25,
        release: 180,
        knee: 6,
        makeup: 3
      },
      stereoImager: {
        width: 105,                // Slight width, centered vocals
        midGain: 2,                // Boost center (vocals)
        sideGain: 0,
        lowCrossover: 120,
        highEnhance: 30
      },
      limiter: {
        ceiling: -0.5,
        release: 80,
        lookahead: 5
      }
    },
    targetLUFS: -10,
    truePeakLimit: -0.5
  }
];

/**
 * Other genre mastering presets
 */
export const GenericMasteringPresets: MasteringPreset[] = [
  {
    name: 'Hip-Hop/Trap',
    description: 'Heavy 808s, crisp hi-hats, loud and punchy',
    genre: 'hiphop',
    parameters: {},
    chain: {
      eq: {
        lowShelfFreq: 50,
        lowShelfGain: 4,
        midFreq: 400,
        midGain: -2,
        midQ: 1.5,
        highShelfFreq: 8000,
        highShelfGain: 2
      },
      compressor: {
        threshold: -14,
        ratio: 4,
        attack: 8,
        release: 80,
        knee: 4,
        makeup: 6
      },
      stereoImager: {
        width: 110,
        midGain: 0,
        sideGain: 1,
        lowCrossover: 100,
        highEnhance: 35
      },
      saturation: {
        drive: 3,
        mix: 40,
        type: 'digital'
      },
      limiter: {
        ceiling: -0.1,
        release: 30,
        lookahead: 3
      }
    },
    targetLUFS: -7,
    truePeakLimit: -0.1
  },
  {
    name: 'Afrobeats',
    description: 'Balanced, rhythmic, vocal clarity',
    genre: 'afrobeats',
    parameters: {},
    chain: {
      eq: {
        lowShelfFreq: 70,
        lowShelfGain: 2,
        midFreq: 2000,
        midGain: 1,
        midQ: 1,
        highShelfFreq: 10000,
        highShelfGain: 1
      },
      compressor: {
        threshold: -20,
        ratio: 2.5,
        attack: 20,
        release: 150,
        knee: 6,
        makeup: 3
      },
      stereoImager: {
        width: 115,
        midGain: 1,
        sideGain: 1,
        lowCrossover: 100,
        highEnhance: 30
      },
      limiter: {
        ceiling: -0.5,
        release: 60,
        lookahead: 5
      }
    },
    targetLUFS: -10,
    truePeakLimit: -0.5
  },
  {
    name: 'EDM/Electronic',
    description: 'Maximum loudness, wide stereo, heavy limiting',
    genre: 'edm',
    parameters: {},
    chain: {
      eq: {
        lowShelfFreq: 60,
        lowShelfGain: 2,
        midFreq: 500,
        midGain: -1,
        midQ: 2,
        highShelfFreq: 8000,
        highShelfGain: 2
      },
      compressor: {
        threshold: -12,
        ratio: 5,
        attack: 5,
        release: 50,
        knee: 3,
        makeup: 8
      },
      multiband: {
        lowCrossover: 120,
        highCrossover: 5000,
        lowThreshold: -15,
        midThreshold: -12,
        highThreshold: -10,
        lowRatio: 4,
        midRatio: 3,
        highRatio: 2
      },
      stereoImager: {
        width: 150,
        midGain: 0,
        sideGain: 3,
        lowCrossover: 120,
        highEnhance: 60
      },
      saturation: {
        drive: 4,
        mix: 50,
        type: 'digital'
      },
      limiter: {
        ceiling: -0.1,
        release: 20,
        lookahead: 2
      }
    },
    targetLUFS: -6,
    truePeakLimit: -0.1
  }
];

/**
 * All available mastering presets
 */
export const AllMasteringPresets: MasteringPreset[] = [
  ...AmapianoMasteringPresets,
  ...GenericMasteringPresets
];

/**
 * Get preset by name
 */
export function getMasteringPreset(name: string): MasteringPreset | undefined {
  return AllMasteringPresets.find(p => p.name.toLowerCase() === name.toLowerCase());
}

/**
 * Get presets by genre
 */
export function getMasteringPresetsByGenre(genre: string): MasteringPreset[] {
  return AllMasteringPresets.filter(p => p.genre?.toLowerCase() === genre.toLowerCase());
}
