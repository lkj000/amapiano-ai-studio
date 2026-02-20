/**
 * Amapiano Mix Presets
 * 
 * Real, domain-expert-informed EQ/compression/sidechain presets for
 * different Amapiano subgenres. These are config data — not simulations.
 */

// ============================================================================
// TYPES
// ============================================================================

export interface EQSettings {
  bands: Array<{
    frequency: number;
    gain: number;
    q: number;
    type: 'lowshelf' | 'highshelf' | 'peaking' | 'lowpass' | 'highpass';
  }>;
}

export interface CompressorSettings {
  threshold: number;
  ratio: number;
  attack: number;
  release: number;
  knee: number;
  makeupGain: number;
}

export interface SidechainSettings {
  source: string;
  amount: number;
  attack: number;
  release: number;
  curve: 'linear' | 'exponential';
}

export interface SendConfig {
  bus: string;
  amount: number;
}

export interface ChannelConfig {
  name: string;
  volume: number;
  pan: number;
  eq: EQSettings;
  compression: CompressorSettings;
  sidechain?: SidechainSettings;
  sends: SendConfig[];
}

export interface MixBus {
  name: string;
  type: 'reverb' | 'delay' | 'chorus' | 'saturation';
  settings: Record<string, number>;
  volume: number;
}

export interface MasterConfig {
  limiter: {
    ceiling: number;
    release: number;
  };
  eq: EQSettings;
  stereoWidth: number;
  targetLUFS: number;
}

export interface MixTemplate {
  channels: Record<string, Partial<ChannelConfig>>;
  buses: MixBus[];
  master: MasterConfig;
}

// ============================================================================
// PRESETS
// ============================================================================

