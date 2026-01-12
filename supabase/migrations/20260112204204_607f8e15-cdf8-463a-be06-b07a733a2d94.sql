-- Insert Amapiano samples for ML/AI training using existing user
INSERT INTO public.sample_library (id, user_id, name, pack_name, category, sample_type, audio_url, bpm, key_signature, duration_seconds, tags, is_public, is_favorite, download_count)
VALUES
  -- Log Drums (signature Amapiano element)
  (gen_random_uuid(), 'cd0b56c2-2713-4a6d-b12a-c1aa29e8aa5f', 'Amapiano Log Drum Loop 1', 'LANDR Amapiano Essentials', 'amapiano', 'loop', 'https://storage.example.com/samples/amapiano-log-drum-1.wav', 115, 'C', 8.0, ARRAY['amapiano', 'log-drum', 'percussion', 'loop', 'house'], true, false, 0),
  (gen_random_uuid(), 'cd0b56c2-2713-4a6d-b12a-c1aa29e8aa5f', 'Amapiano Log Drum Pattern 2', 'LANDR Amapiano Essentials', 'amapiano', 'loop', 'https://storage.example.com/samples/amapiano-log-drum-2.wav', 112, 'Am', 8.0, ARRAY['amapiano', 'log-drum', 'percussion', 'groove'], true, false, 0),
  (gen_random_uuid(), 'cd0b56c2-2713-4a6d-b12a-c1aa29e8aa5f', 'Deep Log Drum Groove', 'LANDR Amapiano Essentials', 'amapiano', 'loop', 'https://storage.example.com/samples/deep-log-drum.wav', 118, 'Dm', 4.0, ARRAY['amapiano', 'log-drum', 'deep-house'], true, false, 0),
  
  -- Shaker Patterns
  (gen_random_uuid(), 'cd0b56c2-2713-4a6d-b12a-c1aa29e8aa5f', 'Amapiano Shaker Loop 1', 'LANDR Amapiano Essentials', 'amapiano', 'loop', 'https://storage.example.com/samples/amapiano-shaker-1.wav', 116, 'C', 4.0, ARRAY['amapiano', 'shaker', 'percussion', 'groove'], true, false, 0),
  (gen_random_uuid(), 'cd0b56c2-2713-4a6d-b12a-c1aa29e8aa5f', 'Tribal Shaker Pattern', 'LANDR Amapiano Essentials', 'amapiano', 'loop', 'https://storage.example.com/samples/tribal-shaker.wav', 120, 'G', 4.0, ARRAY['amapiano', 'shaker', 'tribal', 'afro'], true, false, 0),
  
  -- Bass Lines
  (gen_random_uuid(), 'cd0b56c2-2713-4a6d-b12a-c1aa29e8aa5f', 'Piano Bass Stab Cm', 'LANDR Amapiano Essentials', 'amapiano', 'oneshot', 'https://storage.example.com/samples/piano-bass-cm.wav', 0, 'Cm', 2.0, ARRAY['amapiano', 'bass', 'piano', 'stab', 'keys'], true, false, 0),
  (gen_random_uuid(), 'cd0b56c2-2713-4a6d-b12a-c1aa29e8aa5f', 'Amapiano Bass Loop Am', 'LANDR Amapiano Essentials', 'amapiano', 'loop', 'https://storage.example.com/samples/amapiano-bass-am.wav', 114, 'Am', 8.0, ARRAY['amapiano', 'bass', 'sub', 'deep'], true, false, 0),
  (gen_random_uuid(), 'cd0b56c2-2713-4a6d-b12a-c1aa29e8aa5f', 'Warm Sub Bass Pattern', 'LANDR Amapiano Essentials', 'amapiano', 'loop', 'https://storage.example.com/samples/warm-sub-bass.wav', 116, 'Fm', 8.0, ARRAY['amapiano', 'bass', 'sub', 'warm'], true, false, 0),
  
  -- Piano/Keys
  (gen_random_uuid(), 'cd0b56c2-2713-4a6d-b12a-c1aa29e8aa5f', 'Jazzy Keys Progression', 'LANDR Amapiano Essentials', 'amapiano', 'loop', 'https://storage.example.com/samples/jazzy-keys.wav', 118, 'Gm', 16.0, ARRAY['amapiano', 'piano', 'keys', 'jazz', 'chord'], true, false, 0),
  (gen_random_uuid(), 'cd0b56c2-2713-4a6d-b12a-c1aa29e8aa5f', 'Amapiano Piano Riff Dm', 'LANDR Amapiano Essentials', 'amapiano', 'loop', 'https://storage.example.com/samples/piano-riff-dm.wav', 112, 'Dm', 8.0, ARRAY['amapiano', 'piano', 'riff', 'melody'], true, false, 0),
  (gen_random_uuid(), 'cd0b56c2-2713-4a6d-b12a-c1aa29e8aa5f', 'Soulful Piano Chords', 'LANDR Amapiano Essentials', 'amapiano', 'loop', 'https://storage.example.com/samples/soulful-piano.wav', 115, 'Bb', 8.0, ARRAY['amapiano', 'piano', 'soul', 'chord'], true, false, 0),
  
  -- Vocals/Chants
  (gen_random_uuid(), 'cd0b56c2-2713-4a6d-b12a-c1aa29e8aa5f', 'Zulu Vocal Chant', 'LANDR Amapiano Essentials', 'amapiano', 'oneshot', 'https://storage.example.com/samples/zulu-chant.wav', 0, 'Am', 3.0, ARRAY['amapiano', 'vocal', 'chant', 'zulu', 'afro'], true, false, 0),
  (gen_random_uuid(), 'cd0b56c2-2713-4a6d-b12a-c1aa29e8aa5f', 'Soulful Vocal Hook Gm', 'LANDR Amapiano Essentials', 'amapiano', 'loop', 'https://storage.example.com/samples/vocal-hook-gm.wav', 116, 'Gm', 8.0, ARRAY['amapiano', 'vocal', 'hook', 'soul'], true, false, 0),
  
  -- Full Drum Loops
  (gen_random_uuid(), 'cd0b56c2-2713-4a6d-b12a-c1aa29e8aa5f', 'Amapiano Full Drum Loop 1', 'LANDR Amapiano Drums', 'amapiano', 'loop', 'https://storage.example.com/samples/full-drum-1.wav', 115, 'C', 8.0, ARRAY['amapiano', 'drums', 'full', 'loop', 'percussion'], true, false, 0),
  (gen_random_uuid(), 'cd0b56c2-2713-4a6d-b12a-c1aa29e8aa5f', 'Groovy Drum Pattern 2', 'LANDR Amapiano Drums', 'amapiano', 'loop', 'https://storage.example.com/samples/groovy-drum-2.wav', 118, 'C', 8.0, ARRAY['amapiano', 'drums', 'groovy', 'percussion'], true, false, 0),
  
  -- FX and Transitions
  (gen_random_uuid(), 'cd0b56c2-2713-4a6d-b12a-c1aa29e8aa5f', 'Amapiano Riser FX', 'LANDR Amapiano FX', 'amapiano', 'oneshot', 'https://storage.example.com/samples/riser-fx.wav', 0, 'C', 4.0, ARRAY['amapiano', 'fx', 'riser', 'transition'], true, false, 0),
  (gen_random_uuid(), 'cd0b56c2-2713-4a6d-b12a-c1aa29e8aa5f', 'Downlifter Sweep', 'LANDR Amapiano FX', 'amapiano', 'oneshot', 'https://storage.example.com/samples/downlifter.wav', 0, 'C', 4.0, ARRAY['amapiano', 'fx', 'downlifter', 'sweep'], true, false, 0),
  
  -- Synth Textures
  (gen_random_uuid(), 'cd0b56c2-2713-4a6d-b12a-c1aa29e8aa5f', 'Ethereal Pad Texture', 'LANDR Amapiano Textures', 'amapiano', 'loop', 'https://storage.example.com/samples/ethereal-pad.wav', 116, 'Cm', 16.0, ARRAY['amapiano', 'pad', 'texture', 'ambient'], true, false, 0),
  (gen_random_uuid(), 'cd0b56c2-2713-4a6d-b12a-c1aa29e8aa5f', 'Warm Synth Arp Gm', 'LANDR Amapiano Textures', 'amapiano', 'loop', 'https://storage.example.com/samples/synth-arp-gm.wav', 120, 'Gm', 8.0, ARRAY['amapiano', 'synth', 'arp', 'texture'], true, false, 0),
  
  -- MIDI patterns
  (gen_random_uuid(), 'cd0b56c2-2713-4a6d-b12a-c1aa29e8aa5f', 'Amapiano Piano MIDI Dm', 'LANDR Amapiano MIDI', 'amapiano', 'midi', 'https://storage.example.com/samples/piano-midi-dm.mid', 112, 'Dm', 8.0, ARRAY['amapiano', 'piano', 'midi', 'pattern'], true, false, 0),
  (gen_random_uuid(), 'cd0b56c2-2713-4a6d-b12a-c1aa29e8aa5f', 'Log Drum MIDI Pattern', 'LANDR Amapiano MIDI', 'amapiano', 'midi', 'https://storage.example.com/samples/log-drum-midi.mid', 116, 'C', 4.0, ARRAY['amapiano', 'log-drum', 'midi', 'pattern'], true, false, 0);

