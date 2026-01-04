-- Create storage bucket for training audio files
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('training-audio', 'training-audio', true, 52428800)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for training audio
CREATE POLICY "Anyone can view training audio" ON storage.objects
FOR SELECT USING (bucket_id = 'training-audio');

CREATE POLICY "Authenticated users can upload training audio" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'training-audio' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update their training audio" ON storage.objects
FOR UPDATE USING (bucket_id = 'training-audio' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their training audio" ON storage.objects
FOR DELETE USING (bucket_id = 'training-audio' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Training samples table for storing metadata and analysis
CREATE TABLE public.training_samples (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  filename TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  file_size_bytes INTEGER,
  duration_seconds NUMERIC(10,2),
  
  -- Audio analysis
  bpm NUMERIC(6,2),
  key_signature TEXT,
  time_signature TEXT DEFAULT '4/4',
  energy NUMERIC(4,3),
  danceability NUMERIC(4,3),
  valence NUMERIC(4,3),
  spectral_centroid NUMERIC(10,2),
  spectral_rolloff NUMERIC(10,2),
  
  -- Classification
  primary_genre TEXT DEFAULT 'amapiano',
  subgenre TEXT,
  region TEXT,
  era TEXT,
  mood TEXT[],
  tags TEXT[],
  
  -- Authenticity scoring
  authenticity_score NUMERIC(4,3),
  log_drum_presence NUMERIC(4,3),
  bassline_score NUMERIC(4,3),
  shaker_presence NUMERIC(4,3),
  vocal_style_score NUMERIC(4,3),
  
  -- Training metadata
  quality_rating INTEGER CHECK (quality_rating >= 1 AND quality_rating <= 5),
  is_verified BOOLEAN DEFAULT false,
  annotated_by UUID,
  annotation_notes TEXT,
  
  -- Source info
  source_platform TEXT DEFAULT 'suno',
  source_url TEXT,
  generation_prompt TEXT,
  
  -- Vector embedding for similarity search
  embedding TEXT,
  
  -- Stem separation
  stems_separated BOOLEAN DEFAULT false,
  stems_path TEXT,
  
  -- Status
  processing_status TEXT DEFAULT 'pending' CHECK (processing_status IN ('pending', 'analyzing', 'analyzed', 'separating', 'complete', 'error')),
  error_message TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.training_samples ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view all training samples" ON public.training_samples
FOR SELECT USING (true);

CREATE POLICY "Users can insert their own samples" ON public.training_samples
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own samples" ON public.training_samples
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own samples" ON public.training_samples
FOR DELETE USING (auth.uid() = user_id);

-- Index for faster queries
CREATE INDEX idx_training_samples_user ON public.training_samples(user_id);
CREATE INDEX idx_training_samples_region ON public.training_samples(region);
CREATE INDEX idx_training_samples_subgenre ON public.training_samples(subgenre);
CREATE INDEX idx_training_samples_status ON public.training_samples(processing_status);
CREATE INDEX idx_training_samples_quality ON public.training_samples(quality_rating);

-- Trigger for updated_at
CREATE TRIGGER update_training_samples_updated_at
BEFORE UPDATE ON public.training_samples
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Training batches for organizing datasets
CREATE TABLE public.training_batches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  purpose TEXT CHECK (purpose IN ('genre_classification', 'element_generation', 'authenticity_scoring', 'full_generation')),
  sample_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'collecting' CHECK (status IN ('collecting', 'processing', 'ready', 'training', 'complete')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.training_batches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their batches" ON public.training_batches
FOR ALL USING (auth.uid() = user_id);

-- Link samples to batches
CREATE TABLE public.training_batch_samples (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  batch_id UUID REFERENCES public.training_batches(id) ON DELETE CASCADE,
  sample_id UUID REFERENCES public.training_samples(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(batch_id, sample_id)
);

ALTER TABLE public.training_batch_samples ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage batch samples" ON public.training_batch_samples
FOR ALL USING (
  EXISTS (SELECT 1 FROM public.training_batches WHERE id = batch_id AND user_id = auth.uid())
);