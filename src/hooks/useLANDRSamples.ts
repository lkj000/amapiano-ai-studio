/**
 * LANDR Samples Hook
 * Handles LANDR-style sample browsing with Supabase
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useState } from 'react';

export interface LANDRSamplePack {
  id: string;
  name: string;
  artist: string;
  genre: string;
  sampleCount: number;
  imageUrl?: string;
  isExclusive?: boolean;
  isNew?: boolean;
  price_cents: number;
  downloads: number;
  rating: number;
  created_at: string;
}

export interface LANDRSample {
  id: string;
  name: string;
  pack_name: string | null;
  category: string;
  audio_url: string;
  bpm: number | null;
  key_signature: string | null;
  duration_seconds: number | null;
  tags: string[];
  is_favorite: boolean;
  download_count: number;
}

export function useLANDRSamples() {
  const queryClient = useQueryClient();
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  // Fetch sample packs from marketplace
  const { data: packs = [], isLoading: packsLoading } = useQuery({
    queryKey: ['landr-sample-packs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('marketplace_items')
        .select('*')
        .eq('category', 'sample-pack')
        .eq('active', true)
        .order('downloads', { ascending: false });

      if (error) throw error;

      return (data || []).map(item => ({
        id: item.id,
        name: item.name,
        artist: item.seller_id ? 'LANDR' : 'Community',
        genre: item.subcategory || 'Various',
        sampleCount: (item.tags?.length || 0) * 10 + 50, // Estimate
        imageUrl: item.image_url,
        isExclusive: item.featured,
        isNew: new Date(item.created_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        price_cents: item.price_cents,
        downloads: item.downloads || 0,
        rating: item.rating || 0,
        created_at: item.created_at
      })) as LANDRSamplePack[];
    }
  });

  // Fetch individual samples from sample_library
  const { data: samples = [], isLoading: samplesLoading } = useQuery({
    queryKey: ['landr-samples'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sample_library')
        .select('*')
        .eq('is_public', true)
        .order('download_count', { ascending: false })
        .limit(100);

      if (error) throw error;
      return data as LANDRSample[];
    }
  });

  // Toggle favorite
  const toggleFavorite = (id: string) => {
    setFavorites(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        toast.success('Removed from favorites');
      } else {
        next.add(id);
        toast.success('Added to favorites');
      }
      return next;
    });
  };

  // Download pack
  const downloadPack = useMutation({
    mutationFn: async (pack: LANDRSamplePack) => {
      if (pack.price_cents > 0) {
        // Would trigger purchase flow
        toast.info('Redirecting to purchase...');
        return;
      }

      // Increment download count
      await supabase
        .from('marketplace_items')
        .update({ downloads: (pack.downloads || 0) + 1 })
        .eq('id', pack.id);

      return pack;
    },
    onSuccess: (pack) => {
      if (pack) {
        queryClient.invalidateQueries({ queryKey: ['landr-sample-packs'] });
        toast.success(`Downloading ${pack.name}...`, {
          description: `${pack.sampleCount} samples`
        });
      }
    }
  });

  // Download individual sample
  const downloadSample = useMutation({
    mutationFn: async (sample: LANDRSample) => {
      // Increment download count
      await supabase
        .from('sample_library')
        .update({ download_count: (sample.download_count || 0) + 1 })
        .eq('id', sample.id);

      // Trigger actual download
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

      return sample;
    },
    onSuccess: (sample) => {
      queryClient.invalidateQueries({ queryKey: ['landr-samples'] });
      toast.success(`Downloaded: ${sample.name}`);
    },
    onError: () => {
      toast.error('Download failed');
    }
  });

  return {
    packs,
    samples,
    isLoading: packsLoading || samplesLoading,
    favorites,
    toggleFavorite,
    downloadPack,
    downloadSample
  };
}
