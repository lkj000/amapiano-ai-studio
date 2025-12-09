/**
 * Workflow Replay Engine
 * 
 * Future Direction #5: Complete implementation of workflow replay for debugging
 * 
 * Provides:
 * 1. Full event replay from persisted event log
 * 2. Step-by-step execution with breakpoints
 * 3. State inspection at any point in time
 * 4. Divergence detection between replay and original
 * 5. Interactive debugging with time travel
 */

import { supabase } from '@/integrations/supabase/client';
import { 
  WorkflowState, 
  WorkflowEvent, 
  WorkflowEventType,
  WorkflowCheckpoint 
} from './DurableAgentState';

export interface ReplayConfig {
  playbackSpeed: number; // 1.0 = real-time, 2.0 = 2x speed
  breakpoints: string[]; // Step IDs to pause at
  inspectMode: boolean; // Enable state inspection
  divergenceThreshold: number; // Tolerance for state divergence
}

export interface ReplayState {
  workflowId: string;
  currentEventIndex: number;
  totalEvents: number;
  currentState: WorkflowState;
  isPlaying: boolean;
  isPaused: boolean;
  replaySpeed: number;
  divergences: Divergence[];
  timeline: TimelineEntry[];
}

export interface TimelineEntry {
  eventIndex: number;
  event: WorkflowEvent;
  stateSnapshot: Partial<WorkflowState>;
  timestamp: number;
  duration: number;
}

export interface Divergence {
  eventIndex: number;
  eventType: WorkflowEventType;
  expected: any;
  actual: any;
  severity: 'warning' | 'error';
}

export interface DebugBreakpoint {
  id: string;
  stepId?: string;
  eventType?: WorkflowEventType;
  condition?: (state: WorkflowState, event: WorkflowEvent) => boolean;
  enabled: boolean;
}

type ReplayCallback = (state: ReplayState) => void;

/**
 * Workflow Replay Engine for debugging and analysis
 */
export class WorkflowReplayEngine {
  private config: ReplayConfig;
  private currentReplay: ReplayState | null = null;
  private eventLog: WorkflowEvent[] = [];
  private breakpoints: DebugBreakpoint[] = [];
  private callbacks: Set<ReplayCallback> = new Set();
  private playbackTimer: NodeJS.Timeout | null = null;
  private stateSnapshots: Map<number, WorkflowState> = new Map();

  constructor(config: Partial<ReplayConfig> = {}) {
    this.config = {
      playbackSpeed: config.playbackSpeed ?? 1.0,
      breakpoints: config.breakpoints ?? [],
      inspectMode: config.inspectMode ?? true,
      divergenceThreshold: config.divergenceThreshold ?? 0.1
    };
  }

  /**
   * Load workflow events from database for replay
   */
  async loadWorkflow(workflowId: string): Promise<ReplayState> {
    console.log(`[ReplayEngine] Loading workflow: ${workflowId}`);
    
    // Load events from database
    const { data: events, error } = await supabase
      .from('agent_memory')
      .select('*')
      .eq('memory_key', workflowId)
      .eq('memory_type', 'workflow_event')
      .order('created_at', { ascending: true });
    
    if (error) {
      console.error('[ReplayEngine] Failed to load events:', error);
      throw new Error(`Failed to load workflow events: ${error.message}`);
    }
    
    // Parse events
    this.eventLog = (events || []).map(e => e.memory_data as unknown as WorkflowEvent);
    
    // Create initial state
    const initialState = this.createInitialState(workflowId);
    
    // Build timeline
    const timeline = this.buildTimeline();
    
    this.currentReplay = {
      workflowId,
      currentEventIndex: 0,
      totalEvents: this.eventLog.length,
      currentState: initialState,
      isPlaying: false,
      isPaused: false,
      replaySpeed: this.config.playbackSpeed,
      divergences: [],
      timeline
    };
    
    // Take initial snapshot
    this.stateSnapshots.set(0, JSON.parse(JSON.stringify(initialState)));
    
    console.log(`[ReplayEngine] Loaded ${this.eventLog.length} events`);
    return this.currentReplay;
  }

  /**
   * Create initial workflow state
   */
  private createInitialState(workflowId: string): WorkflowState {
    return {
      workflowId,
      agentId: 'replay',
      goal: '',
      status: 'pending',
      currentStep: 0,
      totalSteps: 0,
      checkpoints: [],
      context: {},
      createdAt: Date.now(),
      updatedAt: Date.now(),
      version: 0
    };
  }

