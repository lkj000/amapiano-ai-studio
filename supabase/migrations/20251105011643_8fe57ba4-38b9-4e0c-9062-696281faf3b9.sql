-- Create arrangement_templates table for cloud sync
CREATE TABLE IF NOT EXISTS public.arrangement_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  sections JSONB NOT NULL,
  total_bars INTEGER NOT NULL,
  genre TEXT,
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.arrangement_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own templates"
  ON public.arrangement_templates FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view public templates"
  ON public.arrangement_templates FOR SELECT
  USING (is_public = true);

CREATE POLICY "Users can create their own templates"
  ON public.arrangement_templates FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own templates"
  ON public.arrangement_templates FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own templates"
  ON public.arrangement_templates FOR DELETE
  USING (auth.uid() = user_id);

-- Create index for performance
CREATE INDEX idx_arrangement_templates_user_id ON public.arrangement_templates(user_id);
CREATE INDEX idx_arrangement_templates_public ON public.arrangement_templates(is_public) WHERE is_public = true;

-- Create time_stretched_tracks table for timeline integration
CREATE TABLE IF NOT EXISTS public.time_stretched_tracks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  project_id UUID,
  track_name TEXT NOT NULL,
  original_bpm NUMERIC NOT NULL,
  target_bpm NUMERIC NOT NULL,
  start_time NUMERIC DEFAULT 0,
  audio_data BYTEA,
  waveform_peaks JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.time_stretched_tracks ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own tracks"
  ON public.time_stretched_tracks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own tracks"
  ON public.time_stretched_tracks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tracks"
  ON public.time_stretched_tracks FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tracks"
  ON public.time_stretched_tracks FOR DELETE
  USING (auth.uid() = user_id);

-- Create index
CREATE INDEX idx_time_stretched_tracks_user_id ON public.time_stretched_tracks(user_id);
CREATE INDEX idx_time_stretched_tracks_project_id ON public.time_stretched_tracks(project_id);