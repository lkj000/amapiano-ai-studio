/**
 * Samples Library Hook - Real Supabase Integration
 * Fetches samples from sample_library table
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Sample {
  id: string;
  name: string;
  artist: string;
  category: string;
  genre: string;
  bpm: number | null;
  key: string | null;
  duration: string;
  rating: number;
  downloads: number;
  tags: string[];
  audioUrl: string;
  isLiked: boolean;
}

export function useSamplesLibrary() {
  const queryClient = useQueryClient();

  // Fetch samples from sample_library table
  const { data: samples = [], isLoading, error } = useQuery({
    queryKey: ['samples-library'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Get public samples or user's own samples
      let query = supabase
        .from('sample_library')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (user) {
        query = query.or(`is_public.eq.true,user_id.eq.${user.id}`);
      } else {
        query = query.eq('is_public', true);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching samples:', error);
        throw error;
      }

      // Transform database records to Sample interface
      return (data || []).map((sample): Sample => ({
        id: sample.id,
        name: sample.name,
        artist: sample.pack_name || 'Unknown Artist',
        category: sample.category || 'Other',
        genre: sample.sample_type || 'Amapiano',
        bpm: sample.bpm,
        key: sample.key_signature,
        duration: sample.duration_seconds ? formatDuration(sample.duration_seconds) : '0:00',
        rating: 4.5, // Default rating since not in schema
        downloads: sample.download_count || 0,
        tags: sample.tags || [],
        audioUrl: sample.audio_url,
        isLiked: sample.is_favorite || false,
      }));
    },
  });

  // Toggle favorite
  const toggleFavorite = useMutation({
    mutationFn: async (sampleId: string) => {
      const sample = samples.find(s => s.id === sampleId);
      if (!sample) throw new Error('Sample not found');

      const { error } = await supabase
        .from('sample_library')
        .update({ is_favorite: !sample.isLiked })
        .eq('id', sampleId);

      if (error) throw error;
      return { sampleId, isLiked: !sample.isLiked };
    },
    onSuccess: ({ isLiked }) => {
      queryClient.invalidateQueries({ queryKey: ['samples-library'] });
      toast.success(isLiked ? 'Added to favorites' : 'Removed from favorites');
    },
    onError: () => {
      toast.error('Failed to update favorite');
    }
  });

  // Download sample
  const downloadSample = useMutation({
    mutationFn: async ({ sampleId, sampleName, audioUrl }: { sampleId: string; sampleName: string; audioUrl: string }) => {
      // Increment download count
      await supabase
        .from('sample_library')
        .update({ 
          download_count: (samples.find(s => s.id === sampleId)?.downloads || 0) + 1 
        })
        .eq('id', sampleId);

      // Trigger download
      const response = await fetch(audioUrl);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `${sampleName.replace(/\s+/g, '_')}.wav`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      return { sampleId, sampleName };
    },
    onSuccess: ({ sampleName }) => {
      queryClient.invalidateQueries({ queryKey: ['samples-library'] });
      toast.success(`Downloaded "${sampleName}"`);
    },
    onError: () => {
      toast.error('Download failed');
    }
  });

  return {
    samples,
    isLoading,
    error,
    toggleFavorite,
    downloadSample,
  };
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
