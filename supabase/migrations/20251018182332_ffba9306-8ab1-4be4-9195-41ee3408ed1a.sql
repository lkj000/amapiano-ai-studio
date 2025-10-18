-- Fix infinite recursion in workspace_members RLS policies
-- Create security definer function to check workspace membership
CREATE OR REPLACE FUNCTION public.is_workspace_member(_user_id uuid, _workspace_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.workspace_members
    WHERE user_id = _user_id
      AND workspace_id = _workspace_id
  )
$$;

-- Drop ALL existing policies on workspace_members
DROP POLICY IF EXISTS "Users can view workspace members" ON public.workspace_members;
DROP POLICY IF EXISTS "Workspace admins can manage members" ON public.workspace_members;
DROP POLICY IF EXISTS "Users can view members of their workspaces" ON public.workspace_members;
DROP POLICY IF EXISTS "Workspace owners can manage members" ON public.workspace_members;
DROP POLICY IF EXISTS "Users can insert themselves as members" ON public.workspace_members;

-- Create new non-recursive policies
CREATE POLICY "Users can view members of their workspaces"
ON public.workspace_members
FOR SELECT
USING (
  workspace_id IN (
    SELECT id FROM public.workspaces WHERE owner_id = auth.uid()
  ) OR user_id = auth.uid()
);

CREATE POLICY "Workspace owners can manage members"
ON public.workspace_members
FOR ALL
USING (
  workspace_id IN (
    SELECT id FROM public.workspaces WHERE owner_id = auth.uid()
  )
);

CREATE POLICY "Users can insert themselves as members"
ON public.workspace_members
FOR INSERT
WITH CHECK (user_id = auth.uid());