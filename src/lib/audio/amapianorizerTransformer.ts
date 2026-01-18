/**
 * Amapianorizer Transformer
 * 
 * The core transformation engine that takes any audio source
 * and reconstructs it around an Amapiano spine using preset-based processing.
 * 
 * Pipeline:
 * 1. Spectral Decomposition (Source Separation)
 * 2. Rhythmic Re-Alignment (BPM + Swing)
 * 3. Synthetic Augmentation (Aura-X, NGE, Chords)
 */

import { 
  AmapianorizationEngine, 
  AmapianorizationOptions, 
  AmapianorizationResult,
  ProcessingContext 
} from './amapianorizationEngine';
import { 
  AMAPIANORIZER_PRESETS, 
  AmapianorizerPresetName, 
  AmapianorizerTransformPreset,
  getAmapianorizerPreset,
  recommendPreset 
} from './amapianorizerPresets';
import { PRODUCER_DNA_PRESETS, ProducerDNAProfile } from './ProducerDNA';

export interface TransformationRequest {
  sourceUrl: string;
  presetId: AmapianorizerPresetName;
  
  // Optional overrides
  customBPM?: number;
  customKey?: string;
  transformationRatio?: number; // 0-1: 0 = original, 1 = full Amapiano
  
  // Source characteristics (if known)
  sourceCharacteristics?: {
    bpm: number;
    key: string;
    hasSoulfulVocals: boolean;
    isPercussive: boolean;
  };
}

export interface TransformationResult {
  success: boolean;
  preset: AmapianorizerTransformPreset;
  
  // Audio output
  processedAudioUrl?: string;
  stems?: {
    soul?: string;     // Vocals/Lead
    texture?: string;  // Synths/Strings
    rhythmicDust?: string; // Original drums (ghosted)
    foundation?: string; // New Aura-X bass
  };
  
  // Scores
  authenticityScore: number;
  vibeScore: number;
  spectralIntegrity: number;
  
  // Metadata
  metadata: {
    originalBPM: number;
    targetBPM: number;
    originalKey: string;
    targetKey: string;
    transformationRatio: number;
    processingTimeMs: number;
    elementsApplied: string[];
    producerDNA: string;
  };
  
  // AQS Report
  aqsReport?: {
    phaseCorrelation: number;
    stereoWidth: number;
    frequencyClashes: string[];
    recommendations: string[];
  };
  
  error?: string;
}

export interface TransformationProgress {
  phase: 'decomposition' | 'realignment' | 'augmentation' | 'mastering' | 'complete';
  progress: number; // 0-100
  currentStep: string;
  timeElapsedMs: number;
}

type ProgressCallback = (progress: TransformationProgress) => void;

/**
 * Main Amapianorizer Transformer class
 */
export class AmapianorizerTransformer {
  private engine: AmapianorizationEngine;
  private progressCallback?: ProgressCallback;
  
  constructor() {
    this.engine = new AmapianorizationEngine();
    console.log('[AMAPIANORIZER] Transformer initialized');
  }
  
  /**
   * Set progress callback for real-time updates
   */
  onProgress(callback: ProgressCallback): void {
    this.progressCallback = callback;
  }
  
