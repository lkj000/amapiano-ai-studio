import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface UserStudyResponse {
  id: string;
  user_id: string;
  baseline_audio_url: string;
  amapianorized_audio_url: string;
  authenticity_rating: number;
  feedback: string | null;
  producer_experience: 'beginner' | 'intermediate' | 'advanced' | 'professional';
  familiarity_with_amapiano: 'none' | 'listener' | 'producer' | 'expert';
  created_at: string;
}

export const useUserStudyPersistence = () => {
  const { toast } = useToast();

  const submitResponse = useCallback(async (
    baselineAudioUrl: string,
    amapianorizedAudioUrl: string,
    authenticityRating: number,
    feedback: string | null,
    producerExperience: 'beginner' | 'intermediate' | 'advanced' | 'professional',
    familiarityWithAmapiano: 'none' | 'listener' | 'producer' | 'expert'
  ) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      if (authenticityRating < 1 || authenticityRating > 10) {
        throw new Error('Authenticity rating must be between 1 and 10');
      }

      const { data, error } = await supabase
        .from('user_study_responses')
        .insert({
          user_id: user.id,
          baseline_audio_url: baselineAudioUrl,
          amapianorized_audio_url: amapianorizedAudioUrl,
          authenticity_rating: authenticityRating,
          feedback,
          producer_experience: producerExperience,
          familiarity_with_amapiano: familiarityWithAmapiano,
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Response Submitted',
        description: 'Thank you for participating in the study!',
      });

      return data;
    } catch (error) {
      console.error('[UserStudyPersistence] Submit failed:', error);
      toast({
        title: 'Submit Failed',
        description: error instanceof Error ? error.message : 'Failed to submit response',
        variant: 'destructive',
      });
      throw error;
    }
  }, [toast]);

  const loadMyResponses = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase
        .from('user_study_responses')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data as UserStudyResponse[];
    } catch (error) {
      console.error('[UserStudyPersistence] Load failed:', error);
      toast({
        title: 'Load Failed',
        description: error instanceof Error ? error.message : 'Failed to load responses',
        variant: 'destructive',
      });
      throw error;
    }
  }, [toast]);

  const loadAllResponses = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('user_study_responses')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data as UserStudyResponse[];
    } catch (error) {
      console.error('[UserStudyPersistence] Load all failed:', error);
      toast({
        title: 'Load Failed',
        description: error instanceof Error ? error.message : 'Failed to load all responses',
        variant: 'destructive',
      });
      throw error;
    }
  }, [toast]);

  return {
    submitResponse,
    loadMyResponses,
    loadAllResponses,
  };
};
