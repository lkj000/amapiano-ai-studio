-- Fix critical business intelligence leak in partnership_metrics table
-- Currently ANY user can access sensitive revenue and partnership data

-- Drop the dangerously permissive policy exposing business secrets
DROP POLICY IF EXISTS "Anyone can view partnership metrics" ON public.partnership_metrics;

-- Create admin/management role if it doesn't exist
DO $$ BEGIN
  CREATE TYPE app_role AS ENUM ('admin', 'manager', 'user');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Create user_roles table if it doesn't exist (for role-based access)
CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  granted_by uuid REFERENCES auth.users(id),
  granted_at timestamp with time zone DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create secure policies for partnership_metrics (business intelligence protection)

-- Only admins and managers can view sensitive business metrics
CREATE POLICY "Admin and manager access to business metrics"
ON public.partnership_metrics
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'manager')
);

-- Only service role can insert/update metrics (for automated systems)
CREATE POLICY "Service role can manage partnership metrics"
ON public.partnership_metrics
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Create policies for user_roles management
CREATE POLICY "Admins can manage all user roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (user_id = auth.uid());