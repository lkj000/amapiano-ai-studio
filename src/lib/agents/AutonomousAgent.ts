/**
 * Autonomous Agent
 * Complete AI Agent integrating all components:
 * - ReAct Loop (Reasoning + Acting)
 * - Goal Decomposition
 * - Reflection System
 * - Tool Chain Management
 */

import { ReActLoop, ReActState, ThoughtProcess } from './ReActLoop';
import { GoalDecomposer, DecomposedGoal } from './GoalDecomposer';
import { ReflectionSystem } from './ReflectionSystem';
import { ToolChainManager, ChainResult } from './ToolChainManager';
import { supabase } from '@/integrations/supabase/client';

export interface AgentConfig {
  maxIterations: number;
  reflectionEnabled: boolean;
  autonomousMode: boolean;
  learningEnabled: boolean;
}

export interface AgentMemory {
  shortTerm: Map<string, any>;
  longTerm: Array<{
    goal: string;
    result: ChainResult;
    learnings: string[];
    timestamp: number;
  }>;
  workingContext: Record<string, any>;
}

export interface AgentStatus {
  state: 'idle' | 'thinking' | 'acting' | 'reflecting' | 'complete' | 'error';
  currentGoal?: string;
  currentStep?: number;
  totalSteps?: number;
  lastAction?: string;
  progress: number;
}

export type AgentEventCallback = (event: AgentEvent) => void;

export interface AgentEvent {
  type: 'status' | 'thought' | 'action' | 'reflection' | 'complete' | 'error';
  data: any;
  timestamp: number;
}

export class AutonomousAgent {
  private config: AgentConfig;
  private memory: AgentMemory;
  private status: AgentStatus;
  private goalDecomposer: GoalDecomposer;
  private toolChainManager: ToolChainManager;
  private reflectionSystem: ReflectionSystem;
  private eventListeners: AgentEventCallback[] = [];
  private toolsReadyPromise: Promise<void>;
  private toolsReady: boolean = false;

  constructor(config?: Partial<AgentConfig>) {
    this.config = {
      maxIterations: 10,
      reflectionEnabled: true,
      autonomousMode: true,
      learningEnabled: true,
      ...config
    };

    this.memory = {
      shortTerm: new Map(),
      longTerm: [],
      workingContext: {}
    };

    this.status = {
      state: 'idle',
      progress: 0
    };

    // Initialize components
    this.toolChainManager = new ToolChainManager();
    this.goalDecomposer = new GoalDecomposer(this.toolChainManager.getAvailableTools());
    this.reflectionSystem = new ReflectionSystem();

    // Register default tools and track readiness
    this.toolsReadyPromise = this.registerDefaultTools();
  }

  private async registerDefaultTools(): Promise<void> {
    try {
      const { getAllRealTools } = await import('./RealToolDefinitions');
      const tools = getAllRealTools();
      this.toolChainManager.registerTools(tools);
      this.toolsReady = true;
      console.log(`[Agent] Registered ${tools.length} real tools`);
    } catch (err) {
      console.warn('[Agent] Failed to load real tools:', err);
      this.toolsReady = true; // Still mark as ready to allow execution with fallbacks
    }
  }

  async waitForTools(): Promise<void> {
    await this.toolsReadyPromise;
  }

  isReady(): boolean {
    return this.toolsReady;
  }

  addEventListener(callback: AgentEventCallback): void {
    this.eventListeners.push(callback);
  }

  removeEventListener(callback: AgentEventCallback): void {
    this.eventListeners = this.eventListeners.filter(cb => cb !== callback);
  }

  private emit(event: AgentEvent): void {
    this.eventListeners.forEach(cb => cb(event));
  }

