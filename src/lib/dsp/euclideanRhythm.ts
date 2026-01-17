/**
 * Euclidean Rhythm Generator
 * 
 * Implements Euclidean rhythm algorithms for authentic African polyrhythmic patterns.
 * Based on Bjorklund's algorithm, used in traditional African, Cuban, and Brazilian music.
 * 
 * PhD Research: Mathematical foundations for culturally-authentic rhythm generation.
 */

export interface EuclideanPattern {
  pattern: boolean[];
  pulses: number;
  steps: number;
  rotation: number;
  name?: string;
}

export interface PolyrhythmicLayer {
  pattern: EuclideanPattern;
  instrument: string;
  velocity: number;
  pitch?: number;
  swing?: number;
}

export interface GautengSwingConfig {
  amount: number;        // 0-1, how much swing to apply
  microTiming: number[]; // Per-step micro-timing offsets in ms
  feel: 'johannesburg' | 'pretoria' | 'soweto' | 'alexandra';
}

/**
 * Bjorklund's algorithm for distributing pulses evenly across steps
 */
export function generateEuclideanRhythm(pulses: number, steps: number, rotation: number = 0): boolean[] {
  if (pulses > steps) pulses = steps;
  if (pulses < 0) pulses = 0;
  
  let pattern: number[] = [];
  let counts: number[] = [];
  let remainders: number[] = [];
  
  let divisor = steps - pulses;
  remainders[0] = pulses;
  let level = 0;
  
  while (remainders[level] > 1) {
    counts[level] = Math.floor(divisor / remainders[level]);
    remainders[level + 1] = divisor % remainders[level];
    divisor = remainders[level];
    level++;
  }
  
  counts[level] = divisor;
  
  function build(level: number): void {
    if (level === -1) {
      pattern.push(0);
    } else if (level === -2) {
      pattern.push(1);
    } else {
      for (let i = 0; i < counts[level]; i++) {
        build(level - 1);
      }
      if (remainders[level] !== 0) {
        build(level - 2);
      }
    }
  }
  
  build(level);
  
  // Convert to boolean and apply rotation
  const boolPattern = pattern.map(p => p === 1);
  const rotatedPattern = [...boolPattern.slice(-rotation % steps), ...boolPattern.slice(0, -rotation % steps || steps)];
  
  return rotatedPattern;
}

/**
 * Named Euclidean patterns common in African and Amapiano music
 */
export const AFRICAN_EUCLIDEAN_PATTERNS: Record<string, { pulses: number; steps: number; rotation: number; description: string }> = {
  // Traditional African patterns
  'bembé': { pulses: 7, steps: 12, rotation: 0, description: 'West African 12/8 bell pattern' },
  'shiko': { pulses: 4, steps: 12, rotation: 0, description: 'Nigerian Yoruba pattern' },
  'son-clave': { pulses: 5, steps: 16, rotation: 0, description: 'Afro-Cuban clave' },
  'rumba-clave': { pulses: 5, steps: 16, rotation: 3, description: 'Rumba variation' },
  'gahu': { pulses: 4, steps: 12, rotation: 0, description: 'Ghanaian bell pattern' },
  'soukous': { pulses: 5, steps: 8, rotation: 0, description: 'Congolese dance rhythm' },
  
  // South African / Amapiano specific
  'log-drum-basic': { pulses: 4, steps: 16, rotation: 0, description: 'Basic amapiano log drum' },
  'log-drum-syncopated': { pulses: 5, steps: 16, rotation: 2, description: 'Syncopated log drum' },
  'shaker-dense': { pulses: 12, steps: 16, rotation: 0, description: 'Dense shaker pattern' },
  'hihat-offbeat': { pulses: 4, steps: 8, rotation: 1, description: 'Offbeat hi-hat' },
  'kwaito-kick': { pulses: 3, steps: 8, rotation: 0, description: 'Kwaito-influenced kick' },
  'gqom-pulse': { pulses: 6, steps: 16, rotation: 0, description: 'Gqom drum pattern' },
  
  // Zulu traditional influences
  'isigubu': { pulses: 7, steps: 16, rotation: 0, description: 'Zulu drum pattern' },
  'indlamu': { pulses: 5, steps: 12, rotation: 0, description: 'Zulu warrior dance' },
  
  // Xhosa influences
  'umngqokolo': { pulses: 6, steps: 12, rotation: 0, description: 'Xhosa split-tone rhythm' },
};

/**
 * Gauteng Swing - the characteristic micro-timing feel of Johannesburg/Pretoria amapiano
 */
export const GAUTENG_SWING_PRESETS: Record<string, GautengSwingConfig> = {
  johannesburg: {
    amount: 0.58,
    microTiming: [0, 2, -3, 5, 0, 3, -2, 4, 0, 2, -4, 6, 0, 3, -2, 5],
    feel: 'johannesburg'
  },
  pretoria: {
    amount: 0.56,
    microTiming: [0, 3, -2, 4, 0, 2, -3, 5, 0, 4, -2, 4, 0, 2, -3, 6],
    feel: 'pretoria'
  },
  soweto: {
    amount: 0.60,
    microTiming: [0, 4, -2, 6, 0, 3, -4, 5, 0, 5, -2, 7, 0, 3, -3, 6],
    feel: 'soweto'
  },
  alexandra: {
    amount: 0.55,
    microTiming: [0, 2, -4, 5, 0, 4, -2, 3, 0, 3, -3, 5, 0, 4, -2, 4],
    feel: 'alexandra'
  }
};

