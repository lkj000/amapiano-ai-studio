/**
 * Real Audio Engine
 * No mocks, no simulations - actual Tone.js audio synthesis
 * Handles playback, scheduling, and real-time audio processing
 */

import * as Tone from 'tone';
import { FMLogDrumSynth, LOG_DRUM_PATCHES } from './FMLogDrumSynth';
import { NeuralGrooveEngine, GROOVE_PROFILES } from './NeuralGrooveEngine';
import { ProducerDNAProfile, PRODUCER_DNA_PRESETS } from './ProducerDNA';

export interface AudioTrack {
  id: string;
  name: string;
  type: 'drum' | 'synth' | 'sampler' | 'audio';
  instrument?: Tone.Synth | Tone.FMSynth | Tone.PolySynth | Tone.Sampler | FMLogDrumSynth;
  channel: Tone.Channel;
  effects: Tone.ToneAudioNode[];
  muted: boolean;
  solo: boolean;
  volume: number;
  pan: number;
}

export interface SequencerStep {
  active: boolean;
  velocity: number;
  note?: string;
  probability?: number; // 0-1, chance of playing
}

export interface Pattern {
  id: string;
  name: string;
  tracks: Map<string, SequencerStep[]>;
  length: number; // in steps
  resolution: number; // steps per beat (typically 4 for 16th notes)
}

export class RealAudioEngine {
  private isInitialized = false;
  private isPlaying = false;
  private currentStep = 0;
  private currentBar = 0;
  private bpm = 113;
  
  private tracks: Map<string, AudioTrack> = new Map();
  private patterns: Map<string, Pattern> = new Map();
  private currentPattern: Pattern | null = null;
  
  private masterChannel: Tone.Channel;
  private limiter: Tone.Limiter;
  private analyser: Tone.Analyser;
  private meter: Tone.Meter;
  
  private logDrumSynth: FMLogDrumSynth | null = null;
  private grooveEngine: NeuralGrooveEngine;
  private producerProfile: ProducerDNAProfile;
  
  private sequenceId: Tone.ToneEvent | null = null;
  private onStepCallback: ((step: number, bar: number) => void) | null = null;
  private onPlaybackChange: ((isPlaying: boolean) => void) | null = null;
  
  constructor() {
    // Master chain
    this.limiter = new Tone.Limiter(-1);
    this.analyser = new Tone.Analyser('waveform', 256);
    this.meter = new Tone.Meter();
    this.masterChannel = new Tone.Channel(0, 0);
    
    this.masterChannel.chain(this.limiter, this.analyser, this.meter, Tone.getDestination());
    
    // Initialize groove engine with default profile
    this.producerProfile = PRODUCER_DNA_PRESETS[0]; // Xduppy
    this.grooveEngine = new NeuralGrooveEngine(GROOVE_PROFILES.quantum, this.bpm);
  }
  
  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    
    await Tone.start();
    console.log('[RealAudioEngine] Audio context started');
    
    Tone.getTransport().bpm.value = this.bpm;
    
