/**
 * Amapianorization Engine - Full Integration
 * 
 * Integrates all DSP modules:
 * - Regional Swing Profiles (Gauteng 58.3% swing)
 * - Euclidean Rhythms
 * - Heritage Affinity Scoring
 * - Amapiano Gasp (Beat-1 Silence)
 * - Vocal Technique Generator
 */

import { amapianorizeAudio, AmapianorizeSettings, AmapianorizeResult } from './audioProcessor';
import { selectLogDrumSamples, LogDrumSample } from './logDrumLibrary';
import { selectPercussionSamples, PercussionSample } from './percussionLibrary';
import { 
  REGIONAL_SWING_PROFILES, 
  getProfile, 
  calculateSwingOffsetMs,
  type RegionalSwingProfile,
  type Beat1SilenceConfig
} from '../dsp/regionalSwingProfiles';
import {
  generateEuclideanRhythm,
  applyGautengSwing,
  AFRICAN_EUCLIDEAN_PATTERNS,
  GAUTENG_SWING_PRESETS,
  generatePolyrhythm,
  type EuclideanPattern,
  type GautengSwingConfig
} from '../dsp/euclideanRhythm';
import {
  calculateHeritageAffinity,
  getHeritageProfile,
  HERITAGE_PROFILES,
  type HeritageAffinityScore
} from './heritageAffinity';
import {
  GASP_PATTERNS,
  getGaspTimings
} from './amapianoGasp';
import {
  EXTENDED_VOCAL_INTERJECTIONS,
  BEAT_1_SILENCE_PRESETS,
  type VocalTechniqueConfig,
  type SouthAfricanLanguage
} from './vocalTechniqueGenerator';

// Local type for Beat1 silence events
interface Beat1SilenceEvent {
  bar: number;
  timeMs: number;
  type: string;
  duration: number;
}

export interface AmapianorizationOptions {
  // Core settings
  region: string;
  intensity: number; // 0-1
  
  // Musical elements
  elements: {
    logDrums: boolean;
    percussion: boolean;
    piano: boolean;
    bass: boolean;
    sidechain: boolean;
    filterSweeps: boolean;
  };
  
  // Advanced: Regional swing profile
  swingProfile?: string;
  customSwingPercentage?: number;
  
  // Advanced: Beat-1 Silence (Amapiano Gasp)
  beat1Silence?: {
    enabled: boolean;
    preset?: 'drop-impact' | 'verse-subtle' | 'bridge-dramatic' | 'breakdown-sparse' | 'build-tension';
    duration?: 1 | 2 | 3 | 4;
    probability?: number;
  };
  
  // Advanced: Euclidean rhythm patterns
  euclideanPatterns?: {
    logDrum?: string;
    percussion?: string;
    hihat?: string;
  };
  
  // Advanced: Vocal settings
  vocalSettings?: {
    language?: SouthAfricanLanguage;
    adlibDensity?: 'minimal' | 'sparse' | 'moderate' | 'frequent' | 'dense';
    callResponse?: boolean;
  };
}

export interface AmapianorizationResult {
  stems: {
    vocals?: string;
    drums?: string;
    bass?: string;
    piano?: string;
    other?: string;
  };
  authenticityScore: number;
  heritageAffinity?: HeritageAffinityScore;
  metadata: {
    region: string;
    elementsApplied: string[];
    processingTime: number;
    swingProfile?: string;
    swingPercentage?: number;
    beat1SilenceApplied?: boolean;
    euclideanPatterns?: string[];
    culturalMarkers?: string[];
  };
}

export interface ProcessingContext {
  bpm: number;
  key: string;
  timeSignature: string;
  bars: number;
}

export class AmapianorizationEngine {
  private currentSwingProfile: RegionalSwingProfile | null = null;
  private euclideanPatterns: Map<string, EuclideanPattern> = new Map();
  private beat1SilenceEvents: Beat1SilenceEvent[] = [];
  
  constructor() {
    console.log('[AMAPIANORIZATION] Engine initialized with full DSP integration');
  }

  /**
   * Get all available regional swing profiles
   */
  getAvailableSwingProfiles(): string[] {
    return Object.keys(REGIONAL_SWING_PROFILES);
  }

  /**
   * Get all available Euclidean patterns
   */
  getAvailableEuclideanPatterns(): string[] {
    return Object.keys(AFRICAN_EUCLIDEAN_PATTERNS);
  }

  /**
   * Get all available heritage profiles
   */
  getAvailableHeritageProfiles(): Array<{ key: string; name: string; province: string }> {
    return Object.entries(HERITAGE_PROFILES).map(([key, profile]) => ({
      key,
      name: profile.name,
      province: profile.province
    }));
  }

  /**
   * Get all available languages for vocals
   */
  getAvailableVocalLanguages(): SouthAfricanLanguage[] {
    return Object.keys(EXTENDED_VOCAL_INTERJECTIONS) as SouthAfricanLanguage[];
  }

