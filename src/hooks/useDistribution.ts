/**
 * Distribution Hook
 * Handles music distribution releases with Supabase
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useState } from 'react';

export interface DistributionRelease {
  id: string;
  user_id: string;
  title: string;
  artist_name: string;
  album_name: string | null;
  genre: string;
  subgenre: string | null;
  audio_url: string;
  artwork_url: string | null;
  release_date: string | null;
  upc_code: string | null;
  isrc_code: string | null;
  copyright: string | null;
  record_label: string | null;
  description: string | null;
  lyrics: string | null;
  is_explicit: boolean;
  region: string | null;
  status: 'draft' | 'pending' | 'processing' | 'live' | 'rejected';
  platforms: string[];
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

interface CreateReleaseParams {
  title: string;
  artistName: string;
  albumName?: string;
  genre?: string;
  subgenre?: string;
  audioFile: File;
  artworkFile?: File;
  releaseDate?: string;
  copyright?: string;
  recordLabel?: string;
  description?: string;
  lyrics?: string;
  isExplicit?: boolean;
  region?: string;
  platforms?: string[];
}

export function useDistribution() {
  const queryClient = useQueryClient();
  const [uploadProgress, setUploadProgress] = useState(0);

  // Fetch user's releases
  const { data: releases = [], isLoading, error, refetch } = useQuery({
    queryKey: ['distribution-releases'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('distribution_releases')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as DistributionRelease[];
    },
  });

  // Create a new release
  const createRelease = useMutation({
    mutationFn: async (params: CreateReleaseParams) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Must be logged in to create releases');

      setUploadProgress(0);

      // Upload audio file
      const audioExt = params.audioFile.name.split('.').pop();
      const audioFileName = `${user.id}/releases/${Date.now()}-${params.title.replace(/\s+/g, '-')}.${audioExt}`;

      const { error: audioError } = await supabase.storage
        .from('audio-samples')
        .upload(audioFileName, params.audioFile, {
          cacheControl: '3600',
          upsert: false,
        });

      if (audioError) throw audioError;

      setUploadProgress(40);

      const { data: { publicUrl: audioUrl } } = supabase.storage
        .from('audio-samples')
        .getPublicUrl(audioFileName);

      // Upload artwork if provided
      let artworkUrl: string | null = null;
      if (params.artworkFile) {
        const artworkExt = params.artworkFile.name.split('.').pop();
        const artworkFileName = `${user.id}/artwork/${Date.now()}-${params.title.replace(/\s+/g, '-')}.${artworkExt}`;

        const { error: artworkError } = await supabase.storage
          .from('audio-samples')
          .upload(artworkFileName, params.artworkFile, {
            cacheControl: '3600',
            upsert: false,
          });

        if (artworkError) throw artworkError;

        const { data: { publicUrl } } = supabase.storage
          .from('audio-samples')
          .getPublicUrl(artworkFileName);
        
        artworkUrl = publicUrl;
      }

      setUploadProgress(70);

      // Generate deterministic UPC and ISRC codes based on user + title + timestamp
      const seed = `${user.id}:${params.title}:${Date.now()}`;
      const upcCode = generateUPC(seed);
      const isrcCode = generateISRC(seed);

      // Create release record
      const { data, error: insertError } = await supabase
        .from('distribution_releases')
        .insert({
          user_id: user.id,
          title: params.title,
          artist_name: params.artistName,
          album_name: params.albumName,
          genre: params.genre || 'Amapiano',
          subgenre: params.subgenre,
          audio_url: audioUrl,
          artwork_url: artworkUrl,
          release_date: params.releaseDate,
          upc_code: upcCode,
          isrc_code: isrcCode,
          copyright: params.copyright,
          record_label: params.recordLabel,
          description: params.description,
          lyrics: params.lyrics,
          is_explicit: params.isExplicit || false,
          region: params.region,
          status: 'pending',
          platforms: params.platforms || [],
        })
        .select()
        .single();

      if (insertError) throw insertError;

      setUploadProgress(100);
      return data as DistributionRelease;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['distribution-releases'] });
      toast.success('Release submitted for distribution!');
      setUploadProgress(0);
    },
    onError: (error) => {
      console.error('Release error:', error);
      toast.error('Failed to submit release');
      setUploadProgress(0);
    },
  });

  // Update release status
  const updateReleaseStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: DistributionRelease['status'] }) => {
      const { error } = await supabase
        .from('distribution_releases')
        .update({ status })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['distribution-releases'] });
    },
  });

  // Delete release
  const deleteRelease = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('distribution_releases')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['distribution-releases'] });
      toast.success('Release deleted');
    },
    onError: () => {
      toast.error('Failed to delete release');
    },
  });

  return {
    releases,
    isLoading,
    error,
    refetch,
    createRelease,
    updateReleaseStatus,
    deleteRelease,
    uploadProgress,
  };
}

/**
 * Deterministic CRC-style hash of an input string.
 * Returns a non-negative 32-bit integer.
 */
function crc32Hash(input: string): number {
  let hash = 0xffffffff;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    for (let j = 0; j < 8; j++) {
      hash = hash & 1 ? (hash >>> 1) ^ 0xedb88320 : hash >>> 1;
    }
  }
  return (hash ^ 0xffffffff) >>> 0; // unsigned 32-bit
}

/**
 * Generate a deterministic UPC-A code (12 digits) from a seed string.
 * Derived from a CRC-style hash — not a registered GS1 UPC.
 */
function generateUPC(seed: string): string {
  const hash = crc32Hash(seed);
  // Pad hash to 11 digits (UPC-A body without check digit)
  const body = hash.toString().padStart(11, '0').slice(0, 11);
  // Calculate UPC-A check digit
  let odd = 0;
  let even = 0;
  for (let i = 0; i < 11; i++) {
    const d = parseInt(body[i], 10);
    if (i % 2 === 0) odd += d;
    else even += d;
  }
  const checkDigit = (10 - ((odd * 3 + even) % 10)) % 10;
  return body + checkDigit;
}

/**
 * Generate a deterministic ISRC code from a seed string.
 * Format: ZA-AB1-{YY}-{5-digit hash}
 * Derived from a hash — not issued by an official ISRC registrar.
 */
function generateISRC(seed: string): string {
  const countryCode = 'ZA'; // South Africa
  const registrantCode = 'AB1';
  const year = new Date().getFullYear().toString().slice(-2);
  const hash = crc32Hash(seed);
  const designation = (hash % 100000).toString().padStart(5, '0');
  return `${countryCode}-${registrantCode}-${year}-${designation}`;
}
