-- Fix critical security vulnerability in daw_projects table  
-- Clean up orphaned projects and fix policies step by step

-- First handle orphaned projects
DELETE FROM daw_projects WHERE user_id IS NULL;

-- Make user_id NOT NULL to prevent future orphaned projects
ALTER TABLE daw_projects ALTER COLUMN user_id SET NOT NULL;

-- Drop ALL existing policies to start fresh
DROP POLICY IF EXISTS "Anyone can view projects" ON public.daw_projects;
DROP POLICY IF EXISTS "Anyone can create projects" ON public.daw_projects;  
DROP POLICY IF EXISTS "Anyone can update projects" ON public.daw_projects;
DROP POLICY IF EXISTS "Anyone can delete projects" ON public.daw_projects;
DROP POLICY IF EXISTS "Users can view own projects only" ON public.daw_projects;
DROP POLICY IF EXISTS "Users can create own projects only" ON public.daw_projects;
DROP POLICY IF EXISTS "Users can update own projects only" ON public.daw_projects;
DROP POLICY IF EXISTS "Users can delete own projects only" ON public.daw_projects;
DROP POLICY IF EXISTS "Service role can manage all projects" ON public.daw_projects;