export const AMAPIANO_MIX_TEMPLATES: Record<string, MixTemplate> = {
  'johannesburg-classic': {
    channels: {
      'log-drum': {
        volume: -2,
        pan: 0,
        eq: {
          bands: [
            { frequency: 40, gain: 3, q: 1.2, type: 'peaking' },
            { frequency: 200, gain: -2, q: 2, type: 'peaking' },
            { frequency: 2000, gain: 1, q: 1.5, type: 'peaking' },
          ],
        },
        compression: { threshold: -12, ratio: 4, attack: 10, release: 100, knee: 6, makeupGain: 3 },
      },
      'kick': {
        volume: -6,
        pan: 0,
        eq: {
          bands: [
            { frequency: 55, gain: -6, q: 4, type: 'peaking' },
            { frequency: 100, gain: 2, q: 1.5, type: 'peaking' },
            { frequency: 3000, gain: 2, q: 2, type: 'peaking' },
          ],
        },
        compression: { threshold: -15, ratio: 6, attack: 1, release: 50, knee: 3, makeupGain: 4 },
        sidechain: { source: 'log-drum', amount: 40, attack: 5, release: 80, curve: 'exponential' },
      },
      'bass': {
        volume: -8,
        pan: 0,
        eq: {
          bands: [
            { frequency: 30, gain: -3, q: 1, type: 'highpass' },
            { frequency: 80, gain: 2, q: 1.5, type: 'peaking' },
            { frequency: 250, gain: -2, q: 2, type: 'peaking' },
          ],
        },
        compression: { threshold: -18, ratio: 4, attack: 20, release: 120, knee: 6, makeupGain: 3 },
        sidechain: { source: 'log-drum', amount: 50, attack: 3, release: 100, curve: 'exponential' },
      },
      'piano': {
        volume: -10,
        pan: 0.1,
        eq: {
          bands: [
            { frequency: 150, gain: -2, q: 1.5, type: 'highpass' },
            { frequency: 400, gain: -1, q: 2, type: 'peaking' },
            { frequency: 3000, gain: 2, q: 1.5, type: 'peaking' },
          ],
        },
        compression: { threshold: -20, ratio: 2.5, attack: 30, release: 200, knee: 10, makeupGain: 2 },
        sends: [{ bus: 'reverb', amount: -15 }],
      },
      'hihat': {
        volume: -14,
        pan: 0.2,
        eq: {
          bands: [
            { frequency: 500, gain: -3, q: 1, type: 'highpass' },
            { frequency: 8000, gain: 2, q: 1.5, type: 'peaking' },
          ],
        },
        compression: { threshold: -25, ratio: 2, attack: 5, release: 50, knee: 6, makeupGain: 1 },
      },
      'shaker': {
        volume: -16,
        pan: -0.3,
        eq: {
          bands: [
            { frequency: 800, gain: -2, q: 1, type: 'highpass' },
            { frequency: 6000, gain: 1.5, q: 2, type: 'peaking' },
          ],
        },
        compression: { threshold: -22, ratio: 2, attack: 10, release: 80, knee: 8, makeupGain: 1 },
      },
    },
    buses: [
      { name: 'reverb', type: 'reverb', settings: { roomSize: 0.5, damping: 0.6, wetLevel: 0.3, predelay: 20 }, volume: -12 },
      { name: 'delay', type: 'delay', settings: { time: 375, feedback: 0.3, wetLevel: 0.25 }, volume: -18 },
    ],
    master: {
      limiter: { ceiling: -0.3, release: 100 },
      eq: { bands: [{ frequency: 30, gain: 0, q: 1, type: 'highpass' }, { frequency: 16000, gain: -1, q: 1, type: 'highshelf' }] },
      stereoWidth: 1.1,
      targetLUFS: -14,
    },
  },

  'private-school-soulful': {
    channels: {
      'log-drum': {
        volume: -4,
        eq: { bands: [{ frequency: 50, gain: 2, q: 1.5, type: 'peaking' }, { frequency: 2500, gain: 1.5, q: 1.2, type: 'peaking' }] },
        compression: { threshold: -14, ratio: 3, attack: 15, release: 120, knee: 8, makeupGain: 2 },
      },
      'piano': {
        volume: -6,
        pan: 0,
        eq: { bands: [{ frequency: 200, gain: -1, q: 2, type: 'peaking' }, { frequency: 2000, gain: 2, q: 1.2, type: 'peaking' }, { frequency: 5000, gain: 1, q: 1.5, type: 'peaking' }] },
        compression: { threshold: -18, ratio: 2, attack: 40, release: 250, knee: 12, makeupGain: 2 },
        sends: [{ bus: 'reverb', amount: -10 }],
      },
    },
    buses: [
      { name: 'reverb', type: 'reverb', settings: { roomSize: 0.6, damping: 0.5, wetLevel: 0.35, predelay: 30 }, volume: -10 },
    ],
    master: {
      limiter: { ceiling: -0.3, release: 120 },
      eq: { bands: [{ frequency: 25, gain: 0, q: 1, type: 'highpass' }, { frequency: 12000, gain: 1, q: 1, type: 'highshelf' }] },
      stereoWidth: 1.15,
      targetLUFS: -13,
    },
  },

  'durban-hard': {
    channels: {
      'log-drum': {
        volume: 0,
        eq: { bands: [{ frequency: 45, gain: 4, q: 1, type: 'peaking' }, { frequency: 150, gain: -3, q: 2, type: 'peaking' }, { frequency: 3000, gain: 3, q: 1.5, type: 'peaking' }] },
        compression: { threshold: -10, ratio: 6, attack: 5, release: 60, knee: 3, makeupGain: 4 },
      },
      'kick': {
        volume: -4,
        sidechain: { source: 'log-drum', amount: 60, attack: 2, release: 60, curve: 'linear' },
      },
    },
    buses: [],
    master: {
      limiter: { ceiling: -0.1, release: 80 },
      eq: { bands: [{ frequency: 35, gain: 0, q: 1, type: 'highpass' }] },
      stereoWidth: 1.0,
      targetLUFS: -12,
    },
  },
};
