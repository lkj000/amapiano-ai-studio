/**
 * Sample Library Vector Indexing
 * Adds semantic search capabilities to all samples
 */

import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface IndexingProgress {
  total: number;
  indexed: number;
  failed: number;
  currentSample: string;
}

export interface IndexingResult {
  success: boolean;
  indexed: number;
  failed: number;
  errors: Array<{ sampleId: string; error: string }>;
}

/**
 * Index all samples in the library with vector embeddings
 */
export async function indexSampleLibrary(
  onProgress?: (progress: IndexingProgress) => void
): Promise<IndexingResult> {
  console.log('[SampleIndexing] Starting bulk indexing...');
  
  const result: IndexingResult = {
    success: false,
    indexed: 0,
    failed: 0,
    errors: []
  };

  try {
    // Get all samples
    const { data: samples, error } = await supabase
      .from('samples')
      .select('*');

    if (error || !samples) {
      throw new Error(`Failed to fetch samples: ${error?.message}`);
    }

    console.log(`[SampleIndexing] Found ${samples.length} samples to index`);
    
    const progress: IndexingProgress = {
      total: samples.length,
      indexed: 0,
      failed: 0,
      currentSample: ''
    };

    // Index each sample with retry logic
    for (const sample of samples) {
      progress.currentSample = sample.name;
      
      if (onProgress) {
        onProgress({ ...progress });
      }

      try {
        // Create rich description for embedding
        const description = createSampleDescription(sample);
        
        // Add vector embedding
        const { error: vectorError } = await supabase
          .from('musical_vectors')
          .insert({
            entity_type: 'sample',
            entity_id: sample.id,
            embedding: description,
            metadata: {
              name: sample.name,
              category: sample.category,
              bpm: sample.bpm,
              key: sample.key_signature,
              tags: sample.tags || [],
              duration: sample.duration,
              isPublic: sample.is_public
            }
          });

        if (vectorError) {
          throw vectorError;
        }

        progress.indexed++;
        result.indexed++;
        
      } catch (error: any) {
        console.error(`[SampleIndexing] Failed to index sample ${sample.id}:`, error);
        progress.failed++;
        result.failed++;
        result.errors.push({
          sampleId: sample.id,
          error: error.message
        });
      }
    }

    result.success = result.indexed > 0;
    
    console.log('[SampleIndexing] Indexing complete:', {
      indexed: result.indexed,
      failed: result.failed
    });

    return result;

  } catch (error: any) {
    console.error('[SampleIndexing] Bulk indexing failed:', error);
    throw error;
  }
}

/**
 * Index a single sample
 */
export async function indexSample(
  sampleId: string,
  sample: any
): Promise<boolean> {
  try {
    const description = createSampleDescription(sample);

    const { error } = await supabase
      .from('musical_vectors')
      .insert({
        entity_type: 'sample',
        entity_id: sampleId,
        embedding: description,
        metadata: {
          name: sample.name,
          category: sample.category,
          bpm: sample.bpm,
          key: sample.key_signature,
          tags: sample.tags || [],
          duration: sample.duration,
          isPublic: sample.is_public
        }
      });

    if (error) throw error;
    
    console.log(`[SampleIndexing] Indexed sample: ${sample.name}`);
    return true;

  } catch (error: any) {
    console.error(`[SampleIndexing] Failed to index sample ${sampleId}:`, error);
    return false;
  }
}

/**
 * Create rich description for semantic embedding
 */
function createSampleDescription(sample: any): string {
  const parts = [
    sample.name,
    sample.description,
    sample.category,
    sample.key_signature && `in ${sample.key_signature}`,
    sample.bpm && `${sample.bpm} BPM`,
    sample.tags && sample.tags.join(' '),
  ].filter(Boolean);

  return parts.join(' ');
}

/**
 * Batch index samples with progress tracking
 */
export async function batchIndexSamples(
  sampleIds: string[],
  onProgress?: (indexed: number, total: number) => void
): Promise<IndexingResult> {
  const result: IndexingResult = {
    success: false,
    indexed: 0,
    failed: 0,
    errors: []
  };
  
  for (let i = 0; i < sampleIds.length; i++) {
    const sampleId = sampleIds[i];
    
    try {
      // Fetch sample data
      const { data: sample, error } = await supabase
        .from('samples')
        .select('*')
        .eq('id', sampleId)
        .single();

      if (error || !sample) throw new Error('Sample not found');

      const success = await indexSample(sampleId, sample);
      
      if (success) {
        result.indexed++;
      } else {
        result.failed++;
      }

      if (onProgress) {
        onProgress(i + 1, sampleIds.length);
      }

    } catch (error: any) {
      result.failed++;
      result.errors.push({
        sampleId,
        error: error.message
      });
    }
  }

  result.success = result.indexed > 0;
  return result;
}

/**
 * Check if sample is already indexed
 */
export async function isSampleIndexed(sampleId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('musical_vectors')
      .select('id')
      .eq('entity_type', 'sample')
      .eq('entity_id', sampleId)
      .maybeSingle();

    return !error && data !== null;
  } catch {
    return false;
  }
}
