import { amapianorizeAudio, AmapianorizeSettings, AmapianorizeResult } from './audioProcessor';
import { selectLogDrumSamples, LogDrumSample } from './logDrumLibrary';
import { selectPercussionSamples, PercussionSample } from './percussionLibrary';

export interface AmapianorizationOptions {
  region: 'johannesburg' | 'pretoria' | 'durban' | 'cape-town';
  intensity: number; // 0-1
  elements: {
    logDrums: boolean;
    percussion: boolean;
    piano: boolean;
    bass: boolean;
    sidechain: boolean;
    filterSweeps: boolean;
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
  metadata: {
    region: string;
    elementsApplied: string[];
    processingTime: number;
  };
}

export class AmapianorizationEngine {
  constructor() {
    // No instance variables needed - using imported functions
  }

  async amapianorize(
    sourceAudioUrl: string,
    options: AmapianorizationOptions
  ): Promise<AmapianorizationResult> {
    const startTime = Date.now();
    const elementsApplied: string[] = [];
    
    try {
      console.log('[AMAPIANORIZATION] Starting enhancement:', options);

      // Convert options to AmapianorizeSettings format
      const settings: AmapianorizeSettings = {
        addLogDrum: options.elements.logDrums,
        logDrumIntensity: options.intensity,
        addPercussion: options.elements.percussion,
        percussionDensity: options.intensity,
        addPianoChords: options.elements.piano,
        pianoComplexity: options.intensity,
        addBassline: options.elements.bass,
        bassDepth: options.intensity,
        addVocalChops: false,
        vocalChopRate: 0,
        sidechainCompression: options.elements.sidechain,
        sidechainAmount: options.intensity,
        filterSweeps: options.elements.filterSweeps,
        sweepFrequency: options.intensity,
        culturalAuthenticity: 'modern',
        regionalStyle: options.region,
      };

      // Track applied elements
      if (options.elements.logDrums) elementsApplied.push('log_drums');
      if (options.elements.percussion) elementsApplied.push('percussion');
      if (options.elements.piano) elementsApplied.push('piano');
      if (options.elements.bass) elementsApplied.push('bass');
      if (options.elements.sidechain) elementsApplied.push('sidechain');
      if (options.elements.filterSweeps) elementsApplied.push('filter_sweeps');

      // Use audioProcessor's amapianorizeAudio function
      const result = await amapianorizeAudio(
        { vocals: sourceAudioUrl }, // Pass stems
        settings
      );

      if (!result.success) {
        throw new Error(result.error || 'Amapianorization failed');
      }

      const processingTime = Date.now() - startTime;
      
      console.log('[AMAPIANORIZATION] Complete:', {
        authenticityScore: result.authenticityScore,
        elementsApplied,
        processingTime,
      });

      // Return enhanced stems
      return {
        stems: {
          vocals: sourceAudioUrl,
          drums: result.processedAudio?.url || sourceAudioUrl,
          bass: result.processedAudio?.url || sourceAudioUrl,
          piano: result.processedAudio?.url || sourceAudioUrl,
          other: result.processedAudio?.url || sourceAudioUrl,
        },
        authenticityScore: result.authenticityScore,
        metadata: {
          region: result.regionalStyle,
          elementsApplied,
          processingTime,
        },
      };

    } catch (error) {
      console.error('[AMAPIANORIZATION] Error:', error);
      throw new Error(
        `Amapianorization failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async dispose(): Promise<void> {
    // Cleanup if needed
    console.log('[AMAPIANORIZATION] Engine disposed');
  }
}
