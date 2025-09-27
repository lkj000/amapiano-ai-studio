-- Fix critical security vulnerability in subscribers table
-- Remove the dangerously permissive RLS policy that allows any user to access all customer emails

-- Drop the existing overly permissive policy
DROP POLICY IF EXISTS "Edge functions can manage subscriptions" ON public.subscribers;

-- Create a secure policy for service role (edge functions)
-- This policy only applies when using the service role key, not regular user authentication
CREATE POLICY "Service role can manage all subscriptions"
ON public.subscribers
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Create a secure policy for authenticated users - they can only see their own data
CREATE POLICY "Users can view own subscription only"
ON public.subscribers
FOR SELECT
TO authenticated
USING (user_id = auth.uid() OR email = auth.email());

-- Create a secure policy for users to update their own subscription preferences
CREATE POLICY "Users can update own subscription preferences"
ON public.subscribers
FOR UPDATE
TO authenticated
USING (user_id = auth.uid() OR email = auth.email())
WITH CHECK (user_id = auth.uid() OR email = auth.email());

-- Edge functions using service role can still insert new subscriptions
-- Regular users should NOT be able to insert subscriptions directly
CREATE POLICY "Service role can insert subscriptions"
ON public.subscribers
FOR INSERT
TO service_role
WITH CHECK (true);