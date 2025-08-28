-- Create subscription tiers enum
CREATE TYPE public.subscription_tier AS ENUM ('free', 'producer', 'professional', 'enterprise');

-- Create subscribers table to track subscription information
CREATE TABLE public.subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  stripe_customer_id TEXT,
  subscribed BOOLEAN NOT NULL DEFAULT false,
  subscription_tier subscription_tier DEFAULT 'free',
  subscription_end TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create orders table for one-time purchases
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_session_id TEXT UNIQUE,
  amount INTEGER,
  currency TEXT DEFAULT 'usd',
  product_type TEXT, -- 'plugin', 'sound_pack', 'feature_pack'
  product_id TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create marketplace items table
CREATE TABLE public.marketplace_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL, -- 'vst_plugin', 'sound_pack', 'preset_pack'
  subcategory TEXT, -- 'synthesizer', 'effect', 'amapiano', 'deep_house', etc.
  price_cents INTEGER NOT NULL,
  currency TEXT DEFAULT 'usd',
  seller_id UUID REFERENCES auth.users(id),
  download_url TEXT,
  preview_url TEXT,
  image_url TEXT,
  tags TEXT[],
  rating DECIMAL(3,2) DEFAULT 0.0,
  downloads INTEGER DEFAULT 0,
  featured BOOLEAN DEFAULT false,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create user purchases table to track what users have bought
CREATE TABLE public.user_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  marketplace_item_id UUID REFERENCES public.marketplace_items(id),
  order_id UUID REFERENCES public.orders(id),
  purchased_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, marketplace_item_id)
);

-- Create user profiles table for additional user info
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  display_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  is_seller BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Subscribers policies
CREATE POLICY "Users can view their own subscription" ON public.subscribers
  FOR SELECT USING (user_id = auth.uid() OR email = auth.email());
CREATE POLICY "Edge functions can manage subscriptions" ON public.subscribers
  FOR ALL USING (true);

-- Orders policies
CREATE POLICY "Users can view their own orders" ON public.orders
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Edge functions can manage orders" ON public.orders
  FOR ALL USING (true);

-- Marketplace items policies
CREATE POLICY "Anyone can view active marketplace items" ON public.marketplace_items
  FOR SELECT USING (active = true);
CREATE POLICY "Sellers can manage their own items" ON public.marketplace_items
  FOR ALL USING (seller_id = auth.uid());

-- User purchases policies
CREATE POLICY "Users can view their own purchases" ON public.user_purchases
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Edge functions can manage purchases" ON public.user_purchases
  FOR ALL USING (true);

-- Profiles policies
CREATE POLICY "Users can view all profiles" ON public.profiles
  FOR SELECT USING (true);
CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Create triggers for updated_at
CREATE TRIGGER update_subscribers_updated_at
  BEFORE UPDATE ON public.subscribers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_marketplace_items_updated_at
  BEFORE UPDATE ON public.marketplace_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert some sample marketplace items
INSERT INTO public.marketplace_items (name, description, category, subcategory, price_cents, tags, featured) VALUES
('Amapiano Essential Pack', 'Professional Amapiano sound pack with log drums, piano loops, and basslines', 'sound_pack', 'amapiano', 2999, ARRAY['amapiano', 'south african', 'piano', 'log drums'], true),
('Deep House Synthesizer VST', 'Professional synthesizer plugin for deep house production', 'vst_plugin', 'synthesizer', 4999, ARRAY['synthesizer', 'deep house', 'vst', 'plugin'], true),
('Vintage Piano Collection', 'Sampled vintage piano sounds perfect for Amapiano', 'sound_pack', 'piano', 1999, ARRAY['piano', 'vintage', 'amapiano', 'jazz'], false),
('Reverb Master VST', 'Professional reverb plugin with multiple algorithms', 'vst_plugin', 'effect', 3999, ARRAY['reverb', 'effect', 'vst', 'plugin'], false);

-- Create function to handle new user profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email));
  
  INSERT INTO public.subscribers (user_id, email, subscription_tier)
  VALUES (NEW.id, NEW.email, 'free');
  
  RETURN NEW;
END;
$$;

-- Trigger to create profile and subscriber record on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();