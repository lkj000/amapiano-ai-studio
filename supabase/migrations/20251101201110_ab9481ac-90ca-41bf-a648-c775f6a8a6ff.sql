-- Phase 3: Plugin Marketplace Foundation Schema

-- Plugin submissions table (extends marketplace_items for plugin-specific data)
CREATE TABLE IF NOT EXISTS public.plugin_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  marketplace_item_id UUID REFERENCES public.marketplace_items(id) ON DELETE CASCADE,
  submitter_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  plugin_data JSONB NOT NULL DEFAULT '{}'::jsonb, -- code, parameters, framework
  approval_status TEXT NOT NULL DEFAULT 'pending', -- pending, approved, rejected, revision_requested
  reviewed_by UUID REFERENCES auth.users(id),
  review_notes TEXT,
  version TEXT NOT NULL DEFAULT '1.0.0',
  changelog TEXT,
  binary_url TEXT,
  wasm_url TEXT,
  vst3_url TEXT,
  submitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Plugin reviews table
CREATE TABLE IF NOT EXISTS public.plugin_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plugin_id UUID REFERENCES public.marketplace_items(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  verified_purchase BOOLEAN DEFAULT false,
  helpful_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(plugin_id, user_id)
);

-- Plugin review helpfulness tracking
CREATE TABLE IF NOT EXISTS public.review_helpfulness (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID REFERENCES public.plugin_reviews(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  is_helpful BOOLEAN NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(review_id, user_id)
);

-- Plugin download tracking
CREATE TABLE IF NOT EXISTS public.plugin_downloads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plugin_id UUID REFERENCES public.marketplace_items(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  version TEXT NOT NULL,
  download_type TEXT NOT NULL DEFAULT 'wasm', -- wasm, vst3, binary
  downloaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Plugin categories (predefined)
CREATE TABLE IF NOT EXISTS public.plugin_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT,
  parent_category_id UUID REFERENCES public.plugin_categories(id),
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Insert default categories
INSERT INTO public.plugin_categories (name, description, icon, display_order) VALUES
  ('Dynamics', 'Compressors, limiters, gates, and expanders', 'activity', 1),
  ('EQ', 'Equalizers and filters', 'sliders', 2),
  ('Reverb', 'Reverb and spatial effects', 'waves', 3),
  ('Delay', 'Delays, echoes, and time-based effects', 'clock', 4),
  ('Modulation', 'Chorus, flanger, phaser, tremolo', 'radio', 5),
  ('Distortion', 'Saturation, overdrive, and distortion', 'zap', 6),
  ('Utility', 'Meters, analyzers, and utility tools', 'wrench', 7),
  ('Synth', 'Synthesizers and sound generators', 'music', 8)
ON CONFLICT (name) DO NOTHING;

-- Enable RLS
ALTER TABLE public.plugin_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plugin_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_helpfulness ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plugin_downloads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plugin_categories ENABLE ROW LEVEL SECURITY;

-- RLS Policies for plugin_submissions
CREATE POLICY "Users can view approved submissions and their own"
  ON public.plugin_submissions FOR SELECT
  USING (approval_status = 'approved' OR submitter_id = auth.uid() OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can create submissions"
  ON public.plugin_submissions FOR INSERT
  WITH CHECK (auth.uid() = submitter_id);

CREATE POLICY "Users can update their pending submissions"
  ON public.plugin_submissions FOR UPDATE
  USING (submitter_id = auth.uid() AND approval_status = 'pending');

CREATE POLICY "Admins can manage all submissions"
  ON public.plugin_submissions FOR ALL
  USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for plugin_reviews
CREATE POLICY "Anyone can view reviews"
  ON public.plugin_reviews FOR SELECT
  USING (true);

CREATE POLICY "Verified purchasers can create reviews"
  ON public.plugin_reviews FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM public.user_purchases up
      WHERE up.user_id = auth.uid() AND up.marketplace_item_id = plugin_id
    )
  );

CREATE POLICY "Users can update their own reviews"
  ON public.plugin_reviews FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reviews"
  ON public.plugin_reviews FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for review_helpfulness
CREATE POLICY "Anyone can view review helpfulness"
  ON public.review_helpfulness FOR SELECT
  USING (true);

CREATE POLICY "Users can mark reviews as helpful"
  ON public.review_helpfulness FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their helpfulness votes"
  ON public.review_helpfulness FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS Policies for plugin_downloads
CREATE POLICY "Users can view their own downloads"
  ON public.plugin_downloads FOR SELECT
  USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'));

CREATE POLICY "System can track downloads"
  ON public.plugin_downloads FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for plugin_categories
CREATE POLICY "Anyone can view active categories"
  ON public.plugin_categories FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage categories"
  ON public.plugin_categories FOR ALL
  USING (has_role(auth.uid(), 'admin'));

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_plugin_submissions_status ON public.plugin_submissions(approval_status);
CREATE INDEX IF NOT EXISTS idx_plugin_submissions_submitter ON public.plugin_submissions(submitter_id);
CREATE INDEX IF NOT EXISTS idx_plugin_reviews_plugin ON public.plugin_reviews(plugin_id);
CREATE INDEX IF NOT EXISTS idx_plugin_reviews_user ON public.plugin_reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_plugin_downloads_plugin ON public.plugin_downloads(plugin_id);
CREATE INDEX IF NOT EXISTS idx_plugin_downloads_user ON public.plugin_downloads(user_id);

-- Triggers for updated_at
CREATE TRIGGER update_plugin_submissions_updated_at
  BEFORE UPDATE ON public.plugin_submissions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_plugin_reviews_updated_at
  BEFORE UPDATE ON public.plugin_reviews
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to update marketplace item rating when review is added/updated
CREATE OR REPLACE FUNCTION public.update_plugin_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.marketplace_items
  SET rating = (
    SELECT AVG(rating)::numeric(3,2)
    FROM public.plugin_reviews
    WHERE plugin_id = COALESCE(NEW.plugin_id, OLD.plugin_id)
  )
  WHERE id = COALESCE(NEW.plugin_id, OLD.plugin_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER update_rating_on_review
  AFTER INSERT OR UPDATE OR DELETE ON public.plugin_reviews
  FOR EACH ROW EXECUTE FUNCTION public.update_plugin_rating();