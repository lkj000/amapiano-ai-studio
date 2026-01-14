import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface AudioAnalysisResult {
  id: string;
  user_id: string;
  audio_url: string;
  analysis_type: 'essentia' | 'unified' | 'comprehensive';
  analysis_data: any;
  created_at: string;
  updated_at: string;
}

export const useAudioAnalysisPersistence = () => {
  const { toast } = useToast();

  const saveAnalysis = useCallback(async (
    audioUrl: string,
    analysisType: 'essentia' | 'unified' | 'comprehensive',
    analysisData: any
  ) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Optimize analysis data to prevent timeout - only store essential fields
      const optimizedData = {
        bpm: analysisData?.bpm ?? analysisData?.rhythm?.bpm,
        key: analysisData?.key ?? analysisData?.tonal?.key,
        scale: analysisData?.scale ?? analysisData?.tonal?.scale,
        energy: analysisData?.energy ?? analysisData?.spectral?.energy,
        danceability: analysisData?.danceability ?? analysisData?.highLevel?.danceability,
        genre: analysisData?.genre ?? analysisData?.highLevel?.genre,
        mood: analysisData?.mood ?? analysisData?.highLevel?.mood,
        spectral: {
          centroid: analysisData?.spectral?.centroid,
          rolloff: analysisData?.spectral?.rolloff,
          flatness: analysisData?.spectral?.flatness,
        },
        timestamp: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('audio_analysis_results')
        .insert({
          user_id: user.id,
          audio_url: audioUrl,
          analysis_type: analysisType,
          analysis_data: optimizedData,
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Analysis Saved',
        description: 'Audio analysis results saved to database',
      });

      return data;
    } catch (error) {
      console.error('[AudioAnalysisPersistence] Save failed:', error);
      toast({
        title: 'Save Failed',
        description: error instanceof Error ? error.message : 'Failed to save analysis',
        variant: 'destructive',
      });
      throw error;
    }
  }, [toast]);

  const loadAnalyses = useCallback(async (
    analysisType?: 'essentia' | 'unified' | 'comprehensive'
  ) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      let query = supabase
        .from('audio_analysis_results')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (analysisType) {
        query = query.eq('analysis_type', analysisType);
      }

      const { data, error } = await query;

      if (error) throw error;

      return data as AudioAnalysisResult[];
    } catch (error) {
      console.error('[AudioAnalysisPersistence] Load failed:', error);
      toast({
        title: 'Load Failed',
        description: error instanceof Error ? error.message : 'Failed to load analyses',
        variant: 'destructive',
      });
      throw error;
    }
  }, [toast]);

  const deleteAnalysis = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from('audio_analysis_results')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Analysis Deleted',
        description: 'Analysis result removed from database',
      });
    } catch (error) {
      console.error('[AudioAnalysisPersistence] Delete failed:', error);
      toast({
        title: 'Delete Failed',
        description: error instanceof Error ? error.message : 'Failed to delete analysis',
        variant: 'destructive',
      });
      throw error;
    }
  }, [toast]);

  return {
    saveAnalysis,
    loadAnalyses,
    deleteAnalysis,
  };
};
