
-- DJ Agent: Library tracks (user's uploaded audio pool)
CREATE TABLE public.dj_library_tracks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  artist TEXT,
  file_url TEXT NOT NULL,
  file_format TEXT NOT NULL DEFAULT 'mp3',
  duration_sec REAL,
  sha256 TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.dj_library_tracks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own dj tracks" ON public.dj_library_tracks FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- DJ Agent: Extracted features per track
CREATE TABLE public.dj_track_features (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  track_id UUID NOT NULL REFERENCES public.dj_library_tracks(id) ON DELETE CASCADE,
  bpm REAL,
  bpm_confidence REAL,
  key TEXT,
  camelot TEXT,
  lufs_integrated REAL,
  true_peak_db REAL,
  energy_curve JSONB DEFAULT '[]',
  segments JSONB DEFAULT '[]',
  beatgrid JSONB DEFAULT '[]',
  vocal_activity_curve JSONB DEFAULT '[]',
  analyzed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.dj_track_features ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own track features" ON public.dj_track_features FOR ALL
  USING (EXISTS (SELECT 1 FROM public.dj_library_tracks t WHERE t.id = track_id AND t.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.dj_library_tracks t WHERE t.id = track_id AND t.user_id = auth.uid()));

-- DJ Agent: Performance plans (the set blueprint)
CREATE TABLE public.dj_performance_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL DEFAULT 'Untitled Set',
  preset TEXT NOT NULL DEFAULT 'balanced',
  duration_target_sec REAL NOT NULL DEFAULT 3600,
  risk REAL NOT NULL DEFAULT 0.35,
  plan_data JSONB NOT NULL DEFAULT '{}',
  scores JSONB DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'draft',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.dj_performance_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own dj plans" ON public.dj_performance_plans FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- DJ Agent: Rendered mixes
CREATE TABLE public.dj_renders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  plan_id UUID NOT NULL REFERENCES public.dj_performance_plans(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  output_url TEXT,
  cuesheet JSONB DEFAULT '[]',
  format TEXT NOT NULL DEFAULT 'mp3',
  render_duration_sec REAL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.dj_renders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own dj renders" ON public.dj_renders FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_dj_tracks_user ON public.dj_library_tracks(user_id);
CREATE INDEX idx_dj_features_track ON public.dj_track_features(track_id);
CREATE INDEX idx_dj_plans_user ON public.dj_performance_plans(user_id);
CREATE INDEX idx_dj_renders_plan ON public.dj_renders(plan_id);
