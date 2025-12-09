/**
 * Tool Chain Manager
 * Orchestrates sequential and parallel tool execution
 * Handles data flow between tools and error recovery
 */

import { Subtask, DecomposedGoal } from './GoalDecomposer';
import { ReflectionSystem, ReflectionResult } from './ReflectionSystem';

export interface ToolDefinition {
  name: string;
  description: string;
  execute: (input: any) => Promise<any>;
  inputSchema: Record<string, any>;
  outputSchema: Record<string, any>;
  retryable: boolean;
  maxRetries: number;
  timeout: number;
}

export interface ExecutionContext {
  goal: string;
  outputs: Map<string, any>;
  errors: Map<string, Error>;
  startTime: number;
  currentTask?: string;
}

export interface ChainResult {
  success: boolean;
  outputs: Record<string, any>;
  errors: Record<string, string>;
  executionTime: number;
  tasksCompleted: number;
  totalTasks: number;
  reflections: ReflectionResult[];
}

export class ToolChainManager {
  private tools: Map<string, ToolDefinition>;
  private reflectionSystem: ReflectionSystem;
  private context: ExecutionContext | null = null;

  constructor() {
    this.tools = new Map();
    this.reflectionSystem = new ReflectionSystem();
  }

  registerTool(tool: ToolDefinition): void {
    this.tools.set(tool.name, tool);
  }

  registerTools(tools: ToolDefinition[]): void {
    tools.forEach(tool => this.registerTool(tool));
  }

  getAvailableTools(): string[] {
    return Array.from(this.tools.keys());
  }

  async executeChain(decomposedGoal: DecomposedGoal): Promise<ChainResult> {
    const startTime = Date.now();
    
    this.context = {
      goal: decomposedGoal.originalGoal,
      outputs: new Map(),
      errors: new Map(),
      startTime
    };

    const reflections: ReflectionResult[] = [];
    let tasksCompleted = 0;

    console.log(`[ToolChain] Starting execution of ${decomposedGoal.subtasks.length} tasks`);

    // Execute tasks in order
    for (const taskId of decomposedGoal.executionOrder) {
      const task = decomposedGoal.subtasks.find(t => t.id === taskId);
      if (!task) continue;

      // Check dependencies
      const depsSatisfied = this.checkDependencies(task);
      if (!depsSatisfied) {
        console.log(`[ToolChain] Skipping ${task.id} - dependencies not satisfied`);
        task.status = 'skipped';
        continue;
      }

      // Execute task
      this.context.currentTask = task.id;
      task.status = 'in-progress';

      const result = await this.executeTask(task);
      
      // Reflect on result
      const reflection = this.reflectionSystem.reflect({
        goal: decomposedGoal.originalGoal,
        action: task.name,
        toolUsed: task.toolRequired,
        output: result.output,
        context: { taskId: task.id, dependencies: task.dependencies }
      });
      reflections.push(reflection);

      if (result.success) {
        task.status = 'completed';
        task.output = result.output;
        this.context.outputs.set(task.id, result.output);
        tasksCompleted++;
        console.log(`[ToolChain] ✓ Completed ${task.id}`);
      } else {
        task.status = 'failed';
        this.context.errors.set(task.id, result.error);
        console.log(`[ToolChain] ✗ Failed ${task.id}: ${result.error?.message}`);

        // Try retry if recommended
        if (reflection.shouldRetry) {
          console.log(`[ToolChain] Retrying ${task.id}: ${reflection.retryStrategy}`);
          const retryResult = await this.executeTask(task);
          if (retryResult.success) {
            task.status = 'completed';
            task.output = retryResult.output;
            this.context.outputs.set(task.id, retryResult.output);
            tasksCompleted++;
          }
        }
      }
    }

    const executionTime = Date.now() - startTime;

    return {
      success: tasksCompleted === decomposedGoal.subtasks.filter(t => t.status !== 'skipped').length,
      outputs: Object.fromEntries(this.context.outputs),
      errors: Object.fromEntries(
        Array.from(this.context.errors.entries()).map(([k, v]) => [k, v.message])
      ),
      executionTime,
      tasksCompleted,
      totalTasks: decomposedGoal.subtasks.length,
      reflections
    };
  }

  private checkDependencies(task: Subtask): boolean {
    if (!this.context) return false;
    
    for (const depId of task.dependencies) {
      if (!this.context.outputs.has(depId)) {
        return false;
      }
    }
    return true;
  }

  private async executeTask(task: Subtask): Promise<{ success: boolean; output?: any; error?: Error }> {
    const tool = this.tools.get(task.toolRequired);
    
    if (!tool) {
      // Try fallback execution for tools without explicit definitions
      return this.executeFallback(task);
    }

    // Prepare input with dependency outputs
    const input = this.prepareInput(task);

    try {
      // Execute with timeout
      const output = await Promise.race([
        tool.execute(input),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), tool.timeout)
        )
      ]);

      return { success: true, output };
    } catch (error: any) {
      return { success: false, error };
    }
  }

  private prepareInput(task: Subtask): any {
    if (!this.context) return task.inputSchema;

    const input = { ...task.inputSchema };

    // Inject outputs from dependencies
    for (const depId of task.dependencies) {
      const depOutput = this.context.outputs.get(depId);
      if (depOutput) {
        input[`${depId}_output`] = depOutput;
      }
    }

    return input;
  }

  private async executeFallback(task: Subtask): Promise<{ success: boolean; output?: any; error?: Error }> {
    console.warn(`[ToolChain] No explicit tool definition for ${task.toolRequired} - attempting dynamic resolution`);

    // Attempt to dynamically resolve tool from real tools or execute via edge function
    try {
      const { getRealToolByName } = await import('./RealToolDefinitions');
      
      // Map task tool names to real tool names
      const toolMapping: Record<string, string> = {
        'styleAnalyzer': 'audio_analysis',
        'lyricsGenerator': 'lyrics_generation',
        'vocalSynthesis': 'voice_synthesis',
        'stemSeparator': 'stem_separation',
        'stemExporter': 'export_stems',
        'amapianorizer': 'amapianorization',
        'musicGenerator': 'music_generation',
        'featureExtractor': 'audio_analysis',
        'elementSelector': 'amapianorization'
      };
      
      const realToolName = toolMapping[task.toolRequired];
      if (realToolName) {
        const realTool = getRealToolByName(realToolName);
        if (realTool) {
          console.log(`[ToolChain] Resolved ${task.toolRequired} -> ${realToolName}`);
          const input = this.prepareInput(task);
          const output = await realTool.execute(input);
          return { success: true, output };
        }
      }
      
      // For tools that genuinely have no implementation, fail explicitly
      console.error(`[ToolChain] Tool ${task.toolRequired} has no implementation`);
      return { 
        success: false, 
        error: new Error(`Tool not implemented: ${task.toolRequired}. Register tool definition or add edge function.`) 
      };
    } catch (error: any) {
      return { 
        success: false, 
        error: new Error(`Failed to resolve tool ${task.toolRequired}: ${error.message}`) 
      };
    }
  }

  getContext(): ExecutionContext | null {
    return this.context;
  }

  getReflectionSystem(): ReflectionSystem {
    return this.reflectionSystem;
  }
}
