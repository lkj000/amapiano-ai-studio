-- Create social platform tables for AI music discovery

-- Social music posts table
CREATE TABLE public.social_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  creator_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  audio_url TEXT NOT NULL,
  preview_url TEXT,
  cover_image_url TEXT,
  duration_seconds INTEGER,
  genre_tags TEXT[] DEFAULT '{}',
  ai_model_used TEXT,
  generation_params JSONB DEFAULT '{}',
  is_remix BOOLEAN DEFAULT false,
  original_post_id UUID REFERENCES public.social_posts(id),
  remix_style TEXT,
  play_count INTEGER DEFAULT 0,
  like_count INTEGER DEFAULT 0,
  comment_count INTEGER DEFAULT 0,
  remix_count INTEGER DEFAULT 0,
  share_count INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT false,
  visibility TEXT DEFAULT 'public' CHECK (visibility IN ('public', 'followers', 'private')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- User follows table
CREATE TABLE public.user_follows (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  follower_id UUID NOT NULL,
  following_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(follower_id, following_id),
  CHECK (follower_id != following_id)
);

-- Post interactions table (likes, plays, etc.)
CREATE TABLE public.post_interactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  post_id UUID NOT NULL REFERENCES public.social_posts(id) ON DELETE CASCADE,
  interaction_type TEXT NOT NULL CHECK (interaction_type IN ('like', 'play', 'share', 'remix')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, post_id, interaction_type)
);

-- Post comments table
CREATE TABLE public.post_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.social_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  parent_comment_id UUID REFERENCES public.post_comments(id),
  like_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Creator earnings table for micro-royalties
CREATE TABLE public.creator_earnings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  creator_id UUID NOT NULL,
  post_id UUID REFERENCES public.social_posts(id),
  earning_type TEXT NOT NULL CHECK (earning_type IN ('play', 'remix', 'tip', 'subscription')),
  amount_cents INTEGER NOT NULL,
  currency TEXT DEFAULT 'usd',
  processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.social_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creator_earnings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for social_posts
CREATE POLICY "Anyone can view public posts" 
ON public.social_posts 
FOR SELECT 
USING (visibility = 'public' OR creator_id = auth.uid());

CREATE POLICY "Users can create their own posts" 
ON public.social_posts 
FOR INSERT 
WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Users can update their own posts" 
ON public.social_posts 
FOR UPDATE 
USING (auth.uid() = creator_id);

CREATE POLICY "Users can delete their own posts" 
ON public.social_posts 
FOR DELETE 
USING (auth.uid() = creator_id);

-- RLS Policies for user_follows
CREATE POLICY "Users can view follows" 
ON public.user_follows 
FOR SELECT 
USING (true);

CREATE POLICY "Users can manage their follows" 
ON public.user_follows 
FOR ALL 
USING (auth.uid() = follower_id);

-- RLS Policies for post_interactions
CREATE POLICY "Users can view interactions" 
ON public.post_interactions 
FOR SELECT 
USING (true);

CREATE POLICY "Users can manage their interactions" 
ON public.post_interactions 
FOR ALL 
USING (auth.uid() = user_id);

-- RLS Policies for post_comments
CREATE POLICY "Anyone can view comments" 
ON public.post_comments 
FOR SELECT 
USING (true);

CREATE POLICY "Users can manage their comments" 
ON public.post_comments 
FOR ALL 
USING (auth.uid() = user_id);

-- RLS Policies for creator_earnings
CREATE POLICY "Users can view their earnings" 
ON public.creator_earnings 
FOR SELECT 
USING (auth.uid() = creator_id);

-- Create indexes for performance
CREATE INDEX idx_social_posts_creator_id ON public.social_posts(creator_id);
CREATE INDEX idx_social_posts_created_at ON public.social_posts(created_at DESC);
CREATE INDEX idx_social_posts_genre_tags ON public.social_posts USING GIN(genre_tags);
CREATE INDEX idx_user_follows_follower ON public.user_follows(follower_id);
CREATE INDEX idx_user_follows_following ON public.user_follows(following_id);
CREATE INDEX idx_post_interactions_post_id ON public.post_interactions(post_id);
CREATE INDEX idx_post_interactions_user_id ON public.post_interactions(user_id);
CREATE INDEX idx_post_comments_post_id ON public.post_comments(post_id);

-- Trigger to update updated_at columns
CREATE TRIGGER update_social_posts_updated_at
BEFORE UPDATE ON public.social_posts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_post_comments_updated_at
BEFORE UPDATE ON public.post_comments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();