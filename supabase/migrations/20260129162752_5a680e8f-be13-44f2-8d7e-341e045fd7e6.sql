-- Fix search_path for newly created functions
ALTER FUNCTION public.get_ground_truth_data(INT, TEXT, INT) SET search_path = public;
ALTER FUNCTION public.detect_model_drift(TEXT, INT) SET search_path = public;

-- Recreate view without SECURITY DEFINER (use normal view)
DROP VIEW IF EXISTS public.model_performance_analytics;

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

-- Add RLS policy for view access (analytics view is based on user's own data)
-- Grant SELECT to authenticated users on view
GRANT SELECT ON public.model_performance_analytics TO authenticated;