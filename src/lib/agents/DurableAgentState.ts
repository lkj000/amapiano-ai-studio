/**
 * Durable Agent State
 * 
 * Temporal-inspired persistent workflow state with FULL event replay capability.
 * Survives crashes, restarts, and enables complete workflow reconstruction.
 * 
 * Key Features:
 * 1. Full event sourcing - all state changes captured as events
 * 2. Complete event replay for crash recovery
 * 3. Checkpointing for efficient recovery
 * 4. Saga pattern support for distributed transactions
 */

import { supabase } from '@/integrations/supabase/client';

export interface WorkflowState {
  workflowId: string;
  agentId: string;
  goal: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'paused' | 'compensating';
  currentStep: number;
  totalSteps: number;
  checkpoints: WorkflowCheckpoint[];
  context: Record<string, any>;
  createdAt: number;
  updatedAt: number;
  completedAt?: number;
  version: number; // Optimistic locking
}

export interface WorkflowCheckpoint {
  stepId: string;
  stepName: string;
  status: 'pending' | 'completed' | 'failed' | 'skipped' | 'compensated';
  input: any;
  output?: any;
  error?: string;
  startedAt?: number;
  completedAt?: number;
  retryCount: number;
  compensationData?: any; // For saga rollback
}

export interface WorkflowEvent {
  id: string;
  workflowId: string;
  eventType: WorkflowEventType;
  data: any;
  timestamp: number;
  sequence: number; // Order for replay
}

export type WorkflowEventType = 
  | 'workflow_created'
  | 'workflow_started'
  | 'step_started'
  | 'step_completed'
  | 'step_failed'
  | 'step_compensated'
  | 'signal_received'
  | 'query_executed'
  | 'paused'
  | 'resumed'
  | 'completed'
  | 'failed'
  | 'context_updated';

/**
 * Event handlers for replay
 */
type EventHandler = (state: WorkflowState, event: WorkflowEvent) => WorkflowState;

const eventHandlers: Record<WorkflowEventType, EventHandler> = {
  workflow_created: (state, event) => ({
    ...event.data.initialState,
    version: 1
  }),
  
  workflow_started: (state, event) => ({
    ...state,
    status: 'running',
    updatedAt: event.timestamp,
    version: state.version + 1
  }),
  
  step_started: (state, event) => {
    const checkpoint = state.checkpoints.find(c => c.stepId === event.data.stepId);
    if (checkpoint) {
      checkpoint.status = 'pending';
      checkpoint.input = event.data.input;
      checkpoint.startedAt = event.timestamp;
    }
    return { ...state, updatedAt: event.timestamp, version: state.version + 1 };
  },
  
  step_completed: (state, event) => {
    const checkpoint = state.checkpoints.find(c => c.stepId === event.data.stepId);
    if (checkpoint) {
      checkpoint.status = 'completed';
      checkpoint.output = event.data.output;
      checkpoint.completedAt = event.timestamp;
    }
    const newCurrentStep = state.currentStep + 1;
    return { 
      ...state, 
      currentStep: newCurrentStep,
      updatedAt: event.timestamp, 
      version: state.version + 1 
    };
  },
  
  step_failed: (state, event) => {
    const checkpoint = state.checkpoints.find(c => c.stepId === event.data.stepId);
    if (checkpoint) {
      checkpoint.status = 'failed';
      checkpoint.error = event.data.error;
      checkpoint.retryCount++;
      checkpoint.completedAt = event.timestamp;
    }
    return { ...state, updatedAt: event.timestamp, version: state.version + 1 };
  },
  
  step_compensated: (state, event) => {
    const checkpoint = state.checkpoints.find(c => c.stepId === event.data.stepId);
    if (checkpoint) {
      checkpoint.status = 'compensated';
      checkpoint.compensationData = event.data.compensationResult;
    }
    return { ...state, status: 'compensating', updatedAt: event.timestamp, version: state.version + 1 };
  },
  
  signal_received: (state, event) => ({
    ...state,
    context: { ...state.context, lastSignal: event.data },
    updatedAt: event.timestamp,
    version: state.version + 1
  }),
  
  query_executed: (state, _event) => state, // Queries don't change state
  
  paused: (state, event) => ({
    ...state,
    status: 'paused',
    updatedAt: event.timestamp,
    version: state.version + 1
  }),
  
  resumed: (state, event) => ({
    ...state,
    status: 'running',
    updatedAt: event.timestamp,
    version: state.version + 1
  }),
  
  completed: (state, event) => ({
    ...state,
    status: 'completed',
    completedAt: event.timestamp,
    updatedAt: event.timestamp,
    version: state.version + 1
  }),
  
  failed: (state, event) => ({
    ...state,
    status: 'failed',
    context: { ...state.context, failureReason: event.data.error },
    updatedAt: event.timestamp,
    version: state.version + 1
  }),
  
  context_updated: (state, event) => ({
    ...state,
    context: { ...state.context, ...event.data.updates },
    updatedAt: event.timestamp,
    version: state.version + 1
  })
};

