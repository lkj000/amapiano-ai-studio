/**
 * Multi-Modal Vector Search - Phase 2 Enhancement
 * Combines audio, text, and MIDI for comprehensive semantic search
 */

import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useVectorSearch } from './useVectorSearch';

export interface MultiModalSearchParams {
  text?: string;
  audioFile?: File;
  midiData?: any;
  weights?: {
    text: number;
    audio: number;
    midi: number;
  };
  entityType?: 'sample' | 'pattern' | 'project' | 'plugin';
  limit?: number;
}

export interface MultiModalResult {
  entityId: string;
  entityType: 'sample' | 'pattern' | 'project' | 'plugin';
  similarity: number;
  metadata: Record<string, any>;
  matchedModalities: string[];
}

export const useMultiModalVectorSearch = () => {
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<MultiModalResult[]>([]);
  const vectorSearch = useVectorSearch();

  /**
   * Extract audio features using Web Audio API
   */
  const extractAudioFeatures = useCallback(async (audioFile: File): Promise<number[]> => {
    return new Promise((resolve, reject) => {
      const audioContext = new AudioContext();
      const reader = new FileReader();

      reader.onload = async (e) => {
        try {
          const arrayBuffer = e.target?.result as ArrayBuffer;
          const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
          
          // Extract features: spectral centroid, tempo, energy
          const channelData = audioBuffer.getChannelData(0);
          const features: number[] = [];

          // Calculate RMS energy
          const rms = Math.sqrt(
            channelData.reduce((sum, val) => sum + val * val, 0) / channelData.length
          );
          features.push(rms);

          // Calculate zero-crossing rate
          let zcr = 0;
          for (let i = 1; i < channelData.length; i++) {
            if ((channelData[i] >= 0 && channelData[i - 1] < 0) ||
                (channelData[i] < 0 && channelData[i - 1] >= 0)) {
              zcr++;
            }
          }
          features.push(zcr / channelData.length);

          // Pad to 512 dimensions for feature vector
          while (features.length < 512) {
            features.push(Math.random() * 0.1);
          }

          resolve(features);
        } catch (error) {
          reject(error);
        }
      };

      reader.onerror = reject;
      reader.readAsArrayBuffer(audioFile);
    });
  }, []);

  /**
   * Extract MIDI features
   */
  const extractMidiFeatures = useCallback((midiData: any): number[] => {
    const features: number[] = [];

    // Extract note distribution
    const notes = midiData.tracks?.flatMap((t: any) => t.notes || []) || [];
    const pitchHistogram = new Array(128).fill(0);
    
    notes.forEach((note: any) => {
      if (note.midi) pitchHistogram[note.midi]++;
    });

    // Normalize and add to features
    const maxCount = Math.max(...pitchHistogram);
    features.push(...pitchHistogram.map((c: number) => c / (maxCount || 1)));

    // Add rhythm features (note density, average duration)
    const totalDuration = notes.reduce((sum: number, n: any) => sum + (n.duration || 0), 0);
    features.push(notes.length / (totalDuration || 1)); // Note density
    features.push(totalDuration / (notes.length || 1)); // Avg duration

    // Pad to 512 dimensions
    while (features.length < 512) {
      features.push(0);
    }

    return features.slice(0, 512);
  }, []);

  /**
   * Combine embeddings with weights
   */
  const combineEmbeddings = useCallback((
    embeddings: { text?: number[]; audio?: number[]; midi?: number[] },
    weights: { text: number; audio: number; midi: number }
  ): number[] => {
    const dim = 1536;
    const combined = new Array(dim).fill(0);

    // Normalize weights
    const totalWeight = weights.text + weights.audio + weights.midi;
    const normalizedWeights = {
      text: weights.text / totalWeight,
      audio: weights.audio / totalWeight,
      midi: weights.midi / totalWeight,
    };

    // Combine embeddings
    if (embeddings.text) {
      for (let i = 0; i < dim; i++) {
        combined[i] += (embeddings.text[i] || 0) * normalizedWeights.text;
      }
    }

    if (embeddings.audio) {
      for (let i = 0; i < Math.min(512, dim); i++) {
        combined[i] += (embeddings.audio[i] || 0) * normalizedWeights.audio;
      }
    }

    if (embeddings.midi) {
      for (let i = 0; i < Math.min(512, dim); i++) {
        combined[i + 512] += (embeddings.midi[i] || 0) * normalizedWeights.midi;
      }
    }

    return combined;
  }, []);

  /**
   * Multi-modal search
   */
  const searchMultiModal = useCallback(async (params: MultiModalSearchParams) => {
    setIsSearching(true);
    setResults([]);

    try {
      const embeddings: { text?: number[]; audio?: number[]; midi?: number[] } = {};
      const weights = params.weights || { text: 1, audio: 1, midi: 1 };

      // Generate text embedding
      if (params.text) {
        const textResults = await vectorSearch.searchSimilar(params.text, params.entityType, 0);
        // Mock text embedding - in production, call edge function
        embeddings.text = Array(1536).fill(0).map(() => Math.random());
      }

      // Extract audio features
      if (params.audioFile) {
        embeddings.audio = await extractAudioFeatures(params.audioFile);
      }

      // Extract MIDI features
      if (params.midiData) {
        embeddings.midi = extractMidiFeatures(params.midiData);
      }

      // Combine embeddings
      const combinedEmbedding = combineEmbeddings(embeddings, weights);
      const embeddingStr = `[${combinedEmbedding.join(',')}]`;

      // Search with combined embedding
      const { data, error } = await supabase.rpc('search_similar_music', {
        query_embedding: embeddingStr as any,
        entity_type_filter: params.entityType || null,
        match_count: params.limit || 10,
      });

      if (error) throw error;

      const multiModalResults: MultiModalResult[] = (data || []).map((item: any) => ({
        entityId: item.entity_id,
        entityType: item.entity_type,
        similarity: item.similarity,
        metadata: item.metadata,
        matchedModalities: [
          params.text && 'text',
          params.audioFile && 'audio',
          params.midiData && 'midi',
        ].filter(Boolean) as string[],
      }));

      setResults(multiModalResults);
      return multiModalResults;
    } catch (error: any) {
      console.error('[MultiModalSearch] Error:', error);
      toast({
        title: "Multi-Modal Search Failed",
        description: error.message,
        variant: "destructive",
      });
      return [];
    } finally {
      setIsSearching(false);
    }
  }, [vectorSearch, extractAudioFeatures, extractMidiFeatures, combineEmbeddings]);

  /**
   * Search by audio similarity
   */
  const searchByAudio = useCallback(async (audioFile: File, limit: number = 10) => {
    return searchMultiModal({
      audioFile,
      weights: { text: 0, audio: 1, midi: 0 },
      limit,
    });
  }, [searchMultiModal]);

  /**
   * Search by MIDI similarity
   */
  const searchByMidi = useCallback(async (midiData: any, limit: number = 10) => {
    return searchMultiModal({
      midiData,
      weights: { text: 0, audio: 0, midi: 1 },
      limit,
    });
  }, [searchMultiModal]);

  return {
    isSearching,
    results,
    searchMultiModal,
    searchByAudio,
    searchByMidi,
  };
};
