/**
 * Agent Signal Bus
 * Temporal-inspired durable inter-agent communication
 * Implements Signals & Queries pattern for reliable message passing
 */

import { supabase } from '@/integrations/supabase/client';

export type SignalType = 
  | 'nudge'           // Wake up and process
  | 'update_prompt'   // Update system prompt
  | 'update_strategy' // Update execution strategy
  | 'pause'           // Pause execution
  | 'resume'          // Resume execution
  | 'terminate'       // Graceful shutdown
  | 'data'            // Generic data transfer
  | 'evaluation'      // Performance evaluation result
  | 'refinement';     // Strategy refinement

export interface AgentSignal {
  id: string;
  type: SignalType;
  source: string;
  target: string;
  payload: any;
  timestamp: number;
  acknowledged: boolean;
  priority: 'low' | 'normal' | 'high' | 'critical';
}

export interface AgentQuery {
  id: string;
  source: string;
  target: string;
  query: string;
  params?: Record<string, any>;
  timestamp: number;
}

export interface QueryResponse {
  queryId: string;
  success: boolean;
  data: any;
  error?: string;
  timestamp: number;
}

type SignalHandler = (signal: AgentSignal) => Promise<void>;
type QueryHandler = (query: AgentQuery) => Promise<QueryResponse>;

export class AgentSignalBus {
  private static instance: AgentSignalBus;
  private signalQueue: AgentSignal[] = [];
  private signalHandlers: Map<string, Map<SignalType, SignalHandler[]>> = new Map();
  private queryHandlers: Map<string, Map<string, QueryHandler>> = new Map();
  private signalHistory: AgentSignal[] = [];
  private isProcessing: boolean = false;
  private maxHistorySize: number = 1000;
  // High-priority signals are persisted to agent_memory for durability across reloads
  private persistedTypes: Set<SignalType> = new Set(['update_strategy', 'evaluation', 'refinement', 'terminate']);

  private constructor() {}

