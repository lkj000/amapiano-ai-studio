-- Temporarily modify RLS policies to allow anonymous users for development
-- This allows users to create and manage projects without authentication

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own projects" ON public.daw_projects;
DROP POLICY IF EXISTS "Users can create their own projects" ON public.daw_projects;
DROP POLICY IF EXISTS "Users can update their own projects" ON public.daw_projects;
DROP POLICY IF EXISTS "Users can delete their own projects" ON public.daw_projects;

-- Create new policies that work for both authenticated and anonymous users
CREATE POLICY "Anyone can view projects" 
ON public.daw_projects 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can create projects" 
ON public.daw_projects 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can update projects" 
ON public.daw_projects 
FOR UPDATE 
USING (true);

CREATE POLICY "Anyone can delete projects" 
ON public.daw_projects 
FOR DELETE 
USING (true);