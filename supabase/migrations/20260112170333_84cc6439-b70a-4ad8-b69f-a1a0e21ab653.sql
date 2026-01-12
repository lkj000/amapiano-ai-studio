-- Sample Library Table (for browsable samples)
CREATE TABLE public.sample_library (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  name TEXT NOT NULL,
  pack_name TEXT,
  category TEXT NOT NULL DEFAULT 'Uncategorized',
  sample_type TEXT NOT NULL DEFAULT 'oneshot' CHECK (sample_type IN ('loop', 'oneshot', 'midi')),
  audio_url TEXT NOT NULL,
  bpm INTEGER,
  key_signature TEXT,
  duration_seconds NUMERIC(10,2),
  file_size_bytes BIGINT,
  tags TEXT[] DEFAULT '{}',
  is_public BOOLEAN DEFAULT false,
  is_favorite BOOLEAN DEFAULT false,
  download_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Distribution Releases Table
CREATE TABLE public.distribution_releases (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  title TEXT NOT NULL,
  artist_name TEXT NOT NULL,
  album_name TEXT,
  genre TEXT DEFAULT 'Amapiano',
  subgenre TEXT,
  audio_url TEXT NOT NULL,
  artwork_url TEXT,
  release_date DATE,
  upc_code TEXT,
  isrc_code TEXT,
  copyright TEXT,
  record_label TEXT,
  description TEXT,
  lyrics TEXT,
  is_explicit BOOLEAN DEFAULT false,
  region TEXT,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'pending', 'processing', 'live', 'rejected')),
  platforms JSONB DEFAULT '[]',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Royalty Splits Table
CREATE TABLE public.royalty_splits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  release_id UUID REFERENCES public.distribution_releases(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  track_title TEXT NOT NULL,
  collaborators JSONB NOT NULL DEFAULT '[]',
  total_streams BIGINT DEFAULT 0,
  total_revenue_cents BIGINT DEFAULT 0,
  is_finalized BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Plugin Library (user's installed/purchased plugins)
CREATE TABLE public.user_plugins (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  plugin_id TEXT NOT NULL,
  plugin_name TEXT NOT NULL,
  developer TEXT,
  category TEXT,
  plugin_type TEXT DEFAULT 'effect' CHECK (plugin_type IN ('effect', 'instrument', 'utility')),
  is_installed BOOLEAN DEFAULT true,
  is_favorite BOOLEAN DEFAULT false,
  purchase_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  license_key TEXT,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.sample_library ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.distribution_releases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.royalty_splits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_plugins ENABLE ROW LEVEL SECURITY;

-- Sample Library Policies
CREATE POLICY "Users can view public samples" ON public.sample_library
  FOR SELECT USING (is_public = true OR auth.uid() = user_id);

CREATE POLICY "Users can manage their own samples" ON public.sample_library
  FOR ALL USING (auth.uid() = user_id);

-- Distribution Releases Policies
CREATE POLICY "Users can view their own releases" ON public.distribution_releases
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own releases" ON public.distribution_releases
  FOR ALL USING (auth.uid() = user_id);

-- Royalty Splits Policies
CREATE POLICY "Users can view their own splits" ON public.royalty_splits
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own splits" ON public.royalty_splits
  FOR ALL USING (auth.uid() = user_id);

-- User Plugins Policies
CREATE POLICY "Users can view their own plugins" ON public.user_plugins
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own plugins" ON public.user_plugins
  FOR ALL USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_sample_library_user ON public.sample_library(user_id);
CREATE INDEX idx_sample_library_category ON public.sample_library(category);
CREATE INDEX idx_sample_library_public ON public.sample_library(is_public) WHERE is_public = true;
CREATE INDEX idx_distribution_releases_user ON public.distribution_releases(user_id);
CREATE INDEX idx_distribution_releases_status ON public.distribution_releases(status);
CREATE INDEX idx_royalty_splits_release ON public.royalty_splits(release_id);
CREATE INDEX idx_user_plugins_user ON public.user_plugins(user_id);

-- Update triggers
CREATE TRIGGER update_sample_library_updated_at
  BEFORE UPDATE ON public.sample_library
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_distribution_releases_updated_at
  BEFORE UPDATE ON public.distribution_releases
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_royalty_splits_updated_at
  BEFORE UPDATE ON public.royalty_splits
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();