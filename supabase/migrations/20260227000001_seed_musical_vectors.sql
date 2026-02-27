-- Seed musical_vectors with AMAPIANO_KNOWLEDGE_BASE items
-- Uses text content for semantic search (real embeddings generated at query time via edge function)

-- First ensure the musical_vectors table has the right schema
-- The existing migration has vector(1536) - we'll use text_content for now
-- and generate embeddings via the rag-knowledge-search function

-- Add text_content column if it doesn't exist, for keyword fallback
ALTER TABLE public.musical_vectors
  ADD COLUMN IF NOT EXISTS text_content text,
  ADD COLUMN IF NOT EXISTS knowledge_id text UNIQUE,
  ADD COLUMN IF NOT EXISTS title text,
  ADD COLUMN IF NOT EXISTS tags text[];

-- Seed the AMAPIANO_KNOWLEDGE_BASE knowledge items (without vector - generated at query time)
INSERT INTO public.musical_vectors (knowledge_id, title, text_content, tags, user_id)
SELECT
  kb.knowledge_id,
  kb.title,
  kb.text_content,
  kb.tags,
  '00000000-0000-0000-0000-000000000000'::uuid  -- system user
FROM (VALUES
  ('kb_logdrum_1', 'Log Drum Fundamentals',
   'The log drum is the defining bass instrument of Amapiano. It sits in the E1-A1 frequency range with a long decay (500-900ms). Classic pattern places it on the downbeat and syncopated 16th positions. Essential for the genre''s bouncy, rolling feel.',
   ARRAY['log_drum', 'rhythm', 'bass', 'amapiano', '808']),
  ('kb_harmony_1', 'Private School Harmonic Language',
   'Private School Amapiano draws heavily from jazz harmony. Common chord progressions: Dm9→Gm9→CM9→FM9, Am9→Dm9→Gmaj7→Cmaj9. Voice leading should be smooth with minimal leaps. Extended chords (9ths, 11ths, 13ths) are standard.',
   ARRAY['harmony', 'private_school', 'jazz', 'chord_progression', 'voice_leading']),
  ('kb_bpm_1', 'Amapiano BPM Conventions',
   'Tempo conventions: Private School 108-116 BPM, Classic Amapiano 116-122 BPM, Deep Amapiano 106-112 BPM, Soulful variant 104-110 BPM. Most commercial releases cluster around 112-118 BPM.',
   ARRAY['bpm', 'tempo', 'amapiano', 'production']),
  ('kb_rhythm_euclidean', 'Euclidean Rhythm Patterns',
   'Amapiano uses euclidean rhythm distribution for hi-hats and percussion. Common patterns: E(3,8) for hi-hat, E(5,16) for syncopated shakers, E(7,16) for complex percussion layers. Offbeat emphasis creates the characteristic groove.',
   ARRAY['rhythm', 'euclidean', 'hi_hat', 'percussion', 'groove']),
  ('kb_keys_1', 'Amapiano Key Signature Conventions',
   'Common keys: D minor, A minor, G minor for melancholic Private School. F major, Bb major for uplifting Soulful. E minor, B minor for Deep/introspective. Most tracks stay diatonic with chromatic passing tones only.',
   ARRAY['key', 'scale', 'minor', 'major', 'tonal_center']),
  ('kb_structure_1', 'Amapiano Song Structure',
   'Standard DJ-friendly structure: Intro (16-32 bars) sparse percussion and atmosphere. Groove section (32-64 bars) log drum enters with full percussion and piano stabs. Breakdown (16-32 bars) strip to melody and pads only. Drop (32-64 bars) full energy. Outro (16-32 bars) gradual strip for mix-out.',
   ARRAY['structure', 'arrangement', 'intro', 'drop', 'breakdown']),
  ('kb_swing_1', 'Regional Swing Profiles',
   'Groove feel varies regionally: Johannesburg 52-55% swing tight precise 16th grid. Pretoria heavier log drum 55-60% swing more bass presence. Durban more relaxed 60-65% swing township influence. Cape Town syncopated hi-hats 55-62% Cape Jazz influence.',
   ARRAY['swing', 'groove', 'regional', 'johannesburg', 'pretoria', 'durban']),
  ('kb_piano_1', 'Amapiano Piano Stab Technique',
   'Piano stabs are short percussive chord hits. Velocity 80-110 MIDI with ghost notes at 40-60. Timing on the and of beat 2 and beat 4 in 4/4. Voicing in close-position chords mid-range C3-C5 for cut through the mix. Duration staccato 16th-32nd note.',
   ARRAY['piano', 'stab', 'technique', 'midi', 'voicing']),
  ('kb_bass_1', 'Amapiano Bass Design',
   'Bass design: sub-bass 20-80 Hz felt rather than heard provides foundation. Mid-bass 80-200 Hz the log drum body primary rhythmic bass element. No heavy sidechain compression unlike other house genres. The groove breathes naturally. Log drum body is the bass instrument not a separate bass line.',
   ARRAY['bass', 'sub_bass', 'sidechain', 'production', 'mix']),
  ('kb_artists_1', 'Amapiano Artist Style Reference',
   'Key producer fingerprints: Kabza De Small melodic gospel influences major keys commercial. Kelvin Momo jazz harmony depth Private School pioneer intimate feel. Vigro Deep minimal heavy sub-bass dark progressions. DBN Gogo Gqom-influenced harder percussion faster tempo. Focalistic commercial accessible energetic drops.',
   ARRAY['artist', 'style', 'kabza', 'kelvin_momo', 'vigro_deep', 'dbn_gogo'])
) AS kb(knowledge_id, title, text_content, tags)
ON CONFLICT (knowledge_id) DO UPDATE SET
  title = EXCLUDED.title,
  text_content = EXCLUDED.text_content,
  tags = EXCLUDED.tags;
