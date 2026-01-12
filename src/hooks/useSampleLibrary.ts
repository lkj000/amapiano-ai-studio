/**
 * Sample Library Hook
 * Handles sample CRUD operations with Supabase
 */

import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Sample {
  id: string;
  user_id: string | null;
  name: string;
  pack_name: string | null;
  category: string;
  sample_type: 'loop' | 'oneshot' | 'midi';
  audio_url: string;
  bpm: number | null;
  key_signature: string | null;
  duration_seconds: number | null;
  file_size_bytes: number | null;
  tags: string[];
  is_public: boolean;
  is_favorite: boolean;
  download_count: number;
  created_at: string;
  updated_at: string;
}

interface UploadSampleParams {
  file: File;
  name: string;
  category: string;
  sampleType: 'loop' | 'oneshot' | 'midi';
  bpm?: number;
  keySignature?: string;
  tags?: string[];
  isPublic?: boolean;
  packName?: string;
}

export function useSampleLibrary() {
  const queryClient = useQueryClient();
  const [uploadProgress, setUploadProgress] = useState(0);

  // Fetch all samples (public + user's own)
  const { data: samples = [], isLoading, error, refetch } = useQuery({
    queryKey: ['sample-library'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sample_library')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Sample[];
    },
  });

  // Upload a new sample
  const uploadSample = useMutation({
    mutationFn: async (params: UploadSampleParams) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Must be logged in to upload samples');

      setUploadProgress(0);

      // Generate unique filename
      const fileExt = params.file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}-${params.name.replace(/\s+/g, '-')}.${fileExt}`;

      // Upload to storage
      const { error: uploadError, data: uploadData } = await supabase.storage
        .from('samples')
        .upload(fileName, params.file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) throw uploadError;

      setUploadProgress(50);

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('samples')
        .getPublicUrl(fileName);

      // Get audio duration
      const duration = await getAudioDuration(params.file);

      setUploadProgress(75);

      // Insert into database
      const { data, error: insertError } = await supabase
        .from('sample_library')
        .insert({
          user_id: user.id,
          name: params.name,
          pack_name: params.packName,
          category: params.category,
          sample_type: params.sampleType,
          audio_url: publicUrl,
          bpm: params.bpm,
          key_signature: params.keySignature,
          duration_seconds: duration,
          file_size_bytes: params.file.size,
          tags: params.tags || [],
          is_public: params.isPublic ?? false,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      setUploadProgress(100);
      return data as Sample;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sample-library'] });
      toast.success('Sample uploaded successfully!');
      setUploadProgress(0);
    },
    onError: (error) => {
      console.error('Upload error:', error);
      toast.error('Failed to upload sample');
      setUploadProgress(0);
    },
  });

  // Toggle favorite
  const toggleFavorite = useMutation({
    mutationFn: async (sampleId: string) => {
      const sample = samples.find(s => s.id === sampleId);
      if (!sample) throw new Error('Sample not found');

      const { error } = await supabase
        .from('sample_library')
        .update({ is_favorite: !sample.is_favorite })
        .eq('id', sampleId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sample-library'] });
    },
  });

  // Delete sample
  const deleteSample = useMutation({
    mutationFn: async (sampleId: string) => {
      const sample = samples.find(s => s.id === sampleId);
      if (!sample) throw new Error('Sample not found');

      // Delete from storage
      const urlParts = sample.audio_url.split('/');
      const filePath = urlParts.slice(-2).join('/');
      
      await supabase.storage
        .from('samples')
        .remove([filePath]);

      // Delete from database
      const { error } = await supabase
        .from('sample_library')
        .delete()
        .eq('id', sampleId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sample-library'] });
      toast.success('Sample deleted');
    },
    onError: (error) => {
      console.error('Delete error:', error);
      toast.error('Failed to delete sample');
    },
  });

  // Increment download count
  const incrementDownload = useCallback(async (sampleId: string) => {
    const sample = samples.find(s => s.id === sampleId);
    if (!sample) return;

    await supabase
      .from('sample_library')
      .update({ download_count: sample.download_count + 1 })
      .eq('id', sampleId);

    queryClient.invalidateQueries({ queryKey: ['sample-library'] });
  }, [samples, queryClient]);

  // Download sample file
  const downloadSample = useCallback(async (sample: Sample) => {
    try {
      const response = await fetch(sample.audio_url);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `${sample.name}.${sample.audio_url.split('.').pop()}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      await incrementDownload(sample.id);
      toast.success(`Downloaded: ${sample.name}`);
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download sample');
    }
  }, [incrementDownload]);

  return {
    samples,
    isLoading,
    error,
    refetch,
    uploadSample,
    toggleFavorite,
    deleteSample,
    downloadSample,
    uploadProgress,
  };
}

// Helper to get audio duration
async function getAudioDuration(file: File): Promise<number> {
  return new Promise((resolve) => {
    const audio = new Audio();
    audio.onloadedmetadata = () => {
      resolve(audio.duration);
    };
    audio.onerror = () => {
      resolve(0);
    };
    audio.src = URL.createObjectURL(file);
  });
}
