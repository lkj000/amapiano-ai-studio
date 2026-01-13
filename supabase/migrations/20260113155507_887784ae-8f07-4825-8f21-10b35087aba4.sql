
-- Fix project_templates: Allow authenticated users to create (no user ownership column)
DROP POLICY IF EXISTS "Authenticated users can create templates" ON public.project_templates;
CREATE POLICY "Authenticated users can create templates"
ON public.project_templates
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Fix project_templates update: Anyone can increment usage count (intentional for public templates)
DROP POLICY IF EXISTS "Anyone can update template usage count" ON public.project_templates;
CREATE POLICY "Anyone can update template usage count"
ON public.project_templates
FOR UPDATE
USING (true)
WITH CHECK (true);
