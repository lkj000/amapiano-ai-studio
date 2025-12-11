/**
 * Autonomous Agent
 * Integrates ReAct loop, goal decomposition, reflection, and tool chain management
 * Implements the full agent lifecycle: Sense → Learn → Reason → Act
 */

import { ReActLoop, Tool, defaultTools } from './ReActLoop';
import { GoalDecomposer, DecomposedGoal, Subtask } from './GoalDecomposer';
import { ReflectionSystem, ReflectionResult } from './ReflectionSystem';
import { ToolChainManager } from './ToolChainManager';
import { EventEmitter } from './EventEmitter';

export type AgentStatus = 
  | 'idle'
  | 'planning'
  | 'executing'
  | 'reflecting'
  | 'completed'
  | 'failed'
  | 'paused';

export interface AgentEvent {
  type: 'status_change' | 'task_start' | 'task_complete' | 'reflection' | 'error' | 'log';
  data: unknown;
  timestamp: number;
}

export interface AgentConfig {
  maxSteps: number;
  maxRetries: number;
  enableReflection: boolean;
  enableLearning: boolean;
  parallelExecution: boolean;
}

export interface ExecutionReport {
  goal: string;
  decomposition: DecomposedGoal;
  taskResults: Map<string, { success: boolean; output: string; reflection?: ReflectionResult }>;
  finalOutput: string;
  overallReflection: ReflectionResult;
  totalTime: number;
  success: boolean;
}

export class AutonomousAgent extends EventEmitter<AgentEvent> {
  private reActLoop: ReActLoop;
  private goalDecomposer: GoalDecomposer;
  private reflectionSystem: ReflectionSystem;
  private toolChainManager: ToolChainManager;
  private config: AgentConfig;
  private status: AgentStatus = 'idle';
  private memory: Map<string, unknown> = new Map();

  constructor(config: Partial<AgentConfig> = {}) {
    super();
    
    this.config = {
      maxSteps: config.maxSteps || 10,
      maxRetries: config.maxRetries || 3,
      enableReflection: config.enableReflection ?? true,
      enableLearning: config.enableLearning ?? true,
      parallelExecution: config.parallelExecution ?? true
    };

    this.reActLoop = new ReActLoop(this.config.maxSteps);
    this.goalDecomposer = new GoalDecomposer();
    this.reflectionSystem = new ReflectionSystem();
    this.toolChainManager = new ToolChainManager({
      maxConcurrent: this.config.parallelExecution ? 3 : 1,
      defaultRetries: this.config.maxRetries
    });

    // Register default tools
    this.registerTools(defaultTools);
  }

  registerTool(tool: Tool): void {
    this.reActLoop.registerTool(tool);
    this.toolChainManager.registerTool(tool);
  }

  registerTools(tools: Tool[]): void {
    tools.forEach(tool => this.registerTool(tool));
  }

  getStatus(): AgentStatus {
    return this.status;
  }

  private setStatus(status: AgentStatus): void {
    this.status = status;
    this.emit({
      type: 'status_change',
      data: { status },
      timestamp: Date.now()
    });
  }

