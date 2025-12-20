/**
 * Harmony Agent
 * 
 * Specialized agent for chord progressions, piano voicings, and harmonic content.
 * Handles jazz-influenced Private School harmonies and gospel chord extensions.
 */

import { BaseAgent, ExecutionContext, ExecutionResult, EvaluationResult, ImprovementPlan } from './BaseAgent';

// ============================================================================
// CHORD TYPES & VOICINGS
// ============================================================================

interface ChordVoicing {
  root: string;
  type: string;
  notes: number[];       // MIDI notes
  voicingName: string;   // e.g., "drop-2", "rootless", "shell"
}

interface ChordProgression {
  name: string;
  chords: ChordVoicing[];
  duration: number[];    // Duration in beats
  style: 'private-school' | 'classic' | '3-step' | 'bacardi';
}

// Common jazz/gospel extensions for Private School Amapiano
const CHORD_TYPES: Record<string, number[]> = {
  'maj7': [0, 4, 7, 11],
  'min7': [0, 3, 7, 10],
  'dom7': [0, 4, 7, 10],
  'min9': [0, 3, 7, 10, 14],
  'maj9': [0, 4, 7, 11, 14],
  'dom9': [0, 4, 7, 10, 14],
  '7#9': [0, 4, 7, 10, 15],     // Neo-soul flavor
  '7b9': [0, 4, 7, 10, 13],
  'min11': [0, 3, 7, 10, 14, 17],
  'maj13': [0, 4, 7, 11, 14, 21],
  'm7b5': [0, 3, 6, 10],        // Half-diminished
  'dim7': [0, 3, 6, 9],
  '6/9': [0, 4, 7, 9, 14],      // Very common in Amapiano
  'sus4': [0, 5, 7],
  'add9': [0, 4, 7, 14],
};

// ============================================================================
// AMAPIANO CHORD PROGRESSIONS
// ============================================================================

const PROGRESSION_TEMPLATES: Record<string, {
  numerals: string[];
  chordTypes: string[];
  bars: number[];
}> = {
  // Classic Amapiano progressions
  'amapiano-classic-1': {
    numerals: ['i', 'VI', 'III', 'VII'],
    chordTypes: ['min7', 'maj7', 'maj7', 'dom7'],
    bars: [2, 2, 2, 2]
  },
  'amapiano-classic-2': {
    numerals: ['i', 'iv', 'VI', 'V'],
    chordTypes: ['min9', 'min7', 'maj7', 'dom9'],
    bars: [2, 2, 2, 2]
  },
  
  // Private School progressions (jazz-influenced)
  'private-school-1': {
    numerals: ['i', 'ii7b5', 'V7#9', 'i'],
    chordTypes: ['min9', 'm7b5', '7#9', 'min11'],
    bars: [2, 2, 2, 2]
  },
  'private-school-2': {
    numerals: ['IVmaj7', 'iii', 'vi', 'ii', 'V'],
    chordTypes: ['maj9', 'min7', 'min9', 'min7', 'dom9'],
    bars: [2, 1, 1, 2, 2]
  },
  'private-school-kelvin-momo': {
    numerals: ['i', 'VI', 'iv', 'v', 'III', 'VII'],
    chordTypes: ['min9', '6/9', 'min7', 'min7', 'maj7', 'dom7'],
    bars: [2, 1, 1, 2, 1, 1]
  },
  
  // 3-Step progressions (more driving, less complex)
  '3-step-1': {
    numerals: ['i', 'VII', 'VI', 'VII'],
    chordTypes: ['min7', 'dom7', 'maj7', 'dom7'],
    bars: [2, 2, 2, 2]
  },
  
  // Bacardi (simpler, more aggressive)
  'bacardi-1': {
    numerals: ['i', 'VI', 'III'],
    chordTypes: ['min7', 'maj7', 'maj7'],
    bars: [4, 2, 2]
  }
};

// ============================================================================
// VOICING ALGORITHMS
// ============================================================================

const NOTE_TO_MIDI: Record<string, number> = {
  'C': 60, 'C#': 61, 'Db': 61, 'D': 62, 'D#': 63, 'Eb': 63,
  'E': 64, 'F': 65, 'F#': 66, 'Gb': 66, 'G': 67, 'G#': 68,
  'Ab': 68, 'A': 69, 'A#': 70, 'Bb': 70, 'B': 71
};

