-- ============================================
-- VAST-Inspired Architecture Enhancements
-- ============================================

-- 1. Vector Database for Musical Intelligence
-- Create extension for vector similarity search
CREATE EXTENSION IF NOT EXISTS vector;

-- Musical vectors table for semantic search
CREATE TABLE IF NOT EXISTS public.musical_vectors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL, -- 'sample', 'pattern', 'project', 'plugin'
  entity_id UUID NOT NULL,
  embedding vector(1536), -- Vector embedding for semantic search
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Index for fast vector similarity search
CREATE INDEX IF NOT EXISTS idx_musical_vectors_embedding 
ON public.musical_vectors USING ivfflat (embedding vector_cosine_ops);

CREATE INDEX IF NOT EXISTS idx_musical_vectors_entity 
ON public.musical_vectors(entity_type, entity_id);

-- Enable RLS
ALTER TABLE public.musical_vectors ENABLE ROW LEVEL SECURITY;

-- RLS Policies for musical vectors
CREATE POLICY "Users can view all musical vectors"
ON public.musical_vectors FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can insert their own vectors"
ON public.musical_vectors FOR INSERT
TO authenticated
WITH CHECK (true);

-- ============================================
-- 2. Multi-Tenancy & Workspace Architecture
-- ============================================

-- Workspaces table for team collaboration
CREATE TABLE IF NOT EXISTS public.workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Workspace members
CREATE TABLE IF NOT EXISTS public.workspace_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member', -- 'owner', 'admin', 'member', 'viewer'
  permissions JSONB DEFAULT '{}',
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(workspace_id, user_id)
);

-- Enable RLS
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_members ENABLE ROW LEVEL SECURITY;

-- Workspace RLS policies
CREATE POLICY "Users can view their workspaces"
ON public.workspaces FOR SELECT
TO authenticated
USING (
  owner_id = auth.uid() OR
  id IN (
    SELECT workspace_id FROM public.workspace_members
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can create their own workspaces"
ON public.workspaces FOR INSERT
TO authenticated
WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Workspace owners can update"
ON public.workspaces FOR UPDATE
TO authenticated
USING (owner_id = auth.uid());

CREATE POLICY "Workspace owners can delete"
ON public.workspaces FOR DELETE
TO authenticated
USING (owner_id = auth.uid());

-- Workspace members RLS policies
CREATE POLICY "Users can view workspace members"
ON public.workspace_members FOR SELECT
TO authenticated
USING (
  workspace_id IN (
    SELECT id FROM public.workspaces WHERE owner_id = auth.uid()
  ) OR
  user_id = auth.uid()
);

CREATE POLICY "Workspace admins can manage members"
ON public.workspace_members FOR ALL
TO authenticated
USING (
  workspace_id IN (
    SELECT workspace_id FROM public.workspace_members
    WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
  )
);

-- ============================================
-- 3. Event Processing & Audit Logs
-- ============================================

-- System events table for event processing pipeline
CREATE TABLE IF NOT EXISTS public.system_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  event_source TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE,
  priority TEXT DEFAULT 'normal', -- 'critical', 'high', 'normal', 'low'
  payload JSONB DEFAULT '{}',
  processed BOOLEAN DEFAULT false,
  processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Indexes for event processing
CREATE INDEX IF NOT EXISTS idx_system_events_type ON public.system_events(event_type);
CREATE INDEX IF NOT EXISTS idx_system_events_processed ON public.system_events(processed, priority, created_at);
CREATE INDEX IF NOT EXISTS idx_system_events_workspace ON public.system_events(workspace_id);

-- Enable RLS
ALTER TABLE public.system_events ENABLE ROW LEVEL SECURITY;

-- Event RLS policies
CREATE POLICY "Users can view their workspace events"
ON public.system_events FOR SELECT
TO authenticated
USING (
  user_id = auth.uid() OR
  workspace_id IN (
    SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()
  )
);

CREATE POLICY "System can create events"
ON public.system_events FOR INSERT
TO authenticated
WITH CHECK (true);

-- ============================================
-- 4. Enhanced Pattern & Sample Metadata
-- ============================================

-- Add vector search support to existing samples table
ALTER TABLE public.samples 
ADD COLUMN IF NOT EXISTS vector_id UUID REFERENCES public.musical_vectors(id);

CREATE INDEX IF NOT EXISTS idx_samples_vector ON public.samples(vector_id);

-- ============================================
-- 5. Functions for Vector Search
-- ============================================

-- Function to search similar musical content
CREATE OR REPLACE FUNCTION public.search_similar_music(
  query_embedding vector(1536),
  entity_type_filter TEXT DEFAULT NULL,
  match_count INT DEFAULT 10
)
RETURNS TABLE (
  entity_id UUID,
  entity_type TEXT,
  similarity FLOAT,
  metadata JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    mv.entity_id,
    mv.entity_type,
    1 - (mv.embedding <=> query_embedding) as similarity,
    mv.metadata
  FROM public.musical_vectors mv
  WHERE (entity_type_filter IS NULL OR mv.entity_type = entity_type_filter)
  ORDER BY mv.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Function to add a musical vector
CREATE OR REPLACE FUNCTION public.add_musical_vector(
  p_entity_type TEXT,
  p_entity_id UUID,
  p_embedding vector(1536),
  p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  vector_id UUID;
BEGIN
  INSERT INTO public.musical_vectors (entity_type, entity_id, embedding, metadata)
  VALUES (p_entity_type, p_entity_id, p_embedding, p_metadata)
  RETURNING id INTO vector_id;
  
  RETURN vector_id;
END;
$$;

-- ============================================
-- 6. Update triggers
-- ============================================

-- Auto-update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_workspaces_updated_at
BEFORE UPDATE ON public.workspaces
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_musical_vectors_updated_at
BEFORE UPDATE ON public.musical_vectors
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();