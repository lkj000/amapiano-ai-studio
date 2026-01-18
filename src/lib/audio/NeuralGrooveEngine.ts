/**
 * Neural Groove Engine
 * FDD (Frequency-Dependent Displacement) micro-timing per frequency band
 * Creates the authentic "bounce" of South African Amapiano
 */

import * as Tone from 'tone';

export interface GrooveProfile {
  name: string;
  // Timing offsets in milliseconds for each frequency band
  lowBandOffset: number;    // 20-200 Hz (Kick, Sub)
  lowMidOffset: number;     // 200-800 Hz (Log Drum body)
  midOffset: number;        // 800-2500 Hz (Snare, Vocals)
  highMidOffset: number;    // 2500-6000 Hz (Hi-hats, Percussion)
  highOffset: number;       // 6000-20000 Hz (Air, Shimmer)
  
  // Velocity variations
  velocityVariation: number; // 0-1, how much random velocity variation
  humanize: number;          // 0-1, general humanization amount
  
  // Swing settings
  swingAmount: number;       // 0-1
  swingGrid: '8n' | '16n';   // Which grid to apply swing
}

export const GROOVE_PROFILES: Record<string, GrooveProfile> = {
  quantum: {
    name: 'Quantum Taxi',
    lowBandOffset: 0,
    lowMidOffset: 8,
    midOffset: 5,
    highMidOffset: 3,
    highOffset: -2,
    velocityVariation: 0.15,
    humanize: 0.12,
    swingAmount: 0.65,
    swingGrid: '16n',
  },
  sgija: {
    name: 'Sgija Streets',
    lowBandOffset: 0,
    lowMidOffset: 12,
    midOffset: 7,
    highMidOffset: 4,
    highOffset: -3,
    velocityVariation: 0.2,
    humanize: 0.18,
    swingAmount: 0.72,
    swingGrid: '16n',
  },
  soulful: {
    name: 'Private School',
    lowBandOffset: 0,
    lowMidOffset: 4,
    midOffset: 6,
    highMidOffset: 8,
    highOffset: 2,
    velocityVariation: 0.08,
    humanize: 0.06,
    swingAmount: 0.45,
    swingGrid: '8n',
  },
  durban: {
    name: 'Durban Smooth',
    lowBandOffset: 0,
    lowMidOffset: 3,
    midOffset: 5,
    highMidOffset: 10,
    highOffset: 5,
    velocityVariation: 0.05,
    humanize: 0.04,
    swingAmount: 0.35,
    swingGrid: '8n',
  },
  tech: {
    name: 'Tech Piano',
    lowBandOffset: 0,
    lowMidOffset: 6,
    midOffset: 8,
    highMidOffset: 5,
    highOffset: 0,
    velocityVariation: 0.1,
    humanize: 0.09,
    swingAmount: 0.55,
    swingGrid: '16n',
  },
  private_school: {
    name: 'Private School Smooth',
    lowBandOffset: 0,
    lowMidOffset: 4,
    midOffset: 6,
    highMidOffset: 9,
    highOffset: 3,
    velocityVariation: 0.06,
    humanize: 0.05,
    swingAmount: 0.4,
    swingGrid: '8n',
  },
};

export type FrequencyBand = 'low' | 'lowMid' | 'mid' | 'highMid' | 'high';

export interface ScheduledEvent {
  id: string;
  time: number;           // Original time in seconds
  adjustedTime: number;   // Time after groove applied
  velocity: number;
  adjustedVelocity: number;
  frequencyBand: FrequencyBand;
  note?: string | number;
  duration?: number;
}

export class NeuralGrooveEngine {
  private profile: GrooveProfile;
  private bpm: number;
  private events: ScheduledEvent[] = [];
  
  constructor(profile: GrooveProfile = GROOVE_PROFILES.quantum, bpm: number = 113) {
    this.profile = profile;
    this.bpm = bpm;
  }
  
  /**
   * Determine frequency band based on note or frequency
   */
  getFrequencyBand(noteOrFreq: string | number): FrequencyBand {
    let freq: number;
    
    if (typeof noteOrFreq === 'string') {
      freq = Tone.Frequency(noteOrFreq).toFrequency();
    } else {
      freq = noteOrFreq;
    }
    
    if (freq < 200) return 'low';
    if (freq < 800) return 'lowMid';
    if (freq < 2500) return 'mid';
    if (freq < 6000) return 'highMid';
    return 'high';
  }
  
  /**
   * Get the timing offset for a frequency band in milliseconds
   */
  getTimingOffset(band: FrequencyBand): number {
    const offsets: Record<FrequencyBand, number> = {
      low: this.profile.lowBandOffset,
      lowMid: this.profile.lowMidOffset,
      mid: this.profile.midOffset,
      highMid: this.profile.highMidOffset,
      high: this.profile.highOffset,
    };
    
    // Add humanization
    const humanizeMs = (Math.random() - 0.5) * this.profile.humanize * 10;
    
    return offsets[band] + humanizeMs;
  }
  
