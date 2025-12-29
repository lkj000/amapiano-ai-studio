/**
 * Generative Kits Engine
 * ACE Studio-inspired genre-conditioned generation for Amapiano
 * 
 * Implements:
 * - Amapiano Kits: Full track generation from prompts
 * - Add a Layer: Add log drums, percussion, keys overlays
 * - Amapianorize: Transform any track into Amapiano style
 * - Inspire Me: AI-powered creative suggestions
 */

import { supabase } from '@/integrations/supabase/client';
import { GenreStyle, SubgenreStyle, GENRE_SPECS } from '../agents/SamplePackProcessor';

// ============= Kit Types =============

export type KitType = 
  | 'full_track'      // Complete track from scratch
  | 'log_drum_layer'  // Add log drum pattern
  | 'perc_layer'      // Add percussion elements
  | 'keys_layer'      // Add piano/keys
  | 'bass_layer'      // Add bassline
  | 'vocal_chop'      // Add vocal chops
  | 'amapianorize'    // Transform to Amapiano
  | 'inspire_me';     // Get creative suggestions

export interface KitConfig {
  type: KitType;
  genre: GenreStyle;
  substyle?: SubgenreStyle;
  bpm: number;
  key: string;
  duration: number; // seconds
  energy: number;   // 0-1
  density: number;  // 0-1
}

export interface KitResult {
  id: string;
  type: KitType;
  audioUrl: string;
  midiData?: MidiTrackData[];
  stems?: StemData[];
  metadata: KitMetadata;
  generationTime: number;
}

export interface MidiTrackData {
  name: string;
  notes: MidiNote[];
  channel: number;
}

export interface MidiNote {
  pitch: number;
  velocity: number;
  startTime: number; // beats
  duration: number;  // beats
}

export interface StemData {
  name: string;
  audioUrl: string;
  type: 'drums' | 'bass' | 'keys' | 'percussion' | 'vocals' | 'fx';
}

export interface KitMetadata {
  genre: GenreStyle;
  substyle?: SubgenreStyle;
  bpm: number;
  key: string;
  bars: number;
  authenticityScore: number;
  elements: string[];
}

// ============= Pattern Templates =============

interface PatternTemplate {
  name: string;
  style: GenreStyle;
  pattern: number[][]; // [step][instruments]
  swing: number;
  instruments: string[];
}

const AMAPIANO_PATTERNS: PatternTemplate[] = [
  {
    name: 'Classic Amapiano',
    style: 'amapiano',
    swing: 0.08,
    instruments: ['kick', 'log_drum', 'hi_hat', 'shaker'],
    pattern: [
      // 16 steps x 4 instruments (kick, log, hat, shaker)
      [1, 0, 1, 0], // 1
      [0, 0, 1, 1], // 2
      [0, 1, 1, 0], // 3
      [0, 0, 1, 1], // 4
      [0, 0, 1, 0], // 5
      [0, 1, 1, 1], // 6
      [1, 0, 1, 0], // 7
      [0, 0, 1, 1], // 8
      [0, 0, 1, 0], // 9
      [0, 1, 1, 1], // 10
      [1, 0, 1, 0], // 11
      [0, 0, 1, 1], // 12
      [0, 0, 1, 0], // 13
      [0, 1, 1, 1], // 14
      [0, 0, 1, 0], // 15
      [0, 0, 1, 1], // 16
    ]
  },
  {
    name: 'Private School',
    style: 'private_school',
    swing: 0.12,
    instruments: ['kick', 'log_drum', 'hi_hat', 'shaker'],
    pattern: [
      [0, 0, 0, 0],
      [0, 1, 1, 1],
      [0, 0, 0, 0],
      [0, 0, 1, 1],
      [1, 0, 0, 0],
      [0, 1, 1, 1],
      [0, 0, 0, 0],
      [0, 0, 1, 1],
      [0, 0, 0, 0],
      [0, 1, 1, 1],
      [1, 0, 0, 0],
      [0, 0, 1, 1],
      [0, 0, 0, 0],
      [0, 1, 1, 1],
      [0, 0, 0, 0],
      [0, 0, 1, 1],
    ]
  },
  {
    name: '3-Step',
    style: 'three_step',
    swing: 0.15,
    instruments: ['kick', 'log_drum', 'hi_hat', 'shaker'],
    pattern: [
      [1, 0, 1, 0],
      [0, 0, 0, 1],
      [0, 1, 1, 0],
      [0, 0, 0, 1],
      [1, 0, 1, 0],
      [0, 0, 0, 1],
      [0, 1, 1, 0],
      [0, 0, 0, 1],
      [1, 0, 1, 0],
      [0, 0, 0, 1],
      [0, 1, 1, 0],
      [0, 0, 0, 1],
      [0, 0, 1, 0],
      [0, 0, 0, 1],
      [0, 0, 1, 0],
      [0, 0, 0, 1],
    ]
  }
];