  /**
   * Build timeline from events
   */
  private buildTimeline(): TimelineEntry[] {
    const timeline: TimelineEntry[] = [];
    let currentState = this.createInitialState(this.eventLog[0]?.workflowId || '');
    
    for (let i = 0; i < this.eventLog.length; i++) {
      const event = this.eventLog[i];
      const prevTimestamp = i > 0 ? this.eventLog[i - 1].timestamp : event.timestamp;
      
      timeline.push({
        eventIndex: i,
        event,
        stateSnapshot: this.extractStateSnapshot(currentState),
        timestamp: event.timestamp,
        duration: event.timestamp - prevTimestamp
      });
      
      // Apply event to state
      currentState = this.applyEvent(currentState, event);
    }
    
    return timeline;
  }

  /**
   * Extract minimal state snapshot for timeline
   */
  private extractStateSnapshot(state: WorkflowState): Partial<WorkflowState> {
    return {
      status: state.status,
      currentStep: state.currentStep,
      version: state.version
    };
  }

  /**
   * Start playback
   */
  play(): void {
    if (!this.currentReplay) {
      console.warn('[ReplayEngine] No workflow loaded');
      return;
    }
    
    if (this.currentReplay.isPlaying) return;
    
    this.currentReplay.isPlaying = true;
    this.currentReplay.isPaused = false;
    
    this.scheduleNextEvent();
    this.notifyCallbacks();
  }

  /**
   * Pause playback
   */
  pause(): void {
    if (!this.currentReplay) return;
    
    this.currentReplay.isPlaying = false;
    this.currentReplay.isPaused = true;
    
    if (this.playbackTimer) {
      clearTimeout(this.playbackTimer);
      this.playbackTimer = null;
    }
    
    this.notifyCallbacks();
  }

  /**
   * Stop and reset playback
   */
  stop(): void {
    if (!this.currentReplay) return;
    
    this.pause();
    this.currentReplay.currentEventIndex = 0;
    this.currentReplay.currentState = this.stateSnapshots.get(0) || 
      this.createInitialState(this.currentReplay.workflowId);
    this.currentReplay.divergences = [];
    
    this.notifyCallbacks();
  }

  /**
   * Step forward one event
   */
  stepForward(): void {
    if (!this.currentReplay) return;
    
    if (this.currentReplay.currentEventIndex >= this.eventLog.length) {
      console.log('[ReplayEngine] Reached end of events');
      return;
    }
    
    this.processNextEvent();
    this.notifyCallbacks();
  }

  /**
   * Step backward one event
   */
  stepBackward(): void {
    if (!this.currentReplay) return;
    
    if (this.currentReplay.currentEventIndex <= 0) {
      console.log('[ReplayEngine] At beginning of events');
      return;
    }
    
    // Find nearest snapshot before current position
    const targetIndex = this.currentReplay.currentEventIndex - 1;
    let snapshotIndex = 0;
    
    for (const [idx] of this.stateSnapshots) {
      if (idx <= targetIndex && idx > snapshotIndex) {
        snapshotIndex = idx;
      }
    }
    
    // Restore snapshot and replay to target
    this.currentReplay.currentState = JSON.parse(
      JSON.stringify(this.stateSnapshots.get(snapshotIndex))
    );
    this.currentReplay.currentEventIndex = snapshotIndex;
    
    // Replay from snapshot to target
    while (this.currentReplay.currentEventIndex < targetIndex) {
      this.processNextEvent(false);
    }
    
    this.notifyCallbacks();
  }

  /**
   * Jump to specific event index
   */
  jumpTo(eventIndex: number): void {
    if (!this.currentReplay) return;
    
    eventIndex = Math.max(0, Math.min(eventIndex, this.eventLog.length - 1));
    
    // Find nearest snapshot
    let snapshotIndex = 0;
    for (const [idx] of this.stateSnapshots) {
      if (idx <= eventIndex && idx > snapshotIndex) {
        snapshotIndex = idx;
      }
    }
    
    // Restore and replay
    this.currentReplay.currentState = JSON.parse(
      JSON.stringify(this.stateSnapshots.get(snapshotIndex))
    );
    this.currentReplay.currentEventIndex = snapshotIndex;
    
    while (this.currentReplay.currentEventIndex < eventIndex) {
      this.processNextEvent(false);
    }
    
    this.notifyCallbacks();
  }

