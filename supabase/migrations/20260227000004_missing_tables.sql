-- Migration: missing tables needed by edge functions and src hooks
-- Tables verified missing: performance_alerts, generation_costs, analytics_events
-- Tables already present (skipped): ab_test_results, performance_metrics, performance_anomalies

-- performance_alerts: alert notifications sent (used by send-performance-alert edge function)
-- Note: anomaly_id stored as uuid without FK to allow creation independent of performance_anomalies table
CREATE TABLE IF NOT EXISTS public.performance_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_type text NOT NULL,
  channel text NOT NULL CHECK (channel IN ('email', 'slack', 'webhook')),
  recipient text,
  subject text,
  body text,
  anomaly_id uuid,
  metric text,
  current_value text,
  threshold text,
  sent_at timestamptz DEFAULT now(),
  success boolean DEFAULT true,
  error_message text
);
ALTER TABLE public.performance_alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role can manage performance_alerts" ON public.performance_alerts FOR ALL USING (true);

-- generation_costs: tracks AI generation costs per user (used by useCostTracking persistence)
CREATE TABLE IF NOT EXISTS public.generation_costs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  model text NOT NULL,
  tokens_used integer DEFAULT 0,
  cost_usd numeric(10,6) DEFAULT 0,
  operation text NOT NULL,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS generation_costs_user_idx ON public.generation_costs(user_id, created_at DESC);
ALTER TABLE public.generation_costs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read their own generation_costs" ON public.generation_costs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Service role can insert generation_costs" ON public.generation_costs FOR INSERT WITH CHECK (true);

-- analytics_events: general analytics tracking (used by metrics function, EngagementAnalytics, useAuditLog, DataSpace)
-- Schema matches src/integrations/supabase/types.ts definition
CREATE TABLE IF NOT EXISTS public.analytics_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  event_type text NOT NULL,
  event_data jsonb DEFAULT '{}',
  session_id text,
  post_id uuid,
  page_path text,
  ip_address text,
  user_agent text,
  country_code text,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS analytics_events_type_idx ON public.analytics_events(event_type, created_at DESC);
CREATE INDEX IF NOT EXISTS analytics_events_user_idx ON public.analytics_events(user_id, created_at DESC);
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can insert analytics_events" ON public.analytics_events FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);
CREATE POLICY "Service role can read all analytics_events" ON public.analytics_events FOR SELECT USING (true);