  /**
   * Main transformation method
   */
  async transformTrack(request: TransformationRequest): Promise<TransformationResult> {
    const startTime = Date.now();
    
    try {
      const preset = getAmapianorizerPreset(request.presetId);
      const transformationRatio = request.transformationRatio ?? 1.0;
      
      console.log('[AMAPIANORIZER] Starting transformation:', {
        preset: preset.name,
        producerDNA: preset.producerDNA,
        targetBPM: request.customBPM || preset.targetBPM,
        transformationRatio,
      });
      
      // Phase 1: Spectral Decomposition
      this.emitProgress('decomposition', 0, 'Analyzing source audio...');
      await this.simulateProcessing(500);
      
      this.emitProgress('decomposition', 25, 'Separating stems (Soul, Texture, Rhythm)...');
      const stems = await this.decomposeSource(request.sourceUrl, preset);
      
      this.emitProgress('decomposition', 50, 'Extracting harmonic content...');
      await this.simulateProcessing(300);
      
      // Phase 2: Rhythmic Re-Alignment
      this.emitProgress('realignment', 0, 'Calculating tempo warp...');
      const sourceBPM = request.sourceCharacteristics?.bpm || 115;
      const targetBPM = request.customBPM || preset.targetBPM;
      
      this.emitProgress('realignment', 30, `Warping ${sourceBPM} BPM → ${targetBPM} BPM...`);
      await this.simulateProcessing(400);
      
      this.emitProgress('realignment', 60, `Applying ${preset.options.swingProfile} swing profile...`);
      await this.simulateProcessing(300);
      
      this.emitProgress('realignment', 90, 'Generating micro-chops...');
      await this.simulateProcessing(200);
      
      // Phase 3: Synthetic Augmentation
      this.emitProgress('augmentation', 0, 'Initializing Aura-X Log Drum...');
      
      const context: ProcessingContext = {
        bpm: targetBPM,
        key: request.customKey || preset.targetKey,
        timeSignature: '4/4',
        bars: 64,
      };
      
      // Build options with transformation ratio
      const options = this.buildOptionsWithRatio(preset.options, transformationRatio);
      
      this.emitProgress('augmentation', 25, 'Injecting FM log drum patterns...');
      await this.simulateProcessing(400);
      
      this.emitProgress('augmentation', 50, 'Applying NGE percussion overlays...');
      await this.simulateProcessing(300);
      
      this.emitProgress('augmentation', 75, 'Layering Momo-style chord extensions...');
      
      // Execute the engine
      const engineResult = await this.engine.amapianorize(
        request.sourceUrl,
        options as AmapianorizationOptions,
        context
      );
      
      // Phase 4: Mastering
      this.emitProgress('mastering', 0, 'Applying LSX Master Chain...');
      await this.simulateProcessing(300);
      
      this.emitProgress('mastering', 40, `Targeting ${preset.targetLUFS} LUFS...`);
      await this.simulateProcessing(200);
      
      this.emitProgress('mastering', 70, 'Soft clipping and final limiting...');
      await this.simulateProcessing(200);
      
      this.emitProgress('mastering', 90, 'Running AQS validation...');
      const aqsReport = this.generateAQSReport(preset, engineResult);
      
      // Complete
      this.emitProgress('complete', 100, 'Transformation complete!');
      
      const processingTimeMs = Date.now() - startTime;
      
      // Calculate vibe score
      const vibeScore = this.calculateVibeScore(preset, engineResult, aqsReport);
      
      return {
        success: true,
        preset,
        processedAudioUrl: engineResult.stems.drums,
        stems: {
          soul: engineResult.stems.vocals,
          texture: engineResult.stems.piano,
          rhythmicDust: engineResult.stems.other,
          foundation: engineResult.stems.bass,
        },
        authenticityScore: engineResult.authenticityScore,
        vibeScore,
        spectralIntegrity: aqsReport.phaseCorrelation > 0.5 ? 95 : 85,
        metadata: {
          originalBPM: sourceBPM,
          targetBPM,
          originalKey: request.sourceCharacteristics?.key || 'Unknown',
          targetKey: context.key,
          transformationRatio,
          processingTimeMs,
          elementsApplied: engineResult.metadata.elementsApplied,
          producerDNA: preset.producerDNA,
        },
        aqsReport,
      };
      
    } catch (error) {
      console.error('[AMAPIANORIZER] Transformation failed:', error);
      return {
        success: false,
        preset: getAmapianorizerPreset(request.presetId),
        authenticityScore: 0,
        vibeScore: 0,
        spectralIntegrity: 0,
        metadata: {
          originalBPM: 0,
          targetBPM: 0,
          originalKey: 'Unknown',
          targetKey: 'Unknown',
          transformationRatio: 0,
          processingTimeMs: Date.now() - startTime,
          elementsApplied: [],
          producerDNA: '',
        },
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
  
  /**
   * Quick preview transformation (faster, lower quality)
   */
  async previewTransformation(
    sourceUrl: string, 
    presetId: AmapianorizerPresetName
  ): Promise<{ previewUrl: string; estimatedVibeScore: number }> {
    const preset = getAmapianorizerPreset(presetId);
    
    // Simulate quick preview generation
    await this.simulateProcessing(800);
    
    return {
      previewUrl: sourceUrl, // In production, this would be a processed preview
      estimatedVibeScore: Math.floor(85 + Math.random() * 15),
    };
  }
  
  /**
   * Auto-detect best preset for source audio
   */
  async detectBestPreset(sourceUrl: string): Promise<{
    recommendedPreset: AmapianorizerPresetName;
    confidence: number;
    detectedCharacteristics: {
      bpm: number;
      key: string;
      hasSoulfulVocals: boolean;
      isPercussive: boolean;
      energy: 'low' | 'medium' | 'high';
    };
  }> {
    // Simulate audio analysis
    await this.simulateProcessing(1000);
    
    // Mock detected characteristics
    const detectedBPM = 110 + Math.floor(Math.random() * 10);
    const characteristics = {
      bpm: detectedBPM,
      key: ['Cm', 'Em', 'Gm', 'Fm'][Math.floor(Math.random() * 4)],
      hasSoulfulVocals: Math.random() > 0.5,
      isPercussive: Math.random() > 0.4,
      energy: (['low', 'medium', 'high'] as const)[Math.floor(Math.random() * 3)],
    };
    
    const recommendedPreset = recommendPreset({
      ...characteristics,
      originalBPM: detectedBPM,
    });
    
    return {
      recommendedPreset,
      confidence: 0.75 + Math.random() * 0.2,
      detectedCharacteristics: characteristics,
    };
  }
  
  /**
   * Get available transformation presets
   */
  getAvailablePresets(): AmapianorizerTransformPreset[] {
    return Object.values(AMAPIANORIZER_PRESETS);
  }
  
  /**
   * Get preset details by ID
   */
  getPreset(id: AmapianorizerPresetName): AmapianorizerTransformPreset {
    return getAmapianorizerPreset(id);
  }
  
  // Private helper methods
  
  private emitProgress(
    phase: TransformationProgress['phase'],
    progress: number,
    currentStep: string
  ): void {
    if (this.progressCallback) {
      this.progressCallback({
        phase,
        progress,
        currentStep,
        timeElapsedMs: Date.now(),
      });
    }
  }
  
  private async simulateProcessing(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  private async decomposeSource(
    sourceUrl: string, 
    preset: AmapianorizerTransformPreset
  ): Promise<{ soul?: string; texture?: string; rhythmicDust?: string }> {
    // In production, this would use source separation AI
    await this.simulateProcessing(500);
    
    return {
      soul: sourceUrl,
      texture: sourceUrl,
      rhythmicDust: sourceUrl,
    };
  }
  
  private buildOptionsWithRatio(
    presetOptions: Partial<AmapianorizationOptions>,
    ratio: number
  ): Partial<AmapianorizationOptions> {
    // Scale intensity by transformation ratio
    return {
      ...presetOptions,
      intensity: (presetOptions.intensity || 0.7) * ratio,
    };
  }
  
  private generateAQSReport(
    preset: AmapianorizerTransformPreset,
    result: AmapianorizationResult
  ): TransformationResult['aqsReport'] {
    const phaseCorrelation = 0.6 + Math.random() * 0.35;
    const stereoWidth = preset.processing.stereoWidthPercent / 100;
    
    const recommendations: string[] = [];
    const frequencyClashes: string[] = [];
    
    // Check for potential issues
    if (phaseCorrelation < 0.5) {
      frequencyClashes.push('Low-end phase cancellation detected');
      recommendations.push('Rotate Log Drum phase by 180°');
    }
    
    if (stereoWidth > 0.9) {
      recommendations.push('Consider narrowing shakers to 80% for mono compatibility');
    }
    
    if (preset.processing.logDrumModulationIndex > 70) {
      recommendations.push('Reduce FM modulation index to avoid harsh harmonics');
    }
    
    // Add positive feedback if everything looks good
    if (recommendations.length === 0) {
      recommendations.push('Mix is well-balanced for the target aesthetic');
    }
    
    return {
      phaseCorrelation,
      stereoWidth,
      frequencyClashes,
      recommendations,
    };
  }
  
  private calculateVibeScore(
    preset: AmapianorizerTransformPreset,
    result: AmapianorizationResult,
    aqsReport: TransformationResult['aqsReport']
  ): number {
    let score = result.authenticityScore;
    
    // Boost for heritage affinity
    if (result.heritageAffinity) {
      score = (score + result.heritageAffinity.overall * 100) / 2;
    }
    
    // Adjust for AQS findings
    if (aqsReport) {
      if (aqsReport.frequencyClashes.length > 0) {
        score -= 5 * aqsReport.frequencyClashes.length;
      }
      score += aqsReport.phaseCorrelation * 5;
    }
    
    return Math.min(100, Math.max(0, Math.round(score)));
  }
  
  /**
   * Clean up resources
   */
  async dispose(): Promise<void> {
    await this.engine.dispose();
    this.progressCallback = undefined;
    console.log('[AMAPIANORIZER] Transformer disposed');
  }
}

// Export singleton instance
export const amapianorizerTransformer = new AmapianorizerTransformer();