  /**
   * Persist a signal to the agent_memory table for durability.
   * Only high-priority or significant signal types are written.
   */
  private async persistSignal(signal: AgentSignal): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase.from('agent_memory').insert({
        user_id: user.id,
        memory_type: 'agent_signal',
        content: `Signal ${signal.type} from ${signal.source} to ${signal.target}`,
        metadata: {
          signal_id: signal.id,
          type: signal.type,
          source: signal.source,
          target: signal.target,
          priority: signal.priority,
          payload: signal.payload,
          timestamp: signal.timestamp,
        },
        created_at: new Date(signal.timestamp).toISOString(),
      });
    } catch {
      // Persistence is best-effort; do not break the signal flow
    }
  }

  static getInstance(): AgentSignalBus {
    if (!AgentSignalBus.instance) {
      AgentSignalBus.instance = new AgentSignalBus();
    }
    return AgentSignalBus.instance;
  }

  /**
   * Register an agent to receive signals
   */
  registerAgent(agentId: string): void {
    if (!this.signalHandlers.has(agentId)) {
      this.signalHandlers.set(agentId, new Map());
      this.queryHandlers.set(agentId, new Map());
      console.log(`[SignalBus] Registered agent: ${agentId}`);
    }
  }

  /**
   * Unregister an agent
   */
  unregisterAgent(agentId: string): void {
    this.signalHandlers.delete(agentId);
    this.queryHandlers.delete(agentId);
    console.log(`[SignalBus] Unregistered agent: ${agentId}`);
  }

  /**
   * Subscribe to a signal type
   */
  onSignal(agentId: string, signalType: SignalType, handler: SignalHandler): () => void {
    const agentHandlers = this.signalHandlers.get(agentId);
    if (!agentHandlers) {
      this.registerAgent(agentId);
      return this.onSignal(agentId, signalType, handler);
    }

    const handlers = agentHandlers.get(signalType) || [];
    handlers.push(handler);
    agentHandlers.set(signalType, handlers);

    // Return unsubscribe function
    return () => {
      const currentHandlers = agentHandlers.get(signalType) || [];
      const index = currentHandlers.indexOf(handler);
      if (index > -1) {
        currentHandlers.splice(index, 1);
      }
    };
  }

  /**
   * Register a query handler
   */
  onQuery(agentId: string, queryName: string, handler: QueryHandler): () => void {
    const agentQueries = this.queryHandlers.get(agentId);
    if (!agentQueries) {
      this.registerAgent(agentId);
      return this.onQuery(agentId, queryName, handler);
    }

    agentQueries.set(queryName, handler);

    return () => {
      agentQueries.delete(queryName);
    };
  }

  /**
   * Send a signal to an agent (async, durable)
   */
  async signal(
    source: string,
    target: string,
    type: SignalType,
    payload: any = {},
    priority: AgentSignal['priority'] = 'normal'
  ): Promise<string> {
    const signal: AgentSignal = {
      id: `sig_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      source,
      target,
      payload,
      timestamp: Date.now(),
      acknowledged: false,
      priority
    };

    // Add to queue with priority ordering
    this.enqueueSignal(signal);
    
    // Store in history
    this.signalHistory.push(signal);
    if (this.signalHistory.length > this.maxHistorySize) {
      this.signalHistory = this.signalHistory.slice(-this.maxHistorySize);
    }

    console.log(`[SignalBus] Signal queued: ${type} from ${source} to ${target}`);

    // Persist durable signal types to agent_memory for cross-reload durability
    if (this.persistedTypes.has(type) || priority === 'critical') {
      this.persistSignal(signal); // fire-and-forget
    }

    // Process queue
    this.processQueue();

    return signal.id;
  }

  /**
   * Broadcast signal to all agents
   */
  async broadcast(
    source: string,
    type: SignalType,
    payload: any = {},
    priority: AgentSignal['priority'] = 'normal'
  ): Promise<string[]> {
    const signalIds: string[] = [];
    
    for (const agentId of this.signalHandlers.keys()) {
      if (agentId !== source) {
        const id = await this.signal(source, agentId, type, payload, priority);
        signalIds.push(id);
      }
    }

    return signalIds;
  }

  /**
   * Query an agent for data (sync-like, with timeout)
   */
  async query(
    source: string,
    target: string,
    queryName: string,
    params?: Record<string, any>,
    timeout: number = 5000
  ): Promise<QueryResponse> {
    const query: AgentQuery = {
      id: `qry_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      source,
      target,
      query: queryName,
      params,
      timestamp: Date.now()
    };

    const agentQueries = this.queryHandlers.get(target);
    const handler = agentQueries?.get(queryName);

    if (!handler) {
      return {
        queryId: query.id,
        success: false,
        data: null,
        error: `No handler for query '${queryName}' on agent '${target}'`,
        timestamp: Date.now()
      };
    }

    try {
      const response = await Promise.race([
        handler(query),
        new Promise<QueryResponse>((_, reject) =>
          setTimeout(() => reject(new Error('Query timeout')), timeout)
        )
      ]);

      console.log(`[SignalBus] Query completed: ${queryName} to ${target}`);
      return response;
    } catch (error: any) {
      return {
        queryId: query.id,
        success: false,
        data: null,
        error: error.message,
        timestamp: Date.now()
      };
    }
  }

  /**
   * Get signal history for an agent
   */
  getSignalHistory(agentId: string, limit: number = 50): AgentSignal[] {
    return this.signalHistory
      .filter(s => s.target === agentId || s.source === agentId)
      .slice(-limit);
  }

  /**
   * Get pending signals for an agent
   */
  getPendingSignals(agentId: string): AgentSignal[] {
    return this.signalQueue.filter(s => s.target === agentId && !s.acknowledged);
  }

  private enqueueSignal(signal: AgentSignal): void {
    // Insert by priority
    const priorityOrder = { critical: 0, high: 1, normal: 2, low: 3 };
    const insertIndex = this.signalQueue.findIndex(
      s => priorityOrder[s.priority] > priorityOrder[signal.priority]
    );

    if (insertIndex === -1) {
      this.signalQueue.push(signal);
    } else {
      this.signalQueue.splice(insertIndex, 0, signal);
    }
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessing) return;
    this.isProcessing = true;

    try {
      while (this.signalQueue.length > 0) {
        const signal = this.signalQueue.shift();
        if (!signal) continue;

        await this.deliverSignal(signal);
      }
    } finally {
      this.isProcessing = false;
    }
  }

  private async deliverSignal(signal: AgentSignal): Promise<void> {
    const agentHandlers = this.signalHandlers.get(signal.target);
    if (!agentHandlers) {
      console.warn(`[SignalBus] No handlers for agent: ${signal.target}`);
      return;
    }

    const handlers = agentHandlers.get(signal.type) || [];
    
    for (const handler of handlers) {
      try {
        await handler(signal);
        signal.acknowledged = true;
      } catch (error) {
        console.error(`[SignalBus] Handler error for ${signal.type}:`, error);
      }
    }
  }

  /**
   * Get registered agents
   */
  getRegisteredAgents(): string[] {
    return Array.from(this.signalHandlers.keys());
  }

  /**
   * Clear all state (for testing)
   */
  reset(): void {
    this.signalQueue = [];
    this.signalHandlers.clear();
    this.queryHandlers.clear();
    this.signalHistory = [];
    this.isProcessing = false;
  }
}

export const signalBus = AgentSignalBus.getInstance();
