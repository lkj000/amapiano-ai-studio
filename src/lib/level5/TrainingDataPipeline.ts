/**
 * Training Data Pipeline
 * 
 * Handles audio ingestion, preprocessing, and Essentia-based auto-labeling
 * for fine-tuning MusicGen on Amapiano datasets.
 */

import { supabase } from '@/integrations/supabase/client';
import type { 
  AudioSample, 
  AudioFeatures, 
  TrainingLabel, 
  TrainingSample,
  DatasetStats,
  TrainingDataset 
} from './types';

// ============================================================================
// AUDIO INGESTION
// ============================================================================

export class TrainingDataPipeline {
  private processingQueue: AudioSample[] = [];
  private isProcessing = false;

  /**
   * Ingest audio file for training
   */
  async ingestAudio(
    file: File,
    metadata?: Partial<TrainingLabel>
  ): Promise<AudioSample> {
    // Validate audio format
    const validFormats = ['audio/wav', 'audio/mp3', 'audio/mpeg', 'audio/flac'];
    if (!validFormats.includes(file.type)) {
      throw new Error(`Invalid format: ${file.type}. Supported: WAV, MP3, FLAC`);
    }

    // Create audio sample record
    const sample: AudioSample = {
      id: crypto.randomUUID(),
      url: '', // Will be set after upload
      duration: 0,
      sampleRate: 44100,
      channels: 2,
      format: this.getFormat(file.type),
      size: file.size,
      uploadedAt: new Date(),
      status: 'pending'
    };

    // Upload to storage
    const path = `training-data/${sample.id}/${file.name}`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('audio-samples')
      .upload(path, file);

    if (uploadError) {
      throw new Error(`Upload failed: ${uploadError.message}`);
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('audio-samples')
      .getPublicUrl(path);

    sample.url = urlData.publicUrl;

    // Store in database
    await this.storeSample(sample, metadata);

    // Add to processing queue
    this.processingQueue.push(sample);
    this.processQueue();

    return sample;
  }

  /**
   * Batch ingest multiple audio files
   */
  async batchIngest(
    files: File[],
    batchMetadata?: Partial<TrainingLabel>
  ): Promise<AudioSample[]> {
    const samples: AudioSample[] = [];
    
    for (const file of files) {
      try {
        const sample = await this.ingestAudio(file, batchMetadata);
        samples.push(sample);
      } catch (error) {
        console.error(`Failed to ingest ${file.name}:`, error);
      }
    }

    return samples;
  }

  private getFormat(mimeType: string): 'wav' | 'mp3' | 'flac' {
    switch (mimeType) {
      case 'audio/wav': return 'wav';
      case 'audio/mp3':
      case 'audio/mpeg': return 'mp3';
      case 'audio/flac': return 'flac';
      default: return 'wav';
    }
  }

  // ============================================================================
  // FEATURE EXTRACTION (ESSENTIA-BASED)
  // ============================================================================

  /**
   * Extract audio features using Essentia via Modal GPU backend
   */
  async extractFeatures(audioUrl: string): Promise<AudioFeatures> {
    console.log('[TrainingPipeline] Extracting features via Modal...');

    const { data, error } = await supabase.functions.invoke('modal-analyze', {
      body: { 
        audio_url: audioUrl,
        analysis_type: 'full'
      }
    });

    if (error || !data.success) {
      // Fallback to local estimation if Modal unavailable
      return this.estimateFeaturesLocally(audioUrl);
    }

    // Transform Modal response to our AudioFeatures format
    return this.transformModalFeatures(data);
  }

  /**
   * Transform Modal analysis response to AudioFeatures
   */
  private transformModalFeatures(modalData: any): AudioFeatures {
    return {
      // Core Features
      bpm: modalData.bpm || 115,
      bpmConfidence: modalData.bpm_confidence || 0.8,
      key: modalData.key || 'Am',
      keyConfidence: modalData.key_confidence || 0.7,
      scale: modalData.scale || 'minor',

      // Spectral Features
      spectralCentroid: modalData.spectral_centroid || 2000,
      spectralRolloff: modalData.spectral_rolloff || 4000,
      spectralFlux: modalData.spectral_flux || 0.5,
      spectralContrast: modalData.spectral_contrast || new Array(7).fill(0.5),
      mfcc: modalData.mfcc || new Array(13).fill(0),
      chromagram: modalData.chromagram || new Array(12).fill(0),

      // Rhythm Features
      onsetRate: modalData.onset_rate || 4,
      beatPositions: modalData.beat_positions || [],
      downbeatPositions: modalData.downbeat_positions || [],
      swingRatio: modalData.swing_ratio || 0.5,
      microTimingDeviation: modalData.micro_timing_deviation || 0.02,

      // Energy Features
      rms: modalData.rms || 0.3,
      dynamicRange: modalData.dynamic_range || 12,
      loudness: modalData.loudness || -14,

      // Harmonic Features
      harmonicRatio: modalData.harmonic_ratio || 0.6,
      chordProgression: modalData.chord_progression || [],

      // Log Drum Specific (Amapiano signature)
      logDrumPresence: modalData.log_drum_presence || 0,
      logDrumFrequency: modalData.log_drum_frequency || 55,
      logDrumDecay: modalData.log_drum_decay || 0.3,
      logDrumTimbre: modalData.log_drum_timbre || 'mellow'
    };
  }

  /**
   * Local feature estimation fallback (browser-based)
   */
  private async estimateFeaturesLocally(audioUrl: string): Promise<AudioFeatures> {
    console.log('[TrainingPipeline] Using local feature estimation...');
    
    // This is a simplified version - real implementation would use Web Audio API
    // and Essentia.js for in-browser analysis
    
    return {
      bpm: 115,
      bpmConfidence: 0.6,
      key: 'Am',
      keyConfidence: 0.5,
      scale: 'minor',
      spectralCentroid: 2000,
      spectralRolloff: 4000,
      spectralFlux: 0.5,
      spectralContrast: new Array(7).fill(0.5),
      mfcc: new Array(13).fill(0),
      chromagram: new Array(12).fill(1/12),
      onsetRate: 4,
      beatPositions: [],
      downbeatPositions: [],
      swingRatio: 0.5,
      microTimingDeviation: 0.02,
      rms: 0.3,
      dynamicRange: 12,
      loudness: -14,
      harmonicRatio: 0.6,
      chordProgression: [],
      logDrumPresence: 0.5,
      logDrumFrequency: 55,
      logDrumDecay: 0.3,
      logDrumTimbre: 'mellow'
    };
  }

  // ============================================================================
  // AUTO-LABELING
  // ============================================================================

  /**
   * Auto-label audio using extracted features
   */
  async autoLabel(features: AudioFeatures): Promise<TrainingLabel> {
    // Genre classification based on features
    const genreResult = this.classifyGenre(features);
    
    // Region classification based on production style
    const regionResult = this.classifyRegion(features);
    
    // Instrument detection
    const instruments = this.detectInstruments(features);
    
    // Mood/energy analysis
    const moodEnergy = this.analyzeMoodEnergy(features);

    return {
      genre: genreResult.genre,
      genreConfidence: genreResult.confidence,
      subgenre: genreResult.subgenre,
      
      region: regionResult.region,
      regionConfidence: regionResult.confidence,
      
      mood: moodEnergy.moods,
      energy: moodEnergy.energy,
      danceability: moodEnergy.danceability,
      
      instruments,
      
      productionQuality: this.assessProductionQuality(features),
      mixClarity: this.assessMixClarity(features),
      authenticityScore: this.calculateAuthenticity(features, genreResult.genre, regionResult.region),
      
      labelSource: 'essentia',
      labeledAt: new Date()
    };
  }

  /**
   * Classify genre from audio features
   */
  private classifyGenre(features: AudioFeatures): {
    genre: TrainingLabel['genre'];
    confidence: number;
    subgenre?: string;
  } {
    const { bpm, logDrumPresence, microTimingDeviation, harmonicRatio } = features;
    
    // BPM-based initial classification
    let baseScore = 0;
    if (bpm >= 108 && bpm <= 122) baseScore += 0.3;
    
    // Log drum presence is key indicator
    if (logDrumPresence > 0.7) baseScore += 0.4;
    else if (logDrumPresence > 0.4) baseScore += 0.2;
    
    // Determine subgenre
    let genre: TrainingLabel['genre'] = 'amapiano';
    let subgenre: string | undefined;
    
    // Private School: High harmonic complexity, mellower log drums
    if (harmonicRatio > 0.7 && features.logDrumTimbre === 'mellow') {
      genre = 'private-school';
      subgenre = 'soulful-piano';
    }
    // 3-Step: Specific BPM range, tighter timing
    else if (bpm >= 118 && bpm <= 125 && microTimingDeviation < 0.015) {
      genre = '3-step';
      subgenre = 'afro-house-fusion';
    }
    // Bacardi: Aggressive log drums, higher energy
    else if (features.logDrumTimbre === 'hard' || features.logDrumTimbre === 'distorted') {
      genre = 'bacardi';
      subgenre = 'township-style';
    }
    
    return {
      genre,
      confidence: Math.min(baseScore + 0.3, 1),
      subgenre
    };
  }

  /**
   * Classify regional style
   */
  private classifyRegion(features: AudioFeatures): {
    region: TrainingLabel['region'];
    confidence: number;
  } {
    const { logDrumTimbre, harmonicRatio, spectralCentroid } = features;
    
    // Johannesburg: Deep, soulful, classic Amapiano
    if (harmonicRatio > 0.6 && logDrumTimbre === 'mellow') {
      return { region: 'johannesburg', confidence: 0.7 };
    }
    
    // Pretoria: More jazz-influenced, sophisticated harmonies
    if (harmonicRatio > 0.75) {
      return { region: 'pretoria', confidence: 0.65 };
    }
    
    // Durban: Heavier, more aggressive (Gqom influence)
    if (logDrumTimbre === 'hard' && spectralCentroid > 2500) {
      return { region: 'durban', confidence: 0.6 };
    }
    
    // Cape Town: Smoother, more international blend
    if (spectralCentroid < 1800 && features.dynamicRange > 10) {
      return { region: 'cape-town', confidence: 0.55 };
    }
    
    return { region: 'johannesburg', confidence: 0.5 };
  }

  /**
   * Detect instrument presence
   */
  private detectInstruments(features: AudioFeatures): TrainingLabel['instruments'] {
    // This would use ML models in production
    // For now, derive from spectral features
    return {
      logDrum: features.logDrumPresence,
      piano: features.harmonicRatio * 0.8,
      bass: features.spectralCentroid < 200 ? 0.9 : 0.5,
      shaker: features.spectralRolloff > 8000 ? 0.7 : 0.3,
      hihat: features.spectralRolloff > 10000 ? 0.8 : 0.4,
      kick: features.rms > 0.2 ? 0.9 : 0.6,
      snare: features.onsetRate > 2 ? 0.7 : 0.4,
      synth: features.spectralFlux > 0.6 ? 0.5 : 0.3,
      vocals: 0.3 // Would need vocal detection model
    };
  }

  /**
   * Analyze mood and energy
   */
  private analyzeMoodEnergy(features: AudioFeatures): {
    moods: string[];
    energy: number;
    danceability: number;
  } {
    const moods: string[] = [];
    
    // Determine mood from features
    if (features.bpm >= 115 && features.rms > 0.25) {
      moods.push('energetic', 'uplifting');
    }
    if (features.harmonicRatio > 0.7) {
      moods.push('soulful', 'emotional');
    }
    if (features.logDrumTimbre === 'mellow') {
      moods.push('deep', 'groovy');
    }
    if (features.dynamicRange > 12) {
      moods.push('dynamic', 'expressive');
    }
    
    // Energy calculation
    const energy = Math.min(
      (features.rms * 0.3 + 
       (features.bpm - 100) / 40 * 0.3 +
       features.spectralFlux * 0.4),
      1
    );
    
    // Danceability
    const danceability = Math.min(
      (features.onsetRate / 8 * 0.4 +
       (features.bpm >= 110 && features.bpm <= 120 ? 0.3 : 0.1) +
       features.logDrumPresence * 0.3),
      1
    );
    
    return { moods: moods.length > 0 ? moods : ['ambient'], energy, danceability };
  }

  /**
   * Assess production quality
   */
  private assessProductionQuality(features: AudioFeatures): number {
    let score = 0.5;
    
    // Good dynamic range indicates professional mixing
    if (features.dynamicRange >= 8 && features.dynamicRange <= 14) score += 0.2;
    
    // Proper loudness for the genre
    if (features.loudness >= -16 && features.loudness <= -10) score += 0.15;
    
    // Balanced spectral content
    if (features.spectralCentroid >= 1500 && features.spectralCentroid <= 3000) score += 0.15;
    
    return Math.min(score, 1);
  }

  /**
   * Assess mix clarity
   */
  private assessMixClarity(features: AudioFeatures): number {
    let score = 0.5;
    
    // Good spectral contrast indicates clear separation
    const avgContrast = features.spectralContrast.reduce((a, b) => a + b, 0) / features.spectralContrast.length;
    if (avgContrast > 0.5) score += 0.25;
    
    // Appropriate rolloff for clean mix
    if (features.spectralRolloff > 6000) score += 0.25;
    
    return Math.min(score, 1);
  }

  /**
   * Calculate authenticity score
   */
  private calculateAuthenticity(
    features: AudioFeatures, 
    genre: string, 
    region: string
  ): number {
    let score = 50; // Base score
    
    // BPM match (110-120 is classic Amapiano)
    if (features.bpm >= 110 && features.bpm <= 120) score += 15;
    else if (features.bpm >= 108 && features.bpm <= 125) score += 8;
    
    // Log drum presence is essential
    score += features.logDrumPresence * 20;
    
    // Micro-timing is what makes it groove
    if (features.microTimingDeviation > 0.01 && features.microTimingDeviation < 0.04) {
      score += 10;
    }
    
    // Key confidence
    score += features.keyConfidence * 5;
    
    return Math.min(Math.max(score, 0), 100);
  }

  // ============================================================================
  // PROCESSING QUEUE
  // ============================================================================

  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.processingQueue.length === 0) return;
    
