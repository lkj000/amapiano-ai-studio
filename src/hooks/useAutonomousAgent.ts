/**
 * React hook for using the Autonomous Agent
 * Provides reactive state management for agent execution
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { AutonomousAgent, AgentConfig, AgentStatus, AgentEvent, AgentMemory } from '@/lib/agents/AutonomousAgent';
import { ChainResult } from '@/lib/agents/ToolChainManager';
import { useToast } from '@/hooks/use-toast';
import { useAgentMemoryPersistence } from '@/hooks/useAgentMemoryPersistence';
import { supabase } from '@/integrations/supabase/client';

export interface UseAutonomousAgentReturn {
  // State
  status: AgentStatus;
  isExecuting: boolean;
  lastResult: ChainResult | null;
  events: AgentEvent[];
  memory: AgentMemory | null;
  
  // Actions
  execute: (goal: string) => Promise<ChainResult>;
  reset: () => void;
  
  // Metrics
  successRate: number;
}

export const useAutonomousAgent = (config?: Partial<AgentConfig>): UseAutonomousAgentReturn => {
  const agentRef = useRef<AutonomousAgent | null>(null);
  const { toast } = useToast();
  const { saveExecution } = useAgentMemoryPersistence();

  const [status, setStatus] = useState<AgentStatus>({
    state: 'idle',
    progress: 0
  });
  const [isExecuting, setIsExecuting] = useState(false);
  const [lastResult, setLastResult] = useState<ChainResult | null>(null);
  const [events, setEvents] = useState<AgentEvent[]>([]);
  const [memory, setMemory] = useState<AgentMemory | null>(null);
  const [successRate, setSuccessRate] = useState(0);

  // Initialize agent
  useEffect(() => {
    agentRef.current = new AutonomousAgent(config);

    // Set up event listener
    const handleEvent = (event: AgentEvent) => {
      setEvents(prev => [...prev.slice(-50), event]); // Keep last 50 events
      
      if (event.type === 'status') {
        setStatus(event.data);
      }

      // Show toast for significant events
      if (event.type === 'action') {
        console.log(`[Agent] Action: ${event.data.tool}`);
      }

      if (event.type === 'error') {
        toast({
          title: 'Agent Error',
          description: event.data.error,
          variant: 'destructive'
        });
      }

      if (event.type === 'complete') {
        const result = event.data as ChainResult;
        toast({
          title: result.success ? 'Goal Achieved' : 'Execution Completed with Issues',
          description: `${result.tasksCompleted}/${result.totalTasks} tasks completed`
        });
      }
    };

    agentRef.current.addEventListener(handleEvent);

    return () => {
      if (agentRef.current) {
        agentRef.current.removeEventListener(handleEvent);
      }
    };
  }, [config, toast]);

  const execute = useCallback(async (goal: string): Promise<ChainResult> => {
    if (!agentRef.current) {
      throw new Error('Agent not initialized');
    }

    setIsExecuting(true);
    setEvents([]);

    toast({
      title: 'Agent Started',
      description: `Goal: ${goal.slice(0, 50)}${goal.length > 50 ? '...' : ''}`
    });

    try {
      const startTime = Date.now();
      const result = await agentRef.current.execute(goal);
      setLastResult(result);
      setMemory(agentRef.current.getMemory());
      setSuccessRate(agentRef.current.getSuccessRate());
      
      // Get current user ID if authenticated
      const { data: { user } } = await supabase.auth.getUser();
      const userId = user?.id || 'anonymous';
      
      // Persist execution to database
      saveExecution({
        user_id: userId,
        goal,
        success: result.success,
        execution_result: result as any,
        duration_ms: Date.now() - startTime,
        learnings: result.reflections?.flatMap(r => r.learnings?.map(l => l.description) || []) || []
      }).catch(err => console.warn('[Agent] Failed to save execution:', err));
      
      return result;
    } finally {
      setIsExecuting(false);
      setStatus(agentRef.current?.getStatus() || { state: 'idle', progress: 0 });
    }
  }, [toast, saveExecution]);

  const reset = useCallback(() => {
    setStatus({ state: 'idle', progress: 0 });
    setLastResult(null);
    setEvents([]);
    setIsExecuting(false);
  }, []);

  return {
    status,
    isExecuting,
    lastResult,
    events,
    memory,
    execute,
    reset,
    successRate
  };
};
