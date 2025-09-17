-- Fix security warnings by setting proper search_path for functions

-- Drop and recreate the update_user_preferences function with proper security
DROP FUNCTION IF EXISTS public.update_user_preferences(UUID, UUID, TEXT, NUMERIC);

CREATE OR REPLACE FUNCTION public.update_user_preferences(
  p_user_id UUID,
  p_post_id UUID,
  p_interaction_type TEXT,
  p_weight NUMERIC DEFAULT 1.0
) RETURNS void AS $$
DECLARE
  post_genres TEXT[];
  current_preferences JSONB;
  updated_preferences JSONB;
BEGIN
  -- Get post genre tags
  SELECT genre_tags INTO post_genres 
  FROM public.social_posts 
  WHERE id = p_post_id;
  
  -- Get or create user preferences
  INSERT INTO public.user_preferences (user_id, genre_weights, style_preferences)
  VALUES (p_user_id, '{}'::jsonb, '{}'::jsonb)
  ON CONFLICT (user_id) DO NOTHING;
  
  -- Update genre weights based on interaction
  SELECT genre_weights INTO current_preferences
  FROM public.user_preferences
  WHERE user_id = p_user_id;
  
  -- Update preferences for each genre tag
  updated_preferences := current_preferences;
  FOR i in 1..array_length(post_genres, 1) LOOP
    updated_preferences := jsonb_set(
      updated_preferences,
      ARRAY[post_genres[i]],
      to_jsonb(COALESCE((updated_preferences->post_genres[i])::numeric, 0) + p_weight)
    );
  END LOOP;
  
  -- Save updated preferences
  UPDATE public.user_preferences 
  SET 
    genre_weights = updated_preferences,
    interaction_score = interaction_score + p_weight,
    last_updated = now()
  WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Drop and recreate the get_personalized_feed function with proper security
DROP FUNCTION IF EXISTS public.get_personalized_feed(UUID, INTEGER, INTEGER);

CREATE OR REPLACE FUNCTION public.get_personalized_feed(
  p_user_id UUID DEFAULT NULL,
  p_limit INTEGER DEFAULT 10,
  p_offset INTEGER DEFAULT 0
) RETURNS TABLE (
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
) AS $$
DECLARE
  user_genres JSONB;
BEGIN
  -- Get user genre preferences if user is provided
  IF p_user_id IS NOT NULL THEN
    SELECT genre_weights INTO user_genres
    FROM public.user_preferences
    WHERE user_preferences.user_id = p_user_id;
  END IF;
  
  -- Return personalized or general feed
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
    CASE 
      WHEN p_user_id IS NULL OR user_genres IS NULL THEN 
        -- Default scoring: recent + engagement
        (
          EXTRACT(EPOCH FROM (now() - sp.created_at)) / -3600 * 0.3 +
          (sp.like_count * 2 + sp.play_count + sp.comment_count * 3) * 0.7
        )::numeric
      ELSE 
        -- Personalized scoring: genre preference + engagement + recency
        (
          (
            SELECT COALESCE(SUM((user_genres->>tag)::numeric), 0)
            FROM unnest(sp.genre_tags) AS tag
          ) * 0.4 +
          (sp.like_count * 2 + sp.play_count + sp.comment_count * 3) * 0.4 +
          EXTRACT(EPOCH FROM (now() - sp.created_at)) / -3600 * 0.2
        )::numeric
    END as relevance_score
  FROM public.social_posts sp
  WHERE sp.visibility = 'public'
  ORDER BY relevance_score DESC, sp.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;