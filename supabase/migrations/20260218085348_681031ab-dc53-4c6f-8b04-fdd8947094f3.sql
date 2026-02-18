-- Fix remaining project_templates policies
DROP POLICY IF EXISTS "Authenticated users can create templates" ON public.project_templates;
CREATE POLICY "Auth users can create templates"
  ON public.project_templates FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Anyone can update template usage count" ON public.project_templates;
CREATE POLICY "Auth users can update template usage"
  ON public.project_templates FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);