// Chord progressions by genre
const CHORD_PROGRESSIONS: Record<GenreStyle, number[][]> = {
  amapiano: [
    [0, 4, 7, 11],   // maj7
    [5, 9, 12, 16],  // maj7
    [7, 11, 14, 17], // maj7
    [0, 4, 7, 10],   // dom7
  ],
  private_school: [
    [0, 4, 7, 11, 14],   // maj9
    [5, 9, 12, 16, 19],  // maj9
    [7, 10, 14, 17],     // min7
    [2, 5, 9, 12],       // min7
  ],
  three_step: [
    [0, 4, 7],      // major
    [5, 8, 12],     // minor
    [7, 11, 14],    // major
    [3, 7, 10],     // minor
  ],
  gqom: [
    [0, 3, 7],      // minor
    [5, 8, 12],     // minor
    [3, 7, 10],     // minor
    [0, 3, 7],      // minor
  ],
  bacardi: [
    [0, 4, 7],
    [5, 9, 12],
    [7, 11, 14],
    [0, 4, 7],
  ]
};

// ============= Generative Kits Engine =============

export class GenerativeKitsEngine {
  private static instance: GenerativeKitsEngine;

  static getInstance(): GenerativeKitsEngine {
    if (!this.instance) {
      this.instance = new GenerativeKitsEngine();
    }
    return this.instance;
  }

  /**
   * Generate a full track from a kit configuration
   */
  async generateKit(config: KitConfig): Promise<KitResult> {
    const startTime = Date.now();
    
    console.log(`[GenerativeKits] Generating ${config.type} for ${config.genre}`);

    switch (config.type) {
      case 'full_track':
        return this.generateFullTrack(config, startTime);
      case 'log_drum_layer':
        return this.generateLogDrumLayer(config, startTime);
      case 'perc_layer':
        return this.generatePercLayer(config, startTime);
      case 'keys_layer':
        return this.generateKeysLayer(config, startTime);
      case 'bass_layer':
        return this.generateBassLayer(config, startTime);
      case 'vocal_chop':
        return this.generateVocalChops(config, startTime);
      case 'amapianorize':
        return this.amapianorize(config, startTime);
      case 'inspire_me':
        return this.inspireMe(config, startTime);
      default:
        throw new Error(`Unknown kit type: ${config.type}`);
    }
  }

  /**
   * Generate a complete Amapiano track
   */
  private async generateFullTrack(config: KitConfig, startTime: number): Promise<KitResult> {
    const genreSpec = GENRE_SPECS[config.genre] || GENRE_SPECS.amapiano;
    const bars = Math.floor(config.duration / (240 / config.bpm));

    // Generate MIDI for all instruments
    const midiTracks: MidiTrackData[] = [];

    // Drums
    const drumPattern = this.getPatternForGenre(config.genre);
    midiTracks.push(this.generateDrumMidi(drumPattern, bars, config));

    // Log drums
    midiTracks.push(this.generateLogDrumMidi(config, bars));

    // Keys/Chords
    midiTracks.push(this.generateChordMidi(config, bars));

    // Bass
    midiTracks.push(this.generateBassMidi(config, bars));

    // Call AI to generate audio
    const { data, error } = await supabase.functions.invoke('generate-instrumental', {
      body: {
        prompt: `${config.genre.replace('_', ' ')} instrumental, ${config.bpm} BPM, ${config.key}, ${config.energy > 0.7 ? 'energetic' : 'chill'} mood`,
        duration: config.duration,
        genre: config.genre,
        bpm: config.bpm,
        key: config.key
      }
    });

    if (error) {
      console.error('[GenerativeKits] Generation error:', error);
      throw error;
    }

    return {
      id: `kit_${Date.now()}`,
      type: 'full_track',
      audioUrl: data.audioUrl || data.instrumentalUrl,
      midiData: midiTracks,
      metadata: {
        genre: config.genre,
        substyle: config.substyle,
        bpm: config.bpm,
        key: config.key,
        bars,
        authenticityScore: this.calculateAuthenticityScore(config),
        elements: ['kick', 'log_drum', 'hi_hat', 'shaker', 'keys', 'bass']
      },
      generationTime: Date.now() - startTime
    };
  }

