/**
 * FM Log Drum Synthesizer
 * 4-Operator FM synthesis with velocity-to-grit mapping
 * Based on the Quantum Amapiano production guide
 */

import * as Tone from 'tone';

export interface FMOperator {
  ratio: number;         // Frequency ratio relative to fundamental
  level: number;         // Output level 0-1
  feedback: number;      // Self-modulation 0-1
  envelope: {
    attack: number;
    decay: number;
    sustain: number;
    release: number;
  };
}

export interface LogDrumPatch {
  name: string;
  fundamental: number;   // Base frequency Hz
  operators: [FMOperator, FMOperator, FMOperator, FMOperator];
  pitchEnvelope: {
    amount: number;      // Semitones of pitch drop
    decay: number;       // Time to reach final pitch
  };
  distortion: number;    // 0-1 saturation
  velocityToGrit: number; // How much velocity affects distortion
  velocityToPitch: number; // How much velocity affects pitch
}

export const LOG_DRUM_PATCHES: Record<string, LogDrumPatch> = {
  quantum: {
    name: 'Quantum Knock',
    fundamental: 55,
    operators: [
      { ratio: 1, level: 1.0, feedback: 0.1, envelope: { attack: 0.001, decay: 0.3, sustain: 0, release: 0.1 } },
      { ratio: 2.01, level: 0.6, feedback: 0, envelope: { attack: 0.001, decay: 0.15, sustain: 0, release: 0.05 } },
      { ratio: 3.5, level: 0.3, feedback: 0.2, envelope: { attack: 0.001, decay: 0.08, sustain: 0, release: 0.02 } },
      { ratio: 0.5, level: 0.8, feedback: 0, envelope: { attack: 0.001, decay: 0.4, sustain: 0.1, release: 0.15 } },
    ],
    pitchEnvelope: { amount: 24, decay: 0.08 },
    distortion: 0.7,
    velocityToGrit: 0.5,
    velocityToPitch: 0.3,
  },
  sgija: {
    name: 'Sgija Disrespect',
    fundamental: 50,
    operators: [
      { ratio: 1, level: 1.0, feedback: 0.15, envelope: { attack: 0.001, decay: 0.25, sustain: 0, release: 0.08 } },
      { ratio: 2.5, level: 0.7, feedback: 0.1, envelope: { attack: 0.001, decay: 0.1, sustain: 0, release: 0.03 } },
      { ratio: 4.0, level: 0.4, feedback: 0.25, envelope: { attack: 0.001, decay: 0.05, sustain: 0, release: 0.01 } },
      { ratio: 0.5, level: 0.9, feedback: 0, envelope: { attack: 0.001, decay: 0.5, sustain: 0.15, release: 0.2 } },
    ],
    pitchEnvelope: { amount: 36, decay: 0.05 },
    distortion: 0.85,
    velocityToGrit: 0.6,
    velocityToPitch: 0.4,
  },
  soulful: {
    name: 'Private School',
    fundamental: 65,
    operators: [
      { ratio: 1, level: 1.0, feedback: 0.05, envelope: { attack: 0.005, decay: 0.4, sustain: 0, release: 0.2 } },
      { ratio: 2.0, level: 0.4, feedback: 0, envelope: { attack: 0.003, decay: 0.2, sustain: 0, release: 0.1 } },
      { ratio: 3.0, level: 0.2, feedback: 0.1, envelope: { attack: 0.002, decay: 0.1, sustain: 0, release: 0.05 } },
      { ratio: 0.5, level: 0.7, feedback: 0, envelope: { attack: 0.003, decay: 0.5, sustain: 0.05, release: 0.25 } },
    ],
    pitchEnvelope: { amount: 12, decay: 0.15 },
    distortion: 0.25,
    velocityToGrit: 0.2,
    velocityToPitch: 0.15,
  },
  toxic_blue: {
    name: 'Toxic Blue',
    fundamental: 52,
    operators: [
      { ratio: 1, level: 1.0, feedback: 0.08, envelope: { attack: 0.001, decay: 0.35, sustain: 0, release: 0.12 } },
      { ratio: 1.5, level: 0.5, feedback: 0.05, envelope: { attack: 0.001, decay: 0.18, sustain: 0, release: 0.06 } },
      { ratio: 3.0, level: 0.35, feedback: 0.15, envelope: { attack: 0.001, decay: 0.09, sustain: 0, release: 0.03 } },
      { ratio: 0.5, level: 0.85, feedback: 0, envelope: { attack: 0.001, decay: 0.45, sustain: 0.08, release: 0.18 } },
    ],
    pitchEnvelope: { amount: 18, decay: 0.1 },
    distortion: 0.55,
    velocityToGrit: 0.4,
    velocityToPitch: 0.25,
  },
};