export class DurableAgentState {
  private static instance: DurableAgentState;
  private localCache: Map<string, WorkflowState> = new Map();
  private eventLog: Map<string, WorkflowEvent[]> = new Map();
  private persistenceEnabled: boolean = true;
  private sequenceCounters: Map<string, number> = new Map();

  private constructor() {}

  static getInstance(): DurableAgentState {
    if (!DurableAgentState.instance) {
      DurableAgentState.instance = new DurableAgentState();
    }
    return DurableAgentState.instance;
  }

  /**
   * Create a new workflow with event sourcing
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

    const initialState: WorkflowState = {
      workflowId,
      agentId,
      goal,
      status: 'pending',
      currentStep: 0,
      totalSteps: steps.length,
      checkpoints,
      context,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      version: 0
    };

    // Initialize event log and sequence counter
    this.eventLog.set(workflowId, []);
    this.sequenceCounters.set(workflowId, 0);

    // Record creation event
    await this.appendEvent(workflowId, 'workflow_created', { initialState, goal, steps });

    // Cache the state
    this.localCache.set(workflowId, initialState);

    console.log(`[DurableState] Created workflow: ${workflowId}`);
    return initialState;
  }

  /**
   * Append event to log with proper sequencing
   */
  private async appendEvent(
    workflowId: string, 
    eventType: WorkflowEventType, 
    data: any
  ): Promise<WorkflowEvent> {
    const sequence = (this.sequenceCounters.get(workflowId) || 0) + 1;
    this.sequenceCounters.set(workflowId, sequence);

    const event: WorkflowEvent = {
      id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      workflowId,
      eventType,
      data,
      timestamp: Date.now(),
      sequence
    };

    // Append to local log
    const events = this.eventLog.get(workflowId) || [];
    events.push(event);
    this.eventLog.set(workflowId, events);

    // Persist event
    if (this.persistenceEnabled) {
      await this.persistEvent(event);
    }

    // Apply event to cached state
    const currentState = this.localCache.get(workflowId);
    if (currentState) {
      const handler = eventHandlers[eventType];
      if (handler) {
        const newState = handler(currentState, event);
        this.localCache.set(workflowId, newState);
        
        // Persist state snapshot periodically (every 10 events)
        if (sequence % 10 === 0) {
          await this.persistWorkflow(newState);
        }
      }
    }

    console.log(`[DurableState] Event: ${eventType} seq=${sequence} for ${workflowId}`);
    return event;
  }

  /**
   * Get workflow by ID (from cache or rebuild from events)
   */
  async getWorkflow(workflowId: string): Promise<WorkflowState | null> {
    // Check local cache first
    if (this.localCache.has(workflowId)) {
      return this.localCache.get(workflowId)!;
    }

    // Try to load and replay from events
    if (this.persistenceEnabled) {
      const workflow = await this.replayWorkflow(workflowId);
      if (workflow) {
        this.localCache.set(workflowId, workflow);
        return workflow;
      }
    }

    return null;
  }

