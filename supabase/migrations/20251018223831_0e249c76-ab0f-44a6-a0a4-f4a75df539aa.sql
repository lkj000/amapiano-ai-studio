-- Create project_versions table for version control
CREATE TABLE IF NOT EXISTS public.project_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.daw_projects(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  project_data JSONB NOT NULL,
  message TEXT DEFAULT 'Auto-saved version',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(project_id, version)
);

-- Enable RLS
ALTER TABLE public.project_versions ENABLE ROW LEVEL SECURITY;

-- Users can view versions of their projects
CREATE POLICY "Users can view versions of their projects"
  ON public.project_versions FOR SELECT
  USING (
    project_id IN (
      SELECT id FROM public.daw_projects WHERE user_id = auth.uid()
    )
  );

-- Users can create versions for their projects
CREATE POLICY "Users can create versions for their projects"
  ON public.project_versions FOR INSERT
  WITH CHECK (
    project_id IN (
      SELECT id FROM public.daw_projects WHERE user_id = auth.uid()
    )
  );

-- Index for faster version queries
CREATE INDEX idx_project_versions_project_id ON public.project_versions(project_id);
CREATE INDEX idx_project_versions_created_at ON public.project_versions(created_at DESC);