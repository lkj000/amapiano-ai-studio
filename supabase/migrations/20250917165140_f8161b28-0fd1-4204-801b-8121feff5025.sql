-- First ensure unique constraint exists on user_preferences
ALTER TABLE user_preferences ADD CONSTRAINT user_preferences_user_id_unique UNIQUE (user_id);

-- Insert demo social posts for testing the social feed
INSERT INTO social_posts (
  id,
  creator_id,
  title,
  description,
  audio_url,
  preview_url,
  cover_image_url,
  duration_seconds,
  genre_tags,
  ai_model_used,
  generation_params,
  is_remix,
  original_post_id,
  remix_style,
  play_count,
  like_count,
  comment_count,
  remix_count,
  share_count,
  is_featured,
  visibility,
  created_at
) VALUES
-- Post 1: Amapiano Track
(
  '550e8400-e29b-41d4-a716-446655440001'::uuid,
  (SELECT user_id FROM profiles ORDER BY created_at DESC LIMIT 1), -- Use existing profile
  'Midnight Groove',
  'A smooth Amapiano track with ethereal vocals and deep bass',
  'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav', -- Demo audio
  'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav',
  'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop',
  185,
  ARRAY['amapiano', 'deep house', 'south african'],
  'AURA Neural Engine v2.1',
  '{"bpm": 113, "key": "G minor", "style_strength": 0.8, "complexity": 0.6}',
  false,
  null,
  null,
  1250,
  84,
  12,
  5,
  23,
  true,
  'public',
  now() - interval '2 hours'
),
-- Post 2: Lo-Fi Hip Hop
(
  '550e8400-e29b-41d4-a716-446655440002'::uuid,
  (SELECT user_id FROM profiles ORDER BY created_at DESC LIMIT 1),
  'Study Vibes',
  'Perfect background music for coding sessions',
  'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav',
  'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav',
  'https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=400&h=400&fit=crop',
  142,
  ARRAY['lofi', 'hip hop', 'chill', 'study'],
  'AURA Lofi Specialist v1.3',
  '{"bpm": 85, "key": "C major", "warmth": 0.9, "vinyl_crackle": 0.4}',
  false,
  null,
  null,
  2340,
  156,
  28,
  12,
  45,
  false,
  'public',
  now() - interval '4 hours'
),
-- Post 3: Electronic Dance
(
  '550e8400-e29b-41d4-a716-446655440003'::uuid,
  (SELECT user_id FROM profiles ORDER BY created_at DESC LIMIT 1),
  'Neon Dreams',
  'High-energy electronic track with synthwave influences',
  'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav',
  'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav',
  'https://images.unsplash.com/photo-1571330735066-03aaa9429d89?w=400&h=400&fit=crop',
  201,
  ARRAY['electronic', 'synthwave', 'dance', 'cyberpunk'],
  'AURA Synth Master v2.0',
  '{"bpm": 128, "key": "A minor", "energy": 0.95, "retro_factor": 0.7}',
  false,
  null,
  null,
  890,
  67,
  8,
  3,
  19,
  false,
  'public',
  now() - interval '6 hours'
),
-- Post 4: Jazz Fusion (Remix)
(
  '550e8400-e29b-41d4-a716-446655440004'::uuid,
  (SELECT user_id FROM profiles ORDER BY created_at DESC LIMIT 1),
  'Smooth Jazz Remix',
  'A modern take on classic jazz with AI-generated improvisation',
  'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav',
  'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav',
  'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop',
  167,
  ARRAY['jazz', 'fusion', 'smooth jazz', 'ai remix'],
  'AURA Jazz Engine v1.8',
  '{"bpm": 95, "key": "Bb major", "improvisation_level": 0.8, "swing": 0.6}',
  true,
  '550e8400-e29b-41d4-a716-446655440002'::uuid,
  'jazz fusion',
  456,
  34,
  6,
  1,
  8,
  false,
  'public',
  now() - interval '8 hours'
),
-- Post 5: Ambient Experimental
(
  '550e8400-e29b-41d4-a716-446655440005'::uuid,
  (SELECT user_id FROM profiles ORDER BY created_at DESC LIMIT 1),
  'Digital Meditation',
  'Generative ambient soundscape for deep focus',
  'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav',
  'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav',
  'https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=400&h=400&fit=crop',
  324,
  ARRAY['ambient', 'experimental', 'meditation', 'drone'],
  'AURA Ambient Generator v3.0',
  '{"texture": 0.9, "evolution_rate": 0.3, "harmonic_density": 0.4, "temporal_drift": 0.6}',
  false,
  null,
  null,
  234,
  89,
  15,
  7,
  12,
  false,
  'public',
  now() - interval '12 hours'
);

-- Insert corresponding music clips for smart preview
INSERT INTO music_clips (
  id,
  post_id,
  start_time,
  duration,
  engagement_score,
  auto_generated
) VALUES
('650e8400-e29b-41d4-a716-446655440001'::uuid, '550e8400-e29b-41d4-a716-446655440001'::uuid, 45.5, 30, 0.89, true),
('650e8400-e29b-41d4-a716-446655440002'::uuid, '550e8400-e29b-41d4-a716-446655440002'::uuid, 20.0, 30, 0.76, true),
('650e8400-e29b-41d4-a716-446655440003'::uuid, '550e8400-e29b-41d4-a716-446655440003'::uuid, 65.2, 30, 0.93, true),
('650e8400-e29b-41d4-a716-446655440004'::uuid, '550e8400-e29b-41d4-a716-446655440004'::uuid, 35.7, 30, 0.82, true),
('650e8400-e29b-41d4-a716-446655440005'::uuid, '550e8400-e29b-41d4-a716-446655440005'::uuid, 120.0, 30, 0.67, true);

-- Create some user preferences for personalized algorithm
INSERT INTO user_preferences (
  id,
  user_id,
  genre_weights,
  style_preferences,
  interaction_score,
  created_at,
  last_updated
) VALUES
(
  gen_random_uuid(),
  (SELECT user_id FROM profiles ORDER BY created_at DESC LIMIT 1),
  '{"amapiano": 0.9, "lofi": 0.7, "electronic": 0.8, "jazz": 0.6, "ambient": 0.4}',
  '{"energy_preference": 0.7, "complexity_preference": 0.6, "experimental_tolerance": 0.5}',
  15.8,
  now(),
  now()
) ON CONFLICT (user_id) DO UPDATE SET
  genre_weights = EXCLUDED.genre_weights,
  style_preferences = EXCLUDED.style_preferences,
  interaction_score = EXCLUDED.interaction_score,
  last_updated = now();