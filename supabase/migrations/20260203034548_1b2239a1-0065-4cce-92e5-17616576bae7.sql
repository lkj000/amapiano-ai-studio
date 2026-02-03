-- Add role-based access control columns to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user',
ADD COLUMN IF NOT EXISTS is_developer BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS is_researcher BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;

-- Create index for role lookups
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

-- Add comment explaining the role system
COMMENT ON COLUMN public.profiles.role IS 'User role: user, creator, developer, researcher, admin';
COMMENT ON COLUMN public.profiles.is_developer IS 'Has access to developer tools';
COMMENT ON COLUMN public.profiles.is_researcher IS 'Has access to research/PhD tools';
COMMENT ON COLUMN public.profiles.is_admin IS 'Has full admin access';