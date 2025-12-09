/**
 * React hook for Ambient Agent Orchestrator
 * Provides reactive interface to Temporal-inspired agent system
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { ambientOrchestrator, OrchestratorStatus } from '@/lib/agents/AmbientAgentOrchestrator';
import { signalBus, SignalType } from '@/lib/agents/AgentSignalBus';
import { heartbeat } from '@/lib/agents/ScheduledAgentHeartbeat';
import { judgeAgent, EvaluationResult } from '@/lib/agents/JudgeAgent';
import { durableState, WorkflowState } from '@/lib/agents/DurableAgentState';
import { ChainResult } from '@/lib/agents/ToolChainManager';
import { useToast } from '@/hooks/use-toast';

export interface UseAmbientOrchestratorReturn {
  // Status
  status: OrchestratorStatus | null;
  isRunning: boolean;
  isInitialized: boolean;

  // Execution
  executeGoal: (goal: string) => Promise<ChainResult>;
  isExecuting: boolean;
  lastResult: ChainResult | null;

  // Control
  initialize: () => Promise<void>;
  start: () => void;
  stop: () => void;
  shutdown: () => Promise<void>;

  // Signals
  signalAgent: (target: string, type: SignalType, payload: any) => Promise<string>;
  queryAgent: (target: string, query: string, params?: any) => Promise<any>;

  // Schedules
  triggerSchedule: (scheduleId: string) => Promise<void>;
  toggleSchedule: (scheduleId: string, enabled: boolean) => void;

  // Judge
  evaluations: EvaluationResult[];
  triggerEvaluation: () => Promise<void>;

  // Workflows
  activeWorkflows: WorkflowState[];
  pauseWorkflow: (workflowId: string) => Promise<void>;
  resumeWorkflow: (workflowId: string) => Promise<void>;
}

export const useAmbientOrchestrator = (): UseAmbientOrchestratorReturn => {
  const { toast } = useToast();
  const [status, setStatus] = useState<OrchestratorStatus | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [lastResult, setLastResult] = useState<ChainResult | null>(null);
  const [evaluations, setEvaluations] = useState<EvaluationResult[]>([]);
  const [activeWorkflows, setActiveWorkflows] = useState<WorkflowState[]>([]);
  
  const statusIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Update status periodically
  useEffect(() => {
    if (isInitialized) {
      const updateStatus = () => {
        setStatus(ambientOrchestrator.getStatus());
        setEvaluations(judgeAgent.getEvaluationHistory());
      };

      updateStatus();
      statusIntervalRef.current = setInterval(updateStatus, 5000);

      return () => {
        if (statusIntervalRef.current) {
          clearInterval(statusIntervalRef.current);
        }
      };
    }
  }, [isInitialized]);

  const initialize = useCallback(async () => {
    try {
      await ambientOrchestrator.initialize();
      setIsInitialized(true);
      setStatus(ambientOrchestrator.getStatus());
      
      toast({
        title: 'Orchestrator Initialized',
        description: 'Ambient agent system is ready'
      });
    } catch (error: any) {
      toast({
        title: 'Initialization Failed',
        description: error.message,
        variant: 'destructive'
      });
    }
  }, [toast]);

  const start = useCallback(() => {
    ambientOrchestrator.start();
    setIsRunning(true);
    setStatus(ambientOrchestrator.getStatus());
    
    toast({
      title: 'Ambient Execution Started',
      description: 'Agents are now running proactively'
    });
  }, [toast]);

  const stop = useCallback(() => {
    ambientOrchestrator.stop();
    setIsRunning(false);
    setStatus(ambientOrchestrator.getStatus());
    
    toast({
      title: 'Ambient Execution Stopped',
      description: 'Agents paused'
    });
  }, [toast]);

  const shutdown = useCallback(async () => {
    await ambientOrchestrator.shutdown();
    setIsInitialized(false);
    setIsRunning(false);
    setStatus(null);
    
    toast({
      title: 'Orchestrator Shutdown',
      description: 'All agents terminated'
    });
  }, [toast]);

  const executeGoal = useCallback(async (goal: string): Promise<ChainResult> => {
    setIsExecuting(true);
    
    toast({
      title: 'Executing Goal',
      description: goal.slice(0, 50) + (goal.length > 50 ? '...' : '')
    });

    try {
      const result = await ambientOrchestrator.executeGoal(goal);
      setLastResult(result);
      
      toast({
        title: result.success ? 'Goal Achieved' : 'Execution Completed',
        description: `${result.tasksCompleted}/${result.totalTasks} tasks completed`
      });

      return result;
    } catch (error: any) {
      toast({
        title: 'Execution Failed',
        description: error.message,
        variant: 'destructive'
      });
      throw error;
    } finally {
      setIsExecuting(false);
    }
  }, [toast]);

  const signalAgent = useCallback(async (
    target: string,
    type: SignalType,
    payload: any
  ): Promise<string> => {
    return ambientOrchestrator.signalAgent(target, type, payload);
  }, []);

  const queryAgent = useCallback(async (
    target: string,
    query: string,
    params?: any
  ): Promise<any> => {
    return ambientOrchestrator.queryAgent(target, query, params);
  }, []);

  const triggerSchedule = useCallback(async (scheduleId: string) => {
    await heartbeat.triggerNow(scheduleId);
    toast({
      title: 'Schedule Triggered',
      description: `Manual nudge sent for ${scheduleId}`
    });
  }, [toast]);

  const toggleSchedule = useCallback((scheduleId: string, enabled: boolean) => {
    heartbeat.updateSchedule(scheduleId, { enabled });
    if (enabled) {
      heartbeat.startSchedule(scheduleId);
    } else {
      heartbeat.stopSchedule(scheduleId);
    }
    setStatus(ambientOrchestrator.getStatus());
  }, []);

  const triggerEvaluation = useCallback(async () => {
    toast({
      title: 'Evaluation Started',
      description: 'Judge agent is evaluating all agents'
    });

    const results = await judgeAgent.evaluateAllAgents();
    setEvaluations(judgeAgent.getEvaluationHistory());

    toast({
      title: 'Evaluation Complete',
      description: `Evaluated ${results.length} agents`
    });
  }, [toast]);

  const pauseWorkflow = useCallback(async (workflowId: string) => {
    await durableState.pauseWorkflow(workflowId);
    toast({
      title: 'Workflow Paused',
      description: workflowId
    });
  }, [toast]);

  const resumeWorkflow = useCallback(async (workflowId: string) => {
    await durableState.resumeWorkflow(workflowId);
    toast({
      title: 'Workflow Resumed',
      description: workflowId
    });
  }, [toast]);

  return {
    status,
    isRunning,
    isInitialized,
    executeGoal,
    isExecuting,
    lastResult,
    initialize,
    start,
    stop,
    shutdown,
    signalAgent,
    queryAgent,
    triggerSchedule,
    toggleSchedule,
    evaluations,
    triggerEvaluation,
    activeWorkflows,
    pauseWorkflow,
    resumeWorkflow
  };
};
