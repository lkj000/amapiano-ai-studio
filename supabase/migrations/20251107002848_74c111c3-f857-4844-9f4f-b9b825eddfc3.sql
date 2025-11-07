-- Create test_history table for tracking research test runs
CREATE TABLE IF NOT EXISTS public.test_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  test_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  test_type TEXT NOT NULL, -- 'sparse', 'quantization', 'distributed', 'full_suite'
  test_results JSONB NOT NULL DEFAULT '{}'::jsonb,
  summary_metrics JSONB NOT NULL DEFAULT '{}'::jsonb,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.test_history ENABLE ROW LEVEL SECURITY;

-- Users can view their own test history
CREATE POLICY "Users can view their own test history"
  ON public.test_history
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own test history
CREATE POLICY "Users can insert their own test history"
  ON public.test_history
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own test history
CREATE POLICY "Users can delete their own test history"
  ON public.test_history
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_test_history_user_date 
  ON public.test_history(user_id, test_date DESC);

CREATE INDEX IF NOT EXISTS idx_test_history_type 
  ON public.test_history(user_id, test_type);