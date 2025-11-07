-- Create project_templates table
CREATE TABLE IF NOT EXISTS public.project_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  genre TEXT NOT NULL,
  bpm INTEGER NOT NULL,
  preview_image TEXT,
  project_data JSONB NOT NULL,
  is_featured BOOLEAN DEFAULT false,
  usage_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.project_templates ENABLE ROW LEVEL SECURITY;

-- Allow anyone to view active templates
CREATE POLICY "Anyone can view active templates"
  ON public.project_templates
  FOR SELECT
  USING (is_active = true);

-- Allow authenticated users to create templates
CREATE POLICY "Authenticated users can create templates"
  ON public.project_templates
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Allow users to update templates (for usage_count increment)
CREATE POLICY "Anyone can update template usage count"
  ON public.project_templates
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Create index for faster queries
CREATE INDEX idx_project_templates_genre ON public.project_templates(genre);
CREATE INDEX idx_project_templates_featured ON public.project_templates(is_featured) WHERE is_featured = true;
CREATE INDEX idx_project_templates_active ON public.project_templates(is_active) WHERE is_active = true;

-- Add trigger for updated_at
CREATE TRIGGER update_project_templates_updated_at
  BEFORE UPDATE ON public.project_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();