  /**
   * Generate log drum layer
   */
  private async generateLogDrumLayer(config: KitConfig, startTime: number): Promise<KitResult> {
    const bars = Math.floor(config.duration / (240 / config.bpm));
    const midiData = this.generateLogDrumMidi(config, bars);

    // Generate audio for log drums
    const { data, error } = await supabase.functions.invoke('generate-sample', {
      body: {
        type: 'log_drum',
        genre: config.genre,
        bpm: config.bpm,
        bars,
        key: config.key
      }
    });

    return {
      id: `logdrum_${Date.now()}`,
      type: 'log_drum_layer',
      audioUrl: data?.sampleUrl || '',
      midiData: [midiData],
      metadata: {
        genre: config.genre,
        bpm: config.bpm,
        key: config.key,
        bars,
        authenticityScore: 0.9,
        elements: ['log_drum']
      },
      generationTime: Date.now() - startTime
    };
  }

  /**
   * Generate percussion layer
   */
  private async generatePercLayer(config: KitConfig, startTime: number): Promise<KitResult> {
    const bars = Math.floor(config.duration / (240 / config.bpm));
    
    const percMidi: MidiTrackData = {
      name: 'Percussion',
      channel: 10,
      notes: []
    };

    // Generate shaker, tambourine, and misc percussion
    for (let bar = 0; bar < bars; bar++) {
      for (let step = 0; step < 16; step++) {
        // Shaker on off-beats
        if (step % 2 === 1) {
          percMidi.notes.push({
            pitch: 70, // Shaker
            velocity: 60 + Math.random() * 40,
            startTime: bar * 4 + step * 0.25,
            duration: 0.1
          });
        }
        // Clave pattern
        if ([0, 3, 6, 10, 12].includes(step) && bar % 2 === 0) {
          percMidi.notes.push({
            pitch: 75, // Clave
            velocity: 70 + Math.random() * 30,
            startTime: bar * 4 + step * 0.25,
            duration: 0.1
          });
        }
      }
    }

    return {
      id: `perc_${Date.now()}`,
      type: 'perc_layer',
      audioUrl: '',
      midiData: [percMidi],
      metadata: {
        genre: config.genre,
        bpm: config.bpm,
        key: config.key,
        bars,
        authenticityScore: 0.85,
        elements: ['shaker', 'clave', 'tambourine']
      },
      generationTime: Date.now() - startTime
    };
  }

  /**
   * Generate keys/piano layer
   */
  private async generateKeysLayer(config: KitConfig, startTime: number): Promise<KitResult> {
    const bars = Math.floor(config.duration / (240 / config.bpm));
    const chordMidi = this.generateChordMidi(config, bars);

    return {
      id: `keys_${Date.now()}`,
      type: 'keys_layer',
      audioUrl: '',
      midiData: [chordMidi],
      metadata: {
        genre: config.genre,
        bpm: config.bpm,
        key: config.key,
        bars,
        authenticityScore: 0.88,
        elements: ['piano', 'rhodes']
      },
      generationTime: Date.now() - startTime
    };
  }

  /**
   * Generate bass layer
   */
  private async generateBassLayer(config: KitConfig, startTime: number): Promise<KitResult> {
    const bars = Math.floor(config.duration / (240 / config.bpm));
    const bassMidi = this.generateBassMidi(config, bars);

    return {
      id: `bass_${Date.now()}`,
      type: 'bass_layer',
      audioUrl: '',
      midiData: [bassMidi],
      metadata: {
        genre: config.genre,
        bpm: config.bpm,
        key: config.key,
        bars,
        authenticityScore: 0.9,
        elements: ['bass']
      },
      generationTime: Date.now() - startTime
    };
  }

