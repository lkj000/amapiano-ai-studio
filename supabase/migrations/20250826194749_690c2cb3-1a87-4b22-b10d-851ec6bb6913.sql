-- Create DAW projects table
CREATE TABLE public.daw_projects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  name TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  bpm INTEGER NOT NULL DEFAULT 118,
  key_signature TEXT DEFAULT 'C',
  time_signature TEXT DEFAULT '4/4',
  project_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.daw_projects ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own projects" 
ON public.daw_projects 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own projects" 
ON public.daw_projects 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own projects" 
ON public.daw_projects 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own projects" 
ON public.daw_projects 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_daw_projects_updated_at
BEFORE UPDATE ON public.daw_projects
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();