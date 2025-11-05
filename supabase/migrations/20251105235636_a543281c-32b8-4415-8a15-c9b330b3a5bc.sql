-- Create performance benchmarks table
CREATE TABLE IF NOT EXISTS public.performance_benchmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  benchmark_name TEXT NOT NULL,
  metric_type TEXT NOT NULL CHECK (metric_type IN ('latency', 'cpu', 'throughput', 'cost')),
  industry_average NUMERIC NOT NULL,
  percentile_50 NUMERIC NOT NULL,
  percentile_75 NUMERIC NOT NULL,
  percentile_90 NUMERIC NOT NULL,
  percentile_95 NUMERIC NOT NULL,
  percentile_99 NUMERIC NOT NULL,
  unit TEXT NOT NULL,
  description TEXT,
  source TEXT,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create performance comments table for team collaboration
CREATE TABLE IF NOT EXISTS public.performance_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  metric_id UUID REFERENCES public.performance_metrics(id) ON DELETE CASCADE,
  anomaly_id UUID REFERENCES public.performance_anomalies(id) ON DELETE CASCADE,
  comment_text TEXT NOT NULL,
  mentions JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  CONSTRAINT comment_target_check CHECK (
    (metric_id IS NOT NULL AND anomaly_id IS NULL) OR 
    (metric_id IS NULL AND anomaly_id IS NOT NULL)
  )
);

-- Enable RLS on performance_benchmarks
ALTER TABLE public.performance_benchmarks ENABLE ROW LEVEL SECURITY;

-- Anyone can view benchmarks
CREATE POLICY "Anyone can view benchmarks"
ON public.performance_benchmarks
FOR SELECT
USING (true);

-- Only admins can manage benchmarks
CREATE POLICY "Admins can manage benchmarks"
ON public.performance_benchmarks
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Enable RLS on performance_comments
ALTER TABLE public.performance_comments ENABLE ROW LEVEL SECURITY;

-- Users can view comments on their own metrics/anomalies
CREATE POLICY "Users can view comments on their metrics"
ON public.performance_comments
FOR SELECT
USING (
  metric_id IN (
    SELECT id FROM public.performance_metrics WHERE user_id = auth.uid()
  )
  OR anomaly_id IN (
    SELECT id FROM public.performance_anomalies WHERE user_id = auth.uid()
  )
);

-- Users can create comments on their own metrics/anomalies
CREATE POLICY "Users can comment on their metrics"
ON public.performance_comments
FOR INSERT
WITH CHECK (
  auth.uid() = user_id
  AND (
    metric_id IN (
      SELECT id FROM public.performance_metrics WHERE user_id = auth.uid()
    )
    OR anomaly_id IN (
      SELECT id FROM public.performance_anomalies WHERE user_id = auth.uid()
    )
  )
);

-- Users can update their own comments
CREATE POLICY "Users can update their own comments"
ON public.performance_comments
FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own comments
CREATE POLICY "Users can delete their own comments"
ON public.performance_comments
FOR DELETE
USING (auth.uid() = user_id);

-- Create trigger for updated_at on performance_comments
CREATE TRIGGER update_performance_comments_updated_at
  BEFORE UPDATE ON public.performance_comments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample industry benchmarks
INSERT INTO public.performance_benchmarks (benchmark_name, metric_type, industry_average, percentile_50, percentile_75, percentile_90, percentile_95, percentile_99, unit, description, source) VALUES
  ('AI Music Generation Latency', 'latency', 250.0, 180.0, 220.0, 280.0, 350.0, 500.0, 'ms', 'Industry benchmark for AI music generation response times', 'Industry Survey 2025'),
  ('Audio Processing CPU Usage', 'cpu', 55.0, 45.0, 60.0, 70.0, 80.0, 90.0, '%', 'Average CPU utilization during audio processing', 'Industry Survey 2025'),
  ('Generation Throughput', 'throughput', 25.0, 20.0, 30.0, 40.0, 50.0, 75.0, 'ops/min', 'Generations per minute benchmark', 'Industry Survey 2025'),
  ('Monthly Cost per User', 'cost', 15.5, 10.0, 18.0, 25.0, 35.0, 50.0, 'USD', 'Average monthly cost per active user', 'Industry Survey 2025');

-- Enable realtime for performance_comments
ALTER PUBLICATION supabase_realtime ADD TABLE public.performance_comments;