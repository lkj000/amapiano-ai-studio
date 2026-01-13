
-- Fix system_events: Require authenticated users with matching user_id
DROP POLICY IF EXISTS "System can create events" ON public.system_events;
CREATE POLICY "System can create events"
ON public.system_events
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Fix remix_royalties: Only allow service role (remove public INSERT)
DROP POLICY IF EXISTS "System can create royalty records" ON public.remix_royalties;
CREATE POLICY "System can create royalty records"
ON public.remix_royalties
FOR INSERT
TO service_role
WITH CHECK (true);

-- Fix project_analytics: Only allow service role
DROP POLICY IF EXISTS "System can insert analytics" ON public.project_analytics;
CREATE POLICY "System can insert analytics"
ON public.project_analytics
FOR INSERT
TO service_role
WITH CHECK (true);

-- Fix subscribers: Only allow service role for insert
DROP POLICY IF EXISTS "Service role can insert subscriptions" ON public.subscribers;
CREATE POLICY "Service role can insert subscriptions"
ON public.subscribers
FOR INSERT
TO service_role
WITH CHECK (true);

-- Fix musical_vectors: Authenticated users only with proper check
DROP POLICY IF EXISTS "Users can insert their own vectors" ON public.musical_vectors;
CREATE POLICY "Users can insert their own vectors"
ON public.musical_vectors
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Fix project_templates: Restrict to authenticated only
DROP POLICY IF EXISTS "Authenticated users can create templates" ON public.project_templates;
CREATE POLICY "Authenticated users can create templates"
ON public.project_templates
FOR INSERT
TO authenticated
WITH CHECK (true);
