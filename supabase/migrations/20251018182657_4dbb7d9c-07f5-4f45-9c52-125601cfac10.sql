-- Break RLS recursion between workspaces and workspace_members
-- 1) Create security definer function to check workspace ownership (bypasses RLS)
CREATE OR REPLACE FUNCTION public.is_workspace_owner(_user_id uuid, _workspace_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.workspaces w
    WHERE w.id = _workspace_id AND w.owner_id = _user_id
  );
$$;

-- 2) Recreate workspace_members policies without referencing workspaces directly
DROP POLICY IF EXISTS "Users can view members of their workspaces" ON public.workspace_members;
DROP POLICY IF EXISTS "Workspace owners can manage members" ON public.workspace_members;
DROP POLICY IF EXISTS "Users can insert themselves as members" ON public.workspace_members;
DROP POLICY IF EXISTS "Members and owners can view workspace members" ON public.workspace_members;
DROP POLICY IF EXISTS "Owners can add or manage members" ON public.workspace_members;

-- Allow members and owners to view all members of a workspace
CREATE POLICY "Members and owners can view workspace members"
ON public.workspace_members
FOR SELECT
USING (
  public.is_workspace_owner(auth.uid(), workspace_id)
  OR public.is_workspace_member(auth.uid(), workspace_id)
);

-- Allow owners to add members or users to add themselves
CREATE POLICY "Owners can add members or users can join themselves"
ON public.workspace_members
FOR INSERT
WITH CHECK (
  public.is_workspace_owner(auth.uid(), workspace_id)
  OR user_id = auth.uid()
);

-- Owners can update and delete membership rows
CREATE POLICY "Owners can update members"
ON public.workspace_members
FOR UPDATE
USING (public.is_workspace_owner(auth.uid(), workspace_id))
WITH CHECK (public.is_workspace_owner(auth.uid(), workspace_id));

CREATE POLICY "Owners can remove members"
ON public.workspace_members
FOR DELETE
USING (public.is_workspace_owner(auth.uid(), workspace_id));