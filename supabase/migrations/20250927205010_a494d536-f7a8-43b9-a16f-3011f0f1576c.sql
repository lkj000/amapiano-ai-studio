-- Complete the business intelligence security fix
-- Handle any remaining policy creation

-- Check if we need to create the admin/manager access policy
DROP POLICY IF EXISTS "Admin and manager access to business metrics" ON public.partnership_metrics;

-- Create the secure policy for business metrics access  
CREATE POLICY "Admin and manager access to business metrics"
ON public.partnership_metrics
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'manager')
);

-- Ensure service role policy exists (might not have been created due to error)
DROP POLICY IF EXISTS "Service role can manage partnership metrics" ON public.partnership_metrics;

CREATE POLICY "Service role can manage partnership metrics" 
ON public.partnership_metrics
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);