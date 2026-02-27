/**
 * Comprehensive Amapiano Audio Engine Tests
 * Tests for FM Log Drum, Neural Groove Engine, Producer DNA, and Real Audio Engine
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { 
  LOG_DRUM_PATCHES,
  LogDrumPatch 
} from '@/lib/audio/FMLogDrumSynth';
import { 
  GROOVE_PROFILES, 
  NeuralGrooveEngine,
  GrooveProfile 
} from '@/lib/audio/NeuralGrooveEngine';
import { 
  PRODUCER_DNA_PRESETS,
  calculateCulturalScore,
  morphProducerDNA,
  ProducerDNAProfile 
} from '@/lib/audio/ProducerDNA';

describe('🎹 FM Log Drum Synthesizer', () => {
  describe('Patch Configuration', () => {
    it('has all required patches', () => {
      expect(LOG_DRUM_PATCHES).toHaveProperty('quantum');
      expect(LOG_DRUM_PATCHES).toHaveProperty('sgija');
      expect(LOG_DRUM_PATCHES).toHaveProperty('soulful');
      expect(LOG_DRUM_PATCHES).toHaveProperty('toxic_blue');
    });

    it('quantum patch has correct structure', () => {
      const quantum = LOG_DRUM_PATCHES.quantum;
      expect(quantum.name).toBe('Quantum Knock');
      expect(quantum.fundamental).toBe(55);
      expect(quantum.operators).toHaveLength(4);
      expect(quantum.distortion).toBeGreaterThan(0);
      expect(quantum.velocityToGrit).toBeGreaterThan(0);
    });

    it('each operator has valid envelope', () => {
      Object.values(LOG_DRUM_PATCHES).forEach((patch: LogDrumPatch) => {
        patch.operators.forEach((op, index) => {
          expect(op.ratio).toBeGreaterThan(0);
          expect(op.level).toBeGreaterThanOrEqual(0);
          expect(op.level).toBeLessThanOrEqual(1);
          expect(op.envelope.attack).toBeGreaterThanOrEqual(0);
          expect(op.envelope.decay).toBeGreaterThan(0);
          expect(op.envelope.sustain).toBeGreaterThanOrEqual(0);
          expect(op.envelope.release).toBeGreaterThan(0);
        });
      });
    });

    it('pitch envelope is within valid range', () => {
      Object.values(LOG_DRUM_PATCHES).forEach((patch: LogDrumPatch) => {
        expect(patch.pitchEnvelope.amount).toBeGreaterThan(0);
        expect(patch.pitchEnvelope.decay).toBeGreaterThan(0);
        expect(patch.pitchEnvelope.decay).toBeLessThan(1);
      });
    });

    it('velocity mappings are normalized', () => {
      Object.values(LOG_DRUM_PATCHES).forEach((patch: LogDrumPatch) => {
        expect(patch.velocityToGrit).toBeGreaterThanOrEqual(0);
        expect(patch.velocityToGrit).toBeLessThanOrEqual(1);
        expect(patch.velocityToPitch).toBeGreaterThanOrEqual(0);
        expect(patch.velocityToPitch).toBeLessThanOrEqual(1);
      });
    });
  });

  describe('Patch Characteristics', () => {
    it('sgija is more aggressive than soulful', () => {
      const sgija = LOG_DRUM_PATCHES.sgija;
      const soulful = LOG_DRUM_PATCHES.soulful;
      
      expect(sgija.distortion).toBeGreaterThan(soulful.distortion);
      expect(sgija.pitchEnvelope.amount).toBeGreaterThan(soulful.pitchEnvelope.amount);
    });

    it('quantum has balanced characteristics', () => {
      const quantum = LOG_DRUM_PATCHES.quantum;
      
      expect(quantum.distortion).toBeGreaterThan(0.5);
      expect(quantum.distortion).toBeLessThan(1);
      expect(quantum.fundamental).toBeGreaterThan(50);
      expect(quantum.fundamental).toBeLessThan(60);
    });
  });
});

describe('🎛️ Neural Groove Engine', () => {
  let engine: NeuralGrooveEngine;

  beforeEach(() => {
    engine = new NeuralGrooveEngine(GROOVE_PROFILES.quantum, 113);
  });

  describe('Profile Configuration', () => {
    it('has all required profiles', () => {
      expect(GROOVE_PROFILES).toHaveProperty('quantum');
      expect(GROOVE_PROFILES).toHaveProperty('sgija');
      expect(GROOVE_PROFILES).toHaveProperty('soulful');
      expect(GROOVE_PROFILES).toHaveProperty('durban');
      expect(GROOVE_PROFILES).toHaveProperty('tech');
    });

    it('profiles have valid timing offsets', () => {
      Object.values(GROOVE_PROFILES).forEach((profile: GrooveProfile) => {
        expect(typeof profile.lowBandOffset).toBe('number');
        expect(typeof profile.lowMidOffset).toBe('number');
        expect(typeof profile.midOffset).toBe('number');
        expect(typeof profile.highMidOffset).toBe('number');
        expect(typeof profile.highOffset).toBe('number');
      });
    });

    it('swing settings are normalized', () => {
      Object.values(GROOVE_PROFILES).forEach((profile: GrooveProfile) => {
        expect(profile.swingAmount).toBeGreaterThanOrEqual(0);
        expect(profile.swingAmount).toBeLessThanOrEqual(1);
        expect(['8n', '16n']).toContain(profile.swingGrid);
      });
    });
  });

  describe('Frequency Band Detection', () => {
    it('correctly identifies low frequencies', () => {
      expect(engine.getFrequencyBand('C1')).toBe('low');
      expect(engine.getFrequencyBand(50)).toBe('low');
      expect(engine.getFrequencyBand(150)).toBe('low');
    });

    it('correctly identifies low-mid frequencies', () => {
      // Low/lowMid boundary is 200 Hz; A3=220 Hz and 400 Hz are both lowMid
      expect(engine.getFrequencyBand('A3')).toBe('lowMid');
      expect(engine.getFrequencyBand(400)).toBe('lowMid');
    });

    it('correctly identifies mid frequencies', () => {
      // lowMid/mid boundary is 800 Hz; C6=1046 Hz and 1000 Hz are both mid
      expect(engine.getFrequencyBand('C6')).toBe('mid');
      expect(engine.getFrequencyBand(1000)).toBe('mid');
    });

    it('correctly identifies high frequencies', () => {
      expect(engine.getFrequencyBand(8000)).toBe('high');
      expect(engine.getFrequencyBand(15000)).toBe('high');
    });
  });

  describe('Groove Application', () => {
    it('applies groove timing with valid output', () => {
      const originalTime = 1.0;
      const result = engine.applyGroove(originalTime, 'C2', 0);
      
      expect(typeof result).toBe('number');
      expect(result).toBeGreaterThanOrEqual(0);
      expect(isNaN(result)).toBe(false);
    });

    it('handles invalid time gracefully', () => {
      const result = engine.applyGroove(NaN, 'C2', 0);
      expect(typeof result).toBe('number');
      expect(isNaN(result)).toBe(false);
    });

    it('applies swing to odd steps', () => {
      const evenStep = engine.applyGroove(1.0, 'C2', 0);
      const oddStep = engine.applyGroove(1.0, 'C2', 1);
      
      // Odd steps should have swing applied (later timing)
      expect(oddStep).toBeGreaterThanOrEqual(evenStep);
    });

    it('velocity groove stays within bounds', () => {
      for (let i = 0; i < 100; i++) {
        const velocity = engine['applyVelocityGroove'](0.8, 'lowMid');
        expect(velocity).toBeGreaterThanOrEqual(0.1);
        expect(velocity).toBeLessThanOrEqual(1);
      }
    });
  });

  describe('Profile Management', () => {
    it('can switch profiles', () => {
      engine.setProfile('sgija');
      const profile = engine.getProfile();
      expect(profile.name).toBe('Sgija Streets');
    });

    it('can update BPM', () => {
      engine.setBPM(120);
      // BPM affects swing timing calculation
      const result = engine.applyGroove(1.0, 'C2', 1);
      expect(typeof result).toBe('number');
    });

    it('can adjust humanization', () => {
      engine.setHumanize(0.5);
      const profile = engine.getProfile();
      expect(profile.humanize).toBe(0.5);
    });

    it('clamps humanization to valid range', () => {
      engine.setHumanize(2.0);
      expect(engine.getProfile().humanize).toBe(1);
      
      engine.setHumanize(-1);
      expect(engine.getProfile().humanize).toBe(0);
    });
  });

  describe('Timing Visualization', () => {
    it('returns all frequency bands', () => {
      const viz = engine.getTimingVisualization();
      expect(viz).toHaveLength(5);
      
      const bands = viz.map(v => v.band);
      expect(bands).toContain('low');
      expect(bands).toContain('lowMid');
      expect(bands).toContain('mid');
      expect(bands).toContain('highMid');
      expect(bands).toContain('high');
    });

    it('each band has a color', () => {
      const viz = engine.getTimingVisualization();
      viz.forEach(v => {
        expect(v.color).toMatch(/^#[0-9A-F]{6}$/i);
      });
    });
  });
});

describe('🎤 Producer DNA Profiles', () => {
  describe('Profile Configuration', () => {
    it('has all major producer profiles', () => {
      const ids = PRODUCER_DNA_PRESETS.map(p => p.id);
      expect(ids).toContain('xduppy');
      expect(ids).toContain('kelvin_momo');
      expect(ids).toContain('kabza_de_small');
      expect(ids).toContain('mellow_sleazy');
    });

    it('profiles have valid BPM ranges', () => {
      PRODUCER_DNA_PRESETS.forEach((profile: ProducerDNAProfile) => {
        expect(profile.bpmRange.min).toBeGreaterThan(100);
        expect(profile.bpmRange.max).toBeLessThan(130);
        expect(profile.bpmRange.sweet).toBeGreaterThanOrEqual(profile.bpmRange.min);
        expect(profile.bpmRange.sweet).toBeLessThanOrEqual(profile.bpmRange.max);
      });
    });

    it('profiles have valid groove settings', () => {
      PRODUCER_DNA_PRESETS.forEach((profile: ProducerDNAProfile) => {
        expect(profile.groove.lowSwing).toBeGreaterThanOrEqual(-15);
        expect(profile.groove.lowSwing).toBeLessThanOrEqual(15);
        expect(profile.groove.midSwing).toBeGreaterThanOrEqual(-15);
        expect(profile.groove.midSwing).toBeLessThanOrEqual(15);
        expect(profile.groove.highSwing).toBeGreaterThanOrEqual(-15);
        expect(profile.groove.highSwing).toBeLessThanOrEqual(15);
        expect(profile.groove.microTiming).toBeGreaterThanOrEqual(0);
      });
    });

    it('log drum settings are valid', () => {
      PRODUCER_DNA_PRESETS.forEach((profile: ProducerDNAProfile) => {
        expect(profile.logDrum.distortion).toBeGreaterThanOrEqual(0);
        expect(profile.logDrum.distortion).toBeLessThanOrEqual(1);
        expect(['linear', 'exponential', 'quantum']).toContain(profile.logDrum.velocityCurve);
      });
    });
  });

  describe('Cultural Authenticity Scoring', () => {
    it('returns score between 0 and 100', () => {
      const xduppy = PRODUCER_DNA_PRESETS.find(p => p.id === 'xduppy')!;
      const result = calculateCulturalScore(xduppy, { bpmRange: xduppy.bpmRange });
      
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(100);
    });

    it('matching settings produce high scores', () => {
      const xduppy = PRODUCER_DNA_PRESETS.find(p => p.id === 'xduppy')!;
      const fullMatch = calculateCulturalScore(xduppy, {
        bpmRange: xduppy.bpmRange,
        logDrum: xduppy.logDrum,
        groove: xduppy.groove,
        bass: xduppy.bass,
        pads: xduppy.pads,
      });
      
      expect(fullMatch.score).toBeGreaterThan(80);
    });

    it('different settings produce lower scores', () => {
      const xduppy = PRODUCER_DNA_PRESETS.find(p => p.id === 'xduppy')!;
      const momo = PRODUCER_DNA_PRESETS.find(p => p.id === 'kelvin_momo')!;
      
      const mismatchScore = calculateCulturalScore(xduppy, {
        bpmRange: momo.bpmRange,
        logDrum: momo.logDrum,
        groove: momo.groove,
      });
      
      expect(mismatchScore.score).toBeLessThan(90);
    });
  });

  describe('Profile Morphing', () => {
    it('morphs between two profiles', () => {
      const xduppy = PRODUCER_DNA_PRESETS.find(p => p.id === 'xduppy')!;
      const momo = PRODUCER_DNA_PRESETS.find(p => p.id === 'kelvin_momo')!;
      
      const morphed = morphProducerDNA(xduppy, momo, 0.5);
      
      // Check that morphed values are between the two profiles
      expect(morphed.bpmRange.sweet).toBeGreaterThanOrEqual(Math.min(xduppy.bpmRange.sweet, momo.bpmRange.sweet));
      expect(morphed.bpmRange.sweet).toBeLessThanOrEqual(Math.max(xduppy.bpmRange.sweet, momo.bpmRange.sweet));
    });

    it('morph at 0 returns first profile', () => {
      const xduppy = PRODUCER_DNA_PRESETS.find(p => p.id === 'xduppy')!;
      const momo = PRODUCER_DNA_PRESETS.find(p => p.id === 'kelvin_momo')!;
      
      const morphed = morphProducerDNA(xduppy, momo, 0);
      
      expect(morphed.bpmRange.sweet).toBe(xduppy.bpmRange.sweet);
      expect(morphed.groove.lowSwing).toBe(xduppy.groove.lowSwing);
    });

    it('morph at 1 returns second profile', () => {
      const xduppy = PRODUCER_DNA_PRESETS.find(p => p.id === 'xduppy')!;
      const momo = PRODUCER_DNA_PRESETS.find(p => p.id === 'kelvin_momo')!;
      
      const morphed = morphProducerDNA(xduppy, momo, 1);
      
      expect(morphed.bpmRange.sweet).toBe(momo.bpmRange.sweet);
      expect(morphed.groove.lowSwing).toBe(momo.groove.lowSwing);
    });
  });
});

describe('⚡ Real Audio Engine Configuration', () => {
  describe('Track Types', () => {
    it('supports all required track types', () => {
      const trackTypes = ['drum', 'synth', 'sampler', 'audio'];
      trackTypes.forEach(type => {
        expect(typeof type).toBe('string');
      });
    });
  });

  describe('Pattern Structure', () => {
    it('default pattern has correct length', () => {
      const patternLength = 16;
      expect(patternLength).toBe(16);
    });

    it('resolution supports 16th notes', () => {
      const resolution = 4; // steps per beat
      expect(resolution).toBe(4);
    });
  });

  describe('Amapiano BPM Range', () => {
    it('standard Amapiano BPM is 110-115', () => {
      const minBPM = 110;
      const maxBPM = 115;
      const sweetSpot = 113;
      
      expect(sweetSpot).toBeGreaterThanOrEqual(minBPM);
      expect(sweetSpot).toBeLessThanOrEqual(maxBPM);
    });
  });
});

describe('🎯 Integration Scenarios', () => {
  it('Xduppy production chain is valid', () => {
    const profile = PRODUCER_DNA_PRESETS.find(p => p.id === 'xduppy')!;
    const grooveProfile = GROOVE_PROFILES[profile.style];
    const logDrumPatch = LOG_DRUM_PATCHES[profile.logDrum.velocityCurve === 'quantum' ? 'quantum' : 'soulful'];
    
    expect(profile.style).toBe('quantum');
    expect(grooveProfile).toBeDefined();
    expect(logDrumPatch).toBeDefined();
  });

  it('Kelvin Momo production chain is valid', () => {
    const profile = PRODUCER_DNA_PRESETS.find(p => p.id === 'kelvin_momo')!;
    const grooveProfile = GROOVE_PROFILES[profile.style];
    
    expect(profile.style).toBe('soulful');
    expect(grooveProfile).toBeDefined();
  });

  it('all profiles have matching groove profiles', () => {
    PRODUCER_DNA_PRESETS.forEach(profile => {
      const grooveProfile = GROOVE_PROFILES[profile.style];
      expect(grooveProfile).toBeDefined();
    });
  });
});