function parseKey(keyString: string): { root: string; mode: 'major' | 'minor' } {
  const match = keyString.match(/^([A-G][#b]?)(m|min|minor)?$/i);
  if (!match) return { root: 'A', mode: 'minor' };
  return {
    root: match[1],
    mode: match[2] ? 'minor' : 'major'
  };
}

// ============================================================================
// HARMONY AGENT IMPLEMENTATION
// ============================================================================

export class HarmonyAgent extends BaseAgent {
  private currentProgression: ChordProgression | null = null;
  
  constructor() {
    super('harmony', {
      maxActionsPerExecution: 15,
      timeoutMs: 25000,
      learningRate: 0.01
    });
  }

  async execute(context: ExecutionContext): Promise<ExecutionResult> {
    const startTime = Date.now();
    this.setStatus('generating');
    this.setCurrentTask('Generating harmonic content');
    
    try {
      const { genre, key, bpm } = context.request;
      const parsedKey = parseKey(key as string || 'Am');
      
      // Step 1: Select progression template
      this.setProgress(20);
      const template = this.selectProgressionTemplate(genre as string);
      this.recordAction('select_progression', { template: template.name });
      
      // Step 2: Generate chord voicings
      this.setProgress(40);
      const chords = this.generateVoicings(
        template,
        parsedKey.root,
        parsedKey.mode
      );
      this.recordAction('generate_voicings', { chordCount: chords.length });
      
      // Step 3: Apply voice leading
      this.setProgress(60);
      const smoothedChords = this.applyVoiceLeading(chords);
      this.recordAction('voice_leading', { improved: true });
      
      // Step 4: Generate MIDI
      this.setProgress(80);
      const midiData = this.generateChordMIDI(
        smoothedChords,
        template.bars,
        bpm as number || 115
      );
      this.recordAction('generate_midi', { bars: template.bars.reduce((a, b) => a + b, 0) });
      
      // Step 5: Generate piano patterns
      const pianoPattern = this.generatePianoPattern(
        smoothedChords,
        genre as string
      );
      
      this.setProgress(100);
      this.setStatus('complete');
      
      this.currentProgression = {
        name: template.name,
        chords: smoothedChords,
        duration: template.bars,
        style: this.getStyleFromGenre(genre as string)
      };
      
      return {
        success: true,
        output: {
          progression: this.currentProgression,
          midiData,
          pianoPattern,
          key: `${parsedKey.root}${parsedKey.mode === 'minor' ? 'm' : ''}`
        },
        actions: this.actionHistory.slice(-5),
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
      progression: ChordProgression;
      midiData: unknown;
    };
    
    const components: Record<string, number> = {};
    const issues: string[] = [];
    const suggestions: string[] = [];
    
    // Evaluate harmonic complexity
    const complexity = this.evaluateHarmonicComplexity(result.progression);
    components['harmonic_complexity'] = complexity;
    if (complexity < 0.4) {
      issues.push('Chord progression is too simple');
      suggestions.push('Add more jazz extensions (9ths, 11ths)');
    }
    
    // Evaluate voice leading
    const voiceLeading = this.evaluateVoiceLeading(result.progression);
    components['voice_leading'] = voiceLeading;
    if (voiceLeading < 0.5) {
      issues.push('Choppy voice leading');
      suggestions.push('Smooth out chord transitions');
    }
    
    // Evaluate genre fit
    const genreFit = this.evaluateGenreFit(result.progression);
    components['genre_authenticity'] = genreFit;
    if (genreFit < 0.6) {
      issues.push('Harmony doesn\'t fit Amapiano style');
      suggestions.push('Use more characteristic progressions (i-VI-III-VII)');
    }
    
    const score = (complexity * 0.3 + voiceLeading * 0.3 + genreFit * 0.4) * 100;
    
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
    
    if (feedback.components['harmonic_complexity'] < 0.4) {
      actions.push({
        type: 'add_extensions',
        parameters: { targetExtensions: ['9', '11', '13'] },
        expectedImprovement: 12
      });
    }
    
    if (feedback.components['voice_leading'] < 0.5) {
      actions.push({
        type: 'smooth_transitions',
        parameters: { maxInterval: 4 },
        expectedImprovement: 10
      });
    }
    
    if (feedback.components['genre_authenticity'] < 0.6) {
      actions.push({
        type: 'use_characteristic_progression',
        parameters: { template: 'private-school-kelvin-momo' },
        expectedImprovement: 15
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

  private selectProgressionTemplate(genre: string): typeof PROGRESSION_TEMPLATES[string] & { name: string } {
    const genreLower = genre.toLowerCase();
    
    let templateName: string;
    
    if (genreLower.includes('private') || genreLower.includes('school')) {
      // Randomly select from private school progressions
      const psTemplates = ['private-school-1', 'private-school-2', 'private-school-kelvin-momo'];
      templateName = psTemplates[Math.floor(Math.random() * psTemplates.length)];
    } else if (genreLower.includes('3-step') || genreLower.includes('3step')) {
      templateName = '3-step-1';
    } else if (genreLower.includes('bacardi')) {
      templateName = 'bacardi-1';
    } else {
      const classicTemplates = ['amapiano-classic-1', 'amapiano-classic-2'];
      templateName = classicTemplates[Math.floor(Math.random() * classicTemplates.length)];
    }
    
    return {
      ...PROGRESSION_TEMPLATES[templateName],
      name: templateName
    };
  }

  private generateVoicings(
    template: typeof PROGRESSION_TEMPLATES[string],
    rootNote: string,
    mode: 'major' | 'minor'
  ): ChordVoicing[] {
    const rootMidi = NOTE_TO_MIDI[rootNote] || 60;
    
    // Scale intervals for minor (Aeolian) mode
    const minorScale = [0, 2, 3, 5, 7, 8, 10];
    // Scale intervals for major (Ionian) mode
    const majorScale = [0, 2, 4, 5, 7, 9, 11];
    
    const scale = mode === 'minor' ? minorScale : majorScale;
    
    // Roman numeral to scale degree
    const numeralToDegree: Record<string, number> = {
      'i': 0, 'I': 0,
      'ii': 1, 'II': 1, 'ii7b5': 1,
      'iii': 2, 'III': 2,
      'iv': 3, 'IV': 3, 'IVmaj7': 3,
      'v': 4, 'V': 4, 'V7#9': 4,
      'vi': 5, 'VI': 5,
      'vii': 6, 'VII': 6
    };
    
    return template.numerals.map((numeral, i) => {
      const degree = numeralToDegree[numeral] ?? 0;
      const chordRoot = rootMidi + scale[degree];
      const chordType = template.chordTypes[i];
      const intervals = CHORD_TYPES[chordType] || CHORD_TYPES['min7'];
      
      // Generate voicing (add octave displacement for richness)
      const voicing = intervals.map((interval, j) => {
        let note = chordRoot + interval;
        // Spread voicing across registers
        if (j > 2) note += 12;
        return note;
      });
      
      return {
        root: this.midiToNoteName(chordRoot),
        type: chordType,
        notes: voicing,
        voicingName: intervals.length > 4 ? 'spread' : 'close'
      };
    });
  }

  private midiToNoteName(midi: number): string {
    const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    return noteNames[midi % 12];
  }

  private applyVoiceLeading(chords: ChordVoicing[]): ChordVoicing[] {
    if (chords.length <= 1) return chords;
    
    const result: ChordVoicing[] = [chords[0]];
    
    for (let i = 1; i < chords.length; i++) {
      const prevChord = result[i - 1];
      const currentChord = { ...chords[i] };
      
      // Find optimal inversion to minimize movement
      const optimized = this.findClosestVoicing(prevChord.notes, currentChord.notes);
      currentChord.notes = optimized;
      
      result.push(currentChord);
    }
    
    return result;
  }

  private findClosestVoicing(prev: number[], current: number[]): number[] {
    // Calculate centroid of previous chord
    const prevCentroid = prev.reduce((a, b) => a + b, 0) / prev.length;
    
    // Try different inversions
    let bestVoicing = current;
    let bestDistance = Infinity;
    
    for (let inv = 0; inv < current.length; inv++) {
      const inverted = current.map((note, i) => 
        i < inv ? note + 12 : note
      );
      
      const centroid = inverted.reduce((a, b) => a + b, 0) / inverted.length;
      const distance = Math.abs(centroid - prevCentroid);
      
      if (distance < bestDistance) {
        bestDistance = distance;
        bestVoicing = inverted;
      }
    }
    
    return bestVoicing.sort((a, b) => a - b);
  }

  private generateChordMIDI(
    chords: ChordVoicing[],
    durations: number[],
    bpm: number
  ): unknown {
    const msPerBeat = 60000 / bpm;
    const events: Array<{
      notes: number[];
      time: number;
      duration: number;
      velocity: number;
    }> = [];
    
    let currentTime = 0;
    
    chords.forEach((chord, i) => {
      const durationBeats = durations[i] || 2;
      const durationMs = durationBeats * msPerBeat;
      
      events.push({
        notes: chord.notes,
        time: currentTime,
        duration: durationMs * 0.95, // Slight gap between chords
        velocity: 85 + Math.floor(Math.random() * 15)
      });
      
      currentTime += durationMs;
    });
    
    return {
      format: 1,
      bpm,
      type: 'chord-progression',
      events
    };
  }

  private generatePianoPattern(
    chords: ChordVoicing[],
    genre: string
  ): unknown {
    const genreLower = genre.toLowerCase();
    
    // Different piano patterns for different styles
    let patternType: 'arpeggio' | 'stab' | 'rolling' | 'rhodes-pad';
    
    if (genreLower.includes('private') || genreLower.includes('school')) {
      patternType = 'rhodes-pad';
    } else if (genreLower.includes('3-step')) {
      patternType = 'stab';
    } else if (genreLower.includes('bacardi')) {
      patternType = 'stab';
    } else {
      patternType = 'rolling';
    }
    
    return {
      type: patternType,
      chords: chords.map(c => ({
        root: c.root,
        notes: c.notes,
        articulation: patternType === 'stab' ? 0.3 : 0.8
      }))
    };
  }

  private getStyleFromGenre(genre: string): ChordProgression['style'] {
    const genreLower = genre.toLowerCase();
    if (genreLower.includes('private') || genreLower.includes('school')) return 'private-school';
    if (genreLower.includes('3-step')) return '3-step';
    if (genreLower.includes('bacardi')) return 'bacardi';
    return 'classic';
  }

  private evaluateHarmonicComplexity(progression: ChordProgression): number {
    let score = 0;
    
    for (const chord of progression.chords) {
      // More notes = more complex
      score += Math.min(chord.notes.length / 6, 0.5);
      
      // Extensions are valuable
      if (chord.type.includes('9') || chord.type.includes('11') || chord.type.includes('13')) {
        score += 0.1;
      }
    }
    
    return Math.min(score / progression.chords.length, 1);
  }

  private evaluateVoiceLeading(progression: ChordProgression): number {
    if (progression.chords.length < 2) return 1;
    
    let totalMovement = 0;
    let transitions = 0;
    
    for (let i = 1; i < progression.chords.length; i++) {
      const prev = progression.chords[i - 1].notes;
      const curr = progression.chords[i].notes;
      
      // Calculate average movement between chords
      const movement = this.calculateChordMovement(prev, curr);
      totalMovement += movement;
      transitions++;
    }
    
    const avgMovement = totalMovement / transitions;
    
    // Good voice leading has small movements (under 4 semitones avg)
    return Math.max(0, 1 - avgMovement / 8);
  }

  private calculateChordMovement(prev: number[], curr: number[]): number {
    const minLength = Math.min(prev.length, curr.length);
    let totalMovement = 0;
    
    for (let i = 0; i < minLength; i++) {
      totalMovement += Math.abs(prev[i] - curr[i]);
    }
    
    return totalMovement / minLength;
  }

  private evaluateGenreFit(progression: ChordProgression): number {
    let score = 0.5;
    
    // Check for characteristic Amapiano progressions
    const hasMinorTonic = progression.chords[0]?.type.includes('min');
    if (hasMinorTonic) score += 0.2;
    
    // Check for jazz extensions in private school
    if (progression.style === 'private-school') {
      const hasExtensions = progression.chords.some(c => 
        c.type.includes('9') || c.type.includes('11')
      );
      if (hasExtensions) score += 0.2;
    }
    
    // Check chord count (Amapiano usually 3-6 chords per loop)
    if (progression.chords.length >= 3 && progression.chords.length <= 6) {
      score += 0.1;
    }
    
    return Math.min(score, 1);
  }
}
