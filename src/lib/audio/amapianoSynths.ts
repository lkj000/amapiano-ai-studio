/**
 * Amapiano-Specific Synthesizers using Tone.js
 * Provides authentic sounds for log drums, piano, bass, and percussion
 */

import * as Tone from 'tone';

export type AmapianoInstrumentType = 
  | 'log_drum' 
  | 'piano' 
  | 'bass' 
  | 'kick' 
  | 'snare' 
  | 'hihat' 
  | 'shaker' 
  | 'percussion'
  | 'pad'
  | 'lead'
  | 'default';

interface InstrumentConfig {
  synth: Tone.PolySynth | Tone.MonoSynth | Tone.MembraneSynth | Tone.MetalSynth | Tone.NoiseSynth;
  effects?: Tone.ToneAudioNode[];
}

/**
 * Creates an Amapiano Log Drum synth
 * Characteristic pitched decay sound, woody/organic tone
 */
export function createLogDrumSynth(): InstrumentConfig {
  const synth = new Tone.MonoSynth({
    oscillator: {
      type: 'sine'
    },
    envelope: {
      attack: 0.001,
      decay: 0.4,
      sustain: 0,
      release: 0.3
    },
    filterEnvelope: {
      attack: 0.001,
      decay: 0.2,
      sustain: 0,
      release: 0.2,
      baseFrequency: 200,
      octaves: 2
    }
  });

  // Add subtle distortion for warmth
  const distortion = new Tone.Distortion({
    distortion: 0.1,
    wet: 0.3
  });

  // Add reverb for space
  const reverb = new Tone.Reverb({
    decay: 1.2,
    wet: 0.2
  });

  return {
    synth: synth as any,
    effects: [distortion, reverb]
  };
}

/**
 * Creates an Amapiano Piano synth
 * Rhodes/electric piano character with warmth
 */
export function createPianoSynth(): InstrumentConfig {
  const synth = new Tone.PolySynth(Tone.FMSynth, {
    harmonicity: 3,
    modulationIndex: 10,
    oscillator: {
      type: 'sine'
    },
    envelope: {
      attack: 0.01,
      decay: 0.3,
      sustain: 0.4,
      release: 1.2
    },
    modulation: {
      type: 'sine'
    },
    modulationEnvelope: {
      attack: 0.5,
      decay: 0,
      sustain: 1,
      release: 0.5
    }
  });

  // Chorus for stereo width
  const chorus = new Tone.Chorus({
    frequency: 1.5,
    delayTime: 3.5,
    depth: 0.7,
    wet: 0.3
  }).start();

  // Subtle reverb
  const reverb = new Tone.Reverb({
    decay: 2,
    wet: 0.25
  });

  return {
    synth,
    effects: [chorus, reverb]
  };
}

/**
 * Creates an Amapiano Bass synth
 * Deep sub-bass with 808-style characteristics
 */
export function createBassSynth(): InstrumentConfig {
  const synth = new Tone.MonoSynth({
    oscillator: {
      type: 'sine'
    },
    envelope: {
      attack: 0.005,
      decay: 0.5,
      sustain: 0.4,
      release: 0.8
    },
    filterEnvelope: {
      attack: 0.005,
      decay: 0.3,
      sustain: 0.2,
      release: 0.5,
      baseFrequency: 80,
      octaves: 2
    }
  });

  // Add slight saturation
  const distortion = new Tone.Distortion({
    distortion: 0.05,
    wet: 0.2
  });

  // Low-pass filter for warmth
  const filter = new Tone.Filter({
    frequency: 300,
    type: 'lowpass',
    Q: 1
  });

  return {
    synth: synth as any,
    effects: [distortion, filter]
  };
}

/**
 * Creates a Kick drum synth
 */
export function createKickSynth(): InstrumentConfig {
  const synth = new Tone.MembraneSynth({
    pitchDecay: 0.05,
    octaves: 6,
    oscillator: {
      type: 'sine'
    },
    envelope: {
      attack: 0.001,
      decay: 0.4,
      sustain: 0.01,
      release: 1.4,
      attackCurve: 'exponential'
    }
  });

  return {
    synth: synth as any,
    effects: []
  };
}

/**
 * Creates a Snare drum synth
 */
export function createSnareSynth(): InstrumentConfig {
  const synth = new Tone.NoiseSynth({
    noise: {
      type: 'white'
    },
    envelope: {
      attack: 0.001,
      decay: 0.15,
      sustain: 0,
      release: 0.1
    }
  });

  // Band-pass for snare character
  const filter = new Tone.Filter({
    frequency: 3000,
    type: 'bandpass',
    Q: 1.5
  });

  return {
    synth: synth as any,
    effects: [filter]
  };
}

/**
 * Creates a Hi-Hat synth
 */
export function createHiHatSynth(): InstrumentConfig {
  const synth = new Tone.MetalSynth({
    envelope: {
      attack: 0.001,
      decay: 0.1,
      release: 0.01
    },
    harmonicity: 5.1,
    modulationIndex: 32,
    resonance: 4000,
    octaves: 1.5
  });

  // High-pass to remove low rumble
  const filter = new Tone.Filter({
    frequency: 8000,
    type: 'highpass'
  });

  return {
    synth: synth as any,
    effects: [filter]
  };
}

/**
 * Creates a Shaker synth
 */
