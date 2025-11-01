import type { PresetDefinition } from './types';

export const AmapianorizerPresets: PresetDefinition[] = [
  {
    name: 'Log Drum Groove',
    description: 'Classic Amapiano log drum pumping with tight groove',
    genre: 'amapiano',
    parameters: {
      // EQ
      lowBoost: 0.6,
      midCut: 0.4,
      percBoost: 0.7,
      highShelf: 0.2,
      
      // Compressor
      pumpIntensity: 0.75,
      threshold: -18,
      sidechain: true,
      makeup: 0.6,
      
      // Gate
      gatePattern: 'logDrumPulse',
      gateDepth: 0.6,
      swing: 0.62,
      bpmSync: true,
      
      // Reverb
      reverbSize: 0.5,
      damping: 0.6,
      width: 0.7,
      mix: 0.2,
      
      // Delay
      delayTime: 0.375,
      feedback: 0.3,
      filterCutoff: 3500,
      pingPong: true,
      
      // Distortion
      warmth: 0.3,
      drive: 1.8,
    }
  },
  {
    name: 'Piano Bounce',
    description: 'Bouncy piano-focused sound with space',
    genre: 'amapiano',
    parameters: {
      lowBoost: 0.4,
      midCut: 0.3,
      percBoost: 0.5,
      highShelf: 0.3,
      pumpIntensity: 0.55,
      threshold: -22,
      gatePattern: 'houseGroove',
      gateDepth: 0.4,
      swing: 0.58,
      reverbSize: 0.7,
      mix: 0.35,
      delayTime: 0.5,
      feedback: 0.4,
      warmth: 0.2
    }
  },
  {
    name: 'Deep House Flip',
    description: 'Transform any track into deep Amapiano house',
    genre: 'amapiano',
    parameters: {
      lowBoost: 0.8,
      midCut: 0.5,
      percBoost: 0.4,
      pumpIntensity: 0.85,
      threshold: -16,
      gatePattern: 'syncopatedChop',
      gateDepth: 0.8,
      swing: 0.65,
      reverbSize: 0.8,
      damping: 0.4,
      delayTime: 0.25,
      feedback: 0.5,
      warmth: 0.4
    }
  },
  {
    name: 'Vocal Transform',
    description: 'Perfect for adding Amapiano vibe to vocals',
    genre: 'amapiano',
    parameters: {
      lowBoost: 0.2,
      midCut: 0.2,
      percBoost: 0.6,
      highShelf: 0.4,
      pumpIntensity: 0.45,
      threshold: -24,
      gatePattern: 'brokenBeat',
      gateDepth: 0.5,
      swing: 0.60,
      reverbSize: 0.6,
      width: 0.9,
      mix: 0.3,
      delayTime: 0.375,
      feedback: 0.35,
      warmth: 0.25
    }
  },
  {
    name: 'Heavy Pump',
    description: 'Extreme pumping and gating for dramatic effect',
    genre: 'amapiano',
    parameters: {
      lowBoost: 0.7,
      midCut: 0.6,
      percBoost: 0.8,
      pumpIntensity: 0.9,
      threshold: -14,
      sidechain: true,
      gatePattern: 'logDrumPulse',
      gateDepth: 0.9,
      swing: 0.68,
      reverbSize: 0.4,
      delayTime: 0.25,
      feedback: 0.6,
      warmth: 0.5,
      drive: 2.5
    }
  }
];
