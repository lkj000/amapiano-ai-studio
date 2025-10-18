-- Fix remaining search_path security warnings

-- Update update_user_preferences function
CREATE OR REPLACE FUNCTION public.update_user_preferences(p_user_id uuid, p_post_id uuid, p_interaction_type text, p_weight numeric DEFAULT 1.0)
RETURNS void
LANGUAGE plpgsql
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

-- Update track_analytics_event function
CREATE OR REPLACE FUNCTION public.track_analytics_event(p_user_id uuid, p_event_type text, p_event_data jsonb DEFAULT '{}'::jsonb, p_post_id uuid DEFAULT NULL::uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO analytics_events (user_id, event_type, event_data, post_id, created_at)
  VALUES (p_user_id, p_event_type, p_event_data, p_post_id, NOW());
END;
$$;