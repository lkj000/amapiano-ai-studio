/**
 * Agent Signal Bus
 * Durable inter-agent communication with event persistence
 * Inspired by Temporal workflow patterns
 */

import { supabase } from '@/integrations/supabase/client';

export interface Signal {
  id: string;
  type: string;
  payload: unknown;
  sender: string;
  recipients: string[];
  timestamp: number;
  acknowledged: boolean;
  expiresAt?: number;
}

export interface SignalSubscription {
  signalType: string;
  handler: (signal: Signal) => void | Promise<void>;
}

export class AgentSignalBus {
  private subscriptions: Map<string, Set<SignalSubscription>> = new Map();
  private pendingSignals: Signal[] = [];
  private agentId: string;

  constructor(agentId: string) {
    this.agentId = agentId;
  }

  /**
   * Send a signal to other agents
   */
  async send(
    type: string,
    payload: unknown,
    recipients: string[] = ['*']
  ): Promise<string> {
    const signal: Signal = {
      id: `sig_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      payload,
      sender: this.agentId,
      recipients,
      timestamp: Date.now(),
      acknowledged: false
    };

    // Persist to database for durability
    try {
      const { error } = await supabase
        .from('agent_memory')
        .insert([{
          memory_key: `signal_${signal.id}`,
          memory_type: 'signal',
          memory_data: JSON.parse(JSON.stringify(signal)),
          importance_score: 0.7,
          user_id: '00000000-0000-0000-0000-000000000000' // System signals
        }]);

      if (error) console.warn('Failed to persist signal:', error);
    } catch (e) {
      console.warn('Signal persistence error:', e);
    }

    // Broadcast to local subscribers
    this.broadcast(signal);

    return signal.id;
  }

  /**
   * Subscribe to signals of a specific type
   */
  subscribe(signalType: string, handler: (signal: Signal) => void | Promise<void>): () => void {
    if (!this.subscriptions.has(signalType)) {
      this.subscriptions.set(signalType, new Set());
    }

    const subscription: SignalSubscription = { signalType, handler };
    this.subscriptions.get(signalType)!.add(subscription);

    // Process any pending signals
    this.processPending(signalType);

    return () => {
      this.subscriptions.get(signalType)?.delete(subscription);
    };
  }

  /**
   * Broadcast signal to all matching subscribers
   */
  private broadcast(signal: Signal): void {
    const handlers = this.subscriptions.get(signal.type);
    const wildcardHandlers = this.subscriptions.get('*');

    if (!handlers && !wildcardHandlers) {
      // No handlers, queue for later
      this.pendingSignals.push(signal);
      return;
    }

    const allHandlers = [
      ...(handlers || []),
      ...(wildcardHandlers || [])
    ];

    allHandlers.forEach(async (sub) => {
      try {
        await sub.handler(signal);
      } catch (error) {
        console.error(`Signal handler error for ${signal.type}:`, error);
      }
    });
  }

  /**
   * Process pending signals for a type
   */
  private processPending(signalType: string): void {
    const matching = this.pendingSignals.filter(
      s => s.type === signalType || signalType === '*'
    );

    matching.forEach(signal => {
      const handlers = this.subscriptions.get(signalType);
      handlers?.forEach(sub => sub.handler(signal));
    });

    // Remove processed
    this.pendingSignals = this.pendingSignals.filter(
      s => s.type !== signalType && signalType !== '*'
    );
  }

  /**
   * Acknowledge a signal
   */
  async acknowledge(signalId: string): Promise<void> {
    const signal = this.pendingSignals.find(s => s.id === signalId);
    if (signal) {
      signal.acknowledged = true;
    }

    // Update in database
    await supabase
      .from('agent_memory')
      .update({ 
        memory_data: { acknowledged: true } 
      })
      .eq('memory_key', `signal_${signalId}`);
  }

  /**
   * Get unacknowledged signals for this agent
   */
  async getUnacknowledged(): Promise<Signal[]> {
    const { data, error } = await supabase
      .from('agent_memory')
      .select('memory_data')
      .eq('memory_type', 'signal')
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      console.error('Failed to fetch signals:', error);
      return [];
    }

    return (data || [])
      .map(d => d.memory_data as unknown as Signal)
      .filter(s => 
        !s.acknowledged && 
        (s.recipients.includes(this.agentId) || s.recipients.includes('*'))
      );
  }

  /**
   * Wait for a specific signal
   */
  waitFor(signalType: string, timeout = 30000): Promise<Signal> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        unsubscribe();
        reject(new Error(`Timeout waiting for signal: ${signalType}`));
      }, timeout);

      const unsubscribe = this.subscribe(signalType, (signal) => {
        clearTimeout(timer);
        unsubscribe();
        resolve(signal);
      });
    });
  }
}
