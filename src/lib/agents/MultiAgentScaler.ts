/**
 * Multi-Agent Scaler
 * 
 * Future Direction #4: Support concurrent agent execution for complex productions
 * 
 * Implements:
 * 1. Agent pool management with dynamic scaling
 * 2. Work distribution across concurrent agents
 * 3. Load balancing and resource allocation
 * 4. Inter-agent coordination and conflict resolution
 * 5. Parallel workflow execution
 */

import { AgentSignalBus, AgentSignal, SignalType } from './AgentSignalBus';
import { DurableAgentState, WorkflowState } from './DurableAgentState';
import { supabase } from '@/integrations/supabase/client';

export interface AgentInstance {
  id: string;
  type: AgentType;
  status: AgentStatus;
  workflowId: string | null;
  lastHeartbeat: number;
  metrics: AgentMetrics;
  resources: ResourceAllocation;
}

export type AgentType = 
  | 'composer'
  | 'arranger'
  | 'mixer'
  | 'mastering'
  | 'analyzer'
  | 'synthesis'
  | 'effects'
  | 'general';

export type AgentStatus = 
  | 'idle'
  | 'busy'
  | 'paused'
  | 'failed'
  | 'shutdown';

export interface AgentMetrics {
  tasksCompleted: number;
  tasksInProgress: number;
  averageTaskDuration: number;
  errorRate: number;
  uptime: number;
}

export interface ResourceAllocation {
  maxConcurrentTasks: number;
  memoryLimit: number; // MB
  priority: number; // 0-10
  cpuShares: number; // Relative CPU allocation
}

export interface WorkDistribution {
  workflowId: string;
  tasks: DistributedTask[];
  strategy: DistributionStrategy;
}

export interface DistributedTask {
  taskId: string;
  type: AgentType;
  priority: number;
  dependencies: string[];
  assignedAgent?: string;
  status: 'pending' | 'assigned' | 'running' | 'completed' | 'failed';
  input: any;
  output?: any;
}

export type DistributionStrategy = 
  | 'round-robin'
  | 'least-loaded'
  | 'specialized'
  | 'priority-based';

export interface ScalerConfig {
  minAgents: number;
  maxAgents: number;
  scaleUpThreshold: number; // Queue depth to trigger scale up
  scaleDownThreshold: number; // Idle time (ms) to trigger scale down
  heartbeatInterval: number;
  taskTimeout: number;
}

/**
 * Multi-Agent Scaler for concurrent execution
 */
export class MultiAgentScaler {
  private agents: Map<string, AgentInstance> = new Map();
  private taskQueue: DistributedTask[] = [];
  private activeWorkflows: Map<string, WorkDistribution> = new Map();
  private signalBus: AgentSignalBus;
  private config: ScalerConfig;
  private scalerInterval: NodeJS.Timeout | null = null;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private isRunning: boolean = false;

  constructor(config: Partial<ScalerConfig> = {}) {
    this.config = {
      minAgents: config.minAgents ?? 2,
      maxAgents: config.maxAgents ?? 8,
      scaleUpThreshold: config.scaleUpThreshold ?? 5,
      scaleDownThreshold: config.scaleDownThreshold ?? 60000,
      heartbeatInterval: config.heartbeatInterval ?? 10000,
      taskTimeout: config.taskTimeout ?? 300000
    };
    
    this.signalBus = AgentSignalBus.getInstance();
  }

  /**
   * Start the multi-agent scaler
   */
  async start(): Promise<void> {
    if (this.isRunning) return;
    
    console.log('[MultiAgentScaler] Starting scaler...');
    this.isRunning = true;
    
    // Initialize minimum agents
    for (let i = 0; i < this.config.minAgents; i++) {
      await this.spawnAgent('general');
    }
    
    // Start monitoring loops
    this.startScalerLoop();
    this.startHeartbeatLoop();
    
    // Subscribe to signals
    this.subscribeToSignals();
    
    console.log(`[MultiAgentScaler] Started with ${this.agents.size} agents`);
  }

  /**
   * Stop the scaler and all agents
   */
  async stop(): Promise<void> {
    if (!this.isRunning) return;
    
    console.log('[MultiAgentScaler] Stopping scaler...');
    this.isRunning = false;
    
    if (this.scalerInterval) {
      clearInterval(this.scalerInterval);
      this.scalerInterval = null;
    }
    
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
    
    // Gracefully shutdown agents
    for (const [agentId] of this.agents) {
      await this.shutdownAgent(agentId);
    }
    
    console.log('[MultiAgentScaler] Stopped');
  }

