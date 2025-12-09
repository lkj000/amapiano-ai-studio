/**
 * Ambient Agent Orchestrator
 * Temporal-inspired orchestration layer for AURA-X
 * Coordinates ambient agents with durable execution
 */

import { signalBus, SignalType, AgentSignal } from './AgentSignalBus';
import { heartbeat, AURA_X_SCHEDULES, ScheduleConfig } from './ScheduledAgentHeartbeat';
import { judgeAgent } from './JudgeAgent';
import { durableState, WorkflowState } from './DurableAgentState';
import { AutonomousAgent, AgentConfig } from './AutonomousAgent';

export interface AmbientAgentConfig {
  id: string;
  name: string;
  type: 'broker' | 'execution' | 'judge' | 'analyzer' | 'custom';
  systemPrompt: string;
  capabilities: string[];
  scheduleConfig?: Partial<ScheduleConfig>;
}

export interface OrchestratorStatus {
  isRunning: boolean;
  registeredAgents: string[];
  activeWorkflows: number;
  scheduleStatus: any[];
  judgeStatus: boolean;
  lastEvaluation?: any;
}

export class AmbientAgentOrchestrator {
  private static instance: AmbientAgentOrchestrator;
  private agents: Map<string, AutonomousAgent> = new Map();
  private agentConfigs: Map<string, AmbientAgentConfig> = new Map();
  private isRunning: boolean = false;
  private unsubscribers: (() => void)[] = [];

  private constructor() {}

  static getInstance(): AmbientAgentOrchestrator {
    if (!AmbientAgentOrchestrator.instance) {
      AmbientAgentOrchestrator.instance = new AmbientAgentOrchestrator();
    }
    return AmbientAgentOrchestrator.instance;
  }

  /**
   * Initialize the orchestrator with ambient agents
   */
  async initialize(): Promise<void> {
    console.log('[Orchestrator] Initializing ambient agent orchestrator...');

    // Initialize default AURA-X agents
    await this.initializeDefaultAgents();

    // Initialize judge agent
    await judgeAgent.initialize();

    // Register schedules
    this.initializeSchedules();

    // Set up broker agent signal handlers
    this.setupBrokerAgent();

    this.isRunning = true;
    console.log('[Orchestrator] Initialization complete');
  }

  /**
   * Start ambient execution (heartbeats begin)
   */
  start(): void {
    if (!this.isRunning) {
      console.error('[Orchestrator] Must initialize before starting');
      return;
    }

    heartbeat.startAll();
    console.log('[Orchestrator] Ambient execution started');
  }

  /**
   * Stop ambient execution
   */
  stop(): void {
    heartbeat.stopAll();
    console.log('[Orchestrator] Ambient execution stopped');
  }

  /**
   * Shutdown everything
   */
  async shutdown(): Promise<void> {
    this.stop();
    judgeAgent.shutdown();
    
    this.unsubscribers.forEach(unsub => unsub());
    this.unsubscribers = [];

    for (const agentId of this.agents.keys()) {
      signalBus.unregisterAgent(agentId);
    }

    signalBus.reset();
    heartbeat.reset();
    durableState.reset();

    this.agents.clear();
    this.agentConfigs.clear();
    this.isRunning = false;

    console.log('[Orchestrator] Shutdown complete');
  }

  /**
   * Register an ambient agent
   */
  async registerAgent(config: AmbientAgentConfig): Promise<void> {
    // Create the autonomous agent
    const agentConfig: Partial<AgentConfig> = {
      maxIterations: 10,
      reflectionEnabled: true,
      autonomousMode: true,
      learningEnabled: true
    };

    const agent = new AutonomousAgent(agentConfig);
    await agent.waitForTools();

    this.agents.set(config.id, agent);
    this.agentConfigs.set(config.id, config);

    // Register with signal bus
    signalBus.registerAgent(config.id);

    // Set up signal handlers
    this.setupAgentSignalHandlers(config.id, agent);

    // Create schedule if configured
    if (config.scheduleConfig) {
      heartbeat.createSchedule({
        id: `schedule_${config.id}`,
        name: `${config.name} Nudge`,
        targetAgent: config.id,
        signalType: 'nudge',
        intervalMs: config.scheduleConfig.intervalMs || 60000,
        enabled: config.scheduleConfig.enabled ?? true,
        maxMissedBeats: config.scheduleConfig.maxMissedBeats || 3,
        priority: config.scheduleConfig.priority || 'normal'
      });
    }

    console.log(`[Orchestrator] Registered agent: ${config.name} (${config.id})`);
  }

