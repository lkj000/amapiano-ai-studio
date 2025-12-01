import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface GeneratedSample {
  id: string;
  user_id: string;
  sample_type: 'log_drum' | 'percussion' | 'bass' | 'piano';
  sample_url: string;
  metadata: any;
  region: string | null;
  bpm: number | null;
  key_signature: string | null;
  created_at: string;
}

export const useGeneratedSamplesPersistence = () => {
  const { toast } = useToast();

  const saveSample = useCallback(async (
    sampleType: 'log_drum' | 'percussion' | 'bass' | 'piano',
    sampleUrl: string,
    metadata: any = {},
    region: string | null = null,
    bpm: number | null = null,
    keySignature: string | null = null
  ) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase
        .from('generated_samples')
        .insert({
          user_id: user.id,
          sample_type: sampleType,
          sample_url: sampleUrl,
          metadata,
          region,
          bpm,
          key_signature: keySignature,
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Sample Saved',
        description: `${sampleType} sample saved to database`,
      });

      return data;
    } catch (error) {
      console.error('[GeneratedSamplesPersistence] Save failed:', error);
      toast({
        title: 'Save Failed',
        description: error instanceof Error ? error.message : 'Failed to save sample',
        variant: 'destructive',
      });
      throw error;
    }
  }, [toast]);

  const loadSamples = useCallback(async (
    sampleType?: 'log_drum' | 'percussion' | 'bass' | 'piano',
    region?: string
  ) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      let query = supabase
        .from('generated_samples')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (sampleType) {
        query = query.eq('sample_type', sampleType);
      }

      if (region) {
        query = query.eq('region', region);
      }

      const { data, error } = await query;

      if (error) throw error;

      return data as GeneratedSample[];
    } catch (error) {
      console.error('[GeneratedSamplesPersistence] Load failed:', error);
      toast({
        title: 'Load Failed',
        description: error instanceof Error ? error.message : 'Failed to load samples',
        variant: 'destructive',
      });
      throw error;
    }
  }, [toast]);

  const deleteSample = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from('generated_samples')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Sample Deleted',
        description: 'Sample removed from database',
      });
    } catch (error) {
      console.error('[GeneratedSamplesPersistence] Delete failed:', error);
      toast({
        title: 'Delete Failed',
        description: error instanceof Error ? error.message : 'Failed to delete sample',
        variant: 'destructive',
      });
      throw error;
    }
  }, [toast]);

  return {
    saveSample,
    loadSamples,
    deleteSample,
  };
};
