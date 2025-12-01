import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface AmapianorizationResult {
  id: string;
  user_id: string;
  source_audio_url: string;
  output_audio_url: string | null;
  settings: any;
  authenticity_score: number | null;
  elements_applied: string[];
  region: string | null;
  created_at: string;
  updated_at: string;
}

export const useAmapianorizationPersistence = () => {
  const { toast } = useToast();

  const saveResult = useCallback(async (
    sourceAudioUrl: string,
    outputAudioUrl: string | null,
    settings: any,
    authenticityScore: number | null,
    elementsApplied: string[],
    region: string | null
  ) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase
        .from('amapianorization_results')
        .insert({
          user_id: user.id,
          source_audio_url: sourceAudioUrl,
          output_audio_url: outputAudioUrl,
          settings,
          authenticity_score: authenticityScore,
          elements_applied: elementsApplied,
          region,
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Result Saved',
        description: 'Amapianorization result saved to database',
      });

      return data;
    } catch (error) {
      console.error('[AmapianorizationPersistence] Save failed:', error);
      toast({
        title: 'Save Failed',
        description: error instanceof Error ? error.message : 'Failed to save result',
        variant: 'destructive',
      });
      throw error;
    }
  }, [toast]);

  const loadResults = useCallback(async (region?: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      let query = supabase
        .from('amapianorization_results')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (region) {
        query = query.eq('region', region);
      }

      const { data, error } = await query;

      if (error) throw error;

      return data as AmapianorizationResult[];
    } catch (error) {
      console.error('[AmapianorizationPersistence] Load failed:', error);
      toast({
        title: 'Load Failed',
        description: error instanceof Error ? error.message : 'Failed to load results',
        variant: 'destructive',
      });
      throw error;
    }
  }, [toast]);

  const updateResult = useCallback(async (
    id: string,
    updates: Partial<Omit<AmapianorizationResult, 'id' | 'user_id' | 'created_at' | 'updated_at'>>
  ) => {
    try {
      const { error } = await supabase
        .from('amapianorization_results')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Result Updated',
        description: 'Amapianorization result updated successfully',
      });
    } catch (error) {
      console.error('[AmapianorizationPersistence] Update failed:', error);
      toast({
        title: 'Update Failed',
        description: error instanceof Error ? error.message : 'Failed to update result',
        variant: 'destructive',
      });
      throw error;
    }
  }, [toast]);

  const deleteResult = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from('amapianorization_results')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Result Deleted',
        description: 'Amapianorization result removed from database',
      });
    } catch (error) {
      console.error('[AmapianorizationPersistence] Delete failed:', error);
      toast({
        title: 'Delete Failed',
        description: error instanceof Error ? error.message : 'Failed to delete result',
        variant: 'destructive',
      });
      throw error;
    }
  }, [toast]);

  return {
    saveResult,
    loadResults,
    updateResult,
    deleteResult,
  };
};
