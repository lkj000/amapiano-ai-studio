-- Grant admin access to the current user so they can access their own business metrics
-- Find the current authenticated user and grant them admin role

INSERT INTO public.user_roles (user_id, role, granted_by)
SELECT '2d2746d5-3faf-4ec4-bb0b-449136bb29c9'::uuid, 'admin', '2d2746d5-3faf-4ec4-bb0b-449136bb29c9'::uuid
ON CONFLICT (user_id, role) DO NOTHING;