-- Insert Amapiano-focused plugins/presets to marketplace
INSERT INTO public.marketplace_items (id, name, description, category, subcategory, price_cents, currency, tags, downloads, rating, active, featured, seller_id)
VALUES
  (gen_random_uuid(), 'Amapiano Producer Pack', 'Complete Amapiano production toolkit with 500+ samples, MIDI files, and project templates', 'sample-pack', 'amapiano', 4999, 'USD', ARRAY['amapiano', 'samples', 'midi', 'templates', 'production'], 0, 4.8, true, true, null),
  (gen_random_uuid(), 'Log Drum Designer', 'AI-powered log drum pattern generator with authentic Amapiano grooves', 'plugin', 'drums', 2999, 'USD', ARRAY['amapiano', 'log-drum', 'ai', 'generator', 'drums'], 0, 4.9, true, true, null),
  (gen_random_uuid(), 'Amapiano Piano Presets', '150+ piano presets optimized for Amapiano production in Serum', 'preset', 'synth', 1999, 'USD', ARRAY['amapiano', 'piano', 'serum', 'presets', 'keys'], 0, 4.7, true, false, null),
  (gen_random_uuid(), 'SA Deep House Bundle', 'South African Deep House and Amapiano fusion sample collection', 'sample-pack', 'amapiano', 3499, 'USD', ARRAY['amapiano', 'deep-house', 'south-africa', 'samples'], 0, 4.6, true, false, null),
  (gen_random_uuid(), 'Tribal Percussion Kit', 'Authentic African percussion samples for Amapiano and Afro House', 'sample-pack', 'percussion', 2499, 'USD', ARRAY['amapiano', 'afro', 'percussion', 'tribal', 'drums'], 0, 4.8, true, false, null),
  (gen_random_uuid(), 'Amapiano Mastering Chain', 'Preset chain for mastering Amapiano tracks with warmth and punch', 'preset', 'mastering', 1499, 'USD', ARRAY['amapiano', 'mastering', 'chain', 'preset'], 0, 4.5, true, false, null),
  (gen_random_uuid(), 'Gqom to Amapiano Transition Pack', 'Samples bridging Gqom and Amapiano styles', 'sample-pack', 'amapiano', 2999, 'USD', ARRAY['amapiano', 'gqom', 'transition', 'south-africa'], 0, 4.4, true, false, null),
  (gen_random_uuid(), 'Amapiano Bass Designer', 'Synth preset pack for creating authentic Amapiano basslines', 'preset', 'bass', 1799, 'USD', ARRAY['amapiano', 'bass', 'synth', 'presets'], 0, 4.7, true, false, null);

-- Add vector embeddings metadata for ML training
INSERT INTO public.musical_vectors (id, entity_type, entity_id, metadata)
SELECT 
  gen_random_uuid(),
  'sample',
  id,
  jsonb_build_object(
    'name', name,
    'category', category,
    'bpm', bpm,
    'key_signature', key_signature,
    'tags', tags,
    'pack_name', pack_name,
    'ml_ready', true,
    'genre', 'amapiano'
  )
FROM public.sample_library
WHERE category = 'amapiano'
AND NOT EXISTS (
  SELECT 1 FROM public.musical_vectors mv 
  WHERE mv.entity_id = sample_library.id AND mv.entity_type = 'sample'
);