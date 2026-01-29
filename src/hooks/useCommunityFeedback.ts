import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface CommunityFeedbackRatings {
  cultural?: number;
  swing?: number;
  overall?: number;
  linguisticAlignment?: number;
}

export interface CommunityFeedbackParams {
  patternId?: string;
  modelVersion?: string;
  outputType?: 'pattern' | 'lyrics' | 'vocals' | 'instrumental' | 'full_song';
  generationParams?: Record<string, unknown>;
  sessionId?: string;
  generationTimeMs?: number;
  confidenceScore?: number;
}

export interface FeedbackSubmission extends CommunityFeedbackRatings {
  text?: string;
  tags?: string[];
  isFavorite?: boolean;
}

export const useCommunityFeedback = (params: CommunityFeedbackParams = {}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastSubmission, setLastSubmission] = useState<string | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  const {
    patternId,
    modelVersion = 'si-v1.0-base',
    outputType = 'pattern',
    generationParams = {},
    sessionId,
    generationTimeMs,
    confidenceScore
  } = params;

  const submitFeedback = useCallback(async (feedback: FeedbackSubmission) => {
    if (!user) {
      toast({
        title: 'Authentication required',
        description: 'Please sign in to submit feedback.',
        variant: 'destructive'
      });
      return { success: false, error: 'Not authenticated' };
    }

    // Validate at least one rating is provided
    if (!feedback.cultural && !feedback.swing && !feedback.overall && !feedback.isFavorite) {
      toast({
        title: 'Feedback required',
        description: 'Please provide at least one rating or mark as favorite.',
        variant: 'destructive'
      });
      return { success: false, error: 'No feedback provided' };
    }

    setIsSubmitting(true);

    try {
      const { data, error } = await supabase
        .from('community_feedback')
        .insert([{
          user_id: user.id,
          pattern_id: patternId || null,
          cultural_authenticity_rating: feedback.cultural || null,
          rhythmic_swing_rating: feedback.swing || null,
          overall_rating: feedback.overall || null,
          linguistic_alignment_score: feedback.linguisticAlignment || null,
          model_version: modelVersion,
          generation_params: JSON.parse(JSON.stringify(generationParams)),
          output_type: outputType,
          is_favorite: feedback.isFavorite || false,
          is_ground_truth: (feedback.cultural && feedback.cultural >= 4) || false,
          text_feedback: feedback.text || null,
          tags: feedback.tags?.length ? feedback.tags : null,
          session_id: sessionId || null,
          generation_time_ms: generationTimeMs || null,
          confidence_score: confidenceScore || null
        }])
        .select('id')
        .single();

      if (error) throw error;

      setLastSubmission(data.id);
      
      toast({
        title: 'Feedback submitted',
        description: 'Thank you for helping train our AI!'
      });

      return { success: true, id: data.id };
    } catch (error) {
      console.error('Community feedback error:', error);
      toast({
        title: 'Submission failed',
        description: 'Failed to submit feedback. Please try again.',
        variant: 'destructive'
      });
      return { success: false, error };
    } finally {
      setIsSubmitting(false);
    }
  }, [user, patternId, modelVersion, outputType, generationParams, sessionId, generationTimeMs, confidenceScore, toast]);

  const markAsFavorite = useCallback(async (feedbackId?: string) => {
    const targetId = feedbackId || lastSubmission;
    if (!targetId || !user) return { success: false };

    try {
      const { error } = await supabase
        .from('community_feedback')
        .update({ is_favorite: true })
        .eq('id', targetId)
        .eq('user_id', user.id);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Failed to mark as favorite:', error);
      return { success: false, error };
    }
  }, [user, lastSubmission]);

  const markAsGroundTruth = useCallback(async (feedbackId?: string) => {
    const targetId = feedbackId || lastSubmission;
    if (!targetId || !user) return { success: false };

    try {
      const { error } = await supabase
        .from('community_feedback')
        .update({ is_ground_truth: true })
        .eq('id', targetId)
        .eq('user_id', user.id);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Failed to mark as ground truth:', error);
      return { success: false, error };
    }
  }, [user, lastSubmission]);

  return {
    submitFeedback,
    markAsFavorite,
    markAsGroundTruth,
    isSubmitting,
    lastSubmission,
    isAuthenticated: !!user
  };
};
