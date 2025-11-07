-- Enable realtime for project_templates table
ALTER TABLE public.project_templates REPLICA IDENTITY FULL;

-- Add project_templates to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.project_templates;