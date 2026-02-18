import { useState, useCallback, useRef } from 'react';
import { temporalWorkflowService, WorkflowExecution } from '@/lib/agents/TemporalWorkflowService';
import { toast } from 'sonner';

export interface TemporalProductionParams {
  genre: string;
  bpm: number;
  key: string;
  mood?: string;
  duration?: number;
  prompt?: string;
  skip_feedback?: boolean;
}

export interface TemporalProductionState {
  status: 'idle' | 'starting' | 'running' | 'completed' | 'failed';
  workflowId: string | null;
  stage: string;
  percent: number;
  currentStep: string;
  result: TemporalProductionResult | null;
  error: string | null;
}

export interface TemporalProductionResult {
  audio_url?: string;
  analysis?: Record<string, unknown>;
  mastering?: Record<string, unknown>;
  steps_completed?: string[];
}

const POLL_INTERVAL_MS = 4000;
const MAX_POLL_DURATION_MS = 10 * 60 * 1000; // 10 minutes

export function useTemporalProduction() {
  const [state, setState] = useState<TemporalProductionState>({
    status: 'idle',
    workflowId: null,
    stage: '',
    percent: 0,
    currentStep: '',
    result: null,
    error: null,
  });

  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);

  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  }, []);

  const pollWorkflow = useCallback(async (workflowId: string) => {
    try {
      // Check timeout
      if (Date.now() - startTimeRef.current > MAX_POLL_DURATION_MS) {
        stopPolling();
        setState(prev => ({
          ...prev,
          status: 'failed',
          error: 'Workflow timed out after 10 minutes',
        }));
        toast.error('Production workflow timed out');
        return;
      }

      // Try progress query first
      let progress;
      try {
        progress = await temporalWorkflowService.getProgress(workflowId);
      } catch {
        // getProgress may fail, fall back to describe
      }

      if (progress) {
        setState(prev => ({
          ...prev,
          stage: progress.stage,
          percent: progress.percent,
          currentStep: progress.currentStep,
        }));

        if (progress.percent >= 100) {
          stopPolling();
          // Fetch final result via describe
          const desc = await temporalWorkflowService.describeWorkflow(workflowId);
          setState(prev => ({
            ...prev,
            status: desc.status === 'COMPLETED' ? 'completed' : 'failed',
            percent: 100,
            error: desc.status === 'FAILED' ? 'Workflow failed' : null,
          }));
          if (desc.status === 'COMPLETED') {
            toast.success('Production workflow completed!');
          }
          return;
        }
      }

      // Also check describe for terminal states
      const desc = await temporalWorkflowService.describeWorkflow(workflowId);
      if (desc.status === 'COMPLETED') {
        stopPolling();
        setState(prev => ({
          ...prev,
          status: 'completed',
          percent: 100,
          stage: 'COMPLETED',
          currentStep: 'Done',
        }));
        toast.success('Production workflow completed!');
      } else if (desc.status === 'FAILED' || desc.status === 'CANCELLED' || desc.status === 'TERMINATED') {
        stopPolling();
        setState(prev => ({
          ...prev,
          status: 'failed',
          error: `Workflow ${desc.status.toLowerCase()}`,
        }));
        toast.error(`Workflow ${desc.status.toLowerCase()}`);
      }
    } catch (err) {
      console.warn('[TemporalPoll] Error polling workflow:', err);
      // Don't stop polling on transient errors
    }
  }, [stopPolling]);

  const startProduction = useCallback(async (params: TemporalProductionParams) => {
    stopPolling();

    setState({
      status: 'starting',
      workflowId: null,
      stage: 'Initializing',
      percent: 0,
      currentStep: 'Starting workflow...',
      result: null,
      error: null,
    });

    try {
      const execution: WorkflowExecution = await temporalWorkflowService.startProduction({
        genre: params.genre,
        bpm: params.bpm,
        key: params.key,
        mood: params.mood,
        duration: params.duration,
        ...( params.skip_feedback !== undefined ? { skip_feedback: params.skip_feedback } : { skip_feedback: true }),
        ...(params.prompt ? { prompt: params.prompt } : {}),
      } as Record<string, unknown> & { genre: string; bpm: number; key: string });

      setState(prev => ({
        ...prev,
        status: 'running',
        workflowId: execution.workflowId,
        stage: 'generate_audio',
        currentStep: 'Generating audio on GPU...',
        percent: 10,
      }));

      toast.success(`Workflow started: ${execution.workflowId}`);

      // Start polling
      startTimeRef.current = Date.now();
      pollingRef.current = setInterval(() => pollWorkflow(execution.workflowId), POLL_INTERVAL_MS);

    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to start workflow';
      setState(prev => ({
        ...prev,
        status: 'failed',
        error: message,
      }));
      toast.error(message);
    }
  }, [stopPolling, pollWorkflow]);

  const cancelWorkflow = useCallback(async () => {
    if (state.workflowId) {
      try {
        await temporalWorkflowService.terminateWorkflow(state.workflowId, 'Cancelled by user');
        stopPolling();
        setState(prev => ({ ...prev, status: 'idle', workflowId: null }));
        toast.info('Workflow cancelled');
      } catch (err) {
        console.error('Failed to cancel workflow:', err);
      }
    }
  }, [state.workflowId, stopPolling]);

  const reset = useCallback(() => {
    stopPolling();
    setState({
      status: 'idle',
      workflowId: null,
      stage: '',
      percent: 0,
      currentStep: '',
      result: null,
      error: null,
    });
  }, [stopPolling]);

  return {
    state,
    startProduction,
    cancelWorkflow,
    reset,
  };
}
