/**
 * Durable Agent State
 * Temporal-inspired persistent workflow state
 * Survives crashes, restarts, and enables replay
 */

import { supabase } from '@/integrations/supabase/client';

export interface WorkflowState {
  workflowId: string;
  agentId: string;
  goal: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'paused';
  currentStep: number;
  totalSteps: number;
  checkpoints: WorkflowCheckpoint[];
  context: Record<string, any>;
  createdAt: number;
  updatedAt: number;
  completedAt?: number;
}

export interface WorkflowCheckpoint {
  stepId: string;
  stepName: string;
  status: 'pending' | 'completed' | 'failed' | 'skipped';
  input: any;
  output?: any;
  error?: string;
  startedAt?: number;
  completedAt?: number;
  retryCount: number;
}

export interface WorkflowEvent {
  id: string;
  workflowId: string;
  eventType: 'started' | 'step_started' | 'step_completed' | 'step_failed' | 
             'signal_received' | 'paused' | 'resumed' | 'completed' | 'failed';
  data: any;
  timestamp: number;
}

export class DurableAgentState {
  private static instance: DurableAgentState;
  private localCache: Map<string, WorkflowState> = new Map();
  private eventLog: Map<string, WorkflowEvent[]> = new Map();
  private persistenceEnabled: boolean = true;

  private constructor() {}

  static getInstance(): DurableAgentState {
    if (!DurableAgentState.instance) {
      DurableAgentState.instance = new DurableAgentState();
    }
    return DurableAgentState.instance;
  }