  /**
   * Submit a workflow for distributed execution
   */
  async submitWorkflow(
    workflowId: string,
    tasks: Omit<DistributedTask, 'status' | 'taskId'>[],
    strategy: DistributionStrategy = 'specialized'
  ): Promise<WorkDistribution> {
    const distribution: WorkDistribution = {
      workflowId,
      tasks: tasks.map((t, i) => ({
        ...t,
        taskId: `${workflowId}_task_${i}`,
        status: 'pending' as const
      })),
      strategy
    };
    
    this.activeWorkflows.set(workflowId, distribution);
    
    // Add tasks to queue
    for (const task of distribution.tasks) {
      this.taskQueue.push(task);
    }
    
    // Trigger immediate distribution
    await this.distributeTasks();
    
    return distribution;
  }

  /**
   * Get workflow status
   */
  getWorkflowStatus(workflowId: string): WorkDistribution | null {
    return this.activeWorkflows.get(workflowId) || null;
  }

  /**
   * Spawn a new agent instance
   */
  private async spawnAgent(type: AgentType): Promise<AgentInstance> {
    const agentId = `agent_${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const agent: AgentInstance = {
      id: agentId,
      type,
      status: 'idle',
      workflowId: null,
      lastHeartbeat: Date.now(),
      metrics: {
        tasksCompleted: 0,
        tasksInProgress: 0,
        averageTaskDuration: 0,
        errorRate: 0,
        uptime: Date.now()
      },
      resources: this.getDefaultResources(type)
    };
    
    this.agents.set(agentId, agent);
    
    // Emit spawn signal
    await this.signalBus.signal(
      'scaler',
      agentId,
      'data',
      { event: 'agent_spawned', type }
    );
    
    console.log(`[MultiAgentScaler] Spawned agent: ${agentId}`);
    return agent;
  }

  /**
   * Shutdown an agent
   */
  private async shutdownAgent(agentId: string): Promise<void> {
    const agent = this.agents.get(agentId);
    if (!agent) return;
    
    // Wait for current task if busy
    if (agent.status === 'busy') {
      agent.status = 'paused';
      // Give time for graceful completion
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
    
    agent.status = 'shutdown';
    this.agents.delete(agentId);
    
    console.log(`[MultiAgentScaler] Shutdown agent: ${agentId}`);
  }

  /**
   * Get default resource allocation for agent type
   */
  private getDefaultResources(type: AgentType): ResourceAllocation {
    const resources: Record<AgentType, ResourceAllocation> = {
      composer: { maxConcurrentTasks: 2, memoryLimit: 512, priority: 8, cpuShares: 30 },
      arranger: { maxConcurrentTasks: 3, memoryLimit: 256, priority: 7, cpuShares: 20 },
      mixer: { maxConcurrentTasks: 4, memoryLimit: 1024, priority: 9, cpuShares: 40 },
      mastering: { maxConcurrentTasks: 1, memoryLimit: 2048, priority: 10, cpuShares: 50 },
      analyzer: { maxConcurrentTasks: 8, memoryLimit: 256, priority: 5, cpuShares: 15 },
      synthesis: { maxConcurrentTasks: 4, memoryLimit: 512, priority: 7, cpuShares: 25 },
      effects: { maxConcurrentTasks: 6, memoryLimit: 384, priority: 6, cpuShares: 20 },
      general: { maxConcurrentTasks: 4, memoryLimit: 256, priority: 5, cpuShares: 15 }
    };
    
    return resources[type];
  }

  /**
   * Distribute pending tasks to available agents
   */
  private async distributeTasks(): Promise<void> {
    const pendingTasks = this.taskQueue.filter(t => t.status === 'pending');
    
    for (const task of pendingTasks) {
      // Check if dependencies are met
      if (!this.areDependenciesMet(task)) {
        continue;
      }
      
      // Find suitable agent
      const agent = this.findSuitableAgent(task);
      if (!agent) {
        // Consider scaling up
        if (this.agents.size < this.config.maxAgents) {
          await this.scaleUp(task.type);
        }
        continue;
      }
      
      // Assign task
      await this.assignTask(task, agent);
    }
  }

  /**
   * Check if task dependencies are satisfied
   */
  private areDependenciesMet(task: DistributedTask): boolean {
    for (const depId of task.dependencies) {
      const depTask = this.taskQueue.find(t => t.taskId === depId);
      if (depTask && depTask.status !== 'completed') {
        return false;
      }
    }
    return true;
  }

  /**
   * Find suitable agent for task based on strategy
   */
  private findSuitableAgent(task: DistributedTask): AgentInstance | null {
    const availableAgents = Array.from(this.agents.values())
      .filter(a => a.status === 'idle' && a.metrics.tasksInProgress < a.resources.maxConcurrentTasks);
    
    if (availableAgents.length === 0) return null;
    
    // Get workflow strategy
    const workflow = Array.from(this.activeWorkflows.values())
      .find(w => w.tasks.some(t => t.taskId === task.taskId));
    const strategy = workflow?.strategy || 'least-loaded';
    
    switch (strategy) {
      case 'specialized':
        // Prefer agents of matching type
        const specialized = availableAgents.find(a => a.type === task.type);
        return specialized || availableAgents[0];
        
      case 'priority-based':
        // Sort by priority and select highest
        return availableAgents.sort((a, b) => b.resources.priority - a.resources.priority)[0];
        
      case 'least-loaded':
        // Select agent with fewest tasks in progress
        return availableAgents.sort((a, b) => 
          a.metrics.tasksInProgress - b.metrics.tasksInProgress
        )[0];
        
      case 'round-robin':
      default:
        // Simple round-robin
        return availableAgents[Math.floor(Math.random() * availableAgents.length)];
    }
  }

  /**
   * Assign task to agent
   */
  private async assignTask(task: DistributedTask, agent: AgentInstance): Promise<void> {
    task.assignedAgent = agent.id;
    task.status = 'assigned';
    agent.status = 'busy';
    agent.metrics.tasksInProgress++;
    
    // Send task signal
    await this.signalBus.signal(
      'scaler',
      agent.id,
      'data',
      { event: 'task_assigned', task },
      task.priority > 5 ? 'high' : 'normal'
    );
    
    // Simulate task execution (in real implementation, agent would handle this)
    this.executeTask(task, agent);
    
    console.log(`[MultiAgentScaler] Assigned task ${task.taskId} to ${agent.id}`);
  }

  /**
   * Execute task (simulation for demonstration)
   */
  private async executeTask(task: DistributedTask, agent: AgentInstance): Promise<void> {
    task.status = 'running';
    const startTime = Date.now();
    
    try {
      // Simulate task execution time based on type
      const executionTimes: Record<AgentType, number> = {
        composer: 5000,
        arranger: 3000,
        mixer: 4000,
        mastering: 6000,
        analyzer: 2000,
        synthesis: 4000,
        effects: 2500,
        general: 3000
      };
      
      await new Promise(resolve => 
        setTimeout(resolve, executionTimes[task.type] * (0.5 + Math.random()))
      );
      
      // Mark completed
      task.status = 'completed';
      task.output = { success: true, processedAt: Date.now() };
      
      // Update agent metrics
      const duration = Date.now() - startTime;
      agent.metrics.tasksCompleted++;
      agent.metrics.tasksInProgress--;
      agent.metrics.averageTaskDuration = 
        (agent.metrics.averageTaskDuration * (agent.metrics.tasksCompleted - 1) + duration) / 
        agent.metrics.tasksCompleted;
      
      if (agent.metrics.tasksInProgress === 0) {
        agent.status = 'idle';
      }
      
      // Emit completion signal
      await this.signalBus.broadcast(
        agent.id,
        'data',
        { event: 'task_completed', taskId: task.taskId }
      );
      
      // Trigger next distribution
      await this.distributeTasks();
      
    } catch (error) {
      task.status = 'failed';
      agent.metrics.tasksInProgress--;
      agent.metrics.errorRate = 
        (agent.metrics.errorRate * agent.metrics.tasksCompleted + 1) / 
        (agent.metrics.tasksCompleted + 1);
      
      if (agent.metrics.tasksInProgress === 0) {
        agent.status = 'idle';
      }
      
      console.error(`[MultiAgentScaler] Task ${task.taskId} failed:`, error);
    }
  }

  /**
   * Scale up by spawning new agent
   */
  private async scaleUp(preferredType: AgentType = 'general'): Promise<void> {
    if (this.agents.size >= this.config.maxAgents) {
      console.log('[MultiAgentScaler] At max capacity, cannot scale up');
      return;
    }
    
    await this.spawnAgent(preferredType);
    console.log(`[MultiAgentScaler] Scaled up to ${this.agents.size} agents`);
  }

  /**
   * Scale down by removing idle agents
   */
  private async scaleDown(): Promise<void> {
    if (this.agents.size <= this.config.minAgents) {
      return;
    }
    
    const now = Date.now();
    const idleAgents = Array.from(this.agents.values())
      .filter(a => 
        a.status === 'idle' && 
        now - a.lastHeartbeat > this.config.scaleDownThreshold
      );
    
    for (const agent of idleAgents) {
      if (this.agents.size <= this.config.minAgents) break;
      await this.shutdownAgent(agent.id);
    }
  }

  /**
   * Start scaler monitoring loop
   */
  private startScalerLoop(): void {
    this.scalerInterval = setInterval(async () => {
      // Check if we need to scale
      const pendingCount = this.taskQueue.filter(t => t.status === 'pending').length;
      const idleAgents = Array.from(this.agents.values()).filter(a => a.status === 'idle');
      
      if (pendingCount > this.config.scaleUpThreshold && idleAgents.length === 0) {
        await this.scaleUp();
      } else if (pendingCount === 0 && idleAgents.length > this.config.minAgents) {
        await this.scaleDown();
      }
      
      // Distribute pending tasks
      await this.distributeTasks();
      
    }, 5000);
  }

  /**
   * Start heartbeat monitoring loop
   */
  private startHeartbeatLoop(): void {
    this.heartbeatInterval = setInterval(() => {
      const now = Date.now();
      
      for (const [agentId, agent] of this.agents) {
        agent.lastHeartbeat = now;
        
        // Check for stale tasks
        const staleTasks = this.taskQueue.filter(t => 
          t.assignedAgent === agentId && 
          t.status === 'running' &&
          now - agent.lastHeartbeat > this.config.taskTimeout
        );
        
        for (const task of staleTasks) {
          console.warn(`[MultiAgentScaler] Task ${task.taskId} timed out on ${agentId}`);
          task.status = 'failed';
          agent.metrics.tasksInProgress--;
          agent.metrics.errorRate = 
            (agent.metrics.errorRate * agent.metrics.tasksCompleted + 1) / 
            (agent.metrics.tasksCompleted + 1);
        }
      }
    }, this.config.heartbeatInterval);
  }

  /**
   * Subscribe to signal bus for coordination
   */
  private subscribeToSignals(): void {
    // Register scaler as an agent and subscribe to data signals
    this.signalBus.registerAgent('scaler');
    this.signalBus.onSignal('scaler', 'data', async (signal) => {
      switch (signal.payload?.event) {
        case 'task_completed':
          // Task completed, may trigger dependent tasks
          await this.distributeTasks();
          break;
          
        case 'agent_overloaded':
          // Agent is overloaded, scale up
          await this.scaleUp(signal.payload.agentType);
          break;
          
        case 'resource_exhausted':
          // Resource exhausted, need to rebalance
          await this.rebalanceWorkload();
          break;
      }
    });
  }

  /**
   * Rebalance workload across agents
   */
  private async rebalanceWorkload(): Promise<void> {
    // Collect running tasks from overloaded agents
    const overloaded = Array.from(this.agents.values())
      .filter(a => a.metrics.tasksInProgress > a.resources.maxConcurrentTasks);
    
    for (const agent of overloaded) {
      // Find tasks to reassign
      const excessTasks = this.taskQueue.filter(t => 
        t.assignedAgent === agent.id && t.status === 'assigned'
      ).slice(agent.resources.maxConcurrentTasks);
      
      for (const task of excessTasks) {
        task.assignedAgent = undefined;
        task.status = 'pending';
        agent.metrics.tasksInProgress--;
      }
    }
    
    await this.distributeTasks();
  }

  /**
   * Get scaler status
   */
  getStatus(): {
    agentCount: number;
    idleAgents: number;
    busyAgents: number;
    pendingTasks: number;
    runningTasks: number;
    completedTasks: number;
    failedTasks: number;
  } {
    const agents = Array.from(this.agents.values());
    
    return {
      agentCount: agents.length,
      idleAgents: agents.filter(a => a.status === 'idle').length,
      busyAgents: agents.filter(a => a.status === 'busy').length,
      pendingTasks: this.taskQueue.filter(t => t.status === 'pending').length,
      runningTasks: this.taskQueue.filter(t => t.status === 'running').length,
      completedTasks: this.taskQueue.filter(t => t.status === 'completed').length,
      failedTasks: this.taskQueue.filter(t => t.status === 'failed').length
    };
  }

  /**
   * Get detailed agent metrics
   */
  getAgentMetrics(): AgentInstance[] {
    return Array.from(this.agents.values());
  }
}

export const multiAgentScaler = new MultiAgentScaler();
