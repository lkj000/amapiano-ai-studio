-- Add secure ownership-based RLS policies for daw_projects
-- Now that we've cleaned up the dangerous policies, add proper security

-- Users can only view their own projects
CREATE POLICY "Users can view own projects only"
ON public.daw_projects
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Users can only create projects for themselves  
CREATE POLICY "Users can create own projects only"
ON public.daw_projects
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Users can only update their own projects
CREATE POLICY "Users can update own projects only"
ON public.daw_projects
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Users can only delete their own projects
CREATE POLICY "Users can delete own projects only"
ON public.daw_projects
FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- Service role can manage all projects (for system operations)
CREATE POLICY "Service role can manage all projects"
ON public.daw_projects
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);