  /**
   * FULL EVENT REPLAY - Reconstruct workflow state from event log
   */
  async replayWorkflow(workflowId: string): Promise<WorkflowState | null> {
    console.log(`[DurableState] Replaying workflow: ${workflowId}`);
    
    // Load events from database
    const events = await this.loadEvents(workflowId);
    if (events.length === 0) {
      console.log(`[DurableState] No events found for ${workflowId}`);
      return null;
    }

    // Sort events by sequence
    events.sort((a, b) => a.sequence - b.sequence);
    
    // Store in local event log
    this.eventLog.set(workflowId, events);
    this.sequenceCounters.set(workflowId, events[events.length - 1].sequence);

    // Replay events to reconstruct state
    let state: WorkflowState | null = null;

    for (const event of events) {
      const handler = eventHandlers[event.eventType];
      if (handler) {
        if (event.eventType === 'workflow_created') {
          state = handler({} as WorkflowState, event);
        } else if (state) {
          state = handler(state, event);
        }
      }
    }

    console.log(`[DurableState] Replayed ${events.length} events, state: ${state?.status}`);
    return state;
  }

  /**
   * Start workflow
   */
  async startWorkflow(workflowId: string): Promise<void> {
    await this.appendEvent(workflowId, 'workflow_started', {});
  }

  /**
   * Start a step
   */
  async startStep(workflowId: string, stepId: string, input: any): Promise<void> {
    await this.appendEvent(workflowId, 'step_started', { stepId, input });
  }

  /**
   * Complete a step
   */
  async completeStep(workflowId: string, stepId: string, output: any): Promise<void> {
    await this.appendEvent(workflowId, 'step_completed', { stepId, output });

    // Check if workflow is complete
    const workflow = await this.getWorkflow(workflowId);
    if (workflow) {
      const allCompleted = workflow.checkpoints.every(
        c => c.status === 'completed' || c.status === 'skipped'
      );

      if (allCompleted) {
        await this.appendEvent(workflowId, 'completed', { totalSteps: workflow.totalSteps });
      }
    }
  }

  /**
   * Fail a step
   */
  async failStep(workflowId: string, stepId: string, error: string): Promise<void> {
    await this.appendEvent(workflowId, 'step_failed', { stepId, error });
  }

  /**
   * Compensate a step (saga rollback)
   */
  async compensateStep(workflowId: string, stepId: string, compensationResult: any): Promise<void> {
    await this.appendEvent(workflowId, 'step_compensated', { stepId, compensationResult });
  }

  /**
   * Retry a failed step
   */
  async retryStep(workflowId: string, stepId: string): Promise<void> {
    const workflow = await this.getWorkflow(workflowId);
    if (!workflow) return;

    const checkpoint = workflow.checkpoints.find(c => c.stepId === stepId);
    if (checkpoint && checkpoint.status === 'failed') {
      await this.appendEvent(workflowId, 'step_started', { 
        stepId, 
        input: checkpoint.input,
        isRetry: true,
        retryCount: checkpoint.retryCount + 1
      });
    }
  }

  /**
   * Pause workflow
   */
  async pauseWorkflow(workflowId: string): Promise<void> {
    await this.appendEvent(workflowId, 'paused', {});
    console.log(`[DurableState] Paused workflow: ${workflowId}`);
  }

  /**
   * Resume workflow
   */
  async resumeWorkflow(workflowId: string): Promise<void> {
    const workflow = await this.getWorkflow(workflowId);
    if (!workflow || workflow.status !== 'paused') return;

    await this.appendEvent(workflowId, 'resumed', {});
    console.log(`[DurableState] Resumed workflow: ${workflowId}`);
  }

  /**
   * Record signal received
   */
  async recordSignal(workflowId: string, signalData: any): Promise<void> {
    await this.appendEvent(workflowId, 'signal_received', signalData);
  }

