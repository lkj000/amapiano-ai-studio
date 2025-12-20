/**
 * Groove Agent
 * 
 * Specialized agent for rhythm, drums, and log drum generation.
 * Handles micro-timing, swing, and the signature Amapiano groove.
 */

import { BaseAgent, ExecutionContext, ExecutionResult, EvaluationResult, ImprovementPlan } from './BaseAgent';
import type { AudioFeatures } from '../types';

interface DrumPattern {
  name: string;
  kick: PatternStep[];
  snare: PatternStep[];
  hihat: PatternStep[];
  shaker: PatternStep[];
  logDrum: PatternStep[];
  microTiming: MicroTimingProfile;
}

interface PatternStep {
  position: number; // 0-15 for 16th notes
  velocity: number; // 0-127
  timing: number;   // Micro-timing offset in ms
}

interface MicroTimingProfile {
  globalSwing: number;      // 0-1
  shakerLag: number;        // ms
  hihatAnticipation: number; // ms
  logDrumPush: number;      // ms
}

// ============================================================================
// GENRE-SPECIFIC PATTERNS
// ============================================================================

const AMAPIANO_PATTERNS: Record<string, DrumPattern> = {
  'classic-jozi': {
    name: 'Classic Johannesburg',
    kick: [
      { position: 0, velocity: 100, timing: 0 },
      { position: 4, velocity: 95, timing: 0 },
      { position: 8, velocity: 100, timing: 0 },
      { position: 12, velocity: 95, timing: 0 }
    ],
    snare: [
      { position: 4, velocity: 90, timing: 5 },
      { position: 12, velocity: 85, timing: 5 }
    ],
    hihat: [
      { position: 0, velocity: 70, timing: -3 },
      { position: 2, velocity: 60, timing: -3 },
      { position: 4, velocity: 70, timing: -3 },
      { position: 6, velocity: 55, timing: -3 },
      { position: 8, velocity: 70, timing: -3 },
      { position: 10, velocity: 60, timing: -3 },
      { position: 12, velocity: 70, timing: -3 },
      { position: 14, velocity: 55, timing: -3 }
    ],
    shaker: [
      { position: 2, velocity: 50, timing: 8 },
      { position: 6, velocity: 45, timing: 10 },
      { position: 10, velocity: 50, timing: 8 },
      { position: 14, velocity: 45, timing: 10 }
    ],
    logDrum: [
      { position: 0, velocity: 110, timing: -5 },
      { position: 6, velocity: 95, timing: 0 },
      { position: 10, velocity: 100, timing: -5 }
    ],
    microTiming: {
      globalSwing: 0.55,
      shakerLag: 10,
      hihatAnticipation: -3,
      logDrumPush: -5
    }
  },
  'private-school': {
    name: 'Private School Soulful',
    kick: [
      { position: 0, velocity: 90, timing: 0 },
      { position: 8, velocity: 85, timing: 0 }
    ],
    snare: [
      { position: 4, velocity: 75, timing: 10 },
      { position: 12, velocity: 70, timing: 12 }
    ],
    hihat: [
      { position: 0, velocity: 55, timing: 0 },
      { position: 4, velocity: 50, timing: 0 },
      { position: 8, velocity: 55, timing: 0 },
      { position: 12, velocity: 50, timing: 0 }
    ],
    shaker: [
      { position: 1, velocity: 40, timing: 15 },
      { position: 3, velocity: 35, timing: 18 },
      { position: 5, velocity: 40, timing: 15 },
      { position: 7, velocity: 35, timing: 18 },
      { position: 9, velocity: 40, timing: 15 },
      { position: 11, velocity: 35, timing: 18 },
      { position: 13, velocity: 40, timing: 15 },
      { position: 15, velocity: 35, timing: 18 }
    ],
    logDrum: [
      { position: 0, velocity: 95, timing: 0 },
      { position: 8, velocity: 85, timing: 5 }
    ],
    microTiming: {
      globalSwing: 0.52,
      shakerLag: 15,
      hihatAnticipation: 0,
      logDrumPush: 0
    }
  },
  '3-step': {
    name: '3-Step Afro-House Fusion',
    kick: [
      { position: 0, velocity: 105, timing: 0 },
      { position: 4, velocity: 100, timing: 0 },
      { position: 10, velocity: 105, timing: 0 }
    ],
    snare: [
      { position: 6, velocity: 95, timing: 0 },
      { position: 14, velocity: 90, timing: 0 }
    ],
    hihat: [
      { position: 0, velocity: 75, timing: 0 },
      { position: 2, velocity: 65, timing: 0 },
      { position: 4, velocity: 75, timing: 0 },
      { position: 6, velocity: 65, timing: 0 },
      { position: 8, velocity: 75, timing: 0 },
      { position: 10, velocity: 65, timing: 0 },
      { position: 12, velocity: 75, timing: 0 },
      { position: 14, velocity: 65, timing: 0 }
    ],
    shaker: [],
    logDrum: [
      { position: 0, velocity: 100, timing: 0 },
      { position: 4, velocity: 85, timing: 0 },
      { position: 10, velocity: 95, timing: 0 }
    ],
    microTiming: {
      globalSwing: 0.50, // Tighter, less swing
      shakerLag: 5,
      hihatAnticipation: 0,
      logDrumPush: 0
    }
  },
  'durban-hard': {
    name: 'Durban Hard/Bacardi',
    kick: [
      { position: 0, velocity: 115, timing: 0 },
      { position: 4, velocity: 110, timing: 0 },
      { position: 8, velocity: 115, timing: 0 },
      { position: 12, velocity: 110, timing: 0 }
    ],
    snare: [
      { position: 4, velocity: 100, timing: 0 },
      { position: 12, velocity: 95, timing: 0 }
    ],
    hihat: [
      { position: 0, velocity: 80, timing: 0 },
      { position: 1, velocity: 65, timing: 0 },
      { position: 2, velocity: 75, timing: 0 },
      { position: 3, velocity: 60, timing: 0 },
      { position: 4, velocity: 80, timing: 0 },
      { position: 5, velocity: 65, timing: 0 },
      { position: 6, velocity: 75, timing: 0 },
      { position: 7, velocity: 60, timing: 0 },
      { position: 8, velocity: 80, timing: 0 },
      { position: 9, velocity: 65, timing: 0 },
      { position: 10, velocity: 75, timing: 0 },
      { position: 11, velocity: 60, timing: 0 },
      { position: 12, velocity: 80, timing: 0 },
      { position: 13, velocity: 65, timing: 0 },
      { position: 14, velocity: 75, timing: 0 },
      { position: 15, velocity: 60, timing: 0 }
    ],
    shaker: [],
    logDrum: [
      { position: 0, velocity: 120, timing: -8 },
      { position: 4, velocity: 110, timing: -5 },
      { position: 8, velocity: 120, timing: -8 },
      { position: 12, velocity: 105, timing: 0 }
    ],
    microTiming: {
      globalSwing: 0.50,
      shakerLag: 0,
      hihatAnticipation: 0,
      logDrumPush: -8 // Aggressive push
    }
  }
};

