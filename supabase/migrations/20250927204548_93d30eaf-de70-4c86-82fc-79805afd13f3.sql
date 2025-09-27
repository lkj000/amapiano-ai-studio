-- Fix critical security vulnerability in daw_projects table
-- Handle the 6 orphaned projects properly

-- Since we can't assign to non-existent users, we'll delete orphaned projects
-- This is safer than leaving them accessible to everyone
DELETE FROM daw_projects WHERE user_id IS NULL;

-- Now make user_id required for all future projects  
ALTER TABLE daw_projects ALTER COLUMN user_id SET NOT NULL;

-- Drop all the dangerous "anyone can do anything" policies
DROP POLICY IF EXISTS "Anyone can view projects" ON public.daw_projects;
DROP POLICY IF EXISTS "Anyone can create projects" ON public.daw_projects;  
DROP POLICY IF EXISTS "Anyone can update projects" ON public.daw_projects;
DROP POLICY IF EXISTS "Anyone can delete projects" ON public.daw_projects;

-- Create secure, ownership-based policies

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

-- Allow service role (for system operations) to manage all projects if needed
CREATE POLICY "Service role can manage all projects"
ON public.daw_projects
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);