/**
 * Apply Gauteng Swing micro-timing to a pattern
 */
export function applyGautengSwing(
  pattern: boolean[],
  bpm: number,
  swingConfig: GautengSwingConfig
): Array<{ step: number; offsetMs: number; hit: boolean }> {
  const msPerStep = (60000 / bpm) / 4; // 16th note duration
  const baseSwingMs = msPerStep * (swingConfig.amount - 0.5) * 2;
  
  return pattern.map((hit, index) => {
    const isOffbeat = index % 2 === 1;
    const microOffset = swingConfig.microTiming[index % swingConfig.microTiming.length];
    
    let offsetMs = microOffset;
    if (isOffbeat) {
      offsetMs += baseSwingMs;
    }
    
    return {
      step: index,
      offsetMs,
      hit
    };
  });
}

/**
 * Generate polyrhythmic layers for authentic African feel
 */
export function generatePolyrhythm(
  patterns: Array<{ name: string; instrument: string; velocity: number; pitch?: number }>,
  bpm: number,
  swingPreset: keyof typeof GAUTENG_SWING_PRESETS = 'johannesburg'
): PolyrhythmicLayer[] {
  const swingConfig = GAUTENG_SWING_PRESETS[swingPreset];
  
  return patterns.map(({ name, instrument, velocity, pitch }) => {
    const patternDef = AFRICAN_EUCLIDEAN_PATTERNS[name];
    if (!patternDef) {
      throw new Error(`Unknown pattern: ${name}`);
    }
    
    const pattern = generateEuclideanRhythm(patternDef.pulses, patternDef.steps, patternDef.rotation);
    
    return {
      pattern: {
        pattern,
        pulses: patternDef.pulses,
        steps: patternDef.steps,
        rotation: patternDef.rotation,
        name
      },
      instrument,
      velocity,
      pitch,
      swing: swingConfig.amount
    };
  });
}

/**
 * Calculate the density (ratio of hits to total steps)
 */
export function calculatePatternDensity(pattern: boolean[]): number {
  const hits = pattern.filter(Boolean).length;
  return hits / pattern.length;
}

/**
 * Calculate rhythmic complexity using Shannon entropy
 */
export function calculateRhythmicComplexity(pattern: boolean[]): number {
  const n = pattern.length;
  const hits = pattern.filter(Boolean).length;
  const p = hits / n;
  
  if (p === 0 || p === 1) return 0;
  
  // Shannon entropy
  const entropy = -p * Math.log2(p) - (1 - p) * Math.log2(1 - p);
  
  // Also consider syncopation
  let syncopation = 0;
  for (let i = 0; i < n; i++) {
    const isStrongBeat = i % 4 === 0;
    if (pattern[i] && !isStrongBeat) syncopation++;
    if (!pattern[i] && isStrongBeat) syncopation++;
  }
  
  return (entropy + syncopation / n) / 2;
}

/**
 * Generate complementary patterns that interlock well
 */
export function generateInterlockingPatterns(
  basePattern: boolean[],
  numPatterns: number = 3
): boolean[][] {
  const patterns: boolean[][] = [basePattern];
  const steps = basePattern.length;
  
  for (let i = 1; i < numPatterns; i++) {
    // Create complementary pattern
    const complementary: boolean[] = [];
    for (let s = 0; s < steps; s++) {
      // Fill gaps in previous patterns
      const anyHit = patterns.some(p => p[s]);
      complementary.push(!anyHit && Math.random() > 0.6);
    }
    patterns.push(complementary);
  }
  
  return patterns;
}

/**
 * Convert Euclidean pattern to MIDI events
 */
export function patternToMidiEvents(
  pattern: boolean[],
  bpm: number,
  pitch: number = 36,
  velocity: number = 100,
  swingConfig?: GautengSwingConfig
): Array<{ time: number; pitch: number; velocity: number; duration: number }> {
  const events: Array<{ time: number; pitch: number; velocity: number; duration: number }> = [];
  const msPerStep = (60000 / bpm) / 4;
  const durationMs = msPerStep * 0.8;
  
  const swungPattern = swingConfig
    ? applyGautengSwing(pattern, bpm, swingConfig)
    : pattern.map((hit, step) => ({ step, hit, offsetMs: 0 }));
  
  for (const { step, hit, offsetMs } of swungPattern) {
    if (hit) {
      const timeMs = step * msPerStep + offsetMs;
      events.push({
        time: timeMs / 1000, // Convert to seconds
        pitch,
        velocity: velocity + Math.floor((Math.random() - 0.5) * 20),
        duration: durationMs / 1000
      });
    }
  }
  
  return events;
}
