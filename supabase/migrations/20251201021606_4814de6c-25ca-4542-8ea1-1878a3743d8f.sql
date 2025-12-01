-- Create table for audio analysis results
CREATE TABLE public.audio_analysis_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  audio_url TEXT NOT NULL,
  analysis_type TEXT NOT NULL, -- 'essentia', 'unified', 'comprehensive'
  analysis_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.audio_analysis_results ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own analysis results"
  ON public.audio_analysis_results
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own analysis results"
  ON public.audio_analysis_results
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own analysis results"
  ON public.audio_analysis_results
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own analysis results"
  ON public.audio_analysis_results
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create table for amapianorization results
CREATE TABLE public.amapianorization_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  source_audio_url TEXT NOT NULL,
  output_audio_url TEXT,
  settings JSONB NOT NULL DEFAULT '{}'::jsonb,
  authenticity_score NUMERIC,
  elements_applied JSONB DEFAULT '[]'::jsonb,
  region TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.amapianorization_results ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can manage their own amapianorization results"
  ON public.amapianorization_results
  FOR ALL
  USING (auth.uid() = user_id);

-- Create table for generated samples
CREATE TABLE public.generated_samples (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  sample_type TEXT NOT NULL, -- 'log_drum', 'percussion', 'bass', 'piano'
  sample_url TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  region TEXT,
  bpm INTEGER,
  key_signature TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.generated_samples ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can manage their own generated samples"
  ON public.generated_samples
  FOR ALL
  USING (auth.uid() = user_id);

-- Create table for user study responses
CREATE TABLE public.user_study_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  baseline_audio_url TEXT NOT NULL,
  amapianorized_audio_url TEXT NOT NULL,
  authenticity_rating INTEGER CHECK (authenticity_rating >= 1 AND authenticity_rating <= 10),
  feedback TEXT,
  producer_experience TEXT, -- 'beginner', 'intermediate', 'advanced', 'professional'
  familiarity_with_amapiano TEXT, -- 'none', 'listener', 'producer', 'expert'
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_study_responses ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can create study responses"
  ON public.user_study_responses
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own study responses"
  ON public.user_study_responses
  FOR SELECT
  USING (auth.uid() = user_id);

-- Admins can view all study responses for research
CREATE POLICY "Admins can view all study responses"
  ON public.user_study_responses
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Create indexes for performance
CREATE INDEX idx_audio_analysis_user_id ON public.audio_analysis_results(user_id);
CREATE INDEX idx_audio_analysis_created_at ON public.audio_analysis_results(created_at DESC);
CREATE INDEX idx_amapianorization_user_id ON public.amapianorization_results(user_id);
CREATE INDEX idx_amapianorization_created_at ON public.amapianorization_results(created_at DESC);
CREATE INDEX idx_generated_samples_user_id ON public.generated_samples(user_id);
CREATE INDEX idx_generated_samples_type ON public.generated_samples(sample_type);
CREATE INDEX idx_user_study_created_at ON public.user_study_responses(created_at DESC);

-- Create updated_at trigger
CREATE TRIGGER update_audio_analysis_updated_at
  BEFORE UPDATE ON public.audio_analysis_results
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_amapianorization_updated_at
  BEFORE UPDATE ON public.amapianorization_results
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();