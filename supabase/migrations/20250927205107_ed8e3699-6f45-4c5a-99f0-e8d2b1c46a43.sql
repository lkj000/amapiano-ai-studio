-- Grant admin access to the business owner
-- This allows you to access your own business metrics

-- Get the current user (you) and grant admin role
-- Using the user ID I found earlier: 2d2746d5-3faf-4ec4-bb0b-449136bb29c9

INSERT INTO public.user_roles (user_id, role, granted_by, granted_at)
VALUES (
  '2d2746d5-3faf-4ec4-bb0b-449136bb29c9'::uuid,
  'admin'::app_role,
  '2d2746d5-3faf-4ec4-bb0b-449136bb29c9'::uuid, -- Self-granted initially
  now()
)
ON CONFLICT (user_id, role) DO NOTHING;