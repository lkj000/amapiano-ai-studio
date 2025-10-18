import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Agent {
  id: string;
  name: string;
  type: 'composer' | 'arranger' | 'mixer' | 'mastering' | 'analyzer';
  status: 'idle' | 'working' | 'completed' | 'error';
  capabilities: string[];
  priority: number;
}

interface Task {
  id: string;
  type: string;
  agentId: string;
  input: any;
  output?: any;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  dependencies: string[];
  createdAt: Date;
}

interface OrchestrationPlan {
  tasks: Task[];
  workflow: string;
  estimatedTime: number;
}

export const useMultiAgentOrchestrator = () => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isOrchestrating, setIsOrchestrating] = useState(false);
  const { toast } = useToast();

  // Initialize available agents
  const initializeAgents = useCallback(() => {
    const defaultAgents: Agent[] = [
      {
        id: 'composer-1',
        name: 'AI Composer',
        type: 'composer',
        status: 'idle',
        capabilities: ['melody', 'harmony', 'rhythm', 'genre-specific'],
        priority: 1
      },
      {
        id: 'arranger-1',
        name: 'AI Arranger',
        type: 'arranger',
        status: 'idle',
        capabilities: ['instrumentation', 'structure', 'transitions'],
        priority: 2
      },
      {
        id: 'mixer-1',
        name: 'AI Mixer',
        type: 'mixer',
        status: 'idle',
        capabilities: ['balance', 'eq', 'compression', 'effects'],
        priority: 3
      },
      {
        id: 'mastering-1',
        name: 'AI Mastering',
        type: 'mastering',
        status: 'idle',
        capabilities: ['loudness', 'stereo-width', 'final-polish'],
        priority: 4
      },
      {
        id: 'analyzer-1',
        name: 'AI Analyzer',
        type: 'analyzer',
        status: 'idle',
        capabilities: ['quality-check', 'suggestions', 'gap-analysis'],
        priority: 0
      }
    ];
    setAgents(defaultAgents);
  }, []);

  // Create orchestration plan based on user intent
  const createOrchestrationPlan = useCallback(async (
    intent: string,
    projectData: any
  ): Promise<OrchestrationPlan> => {
    try {
      const { data, error } = await supabase.functions.invoke('aura-conductor-orchestration', {
        body: {
          intent,
          projectData,
          availableAgents: agents
        }
      });

      if (error) throw error;

      return data as OrchestrationPlan;
    } catch (error) {
      console.error('Error creating orchestration plan:', error);
      throw error;
    }
  }, [agents]);

  // Execute a single task with an agent
  const executeTask = useCallback(async (task: Task, agent: Agent): Promise<any> => {
    try {
      // Update agent status
      setAgents(prev => prev.map(a => 
        a.id === agent.id ? { ...a, status: 'working' } : a
      ));

      // Update task status
      setTasks(prev => prev.map(t =>
        t.id === task.id ? { ...t, status: 'processing' } : t
      ));

      // Call appropriate edge function based on agent type
      const functionName = `neural-music-generation`;
      const { data, error } = await supabase.functions.invoke(functionName, {
        body: {
          agentType: agent.type,
          taskType: task.type,
          input: task.input
        }
      });

      if (error) throw error;

      // Update task with result
      setTasks(prev => prev.map(t =>
        t.id === task.id ? { ...t, status: 'completed', output: data } : t
      ));

      // Update agent status
      setAgents(prev => prev.map(a =>
        a.id === agent.id ? { ...a, status: 'completed' } : a
      ));

      return data;
    } catch (error) {
      setAgents(prev => prev.map(a =>
        a.id === agent.id ? { ...a, status: 'error' } : a
      ));
      setTasks(prev => prev.map(t =>
        t.id === task.id ? { ...t, status: 'failed' } : t
      ));
      throw error;
    }
  }, []);

  // Orchestrate multiple agents to complete a complex task
  const orchestrate = useCallback(async (
    intent: string,
    projectData: any
  ) => {
    setIsOrchestrating(true);
    try {
      // Create orchestration plan
      const plan = await createOrchestrationPlan(intent, projectData);
      setTasks(plan.tasks);

      toast({
        title: "Orchestration Started",
        description: `${plan.tasks.length} tasks planned. Estimated time: ${plan.estimatedTime}s`
      });

      // Execute tasks in dependency order
      const results = [];
      for (const task of plan.tasks) {
        // Wait for dependencies
        const dependencyResults = task.dependencies.map(depId => {
          const depTask = tasks.find(t => t.id === depId);
          return depTask?.output;
        });

        // Find appropriate agent
        const agent = agents.find(a => 
          a.id === task.agentId || 
          (a.type === task.type.split('-')[0] && a.status === 'idle')
        );

        if (!agent) {
          throw new Error(`No available agent for task ${task.id}`);
        }

        // Execute task
        const result = await executeTask(task, agent);
        results.push(result);
      }

      toast({
        title: "Orchestration Complete",
        description: "All agents have completed their tasks successfully"
      });

      return results;
    } catch (error: any) {
      toast({
        title: "Orchestration Failed",
        description: error.message,
        variant: "destructive"
      });
      throw error;
    } finally {
      setIsOrchestrating(false);
      // Reset agent statuses
      setAgents(prev => prev.map(a => ({ ...a, status: 'idle' })));
    }
  }, [agents, tasks, createOrchestrationPlan, executeTask, toast]);

  // Analyze content gaps and suggest improvements
  const analyzeContentGaps = useCallback(async (projectData: any) => {
    try {
      const analyzer = agents.find(a => a.type === 'analyzer');
      if (!analyzer) throw new Error('Analyzer agent not available');

      const task: Task = {
        id: `analyze-${Date.now()}`,
        type: 'gap-analysis',
        agentId: analyzer.id,
        input: projectData,
        status: 'pending',
        dependencies: [],
        createdAt: new Date()
      };

      const result = await executeTask(task, analyzer);
      
      toast({
        title: "Analysis Complete",
        description: "Content gap analysis finished"
      });

      return result;
    } catch (error: any) {
      toast({
        title: "Analysis Failed",
        description: error.message,
        variant: "destructive"
      });
      throw error;
    }
  }, [agents, executeTask, toast]);

  return {
    agents,
    tasks,
    isOrchestrating,
    initializeAgents,
    orchestrate,
    analyzeContentGaps
  };
};