  /**
   * Generate vocal chops
   */
  private async generateVocalChops(config: KitConfig, startTime: number): Promise<KitResult> {
    const bars = Math.floor(config.duration / (240 / config.bpm));

    // Call AI for vocal chop generation
    const { data, error } = await supabase.functions.invoke('sound-effect-generator', {
      body: {
        prompt: `amapiano vocal chop, ${config.key}, rhythmic, short`,
        duration: 2
      }
    });

    return {
      id: `vocalchop_${Date.now()}`,
      type: 'vocal_chop',
      audioUrl: data?.audioUrl || '',
      metadata: {
        genre: config.genre,
        bpm: config.bpm,
        key: config.key,
        bars,
        authenticityScore: 0.8,
        elements: ['vocal_chop']
      },
      generationTime: Date.now() - startTime
    };
  }

  /**
   * Transform any track into Amapiano style
   */
  private async amapianorize(config: KitConfig, startTime: number): Promise<KitResult> {
    // Call the amapianorize edge function
    const { data, error } = await supabase.functions.invoke('amapianorize-audio', {
      body: {
        genre: config.genre,
        substyle: config.substyle,
        intensity: config.energy,
        addLogDrums: true,
        addPercussion: true,
        addPiano: true,
        addBass: true,
        addSidechain: true,
        addFilterSweeps: config.density > 0.5
      }
    });

    return {
      id: `amapianorize_${Date.now()}`,
      type: 'amapianorize',
      audioUrl: data?.processedAudioUrl || '',
      metadata: {
        genre: config.genre,
        substyle: config.substyle,
        bpm: config.bpm,
        key: config.key,
        bars: Math.floor(config.duration / (240 / config.bpm)),
        authenticityScore: data?.authenticityScore || 0.85,
        elements: data?.elementsApplied || ['log_drum', 'percussion', 'sidechain']
      },
      generationTime: Date.now() - startTime
    };
  }

  /**
   * Get creative suggestions
   */
  private async inspireMe(config: KitConfig, startTime: number): Promise<KitResult> {
    // Use AI to generate suggestions
    const { data, error } = await supabase.functions.invoke('ai-chat', {
      body: {
        messages: [
          {
            role: 'system',
            content: `You are an Amapiano music production expert. Suggest creative ideas for ${config.genre} tracks.`
          },
          {
            role: 'user',
            content: `Give me 5 creative production suggestions for a ${config.genre} track at ${config.bpm} BPM in ${config.key}. Format as JSON array with fields: idea, technique, elements, difficulty.`
          }
        ]
      }
    });

    let suggestions = [];
    try {
      const content = data?.choices?.[0]?.message?.content || '[]';
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        suggestions = JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
      console.error('[GenerativeKits] Failed to parse suggestions:', e);
    }

    return {
      id: `inspire_${Date.now()}`,
      type: 'inspire_me',
      audioUrl: '',
      metadata: {
        genre: config.genre,
        bpm: config.bpm,
        key: config.key,
        bars: 0,
        authenticityScore: 1,
        elements: suggestions.map((s: any) => s.idea)
      },
      generationTime: Date.now() - startTime
    };
  }

  // ============= MIDI Generation Helpers =============

  private getPatternForGenre(genre: GenreStyle): PatternTemplate {
    return AMAPIANO_PATTERNS.find(p => p.style === genre) || AMAPIANO_PATTERNS[0];
  }

  private generateDrumMidi(pattern: PatternTemplate, bars: number, config: KitConfig): MidiTrackData {
    const notes: MidiNote[] = [];
    const drumMap = { kick: 36, snare: 38, hi_hat: 42, shaker: 70 };

    for (let bar = 0; bar < bars; bar++) {
      for (let step = 0; step < 16; step++) {
        const stepPattern = pattern.pattern[step];
        pattern.instruments.forEach((inst, i) => {
          if (stepPattern[i]) {
            const swing = step % 2 === 1 ? pattern.swing : 0;
            notes.push({
              pitch: drumMap[inst as keyof typeof drumMap] || 36,
              velocity: 80 + Math.random() * 47,
              startTime: bar * 4 + (step + swing) * 0.25,
              duration: 0.1
            });
          }
        });
      }
    }

    return { name: 'Drums', channel: 10, notes };
  }

  private generateLogDrumMidi(config: KitConfig, bars: number): MidiTrackData {
    const notes: MidiNote[] = [];
    const keyRoot = this.keyToMidiNote(config.key);
    const pentatonic = [0, 2, 3, 5, 7];

    for (let bar = 0; bar < bars; bar++) {
      // Syncopated log drum pattern
      const positions = config.genre === 'three_step' 
        ? [2, 6, 10, 14]
        : [2, 5, 10, 13];
      
      positions.forEach(step => {
        const noteOffset = pentatonic[Math.floor(Math.random() * pentatonic.length)];
        notes.push({
          pitch: keyRoot + noteOffset - 24, // Sub bass octave
          velocity: 90 + Math.random() * 37,
          startTime: bar * 4 + step * 0.25,
          duration: 0.5 + Math.random() * 0.25
        });
      });
    }

    return { name: 'Log Drum', channel: 1, notes };
  }

