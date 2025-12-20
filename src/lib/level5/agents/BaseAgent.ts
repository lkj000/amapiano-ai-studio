/**
 * Base Agent Class
 * 
 * Foundation for all specialized music production agents in the
 * Level 5 autonomous system.
 */

import type { 
  AgentRole, 
  AgentState, 
  AgentMemory, 
  AgentAction, 
  AgentMessage,
  LearnedConcept 
} from '../types';

export abstract class BaseAgent {
  protected state: AgentState;
  protected messageQueue: AgentMessage[] = [];
  protected actionHistory: AgentAction[] = [];
  
  constructor(
    protected role: AgentRole,
    protected config: AgentConfig = {}
  ) {
    this.state = {
      id: crypto.randomUUID(),
      role,
      status: 'idle',
      progress: 0,
      memory: this.initializeMemory()
    };
  }

  // ============================================================================
  // ABSTRACT METHODS (Implemented by specialized agents)
  // ============================================================================

  /**
   * Execute the agent's main task
   */
  abstract execute(context: ExecutionContext): Promise<ExecutionResult>;

  /**
   * Evaluate the quality of output
   */
  abstract evaluate(output: unknown): Promise<EvaluationResult>;

  /**
   * Generate improvements based on feedback
   */
  abstract improve(feedback: EvaluationResult): Promise<ImprovementPlan>;

  // ============================================================================
  // MEMORY MANAGEMENT
  // ============================================================================

  private initializeMemory(): AgentMemory {
    return {
      shortTerm: new Map(),
      longTerm: new Map(),
      episodic: [],
      semantic: []
    };
  }

  /**
   * Store short-term memory (current session)
   */
  remember(key: string, value: unknown): void {
    this.state.memory.shortTerm.set(key, value);
  }

  /**
   * Recall from memory (short-term first, then long-term)
   */
  recall(key: string): unknown | undefined {
    return this.state.memory.shortTerm.get(key) ?? 
           this.state.memory.longTerm.get(key);
  }

  /**
   * Commit important learnings to long-term memory
   */
  commitToLongTerm(key: string, value: unknown): void {
    this.state.memory.longTerm.set(key, value);
  }

  /**
   * Store a learned concept
   */
  learnConcept(concept: LearnedConcept): void {
    const existing = this.state.memory.semantic.findIndex(
      c => c.name === concept.name
    );
    
    if (existing >= 0) {
      // Update existing concept
      this.state.memory.semantic[existing] = {
        ...this.state.memory.semantic[existing],
        ...concept,
        lastUpdated: new Date()
      };
    } else {
      this.state.memory.semantic.push(concept);
    }
  }

  /**
   * Retrieve learned concepts by similarity
   */
  recallSimilarConcepts(embedding: number[], topK = 5): LearnedConcept[] {
    return this.state.memory.semantic
      .map(concept => ({
        concept,
        similarity: this.cosineSimilarity(embedding, concept.embedding)
      }))
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, topK)
      .map(({ concept }) => concept);
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0;
    
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    
    const magnitude = Math.sqrt(normA) * Math.sqrt(normB);
    return magnitude > 0 ? dotProduct / magnitude : 0;
  }

  // ============================================================================
  // ACTION TRACKING
  // ============================================================================

  /**
   * Record an action taken by the agent
   */
  protected recordAction(
    actionType: string,
    parameters: Record<string, unknown>,
    result?: unknown
  ): AgentAction {
    const action: AgentAction = {
      id: crypto.randomUUID(),
      agentRole: this.role,
      actionType,
      parameters,
      result,
      timestamp: new Date()
    };
    
    this.actionHistory.push(action);
    this.state.memory.episodic.push(action);
    this.state.lastAction = action;
    
    return action;
  }

  /**
   * Update action with reward signal
   */
  protected updateActionReward(actionId: string, reward: number): void {
    const action = this.actionHistory.find(a => a.id === actionId);
    if (action) {
      action.reward = reward;
    }
  }

  // ============================================================================
  // MESSAGE PASSING
  // ============================================================================

  /**
   * Send message to another agent
   */
  sendMessage(
    to: AgentRole | 'broadcast',
    type: AgentMessage['type'],
    payload: unknown,
    priority = 5
  ): AgentMessage {
    const message: AgentMessage = {
      from: this.role,
      to,
      type,
      payload,
      priority,
      timestamp: new Date()
    };
    
    // In a real system, this would use a message bus
    console.log(`[${this.role}] -> [${to}]: ${type}`);
    
    return message;
  }

  /**
   * Receive and process message
   */
  receiveMessage(message: AgentMessage): void {
    this.messageQueue.push(message);
    this.messageQueue.sort((a, b) => b.priority - a.priority);
  }

  /**
   * Process pending messages
   */
  async processMessages(): Promise<void> {
    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift()!;
      await this.handleMessage(message);
    }
  }

  protected async handleMessage(message: AgentMessage): Promise<void> {
    // Default handler - override in subclasses
    console.log(`[${this.role}] Processing message from ${message.from}`);
  }

  // ============================================================================
  // STATE MANAGEMENT
  // ============================================================================

  getState(): AgentState {
    return { ...this.state };
  }

  protected setStatus(status: AgentState['status']): void {
    this.state.status = status;
  }

  protected setProgress(progress: number): void {
    this.state.progress = Math.max(0, Math.min(100, progress));
  }

  protected setCurrentTask(task: string): void {
    this.state.currentTask = task;
  }

  // ============================================================================
  // LIFECYCLE
  // ============================================================================

  async initialize(): Promise<void> {
    this.setStatus('idle');
    await this.loadPersistedMemory();
  }

  async shutdown(): Promise<void> {
    await this.persistMemory();
    this.setStatus('idle');
  }

  protected async loadPersistedMemory(): Promise<void> {
    // Override to load from database
  }

  protected async persistMemory(): Promise<void> {
    // Override to save to database
  }
}

// ============================================================================
// SUPPORTING TYPES
// ============================================================================

export interface AgentConfig {
  maxActionsPerExecution?: number;
  timeoutMs?: number;
  learningRate?: number;
  explorationRate?: number;
}

export interface ExecutionContext {
  request: {
    prompt: string;
    genre: string;
    region?: string;
    bpm?: number;
    key?: string;
    [key: string]: unknown;
  };
  previousOutputs?: Map<AgentRole, unknown>;
  constraints?: Record<string, unknown>;
}

export interface ExecutionResult {
  success: boolean;
  output: unknown;
  actions: AgentAction[];
  duration: number;
  notes?: string;
}

export interface EvaluationResult {
  score: number;
  passed: boolean;
  components: Record<string, number>;
  issues: string[];
  suggestions: string[];
}

export interface ImprovementPlan {
  actions: {
    type: string;
    parameters: Record<string, unknown>;
    expectedImprovement: number;
  }[];
  estimatedNewScore: number;
}