  /**
   * Schedule next event processing based on playback speed
   */
  private scheduleNextEvent(): void {
    if (!this.currentReplay || !this.currentReplay.isPlaying) return;
    
    if (this.currentReplay.currentEventIndex >= this.eventLog.length) {
      this.pause();
      console.log('[ReplayEngine] Playback complete');
      return;
    }
    
    const currentEvent = this.eventLog[this.currentReplay.currentEventIndex];
    const nextEvent = this.eventLog[this.currentReplay.currentEventIndex + 1];
    
    // Calculate delay to next event
    let delay = 100; // Default 100ms between events
    if (nextEvent) {
      delay = (nextEvent.timestamp - currentEvent.timestamp) / this.currentReplay.replaySpeed;
      delay = Math.max(10, Math.min(delay, 5000)); // Clamp between 10ms and 5s
    }
    
    this.playbackTimer = setTimeout(() => {
      this.processNextEvent();
      
      // Check for breakpoints
      if (this.shouldBreakHere()) {
        this.pause();
        console.log('[ReplayEngine] Hit breakpoint');
      } else {
        this.scheduleNextEvent();
      }
    }, delay);
  }

  /**
   * Process the next event in sequence
   */
  private processNextEvent(notify: boolean = true): void {
    if (!this.currentReplay) return;
    
    const event = this.eventLog[this.currentReplay.currentEventIndex];
    if (!event) return;
    
    // Store state before event for divergence detection
    const stateBefore = JSON.parse(JSON.stringify(this.currentReplay.currentState));
    
    // Apply event
    this.currentReplay.currentState = this.applyEvent(
      this.currentReplay.currentState,
      event
    );
    
    // Check for divergence
    if (this.config.inspectMode) {
      this.detectDivergence(stateBefore, this.currentReplay.currentState, event);
    }
    
    // Create snapshot every 10 events
    if (this.currentReplay.currentEventIndex % 10 === 0) {
      this.stateSnapshots.set(
        this.currentReplay.currentEventIndex,
        JSON.parse(JSON.stringify(this.currentReplay.currentState))
      );
    }
    
    this.currentReplay.currentEventIndex++;
    
    if (notify) {
      this.notifyCallbacks();
    }
  }

  /**
   * Apply event to state (event sourcing)
   */
  private applyEvent(state: WorkflowState, event: WorkflowEvent): WorkflowState {
    const newState = { ...state, version: state.version + 1, updatedAt: event.timestamp };
    
    switch (event.eventType) {
      case 'workflow_created':
        return {
          ...event.data.initialState,
          version: 1
        };
        
      case 'workflow_started':
        return {
          ...newState,
          status: 'running'
        };
        
      case 'step_started':
        const stepStartCheckpoints = [...newState.checkpoints];
        const startCheckpoint = stepStartCheckpoints.find(c => c.stepId === event.data.stepId);
        if (startCheckpoint) {
          startCheckpoint.status = 'pending';
          startCheckpoint.input = event.data.input;
          startCheckpoint.startedAt = event.timestamp;
        }
        return { ...newState, checkpoints: stepStartCheckpoints };
        
      case 'step_completed':
        const stepCompleteCheckpoints = [...newState.checkpoints];
        const completeCheckpoint = stepCompleteCheckpoints.find(c => c.stepId === event.data.stepId);
        if (completeCheckpoint) {
          completeCheckpoint.status = 'completed';
          completeCheckpoint.output = event.data.output;
          completeCheckpoint.completedAt = event.timestamp;
        }
        return { 
          ...newState, 
          checkpoints: stepCompleteCheckpoints,
          currentStep: newState.currentStep + 1
        };
        
      case 'step_failed':
        const stepFailCheckpoints = [...newState.checkpoints];
        const failCheckpoint = stepFailCheckpoints.find(c => c.stepId === event.data.stepId);
        if (failCheckpoint) {
          failCheckpoint.status = 'failed';
          failCheckpoint.error = event.data.error;
          failCheckpoint.retryCount = (failCheckpoint.retryCount || 0) + 1;
        }
        return { ...newState, checkpoints: stepFailCheckpoints };
        
      case 'step_compensated':
        const stepCompCheckpoints = [...newState.checkpoints];
        const compCheckpoint = stepCompCheckpoints.find(c => c.stepId === event.data.stepId);
        if (compCheckpoint) {
          compCheckpoint.status = 'compensated';
          compCheckpoint.compensationData = event.data.compensationResult;
        }
        return { ...newState, checkpoints: stepCompCheckpoints };
        
      case 'context_updated':
        return {
          ...newState,
          context: { ...newState.context, ...event.data.updates }
        };
        
      case 'paused':
        return { ...newState, status: 'paused' };
        
      case 'resumed':
        return { ...newState, status: 'running' };
        
      case 'completed':
        return {
          ...newState,
          status: 'completed',
          completedAt: event.timestamp
        };
        
      case 'failed':
        return { ...newState, status: 'failed' };
        
      default:
        return newState;
    }
  }