  private generateChordMidi(config: KitConfig, bars: number): MidiTrackData {
    const notes: MidiNote[] = [];
    const keyRoot = this.keyToMidiNote(config.key);
    const progression = CHORD_PROGRESSIONS[config.genre] || CHORD_PROGRESSIONS.amapiano;

    for (let bar = 0; bar < bars; bar++) {
      const chordIndex = bar % progression.length;
      const chord = progression[chordIndex];
      
      // Stab on beat 1 and 3
      [0, 2].forEach(beat => {
        chord.forEach(note => {
          notes.push({
            pitch: keyRoot + note + 48, // Middle octave
            velocity: 70 + Math.random() * 30,
            startTime: bar * 4 + beat,
            duration: config.genre === 'private_school' ? 1.5 : 0.5
          });
        });
      });
    }

    return { name: 'Keys', channel: 2, notes };
  }

  private generateBassMidi(config: KitConfig, bars: number): MidiTrackData {
    const notes: MidiNote[] = [];
    const keyRoot = this.keyToMidiNote(config.key);
    const progression = CHORD_PROGRESSIONS[config.genre] || CHORD_PROGRESSIONS.amapiano;

    for (let bar = 0; bar < bars; bar++) {
      const chordIndex = bar % progression.length;
      const rootNote = progression[chordIndex][0];
      
      // Bass follows root
      [0, 2].forEach(beat => {
        notes.push({
          pitch: keyRoot + rootNote + 24, // Bass octave
          velocity: 100 + Math.random() * 27,
          startTime: bar * 4 + beat,
          duration: 0.75
        });
      });
    }

    return { name: 'Bass', channel: 3, notes };
  }

  private keyToMidiNote(key: string): number {
    const noteMap: Record<string, number> = {
      'C': 0, 'C#': 1, 'Db': 1, 'D': 2, 'D#': 3, 'Eb': 3,
      'E': 4, 'F': 5, 'F#': 6, 'Gb': 6, 'G': 7, 'G#': 8,
      'Ab': 8, 'A': 9, 'A#': 10, 'Bb': 10, 'B': 11
    };
    
    const match = key.match(/([A-G][#b]?)/);
    return match ? (noteMap[match[1]] ?? 0) : 0;
  }

  private calculateAuthenticityScore(config: KitConfig): number {
    const genreSpec = GENRE_SPECS[config.genre];
    if (!genreSpec) return 0.7;

    let score = 0.8;

    // BPM within genre range
    const [minBpm, maxBpm] = genreSpec.tempoRange;
    if (config.bpm >= minBpm && config.bpm <= maxBpm) {
      score += 0.1;
    }

    // Energy matches genre expectation
    if (config.genre === 'private_school' && config.energy < 0.6) {
      score += 0.05;
    } else if (config.genre === 'three_step' && config.energy > 0.7) {
      score += 0.05;
    }

    return Math.min(score, 1);
  }

  /**
   * Get available kit types
   */
  getAvailableKits(): { type: KitType; name: string; description: string }[] {
    return [
      { type: 'full_track', name: 'Full Track', description: 'Generate a complete Amapiano track' },
      { type: 'log_drum_layer', name: 'Log Drum Layer', description: 'Add authentic log drum patterns' },
      { type: 'perc_layer', name: 'Percussion', description: 'Add shakers, tambourines, and percussion' },
      { type: 'keys_layer', name: 'Keys/Piano', description: 'Add soulful piano and Rhodes' },
      { type: 'bass_layer', name: 'Bassline', description: 'Add deep bass patterns' },
      { type: 'vocal_chop', name: 'Vocal Chops', description: 'Add rhythmic vocal elements' },
      { type: 'amapianorize', name: 'Amapianorize', description: 'Transform any track to Amapiano' },
      { type: 'inspire_me', name: 'Inspire Me', description: 'Get creative production suggestions' }
    ];
  }
}

// Export singleton
export const generativeKits = GenerativeKitsEngine.getInstance();
