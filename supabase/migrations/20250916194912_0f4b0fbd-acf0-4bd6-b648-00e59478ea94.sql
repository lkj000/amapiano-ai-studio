-- AURA-X Vision: Comprehensive Platform Enhancement
-- Create comprehensive tables for the full AURA-X ecosystem

-- 1. AI Orchestration Engine (AuraConductor)
CREATE TABLE public.aura_conductor_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  session_name TEXT NOT NULL,
  orchestration_config JSONB NOT NULL DEFAULT '{}',
  current_task TEXT,
  task_queue JSONB NOT NULL DEFAULT '[]',
  execution_log JSONB NOT NULL DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 2. Style Exchange Marketplace
CREATE TABLE public.style_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  creator_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  style_data JSONB NOT NULL,
  genre_tags TEXT[] DEFAULT '{}',
  price_cents INTEGER DEFAULT 0,
  is_public BOOLEAN DEFAULT false,
  download_count INTEGER DEFAULT 0,
  rating NUMERIC(3,2) DEFAULT 0.0,
  preview_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 3. Aura Academy Learning Platform
CREATE TABLE public.academy_courses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  instructor_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  difficulty_level TEXT CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
  category TEXT NOT NULL,
  course_data JSONB NOT NULL DEFAULT '{}',
  thumbnail_url TEXT,
  is_published BOOLEAN DEFAULT false,
  enrollment_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.academy_lessons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID REFERENCES public.academy_courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content_type TEXT CHECK (content_type IN ('video', 'article', 'interactive', 'project')),
  content_data JSONB NOT NULL DEFAULT '{}',
  duration_minutes INTEGER,
  order_index INTEGER NOT NULL,
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.academy_enrollments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  course_id UUID REFERENCES public.academy_courses(id) ON DELETE CASCADE,
  progress_data JSONB NOT NULL DEFAULT '{}',
  completion_percentage NUMERIC(5,2) DEFAULT 0.0,
  enrolled_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(user_id, course_id)
);

-- 4. Data Licensing Portal
CREATE TABLE public.artist_licenses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  artist_id UUID NOT NULL,
  license_type TEXT CHECK (license_type IN ('exclusive', 'non_exclusive', 'commercial', 'educational')),
  terms_data JSONB NOT NULL DEFAULT '{}',
  compensation_rate NUMERIC(10,2),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.licensed_content (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  license_id UUID REFERENCES public.artist_licenses(id) ON DELETE CASCADE,
  content_type TEXT CHECK (content_type IN ('sample', 'loop', 'stem', 'full_track', 'midi')),
  content_url TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}',
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 5. Advanced Plugin System
CREATE TABLE public.web_plugins (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  developer_id UUID NOT NULL,
  name TEXT NOT NULL,
  plugin_type TEXT CHECK (plugin_type IN ('instrument', 'effect', 'utility', 'analyzer')),
  plugin_code TEXT NOT NULL,
  manifest_data JSONB NOT NULL DEFAULT '{}',
  version TEXT NOT NULL DEFAULT '1.0.0',
  is_approved BOOLEAN DEFAULT false,
  download_count INTEGER DEFAULT 0,
  rating NUMERIC(3,2) DEFAULT 0.0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.user_plugin_installations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  plugin_id UUID REFERENCES public.web_plugins(id) ON DELETE CASCADE,
  installation_config JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  installed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, plugin_id)
);

-- 6. AI Context Management (ContextCache)
CREATE TABLE public.ai_context_memory (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  context_type TEXT CHECK (context_type IN ('project', 'style', 'preference', 'workflow', 'global')),
  context_key TEXT NOT NULL,
  context_data JSONB NOT NULL DEFAULT '{}',
  importance_score NUMERIC(3,2) DEFAULT 0.5,
  access_count INTEGER DEFAULT 0,
  last_accessed TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, context_type, context_key)
);

-- 7. Advanced Project Analytics
CREATE TABLE public.project_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL,
  user_id UUID NOT NULL,
  analytics_data JSONB NOT NULL DEFAULT '{}',
  session_duration INTEGER,
  actions_performed JSONB NOT NULL DEFAULT '[]',
  ai_interactions INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 8. Community Features
