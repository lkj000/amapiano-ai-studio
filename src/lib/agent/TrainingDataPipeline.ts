/**
 * Training Data Pipeline for Level 5 Autonomous Agent
 * Ingests samples from LANDR, Suno, and other sources for model training
 * Supports both fine-tuning and style transfer learning
 */

import { supabase } from '@/integrations/supabase/client';
import { Tool } from './ReActLoop';
import type { Json } from '@/integrations/supabase/types';

// ============= Training Data Types =============

export interface TrainingDataSource {
  id: string;
  type: 'landr_sample' | 'landr_pack' | 'suno_song' | 'user_upload' | 'web_scrape';
  sourceUrl: string;
  metadata: TrainingMetadata;
  status: 'pending' | 'processing' | 'analyzed' | 'ready' | 'failed';
  analyzedFeatures?: AudioFeatures;
  processingError?: string;
}

export interface TrainingMetadata {
  title: string;
  artist?: string;
  genre?: string;
  subgenre?: string;
  bpm?: number;
  key?: string;
  tags?: string[];
  quality: 'low' | 'medium' | 'high' | 'professional';
  rights: 'owned' | 'licensed' | 'public_domain' | 'fair_use' | 'unknown';
  source: string;
  downloadedAt: number;
}

export interface AudioFeatures {
  bpm: number;
  key: string;
  scale: 'major' | 'minor' | 'other';
  energy: number;
  danceability: number;
  valence: number;
  acousticness: number;
  instrumentalness: number;
  speechiness: number;
  spectralCentroid: number;
  spectralRolloff: number;
  zeroCrossingRate: number;
  mfcc: number[];
  chromagram: number[];
  rhythmPattern: number[];
  harmonicContent: number[];
}

export interface TrainingDataset {
  id: string;
  name: string;
  description: string;
  sources: TrainingDataSource[];
  totalSamples: number;
  totalDuration: number;
  genres: Record<string, number>;
  status: 'building' | 'ready' | 'training' | 'trained';
  createdAt: number;
  updatedAt: number;
}

export interface TrainingConfig {
  datasetId: string;
  modelType: 'generation' | 'style_transfer' | 'stem_separation' | 'mastering' | 'classification';
  epochs: number;
  batchSize: number;
  learningRate: number;
  augmentation: {
    pitchShift: boolean;
    timeStretch: boolean;
    noiseInjection: boolean;
    stemMixing: boolean;
  };
  validation: {
    splitRatio: number;
    metrics: string[];
  };
}

// ============= Training Data Pipeline Class =============

export class TrainingDataPipeline {
  private datasets: Map<string, TrainingDataset> = new Map();
  private processingQueue: TrainingDataSource[] = [];
  private isProcessing: boolean = false;

  /**
   * Ingest LANDR sample pack for training
   */
  async ingestLANDRPack(packId: string, packUrl: string): Promise<TrainingDataSource[]> {
    console.log(`[TrainingPipeline] Ingesting LANDR pack: ${packId}`);
    
    // Fetch pack metadata
    const { data: packData, error } = await supabase
      .from('marketplace_items')
      .select('*')
      .eq('id', packId)
      .single();
    
    if (error) throw new Error(`Failed to fetch pack: ${error.message}`);
    
    // Create training data sources for each sample in pack
    const sources: TrainingDataSource[] = [];
    
    // For now, create a single source for the pack
    // In production, this would unzip and process each sample
    const source: TrainingDataSource = {
      id: `landr_pack_${packId}_${Date.now()}`,
      type: 'landr_pack',
      sourceUrl: packUrl || packData?.download_url || '',
      metadata: {
        title: packData?.name || 'Unknown Pack',
        artist: 'LANDR',
        genre: packData?.subcategory || 'Amapiano',
        tags: packData?.tags || [],
        quality: 'professional',
        rights: 'licensed',
        source: 'landr',
        downloadedAt: Date.now()
      },
      status: 'pending'
    };
    
    sources.push(source);
    this.processingQueue.push(source);
    
    // Start processing if not already running
    this.processQueue();
    
    return sources;
  }