export function createShakerSynth(): InstrumentConfig {
  const synth = new Tone.NoiseSynth({
    noise: {
      type: 'pink'
    },
    envelope: {
      attack: 0.005,
      decay: 0.05,
      sustain: 0,
      release: 0.05
    }
  });

  const filter = new Tone.Filter({
    frequency: 6000,
    type: 'highpass'
  });

  return {
    synth: synth as any,
    effects: [filter]
  };
}

/**
 * Creates a Pad synth for atmospheric sounds
 */
export function createPadSynth(): InstrumentConfig {
  const synth = new Tone.PolySynth(Tone.Synth, {
    oscillator: {
      type: 'sawtooth'
    },
    envelope: {
      attack: 0.5,
      decay: 0.3,
      sustain: 0.8,
      release: 2
    }
  });

  // Chorus for thickness
  const chorus = new Tone.Chorus({
    frequency: 0.5,
    delayTime: 5,
    depth: 0.9,
    wet: 0.5
  }).start();

  // Big reverb
  const reverb = new Tone.Reverb({
    decay: 4,
    wet: 0.4
  });

  // Low-pass to tame brightness
  const filter = new Tone.Filter({
    frequency: 2000,
    type: 'lowpass'
  });

  return {
    synth,
    effects: [filter, chorus, reverb]
  };
}

/**
 * Creates a Lead synth
 */
export function createLeadSynth(): InstrumentConfig {
  const synth = new Tone.MonoSynth({
    oscillator: {
      type: 'square'
    },
    envelope: {
      attack: 0.01,
      decay: 0.2,
      sustain: 0.6,
      release: 0.3
    },
    filterEnvelope: {
      attack: 0.01,
      decay: 0.1,
      sustain: 0.5,
      release: 0.3,
      baseFrequency: 500,
      octaves: 3
    }
  });

  const delay = new Tone.FeedbackDelay({
    delayTime: '8n',
    feedback: 0.3,
    wet: 0.2
  });

  return {
    synth: synth as any,
    effects: [delay]
  };
}

/**
 * Creates a default synth for unrecognized instruments
 */
export function createDefaultSynth(): InstrumentConfig {
  const synth = new Tone.PolySynth(Tone.Synth, {
    oscillator: {
      type: 'triangle'
    },
    envelope: {
      attack: 0.01,
      decay: 0.2,
      sustain: 0.4,
      release: 0.5
    }
  });

  return {
    synth,
    effects: []
  };
}

/**
 * Detects instrument type from track/clip name
 */
export function detectInstrumentType(name: string): AmapianoInstrumentType {
  const lowerName = name.toLowerCase();
  
  if (lowerName.includes('log') || lowerName.includes('drum') && !lowerName.includes('bass')) {
    return 'log_drum';
  }
  if (lowerName.includes('piano') || lowerName.includes('keys') || lowerName.includes('rhodes') || lowerName.includes('chord')) {
    return 'piano';
  }
  if (lowerName.includes('bass') || lowerName.includes('808') || lowerName.includes('sub')) {
    return 'bass';
  }
  if (lowerName.includes('kick')) {
    return 'kick';
  }
  if (lowerName.includes('snare') || lowerName.includes('clap')) {
    return 'snare';
  }
  if (lowerName.includes('hat') || lowerName.includes('hi-hat') || lowerName.includes('hihat')) {
    return 'hihat';
  }
  if (lowerName.includes('shaker') || lowerName.includes('shake')) {
    return 'shaker';
  }
  if (lowerName.includes('pad') || lowerName.includes('ambient') || lowerName.includes('atmo')) {
    return 'pad';
  }
  if (lowerName.includes('lead') || lowerName.includes('melody') || lowerName.includes('synth')) {
    return 'lead';
  }
  if (lowerName.includes('perc') || lowerName.includes('conga') || lowerName.includes('bongo')) {
    return 'percussion';
  }
  
  return 'default';
}

/**
 * Creates the appropriate synth based on instrument type
 */
export function createAmapianoInstrument(type: AmapianoInstrumentType): InstrumentConfig {
  switch (type) {
    case 'log_drum':
      return createLogDrumSynth();
    case 'piano':
      return createPianoSynth();
    case 'bass':
      return createBassSynth();
    case 'kick':
      return createKickSynth();
    case 'snare':
      return createSnareSynth();
    case 'hihat':
      return createHiHatSynth();
    case 'shaker':
      return createShakerSynth();
    case 'pad':
      return createPadSynth();
    case 'lead':
      return createLeadSynth();
    case 'percussion':
      return createLogDrumSynth(); // Similar character
    default:
      return createDefaultSynth();
  }
}

/**
 * Connects synth through effects chain to destination
 */
export function connectSynthWithEffects(
  synth: Tone.ToneAudioNode, 
  effects: Tone.ToneAudioNode[], 
  destination: Tone.ToneAudioNode
): void {
  if (effects.length === 0) {
    synth.connect(destination);
    return;
  }

  // Chain: synth -> effect1 -> effect2 -> ... -> destination
  synth.connect(effects[0]);
  for (let i = 0; i < effects.length - 1; i++) {
    effects[i].connect(effects[i + 1]);
  }
  effects[effects.length - 1].connect(destination);
}

/**
 * Dispose of synth and all its effects
 */
export function disposeSynthWithEffects(
  synth: Tone.ToneAudioNode, 
  effects: Tone.ToneAudioNode[]
): void {
  synth.dispose();
  effects.forEach(effect => effect.dispose());
}