// ============================================================================
// LOG DRUM PARAMETERS
// ============================================================================

interface LogDrumConfig {
  frequency: number;      // Hz (typically 40-80)
  decay: number;          // seconds (0.1-0.8)
  distortion: number;     // 0-1
  saturation: number;     // 0-1
  pitchEnvelope: number;  // semitones
  attack: number;         // ms
  character: 'mellow' | 'hard' | 'distorted' | 'clean';
}

const LOG_DRUM_PRESETS: Record<string, LogDrumConfig> = {
  'johannesburg-deep': {
    frequency: 55,
    decay: 0.5,
    distortion: 0.1,
    saturation: 0.3,
    pitchEnvelope: 12,
    attack: 5,
    character: 'mellow'
  },
  'private-school-soft': {
    frequency: 60,
    decay: 0.4,
    distortion: 0.05,
    saturation: 0.2,
    pitchEnvelope: 8,
    attack: 8,
    character: 'clean'
  },
  'durban-punch': {
    frequency: 50,
    decay: 0.3,
    distortion: 0.4,
    saturation: 0.6,
    pitchEnvelope: 15,
    attack: 2,
    character: 'hard'
  },
  'bacardi-distorted': {
    frequency: 48,
    decay: 0.35,
    distortion: 0.7,
    saturation: 0.8,
    pitchEnvelope: 18,
    attack: 1,
    character: 'distorted'
  }
};

// ============================================================================
// GROOVE AGENT IMPLEMENTATION
// ============================================================================

export class GrooveAgent extends BaseAgent {
  private currentPattern: DrumPattern | null = null;
  private currentLogDrumConfig: LogDrumConfig | null = null;
  
  constructor() {
    super('groove', {
      maxActionsPerExecution: 20,
      timeoutMs: 30000,
      learningRate: 0.01,
      explorationRate: 0.1
    });
  }