  /**
   * Create a new workflow
   */
  async createWorkflow(
    agentId: string,
    goal: string,
    steps: string[],
    context: Record<string, any> = {}
  ): Promise<WorkflowState> {
    const workflowId = `wf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const checkpoints: WorkflowCheckpoint[] = steps.map((stepName, index) => ({
      stepId: `step_${index}`,
      stepName,
      status: 'pending',
      input: {},
      retryCount: 0
    }));

    const workflow: WorkflowState = {
      workflowId,
      agentId,
      goal,
      status: 'pending',
      currentStep: 0,
      totalSteps: steps.length,
      checkpoints,
      context,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    // Store locally
    this.localCache.set(workflowId, workflow);
    this.eventLog.set(workflowId, []);

    // Log event
    await this.logEvent(workflowId, 'started', { goal, steps });

    // Persist to database
    if (this.persistenceEnabled) {
      await this.persistWorkflow(workflow);
    }

    console.log(`[DurableState] Created workflow: ${workflowId}`);
    return workflow;
  }

  /**
   * Get workflow by ID
   */
  async getWorkflow(workflowId: string): Promise<WorkflowState | null> {
    // Check local cache first
    if (this.localCache.has(workflowId)) {
      return this.localCache.get(workflowId)!;
    }

    // Try to load from database
    if (this.persistenceEnabled) {
      const workflow = await this.loadWorkflow(workflowId);
      if (workflow) {
        this.localCache.set(workflowId, workflow);
        return workflow;
      }
    }

    return null;
  }

  /**
   * Update workflow step
   */
  async updateStep(
    workflowId: string,
    stepId: string,
    update: Partial<WorkflowCheckpoint>
  ): Promise<void> {
    const workflow = await this.getWorkflow(workflowId);
    if (!workflow) {
      throw new Error(`Workflow not found: ${workflowId}`);
    }

    const checkpoint = workflow.checkpoints.find(c => c.stepId === stepId);
    if (!checkpoint) {
      throw new Error(`Step not found: ${stepId}`);
    }

    Object.assign(checkpoint, update);
    workflow.updatedAt = Date.now();

    // Log appropriate event
    if (update.status === 'completed') {
      await this.logEvent(workflowId, 'step_completed', { stepId, output: update.output });
      workflow.currentStep++;
    } else if (update.status === 'failed') {
      await this.logEvent(workflowId, 'step_failed', { stepId, error: update.error });
    }

    // Persist
    if (this.persistenceEnabled) {
      await this.persistWorkflow(workflow);
    }
  }

  /**
   * Start a step
   */
  async startStep(workflowId: string, stepId: string, input: any): Promise<void> {
    await this.updateStep(workflowId, stepId, {
      status: 'pending',
      input,
      startedAt: Date.now()
    });

    const workflow = await this.getWorkflow(workflowId);
    if (workflow && workflow.status !== 'running') {
      workflow.status = 'running';
      await this.persistWorkflow(workflow);
    }

    await this.logEvent(workflowId, 'step_started', { stepId, input });
  }

  /**
   * Complete a step
   */
  async completeStep(workflowId: string, stepId: string, output: any): Promise<void> {
    await this.updateStep(workflowId, stepId, {
      status: 'completed',
      output,
      completedAt: Date.now()
    });

    // Check if workflow is complete
    const workflow = await this.getWorkflow(workflowId);
    if (workflow) {
      const allCompleted = workflow.checkpoints.every(
        c => c.status === 'completed' || c.status === 'skipped'
      );

      if (allCompleted) {
        workflow.status = 'completed';
        workflow.completedAt = Date.now();
        await this.logEvent(workflowId, 'completed', { totalSteps: workflow.totalSteps });
        await this.persistWorkflow(workflow);
      }
    }
  }

  /**
   * Fail a step
   */
  async failStep(workflowId: string, stepId: string, error: string): Promise<void> {
    const workflow = await this.getWorkflow(workflowId);
    if (!workflow) return;

    const checkpoint = workflow.checkpoints.find(c => c.stepId === stepId);
    if (checkpoint) {
      checkpoint.retryCount++;
    }

    await this.updateStep(workflowId, stepId, {
      status: 'failed',
      error,
      completedAt: Date.now()
    });
  }

  /**
   * Retry a failed step
   */
  async retryStep(workflowId: string, stepId: string): Promise<void> {
    const workflow = await this.getWorkflow(workflowId);
    if (!workflow) return;

    const checkpoint = workflow.checkpoints.find(c => c.stepId === stepId);
    if (checkpoint && checkpoint.status === 'failed') {
      checkpoint.status = 'pending';
      checkpoint.error = undefined;
      checkpoint.startedAt = Date.now();
      checkpoint.completedAt = undefined;
      
      await this.persistWorkflow(workflow);
      await this.logEvent(workflowId, 'step_started', { stepId, retry: checkpoint.retryCount });
    }
  }

  /**
   * Pause workflow
   */
  async pauseWorkflow(workflowId: string): Promise<void> {
    const workflow = await this.getWorkflow(workflowId);
    if (!workflow) return;

    workflow.status = 'paused';
    workflow.updatedAt = Date.now();
    
    await this.persistWorkflow(workflow);
    await this.logEvent(workflowId, 'paused', {});
    
    console.log(`[DurableState] Paused workflow: ${workflowId}`);
  }

  /**
   * Resume workflow
   */
  async resumeWorkflow(workflowId: string): Promise<void> {
    const workflow = await this.getWorkflow(workflowId);
    if (!workflow || workflow.status !== 'paused') return;

    workflow.status = 'running';
    workflow.updatedAt = Date.now();
    
    await this.persistWorkflow(workflow);
    await this.logEvent(workflowId, 'resumed', {});
    
    console.log(`[DurableState] Resumed workflow: ${workflowId}`);
  }

  /**
   * Record signal received
   */
  async recordSignal(workflowId: string, signalData: any): Promise<void> {
    await this.logEvent(workflowId, 'signal_received', signalData);
  }

  /**
   * Get workflow events
   */
  getEvents(workflowId: string): WorkflowEvent[] {
    return this.eventLog.get(workflowId) || [];
  }

  /**
   * Get active workflows for an agent
   */
  async getActiveWorkflows(agentId: string): Promise<WorkflowState[]> {
    // Check local cache
    const active = Array.from(this.localCache.values()).filter(
      w => w.agentId === agentId && (w.status === 'running' || w.status === 'paused')
    );

    if (active.length > 0) return active;

    // Try database
    if (this.persistenceEnabled) {
      const { data } = await supabase
        .from('agent_memory')
        .select('*')
        .eq('memory_type', 'workflow')
        .like('memory_key', `wf_%`)
        .order('created_at', { ascending: false })
        .limit(20);

      if (data) {
        return data
          .map(d => d.memory_data as unknown as WorkflowState)
          .filter(w => w.agentId === agentId && 
            (w.status === 'running' || w.status === 'paused'));
      }
    }

    return [];
  }

  /**
   * Log workflow event
   */
  private async logEvent(
    workflowId: string,
    eventType: WorkflowEvent['eventType'],
    data: any
  ): Promise<void> {
    const event: WorkflowEvent = {
      id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      workflowId,
      eventType,
      data,
      timestamp: Date.now()
    };

    const events = this.eventLog.get(workflowId) || [];
    events.push(event);
    this.eventLog.set(workflowId, events);

    console.log(`[DurableState] Event: ${eventType} for ${workflowId}`);
  }

  /**
   * Persist workflow to database
   */
  private async persistWorkflow(workflow: WorkflowState): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase
        .from('agent_memory')
        .upsert({
          user_id: user.id,
          memory_key: workflow.workflowId,
          memory_type: 'workflow',
          memory_data: workflow as any,
          updated_at: new Date().toISOString()
        }, { onConflict: 'memory_key' });

    } catch (error) {
      console.error('[DurableState] Failed to persist workflow:', error);
    }
  }

  /**
   * Load workflow from database
   */
  private async loadWorkflow(workflowId: string): Promise<WorkflowState | null> {
    try {
      const { data } = await supabase
        .from('agent_memory')
        .select('memory_data')
        .eq('memory_key', workflowId)
        .single();

      if (data) {
        return data.memory_data as unknown as WorkflowState;
      }
    } catch (error) {
      console.error('[DurableState] Failed to load workflow:', error);
    }
    return null;
  }

  /**
   * Replay workflow from events (for debugging/recovery)
   */
  async replayWorkflow(workflowId: string): Promise<WorkflowState | null> {
    const events = this.getEvents(workflowId);
    if (events.length === 0) return null;

    console.log(`[DurableState] Replaying ${events.length} events for ${workflowId}`);

    // Find initial state from 'started' event
    const startEvent = events.find(e => e.eventType === 'started');
    if (!startEvent) return null;

    // Reconstruct state by replaying events
    // This is a simplified replay - full implementation would be more comprehensive
    const workflow = await this.getWorkflow(workflowId);
    return workflow;
  }

  /**
   * Enable/disable persistence
   */
  setPersistenceEnabled(enabled: boolean): void {
    this.persistenceEnabled = enabled;
  }

  /**
   * Clear all state (for testing)
   */
  reset(): void {
    this.localCache.clear();
    this.eventLog.clear();
  }
}

export const durableState = DurableAgentState.getInstance();