export class FMLogDrumSynth {
  private synth: Tone.FMSynth;
  private subSynth: Tone.Synth;
  private distortion: Tone.Distortion;
  private filter: Tone.Filter;
  private compressor: Tone.Compressor;
  private limiter: Tone.Limiter;
  private output: Tone.Gain;
  
  private currentPatch: LogDrumPatch;
  
  constructor(patch: LogDrumPatch = LOG_DRUM_PATCHES.quantum) {
    this.currentPatch = patch;
    
    // Main FM synth for the "knock"
    this.synth = new Tone.FMSynth({
      harmonicity: patch.operators[1].ratio,
      modulationIndex: patch.operators[1].level * 10,
      oscillator: { type: 'sine' },
      envelope: {
        attack: patch.operators[0].envelope.attack,
        decay: patch.operators[0].envelope.decay,
        sustain: patch.operators[0].envelope.sustain,
        release: patch.operators[0].envelope.release,
      },
      modulation: { type: 'sine' },
      modulationEnvelope: {
        attack: patch.operators[1].envelope.attack,
        decay: patch.operators[1].envelope.decay,
        sustain: patch.operators[1].envelope.sustain,
        release: patch.operators[1].envelope.release,
      },
    });
    
    // Sub oscillator for weight
    this.subSynth = new Tone.Synth({
      oscillator: { type: 'sine' },
      envelope: {
        attack: patch.operators[3].envelope.attack,
        decay: patch.operators[3].envelope.decay,
        sustain: patch.operators[3].envelope.sustain,
        release: patch.operators[3].envelope.release,
      },
    });
    
    // Saturation for the "Quantum" grit
    this.distortion = new Tone.Distortion(patch.distortion * 0.8);
    
    // Low-pass to tame harshness
    this.filter = new Tone.Filter(2000, 'lowpass');
    
    // Compression for punch
    this.compressor = new Tone.Compressor({
      threshold: -15,
      ratio: 6,
      attack: 0.003,
      release: 0.1,
    });
    
    // Final limiting
    this.limiter = new Tone.Limiter(-3);
    
    // Output gain
    this.output = new Tone.Gain(0.8);
    
    // Signal routing
    this.synth.chain(this.distortion, this.filter, this.compressor);
    this.subSynth.connect(this.compressor);
    this.compressor.chain(this.limiter, this.output);
  }
  
  connect(destination: Tone.InputNode): this {
    this.output.connect(destination);
    return this;
  }
  
  toDestination(): this {
    this.output.toDestination();
    return this;
  }
  
  /**
   * Trigger a log drum hit with velocity-sensitive parameters
   */
  trigger(
    note: string | number = 'C2',
    velocity: number = 0.8,
    time?: Tone.Unit.Time
  ): void {
    const now = time ?? Tone.now();
    const patch = this.currentPatch;
    
    // Calculate velocity-adjusted parameters
    const adjustedDistortion = patch.distortion + (velocity - 0.5) * patch.velocityToGrit;
    this.distortion.distortion = Math.max(0, Math.min(1, adjustedDistortion));
    
    // Calculate pitch with velocity influence
    const freq = typeof note === 'number' ? note : Tone.Frequency(note).toFrequency();
    const pitchBoost = (velocity - 0.5) * patch.velocityToPitch * 12; // semitones
    
    // Start pitch higher and slide down (the "knock")
    const startPitch = freq * Math.pow(2, (patch.pitchEnvelope.amount + pitchBoost) / 12);
    const nowTime = typeof now === 'number' ? now : Tone.now();
    
    // Trigger main synth with pitch envelope
    this.synth.frequency.setValueAtTime(startPitch, nowTime);
    this.synth.frequency.exponentialRampToValueAtTime(freq, nowTime + patch.pitchEnvelope.decay);
    this.synth.triggerAttackRelease(freq, '8n', now, velocity);
    
    // Trigger sub (an octave down)
    const subFreq = freq * patch.operators[3].ratio;
    this.subSynth.triggerAttackRelease(subFreq, '4n', now, velocity * patch.operators[3].level);
  }
  
