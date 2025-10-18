/**
 * Vector Search Hook - Musical Intelligence Search
 * Semantic search for samples, patterns, and plugins
 */

import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface VectorSearchResult {
  entityId: string;
  entityType: 'sample' | 'pattern' | 'project' | 'plugin';
  similarity: number;
  metadata: Record<string, any>;
}

export const useVectorSearch = () => {
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<VectorSearchResult[]>([]);

  /**
   * Generate embedding from text using AI
   * In production, this would call an edge function that uses OpenAI embeddings
   */
  const generateEmbedding = async (text: string): Promise<number[]> => {
    // Mock embedding generation - in production, call edge function
    // that uses OpenAI's text-embedding-3-small or similar
    console.log('[VectorSearch] Generating embedding for:', text);
    
    // Return mock 1536-dimensional vector
    return Array(1536).fill(0).map(() => Math.random());
  };

  /**
   * Search for similar musical content
   */
  const searchSimilar = useCallback(async (
    query: string,
    entityType?: 'sample' | 'pattern' | 'project' | 'plugin',
    limit: number = 10
  ) => {
    setIsSearching(true);
    setResults([]);

    try {
      // Generate query embedding
      const embeddingArray = await generateEmbedding(query);
      const embedding = `[${embeddingArray.join(',')}]`;

      // Call vector search function
      const { data, error } = await supabase.rpc('search_similar_music', {
        query_embedding: embedding as any,
        entity_type_filter: entityType || null,
        match_count: limit,
      });

      if (error) throw error;

      const searchResults: VectorSearchResult[] = (data || []).map((item: any) => ({
        entityId: item.entity_id,
        entityType: item.entity_type,
        similarity: item.similarity,
        metadata: item.metadata,
      }));

      setResults(searchResults);
      return searchResults;
    } catch (error: any) {
      console.error('[VectorSearch] Search error:', error);
      toast({
        title: "Search Failed",
        description: error.message,
        variant: "destructive",
      });
      return [];
    } finally {
      setIsSearching(false);
    }
  }, []);

  /**
   * Add a new musical vector to the database
   */
  const addVector = useCallback(async (
    entityType: 'sample' | 'pattern' | 'project' | 'plugin',
    entityId: string,
    description: string,
    metadata: Record<string, any> = {}
  ) => {
    try {
      const embeddingArray = await generateEmbedding(description);
      const embedding = `[${embeddingArray.join(',')}]`;

      const { data, error } = await supabase.rpc('add_musical_vector', {
        p_entity_type: entityType,
        p_entity_id: entityId,
        p_embedding: embedding as any,
        p_metadata: metadata,
      });

      if (error) throw error;

      toast({
        title: "Vector Added",
        description: "Musical content indexed for semantic search",
      });

      return data;
    } catch (error: any) {
      console.error('[VectorSearch] Add vector error:', error);
      toast({
        title: "Indexing Failed",
        description: error.message,
        variant: "destructive",
      });
      return null;
    }
  }, []);

  /**
   * Search by example - find similar content to an existing entity
   */
  const searchByExample = useCallback(async (
    entityId: string,
    entityType?: 'sample' | 'pattern' | 'project' | 'plugin',
    limit: number = 10
  ) => {
    try {
      // Get the vector for the example entity
      const { data: vectorData, error: vectorError } = await supabase
        .from('musical_vectors')
        .select('embedding')
        .eq('entity_id', entityId)
        .single();

      if (vectorError) throw vectorError;
      if (!vectorData?.embedding) throw new Error('Entity not indexed');

      // Search for similar vectors
      const { data, error } = await supabase.rpc('search_similar_music', {
        query_embedding: vectorData.embedding,
        entity_type_filter: entityType || null,
        match_count: limit + 1, // +1 to exclude the query entity itself
      });

      if (error) throw error;

      // Filter out the query entity itself
      const filtered = (data || []).filter((item: any) => item.entity_id !== entityId);

      const searchResults: VectorSearchResult[] = filtered.slice(0, limit).map((item: any) => ({
        entityId: item.entity_id,
        entityType: item.entity_type,
        similarity: item.similarity,
        metadata: item.metadata,
      }));

      setResults(searchResults);
      return searchResults;
    } catch (error: any) {
      console.error('[VectorSearch] Example search error:', error);
      toast({
        title: "Example Search Failed",
        description: error.message,
        variant: "destructive",
      });
      return [];
    }
  }, []);

  return {
    isSearching,
    results,
    searchSimilar,
    searchByExample,
    addVector,
  };
};
