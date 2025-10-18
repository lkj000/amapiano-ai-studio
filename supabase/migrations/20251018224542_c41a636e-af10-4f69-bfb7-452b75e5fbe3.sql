-- Create shared_patterns table for cross-workspace pattern sharing
CREATE TABLE IF NOT EXISTS public.shared_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  pattern JSONB NOT NULL,
  permissions JSONB NOT NULL DEFAULT '{"public": false, "workspaceIds": [], "allowRemix": true, "allowDownload": true, "requireAttribution": false}'::jsonb,
  metadata JSONB NOT NULL,
  usage JSONB NOT NULL DEFAULT '{"views": 0, "remixes": 0, "downloads": 0}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create workspace_patterns table for imported patterns
CREATE TABLE IF NOT EXISTS public.workspace_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  pattern_data JSONB NOT NULL,
  metadata JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create workspace_sharing_policies table
CREATE TABLE IF NOT EXISTS public.workspace_sharing_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL UNIQUE REFERENCES public.workspaces(id) ON DELETE CASCADE,
  allow_incoming BOOLEAN DEFAULT true,
  allow_outgoing BOOLEAN DEFAULT true,
  auto_approve_from TEXT[] DEFAULT '{}',
  blocked_workspaces TEXT[] DEFAULT '{}',
  require_review BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.shared_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_sharing_policies ENABLE ROW LEVEL SECURITY;

-- Shared patterns policies
CREATE POLICY "Users can view public or accessible shared patterns"
  ON public.shared_patterns FOR SELECT
  USING (
    (permissions->>'public')::boolean = true OR
    source_workspace_id IN (
      SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create shared patterns in their workspaces"
  ON public.shared_patterns FOR INSERT
  WITH CHECK (
    source_workspace_id IN (
      SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their workspace's shared patterns"
  ON public.shared_patterns FOR UPDATE
  USING (
    source_workspace_id IN (
      SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their workspace's shared patterns"
  ON public.shared_patterns FOR DELETE
  USING (
    source_workspace_id IN (
      SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()
    )
  );

-- Workspace patterns policies
CREATE POLICY "Users can view patterns in their workspaces"
  ON public.workspace_patterns FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create patterns in their workspaces"
  ON public.workspace_patterns FOR INSERT
  WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()
    )
  );

-- Sharing policies
CREATE POLICY "Users can view their workspace's sharing policy"
  ON public.workspace_sharing_policies FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Workspace owners can manage sharing policies"
  ON public.workspace_sharing_policies FOR ALL
  USING (
    workspace_id IN (
      SELECT id FROM public.workspaces WHERE owner_id = auth.uid()
    )
  );

-- Indexes
CREATE INDEX idx_shared_patterns_workspace ON public.shared_patterns(source_workspace_id);
CREATE INDEX idx_shared_patterns_public ON public.shared_patterns((permissions->>'public'));
CREATE INDEX idx_workspace_patterns_workspace ON public.workspace_patterns(workspace_id);

-- Trigger for updated_at
CREATE TRIGGER update_shared_patterns_updated_at
  BEFORE UPDATE ON public.shared_patterns
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_workspace_patterns_updated_at
  BEFORE UPDATE ON public.workspace_patterns
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();