    this.isInitialized = true;
  }
  
  /**
   * Create the default Amapiano track setup
   */
  createDefaultTracks(): void {
    // Kick drum
    this.createTrack('kick', 'Kick', 'drum', () => {
      const synth = new Tone.MembraneSynth({
        pitchDecay: 0.05,
        octaves: 6,
        oscillator: { type: 'sine' },
        envelope: {
          attack: 0.001,
          decay: 0.3,
          sustain: 0,
          release: 0.1,
        },
      });
      return synth;
    });
    
    // Snare
    this.createTrack('snare', 'Snare', 'drum', () => {
      const synth = new Tone.NoiseSynth({
        noise: { type: 'white' },
        envelope: {
          attack: 0.001,
          decay: 0.15,
          sustain: 0,
          release: 0.05,
        },
      });
      return synth;
    });
    
    // Hi-hat
    this.createTrack('hihat', 'HiHat', 'drum', () => {
      const synth = new Tone.MetalSynth({
        envelope: {
          attack: 0.001,
          decay: 0.1,
          release: 0.01,
        },
        harmonicity: 5.1,
        modulationIndex: 32,
        resonance: 4000,
        octaves: 1.5,
      });
      synth.volume.value = -10;
      return synth;
    });
    
    // Log Drum (the star of Amapiano)
    this.logDrumSynth = new FMLogDrumSynth(LOG_DRUM_PATCHES[this.producerProfile.logDrum.velocityCurve === 'quantum' ? 'quantum' : 'soulful']);
    // Log drum uses its own connection, we'll handle it separately
    this.logDrumSynth.connect(this.masterChannel);
    
    // Bass (sub layer)
    this.createTrack('bass', 'Sub Bass', 'synth', () => {
      const synth = new Tone.MonoSynth({
        oscillator: { type: 'sine' },
        envelope: {
          attack: 0.01,
          decay: 0.3,
          sustain: 0.4,
          release: 0.2,
        },
        filterEnvelope: {
          attack: 0.01,
          decay: 0.2,
          sustain: 0.5,
          release: 0.2,
          baseFrequency: 200,
          octaves: 2,
        },
      });
      synth.volume.value = -3;
      return synth;
    });
    
    // Pad
    this.createTrack('pad', 'Pad', 'synth', () => {
      const synth = new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: 'sine' },
        envelope: {
          attack: 0.3,
          decay: 0.5,
          sustain: 0.7,
          release: 1,
        },
      });
      synth.volume.value = -8;
      return synth;
    });
    
    // Shaker
    this.createTrack('shaker', 'Shaker', 'drum', () => {
      const synth = new Tone.NoiseSynth({
        noise: { type: 'pink' },
        envelope: {
          attack: 0.001,
          decay: 0.05,
          sustain: 0,
          release: 0.02,
        },
      });
      synth.volume.value = -15;
      return synth;
    });
  }
  
  private createTrack(
    id: string,
    name: string,
    type: AudioTrack['type'],
    createInstrument: () => Tone.ToneAudioNode
  ): AudioTrack {
    const channel = new Tone.Channel(0, 0);
    channel.connect(this.masterChannel);
    
    const instrument = createInstrument() as any;
    instrument.connect(channel);
    
    const track: AudioTrack = {
      id,
      name,
      type,
      instrument,
      channel,
      effects: [],
      muted: false,
      solo: false,
      volume: 0,
      pan: 0,
    };
    
    this.tracks.set(id, track);
    return track;
  }
  
  /**
   * Create a default Amapiano pattern
   */
  createDefaultPattern(): Pattern {
    const pattern: Pattern = {
      id: 'pattern-1',
      name: 'Pattern 1',
      tracks: new Map(),
      length: 16,
      resolution: 4,
    };
    
    // Kick: every 4 steps (on the beat)
    pattern.tracks.set('kick', Array(16).fill(null).map((_, i) => ({
      active: i % 4 === 0,
      velocity: 0.9,
      note: 'C1',
    })));
    
    // Snare: on beats 2 and 4
    pattern.tracks.set('snare', Array(16).fill(null).map((_, i) => ({
      active: i === 4 || i === 12,
      velocity: 0.8,
    })));
    
    // Hi-hat: every 2 steps
    pattern.tracks.set('hihat', Array(16).fill(null).map((_, i) => ({
      active: i % 2 === 0,
      velocity: i % 4 === 0 ? 0.8 : 0.5,
    })));
    
    // Log drum: signature Amapiano pattern
    pattern.tracks.set('logdrum', Array(16).fill(null).map((_, i) => ({
      active: [0, 3, 6, 10, 14].includes(i),
      velocity: [0, 10].includes(i) ? 0.95 : 0.75,
      note: [0, 10].includes(i) ? 'C2' : 'G1',
    })));
    
    // Bass: following log drum
    pattern.tracks.set('bass', Array(16).fill(null).map((_, i) => ({
      active: i === 0 || i === 8,
      velocity: 0.85,
      note: 'C1',
    })));
    
    // Shaker: constant shuffle
    pattern.tracks.set('shaker', Array(16).fill(null).map((_, i) => ({
      active: i % 2 === 1,
      velocity: 0.6,
    })));
    
    this.patterns.set(pattern.id, pattern);
    this.currentPattern = pattern;
    
    return pattern;
  }
  
  /**
   * Start playback with real audio
   */
  play(): void {
    if (!this.isInitialized || this.isPlaying) return;
    
    this.isPlaying = true;
    
    const stepDuration = Tone.Time('16n').toSeconds();
    
    // Create the main sequence
    this.sequenceId = new Tone.ToneEvent((time) => {
      this.playStep(time);
      
      // Advance step
      this.currentStep++;
      if (this.currentStep >= (this.currentPattern?.length || 16)) {
        this.currentStep = 0;
        this.currentBar++;
      }
      
      // Callback for UI update
      if (this.onStepCallback) {
        Tone.getDraw().schedule(() => {
          this.onStepCallback!(this.currentStep, this.currentBar);
        }, time);
      }
    });
    
    this.sequenceId.loop = true;
    this.sequenceId.loopEnd = stepDuration;
    this.sequenceId.start(0);
    
    Tone.getTransport().start();
    
    if (this.onPlaybackChange) {
      this.onPlaybackChange(true);
    }
  }
  
  private playStep(time: number): void {
    if (!this.currentPattern) return;
    
    // Ensure we have a valid time
    const safeTime = time || Tone.now();
    
    this.currentPattern.tracks.forEach((steps, trackId) => {
      const step = steps[this.currentStep];
      const track = this.tracks.get(trackId);
      
      if (!step?.active || !track || track.muted) return;
      
      // Check probability
      if (step.probability !== undefined && Math.random() > step.probability) return;
      
      // Apply groove timing with safety check
      let groovedTime: number;
      try {
        groovedTime = this.grooveEngine.applyGroove(safeTime, step.note || 'C2', this.currentStep);
        // Ensure groovedTime is valid and positive
        if (typeof groovedTime !== 'number' || isNaN(groovedTime) || groovedTime < 0) {
          groovedTime = safeTime;
        }
      } catch {
        groovedTime = safeTime;
      }
      
      // Trigger the instrument with safe timing
      try {
        const instrument = track.instrument as any;
        
        if (trackId === 'logdrum' && this.logDrumSynth) {
          this.logDrumSynth.trigger(step.note || 'C2', step.velocity, groovedTime);
        } else if (track.type === 'drum' && instrument.triggerAttackRelease) {
          // For NoiseSynth (snare, shaker) - don't pass a note, and use safe duration
          if (instrument instanceof Tone.NoiseSynth) {
            instrument.triggerAttackRelease('16n', groovedTime, step.velocity);
          } else if (instrument instanceof Tone.MetalSynth) {
            // MetalSynth uses frequency, not note
            instrument.triggerAttackRelease('32n', groovedTime, step.velocity);
          } else if (instrument instanceof Tone.MembraneSynth) {
            instrument.triggerAttackRelease(step.note || 'C1', '8n', groovedTime, step.velocity);
          } else {
            instrument.triggerAttackRelease(step.note || 'C2', '16n', groovedTime, step.velocity);
          }
        } else if (instrument.triggerAttackRelease) {
          instrument.triggerAttackRelease(step.note || 'C2', '16n', groovedTime, step.velocity);
        } else if (instrument.triggerAttack) {
          instrument.triggerAttack(groovedTime, step.velocity);
        }
      } catch (err) {
        console.warn(`[RealAudioEngine] Failed to trigger ${trackId}:`, err);
      }
    });
  }
  
  pause(): void {
    if (!this.isPlaying) return;
    
    Tone.getTransport().pause();
    this.isPlaying = false;
    
    if (this.onPlaybackChange) {
      this.onPlaybackChange(false);
    }
  }
  
  stop(): void {
    Tone.getTransport().stop();
    Tone.getTransport().cancel();
    
    if (this.sequenceId) {
      this.sequenceId.dispose();
      this.sequenceId = null;
    }
    
    this.isPlaying = false;
    this.currentStep = 0;
    this.currentBar = 0;
    
    if (this.onPlaybackChange) {
      this.onPlaybackChange(false);
    }
    if (this.onStepCallback) {
      this.onStepCallback(0, 0);
    }
  }
  
  /**
   * Seek to a specific position
   */
  seek(bar: number, step: number = 0): void {
    this.currentBar = bar;
    this.currentStep = step;
    
    const totalSteps = bar * (this.currentPattern?.length || 16) + step;
    const stepDuration = Tone.Time('16n').toSeconds();
    Tone.getTransport().seconds = totalSteps * stepDuration;
    
    if (this.onStepCallback) {
      this.onStepCallback(step, bar);
    }
  }
  
  setBPM(bpm: number): void {
    this.bpm = bpm;
    Tone.getTransport().bpm.value = bpm;
    this.grooveEngine.setBPM(bpm);
  }
  
  setProducerProfile(profileId: string): void {
    const profile = PRODUCER_DNA_PRESETS.find(p => p.id === profileId);
    if (profile) {
      this.producerProfile = profile;
      this.bpm = profile.bpmRange.sweet;
      this.setBPM(this.bpm);
      
      // Update groove engine
      const grooveProfile = GROOVE_PROFILES[profile.style] || GROOVE_PROFILES.quantum;
      this.grooveEngine.setProfile(profile.style);
      this.grooveEngine.setSwing(profile.groove.microTiming / 15);
      
      // Update log drum
      if (this.logDrumSynth) {
        const patchName = profile.logDrum.velocityCurve === 'quantum' ? 'quantum' : 
                         profile.logDrum.velocityCurve === 'exponential' ? 'toxic_blue' : 'soulful';
        this.logDrumSynth.setPatch(patchName);
        this.logDrumSynth.setDistortion(profile.logDrum.distortion);
      }
    }
  }
  
  toggleStep(trackId: string, stepIndex: number): void {
    if (!this.currentPattern) return;
    
    const steps = this.currentPattern.tracks.get(trackId);
    if (steps && steps[stepIndex]) {
      steps[stepIndex].active = !steps[stepIndex].active;
    }
  }
  
  setTrackVolume(trackId: string, volume: number): void {
    const track = this.tracks.get(trackId);
    if (track) {
      track.volume = volume;
      track.channel.volume.value = Tone.gainToDb(volume);
    }
  }
  
  setTrackPan(trackId: string, pan: number): void {
    const track = this.tracks.get(trackId);
    if (track) {
      track.pan = pan;
      track.channel.pan.value = pan;
    }
  }
  
  setTrackMuted(trackId: string, muted: boolean): void {
    const track = this.tracks.get(trackId);
    if (track) {
      track.muted = muted;
      track.channel.mute = muted;
    }
  }
  
  setTrackSolo(trackId: string, solo: boolean): void {
    const track = this.tracks.get(trackId);
    if (track) {
      track.solo = solo;
      track.channel.solo = solo;
    }
  }
  
  // Getters
  get playing(): boolean { return this.isPlaying; }
  get step(): number { return this.currentStep; }
  get bar(): number { return this.currentBar; }
  get tempo(): number { return this.bpm; }
  get pattern(): Pattern | null { return this.currentPattern; }
  get initialized(): boolean { return this.isInitialized; }
  
  getWaveformData(): Float32Array {
    return this.analyser.getValue() as Float32Array;
  }
  
  getMeterLevel(): number {
    return this.meter.getValue() as number;
  }
  
  onStep(callback: (step: number, bar: number) => void): void {
    this.onStepCallback = callback;
  }
  
  onPlayback(callback: (isPlaying: boolean) => void): void {
    this.onPlaybackChange = callback;
  }
  
  getTrack(id: string): AudioTrack | undefined {
    return this.tracks.get(id);
  }
  
  getAllTracks(): AudioTrack[] {
    return Array.from(this.tracks.values());
  }
  
  dispose(): void {
    this.stop();
    
    this.tracks.forEach(track => {
      track.instrument?.dispose?.();
      track.channel.dispose();
      track.effects.forEach(e => e.dispose());
    });
    
    this.masterChannel.dispose();
    this.limiter.dispose();
    this.analyser.dispose();
    this.meter.dispose();
    this.logDrumSynth?.dispose();
    
    this.tracks.clear();
    this.patterns.clear();
  }
}

// Singleton instance
let audioEngineInstance: RealAudioEngine | null = null;

export function getAudioEngine(): RealAudioEngine {
  if (!audioEngineInstance) {
    audioEngineInstance = new RealAudioEngine();
  }
  return audioEngineInstance;
}
