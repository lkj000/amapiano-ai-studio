import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface ModelPerformanceData {
  modelVersion: string;
  outputType: string | null;
  totalFeedback: number;
  avgCulturalRating: number | null;
  avgSwingRating: number | null;
  avgOverallRating: number | null;
  highQualityCount: number;
  favoriteCount: number;
  avgGenerationTime: number | null;
  avgConfidence: number | null;
  feedbackDate: string;
}

export interface ModelDriftData {
  period: string;
  avgCulturalRating: number;
  avgSwingRating: number;
  sampleCount: number;
  driftDetected: boolean;
}

export interface GroundTruthData {
  id: string;
  patternId: string | null;
  culturalAuthenticityRating: number;
  rhythmicSwingRating: number;
  modelVersion: string;
  generationParams: Record<string, unknown>;
  outputType: string;
  tags: string[];
  textFeedback: string | null;
}

export const useModelAnalytics = () => {
  const [performanceData, setPerformanceData] = useState<ModelPerformanceData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchPerformanceData = useCallback(async (modelVersion?: string) => {
    setIsLoading(true);
    setError(null);

    try {
      let query = supabase
        .from('community_feedback')
        .select('model_version, output_type, cultural_authenticity_rating, rhythmic_swing_rating, overall_rating, is_favorite, generation_time_ms, confidence_score, created_at');
      
      if (modelVersion) {
        query = query.eq('model_version', modelVersion);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      // Group and aggregate data
      const grouped = data?.reduce((acc, item) => {
        const key = `${item.model_version}_${item.output_type || 'unknown'}`;
        if (!acc[key]) {
          acc[key] = {
            modelVersion: item.model_version,
            outputType: item.output_type,
            ratings: [],
            swingRatings: [],
            overallRatings: [],
            favorites: 0,
            highQuality: 0,
            genTimes: [],
            confidences: []
          };
        }
        
        if (item.cultural_authenticity_rating) {
          acc[key].ratings.push(item.cultural_authenticity_rating);
          if (item.cultural_authenticity_rating >= 4) acc[key].highQuality++;
        }
        if (item.rhythmic_swing_rating) acc[key].swingRatings.push(item.rhythmic_swing_rating);
        if (item.overall_rating) acc[key].overallRatings.push(item.overall_rating);
        if (item.is_favorite) acc[key].favorites++;
        if (item.generation_time_ms) acc[key].genTimes.push(item.generation_time_ms);
        if (item.confidence_score) acc[key].confidences.push(item.confidence_score);
        
        return acc;
      }, {} as Record<string, any>) || {};

      const aggregated: ModelPerformanceData[] = Object.values(grouped).map((g: any) => ({
        modelVersion: g.modelVersion,
        outputType: g.outputType,
        totalFeedback: g.ratings.length,
        avgCulturalRating: g.ratings.length ? g.ratings.reduce((a: number, b: number) => a + b, 0) / g.ratings.length : null,
        avgSwingRating: g.swingRatings.length ? g.swingRatings.reduce((a: number, b: number) => a + b, 0) / g.swingRatings.length : null,
        avgOverallRating: g.overallRatings.length ? g.overallRatings.reduce((a: number, b: number) => a + b, 0) / g.overallRatings.length : null,
        highQualityCount: g.highQuality,
        favoriteCount: g.favorites,
        avgGenerationTime: g.genTimes.length ? g.genTimes.reduce((a: number, b: number) => a + b, 0) / g.genTimes.length : null,
        avgConfidence: g.confidences.length ? g.confidences.reduce((a: number, b: number) => a + b, 0) / g.confidences.length : null,
        feedbackDate: new Date().toISOString()
      }));

      setPerformanceData(aggregated);
    } catch (err) {
      console.error('Failed to fetch performance data:', err);
      setError('Failed to load analytics');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const detectModelDrift = useCallback(async (
    modelVersion: string,
    lookbackDays: number = 7
  ): Promise<ModelDriftData[]> => {
    try {
      const { data, error } = await supabase.rpc('detect_model_drift', {
        target_model_version: modelVersion,
        lookback_days: lookbackDays
      });

      if (error) throw error;

      return (data || []).map((d: any) => ({
        period: d.period,
        avgCulturalRating: parseFloat(d.avg_cultural_rating) || 0,
        avgSwingRating: parseFloat(d.avg_swing_rating) || 0,
        sampleCount: parseInt(d.sample_count) || 0,
        driftDetected: d.drift_detected || false
      }));
    } catch (err) {
      console.error('Failed to detect model drift:', err);
      return [];
    }
  }, []);

  const getGroundTruthData = useCallback(async (
    minRating: number = 4,
    modelVersion?: string,
    limit: number = 100
  ): Promise<GroundTruthData[]> => {
    try {
      const { data, error } = await supabase.rpc('get_ground_truth_data', {
        min_rating: minRating,
        target_model_version: modelVersion || null,
        limit_count: limit
      });

      if (error) throw error;

      return (data || []).map((d: any) => ({
        id: d.id,
        patternId: d.pattern_id,
        culturalAuthenticityRating: d.cultural_authenticity_rating,
        rhythmicSwingRating: d.rhythmic_swing_rating,
        modelVersion: d.model_version,
        generationParams: d.generation_params || {},
        outputType: d.output_type || 'pattern',
        tags: d.tags || [],
        textFeedback: d.text_feedback
      }));
    } catch (err) {
      console.error('Failed to get ground truth data:', err);
      return [];
    }
  }, []);

  useEffect(() => {
    if (user) {
      fetchPerformanceData();
    }
  }, [user, fetchPerformanceData]);

  return {
    performanceData,
    isLoading,
    error,
    fetchPerformanceData,
    detectModelDrift,
    getGroundTruthData
  };
};