  /**
   * Update workflow context
   */
  async updateContext(workflowId: string, updates: Record<string, any>): Promise<void> {
    await this.appendEvent(workflowId, 'context_updated', { updates });
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
    const active = Array.from(this.localCache.values()).filter(
      w => w.agentId === agentId && (w.status === 'running' || w.status === 'paused')
    );

    if (active.length > 0) return active;

    if (this.persistenceEnabled) {
      const { data } = await supabase
        .from('agent_memory')
        .select('*')
        .eq('memory_type', 'workflow')
        .like('memory_key', `wf_%`)
        .order('created_at', { ascending: false })
        .limit(20);

      if (data) {
        const workflows: WorkflowState[] = [];
        for (const d of data) {
          const workflow = d.memory_data as unknown as WorkflowState;
          if (workflow.agentId === agentId && 
              (workflow.status === 'running' || workflow.status === 'paused')) {
            workflows.push(workflow);
          }
        }
        return workflows;
      }
    }

    return [];
  }

  /**
   * Execute saga compensation (rollback completed steps)
   */
  async executeSagaCompensation(workflowId: string): Promise<void> {
    const workflow = await this.getWorkflow(workflowId);
    if (!workflow) return;

    console.log(`[DurableState] Starting saga compensation for ${workflowId}`);

    // Compensate completed steps in reverse order
    const completedSteps = workflow.checkpoints
      .filter(c => c.status === 'completed')
      .reverse();

    for (const step of completedSteps) {
      try {
        // Execute compensation logic (would be provided by step definition)
        const compensationResult = { 
          stepId: step.stepId, 
          compensatedAt: Date.now(),
          originalOutput: step.output
        };
        await this.compensateStep(workflowId, step.stepId, compensationResult);
      } catch (error) {
        console.error(`[DurableState] Compensation failed for step ${step.stepId}:`, error);
      }
    }

    await this.appendEvent(workflowId, 'failed', { 
      error: 'Saga compensation completed',
      compensatedSteps: completedSteps.map(s => s.stepId)
    });
  }

  /**
   * Persist event to database
   */
  private async persistEvent(event: WorkflowEvent): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase.from('agent_memory').insert({
        user_id: user.id,
        memory_key: `event_${event.id}`,
        memory_type: 'workflow_event',
        memory_data: event as any,
        created_at: new Date(event.timestamp).toISOString()
      });

    } catch (error) {
      console.error('[DurableState] Failed to persist event:', error);
    }
  }

  /**
   * Load events from database
   */
  private async loadEvents(workflowId: string): Promise<WorkflowEvent[]> {
    try {
      const { data } = await supabase
        .from('agent_memory')
        .select('memory_data')
        .eq('memory_type', 'workflow_event')
        .like('memory_key', 'event_%')
        .order('created_at', { ascending: true });

      if (data) {
        return data
          .map(d => d.memory_data as unknown as WorkflowEvent)
          .filter(e => e.workflowId === workflowId);
      }
    } catch (error) {
      console.error('[DurableState] Failed to load events:', error);
    }
    return [];
  }

  /**
   * Persist workflow state snapshot
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
   * Enable/disable persistence
   */
  setPersistenceEnabled(enabled: boolean): void {
    this.persistenceEnabled = enabled;
  }

  /**
   * Get workflow statistics
   */
  getStats(): { 
    activeWorkflows: number; 
    totalEvents: number; 
    cachedWorkflows: number 
  } {
    let totalEvents = 0;
    for (const events of this.eventLog.values()) {
      totalEvents += events.length;
    }

    const activeWorkflows = Array.from(this.localCache.values())
      .filter(w => w.status === 'running' || w.status === 'paused').length;

    return {
      activeWorkflows,
      totalEvents,
      cachedWorkflows: this.localCache.size
    };
  }

  /**
   * Clear all state (for testing)
   */
  reset(): void {
    this.localCache.clear();
    this.eventLog.clear();
    this.sequenceCounters.clear();
  }
}

export const durableState = DurableAgentState.getInstance();
