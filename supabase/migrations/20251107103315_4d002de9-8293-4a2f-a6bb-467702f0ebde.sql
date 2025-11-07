-- Add project sharing and version control tables
CREATE TABLE IF NOT EXISTS public.project_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.cloud_projects(id) ON DELETE CASCADE,
  shared_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  shared_with_email TEXT NOT NULL,
  permission TEXT NOT NULL DEFAULT 'view',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ,
  share_token TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex')
);

-- Enable RLS
ALTER TABLE public.project_shares ENABLE ROW LEVEL SECURITY;

-- Policies for project_shares
CREATE POLICY "Users can view shares for their projects"
ON public.project_shares
FOR SELECT
USING (
  shared_by = auth.uid() OR 
  project_id IN (
    SELECT id FROM public.cloud_projects WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can create shares for their projects"
ON public.project_shares
FOR INSERT
WITH CHECK (
  shared_by = auth.uid() AND
  project_id IN (
    SELECT id FROM public.cloud_projects WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete their own shares"
ON public.project_shares
FOR DELETE
USING (shared_by = auth.uid());

-- Add cloud project versions table
CREATE TABLE IF NOT EXISTS public.cloud_project_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.cloud_projects(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  project_data JSONB NOT NULL,
  change_description TEXT,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.cloud_project_versions ENABLE ROW LEVEL SECURITY;

-- Policies for cloud_project_versions
CREATE POLICY "Users can view versions of their projects"
ON public.cloud_project_versions
FOR SELECT
USING (
  project_id IN (
    SELECT id FROM public.cloud_projects WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can create versions for their projects"
ON public.cloud_project_versions
FOR INSERT
WITH CHECK (
  created_by = auth.uid() AND
  project_id IN (
    SELECT id FROM public.cloud_projects WHERE user_id = auth.uid()
  )
);

-- Add indexes
CREATE INDEX idx_project_shares_project_id ON public.project_shares(project_id);
CREATE INDEX idx_project_shares_token ON public.project_shares(share_token);
CREATE INDEX idx_cloud_project_versions_project_id ON public.cloud_project_versions(project_id);
CREATE INDEX idx_cloud_project_versions_created_at ON public.cloud_project_versions(created_at DESC);