  /**
   * Execute a goal through the broker agent
   */
  async executeGoal(goal: string, context?: Record<string, any>): Promise<any> {
    console.log(`[Orchestrator] Executing goal: ${goal}`);

    // Create durable workflow
    const workflow = await durableState.createWorkflow(
      'broker-agent',
      goal,
      ['decompose', 'plan', 'execute', 'evaluate', 'refine'],
      context || {}
    );

    // Get or create broker agent
    let broker = this.agents.get('broker-agent');
    if (!broker) {
      broker = new AutonomousAgent();
      await broker.waitForTools();
      this.agents.set('broker-agent', broker);
    }

    try {
      // Start workflow
      await durableState.startStep(workflow.workflowId, 'step_0', { goal });

      // Execute through autonomous agent
      const result = await broker.execute(goal);

      // Complete workflow
      await durableState.completeStep(workflow.workflowId, 'step_0', result);

      // Notify judge agent of execution
      await signalBus.signal('broker-agent', 'judge-agent', 'data', {
        type: 'execution_result',
        goal,
        result,
        workflowId: workflow.workflowId
      });

      return result;

    } catch (error: any) {
      await durableState.failStep(workflow.workflowId, 'step_0', error.message);
      throw error;
    }
  }

  /**
   * Send signal to an agent
   */
  async signalAgent(
    targetAgent: string,
    signalType: SignalType,
    payload: any
  ): Promise<string> {
    return signalBus.signal('orchestrator', targetAgent, signalType, payload);
  }

  /**
   * Query an agent
   */
  async queryAgent(targetAgent: string, queryName: string, params?: any): Promise<any> {
    const response = await signalBus.query('orchestrator', targetAgent, queryName, params);
    return response.data;
  }

  /**
   * Get orchestrator status
   */
  getStatus(): OrchestratorStatus {
    return {
      isRunning: this.isRunning,
      registeredAgents: Array.from(this.agents.keys()),
      activeWorkflows: Array.from(durableState['localCache'].values())
        .filter((w: WorkflowState) => w.status === 'running').length,
      scheduleStatus: heartbeat.getAllStatus(),
      judgeStatus: judgeAgent.isActive(),
      lastEvaluation: judgeAgent.getLatestEvaluation()
    };
  }

  /**
   * Get agent by ID
   */
  getAgent(agentId: string): AutonomousAgent | undefined {
    return this.agents.get(agentId);
  }

  /**
   * Initialize default AURA-X agents
   */
  private async initializeDefaultAgents(): Promise<void> {
    const defaultAgents: AmbientAgentConfig[] = [
      {
        id: 'broker-agent',
        name: 'Broker Agent',
        type: 'broker',
        systemPrompt: 'You are the broker agent responsible for managing user intents and orchestrating workflows.',
        capabilities: ['goal_decomposition', 'workflow_orchestration', 'user_interaction']
      },
      {
        id: 'execution-agent',
        name: 'Execution Agent',
        type: 'execution',
        systemPrompt: 'You are the execution agent responsible for making decisions and executing tasks.',
        capabilities: ['task_execution', 'tool_usage', 'decision_making'],
        scheduleConfig: {
          intervalMs: 30000,
          enabled: true,
          priority: 'normal'
        }
      },
      {
        id: 'analyzer-agent',
        name: 'Analyzer Agent',
        type: 'analyzer',
        systemPrompt: 'You are the analyzer agent responsible for analyzing data and providing insights.',
        capabilities: ['data_analysis', 'trend_detection', 'quality_assessment'],
        scheduleConfig: {
          intervalMs: 60000,
          enabled: true,
          priority: 'normal'
        }
      }
    ];

    for (const config of defaultAgents) {
      await this.registerAgent(config);
    }
  }

  /**
   * Initialize schedules from templates
   */
  private initializeSchedules(): void {
    AURA_X_SCHEDULES.forEach((template, index) => {
      heartbeat.createSchedule({
        id: `aura_schedule_${index}`,
        ...template
      });
    });
  }

