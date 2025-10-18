/**
 * Event Processing Pipeline - Inspired by VAST DataEngine
 * Real-time event orchestration for audio, MIDI, and collaboration
 */

export type EventPriority = 'critical' | 'high' | 'normal' | 'low';

export interface ProcessableEvent {
  id: string;
  type: string;
  priority: EventPriority;
  timestamp: number;
  payload: any;
  source: string;
}

export interface EventHandler {
  pattern: string | RegExp;
  priority: EventPriority;
  handler: (event: ProcessableEvent) => Promise<void> | void;
}

export interface ProcessingStats {
  totalProcessed: number;
  failedEvents: number;
  averageLatency: number;
  eventsByType: Record<string, number>;
}

export class EventProcessor {
  private queue: ProcessableEvent[] = [];
  private handlers: EventHandler[] = [];
  private isProcessing = false;
  private stats: ProcessingStats = {
    totalProcessed: 0,
    failedEvents: 0,
    averageLatency: 0,
    eventsByType: {},
  };
  private latencyBuffer: number[] = [];

  /**
   * Register an event handler
   */
  on(pattern: string | RegExp, priority: EventPriority, handler: (event: ProcessableEvent) => Promise<void> | void) {
    this.handlers.push({ pattern, priority, handler });
    
    // Sort handlers by priority
    this.handlers.sort((a, b) => {
      const priorityOrder = { critical: 4, high: 3, normal: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  /**
   * Dispatch an event to the processing pipeline
   */
  dispatch(event: Omit<ProcessableEvent, 'id' | 'timestamp'>) {
    const fullEvent: ProcessableEvent = {
      ...event,
      id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
    };

    // Insert based on priority
    const priorityOrder = { critical: 4, high: 3, normal: 2, low: 1 };
    const insertIndex = this.queue.findIndex(
      e => priorityOrder[e.priority] < priorityOrder[fullEvent.priority]
    );

    if (insertIndex === -1) {
      this.queue.push(fullEvent);
    } else {
      this.queue.splice(insertIndex, 0, fullEvent);
    }

    // Track event type
    this.stats.eventsByType[event.type] = (this.stats.eventsByType[event.type] || 0) + 1;

    // Start processing if not already running
    if (!this.isProcessing) {
      this.process();
    }
  }

  /**
   * Process events from the queue
   */
  private async process() {
    if (this.isProcessing || this.queue.length === 0) return;

    this.isProcessing = true;

    while (this.queue.length > 0) {
      const event = this.queue.shift()!;
      const startTime = Date.now();

      try {
        // Find matching handlers
        const matchingHandlers = this.handlers.filter(h => {
          if (typeof h.pattern === 'string') {
            return event.type === h.pattern;
          }
          return h.pattern.test(event.type);
        });

        // Execute handlers in priority order
        for (const { handler } of matchingHandlers) {
          await handler(event);
        }

        // Update stats
        const latency = Date.now() - startTime;
        this.latencyBuffer.push(latency);
        if (this.latencyBuffer.length > 100) {
          this.latencyBuffer.shift();
        }

        this.stats.totalProcessed++;
        this.stats.averageLatency = 
          this.latencyBuffer.reduce((a, b) => a + b, 0) / this.latencyBuffer.length;

      } catch (error) {
        console.error('[EventProcessor] Handler error:', error, event);
        this.stats.failedEvents++;
      }
    }

    this.isProcessing = false;
  }

  /**
   * Get processing statistics
   */
  getStats(): ProcessingStats {
    return { ...this.stats };
  }

  /**
   * Clear all queued events
   */
  clear() {
    this.queue = [];
  }

  /**
   * Get queue length
   */
  queueLength(): number {
    return this.queue.length;
  }

  /**
   * Remove all handlers
   */
  clearHandlers() {
    this.handlers = [];
  }
}

// Global event processor instance
let globalProcessor: EventProcessor | null = null;

export function getEventProcessor(): EventProcessor {
  if (!globalProcessor) {
    globalProcessor = new EventProcessor();
  }
  return globalProcessor;
}

/**
 * Pre-configured event types for Aura-X
 */
export const EventTypes = {
  // Audio events
  AUDIO_INPUT: 'audio.input',
  AUDIO_OUTPUT: 'audio.output',
  AUDIO_PROCESSED: 'audio.processed',
  
  // MIDI events
  MIDI_NOTE_ON: 'midi.note.on',
  MIDI_NOTE_OFF: 'midi.note.off',
  MIDI_CC: 'midi.cc',
  
  // Collaboration events
  COLLAB_JOIN: 'collab.join',
  COLLAB_LEAVE: 'collab.leave',
  COLLAB_UPDATE: 'collab.update',
  
  // Plugin events
  PLUGIN_LOADED: 'plugin.loaded',
  PLUGIN_PARAM_CHANGE: 'plugin.param.change',
  PLUGIN_ERROR: 'plugin.error',
  
  // AI events
  AI_GENERATION_START: 'ai.generation.start',
  AI_GENERATION_COMPLETE: 'ai.generation.complete',
  AI_ANALYSIS_COMPLETE: 'ai.analysis.complete',
  
  // System events
  SYSTEM_OPTIMIZE: 'system.optimize',
  SYSTEM_ERROR: 'system.error',
  SYSTEM_WARNING: 'system.warning',
} as const;