  async execute(context: ExecutionContext): Promise<ExecutionResult> {
    const startTime = Date.now();
    this.setStatus('generating');
    this.setCurrentTask('Generating groove pattern');
    
    try {
      const { genre, region, bpm } = context.request;
      
      // Step 1: Select base pattern
      this.setProgress(20);
      const pattern = this.selectPattern(genre as string, region);
      this.recordAction('select_pattern', { genre, region, pattern: pattern.name });
      
      // Step 2: Configure log drum
      this.setProgress(40);
      const logDrumConfig = this.selectLogDrumConfig(genre as string, region);
      this.recordAction('configure_log_drum', { config: logDrumConfig.character });
      
      // Step 3: Apply micro-timing variations
      this.setProgress(60);
      const humanizedPattern = this.humanizePattern(pattern, bpm as number || 115);
      this.recordAction('humanize', { swing: pattern.microTiming.globalSwing });
      
      // Step 4: Generate MIDI data
      this.setProgress(80);
      const midiData = this.generateMIDI(humanizedPattern, bpm as number || 115);
      this.recordAction('generate_midi', { bars: 8 });
      
      this.setProgress(100);
      this.setStatus('complete');
      
      this.currentPattern = humanizedPattern;
      this.currentLogDrumConfig = logDrumConfig;
      
      return {
        success: true,
        output: {
          pattern: humanizedPattern,
          logDrumConfig,
          midiData,
          bpm: bpm || 115
        },
        actions: this.actionHistory.slice(-4),
        duration: Date.now() - startTime
      };
      
    } catch (error) {
      this.setStatus('error');
      return {
        success: false,
        output: null,
        actions: this.actionHistory,
        duration: Date.now() - startTime,
        notes: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async evaluate(output: unknown): Promise<EvaluationResult> {
    const result = output as {
      pattern: DrumPattern;
      logDrumConfig: LogDrumConfig;
      midiData: unknown;
    };
    
    const components: Record<string, number> = {};
    const issues: string[] = [];
    const suggestions: string[] = [];
    
    // Evaluate pattern complexity
    const complexity = this.evaluatePatternComplexity(result.pattern);
    components['pattern_complexity'] = complexity;
    if (complexity < 0.3) {
      issues.push('Pattern is too simple');
      suggestions.push('Add more rhythmic variation');
    }
    
    // Evaluate micro-timing
    const grooveScore = this.evaluateGroove(result.pattern);
    components['groove_feel'] = grooveScore;
    if (grooveScore < 0.5) {
      issues.push('Groove feels mechanical');
      suggestions.push('Increase micro-timing variation');
    }
    
    // Evaluate log drum
    const logDrumScore = this.evaluateLogDrum(result.logDrumConfig);
    components['log_drum_quality'] = logDrumScore;
    if (logDrumScore < 0.6) {
      issues.push('Log drum lacks character');
      suggestions.push('Adjust decay and saturation');
    }
    
    // Overall score
    const score = (complexity * 0.3 + grooveScore * 0.4 + logDrumScore * 0.3) * 100;
    
    return {
      score,
      passed: score >= 70,
      components,
      issues,
      suggestions
    };
  }

  async improve(feedback: EvaluationResult): Promise<ImprovementPlan> {
    const actions: ImprovementPlan['actions'] = [];
    
    if (feedback.components['groove_feel'] < 0.5 && this.currentPattern) {
      actions.push({
        type: 'increase_swing',
        parameters: {
          swingAmount: this.currentPattern.microTiming.globalSwing + 0.05
        },
        expectedImprovement: 10
      });
    }
    
    if (feedback.components['log_drum_quality'] < 0.6 && this.currentLogDrumConfig) {
      actions.push({
        type: 'adjust_log_drum',
        parameters: {
          saturation: Math.min(this.currentLogDrumConfig.saturation + 0.1, 1),
          decay: Math.min(this.currentLogDrumConfig.decay + 0.05, 0.8)
        },
        expectedImprovement: 8
      });
    }
    
    if (feedback.components['pattern_complexity'] < 0.3) {
      actions.push({
        type: 'add_ghost_notes',
        parameters: { amount: 3 },
        expectedImprovement: 5
      });
    }
    
    return {
      actions,
      estimatedNewScore: feedback.score + actions.reduce((sum, a) => sum + a.expectedImprovement, 0)
    };
  }

  // ============================================================================
  // PRIVATE METHODS
  // ============================================================================

  private selectPattern(genre: string, region?: string): DrumPattern {
    const genreLower = genre.toLowerCase();
    
    if (genreLower.includes('private') || genreLower.includes('school')) {
      return AMAPIANO_PATTERNS['private-school'];
    }
    if (genreLower.includes('3-step') || genreLower.includes('3step')) {
      return AMAPIANO_PATTERNS['3-step'];
    }
    if (genreLower.includes('bacardi') || region === 'durban') {
      return AMAPIANO_PATTERNS['durban-hard'];
    }
    
    return AMAPIANO_PATTERNS['classic-jozi'];
  }

  private selectLogDrumConfig(genre: string, region?: string): LogDrumConfig {
    const genreLower = genre.toLowerCase();
    
    if (genreLower.includes('private') || genreLower.includes('school')) {
      return LOG_DRUM_PRESETS['private-school-soft'];
    }
    if (genreLower.includes('bacardi') || region === 'durban') {
      return LOG_DRUM_PRESETS['bacardi-distorted'];
    }
    if (region === 'durban') {
      return LOG_DRUM_PRESETS['durban-punch'];
    }
    
    return LOG_DRUM_PRESETS['johannesburg-deep'];
  }

  private humanizePattern(pattern: DrumPattern, bpm: number): DrumPattern {
    const humanized = JSON.parse(JSON.stringify(pattern)) as DrumPattern;
    
    // Add subtle random timing variations
    const randomize = (steps: PatternStep[], variance: number) => {
      return steps.map(step => ({
        ...step,
        velocity: Math.max(0, Math.min(127, step.velocity + (Math.random() - 0.5) * 10)),
        timing: step.timing + (Math.random() - 0.5) * variance
      }));
    };
    
    humanized.kick = randomize(humanized.kick, 2);
    humanized.snare = randomize(humanized.snare, 3);
    humanized.hihat = randomize(humanized.hihat, 4);
    humanized.shaker = randomize(humanized.shaker, 5);
    humanized.logDrum = randomize(humanized.logDrum, 2);
    
    return humanized;
  }

  private generateMIDI(pattern: DrumPattern, bpm: number): unknown {
    // Generate MIDI representation
    const msPerBeat = 60000 / bpm;
    const msPerStep = msPerBeat / 4; // 16th notes
    
    const midiEvents: Array<{
      note: number;
      time: number;
      velocity: number;
      duration: number;
    }> = [];
    
    // Standard MIDI drum notes
    const drumNotes = {
      kick: 36,
      snare: 38,
      hihat: 42,
      shaker: 70,
      logDrum: 41 // Floor tom as proxy
    };
    
    const processSteps = (steps: PatternStep[], note: number, bars = 8) => {
      for (let bar = 0; bar < bars; bar++) {
        for (const step of steps) {
          midiEvents.push({
            note,
            time: (bar * 16 + step.position) * msPerStep + step.timing,
            velocity: step.velocity,
            duration: msPerStep * 0.9
          });
        }
      }
    };
    
    processSteps(pattern.kick, drumNotes.kick);
    processSteps(pattern.snare, drumNotes.snare);
    processSteps(pattern.hihat, drumNotes.hihat);
    processSteps(pattern.shaker, drumNotes.shaker);
    processSteps(pattern.logDrum, drumNotes.logDrum);
    
    return {
      format: 1,
      bpm,
      timeSignature: { numerator: 4, denominator: 4 },
      events: midiEvents.sort((a, b) => a.time - b.time)
    };
  }

  private evaluatePatternComplexity(pattern: DrumPattern): number {
    const totalSteps = 
      pattern.kick.length +
      pattern.snare.length +
      pattern.hihat.length +
      pattern.shaker.length +
      pattern.logDrum.length;
    
    // Good patterns have 15-30 steps per bar
    return Math.min(totalSteps / 20, 1);
  }

  private evaluateGroove(pattern: DrumPattern): number {
    let score = 0;
    
    // Swing is good
    if (pattern.microTiming.globalSwing >= 0.52 && pattern.microTiming.globalSwing <= 0.58) {
      score += 0.3;
    }
    
    // Shaker lag is characteristic
    if (pattern.microTiming.shakerLag >= 5 && pattern.microTiming.shakerLag <= 20) {
      score += 0.3;
    }
    
    // Velocity variation
    const velocities = pattern.hihat.map(s => s.velocity);
    const velocityVariance = this.calculateVariance(velocities);
    if (velocityVariance > 20) score += 0.4;
    
    return score;
  }

  private evaluateLogDrum(config: LogDrumConfig): number {
    let score = 0;
    
    // Appropriate frequency range
    if (config.frequency >= 40 && config.frequency <= 70) score += 0.3;
    
    // Good decay
    if (config.decay >= 0.2 && config.decay <= 0.6) score += 0.3;
    
    // Character match
    if (config.character === 'mellow' || config.character === 'hard') score += 0.4;
    
    return score;
  }

  private calculateVariance(values: number[]): number {
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    return values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
  }
}