  /**
   * Map simple region to detailed swing profile
   */
  private mapRegionToSwingProfile(region: string): string {
    const regionMap: Record<string, string> = {
      'johannesburg': 'johannesburg-deep',
      'pretoria': 'pretoria-bounce',
      'durban': 'durban-gqom',
      'cape-town': 'cape-town-jazzy',
      'soweto': 'soweto-authentic',
      'east-london': 'eastern-cape-xhosa',
      'bloemfontein': 'free-state-seso',
      'polokwane': 'limpopo-venda',
      'nelspruit': 'mpumalanga-swati'
    };
    return regionMap[region] || 'johannesburg-deep';
  }

  /**
   * Main amapianorization processing
   */
  async amapianorize(
    sourceAudioUrl: string,
    options: AmapianorizationOptions,
    context?: ProcessingContext
  ): Promise<AmapianorizationResult> {
    const startTime = Date.now();
    const elementsApplied: string[] = [];
    const euclideanPatternsApplied: string[] = [];
    
    try {
      console.log('[AMAPIANORIZATION] Starting enhanced processing:', options);

      // 1. Resolve swing profile
      const swingProfileKey = options.swingProfile || this.mapRegionToSwingProfile(options.region);
      this.currentSwingProfile = getProfile(swingProfileKey);
      
      if (this.currentSwingProfile) {
        console.log('[AMAPIANORIZATION] Using swing profile:', {
          name: this.currentSwingProfile.name,
          swingPercentage: this.currentSwingProfile.swingPercentage,
          beat1Silence: this.currentSwingProfile.beat1Silence
        });
      }

      // 2. Generate Euclidean patterns if enabled
      if (options.euclideanPatterns) {
        const bpm = context?.bpm || 115;
        
        if (options.euclideanPatterns.logDrum) {
          const patternDef = AFRICAN_EUCLIDEAN_PATTERNS[options.euclideanPatterns.logDrum];
          if (patternDef) {
            const pattern = generateEuclideanRhythm(patternDef.pulses, patternDef.steps, patternDef.rotation);
            this.euclideanPatterns.set('logDrum', {
              pattern,
              pulses: patternDef.pulses,
              steps: patternDef.steps,
              rotation: patternDef.rotation,
              name: options.euclideanPatterns.logDrum
            });
            euclideanPatternsApplied.push(`logDrum:${options.euclideanPatterns.logDrum}`);
          }
        }
        
        if (options.euclideanPatterns.percussion) {
          const patternDef = AFRICAN_EUCLIDEAN_PATTERNS[options.euclideanPatterns.percussion];
          if (patternDef) {
            const pattern = generateEuclideanRhythm(patternDef.pulses, patternDef.steps, patternDef.rotation);
            this.euclideanPatterns.set('percussion', {
              pattern,
              pulses: patternDef.pulses,
              steps: patternDef.steps,
              rotation: patternDef.rotation,
              name: options.euclideanPatterns.percussion
            });
            euclideanPatternsApplied.push(`percussion:${options.euclideanPatterns.percussion}`);
          }
        }
        
        if (options.euclideanPatterns.hihat) {
          const patternDef = AFRICAN_EUCLIDEAN_PATTERNS[options.euclideanPatterns.hihat];
          if (patternDef) {
            const pattern = generateEuclideanRhythm(patternDef.pulses, patternDef.steps, patternDef.rotation);
            this.euclideanPatterns.set('hihat', {
              pattern,
              pulses: patternDef.pulses,
              steps: patternDef.steps,
              rotation: patternDef.rotation,
              name: options.euclideanPatterns.hihat
            });
            euclideanPatternsApplied.push(`hihat:${options.euclideanPatterns.hihat}`);
          }
        }
      }

      // 3. Generate Beat-1 Silence events (Amapiano Gasp)
      let beat1SilenceApplied = false;
      if (options.beat1Silence?.enabled || this.currentSwingProfile?.beat1Silence?.enabled) {
        const bpm = context?.bpm || 115;
        const bars = context?.bars || 8;
        
        // Generate timing events for beat-1 silence
        const gaspTimings = getGaspTimings(bpm, 'chorus', bars);
        this.beat1SilenceEvents = gaspTimings.map((t, i) => ({
          bar: t.bar,
          timeMs: (t.bar * 4 + t.beat) * (60000 / bpm),
          type: t.timing,
          duration: options.beat1Silence?.duration || 2
        }));
        
        beat1SilenceApplied = this.beat1SilenceEvents.length > 0;
        
        if (beat1SilenceApplied) {
          elementsApplied.push('beat1_silence');
          console.log('[AMAPIANORIZATION] Beat-1 silence events generated:', this.beat1SilenceEvents.length);
        }
      }

      // 4. Build settings for audio processor
      const settings: AmapianorizeSettings = {
        addLogDrum: options.elements.logDrums,
        logDrumIntensity: options.intensity,
        addPercussion: options.elements.percussion,
        percussionDensity: options.intensity,
        addPianoChords: options.elements.piano,
        pianoComplexity: options.intensity,
        addBassline: options.elements.bass,
        bassDepth: options.intensity,
        addVocalChops: options.vocalSettings?.adlibDensity !== 'minimal',
        vocalChopRate: options.vocalSettings?.adlibDensity === 'dense' ? 1 : 
                       options.vocalSettings?.adlibDensity === 'frequent' ? 0.75 :
                       options.vocalSettings?.adlibDensity === 'moderate' ? 0.5 :
                       options.vocalSettings?.adlibDensity === 'sparse' ? 0.25 : 0,
        sidechainCompression: options.elements.sidechain,
        sidechainAmount: options.intensity,
        filterSweeps: options.elements.filterSweeps,
        sweepFrequency: options.intensity,
        culturalAuthenticity: 'modern',
        regionalStyle: options.region as 'johannesburg' | 'pretoria' | 'durban' | 'cape-town'
      };

      // Track applied elements
      if (options.elements.logDrums) elementsApplied.push('log_drums');
      if (options.elements.percussion) elementsApplied.push('percussion');
      if (options.elements.piano) elementsApplied.push('piano');
      if (options.elements.bass) elementsApplied.push('bass');
      if (options.elements.sidechain) elementsApplied.push('sidechain');
      if (options.elements.filterSweeps) elementsApplied.push('filter_sweeps');
      if (this.currentSwingProfile) elementsApplied.push(`swing:${swingProfileKey}`);
      if (euclideanPatternsApplied.length > 0) elementsApplied.push('euclidean_rhythms');

      // 5. Process audio
      const result = await amapianorizeAudio(
        { vocals: sourceAudioUrl },
        settings
      );

      if (!result.success) {
        throw new Error(result.error || 'Amapianorization failed');
      }

      // 6. Calculate Heritage Affinity Score
      const heritageAffinity = calculateHeritageAffinity(
        {
          bpm: context?.bpm || 115,
          key: context?.key || 'Cm',
          energy: options.intensity,
          spectralCentroid: 2000,
          zeroCrossingRate: 0.1,
          danceability: 0.8
        },
        {
          hasLogDrum: options.elements.logDrums,
          hasShaker: options.elements.percussion,
          shakerDensity: options.elements.percussion ? options.intensity * 0.8 : 0,
          swingAmount: this.currentSwingProfile?.swingPercentage 
            ? this.currentSwingProfile.swingPercentage / 100 
            : 0.58,
          vocalLanguage: options.vocalSettings?.language
        }
      );

      const processingTime = Date.now() - startTime;
      
      console.log('[AMAPIANORIZATION] Complete:', {
        authenticityScore: result.authenticityScore,
        heritageAffinity: heritageAffinity.overall,
        elementsApplied,
        processingTime,
      });

      return {
        stems: {
          vocals: sourceAudioUrl,
          drums: result.processedAudio?.url || sourceAudioUrl,
          bass: result.processedAudio?.url || sourceAudioUrl,
          piano: result.processedAudio?.url || sourceAudioUrl,
          other: result.processedAudio?.url || sourceAudioUrl,
        },
        authenticityScore: result.authenticityScore,
        heritageAffinity,
        metadata: {
          region: result.regionalStyle,
          elementsApplied,
          processingTime,
          swingProfile: swingProfileKey,
          swingPercentage: this.currentSwingProfile?.swingPercentage,
          beat1SilenceApplied,
          euclideanPatterns: euclideanPatternsApplied,
          culturalMarkers: heritageAffinity.culturalMarkers
        },
      };

    } catch (error) {
      console.error('[AMAPIANORIZATION] Error:', error);
      throw new Error(
        `Amapianorization failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Get current swing profile details
   */
  getCurrentSwingProfile(): RegionalSwingProfile | null {
    return this.currentSwingProfile;
  }

  /**
   * Get generated Euclidean patterns
   */
  getEuclideanPatterns(): Map<string, EuclideanPattern> {
    return this.euclideanPatterns;
  }

  /**
   * Get Beat-1 silence events
   */
  getBeat1SilenceEvents(): Beat1SilenceEvent[] {
    return this.beat1SilenceEvents;
  }

  /**
   * Preview swing offset for a specific step
   */
  previewSwingOffset(step: number, bpm: number): number {
    if (!this.currentSwingProfile) return 0;
    return calculateSwingOffsetMs(bpm, this.currentSwingProfile.swingPercentage);
  }

  /**
   * Generate polyrhythmic layers for current settings
   */
  generatePolyrhythmicLayers(
    patterns: Array<{ name: string; instrument: string; velocity: number; pitch?: number }>,
    bpm: number
  ) {
    const swingPreset = this.currentSwingProfile?.name.toLowerCase().includes('johannesburg') 
      ? 'johannesburg' 
      : this.currentSwingProfile?.name.toLowerCase().includes('pretoria')
      ? 'pretoria'
      : this.currentSwingProfile?.name.toLowerCase().includes('soweto')
      ? 'soweto'
      : 'johannesburg';
      
    return generatePolyrhythm(patterns, bpm, swingPreset);
  }

  async dispose(): Promise<void> {
    this.currentSwingProfile = null;
    this.euclideanPatterns.clear();
    this.beat1SilenceEvents = [];
    console.log('[AMAPIANORIZATION] Engine disposed');
  }
}

// Export singleton instance
export const amapianorizationEngine = new AmapianorizationEngine();
