-- Fix security issues: Add search_path to functions for security
CREATE OR REPLACE FUNCTION get_personalized_feed(
  p_user_id UUID DEFAULT NULL,
  p_limit INTEGER DEFAULT 10,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  creator_id UUID,
  title TEXT,
  description TEXT,
  audio_url TEXT,
  preview_url TEXT,
  cover_image_url TEXT,
  duration_seconds INTEGER,
  genre_tags TEXT[],
  ai_model_used TEXT,
  generation_params JSONB,
  is_remix BOOLEAN,
  original_post_id UUID,
  remix_style TEXT,
  play_count INTEGER,
  like_count INTEGER,
  comment_count INTEGER,
  remix_count INTEGER,
  share_count INTEGER,
  is_featured BOOLEAN,
  visibility TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  relevance_score NUMERIC
) LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- For now, return all public posts ordered by created_at
  -- In the future, this can be enhanced with ML-based personalization
  RETURN QUERY
  SELECT 
    sp.id,
    sp.creator_id,
    sp.title,
    sp.description,
    sp.audio_url,
    sp.preview_url,
    sp.cover_image_url,
    sp.duration_seconds,
    sp.genre_tags,
    sp.ai_model_used,
    sp.generation_params,
    sp.is_remix,
    sp.original_post_id,
    sp.remix_style,
    sp.play_count,
    sp.like_count,
    sp.comment_count,
    sp.remix_count,
    sp.share_count,
    sp.is_featured,
    sp.visibility,
    sp.created_at,
    sp.updated_at,
    1.0::NUMERIC as relevance_score
  FROM social_posts sp
  WHERE sp.visibility = 'public'
  ORDER BY sp.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

CREATE OR REPLACE FUNCTION update_user_preferences(
  p_user_id UUID,
  p_post_id UUID,
  p_interaction_type TEXT,
  p_weight NUMERIC DEFAULT 1.0
)
RETURNS VOID LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert or update user preferences based on interaction
  INSERT INTO user_preferences (user_id, genre_weights, style_preferences, interaction_score, last_updated)
  VALUES (p_user_id, '{}', '{}', p_weight, NOW())
  ON CONFLICT (user_id)
  DO UPDATE SET
    interaction_score = user_preferences.interaction_score + p_weight,
    last_updated = NOW();
END;
$$;

CREATE OR REPLACE FUNCTION track_analytics_event(
  p_user_id UUID,
  p_event_type TEXT,
  p_event_data JSONB DEFAULT '{}',
  p_post_id UUID DEFAULT NULL
)
RETURNS VOID LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO analytics_events (user_id, event_type, event_data, post_id, created_at)
  VALUES (p_user_id, p_event_type, p_event_data, p_post_id, NOW());
END;
$$;