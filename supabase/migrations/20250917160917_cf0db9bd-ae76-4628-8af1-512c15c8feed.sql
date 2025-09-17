-- Create user preferences table for algorithmic discovery
CREATE TABLE public.user_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  genre_weights JSONB NOT NULL DEFAULT '{}'::jsonb,
  style_preferences JSONB NOT NULL DEFAULT '{}'::jsonb,
  interaction_score NUMERIC DEFAULT 0.0,
  last_updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create music clips table for short-form content
CREATE TABLE public.music_clips (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL,
  start_time NUMERIC NOT NULL DEFAULT 0,
  duration NUMERIC NOT NULL DEFAULT 30,
  engagement_score NUMERIC DEFAULT 0.0,
  auto_generated BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create remix templates table for enhanced remixing
CREATE TABLE public.remix_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  style_params JSONB NOT NULL DEFAULT '{}'::jsonb,
  description TEXT,
  preview_url TEXT,
  usage_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create duet collaborations table
CREATE TABLE public.duet_collaborations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  original_post_id UUID NOT NULL,
  duet_post_id UUID NOT NULL,
  creator_id UUID NOT NULL,
  collaboration_type TEXT DEFAULT 'duet',
  mix_settings JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.music_clips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.remix_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.duet_collaborations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_preferences
CREATE POLICY "Users can manage their preferences"
ON public.user_preferences
FOR ALL
USING (auth.uid() = user_id);

-- RLS Policies for music_clips  
CREATE POLICY "Anyone can view clips for public posts"
ON public.music_clips
FOR SELECT
USING (post_id IN (
  SELECT id FROM public.social_posts 
  WHERE visibility = 'public'
));

CREATE POLICY "Users can manage clips for their posts"
ON public.music_clips
FOR ALL
USING (post_id IN (
  SELECT id FROM public.social_posts 
  WHERE creator_id = auth.uid()
));

-- RLS Policies for remix_templates
CREATE POLICY "Anyone can view active remix templates"
ON public.remix_templates
FOR SELECT
USING (is_active = true);

-- RLS Policies for duet_collaborations
CREATE POLICY "Anyone can view duet collaborations"
ON public.duet_collaborations
FOR SELECT
USING (true);

CREATE POLICY "Users can create duet collaborations"
ON public.duet_collaborations
FOR INSERT
WITH CHECK (auth.uid() = creator_id);

-- Add indexes for performance
CREATE INDEX idx_user_preferences_user_id ON public.user_preferences(user_id);
CREATE INDEX idx_music_clips_post_id ON public.music_clips(post_id);
CREATE INDEX idx_music_clips_engagement ON public.music_clips(engagement_score DESC);
CREATE INDEX idx_remix_templates_active ON public.remix_templates(is_active);
CREATE INDEX idx_duet_collaborations_original ON public.duet_collaborations(original_post_id);

-- Function to update user preferences based on interactions
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function for personalized feed algorithm
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert some default remix templates
INSERT INTO public.remix_templates (name, style_params, description) VALUES
('Ambient Chill', '{"mood": "ambient", "tempo": "slow", "instruments": ["pad", "guitar"]}', 'Transform any track into a chill ambient version'),
('Hard Trap', '{"mood": "aggressive", "tempo": "fast", "instruments": ["808", "synth", "hi-hat"]}', 'Give your track a hard trap remix'),
('Jazz Fusion', '{"mood": "sophisticated", "tempo": "medium", "instruments": ["saxophone", "piano", "bass"]}', 'Add jazz elements to any genre'),
('Epic Orchestral', '{"mood": "cinematic", "tempo": "building", "instruments": ["strings", "brass", "timpani"]}', 'Transform into an epic movie soundtrack'),
('Lo-Fi Hip Hop', '{"mood": "relaxed", "tempo": "slow", "instruments": ["vinyl", "jazz-guitar", "soft-drums"]}', 'Create a lo-fi hip hop version');