  /**
   * Detect divergence between expected and actual state
   */
  private detectDivergence(
    before: WorkflowState,
    after: WorkflowState,
    event: WorkflowEvent
  ): void {
    if (!this.currentReplay) return;
    
    // Compare key state properties
    const expectedFields = ['status', 'currentStep', 'version'];
    
    for (const field of expectedFields) {
      const actualValue = (after as any)[field];
      const expectedValue = event.data?.expectedState?.[field];
      
      if (expectedValue !== undefined && actualValue !== expectedValue) {
        this.currentReplay.divergences.push({
          eventIndex: this.currentReplay.currentEventIndex,
          eventType: event.eventType,
          expected: expectedValue,
          actual: actualValue,
          severity: field === 'status' ? 'error' : 'warning'
        });
      }
    }
  }

  /**
   * Check if we should break at current position
   */
  private shouldBreakHere(): boolean {
    if (!this.currentReplay) return false;
    
    const currentEvent = this.eventLog[this.currentReplay.currentEventIndex - 1];
    if (!currentEvent) return false;
    
    for (const bp of this.breakpoints) {
      if (!bp.enabled) continue;
      
      // Check step ID breakpoint
      if (bp.stepId && currentEvent.data?.stepId === bp.stepId) {
        return true;
      }
      
      // Check event type breakpoint
      if (bp.eventType && currentEvent.eventType === bp.eventType) {
        return true;
      }
      
      // Check condition breakpoint
      if (bp.condition && bp.condition(this.currentReplay.currentState, currentEvent)) {
        return true;
      }
    }
    
    return false;
  }

  /**
   * Add breakpoint
   */
  addBreakpoint(breakpoint: Omit<DebugBreakpoint, 'id'>): string {
    const id = `bp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.breakpoints.push({ ...breakpoint, id, enabled: true });
    return id;
  }

  /**
   * Remove breakpoint
   */
  removeBreakpoint(id: string): void {
    this.breakpoints = this.breakpoints.filter(bp => bp.id !== id);
  }

  /**
   * Toggle breakpoint enabled state
   */
  toggleBreakpoint(id: string): void {
    const bp = this.breakpoints.find(b => b.id === id);
    if (bp) bp.enabled = !bp.enabled;
  }

  /**
   * Get current replay state
   */
  getReplayState(): ReplayState | null {
    return this.currentReplay;
  }

  /**
   * Get state at specific event index
   */
  getStateAt(eventIndex: number): WorkflowState | null {
    if (!this.currentReplay) return null;
    
    // Find nearest snapshot
    let snapshotIndex = 0;
    for (const [idx] of this.stateSnapshots) {
      if (idx <= eventIndex && idx > snapshotIndex) {
        snapshotIndex = idx;
      }
    }
    
    let state = JSON.parse(JSON.stringify(this.stateSnapshots.get(snapshotIndex)));
    
    // Replay from snapshot to target
    for (let i = snapshotIndex; i < eventIndex && i < this.eventLog.length; i++) {
      state = this.applyEvent(state, this.eventLog[i]);
    }
    
    return state;
  }

  /**
   * Set playback speed
   */
  setPlaybackSpeed(speed: number): void {
    this.config.playbackSpeed = Math.max(0.1, Math.min(speed, 10));
    if (this.currentReplay) {
      this.currentReplay.replaySpeed = this.config.playbackSpeed;
    }
  }

  /**
   * Subscribe to replay state changes
   */
  subscribe(callback: ReplayCallback): () => void {
    this.callbacks.add(callback);
    return () => this.callbacks.delete(callback);
  }

  /**
   * Notify all subscribers of state change
   */
  private notifyCallbacks(): void {
    if (!this.currentReplay) return;
    
    for (const callback of this.callbacks) {
      callback(this.currentReplay);
    }
  }

  /**
   * Export replay data for external analysis
   */
  exportReplayData(): {
    events: WorkflowEvent[];
    timeline: TimelineEntry[];
    divergences: Divergence[];
  } {
    return {
      events: this.eventLog,
      timeline: this.currentReplay?.timeline || [],
      divergences: this.currentReplay?.divergences || []
    };
  }
}

export const workflowReplayEngine = new WorkflowReplayEngine();