  /**
   * Trigger with octave jump (signature Xduppy technique)
   */
  triggerWithOctaveJump(
    baseNote: string | number = 'C2',
    velocity: number = 0.8,
    jumpUp: boolean = true,
    time?: Tone.Unit.Time
  ): void {
    const now = time ?? Tone.now();
    
    // First hit
    this.trigger(baseNote, velocity * 0.85, now);
    
    // Octave jump hit after a short delay
    const freq = typeof baseNote === 'number' ? baseNote : Tone.Frequency(baseNote).toFrequency();
    const jumpFreq = jumpUp ? freq * 2 : freq / 2;
    
    setTimeout(() => {
      this.trigger(jumpFreq, velocity, Tone.now());
    }, 150);
  }
  
  /**
   * Play a "Quantum roll" - multiple hits with velocity staircase
   */
  playQuantumRoll(
    note: string | number = 'C2',
    numHits: number = 4,
    duration: number = 0.2, // total duration in seconds
    time?: Tone.Unit.Time
  ): void {
    const now = time ?? Tone.now();
    const hitInterval = duration / numHits;
    
    const nowTime = typeof now === 'number' ? now : Tone.now();
    for (let i = 0; i < numHits; i++) {
      // Velocity increases toward the end (staircase effect)
      const velocity = 0.3 + (i / (numHits - 1)) * 0.7;
      const hitTime = nowTime + i * hitInterval;
      
      this.trigger(note, velocity, hitTime);
    }
  }
  
  setPatch(patchName: string): void {
    const patch = LOG_DRUM_PATCHES[patchName];
    if (patch) {
      this.currentPatch = patch;
      this.distortion.distortion = patch.distortion * 0.8;
      
      // Update synth parameters
      this.synth.harmonicity.value = patch.operators[1].ratio;
      this.synth.modulationIndex.value = patch.operators[1].level * 10;
      this.synth.envelope.attack = patch.operators[0].envelope.attack;
      this.synth.envelope.decay = patch.operators[0].envelope.decay;
      this.synth.envelope.sustain = patch.operators[0].envelope.sustain;
      this.synth.envelope.release = patch.operators[0].envelope.release;
    }
  }
  
  setDistortion(amount: number): void {
    this.distortion.distortion = Math.max(0, Math.min(1, amount));
  }
  
  setFilterCutoff(frequency: number): void {
    this.filter.frequency.value = frequency;
  }
  
  dispose(): void {
    this.synth.dispose();
    this.subSynth.dispose();
    this.distortion.dispose();
    this.filter.dispose();
    this.compressor.dispose();
    this.limiter.dispose();
    this.output.dispose();
  }
}

/**
 * Create a complete log drum instrument with all patches available
 */
export function createLogDrumInstrument(): {
  synth: FMLogDrumSynth;
  patches: typeof LOG_DRUM_PATCHES;
  trigger: (note?: string | number, velocity?: number) => void;
  triggerOctaveJump: (note?: string | number, velocity?: number, up?: boolean) => void;
  quantumRoll: (note?: string | number, hits?: number) => void;
} {
  const synth = new FMLogDrumSynth();
  synth.toDestination();
  
  return {
    synth,
    patches: LOG_DRUM_PATCHES,
    trigger: (note = 'C2', velocity = 0.8) => synth.trigger(note, velocity),
    triggerOctaveJump: (note = 'C2', velocity = 0.8, up = true) => synth.triggerWithOctaveJump(note, velocity, up),
    quantumRoll: (note = 'C2', hits = 4) => synth.playQuantumRoll(note, hits, 0.2),
  };
}
