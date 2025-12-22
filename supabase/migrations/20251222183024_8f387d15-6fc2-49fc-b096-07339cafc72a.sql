-- Voice Licensing & Artist Partnership Tables
-- Core infrastructure for AURA X artist voice licensing with revenue share

-- Voice Models: Licensed artist voices for synthesis
CREATE TABLE public.voice_models (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  artist_name TEXT NOT NULL,
  voice_name TEXT NOT NULL,
  description TEXT,
  voice_type TEXT DEFAULT 'singing', -- 'singing', 'speaking', 'both'
  gender TEXT, -- 'male', 'female', 'other'
  language_codes TEXT[] DEFAULT ARRAY['zu', 'en'], -- Primary languages
  genre_specialization TEXT[] DEFAULT ARRAY['amapiano'],
  
  -- Licensing info
  license_type TEXT DEFAULT 'revenue_share', -- 'revenue_share', 'flat_fee', 'exclusive'
  revenue_share_percentage NUMERIC(5,2) DEFAULT 15.00, -- Artist gets this % per generation
  is_premium BOOLEAN DEFAULT false, -- Premium voices cost extra
  premium_fee_cents INTEGER DEFAULT 0, -- Extra fee per generation
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  is_public BOOLEAN DEFAULT false, -- Available to all users
  approval_status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  
  -- Training metadata
  training_hours NUMERIC(6,2), -- Hours of training data
  sample_count INTEGER DEFAULT 0,
  model_version TEXT DEFAULT '1.0',
  quality_score NUMERIC(3,2), -- 0-1 quality rating
  
  -- Audio samples for preview
  preview_audio_url TEXT,
  sample_urls TEXT[],
  
  -- Consent & legal
  consent_document_url TEXT,
  contract_id TEXT, -- Reference to external contract system
  artist_user_id UUID, -- If artist has an account
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Voice Usage Tracking: Track every generation using a voice
CREATE TABLE public.voice_usage (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  voice_model_id UUID REFERENCES public.voice_models(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  
  -- Usage details
  generation_type TEXT NOT NULL, -- 'song', 'vocals', 'backing', 'sample'
  duration_seconds NUMERIC(10,2),
  output_audio_url TEXT,
  
  -- Earnings calculation
  base_cost_cents INTEGER DEFAULT 0,
  premium_cost_cents INTEGER DEFAULT 0,
  artist_earnings_cents INTEGER DEFAULT 0, -- Artist's share
  platform_earnings_cents INTEGER DEFAULT 0, -- Platform's share
  
  -- Status
  payment_status TEXT DEFAULT 'pending', -- 'pending', 'processed', 'paid_out'
  processed_at TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  generation_params JSONB DEFAULT '{}',
  quality_score NUMERIC(3,2),
  user_rating INTEGER, -- 1-5 rating from user
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Artist Payouts: Track payments to artists
CREATE TABLE public.artist_payouts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  artist_user_id UUID, -- If artist has account
  voice_model_id UUID REFERENCES public.voice_models(id) ON DELETE SET NULL,
  
  -- Payout details
  period_start TIMESTAMP WITH TIME ZONE NOT NULL,
  period_end TIMESTAMP WITH TIME ZONE NOT NULL,
  total_generations INTEGER DEFAULT 0,
  total_earnings_cents INTEGER DEFAULT 0,
  
  -- Payment info
  payment_method TEXT, -- 'bank_transfer', 'paypal', 'crypto'
  payment_reference TEXT,
  payment_status TEXT DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
  paid_at TIMESTAMP WITH TIME ZONE,
  
  -- Notes
  notes TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Voice License Requests: Artists can request to license their voice
CREATE TABLE public.voice_license_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  requester_id UUID NOT NULL,
  
  -- Artist info
  artist_name TEXT NOT NULL,
  artist_email TEXT NOT NULL,
  artist_phone TEXT,
  social_links JSONB DEFAULT '{}', -- Instagram, TikTok, etc.
  
  -- Voice details
  voice_type TEXT DEFAULT 'singing',
  genre_specialization TEXT[] DEFAULT ARRAY['amapiano'],
  languages TEXT[] DEFAULT ARRAY['zu', 'en'],
  
  -- Sample submission
  sample_audio_urls TEXT[],
  sample_description TEXT,
  
  -- License preferences
  preferred_license_type TEXT DEFAULT 'revenue_share',
  minimum_revenue_share NUMERIC(5,2), -- Artist's minimum requirement
  
  -- Status
  status TEXT DEFAULT 'submitted', -- 'submitted', 'under_review', 'approved', 'rejected', 'contract_sent'
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID,
  review_notes TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.voice_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.voice_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.artist_payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.voice_license_requests ENABLE ROW LEVEL SECURITY;

-- Voice Models Policies
CREATE POLICY "Public voice models are viewable by everyone" 
ON public.voice_models FOR SELECT 
USING (is_public = true AND is_active = true AND approval_status = 'approved');

CREATE POLICY "Artists can view their own voice models" 
ON public.voice_models FOR SELECT 
USING (auth.uid() = artist_user_id);

CREATE POLICY "Admins can manage all voice models" 
ON public.voice_models FOR ALL 
USING (public.has_role(auth.uid(), 'admin'));

-- Voice Usage Policies
CREATE POLICY "Users can view their own voice usage" 
ON public.voice_usage FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create voice usage records" 
ON public.voice_usage FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Artists can view usage of their voices" 
ON public.voice_usage FOR SELECT 
USING (
  voice_model_id IN (
    SELECT id FROM public.voice_models WHERE artist_user_id = auth.uid()
  )
);

-- Artist Payouts Policies
CREATE POLICY "Artists can view their own payouts" 
ON public.artist_payouts FOR SELECT 
USING (auth.uid() = artist_user_id);

CREATE POLICY "Admins can manage all payouts" 
ON public.artist_payouts FOR ALL 
USING (public.has_role(auth.uid(), 'admin'));

-- Voice License Requests Policies
CREATE POLICY "Users can view their own license requests" 
ON public.voice_license_requests FOR SELECT 
USING (auth.uid() = requester_id);

CREATE POLICY "Users can create license requests" 
ON public.voice_license_requests FOR INSERT 
WITH CHECK (auth.uid() = requester_id);

CREATE POLICY "Users can update their own pending requests" 
ON public.voice_license_requests FOR UPDATE 
USING (auth.uid() = requester_id AND status = 'submitted');

CREATE POLICY "Admins can manage all license requests" 
ON public.voice_license_requests FOR ALL 
USING (public.has_role(auth.uid(), 'admin'));

-- Indexes for performance
CREATE INDEX idx_voice_models_active ON public.voice_models(is_active, is_public, approval_status);
CREATE INDEX idx_voice_models_artist ON public.voice_models(artist_user_id);
CREATE INDEX idx_voice_usage_user ON public.voice_usage(user_id, created_at DESC);
CREATE INDEX idx_voice_usage_model ON public.voice_usage(voice_model_id, created_at DESC);
CREATE INDEX idx_artist_payouts_artist ON public.artist_payouts(artist_user_id);
CREATE INDEX idx_voice_license_requests_status ON public.voice_license_requests(status);

-- Triggers for updated_at
CREATE TRIGGER update_voice_models_updated_at
BEFORE UPDATE ON public.voice_models
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_voice_license_requests_updated_at
BEFORE UPDATE ON public.voice_license_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();