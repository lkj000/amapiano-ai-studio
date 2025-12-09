/**
 * Scheduled Agent Heartbeat
 * Temporal-inspired proactive scheduling system
 * Enables ambient agents that run continuously without user prompts
 */

import { signalBus, SignalType } from './AgentSignalBus';

export interface ScheduleConfig {
  id: string;
  name: string;
  targetAgent: string;
  signalType: SignalType;
  payload?: any;
  intervalMs: number;
  enabled: boolean;
  maxMissedBeats: number;
  priority: 'low' | 'normal' | 'high' | 'critical';
}

export interface ScheduleStatus {
  scheduleId: string;
  lastBeat: number | null;
  nextBeat: number | null;
  missedBeats: number;
  totalBeats: number;
  isRunning: boolean;
  errors: string[];
}

export class ScheduledAgentHeartbeat {
  private static instance: ScheduledAgentHeartbeat;
  private schedules: Map<string, ScheduleConfig> = new Map();
  private timers: Map<string, NodeJS.Timeout> = new Map();
  private status: Map<string, ScheduleStatus> = new Map();
  private isRunning: boolean = false;

  private constructor() {}

  static getInstance(): ScheduledAgentHeartbeat {
    if (!ScheduledAgentHeartbeat.instance) {
      ScheduledAgentHeartbeat.instance = new ScheduledAgentHeartbeat();
    }
    return ScheduledAgentHeartbeat.instance;
  }

  /**
   * Create a new schedule (like Temporal's Schedule)
   */
  createSchedule(config: ScheduleConfig): void {
    if (this.schedules.has(config.id)) {
      console.warn(`[Heartbeat] Schedule ${config.id} already exists, updating...`);
      this.deleteSchedule(config.id);
    }

    this.schedules.set(config.id, config);
    this.status.set(config.id, {
      scheduleId: config.id,
      lastBeat: null,
      nextBeat: config.enabled ? Date.now() + config.intervalMs : null,
      missedBeats: 0,
      totalBeats: 0,
      isRunning: false,
      errors: []
    });

    console.log(`[Heartbeat] Created schedule: ${config.name} (${config.intervalMs}ms)`);

    if (config.enabled && this.isRunning) {
      this.startSchedule(config.id);
    }
  }

  /**
   * Start a specific schedule
   */
  startSchedule(scheduleId: string): void {
    const config = this.schedules.get(scheduleId);
    if (!config) {
      console.error(`[Heartbeat] Schedule not found: ${scheduleId}`);
      return;
    }

    if (this.timers.has(scheduleId)) {
      return; // Already running
    }

    const timer = setInterval(() => this.beat(scheduleId), config.intervalMs);
    this.timers.set(scheduleId, timer);

    const status = this.status.get(scheduleId);
    if (status) {
      status.isRunning = true;
      status.nextBeat = Date.now() + config.intervalMs;
    }

    console.log(`[Heartbeat] Started schedule: ${config.name}`);
  }

  /**
   * Stop a specific schedule
   */
  stopSchedule(scheduleId: string): void {
    const timer = this.timers.get(scheduleId);
    if (timer) {
      clearInterval(timer);
      this.timers.delete(scheduleId);
    }

    const status = this.status.get(scheduleId);
    if (status) {
      status.isRunning = false;
      status.nextBeat = null;
    }

    console.log(`[Heartbeat] Stopped schedule: ${scheduleId}`);
  }

  /**
   * Delete a schedule
   */
  deleteSchedule(scheduleId: string): void {
    this.stopSchedule(scheduleId);
    this.schedules.delete(scheduleId);
    this.status.delete(scheduleId);
    console.log(`[Heartbeat] Deleted schedule: ${scheduleId}`);
  }

  /**
   * Start all enabled schedules
   */
  startAll(): void {
    this.isRunning = true;
    
    for (const [id, config] of this.schedules) {
      if (config.enabled) {
        this.startSchedule(id);
      }
    }

    console.log(`[Heartbeat] Started ${this.timers.size} schedules`);
  }

  /**
   * Stop all schedules
   */
  stopAll(): void {
    this.isRunning = false;

    for (const scheduleId of this.timers.keys()) {
      this.stopSchedule(scheduleId);
    }

    console.log('[Heartbeat] Stopped all schedules');
  }

