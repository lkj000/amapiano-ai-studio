-- Drop and recreate the get_personalized_feed function with creator info
DROP FUNCTION IF EXISTS get_personalized_feed(UUID, INTEGER, INTEGER);

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
  relevance_score NUMERIC,
  creator_display_name TEXT,
  creator_avatar_url TEXT
) LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
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
    1.0::NUMERIC as relevance_score,
    COALESCE(p.display_name, 'Anonymous User') as creator_display_name,
    p.avatar_url as creator_avatar_url
  FROM social_posts sp
  LEFT JOIN profiles p ON sp.creator_id = p.user_id
  WHERE sp.visibility = 'public'
  ORDER BY sp.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

-- Update social posts to use proper audio URLs
UPDATE social_posts 
SET 
  audio_url = 'https://mywijmtszelyutssormy.supabase.co/functions/v1/demo-audio-files/generated-track',
  preview_url = 'https://mywijmtszelyutssormy.supabase.co/functions/v1/demo-audio-files/generated-track'
WHERE audio_url LIKE '/api/demo-audio/generated-track' OR audio_url LIKE 'https://www.soundjay.com%';

UPDATE social_posts 
SET 
  audio_url = 'https://mywijmtszelyutssormy.supabase.co/functions/v1/demo-audio-files/drums',
  preview_url = 'https://mywijmtszelyutssormy.supabase.co/functions/v1/demo-audio-files/drums'
WHERE audio_url LIKE '/api/demo-audio/drums';

UPDATE social_posts 
SET 
  audio_url = 'https://mywijmtszelyutssormy.supabase.co/functions/v1/demo-audio-files/bass',
  preview_url = 'https://mywijmtszelyutssormy.supabase.co/functions/v1/demo-audio-files/bass'
WHERE audio_url LIKE '/api/demo-audio/bass';