  /**
   * Execute a goal autonomously
   */
  async execute(goal: string, context?: Record<string, unknown>): Promise<ExecutionReport> {
    const startTime = Date.now();
    const taskResults = new Map<string, { success: boolean; output: string; reflection?: ReflectionResult }>();

    try {
      // Phase 1: Planning
      this.setStatus('planning');
      this.emit({ type: 'log', data: { message: 'Decomposing goal...' }, timestamp: Date.now() });
      
      const decomposition = await this.goalDecomposer.decompose(goal, context);
      this.memory.set('currentDecomposition', decomposition);

      this.emit({
        type: 'log',
        data: { 
          message: `Goal decomposed into ${decomposition.subtasks.length} subtasks`,
          complexity: decomposition.complexity
        },
        timestamp: Date.now()
      });

      // Phase 2: Execution
      this.setStatus('executing');
      const executionBatches = this.goalDecomposer.getExecutionOrder(decomposition.subtasks);
      
      for (const batch of executionBatches) {
        const batchPromises = batch.map(async (task) => {
          this.emit({ type: 'task_start', data: { taskId: task.id, title: task.title }, timestamp: Date.now() });
          
          try {
            // Execute task using ReAct loop
            const result = await this.reActLoop.execute(task.description, {
              ...context,
              taskId: task.id,
              dependencies: task.dependencies.map(d => taskResults.get(d)?.output)
            });

            // Phase 3: Reflection (per task)
            let reflection: ReflectionResult | undefined;
            if (this.config.enableReflection) {
              this.setStatus('reflecting');
              reflection = await this.reflectionSystem.reflect({
                goal: task.description,
                action: 'task_execution',
                actionInput: { task },
                observation: result.output
              });

              // Retry if reflection suggests
              if (reflection.shouldRetry && reflection.score < 50) {
                this.emit({ type: 'log', data: { message: `Retrying task ${task.id}...` }, timestamp: Date.now() });
                const retryResult = await this.reActLoop.execute(
                  `${task.description}\n\nPrevious attempt issues: ${reflection.issues.join(', ')}\nTry: ${reflection.retryStrategy}`,
                  context
                );
                reflection = await this.reflectionSystem.reflect({
                  goal: task.description,
                  action: 'task_retry',
                  actionInput: { task },
                  observation: retryResult.output,
                  previousReflections: [reflection]
                });
                
                taskResults.set(task.id, {
                  success: retryResult.success,
                  output: retryResult.output,
                  reflection
                });
                return;
              }
            }

            taskResults.set(task.id, {
              success: result.success,
              output: result.output,
              reflection
            });

            this.emit({ 
              type: 'task_complete', 
              data: { taskId: task.id, success: result.success },
              timestamp: Date.now()
            });
          } catch (error) {
            const errorMsg = error instanceof Error ? error.message : 'Unknown error';
            taskResults.set(task.id, {
              success: false,
              output: errorMsg
            });
            this.emit({ type: 'error', data: { taskId: task.id, error: errorMsg }, timestamp: Date.now() });
          }
        });

        if (this.config.parallelExecution) {
          await Promise.all(batchPromises);
        } else {
          for (const promise of batchPromises) {
            await promise;
          }
        }
      }

      // Phase 4: Final Reflection
      this.setStatus('reflecting');
      const allReflections = Array.from(taskResults.values())
        .map(r => r.reflection)
        .filter((r): r is ReflectionResult => r !== undefined);
      
      const overallReflection = this.reflectionSystem.aggregateReflections(allReflections);

      // Compile final output
      const successfulOutputs = Array.from(taskResults.entries())
        .filter(([, r]) => r.success)
        .map(([id, r]) => `${id}: ${r.output}`);

      const finalOutput = successfulOutputs.join('\n\n') || 'No successful task outputs';

      // Phase 5: Learning (store insights)
      if (this.config.enableLearning) {
        this.memory.set(`execution_${Date.now()}`, {
          goal,
          decomposition,
          overallReflection,
          lessons: overallReflection.suggestions
        });
      }

      this.setStatus('completed');

      return {
        goal,
        decomposition,
        taskResults,
        finalOutput,
        overallReflection,
        totalTime: Date.now() - startTime,
        success: overallReflection.score >= 60
      };
    } catch (error) {
      this.setStatus('failed');
      throw error;
    }
  }

  /**
   * Execute a simple goal without decomposition
   */
  async executeSimple(goal: string, context?: Record<string, unknown>): Promise<{ output: string; success: boolean }> {
    this.setStatus('executing');
    
    try {
      const result = await this.reActLoop.execute(goal, context);
      this.setStatus('completed');
      return { output: result.output, success: result.success };
    } catch (error) {
      this.setStatus('failed');
      throw error;
    }
  }

  pause(): void {
    if (this.status === 'executing' || this.status === 'reflecting') {
      this.setStatus('paused');
    }
  }

  resume(): void {
    if (this.status === 'paused') {
      this.setStatus('executing');
    }
  }

  getMemory(): Map<string, unknown> {
    return new Map(this.memory);
  }

  clearMemory(): void {
    this.memory.clear();
  }
}

// Export singleton instance
export const autonomousAgent = new AutonomousAgent();
