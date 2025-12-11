/**
 * Workflow Replay Engine
 * Debug and reproduce agent workflows by replaying events
 */

import { DurableAgentState, StateEvent, WorkflowState } from './DurableAgentState';

export interface ReplayOptions {
  speed: number; // 1 = real-time, 2 = 2x speed, etc.
  pauseAtStep?: number;
  onEvent?: (event: StateEvent, state: WorkflowState) => void | Promise<void>;
  onComplete?: (finalState: WorkflowState) => void;
}

export interface ReplayResult {
  eventsReplayed: number;
  finalState: WorkflowState;
  duration: number;
  success: boolean;
}

export class WorkflowReplayEngine {
  private durableState: DurableAgentState;
  private isPaused = false;
  private currentReplay: Promise<ReplayResult> | null = null;

  constructor(workflowId: string, userId?: string) {
    this.durableState = new DurableAgentState(workflowId, userId);
  }

  /**
   * Load and prepare workflow for replay
   */
  async load(): Promise<WorkflowState> {
    return await this.durableState.initialize();
  }

  /**
   * Replay all events from a workflow
   */
  async replay(options: ReplayOptions = { speed: 1 }): Promise<ReplayResult> {
    const startTime = Date.now();
    const events = this.durableState.getEvents();
    let eventsReplayed = 0;

    this.isPaused = false;

    for (const event of events) {
      // Check for pause
      if (this.isPaused) {
        break;
      }

      // Check for step pause
      if (options.pauseAtStep !== undefined) {
        const stepEvent = event.payload as { step?: number };
        if (stepEvent.step === options.pauseAtStep) {
          this.isPaused = true;
          break;
        }
      }

      // Simulate delay based on original timing
      if (eventsReplayed > 0 && options.speed > 0) {
        const prevEvent = events[eventsReplayed - 1];
        const delay = (event.timestamp - prevEvent.timestamp) / options.speed;
        await new Promise(resolve => setTimeout(resolve, Math.min(delay, 5000)));
      }

      // Apply event
      await this.durableState.recordEvent(event.type, event.payload);
      eventsReplayed++;

      // Callback
      if (options.onEvent) {
        await options.onEvent(event, this.durableState.getState());
      }
    }

    const finalState = this.durableState.getState();

    if (options.onComplete) {
      options.onComplete(finalState);
    }

    return {
      eventsReplayed,
      finalState,
      duration: Date.now() - startTime,
      success: !this.isPaused
    };
  }

  /**
   * Replay from a specific checkpoint
   */
  async replayFromCheckpoint(
    checkpointId: string,
    options: ReplayOptions = { speed: 1 }
  ): Promise<ReplayResult> {
    const checkpoints = this.durableState.getCheckpoints();
    const checkpoint = checkpoints.find(c => c.id === checkpointId);

    if (!checkpoint) {
      throw new Error(`Checkpoint not found: ${checkpointId}`);
    }

    // Recover to checkpoint
    await this.durableState.recoverFromCheckpoint(checkpointId);

    // Find events after checkpoint
    const events = this.durableState.getEvents();
    const checkpointSequence = events.findIndex(e => 
      e.type === 'checkpoint' && (e.payload as { id: string }).id === checkpointId
    );

    // Replay remaining events
    const eventsToReplay = events.slice(checkpointSequence + 1);
    let eventsReplayed = 0;
    const startTime = Date.now();

    for (const event of eventsToReplay) {
      if (this.isPaused) break;

      if (eventsReplayed > 0 && options.speed > 0) {
        const delay = 100 / options.speed;
        await new Promise(resolve => setTimeout(resolve, delay));
      }

      await this.durableState.recordEvent(event.type, event.payload);
      eventsReplayed++;

      if (options.onEvent) {
        await options.onEvent(event, this.durableState.getState());
      }
    }

    return {
      eventsReplayed,
      finalState: this.durableState.getState(),
      duration: Date.now() - startTime,
      success: !this.isPaused
    };
  }

  /**
   * Pause current replay
   */
  pause(): void {
    this.isPaused = true;
  }

  /**
   * Resume paused replay
   */
  async resume(options?: ReplayOptions): Promise<ReplayResult | null> {
    if (!this.isPaused) return null;

    this.isPaused = false;
    return this.replay(options);
  }

  /**
   * Step through events one at a time
   */
  async stepForward(): Promise<StateEvent | null> {
    const events = this.durableState.getEvents();
    const currentStep = this.durableState.getCurrentStep();

    if (currentStep >= events.length) {
      return null;
    }

    const event = events[currentStep];
    await this.durableState.recordEvent(event.type, event.payload);
    return event;
  }

  /**
   * Get timeline of events for visualization
   */
  getTimeline(): Array<{
    event: StateEvent;
    duration: number;
    index: number;
  }> {
    const events = this.durableState.getEvents();
    
    return events.map((event, index) => {
      const prevTimestamp = index > 0 ? events[index - 1].timestamp : event.timestamp;
      return {
        event,
        duration: event.timestamp - prevTimestamp,
        index
      };
    });
  }

  /**
   * Export workflow for sharing/debugging
   */
  exportWorkflow(): string {
    const state = this.durableState.getState();
    return JSON.stringify(state, null, 2);
  }

  /**
   * Import workflow from export
   */
  async importWorkflow(json: string): Promise<WorkflowState> {
    const state = JSON.parse(json) as WorkflowState;
    
    // Replay all events to reconstruct
    for (const event of state.events) {
      await this.durableState.recordEvent(event.type, event.payload);
    }

    return this.durableState.getState();
  }

  getState(): WorkflowState {
    return this.durableState.getState();
  }
}
