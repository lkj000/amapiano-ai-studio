/**
 * Temporal Workflow Service
 * Client-side service for starting and managing durable agent workflows via Temporal Cloud.
 * Routes through the temporal-workflow edge function.
 */

import { supabase } from '@/integrations/supabase/client';

export interface WorkflowExecution {
  workflowId: string;
  runId?: string;
  status: 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED' | 'TERMINATED' | 'TIMED_OUT' | 'UNKNOWN';
}

export interface WorkflowDescription {
  workflowId: string;
  runId: string;
  status: string;
  startTime: string;
  closeTime?: string;
  type: string;
  taskQueue: string;
}

export type AgentWorkflowType =
  | 'ProductionWorkflow'      // Full track production pipeline
  | 'MixdownWorkflow'         // Multi-stem mixdown
  | 'MasteringWorkflow'       // AI mastering pipeline
  | 'AnalysisWorkflow'        // Deep audio analysis
  | 'AmapianorizeWorkflow';   // Cultural transformation

const TASK_QUEUE = 'aura-x-agent-queue';

class TemporalWorkflowService {
  private async invoke(body: Record<string, unknown>) {
    const { data, error } = await supabase.functions.invoke('temporal-workflow', { body });
    if (error) throw new Error(`Temporal edge function error: ${error.message}`);
    if (!data?.success) throw new Error(data?.error || 'Temporal workflow call failed');
    return data.data;
  }

  /**
   * Start a new durable workflow execution
   */
  async startWorkflow(
    workflowType: AgentWorkflowType,
    input: Record<string, unknown>,
    workflowId?: string
  ): Promise<WorkflowExecution> {
    const id = workflowId || `${workflowType}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    const result = await this.invoke({
      action: 'start',
      workflowId: id,
      workflowType,
      taskQueue: TASK_QUEUE,
      input,
    });

    return {
      workflowId: id,
      runId: result?.runId,
      status: 'RUNNING',
    };
  }

  /**
   * Send a signal to a running workflow (e.g. user feedback, parameter change)
   */
  async signalWorkflow(workflowId: string, signalName: string, signalInput?: unknown): Promise<void> {
    await this.invoke({ action: 'signal', workflowId, signalName, signalInput });
  }

  /**
   * Query a running workflow for its current state
   */
  async queryWorkflow<T = unknown>(workflowId: string, queryType: string, queryArgs?: unknown): Promise<T> {
    return await this.invoke({ action: 'query', workflowId, queryType, queryArgs }) as T;
  }

  /**
   * Get full description/status of a workflow execution
   */
  async describeWorkflow(workflowId: string): Promise<WorkflowDescription> {
    const raw = await this.invoke({ action: 'describe', workflowId });
    return {
      workflowId,
      runId: raw?.workflowExecutionInfo?.execution?.runId || '',
      status: raw?.workflowExecutionInfo?.status || 'UNKNOWN',
      startTime: raw?.workflowExecutionInfo?.startTime || '',
      closeTime: raw?.workflowExecutionInfo?.closeTime,
      type: raw?.workflowExecutionInfo?.type?.name || '',
      taskQueue: raw?.workflowExecutionInfo?.taskQueue || '',
    };
  }

  /**
   * Terminate a running workflow
   */
  async terminateWorkflow(workflowId: string, reason?: string): Promise<void> {
    await this.invoke({ action: 'terminate', workflowId, reason });
  }

  /**
   * List recent workflow executions
   */
  async listWorkflows(): Promise<WorkflowDescription[]> {
    const raw = await this.invoke({ action: 'list' });
    const executions = raw?.executions || [];
    return executions.map((ex: Record<string, unknown>) => {
      const info = ex as Record<string, unknown>;
      const execution = info.execution as Record<string, string> | undefined;
      const type = info.type as Record<string, string> | undefined;
      return {
        workflowId: execution?.workflowId || '',
        runId: execution?.runId || '',
        status: (info.status as string) || 'UNKNOWN',
        startTime: (info.startTime as string) || '',
        closeTime: info.closeTime as string | undefined,
        type: type?.name || '',
        taskQueue: (info.taskQueue as string) || '',
      };
    });
  }

  // ─── Convenience methods for common agent workflows ───

  async startProduction(params: {
    genre: string;
    bpm: number;
    key: string;
    mood?: string;
    region?: string;
    duration?: number;
  }): Promise<WorkflowExecution> {
    return this.startWorkflow('ProductionWorkflow', params);
  }

  async startMixdown(params: {
    stems: Record<string, string>;
    targetLufs?: number;
    preset?: string;
  }): Promise<WorkflowExecution> {
    return this.startWorkflow('MixdownWorkflow', params);
  }

  async startMastering(params: {
    audioUrl: string;
    preset?: string;
    targetPlatform?: string;
  }): Promise<WorkflowExecution> {
    return this.startWorkflow('MasteringWorkflow', params);
  }

  async startAnalysis(params: {
    audioUrl: string;
    analysisType?: string;
  }): Promise<WorkflowExecution> {
    return this.startWorkflow('AnalysisWorkflow', params);
  }

  async startAmapianorize(params: {
    audioUrl: string;
    region: string;
    intensity: number;
    elements: string[];
  }): Promise<WorkflowExecution> {
    return this.startWorkflow('AmapianorizeWorkflow', params);
  }

  /**
   * Send user feedback to a running production workflow (feedback loop)
   */
  async sendFeedback(workflowId: string, feedback: {
    rating: number;       // 1-5
    adjustments?: Record<string, unknown>;
    comment?: string;
  }): Promise<void> {
    await this.signalWorkflow(workflowId, 'user-feedback', feedback);
  }

  /**
   * Query the current progress of a workflow
   */
  async getProgress(workflowId: string): Promise<{
    stage: string;
    percent: number;
    currentStep: string;
    stepsCompleted: number;
    totalSteps: number;
  }> {
    try {
      return await this.queryWorkflow(workflowId, 'progress');
    } catch {
      // If query not supported, fall back to describe
      const desc = await this.describeWorkflow(workflowId);
      return {
        stage: desc.status,
        percent: desc.status === 'COMPLETED' ? 100 : 0,
        currentStep: desc.status,
        stepsCompleted: desc.status === 'COMPLETED' ? 1 : 0,
        totalSteps: 1,
      };
    }
  }
}

export const temporalWorkflowService = new TemporalWorkflowService();
