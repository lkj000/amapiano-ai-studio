-- Create function to get personalized feed
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

-- Create functions for user preferences and analytics tracking
CREATE OR REPLACE FUNCTION update_user_preferences(
  p_user_id UUID,
  p_post_id UUID,
  p_interaction_type TEXT,
  p_weight NUMERIC DEFAULT 1.0
)
RETURNS VOID LANGUAGE plpgsql
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
AS $$
BEGIN
  INSERT INTO analytics_events (user_id, event_type, event_data, post_id, created_at)
  VALUES (p_user_id, p_event_type, p_event_data, p_post_id, NOW());
END;
$$;

-- Insert some demo posts for testing
INSERT INTO social_posts (creator_id, title, description, audio_url, preview_url, cover_image_url, duration_seconds, genre_tags, ai_model_used, play_count, like_count, comment_count, remix_count, share_count, visibility, created_at) VALUES
(gen_random_uuid(), 'Amapiano Nights', 'A smooth amapiano track perfect for late night vibes', '/api/demo-audio/generated-track', '/api/demo-audio/generated-track', '/api/placeholder.jpg', 180, ARRAY['amapiano', 'chill', 'electronic'], 'Aura AI v2.0', 1250, 89, 12, 3, 45, 'public', NOW() - INTERVAL '2 hours'),
(gen_random_uuid(), 'Deep House Sunrise', 'Energetic deep house with amapiano influences', '/api/demo-audio/drums', '/api/demo-audio/drums', '/api/placeholder.jpg', 240, ARRAY['deep-house', 'amapiano', 'upbeat'], 'Neural Music Engine', 2100, 156, 28, 7, 72, 'public', NOW() - INTERVAL '5 hours'),
(gen_random_uuid(), 'Afrobeats Fusion', 'Modern afrobeats with electronic elements', '/api/demo-audio/bass', '/api/demo-audio/bass', '/api/placeholder.jpg', 200, ARRAY['afrobeats', 'electronic', 'fusion'], 'Aura AI v2.0', 890, 67, 8, 2, 23, 'public', NOW() - INTERVAL '8 hours')
ON CONFLICT (id) DO NOTHING;