  /**
   * Apply groove to a scheduled time
   */
  applyGroove(
    originalTime: number, // in seconds
    noteOrFreq: string | number,
    stepIndex?: number // for swing calculation
  ): number {
    // Safety check - ensure we have a valid time
    if (typeof originalTime !== 'number' || isNaN(originalTime)) {
      console.warn('[NeuralGrooveEngine] Invalid originalTime, using 0');
      originalTime = Tone.now();
    }
    
    const band = this.getFrequencyBand(noteOrFreq);
    const offsetMs = this.getTimingOffset(band);
    
    // Convert ms to seconds
    let adjustedTime = originalTime + (offsetMs / 1000);
    
    // Apply swing if applicable
    if (stepIndex !== undefined && typeof stepIndex === 'number') {
      const isSwingStep = this.profile.swingGrid === '16n' 
        ? stepIndex % 2 === 1 // Every other 16th note
        : stepIndex % 4 === 2; // Every other 8th note
      
      if (isSwingStep) {
        const swingDelayMs = (60 / this.bpm / 4) * 1000 * this.profile.swingAmount * 0.33;
        adjustedTime += swingDelayMs / 1000;
      }
    }
    
    // Ensure the result is a valid positive number
    const result = Math.max(0, adjustedTime);
    return isNaN(result) ? originalTime : result;
  }
  
  /**
   * Apply groove to velocity
   */
  applyVelocityGroove(originalVelocity: number, band: FrequencyBand): number {
    // Band-specific velocity adjustments
    const bandMultipliers: Record<FrequencyBand, number> = {
      low: 1.0,
      lowMid: 1.05,
      mid: 0.95,
      highMid: 0.9,
      high: 0.85,
    };
    
    // Add variation
    const variation = (Math.random() - 0.5) * this.profile.velocityVariation * 2;
    
    const adjusted = originalVelocity * bandMultipliers[band] + variation;
    return Math.max(0.1, Math.min(1, adjusted));
  }
  
  /**
   * Schedule an event with groove applied
   */
  scheduleEvent(
    id: string,
    time: number,
    velocity: number,
    noteOrFreq: string | number,
    stepIndex?: number,
    duration?: number
  ): ScheduledEvent {
    const band = this.getFrequencyBand(noteOrFreq);
    const adjustedTime = this.applyGroove(time, noteOrFreq, stepIndex);
    const adjustedVelocity = this.applyVelocityGroove(velocity, band);
    
    const event: ScheduledEvent = {
      id,
      time,
      adjustedTime,
      velocity,
      adjustedVelocity,
      frequencyBand: band,
      note: noteOrFreq,
      duration,
    };
    
    this.events.push(event);
    return event;
  }
  
  /**
   * Process a pattern of events and return groove-adjusted events
   */
  processPattern(
    pattern: Array<{
      time: number;
      velocity: number;
      note: string | number;
      duration?: number;
    }>,
    patternLength: number = 16
  ): ScheduledEvent[] {
    this.events = [];
    
    pattern.forEach((event, index) => {
      const stepIndex = Math.floor((event.time / (patternLength * (60 / this.bpm / 4))) * patternLength);
      
      this.scheduleEvent(
        `event-${index}`,
        event.time,
        event.velocity,
        event.note,
        stepIndex,
        event.duration
      );
    });
    
    // Sort by adjusted time
    this.events.sort((a, b) => a.adjustedTime - b.adjustedTime);
    
    return this.events;
  }
  
  /**
   * Get timing visualization data for UI
   */
  getTimingVisualization(): Array<{
    band: FrequencyBand;
    offset: number;
    color: string;
  }> {
    const colors: Record<FrequencyBand, string> = {
      low: '#8B5CF6',     // Purple
      lowMid: '#10B981',  // Green
      mid: '#F59E0B',     // Orange
      highMid: '#3B82F6', // Blue
      high: '#EC4899',    // Pink
    };
    
    return (['low', 'lowMid', 'mid', 'highMid', 'high'] as FrequencyBand[]).map(band => ({
      band,
      offset: this.getTimingOffset(band),
      color: colors[band],
    }));
  }
  
  setProfile(profileName: string): void {
    const profile = GROOVE_PROFILES[profileName];
    if (profile) {
      this.profile = profile;
    }
  }
  
  setBPM(bpm: number): void {
    this.bpm = bpm;
  }
  
  setHumanize(amount: number): void {
    this.profile = { ...this.profile, humanize: Math.max(0, Math.min(1, amount)) };
  }
  
  setSwing(amount: number): void {
    this.profile = { ...this.profile, swingAmount: Math.max(0, Math.min(1, amount)) };
  }
  
  getProfile(): GrooveProfile {
    return { ...this.profile };
  }
  
  clearEvents(): void {
    this.events = [];
  }
}

/**
 * Create a groove engine with real-time transport integration
 */
export function createGrooveTransport(
  profile: GrooveProfile = GROOVE_PROFILES.quantum,
  bpm: number = 113
): {
  engine: NeuralGrooveEngine;
  scheduleNote: (
    synth: Tone.Synth | Tone.FMSynth | Tone.PolySynth,
    note: string | number,
    time: number,
    velocity: number,
    duration: number,
    stepIndex?: number
  ) => void;
  start: () => void;
  stop: () => void;
} {
  const engine = new NeuralGrooveEngine(profile, bpm);
  Tone.getTransport().bpm.value = bpm;
  
  return {
    engine,
    scheduleNote: (synth, note, time, velocity, duration, stepIndex) => {
      const event = engine.scheduleEvent(
        `note-${Date.now()}`,
        time,
        velocity,
        note,
        stepIndex,
        duration
      );
      
      // Schedule with Tone.js Transport
      Tone.getTransport().schedule((scheduleTime) => {
        synth.triggerAttackRelease(
          note,
          duration,
          scheduleTime,
          event.adjustedVelocity
        );
      }, event.adjustedTime);
    },
    start: () => Tone.getTransport().start(),
    stop: () => {
      Tone.getTransport().stop();
      Tone.getTransport().cancel();
      engine.clearEvents();
    },
  };
}
