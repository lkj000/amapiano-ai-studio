-- Create cloud projects table
CREATE TABLE IF NOT EXISTS public.cloud_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  project_data JSONB NOT NULL,
  thumbnail_url TEXT,
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.cloud_projects ENABLE ROW LEVEL SECURITY;

-- Policies for cloud_projects
CREATE POLICY "Users can view their own projects"
ON public.cloud_projects
FOR SELECT
USING (auth.uid() = user_id OR is_public = true);

CREATE POLICY "Users can create their own projects"
ON public.cloud_projects
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own projects"
ON public.cloud_projects
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own projects"
ON public.cloud_projects
FOR DELETE
USING (auth.uid() = user_id);

-- Create audio_to_midi_conversions table
CREATE TABLE IF NOT EXISTS public.audio_to_midi_conversions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  audio_url TEXT NOT NULL,
  midi_data JSONB,
  status TEXT NOT NULL DEFAULT 'processing',
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

-- Enable RLS
ALTER TABLE public.audio_to_midi_conversions ENABLE ROW LEVEL SECURITY;

-- Policies for audio_to_midi_conversions
CREATE POLICY "Users can view their own conversions"
ON public.audio_to_midi_conversions
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create conversions"
ON public.audio_to_midi_conversions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own conversions"
ON public.audio_to_midi_conversions
FOR UPDATE
USING (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_cloud_projects_updated_at
BEFORE UPDATE ON public.cloud_projects
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add indexes for performance
CREATE INDEX idx_cloud_projects_user_id ON public.cloud_projects(user_id);
CREATE INDEX idx_cloud_projects_updated_at ON public.cloud_projects(updated_at DESC);
CREATE INDEX idx_audio_to_midi_user_id ON public.audio_to_midi_conversions(user_id);
CREATE INDEX idx_audio_to_midi_status ON public.audio_to_midi_conversions(status);