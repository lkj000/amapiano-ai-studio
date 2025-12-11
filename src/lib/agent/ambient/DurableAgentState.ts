/**
 * Durable Agent State
 * Workflow persistence with crash recovery and event sourcing
 */

import { supabase } from '@/integrations/supabase/client';

export interface StateEvent {
  id: string;
  type: string;
  payload: unknown;
  timestamp: number;
  sequence: number;
}

export interface WorkflowState {
  workflowId: string;
  status: 'running' | 'paused' | 'completed' | 'failed';
  currentStep: number;
  data: Record<string, unknown>;
  events: StateEvent[];
  checkpoints: StateCheckpoint[];
  createdAt: number;
  updatedAt: number;
}

export interface StateCheckpoint {
  id: string;
  step: number;
  state: Record<string, unknown>;
  timestamp: number;
}

export class DurableAgentState {
  private workflowId: string;
  private state: WorkflowState;
  private userId: string;

  constructor(workflowId: string, userId = '00000000-0000-0000-0000-000000000000') {
    this.workflowId = workflowId;
    this.userId = userId;
    this.state = {
      workflowId,
      status: 'running',
      currentStep: 0,
      data: {},
      events: [],
      checkpoints: [],
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
  }

  /**
   * Initialize or restore state from database
   */
  async initialize(): Promise<WorkflowState> {
    const { data, error } = await supabase
      .from('agent_memory')
      .select('memory_data')
      .eq('memory_key', `workflow_${this.workflowId}`)
      .eq('memory_type', 'workflow_state')
      .single();

    if (data && !error) {
      this.state = data.memory_data as unknown as WorkflowState;
    }

    return this.state;
  }

  /**
   * Record an event (event sourcing)
   */
  async recordEvent(type: string, payload: unknown): Promise<StateEvent> {
    const event: StateEvent = {
      id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      payload,
      timestamp: Date.now(),
      sequence: this.state.events.length
    };

    this.state.events.push(event);
    this.state.updatedAt = Date.now();

    await this.persist();

    return event;
  }

  /**
   * Create a checkpoint for recovery
   */
  async checkpoint(): Promise<StateCheckpoint> {
    const checkpoint: StateCheckpoint = {
      id: `chk_${Date.now()}`,
      step: this.state.currentStep,
      state: { ...this.state.data },
      timestamp: Date.now()
    };

    this.state.checkpoints.push(checkpoint);
    await this.persist();

    return checkpoint;
  }

  /**
   * Recover from a checkpoint
   */
  async recoverFromCheckpoint(checkpointId?: string): Promise<void> {
    const checkpoint = checkpointId
      ? this.state.checkpoints.find(c => c.id === checkpointId)
      : this.state.checkpoints[this.state.checkpoints.length - 1];

    if (!checkpoint) {
      throw new Error('No checkpoint found for recovery');
    }

    this.state.currentStep = checkpoint.step;
    this.state.data = { ...checkpoint.state };
    this.state.status = 'running';
    
    await this.recordEvent('recovery', { checkpointId: checkpoint.id });
  }

  /**
   * Update state data
   */
  async updateData(data: Partial<Record<string, unknown>>): Promise<void> {
    this.state.data = { ...this.state.data, ...data };
    this.state.updatedAt = Date.now();
    await this.persist();
  }

  /**
   * Advance to next step
   */
  async advanceStep(): Promise<number> {
    this.state.currentStep++;
    await this.recordEvent('step_advance', { step: this.state.currentStep });
    return this.state.currentStep;
  }

  /**
   * Set workflow status
   */
  async setStatus(status: WorkflowState['status']): Promise<void> {
    this.state.status = status;
    await this.recordEvent('status_change', { status });
    await this.persist();
  }

  /**
   * Persist state to database
   */
  private async persist(): Promise<void> {
    const { error } = await supabase
      .from('agent_memory')
      .upsert([{
        memory_key: `workflow_${this.workflowId}`,
        memory_type: 'workflow_state',
        memory_data: JSON.parse(JSON.stringify(this.state)),
        importance_score: 0.9,
        user_id: this.userId,
        updated_at: new Date().toISOString()
      }], {
        onConflict: 'memory_key'
      });

    if (error) {
      console.error('Failed to persist workflow state:', error);
    }
  }

  /**
   * Replay events to reconstruct state
   */
  async replayEvents(fromSequence = 0): Promise<void> {
    const eventsToReplay = this.state.events.filter(e => e.sequence >= fromSequence);
    
    // Reset to initial state
    this.state.data = {};
    this.state.currentStep = 0;

    // Replay each event
    for (const event of eventsToReplay) {
      await this.applyEvent(event);
    }
  }

  private async applyEvent(event: StateEvent): Promise<void> {
    switch (event.type) {
      case 'step_advance':
        this.state.currentStep = (event.payload as { step: number }).step;
        break;
      case 'status_change':
        this.state.status = (event.payload as { status: WorkflowState['status'] }).status;
        break;
      case 'data_update':
        this.state.data = { ...this.state.data, ...(event.payload as Record<string, unknown>) };
        break;
    }
  }

  getState(): WorkflowState {
    return { ...this.state };
  }

  getData<T = unknown>(key: string): T | undefined {
    return this.state.data[key] as T;
  }

  getCurrentStep(): number {
    return this.state.currentStep;
  }

  getStatus(): WorkflowState['status'] {
    return this.state.status;
  }

  getEvents(): StateEvent[] {
    return [...this.state.events];
  }

  getCheckpoints(): StateCheckpoint[] {
    return [...this.state.checkpoints];
  }
}