  async execute(goal: string): Promise<ChainResult> {
    console.log(`[Agent] Starting execution for goal: ${goal}`);
    
    // Wait for tools to be ready before executing
    await this.toolsReadyPromise;
    
    this.status = {
      state: 'thinking',
      currentGoal: goal,
      currentStep: 0,
      progress: 0
    };
    this.emit({ type: 'status', data: this.status, timestamp: Date.now() });

    try {
      // Phase 1: Goal Decomposition
      this.emit({ type: 'thought', data: { phase: 'decomposition', goal }, timestamp: Date.now() });
      const decomposedGoal = this.goalDecomposer.decompose(goal);
      
      this.status.totalSteps = decomposedGoal.subtasks.length;
      this.memory.workingContext.decomposedGoal = decomposedGoal;

      console.log(`[Agent] Decomposed into ${decomposedGoal.subtasks.length} subtasks`);
      console.log(`[Agent] Interpretation: ${decomposedGoal.interpretation}`);

      // Phase 2: Autonomous Execution with ReAct Loop
      if (this.config.autonomousMode) {
        return await this.executeAutonomously(decomposedGoal);
      } else {
        return await this.executeSequentially(decomposedGoal);
      }

    } catch (error: any) {
      this.status.state = 'error';
      this.emit({ type: 'error', data: { error: error.message }, timestamp: Date.now() });
      
      return {
        success: false,
        outputs: {},
        errors: { agent: error.message },
        executionTime: 0,
        tasksCompleted: 0,
        totalTasks: 0,
        reflections: []
      };
    }
  }

  private async executeAutonomously(decomposedGoal: DecomposedGoal): Promise<ChainResult> {
    const tools = this.buildToolMap(decomposedGoal);
    
    const reasoningFn = async (context: string): Promise<ThoughtProcess> => {
      return this.generateThought(context, decomposedGoal);
    };

    const reactLoop = new ReActLoop(
      decomposedGoal.originalGoal,
      tools,
      reasoningFn,
      this.config.maxIterations
    );

    this.status.state = 'acting';
    const reactState = await reactLoop.run();

    // Convert ReAct state to ChainResult
    const result = this.convertReActToChainResult(reactState, decomposedGoal);

    // Reflect on overall execution
    if (this.config.reflectionEnabled) {
      this.status.state = 'reflecting';
      await this.performFinalReflection(result, decomposedGoal);
    }

    // Store in long-term memory
    if (this.config.learningEnabled) {
      this.storeInMemory(decomposedGoal.originalGoal, result);
    }

    this.status.state = 'complete';
    this.status.progress = 100;
    this.emit({ type: 'complete', data: result, timestamp: Date.now() });

    return result;
  }

  private async executeSequentially(decomposedGoal: DecomposedGoal): Promise<ChainResult> {
    this.status.state = 'acting';
    
    const result = await this.toolChainManager.executeChain(decomposedGoal);

    // Update status as tasks complete
    this.status.progress = (result.tasksCompleted / result.totalTasks) * 100;

    if (this.config.reflectionEnabled) {
      this.status.state = 'reflecting';
      await this.performFinalReflection(result, decomposedGoal);
    }

    if (this.config.learningEnabled) {
      this.storeInMemory(decomposedGoal.originalGoal, result);
    }

    this.status.state = 'complete';
    this.status.progress = 100;
    this.emit({ type: 'complete', data: result, timestamp: Date.now() });

    return result;
  }

  private buildToolMap(decomposedGoal: DecomposedGoal): Map<string, (input: any) => Promise<any>> {
    const tools = new Map<string, (input: any) => Promise<any>>();

    // Add task execution as tools
    for (const task of decomposedGoal.subtasks) {
      tools.set(task.toolRequired, async (input: any) => {
        // Emit action event
        this.emit({ 
          type: 'action', 
          data: { tool: task.toolRequired, input }, 
          timestamp: Date.now() 
        });

        // Execute via tool chain manager (which handles fallbacks)
        const tempGoal: DecomposedGoal = {
          ...decomposedGoal,
          subtasks: [{ ...task, inputSchema: { ...task.inputSchema, ...input } }],
          executionOrder: [task.id]
        };

        const result = await this.toolChainManager.executeChain(tempGoal);
        return result.outputs[task.id];
      });
    }

    // Add completion tool
    tools.set('complete', async (input: any) => {
      return { complete: true, summary: input.summary || 'Goal achieved' };
    });

    return tools;
  }

