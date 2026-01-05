-- ============================================================================
-- AURA-X Enhanced Database Schema: Instruments & Training Data
-- ============================================================================

-- 1. Instruments Catalog Table
CREATE TABLE public.instruments_catalog (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  instrument_id TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('bass', 'percussion', 'keys', 'strings', 'brass', 'synth', 'vocal')),
  description TEXT,
  default_parameters JSONB DEFAULT '{}',
  processing_options JSONB DEFAULT '{}',
  style_options TEXT[] DEFAULT '{}',
  is_core BOOLEAN DEFAULT true,
  subgenre_compatibility TEXT[] DEFAULT '{}',
  icon_name TEXT,
  example_audio_url TEXT
);

-- Enable RLS
ALTER TABLE public.instruments_catalog ENABLE ROW LEVEL SECURITY;

-- Public read access for instruments
CREATE POLICY "Instruments are publicly readable"
ON public.instruments_catalog
FOR SELECT
USING (true);

-- 2. Subgenre Profiles Table
CREATE TABLE public.subgenre_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  subgenre_id TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  core_instruments TEXT[] DEFAULT '{}',
  optional_instruments TEXT[] DEFAULT '{}',
  tempo_range INT[] DEFAULT ARRAY[108, 115],
  default_processing JSONB DEFAULT '{}',
  characteristics JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true
);

-- Enable RLS
ALTER TABLE public.subgenre_profiles ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Subgenre profiles are publicly readable"
ON public.subgenre_profiles
FOR SELECT
USING (true);

-- 3. Track Instruments (many-to-many relationship)
CREATE TABLE public.track_instruments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  track_id UUID NOT NULL,
  instrument_id UUID NOT NULL REFERENCES public.instruments_catalog(id) ON DELETE CASCADE,
  presence DECIMAL DEFAULT 1.0 CHECK (presence >= 0 AND presence <= 1),
  style TEXT,
  processing JSONB DEFAULT '{}',
  volume DECIMAL DEFAULT 1.0,
  pan DECIMAL DEFAULT 0.0,
  muted BOOLEAN DEFAULT false,
  solo BOOLEAN DEFAULT false,
  order_index INTEGER DEFAULT 0,
  user_id UUID NOT NULL
);

-- Enable RLS
ALTER TABLE public.track_instruments ENABLE ROW LEVEL SECURITY;

-- Users can manage their own track instruments
CREATE POLICY "Users can view their own track instruments"
ON public.track_instruments FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own track instruments"
ON public.track_instruments FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own track instruments"
ON public.track_instruments FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own track instruments"
ON public.track_instruments FOR DELETE
USING (auth.uid() = user_id);

-- 4. Instrument Presets (user-saved configurations)
CREATE TABLE public.instrument_presets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  user_id UUID NOT NULL,
  instrument_id UUID NOT NULL REFERENCES public.instruments_catalog(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  parameters JSONB DEFAULT '{}',
  usage_count INTEGER DEFAULT 0,
  is_public BOOLEAN DEFAULT false,
  tags TEXT[] DEFAULT '{}'
);

-- Enable RLS
ALTER TABLE public.instrument_presets ENABLE ROW LEVEL SECURITY;

-- Users can view public presets and their own
CREATE POLICY "Users can view public and own presets"
ON public.instrument_presets FOR SELECT
USING (is_public = true OR auth.uid() = user_id);

CREATE POLICY "Users can create their own presets"
ON public.instrument_presets FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own presets"
ON public.instrument_presets FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own presets"
ON public.instrument_presets FOR DELETE
USING (auth.uid() = user_id);

-- 5. Enhance training_samples table with new fields
ALTER TABLE public.training_samples 
ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'unknown' CHECK (source IN ('suno_ai', 'real_producer', 'splice', 'custom', 'unknown')),
ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'instrumental' CHECK (language IN ('isizulu', 'xhosa', 'english', 'sesotho', 'mixed', 'instrumental')),
ADD COLUMN IF NOT EXISTS prompt TEXT,
ADD COLUMN IF NOT EXISTS has_vocals BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS section_type TEXT CHECK (section_type IN ('intro', 'buildup', 'drop', 'breakdown', 'outro', 'full', NULL)),
ADD COLUMN IF NOT EXISTS quality_log_drum DECIMAL CHECK (quality_log_drum >= 0 AND quality_log_drum <= 5),
ADD COLUMN IF NOT EXISTS quality_chords DECIMAL CHECK (quality_chords >= 0 AND quality_chords <= 5),
ADD COLUMN IF NOT EXISTS quality_rhythm DECIMAL CHECK (quality_rhythm >= 0 AND quality_rhythm <= 5),
ADD COLUMN IF NOT EXISTS quality_overall DECIMAL CHECK (quality_overall >= 0 AND quality_overall <= 5);

-- Update subgenre check to include new values
ALTER TABLE public.training_samples 
DROP CONSTRAINT IF EXISTS training_samples_subgenre_check;

ALTER TABLE public.training_samples 
ADD CONSTRAINT training_samples_subgenre_check 
CHECK (subgenre IS NULL OR subgenre IN ('private-school', 'dust', 'kabza-style', 'vocal-deep', 'commercial', 'sgija', 'bacardi', 'piano-hub'));

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_instruments_catalog_category ON public.instruments_catalog(category);
CREATE INDEX IF NOT EXISTS idx_instruments_catalog_instrument_id ON public.instruments_catalog(instrument_id);
CREATE INDEX IF NOT EXISTS idx_subgenre_profiles_subgenre_id ON public.subgenre_profiles(subgenre_id);
CREATE INDEX IF NOT EXISTS idx_track_instruments_track_id ON public.track_instruments(track_id);
CREATE INDEX IF NOT EXISTS idx_track_instruments_user_id ON public.track_instruments(user_id);
CREATE INDEX IF NOT EXISTS idx_training_samples_source ON public.training_samples(source);
CREATE INDEX IF NOT EXISTS idx_training_samples_language ON public.training_samples(language);
CREATE INDEX IF NOT EXISTS idx_training_samples_subgenre ON public.training_samples(subgenre);