CREATE TABLE public.community_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  author_id UUID NOT NULL,
  post_type TEXT CHECK (post_type IN ('showcase', 'tutorial', 'question', 'collaboration')),
  title TEXT NOT NULL,
  content TEXT,
  media_urls TEXT[] DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  like_count INTEGER DEFAULT 0,
  comment_count INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.community_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID REFERENCES public.community_posts(id) ON DELETE CASCADE,
  author_id UUID NOT NULL,
  content TEXT NOT NULL,
  parent_comment_id UUID REFERENCES public.community_comments(id) ON DELETE CASCADE,
  like_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.aura_conductor_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.style_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academy_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academy_lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academy_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.artist_licenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.licensed_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.web_plugins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_plugin_installations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_context_memory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_comments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for AI Orchestration Engine
CREATE POLICY "Users can manage their own conductor sessions" 
ON public.aura_conductor_sessions 
FOR ALL 
USING (auth.uid() = user_id);

-- RLS Policies for Style Exchange
CREATE POLICY "Users can view public style profiles" 
ON public.style_profiles 
FOR SELECT 
USING (is_public = true OR creator_id = auth.uid());

CREATE POLICY "Users can manage their own style profiles" 
ON public.style_profiles 
FOR ALL 
USING (creator_id = auth.uid());

-- RLS Policies for Academy
CREATE POLICY "Anyone can view published courses" 
ON public.academy_courses 
FOR SELECT 
USING (is_published = true OR instructor_id = auth.uid());

CREATE POLICY "Instructors can manage their courses" 
ON public.academy_courses 
FOR ALL 
USING (instructor_id = auth.uid());

CREATE POLICY "Anyone can view published lessons" 
ON public.academy_lessons 
FOR SELECT 
USING (is_published = true OR course_id IN (
  SELECT id FROM public.academy_courses WHERE instructor_id = auth.uid()
));

CREATE POLICY "Course instructors can manage lessons" 
ON public.academy_lessons 
FOR ALL 
USING (course_id IN (
  SELECT id FROM public.academy_courses WHERE instructor_id = auth.uid()
));

CREATE POLICY "Users can manage their enrollments" 
ON public.academy_enrollments 
FOR ALL 
USING (user_id = auth.uid());

-- RLS Policies for Licensing
CREATE POLICY "Artists can manage their licenses" 
ON public.artist_licenses 
FOR ALL 
USING (artist_id = auth.uid());

CREATE POLICY "Users can view active licensed content" 
ON public.licensed_content 
FOR SELECT 
USING (license_id IN (
  SELECT id FROM public.artist_licenses WHERE is_active = true
));

-- RLS Policies for Plugins
CREATE POLICY "Anyone can view approved plugins" 
ON public.web_plugins 
FOR SELECT 
USING (is_approved = true OR developer_id = auth.uid());

CREATE POLICY "Developers can manage their plugins" 
ON public.web_plugins 
FOR ALL 
USING (developer_id = auth.uid());

CREATE POLICY "Users can manage their plugin installations" 
ON public.user_plugin_installations 
FOR ALL 
USING (user_id = auth.uid());

-- RLS Policies for AI Context
CREATE POLICY "Users can manage their AI context" 
ON public.ai_context_memory 
FOR ALL 
USING (user_id = auth.uid());

-- RLS Policies for Analytics
CREATE POLICY "Users can view analytics for their projects" 
ON public.project_analytics 
FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "System can insert analytics" 
ON public.project_analytics 
FOR INSERT 
WITH CHECK (true);

-- RLS Policies for Community
CREATE POLICY "Anyone can view community posts" 
ON public.community_posts 
FOR SELECT 
USING (true);

CREATE POLICY "Users can manage their posts" 
ON public.community_posts 
FOR ALL 
USING (author_id = auth.uid());

CREATE POLICY "Anyone can view comments" 
ON public.community_comments 
FOR SELECT 
USING (true);

CREATE POLICY "Users can manage their comments" 
ON public.community_comments 
FOR ALL 
USING (author_id = auth.uid());

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_aura_conductor_sessions_updated_at
BEFORE UPDATE ON public.aura_conductor_sessions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_style_profiles_updated_at
BEFORE UPDATE ON public.style_profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_academy_courses_updated_at
BEFORE UPDATE ON public.academy_courses
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_academy_lessons_updated_at
BEFORE UPDATE ON public.academy_lessons
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_artist_licenses_updated_at
BEFORE UPDATE ON public.artist_licenses
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_web_plugins_updated_at
BEFORE UPDATE ON public.web_plugins
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ai_context_memory_updated_at
BEFORE UPDATE ON public.ai_context_memory
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_community_posts_updated_at
BEFORE UPDATE ON public.community_posts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_community_comments_updated_at
BEFORE UPDATE ON public.community_comments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();