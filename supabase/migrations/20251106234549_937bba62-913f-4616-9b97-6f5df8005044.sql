-- Create table for sparse inference cache metrics
CREATE TABLE IF NOT EXISTS public.sparse_inference_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL,
  cache_key TEXT NOT NULL,
  activation_data BYTEA,
  hit_count INTEGER DEFAULT 0,
  last_accessed TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + interval '1 hour')
);

-- Create index for fast lookups
CREATE INDEX IF NOT EXISTS idx_sparse_cache_session ON public.sparse_inference_cache(session_id, cache_key);
CREATE INDEX IF NOT EXISTS idx_sparse_cache_expires ON public.sparse_inference_cache(expires_at);

-- Enable RLS
ALTER TABLE public.sparse_inference_cache ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can manage their own cache"
  ON public.sparse_inference_cache
  FOR ALL
  USING (auth.uid() = user_id);

-- Create table for distributed inference coordination
CREATE TABLE IF NOT EXISTS public.distributed_inference_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  job_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  priority INTEGER DEFAULT 0,
  edge_node_id TEXT,
  cloud_node_id TEXT,
  input_data JSONB,
  output_data JSONB,
  metrics JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT
);

-- Create index for job queue
CREATE INDEX IF NOT EXISTS idx_distributed_jobs_status ON public.distributed_inference_jobs(status, priority DESC, created_at);
CREATE INDEX IF NOT EXISTS idx_distributed_jobs_user ON public.distributed_inference_jobs(user_id);

-- Enable RLS
ALTER TABLE public.distributed_inference_jobs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own jobs"
  ON public.distributed_inference_jobs
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create jobs"
  ON public.distributed_inference_jobs
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own jobs"
  ON public.distributed_inference_jobs
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Create table for quantization model registry
CREATE TABLE IF NOT EXISTS public.quantized_models (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  model_name TEXT NOT NULL,
  original_size_mb NUMERIC NOT NULL,
  quantized_size_mb NUMERIC NOT NULL,
  quantization_method TEXT NOT NULL,
  bit_precision INTEGER NOT NULL,
  quality_score NUMERIC,
  inference_speedup NUMERIC,
  model_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create index
CREATE INDEX IF NOT EXISTS idx_quantized_models_name ON public.quantized_models(model_name);

-- Enable RLS
ALTER TABLE public.quantized_models ENABLE ROW LEVEL SECURITY;

-- RLS Policies (public read, admin write)
CREATE POLICY "Anyone can view quantized models"
  ON public.quantized_models
  FOR SELECT
  USING (true);

-- Function to clean expired cache
CREATE OR REPLACE FUNCTION clean_expired_cache()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.sparse_inference_cache
  WHERE expires_at < now();
END;
$$;

-- Function to update cache hit count
CREATE OR REPLACE FUNCTION increment_cache_hit(p_cache_key TEXT, p_session_id TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.sparse_inference_cache
  SET hit_count = hit_count + 1,
      last_accessed = now()
  WHERE cache_key = p_cache_key
    AND session_id = p_session_id;
END;
$$;