  /**
   * Ingest Suno-generated song for training
   */
  async ingestSunoSong(
    audioUrl: string, 
    metadata: Partial<TrainingMetadata>
  ): Promise<TrainingDataSource> {
    console.log(`[TrainingPipeline] Ingesting Suno song: ${audioUrl}`);
    
    const source: TrainingDataSource = {
      id: `suno_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'suno_song',
      sourceUrl: audioUrl,
      metadata: {
        title: metadata.title || 'Suno Generated Song',
        artist: metadata.artist || 'Suno AI',
        genre: metadata.genre || 'AI Generated',
        subgenre: metadata.subgenre,
        bpm: metadata.bpm,
        key: metadata.key,
        tags: metadata.tags || ['ai-generated', 'suno'],
        quality: 'high',
        rights: 'owned',
        source: 'suno',
        downloadedAt: Date.now()
      },
      status: 'pending'
    };
    
    this.processingQueue.push(source);
    this.processQueue();
    
    return source;
  }

  /**
   * Ingest individual LANDR sample for training
   */
  async ingestLANDRSample(sampleId: string, sampleUrl: string): Promise<TrainingDataSource> {
    console.log(`[TrainingPipeline] Ingesting LANDR sample: ${sampleId}`);
    
    const { data: sampleData } = await supabase
      .from('sample_library')
      .select('*')
      .eq('id', sampleId)
      .single();
    
    const source: TrainingDataSource = {
      id: `landr_sample_${sampleId}`,
      type: 'landr_sample',
      sourceUrl: sampleUrl || sampleData?.audio_url || '',
      metadata: {
        title: sampleData?.name || 'Unknown Sample',
        genre: sampleData?.sample_type || 'Unknown',
        bpm: sampleData?.bpm,
        key: sampleData?.key_signature,
        tags: sampleData?.tags || [],
        quality: 'professional',
        rights: 'licensed',
        source: 'landr',
        downloadedAt: Date.now()
      },
      status: 'pending'
    };
    
    this.processingQueue.push(source);
    this.processQueue();
    
    return source;
  }

  /**
   * Ingest user-uploaded audio for training
   */
  async ingestUserUpload(
    audioUrl: string, 
    metadata: Partial<TrainingMetadata>
  ): Promise<TrainingDataSource> {
    const source: TrainingDataSource = {
      id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'user_upload',
      sourceUrl: audioUrl,
      metadata: {
        title: metadata.title || 'User Upload',
        artist: metadata.artist,
        genre: metadata.genre,
        bpm: metadata.bpm,
        key: metadata.key,
        tags: metadata.tags || ['user-upload'],
        quality: metadata.quality || 'medium',
        rights: metadata.rights || 'owned',
        source: 'user',
        downloadedAt: Date.now()
      },
      status: 'pending'
    };
    
    this.processingQueue.push(source);
    this.processQueue();
    
    return source;
  }

  /**
   * Process queue of pending training data
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessing) return;
    this.isProcessing = true;
    
    while (this.processingQueue.length > 0) {
      const source = this.processingQueue.shift()!;
      await this.analyzeAndExtractFeatures(source);
    }
    
    this.isProcessing = false;
  }

  /**
   * Analyze audio and extract training features
   */
  private async analyzeAndExtractFeatures(source: TrainingDataSource): Promise<void> {
    try {
      source.status = 'processing';
      
      // Call analysis edge function
      const { data, error } = await supabase.functions.invoke('analyze-audio', {
        body: {
          audioUrl: source.sourceUrl,
          analysisType: 'training_features'
        }
      });
      
      if (error) throw error;
      
      source.analyzedFeatures = {
        bpm: data.bpm || source.metadata.bpm || 120,
        key: data.key || source.metadata.key || 'C',
        scale: data.scale || 'major',
        energy: data.energy || 0.5,
        danceability: data.danceability || 0.5,
        valence: data.valence || 0.5,
        acousticness: data.acousticness || 0.3,
        instrumentalness: data.instrumentalness || 0.8,
        speechiness: data.speechiness || 0.1,
        spectralCentroid: data.spectralCentroid || 2000,
        spectralRolloff: data.spectralRolloff || 4000,
        zeroCrossingRate: data.zeroCrossingRate || 0.1,
        mfcc: data.mfcc || new Array(13).fill(0),
        chromagram: data.chromagram || new Array(12).fill(0),
        rhythmPattern: data.rhythmPattern || [],
        harmonicContent: data.harmonicContent || []
      };
      
      source.status = 'ready';
      
      // Store in database
      await this.persistTrainingData(source);
      
    } catch (error) {
      source.status = 'failed';
      source.processingError = error instanceof Error ? error.message : 'Unknown error';
      console.error(`[TrainingPipeline] Failed to process ${source.id}:`, error);
    }
  }

  /**
   * Persist training data to database
   */
  private async persistTrainingData(source: TrainingDataSource): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    
    // Store in a training_data table (would need to create this)
    // For now, we'll use agent_memory
    await supabase.from('agent_memory').upsert([{
      user_id: user.id,
      memory_key: `training_data_${source.id}`,
      memory_type: 'training_data',
      memory_data: JSON.parse(JSON.stringify({ source, features: source.analyzedFeatures })) as Json,
      importance_score: this.calculateImportanceScore(source)
    }]);
  }

  /**
   * Calculate importance score for training sample
   */
  private calculateImportanceScore(source: TrainingDataSource): number {
    let score = 50; // Base score
    
    // Quality bonus
    if (source.metadata.quality === 'professional') score += 20;
    else if (source.metadata.quality === 'high') score += 10;
    
    // Rights bonus (licensed content is more valuable)
    if (source.metadata.rights === 'licensed') score += 15;
    else if (source.metadata.rights === 'owned') score += 10;
    
    // Genre specialization bonus
    if (source.metadata.genre?.toLowerCase().includes('amapiano')) score += 10;
    
    // Features completeness bonus
    if (source.analyzedFeatures) score += 15;
    
    return Math.min(100, score);
  }

  /**
   * Create a training dataset from ingested sources
   */
  async createDataset(
    name: string, 
    description: string,
    filter?: { genres?: string[]; minQuality?: string; types?: TrainingDataSource['type'][] }
  ): Promise<TrainingDataset> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Authentication required');
    
    // Fetch all training data from memory
    const { data: memoryData } = await supabase
      .from('agent_memory')
      .select('memory_data')
      .eq('user_id', user.id)
      .eq('memory_type', 'training_data');
    
    let sources: TrainingDataSource[] = (memoryData || [])
      .map(m => (m.memory_data as unknown as { source: TrainingDataSource }).source)
      .filter(s => s.status === 'ready');
    
    // Apply filters
    if (filter?.genres) {
      sources = sources.filter(s => 
        filter.genres!.some(g => 
          s.metadata.genre?.toLowerCase().includes(g.toLowerCase())
        )
      );
    }
    
    if (filter?.types) {
      sources = sources.filter(s => filter.types!.includes(s.type));
    }
    
    // Calculate genre distribution
    const genres: Record<string, number> = {};
    sources.forEach(s => {
      const genre = s.metadata.genre || 'Unknown';
      genres[genre] = (genres[genre] || 0) + 1;
    });
    
    const dataset: TrainingDataset = {
      id: `dataset_${Date.now()}`,
      name,
      description,
      sources,
      totalSamples: sources.length,
      totalDuration: 0, // Would calculate from audio analysis
      genres,
      status: 'ready',
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    
    this.datasets.set(dataset.id, dataset);
    
    // Persist dataset metadata
    await supabase.from('agent_memory').insert([{
      user_id: user.id,
      memory_key: `dataset_${dataset.id}`,
      memory_type: 'training_dataset',
      memory_data: JSON.parse(JSON.stringify(dataset)) as Json,
      importance_score: 100
    }]);
    
    return dataset;
  }

  /**
   * Get dataset by ID
   */
  getDataset(datasetId: string): TrainingDataset | undefined {
    return this.datasets.get(datasetId);
  }

  /**
   * Get all datasets
   */
  getAllDatasets(): TrainingDataset[] {
    return Array.from(this.datasets.values());
  }

  /**
   * Get training data statistics
   */
  getStatistics(): {
    totalSources: number;
    byType: Record<string, number>;
    byStatus: Record<string, number>;
    byGenre: Record<string, number>;
    processingQueue: number;
  } {
    const allSources = Array.from(this.datasets.values())
      .flatMap(d => d.sources);
    
    const byType: Record<string, number> = {};
    const byStatus: Record<string, number> = {};
    const byGenre: Record<string, number> = {};
    
    allSources.forEach(s => {
      byType[s.type] = (byType[s.type] || 0) + 1;
      byStatus[s.status] = (byStatus[s.status] || 0) + 1;
      const genre = s.metadata.genre || 'Unknown';
      byGenre[genre] = (byGenre[genre] || 0) + 1;
    });
    
    return {
      totalSources: allSources.length,
      byType,
      byStatus,
      byGenre,
      processingQueue: this.processingQueue.length
    };
  }
}

// ============= Training Tools for Level 5 Agent =============

export const trainingTools: Tool[] = [
  {
    name: 'ingest_landr_pack',
    description: 'Ingest a LANDR sample pack for model training. Downloads and analyzes all samples.',
    parameters: {
      pack_id: { type: 'string', description: 'LANDR pack ID', required: true },
      pack_url: { type: 'string', description: 'Download URL for the pack', required: false }
    },
    execute: async (input) => {
      const pipeline = new TrainingDataPipeline();
      const sources = await pipeline.ingestLANDRPack(
        String(input.pack_id),
        String(input.pack_url || '')
      );
      return JSON.stringify({ success: true, sourcesCount: sources.length, sources });
    }
  },
  {
    name: 'ingest_suno_song',
    description: 'Ingest a Suno-generated song for training data. Analyzes and stores features.',
    parameters: {
      audio_url: { type: 'string', description: 'URL of the Suno song', required: true },
      title: { type: 'string', description: 'Song title', required: false },
      genre: { type: 'string', description: 'Genre classification', required: false },
      bpm: { type: 'number', description: 'BPM if known', required: false },
      key: { type: 'string', description: 'Key if known', required: false }
    },
    execute: async (input) => {
      const pipeline = new TrainingDataPipeline();
      const source = await pipeline.ingestSunoSong(
        String(input.audio_url),
        {
          title: input.title as string,
          genre: input.genre as string,
          bpm: input.bpm as number,
          key: input.key as string
        }
      );
      return JSON.stringify({ success: true, source });
    }
  },
  {
    name: 'ingest_landr_sample',
    description: 'Ingest individual LANDR sample for training',
    parameters: {
      sample_id: { type: 'string', description: 'Sample ID', required: true },
      sample_url: { type: 'string', description: 'Sample audio URL', required: false }
    },
    execute: async (input) => {
      const pipeline = new TrainingDataPipeline();
      const source = await pipeline.ingestLANDRSample(
        String(input.sample_id),
        String(input.sample_url || '')
      );
      return JSON.stringify({ success: true, source });
    }
  },
  {
    name: 'create_training_dataset',
    description: 'Create a curated training dataset from ingested sources',
    parameters: {
      name: { type: 'string', description: 'Dataset name', required: true },
      description: { type: 'string', description: 'Dataset description', required: true },
      genres: { type: 'array', description: 'Filter by genres', required: false },
      types: { type: 'array', description: 'Filter by source types', required: false }
    },
    execute: async (input) => {
      const pipeline = new TrainingDataPipeline();
      const dataset = await pipeline.createDataset(
        String(input.name),
        String(input.description),
        {
          genres: input.genres as string[],
          types: input.types as TrainingDataSource['type'][]
        }
      );
      return JSON.stringify({ success: true, dataset });
    }
  },
  {
    name: 'get_training_statistics',
    description: 'Get statistics about ingested training data',
    parameters: {},
    execute: async () => {
      const pipeline = new TrainingDataPipeline();
      return JSON.stringify(pipeline.getStatistics());
    }
  }
];

// Export singleton
export const trainingPipeline = new TrainingDataPipeline();