  /**
   * Set up broker agent as entry point
   */
  private setupBrokerAgent(): void {
    const brokerId = 'broker-agent';

    // Handle nudge signals
    const unsubNudge = signalBus.onSignal(brokerId, 'nudge', async (signal) => {
      console.log(`[Broker] Received nudge: ${JSON.stringify(signal.payload)}`);
      
      if (signal.payload?.action === 'consolidate_memory') {
        // Periodically consolidate learnings
        await this.consolidateMemory();
      }
    });
    this.unsubscribers.push(unsubNudge);

    // Handle refinement signals from judge
    const unsubRefinement = signalBus.onSignal(brokerId, 'refinement', async (signal) => {
      console.log(`[Broker] Received refinement from judge:`, signal.payload);
      // Apply refinements to execution strategy
    });
    this.unsubscribers.push(unsubRefinement);

    // Register queries
    const unsubQuery = signalBus.onQuery(brokerId, 'get_status', async (query) => {
      return {
        queryId: query.id,
        success: true,
        data: this.getStatus(),
        timestamp: Date.now()
      };
    });
    this.unsubscribers.push(unsubQuery);
  }

  /**
   * Set up signal handlers for an agent
   */
  private setupAgentSignalHandlers(agentId: string, agent: AutonomousAgent): void {
    // Handle nudge signals
    const unsubNudge = signalBus.onSignal(agentId, 'nudge', async (signal) => {
      console.log(`[${agentId}] Nudge received:`, signal.payload);
      
      // Execute based on action type
      const action = signal.payload?.action;
      if (action === 'analyze_and_act') {
        // Trigger analysis and action cycle
        await this.handleAnalyzeAndAct(agentId, agent);
      } else if (action === 'evaluate_performance') {
        // Handled by judge agent
      }
    });
    this.unsubscribers.push(unsubNudge);

    // Handle prompt updates from judge
    const unsubPrompt = signalBus.onSignal(agentId, 'update_prompt', async (signal) => {
      console.log(`[${agentId}] Prompt update received`);
      // Store new prompt for future executions
      const config = this.agentConfigs.get(agentId);
      if (config) {
        config.systemPrompt = signal.payload?.newPrompt || config.systemPrompt;
      }
    });
    this.unsubscribers.push(unsubPrompt);

    // Handle pause/resume
    const unsubPause = signalBus.onSignal(agentId, 'pause', async () => {
      heartbeat.stopSchedule(`schedule_${agentId}`);
    });
    this.unsubscribers.push(unsubPause);

    const unsubResume = signalBus.onSignal(agentId, 'resume', async () => {
      heartbeat.startSchedule(`schedule_${agentId}`);
    });
    this.unsubscribers.push(unsubResume);

    // Register status query
    const unsubQuery = signalBus.onQuery(agentId, 'get_status', async (query) => {
      return {
        queryId: query.id,
        success: true,
        data: {
          agentId,
          status: agent.getStatus(),
          memory: agent.getMemory(),
          successRate: agent.getSuccessRate()
        },
        timestamp: Date.now()
      };
    });
    this.unsubscribers.push(unsubQuery);
  }

  /**
   * Handle analyze and act cycle
   */
  private async handleAnalyzeAndAct(agentId: string, agent: AutonomousAgent): Promise<void> {
    const config = this.agentConfigs.get(agentId);
    if (!config) return;

    // Get current context from other agents
    const analyzerStatus = await signalBus.query(agentId, 'analyzer-agent', 'get_status');
    
    // Execute based on agent type
    if (config.type === 'execution') {
      // Execute pending tasks
      console.log(`[${agentId}] Analyzing and acting...`);
    } else if (config.type === 'analyzer') {
      // Analyze current state
      console.log(`[${agentId}] Analyzing trends...`);
    }
  }

  /**
   * Consolidate memory across agents
   */
  private async consolidateMemory(): Promise<void> {
    console.log('[Orchestrator] Consolidating memory...');
    
    for (const [agentId, agent] of this.agents) {
      const memory = agent.getMemory();
      // Persist important learnings
      if (memory.longTerm.length > 0) {
        console.log(`[Orchestrator] Agent ${agentId} has ${memory.longTerm.length} learnings`);
      }
    }
  }
}

export const ambientOrchestrator = AmbientAgentOrchestrator.getInstance();