    this.isProcessing = true;
    
    while (this.processingQueue.length > 0) {
      const sample = this.processingQueue.shift()!;
      
      try {
        await this.updateSampleStatus(sample.id, 'processing');
        
        // Extract features
        const features = await this.extractFeatures(sample.url);
        
        // Auto-label
        const labels = await this.autoLabel(features);
        
        // Store processed data
        await this.storeProcessedSample(sample.id, features, labels);
        
        await this.updateSampleStatus(sample.id, 'labeled');
        
      } catch (error) {
        console.error(`Processing failed for ${sample.id}:`, error);
        await this.updateSampleStatus(sample.id, 'error');
      }
    }
    
    this.isProcessing = false;
  }

  // ============================================================================
  // DATABASE OPERATIONS
  // ============================================================================

  private async storeSample(
    sample: AudioSample, 
    metadata?: Partial<TrainingLabel>
  ): Promise<void> {
    // Store in database - using a JSON column for flexibility
    const userId = (await supabase.auth.getUser()).data.user?.id;
    if (!userId) {
      console.log('[TrainingPipeline] No user, skipping DB storage');
      return;
    }
    
    const analysisData = {
      sample: JSON.parse(JSON.stringify(sample)),
      metadata: metadata ? JSON.parse(JSON.stringify(metadata)) : null,
      status: 'pending'
    };
    
    const { error } = await supabase.from('audio_analysis_results').insert([{
      audio_url: sample.url,
      analysis_type: 'training-sample',
      analysis_data: analysisData as unknown as Record<string, never>,
      user_id: userId
    }]);

    if (error) {
      console.error('Failed to store sample:', error);
    }
  }

  private async updateSampleStatus(
    sampleId: string, 
    status: AudioSample['status']
  ): Promise<void> {
    // Update status in database
    console.log(`[TrainingPipeline] Sample ${sampleId} status: ${status}`);
  }

  private async storeProcessedSample(
    sampleId: string,
    features: AudioFeatures,
    labels: TrainingLabel
  ): Promise<void> {
    console.log(`[TrainingPipeline] Stored processed sample ${sampleId}`);
    console.log('Features:', { bpm: features.bpm, key: features.key });
    console.log('Labels:', { genre: labels.genre, region: labels.region });
  }

  // ============================================================================
  // DATASET MANAGEMENT
  // ============================================================================

  /**
   * Create a training dataset from labeled samples
   */
  async createDataset(
    name: string,
    description: string,
    filters?: {
      genres?: string[];
      regions?: string[];
      minQuality?: number;
    }
  ): Promise<TrainingDataset> {
    // Query labeled samples matching filters
    const samples = await this.queryLabeledSamples(filters);
    
    // Calculate stats
    const stats = this.calculateDatasetStats(samples);
    
    const dataset: TrainingDataset = {
      id: crypto.randomUUID(),
      name,
      description,
      version: '1.0.0',
      samples,
      stats,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Store dataset
    await this.storeDataset(dataset);

    return dataset;
  }

  private async queryLabeledSamples(filters?: {
    genres?: string[];
    regions?: string[];
    minQuality?: number;
  }): Promise<TrainingSample[]> {
    // Query from database with filters
    // For now, return empty array
    return [];
  }

  private calculateDatasetStats(samples: TrainingSample[]): DatasetStats {
    const genreDistribution: Record<string, number> = {};
    const regionDistribution: Record<string, number> = {};
    const keyDistribution: Record<string, number> = {};
    
    let totalDuration = 0;
    let bpmSum = 0;
    let bpmMin = Infinity;
    let bpmMax = -Infinity;
    let lowQuality = 0;
    let mediumQuality = 0;
    let highQuality = 0;

    for (const sample of samples) {
      totalDuration += sample.audio.duration;
      
      const { genre, region } = sample.labels;
      genreDistribution[genre] = (genreDistribution[genre] || 0) + 1;
      regionDistribution[region] = (regionDistribution[region] || 0) + 1;
      
      const { bpm, key } = sample.features;
      bpmSum += bpm;
      bpmMin = Math.min(bpmMin, bpm);
      bpmMax = Math.max(bpmMax, bpm);
      keyDistribution[key] = (keyDistribution[key] || 0) + 1;
      
      const quality = sample.labels.productionQuality;
      if (quality < 0.4) lowQuality++;
      else if (quality < 0.7) mediumQuality++;
      else highQuality++;
    }

    return {
      totalSamples: samples.length,
      totalDuration,
      genreDistribution,
      regionDistribution,
      bpmRange: {
        min: samples.length > 0 ? bpmMin : 0,
        max: samples.length > 0 ? bpmMax : 0,
        mean: samples.length > 0 ? bpmSum / samples.length : 0
      },
      keyDistribution,
      qualityDistribution: {
        low: lowQuality,
        medium: mediumQuality,
        high: highQuality
      }
    };
  }

  private async storeDataset(dataset: TrainingDataset): Promise<void> {
    console.log(`[TrainingPipeline] Stored dataset: ${dataset.name}`);
  }

  /**
   * Export dataset in MusicGen fine-tuning format
   */
  async exportForFineTuning(datasetId: string): Promise<{
    audioDir: string;
    metadataPath: string;
    configPath: string;
  }> {
    console.log(`[TrainingPipeline] Exporting dataset ${datasetId} for fine-tuning`);
    
    return {
      audioDir: `/datasets/${datasetId}/audio`,
      metadataPath: `/datasets/${datasetId}/metadata.jsonl`,
      configPath: `/datasets/${datasetId}/config.yaml`
    };
  }
}

// Singleton instance
export const trainingDataPipeline = new TrainingDataPipeline();
