-- Phase 2: Monetization Backend - Creator Economy Tables

-- Create tipping transactions table
CREATE TABLE public.tip_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tipper_id UUID NOT NULL,
  recipient_id UUID NOT NULL,
  post_id UUID,
  amount_cents INTEGER NOT NULL,
  currency TEXT DEFAULT 'usd',
  message TEXT,
  processed_at TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create subscription tiers table for premium features
CREATE TABLE public.subscription_tiers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tier_name TEXT NOT NULL UNIQUE,
  price_cents INTEGER NOT NULL,
  currency TEXT DEFAULT 'usd',
  features JSONB NOT NULL DEFAULT '[]'::jsonb,
  ai_generation_credits INTEGER DEFAULT 100,
  upload_limit_mb INTEGER DEFAULT 100,
  priority_processing BOOLEAN DEFAULT false,
  exclusive_models BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user wallets for earnings tracking
CREATE TABLE public.user_wallets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  balance_cents INTEGER DEFAULT 0,
  currency TEXT DEFAULT 'usd',
  total_earned_cents INTEGER DEFAULT 0,
  total_withdrawn_cents INTEGER DEFAULT 0,
  stripe_account_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create remix royalty splits table
CREATE TABLE public.remix_royalties (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  remix_post_id UUID NOT NULL,
  original_post_id UUID NOT NULL,
  original_creator_id UUID NOT NULL,
  remix_creator_id UUID NOT NULL,
  royalty_percentage NUMERIC DEFAULT 15.0, -- 15% to original creator
  total_earnings_cents INTEGER DEFAULT 0,
  original_creator_earnings_cents INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create AI model marketplace for premium models
CREATE TABLE public.ai_model_marketplace (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  model_name TEXT NOT NULL,
  developer_id UUID NOT NULL,
  price_cents INTEGER NOT NULL,
  currency TEXT DEFAULT 'usd',
  model_config JSONB NOT NULL DEFAULT '{}'::jsonb,
  description TEXT,
  usage_count INTEGER DEFAULT 0,
  rating NUMERIC DEFAULT 0.0,
  is_premium BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all monetization tables
ALTER TABLE public.tip_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.remix_royalties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_model_marketplace ENABLE ROW LEVEL SECURITY;

-- RLS Policies for tip_transactions
CREATE POLICY "Users can view tips they sent or received"
ON public.tip_transactions
FOR SELECT
USING (auth.uid() = tipper_id OR auth.uid() = recipient_id);

CREATE POLICY "Users can send tips"
ON public.tip_transactions
FOR INSERT
WITH CHECK (auth.uid() = tipper_id);

-- RLS Policies for subscription_tiers
CREATE POLICY "Anyone can view subscription tiers"
ON public.subscription_tiers
FOR SELECT
USING (true);

-- RLS Policies for user_wallets
CREATE POLICY "Users can view their own wallet"
ON public.user_wallets
FOR ALL
USING (auth.uid() = user_id);

-- RLS Policies for remix_royalties
CREATE POLICY "Users can view royalties they're involved in"
ON public.remix_royalties
FOR SELECT
USING (auth.uid() = original_creator_id OR auth.uid() = remix_creator_id);

CREATE POLICY "System can create royalty records"
ON public.remix_royalties
FOR INSERT
WITH CHECK (true);

-- RLS Policies for ai_model_marketplace
CREATE POLICY "Anyone can view active AI models"
ON public.ai_model_marketplace
FOR SELECT
USING (is_active = true);

CREATE POLICY "Developers can manage their models"
ON public.ai_model_marketplace
FOR ALL
USING (auth.uid() = developer_id);

-- Create indexes for performance
CREATE INDEX idx_tip_transactions_recipient ON public.tip_transactions(recipient_id);
CREATE INDEX idx_tip_transactions_tipper ON public.tip_transactions(tipper_id);
CREATE INDEX idx_tip_transactions_post ON public.tip_transactions(post_id);
CREATE INDEX idx_user_wallets_user_id ON public.user_wallets(user_id);
CREATE INDEX idx_remix_royalties_remix_post ON public.remix_royalties(remix_post_id);
CREATE INDEX idx_remix_royalties_original ON public.remix_royalties(original_post_id);
CREATE INDEX idx_ai_model_marketplace_active ON public.ai_model_marketplace(is_active);

-- Function to process micro-royalties from plays
CREATE OR REPLACE FUNCTION public.process_micro_royalty(
  p_post_id UUID,
  p_play_value_cents INTEGER DEFAULT 1
) RETURNS void AS $$
DECLARE
  post_creator UUID;
  original_post_creator UUID;
  royalty_split NUMERIC;
BEGIN
  -- Get post creator
  SELECT creator_id INTO post_creator
  FROM public.social_posts
  WHERE id = p_post_id;
  
  -- Check if this is a remix
  SELECT rr.original_creator_id, rr.royalty_percentage
  INTO original_post_creator, royalty_split
  FROM public.remix_royalties rr
  WHERE rr.remix_post_id = p_post_id;
  
  IF original_post_creator IS NOT NULL THEN
    -- This is a remix - split earnings
    DECLARE
      original_share INTEGER;
      remix_share INTEGER;
    BEGIN
      original_share := (p_play_value_cents * royalty_split / 100)::INTEGER;
      remix_share := p_play_value_cents - original_share;
      
      -- Credit original creator
      INSERT INTO public.creator_earnings (creator_id, post_id, amount_cents, earning_type)
      VALUES (original_post_creator, p_post_id, original_share, 'remix_royalty');
      
      -- Credit remix creator
      INSERT INTO public.creator_earnings (creator_id, post_id, amount_cents, earning_type)
      VALUES (post_creator, p_post_id, remix_share, 'remix_play');
      
      -- Update wallet balances
      INSERT INTO public.user_wallets (user_id, balance_cents, total_earned_cents)
      VALUES (original_post_creator, original_share, original_share)
      ON CONFLICT (user_id) 
      DO UPDATE SET 
        balance_cents = user_wallets.balance_cents + original_share,
        total_earned_cents = user_wallets.total_earned_cents + original_share;
        
      INSERT INTO public.user_wallets (user_id, balance_cents, total_earned_cents)
      VALUES (post_creator, remix_share, remix_share)
      ON CONFLICT (user_id) 
      DO UPDATE SET 
        balance_cents = user_wallets.balance_cents + remix_share,
        total_earned_cents = user_wallets.total_earned_cents + remix_share;
    END;
  ELSE
    -- Regular post - full earnings to creator
    INSERT INTO public.creator_earnings (creator_id, post_id, amount_cents, earning_type)
    VALUES (post_creator, p_post_id, p_play_value_cents, 'play');
    
    -- Update wallet balance
    INSERT INTO public.user_wallets (user_id, balance_cents, total_earned_cents)
    VALUES (post_creator, p_play_value_cents, p_play_value_cents)
    ON CONFLICT (user_id) 
    DO UPDATE SET 
      balance_cents = user_wallets.balance_cents + p_play_value_cents,
      total_earned_cents = user_wallets.total_earned_cents + p_play_value_cents;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to process tips
CREATE OR REPLACE FUNCTION public.process_tip(
  p_tipper_id UUID,
  p_recipient_id UUID,
  p_post_id UUID,
  p_amount_cents INTEGER,
  p_message TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  tip_id UUID;
BEGIN
  -- Create tip transaction
  INSERT INTO public.tip_transactions (
    tipper_id, 
    recipient_id, 
    post_id, 
    amount_cents, 
    message, 
    status
  ) VALUES (
    p_tipper_id, 
    p_recipient_id, 
    p_post_id, 
    p_amount_cents, 
    p_message, 
    'completed'
  ) RETURNING id INTO tip_id;
  
  -- Add to recipient's wallet
  INSERT INTO public.user_wallets (user_id, balance_cents, total_earned_cents)
  VALUES (p_recipient_id, p_amount_cents, p_amount_cents)
  ON CONFLICT (user_id) 
  DO UPDATE SET 
    balance_cents = user_wallets.balance_cents + p_amount_cents,
    total_earned_cents = user_wallets.total_earned_cents + p_amount_cents;
  
  -- Create earning record
  INSERT INTO public.creator_earnings (creator_id, post_id, amount_cents, earning_type)
  VALUES (p_recipient_id, p_post_id, p_amount_cents, 'tip');
  
  RETURN tip_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Insert default subscription tiers
INSERT INTO public.subscription_tiers (tier_name, price_cents, features, ai_generation_credits, upload_limit_mb, priority_processing, exclusive_models) VALUES
('Free', 0, '["Basic AI models", "10 generations/day", "Community features"]'::jsonb, 10, 50, false, false),
('Creator', 999, '["Premium AI models", "100 generations/day", "High-quality exports", "Advanced remix tools"]'::jsonb, 100, 500, true, false),
('Pro', 1999, '["All AI models", "Unlimited generations", "Commercial license", "API access", "Priority support"]'::jsonb, -1, 2000, true, true),
('Studio', 4999, '["Custom AI training", "White-label solution", "Advanced analytics", "Team collaboration"]'::jsonb, -1, 10000, true, true);

-- Add triggers for updated_at
CREATE TRIGGER update_user_wallets_updated_at
BEFORE UPDATE ON public.user_wallets
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();