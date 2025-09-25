-- Create partnership requests table for streamlined onboarding
CREATE TABLE IF NOT EXISTS public.partnership_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  requester_id UUID REFERENCES auth.users(id),
  artist_name TEXT NOT NULL,
  email TEXT NOT NULL,
  genre_specialization TEXT,
  content_type TEXT NOT NULL DEFAULT 'style_profiles',
  message TEXT,
  social_links TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  priority_level TEXT NOT NULL DEFAULT 'medium',
  revenue_potential INTEGER DEFAULT 0,
  response_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewer_id UUID
);

-- Enable RLS
ALTER TABLE public.partnership_requests ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can create partnership requests" 
ON public.partnership_requests 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Users can view their own requests" 
ON public.partnership_requests 
FOR SELECT 
USING (requester_id = auth.uid());

-- Create content gap analysis table
CREATE TABLE IF NOT EXISTS public.content_gap_analysis (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  analysis_date DATE NOT NULL DEFAULT CURRENT_DATE,
  genre TEXT NOT NULL,
  subgenre TEXT,
  demand_score NUMERIC NOT NULL DEFAULT 0,
  supply_count INTEGER NOT NULL DEFAULT 0,
  gap_percentage NUMERIC NOT NULL DEFAULT 0,
  revenue_potential INTEGER NOT NULL DEFAULT 0,
  trending_velocity NUMERIC NOT NULL DEFAULT 0,
  bpm_range_min INTEGER,
  bpm_range_max INTEGER,
  key_signatures TEXT[],
  priority_level TEXT NOT NULL DEFAULT 'medium',
  monthly_searches INTEGER DEFAULT 0,
  remix_rate NUMERIC DEFAULT 0,
  analysis_metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.content_gap_analysis ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can view gap analysis" 
ON public.content_gap_analysis 
FOR SELECT 
USING (true);

-- Create partner metrics tracking
CREATE TABLE IF NOT EXISTS public.partnership_metrics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  metric_date DATE NOT NULL DEFAULT CURRENT_DATE,
  total_partnerships INTEGER NOT NULL DEFAULT 0,
  active_licenses INTEGER NOT NULL DEFAULT 0,
  remix_rate_improvement NUMERIC NOT NULL DEFAULT 0,
  partner_revenue_cents INTEGER NOT NULL DEFAULT 0,
  engagement_boost NUMERIC NOT NULL DEFAULT 0,
  content_utilization_rate NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.partnership_metrics ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can view partnership metrics" 
ON public.partnership_metrics 
FOR SELECT 
USING (true);

-- Insert initial metrics data
INSERT INTO public.partnership_metrics (
  total_partnerships,
  active_licenses,
  remix_rate_improvement,
  partner_revenue_cents,
  engagement_boost,
  content_utilization_rate
) VALUES (
  47,
  1230,
  12.0,
  45670000,
  28.0,
  73.5
) ON CONFLICT DO NOTHING;

-- Insert sample content gap data (fixed column name)
INSERT INTO public.content_gap_analysis (
  genre,
  subgenre,
  demand_score,
  supply_count,
  gap_percentage,
  revenue_potential,
  trending_velocity,
  bpm_range_min,
  bpm_range_max,
  key_signatures,
  priority_level,
  monthly_searches,
  remix_rate
) VALUES 
(
  'Private School Amapiano',
  'Melodic Private School',
  94,
  12,
  87,
  156000,
  145,
  112,
  118,
  ARRAY['C major', 'G major', 'A minor'],
  'critical',
  2400,
  23.4
),
(
  'Soulful Deep House',
  'Afro-Soulful',
  89,
  23,
  74,
  124000,
  98,
  118,
  125,
  ARRAY['F major', 'C major', 'D minor'],
  'critical',
  1890,
  19.8
),
(
  'Vocal Amapiano',
  'Female Vocal Leads',
  82,
  34,
  69,
  98000,
  112,
  115,
  120,
  ARRAY['G major', 'E minor', 'C major'],
  'high',
  1650,
  17.2
) ON CONFLICT DO NOTHING;