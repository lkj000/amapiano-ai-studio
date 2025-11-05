-- Create performance metrics table for realtime monitoring
CREATE TABLE IF NOT EXISTS public.performance_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  metric_type TEXT NOT NULL CHECK (metric_type IN ('latency', 'cpu', 'throughput', 'cost')),
  value NUMERIC NOT NULL,
  method TEXT CHECK (method IN ('wasm', 'js')),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.performance_metrics ENABLE ROW LEVEL SECURITY;

-- Policies for performance metrics
CREATE POLICY "Users can view their own metrics"
  ON public.performance_metrics
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own metrics"
  ON public.performance_metrics
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create index for efficient queries
CREATE INDEX idx_performance_metrics_user_created 
  ON public.performance_metrics(user_id, created_at DESC);

CREATE INDEX idx_performance_metrics_type 
  ON public.performance_metrics(metric_type, created_at DESC);

-- Create anomalies table
CREATE TABLE IF NOT EXISTS public.performance_anomalies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  anomaly_type TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  description TEXT NOT NULL,
  metrics JSONB DEFAULT '{}'::jsonb,
  detected_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  resolved_at TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'acknowledged', 'resolved'))
);

-- Enable RLS for anomalies
ALTER TABLE public.performance_anomalies ENABLE ROW LEVEL SECURITY;

-- Policies for anomalies
CREATE POLICY "Users can view their own anomalies"
  ON public.performance_anomalies
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own anomalies"
  ON public.performance_anomalies
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Enable realtime for performance metrics
ALTER TABLE public.performance_metrics REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.performance_metrics;

-- Enable realtime for anomalies
ALTER TABLE public.performance_anomalies REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.performance_anomalies;