  private async generateThought(context: string, decomposedGoal: DecomposedGoal): Promise<ThoughtProcess> {
    const parsedContext = JSON.parse(context);
    const { step, recentActions, availableTools } = parsedContext;

    // Determine next action based on decomposed goal and progress
    const completedTasks = recentActions.filter((a: any) => a.success).map((a: any) => a.tool);
    const remainingTasks = decomposedGoal.subtasks.filter(
      t => !completedTasks.includes(t.toolRequired) && t.status !== 'completed'
    );

    if (remainingTasks.length === 0) {
      return {
        thought: 'All tasks completed. Goal achieved.',
        reasoning: 'No remaining tasks in the execution plan.',
        confidence: 0.95,
        nextAction: null
      };
    }

    // Find next task with satisfied dependencies
    const nextTask = remainingTasks.find(task => 
      task.dependencies.every(dep => 
        decomposedGoal.subtasks.find(t => t.id === dep)?.status === 'completed' ||
        completedTasks.includes(decomposedGoal.subtasks.find(t => t.id === dep)?.toolRequired)
      )
    );

    if (!nextTask) {
      return {
        thought: 'Waiting for dependencies to complete.',
        reasoning: 'Some required tasks are not yet finished.',
        confidence: 0.7,
        nextAction: null
      };
    }

    // Update status
    this.status.currentStep = step;
    this.status.lastAction = nextTask.toolRequired;
    this.status.progress = (step / decomposedGoal.subtasks.length) * 100;

    return {
      thought: `Executing: ${nextTask.name}`,
      reasoning: `${nextTask.description}. Dependencies satisfied.`,
      confidence: 0.85,
      nextAction: `${nextTask.toolRequired}:${JSON.stringify(nextTask.inputSchema)}`
    };
  }

  private convertReActToChainResult(reactState: ReActState, decomposedGoal: DecomposedGoal): ChainResult {
    const outputs: Record<string, any> = {};
    const errors: Record<string, string> = {};

    for (const action of reactState.actions) {
      if (action.success) {
        outputs[action.toolUsed] = action.output;
      } else {
        errors[action.toolUsed] = action.output?.error || 'Unknown error';
      }
    }

    return {
      success: reactState.isComplete && Object.keys(errors).length === 0,
      outputs,
      errors,
      executionTime: reactState.actions.reduce((sum, a) => sum + a.duration, 0),
      tasksCompleted: reactState.actions.filter(a => a.success).length,
      totalTasks: decomposedGoal.subtasks.length,
      reflections: reactState.observations.map(o => ({
        assessment: o.shouldContinue ? 'partial' : 'success',
        confidence: 0.8,
        insights: [o.interpretation],
        shouldRetry: false,
        shouldProceed: o.shouldContinue,
        learnings: []
      })) as any[]
    };
  }

  private async performFinalReflection(result: ChainResult, decomposedGoal: DecomposedGoal): Promise<void> {
    const reflection = this.reflectionSystem.reflect({
      goal: decomposedGoal.originalGoal,
      action: 'complete_workflow',
      toolUsed: 'agent',
      output: result,
      context: { decomposedGoal }
    });

    this.emit({ type: 'reflection', data: reflection, timestamp: Date.now() });

    // Log insights
    console.log('[Agent] Final Reflection:');
    console.log(`  Assessment: ${reflection.assessment}`);
    console.log(`  Confidence: ${(reflection.confidence * 100).toFixed(1)}%`);
    reflection.insights.forEach(insight => console.log(`  - ${insight}`));
  }

  private storeInMemory(goal: string, result: ChainResult): void {
    const learnings = result.reflections
      .flatMap(r => r.learnings || [])
      .map(l => l.description);

    this.memory.longTerm.push({
      goal,
      result,
      learnings,
      timestamp: Date.now()
    });

    // Keep only last 100 entries
    if (this.memory.longTerm.length > 100) {
      this.memory.longTerm = this.memory.longTerm.slice(-100);
    }
  }

  getStatus(): AgentStatus {
    return { ...this.status };
  }

  getMemory(): AgentMemory {
    return {
      shortTerm: new Map(this.memory.shortTerm),
      longTerm: [...this.memory.longTerm],
      workingContext: { ...this.memory.workingContext }
    };
  }

  getReflectionHistory() {
    return this.reflectionSystem.getHistory();
  }

  getSuccessRate(): number {
    if (this.memory.longTerm.length === 0) return 0;
    const successes = this.memory.longTerm.filter(m => m.result.success).length;
    return successes / this.memory.longTerm.length;
  }
}
