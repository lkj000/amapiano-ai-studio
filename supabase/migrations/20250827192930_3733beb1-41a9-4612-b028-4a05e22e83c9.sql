-- Version 2.0 Features Database Schema

-- Create samples table for sample library
CREATE TABLE public.samples (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  name TEXT NOT NULL,
  description TEXT,
  file_url TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'misc',
  bpm INTEGER,
  key_signature TEXT,
  duration REAL NOT NULL DEFAULT 0,
  file_size INTEGER,
  waveform_data JSONB,
  tags TEXT[],
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create automation_lanes table
CREATE TABLE public.automation_lanes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES daw_projects(id) ON DELETE CASCADE,
  track_id TEXT NOT NULL,
  parameter_name TEXT NOT NULL,
  parameter_type TEXT NOT NULL DEFAULT 'volume', -- volume, pan, effect_param
  effect_id TEXT,
  automation_points JSONB NOT NULL DEFAULT '[]',
  is_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create collaboration_sessions table
CREATE TABLE public.collaboration_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES daw_projects(id) ON DELETE CASCADE,
  host_user_id UUID REFERENCES auth.users(id),
  session_name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  participant_limit INTEGER DEFAULT 10,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create collaboration_participants table
CREATE TABLE public.collaboration_participants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES collaboration_sessions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  user_name TEXT NOT NULL,
  user_color TEXT NOT NULL DEFAULT '#3b82f6',
  is_active BOOLEAN DEFAULT true,
  cursor_position JSONB,
  current_tool TEXT,
  permissions JSONB DEFAULT '{"canEdit": true, "canAddTracks": true, "canDeleteTracks": false}',
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_seen TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create real-time project changes table
CREATE TABLE public.project_changes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES daw_projects(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  change_type TEXT NOT NULL, -- track_add, track_delete, clip_add, note_edit, etc.
  change_data JSONB NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.samples ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_lanes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collaboration_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collaboration_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_changes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for samples
CREATE POLICY "Users can view their own samples and public samples" 
ON public.samples 
FOR SELECT 
USING (auth.uid() = user_id OR is_public = true);

CREATE POLICY "Users can create their own samples" 
ON public.samples 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own samples" 
ON public.samples 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own samples" 
ON public.samples 
FOR DELETE 
USING (auth.uid() = user_id);

-- RLS Policies for automation_lanes
CREATE POLICY "Users can manage automation for their projects" 
ON public.automation_lanes 
FOR ALL 
USING (
  project_id IN (
    SELECT id FROM daw_projects WHERE user_id = auth.uid()
  )
);

-- RLS Policies for collaboration_sessions
CREATE POLICY "Users can view sessions they host or participate in" 
ON public.collaboration_sessions 
FOR SELECT 
USING (
  host_user_id = auth.uid() OR 
  id IN (SELECT session_id FROM collaboration_participants WHERE user_id = auth.uid())
);

CREATE POLICY "Users can create collaboration sessions" 
ON public.collaboration_sessions 
FOR INSERT 
WITH CHECK (auth.uid() = host_user_id);

CREATE POLICY "Session hosts can update their sessions" 
ON public.collaboration_sessions 
FOR UPDATE 
USING (auth.uid() = host_user_id);

-- RLS Policies for collaboration_participants
CREATE POLICY "Users can view participants in sessions they're part of" 
ON public.collaboration_participants 
FOR SELECT 
USING (
  session_id IN (
    SELECT id FROM collaboration_sessions 
    WHERE host_user_id = auth.uid() OR 
    id IN (SELECT session_id FROM collaboration_participants WHERE user_id = auth.uid())
  )
);

CREATE POLICY "Users can join collaboration sessions" 
ON public.collaboration_participants 
FOR INSERT 
WITH CHECK (true); -- Anyone can join if they have the session ID

CREATE POLICY "Users can update their own participation" 
ON public.collaboration_participants 
FOR UPDATE 
USING (auth.uid() = user_id);

-- RLS Policies for project_changes
CREATE POLICY "Users can view changes for projects they have access to" 
ON public.project_changes 
FOR SELECT 
USING (
  project_id IN (
    SELECT id FROM daw_projects WHERE user_id = auth.uid()
  ) OR
  project_id IN (
    SELECT cs.project_id FROM collaboration_sessions cs
    JOIN collaboration_participants cp ON cs.id = cp.session_id
    WHERE cp.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create changes for accessible projects" 
ON public.project_changes 
FOR INSERT 
WITH CHECK (
  auth.uid() = user_id AND (
    project_id IN (
      SELECT id FROM daw_projects WHERE user_id = auth.uid()
    ) OR
    project_id IN (
      SELECT cs.project_id FROM collaboration_sessions cs
      JOIN collaboration_participants cp ON cs.id = cp.session_id
      WHERE cp.user_id = auth.uid()
    )
  )
);

-- Create indexes for performance
CREATE INDEX idx_samples_category ON public.samples(category);
CREATE INDEX idx_samples_public ON public.samples(is_public);
CREATE INDEX idx_samples_user_id ON public.samples(user_id);
CREATE INDEX idx_automation_lanes_project_track ON public.automation_lanes(project_id, track_id);
CREATE INDEX idx_collaboration_sessions_active ON public.collaboration_sessions(is_active);
CREATE INDEX idx_collaboration_participants_session ON public.collaboration_participants(session_id);
CREATE INDEX idx_project_changes_project_timestamp ON public.project_changes(project_id, timestamp);

-- Add triggers for updated_at columns
CREATE TRIGGER update_samples_updated_at
BEFORE UPDATE ON public.samples
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_automation_lanes_updated_at
BEFORE UPDATE ON public.automation_lanes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_collaboration_sessions_updated_at
BEFORE UPDATE ON public.collaboration_sessions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for collaboration
ALTER TABLE public.collaboration_participants REPLICA IDENTITY FULL;
ALTER TABLE public.project_changes REPLICA IDENTITY FULL;

-- Add tables to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.collaboration_participants;
ALTER PUBLICATION supabase_realtime ADD TABLE public.project_changes;