  /**
   * Execute a heartbeat
   */
  private async beat(scheduleId: string): Promise<void> {
    const config = this.schedules.get(scheduleId);
    const status = this.status.get(scheduleId);
    
    if (!config || !status) return;

    const beatStartTime = Date.now();

    try {
      // Send nudge signal to target agent
      await signalBus.signal(
        'heartbeat',
        config.targetAgent,
        config.signalType,
        {
          ...config.payload,
          scheduleId: config.id,
          scheduleName: config.name,
          beatNumber: status.totalBeats + 1,
          timestamp: beatStartTime
        },
        config.priority
      );

      status.lastBeat = beatStartTime;
      status.nextBeat = beatStartTime + config.intervalMs;
      status.totalBeats++;
      status.missedBeats = 0;

      console.log(`[Heartbeat] Beat ${status.totalBeats} for ${config.name}`);

    } catch (error: any) {
      status.missedBeats++;
      status.errors.push(`${new Date().toISOString()}: ${error.message}`);
      
      // Keep only last 10 errors
      if (status.errors.length > 10) {
        status.errors = status.errors.slice(-10);
      }

      console.error(`[Heartbeat] Beat failed for ${config.name}:`, error);

      // Stop if too many missed beats
      if (status.missedBeats >= config.maxMissedBeats) {
        console.error(`[Heartbeat] Max missed beats reached for ${config.name}, stopping`);
        this.stopSchedule(scheduleId);
      }
    }
  }

  /**
   * Get status of all schedules
   */
  getAllStatus(): ScheduleStatus[] {
    return Array.from(this.status.values());
  }

  /**
   * Get status of a specific schedule
   */
  getStatus(scheduleId: string): ScheduleStatus | undefined {
    return this.status.get(scheduleId);
  }

  /**
   * Update schedule config
   */
  updateSchedule(scheduleId: string, updates: Partial<ScheduleConfig>): void {
    const config = this.schedules.get(scheduleId);
    if (!config) return;

    const wasRunning = this.timers.has(scheduleId);
    
    if (wasRunning) {
      this.stopSchedule(scheduleId);
    }

    Object.assign(config, updates);
    this.schedules.set(scheduleId, config);

    if (wasRunning && config.enabled) {
      this.startSchedule(scheduleId);
    }
  }

  /**
   * Trigger immediate beat (manual nudge)
   */
  async triggerNow(scheduleId: string): Promise<void> {
    await this.beat(scheduleId);
  }

  /**
   * Get all schedule configs
   */
  getSchedules(): ScheduleConfig[] {
    return Array.from(this.schedules.values());
  }

  /**
   * Check if running
   */
  isActive(): boolean {
    return this.isRunning;
  }

  /**
   * Reset all state
   */
  reset(): void {
    this.stopAll();
    this.schedules.clear();
    this.status.clear();
  }
}

export const heartbeat = ScheduledAgentHeartbeat.getInstance();

// Pre-defined schedule templates for AURA-X
export const AURA_X_SCHEDULES: Omit<ScheduleConfig, 'id'>[] = [
  {
    name: 'Execution Nudge',
    targetAgent: 'execution-agent',
    signalType: 'nudge',
    payload: { action: 'analyze_and_act' },
    intervalMs: 30000, // 30 seconds
    enabled: true,
    maxMissedBeats: 3,
    priority: 'normal'
  },
  {
    name: 'Judge Evaluation',
    targetAgent: 'judge-agent',
    signalType: 'nudge',
    payload: { action: 'evaluate_performance' },
    intervalMs: 300000, // 5 minutes
    enabled: true,
    maxMissedBeats: 2,
    priority: 'high'
  },
  {
    name: 'Market Analysis',
    targetAgent: 'analyzer-agent',
    signalType: 'nudge',
    payload: { action: 'analyze_trends' },
    intervalMs: 60000, // 1 minute
    enabled: true,
    maxMissedBeats: 5,
    priority: 'normal'
  },
  {
    name: 'Memory Consolidation',
    targetAgent: 'broker-agent',
    signalType: 'nudge',
    payload: { action: 'consolidate_memory' },
    intervalMs: 600000, // 10 minutes
    enabled: true,
    maxMissedBeats: 3,
    priority: 'low'
  }
];
