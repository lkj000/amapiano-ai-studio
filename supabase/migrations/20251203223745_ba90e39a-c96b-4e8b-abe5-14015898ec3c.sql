-- Create table for agent memory persistence
CREATE TABLE public.agent_memory (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  memory_type TEXT NOT NULL DEFAULT 'short_term',
  memory_key TEXT NOT NULL,
  memory_data JSONB NOT NULL DEFAULT '{}',
  importance_score NUMERIC DEFAULT 0.5,
  access_count INTEGER DEFAULT 0,
  last_accessed TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for agent execution history
CREATE TABLE public.agent_executions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  goal TEXT NOT NULL,
  decomposed_goal JSONB,
  execution_result JSONB,
  reflections JSONB DEFAULT '[]',
  learnings JSONB DEFAULT '[]',
  success BOOLEAN DEFAULT false,
  duration_ms INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.agent_memory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_executions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for agent_memory
CREATE POLICY "Users can view their own agent memory"
ON public.agent_memory FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own agent memory"
ON public.agent_memory FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own agent memory"
ON public.agent_memory FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own agent memory"
ON public.agent_memory FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for agent_executions
CREATE POLICY "Users can view their own agent executions"
ON public.agent_executions FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own agent executions"
ON public.agent_executions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create indexes
CREATE INDEX idx_agent_memory_user_id ON public.agent_memory(user_id);
CREATE INDEX idx_agent_memory_type ON public.agent_memory(memory_type);
CREATE INDEX idx_agent_executions_user_id ON public.agent_executions(user_id);
CREATE INDEX idx_agent_executions_created ON public.agent_executions(created_at DESC);

-- Trigger for updated_at
CREATE TRIGGER update_agent_memory_updated_at
BEFORE UPDATE ON public.agent_memory
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();