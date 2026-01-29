-- Community Feedback table for AI-native PDLC Ground Truth data
CREATE TABLE public.community_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pattern_id UUID,
  user_id UUID NOT NULL,
  
  -- Subjective Cultural Ratings (1-5)
  cultural_authenticity_rating INT CHECK (cultural_authenticity_rating BETWEEN 1 AND 5),
  rhythmic_swing_rating INT CHECK (rhythmic_swing_rating BETWEEN 1 AND 5),
  linguistic_alignment_score FLOAT,
  overall_rating INT CHECK (overall_rating BETWEEN 1 AND 5),
  
  -- Model Metadata for Retraining
  model_version TEXT NOT NULL DEFAULT 'si-v1.0-base',
  generation_params JSONB DEFAULT '{}',
  output_type TEXT CHECK (output_type IN ('pattern', 'lyrics', 'vocals', 'instrumental', 'full_song')),
  
  -- Feedback Details
  is_favorite BOOLEAN DEFAULT false,
  is_ground_truth BOOLEAN DEFAULT false,
  text_feedback TEXT,
  tags TEXT[],
  
  -- MLOps Metadata
  session_id TEXT,
  generation_time_ms INT,
  confidence_score FLOAT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.community_feedback ENABLE ROW LEVEL SECURITY;

-- Users can view their own feedback
CREATE POLICY "Users can view own feedback"
  ON public.community_feedback FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own feedback
CREATE POLICY "Users can insert own feedback"
  ON public.community_feedback FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own feedback
CREATE POLICY "Users can update own feedback"
  ON public.community_feedback FOR UPDATE
  USING (auth.uid() = user_id);

-- Indexes for MLOps queries and model performance analysis
CREATE INDEX idx_community_feedback_model_performance 
  ON public.community_feedback (model_version, cultural_authenticity_rating);

CREATE INDEX idx_community_feedback_ground_truth 
  ON public.community_feedback (is_ground_truth, cultural_authenticity_rating DESC)
  WHERE is_ground_truth = true;

CREATE INDEX idx_community_feedback_user 
  ON public.community_feedback (user_id, created_at DESC);

CREATE INDEX idx_community_feedback_high_quality
  ON public.community_feedback (model_version, created_at DESC)
  WHERE cultural_authenticity_rating >= 4;

-- Trigger for updated_at
CREATE TRIGGER update_community_feedback_updated_at
  BEFORE UPDATE ON public.community_feedback
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- View for model performance analytics
CREATE VIEW public.model_performance_analytics AS
SELECT 
  model_version,
  output_type,
  COUNT(*) as total_feedback,
  AVG(cultural_authenticity_rating) as avg_cultural_rating,
  AVG(rhythmic_swing_rating) as avg_swing_rating,
  AVG(overall_rating) as avg_overall_rating,
  COUNT(*) FILTER (WHERE cultural_authenticity_rating >= 4) as high_quality_count,
  COUNT(*) FILTER (WHERE is_favorite = true) as favorite_count,
  AVG(generation_time_ms) as avg_generation_time,
  AVG(confidence_score) as avg_confidence,
  DATE_TRUNC('day', created_at) as feedback_date
FROM public.community_feedback
GROUP BY model_version, output_type, DATE_TRUNC('day', created_at);

-- Function to get ground truth training data
CREATE OR REPLACE FUNCTION public.get_ground_truth_data(
  min_rating INT DEFAULT 4,
  target_model_version TEXT DEFAULT NULL,
  limit_count INT DEFAULT 1000
)
RETURNS TABLE (
  id UUID,
  pattern_id UUID,
  cultural_authenticity_rating INT,
  rhythmic_swing_rating INT,
  model_version TEXT,
  generation_params JSONB,
  output_type TEXT,
  tags TEXT[],
  text_feedback TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cf.id,
    cf.pattern_id,
    cf.cultural_authenticity_rating,
    cf.rhythmic_swing_rating,
    cf.model_version,
    cf.generation_params,
    cf.output_type,
    cf.tags,
    cf.text_feedback
  FROM public.community_feedback cf
  WHERE cf.cultural_authenticity_rating >= min_rating
    AND (target_model_version IS NULL OR cf.model_version = target_model_version)
  ORDER BY cf.cultural_authenticity_rating DESC, cf.created_at DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to detect model drift
CREATE OR REPLACE FUNCTION public.detect_model_drift(
  target_model_version TEXT,
  lookback_days INT DEFAULT 7
)
RETURNS TABLE (
  period TEXT,
  avg_cultural_rating NUMERIC,
  avg_swing_rating NUMERIC,
  sample_count BIGINT,
  drift_detected BOOLEAN
) AS $$
DECLARE
  baseline_rating NUMERIC;
BEGIN
  -- Get baseline (first week of model deployment)
  SELECT AVG(cultural_authenticity_rating) INTO baseline_rating
  FROM public.community_feedback
  WHERE model_version = target_model_version
    AND created_at < (
      SELECT MIN(created_at) + INTERVAL '7 days'
      FROM public.community_feedback
      WHERE model_version = target_model_version
    );

  RETURN QUERY
  SELECT 
    TO_CHAR(DATE_TRUNC('day', cf.created_at), 'YYYY-MM-DD') as period,
    AVG(cf.cultural_authenticity_rating)::NUMERIC as avg_cultural_rating,
    AVG(cf.rhythmic_swing_rating)::NUMERIC as avg_swing_rating,
    COUNT(*) as sample_count,
    (AVG(cf.cultural_authenticity_rating) < COALESCE(baseline_rating, 3) - 0.5) as drift_detected
  FROM public.community_feedback cf
  WHERE cf.model_version = target_model_version
    AND cf.created_at >= NOW() - (lookback_days || ' days')::INTERVAL
  GROUP BY DATE_TRUNC('day', cf.created_at)
  ORDER BY period DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;