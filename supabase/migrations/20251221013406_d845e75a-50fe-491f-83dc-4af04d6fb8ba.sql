-- Voice training samples table for collecting artist voice samples
CREATE TABLE public.voice_training_samples (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  voice_style_id TEXT NOT NULL,
  sample_url TEXT NOT NULL,
  duration_seconds NUMERIC,
  language TEXT,
  region TEXT,
  quality_score NUMERIC,
  is_verified BOOLEAN DEFAULT false,
  verified_by UUID,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Training feedback for rating generated outputs
CREATE TABLE public.training_feedback (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  output_type TEXT NOT NULL, -- 'lyrics', 'vocals', 'instrumental', 'full_song'
  output_id TEXT,
  output_url TEXT,
  authenticity_rating INTEGER CHECK (authenticity_rating >= 1 AND authenticity_rating <= 5),
  quality_rating INTEGER CHECK (quality_rating >= 1 AND quality_rating <= 5),
  cultural_accuracy_rating INTEGER CHECK (cultural_accuracy_rating >= 1 AND cultural_accuracy_rating <= 5),
  voice_style_match_rating INTEGER CHECK (voice_style_match_rating >= 1 AND voice_style_match_rating <= 5),
  is_preferred BOOLEAN,
  feedback_text TEXT,
  tags TEXT[],
  generation_params JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Expert annotations for cultural elements
CREATE TABLE public.expert_annotations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  expert_id UUID NOT NULL,
  content_type TEXT NOT NULL, -- 'voice_sample', 'lyrics', 'instrumental', 'full_song'
  content_id UUID NOT NULL,
  authenticity_score NUMERIC CHECK (authenticity_score >= 0 AND authenticity_score <= 100),
  cultural_elements JSONB DEFAULT '{}', -- {log_drums: true, shaker_patterns: true, etc}
  regional_accuracy TEXT,
  language_accuracy TEXT,
  notes TEXT,
  is_certified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- A/B test results for comparing outputs
CREATE TABLE public.ab_test_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  test_type TEXT NOT NULL, -- 'voice_style', 'lyrics', 'instrumental'
  variant_a_id TEXT NOT NULL,
  variant_b_id TEXT NOT NULL,
  winner TEXT CHECK (winner IN ('a', 'b', 'tie')),
  time_to_decide_ms INTEGER,
  context JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.voice_training_samples ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expert_annotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ab_test_results ENABLE ROW LEVEL SECURITY;

-- RLS Policies for voice_training_samples
CREATE POLICY "Users can view all voice samples" ON public.voice_training_samples FOR SELECT USING (true);
CREATE POLICY "Users can upload their own samples" ON public.voice_training_samples FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own samples" ON public.voice_training_samples FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for training_feedback
CREATE POLICY "Users can view their own feedback" ON public.training_feedback FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can submit feedback" ON public.training_feedback FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for expert_annotations
CREATE POLICY "Anyone can view annotations" ON public.expert_annotations FOR SELECT USING (true);
CREATE POLICY "Experts can add annotations" ON public.expert_annotations FOR INSERT WITH CHECK (auth.uid() = expert_id);

-- RLS Policies for ab_test_results
CREATE POLICY "Users can view their own tests" ON public.ab_test_results FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can submit test results" ON public.ab_test_results FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Triggers for updated_at
CREATE TRIGGER update_voice_training_samples_updated_at
  BEFORE UPDATE ON public.voice_training_samples
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();