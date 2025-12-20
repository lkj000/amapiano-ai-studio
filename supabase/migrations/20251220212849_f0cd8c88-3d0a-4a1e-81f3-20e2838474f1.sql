-- =====================================================
-- LEVEL 5 LEARNING SYSTEM TABLES
-- =====================================================

-- 1. Production Sessions - Track every generation attempt
CREATE TABLE public.production_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  request_data JSONB NOT NULL DEFAULT '{}',
  generation_params JSONB NOT NULL DEFAULT '{}',
  audio_url TEXT,
  quality_score NUMERIC,
  authenticity_score NUMERIC,
  passed_threshold BOOLEAN DEFAULT false,
  attempts INTEGER DEFAULT 1,
  total_duration_ms INTEGER,
  model_version TEXT DEFAULT 'base',
  genre TEXT NOT NULL,
  region TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- 2. User Feedback - Collect ratings and reports
CREATE TABLE public.user_feedback (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES public.production_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  feedback_type TEXT NOT NULL DEFAULT 'rating',
  issues TEXT[],
  comments TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 3. Training Examples - Positive/negative examples for model improvement
CREATE TABLE public.training_examples (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES public.production_sessions(id) ON DELETE SET NULL,
  audio_url TEXT NOT NULL,
  is_positive BOOLEAN NOT NULL,
  quality_score NUMERIC,
  features JSONB NOT NULL DEFAULT '{}',
  labels JSONB NOT NULL DEFAULT '{}',
  source TEXT DEFAULT 'auto',
  validated_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 4. Model Versions - Track trained model iterations
CREATE TABLE public.model_versions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  version_name TEXT NOT NULL,
  base_model TEXT NOT NULL DEFAULT 'facebook/musicgen-melody',
  training_config JSONB NOT NULL DEFAULT '{}',
  metrics JSONB NOT NULL DEFAULT '{}',
  checkpoint_url TEXT,
  status TEXT DEFAULT 'training',
  training_examples_count INTEGER DEFAULT 0,
  epochs_completed INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- 5. Learning Metrics - Track system performance over time
CREATE TABLE public.learning_metrics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  metric_date DATE NOT NULL DEFAULT CURRENT_DATE,
  metric_type TEXT NOT NULL,
  metric_value NUMERIC NOT NULL,
  sample_count INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(metric_date, metric_type)
);

-- 6. Retraining Triggers - Track when retraining is needed
CREATE TABLE public.retraining_triggers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  trigger_reason TEXT NOT NULL,
  quality_threshold NUMERIC,
  current_quality NUMERIC,
  positive_examples INTEGER,
  negative_examples INTEGER,
  triggered_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  resolved_at TIMESTAMP WITH TIME ZONE,
  model_version_id UUID REFERENCES public.model_versions(id)
);

-- Enable RLS on all tables
ALTER TABLE public.production_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_examples ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.model_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.retraining_triggers ENABLE ROW LEVEL SECURITY;

-- RLS Policies for production_sessions
CREATE POLICY "Users can view their own sessions"
  ON public.production_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own sessions"
  ON public.production_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "System can update sessions"
  ON public.production_sessions FOR UPDATE
  USING (true);

-- RLS Policies for user_feedback
CREATE POLICY "Users can view their own feedback"
  ON public.user_feedback FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create feedback"
  ON public.user_feedback FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for training_examples (public read for training)
CREATE POLICY "Anyone can view training examples"
  ON public.training_examples FOR SELECT
  USING (true);

CREATE POLICY "System can manage training examples"
  ON public.training_examples FOR ALL
  USING (true);

-- RLS Policies for model_versions (public read)
CREATE POLICY "Anyone can view model versions"
  ON public.model_versions FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage model versions"
  ON public.model_versions FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for learning_metrics (public read)
CREATE POLICY "Anyone can view learning metrics"
  ON public.learning_metrics FOR SELECT
  USING (true);

CREATE POLICY "System can manage learning metrics"
  ON public.learning_metrics FOR ALL
  USING (true);

-- RLS Policies for retraining_triggers
CREATE POLICY "Anyone can view retraining triggers"
  ON public.retraining_triggers FOR SELECT
  USING (true);

CREATE POLICY "System can manage retraining triggers"
  ON public.retraining_triggers FOR ALL
  USING (true);

-- Indexes for performance
CREATE INDEX idx_production_sessions_user ON public.production_sessions(user_id);
CREATE INDEX idx_production_sessions_created ON public.production_sessions(created_at DESC);
CREATE INDEX idx_production_sessions_genre ON public.production_sessions(genre);
CREATE INDEX idx_training_examples_positive ON public.training_examples(is_positive);
CREATE INDEX idx_learning_metrics_date ON public.learning_metrics(metric_date DESC);
CREATE INDEX idx_model_versions_active ON public.model_versions(is_active) WHERE is_active = true;