/**
 * Tool Chain Manager
 * Orchestrates tool execution with priority queue and fallback handling
 */

import { Tool } from './ReActLoop';

export interface ToolExecution {
  toolName: string;
  input: Record<string, unknown>;
  priority: number;
  timeout?: number;
  retries?: number;
  fallbackTool?: string;
}

export interface ExecutionResult {
  toolName: string;
  success: boolean;
  output?: string;
  error?: string;
  executionTime: number;
  retryCount: number;
}

export interface ToolChainConfig {
  maxConcurrent: number;
  defaultTimeout: number;
  defaultRetries: number;
}

export class ToolChainManager {
  private tools: Map<string, Tool> = new Map();
  private executionQueue: ToolExecution[] = [];
  private activeExecutions = 0;
  private config: ToolChainConfig;

  constructor(config: Partial<ToolChainConfig> = {}) {
    this.config = {
      maxConcurrent: config.maxConcurrent || 3,
      defaultTimeout: config.defaultTimeout || 30000,
      defaultRetries: config.defaultRetries || 2
    };
  }

  registerTool(tool: Tool): void {
    this.tools.set(tool.name, tool);
  }

  registerTools(tools: Tool[]): void {
    tools.forEach(tool => this.registerTool(tool));
  }

  async execute(execution: ToolExecution): Promise<ExecutionResult> {
    const startTime = Date.now();
    const tool = this.tools.get(execution.toolName);
    const maxRetries = execution.retries ?? this.config.defaultRetries;
    
    if (!tool) {
      // Try fallback
      if (execution.fallbackTool) {
        const fallbackTool = this.tools.get(execution.fallbackTool);
        if (fallbackTool) {
          return this.execute({
            ...execution,
            toolName: execution.fallbackTool,
            fallbackTool: undefined
          });
        }
      }

      return {
        toolName: execution.toolName,
        success: false,
        error: `Tool not found: ${execution.toolName}`,
        executionTime: Date.now() - startTime,
        retryCount: 0
      };
    }

    let lastError: Error | undefined;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const timeout = execution.timeout ?? this.config.defaultTimeout;
        const output = await this.executeWithTimeout(tool, execution.input, timeout);
        
        return {
          toolName: execution.toolName,
          success: true,
          output,
          executionTime: Date.now() - startTime,
          retryCount: attempt
        };
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        console.warn(`Tool ${execution.toolName} attempt ${attempt + 1} failed:`, lastError.message);
        
        if (attempt < maxRetries) {
          // Exponential backoff
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        }
      }
    }

    // All retries failed, try fallback
    if (execution.fallbackTool) {
      return this.execute({
        ...execution,
        toolName: execution.fallbackTool,
        fallbackTool: undefined,
        retries: 1
      });
    }

    return {
      toolName: execution.toolName,
      success: false,
      error: lastError?.message || 'Unknown error',
      executionTime: Date.now() - startTime,
      retryCount: maxRetries
    };
  }

  private async executeWithTimeout(
    tool: Tool,
    input: Record<string, unknown>,
    timeout: number
  ): Promise<string> {
    return Promise.race([
      tool.execute(input),
      new Promise<string>((_, reject) => 
        setTimeout(() => reject(new Error('Execution timeout')), timeout)
      )
    ]);
  }

  /**
   * Execute multiple tools in parallel with priority ordering
   */
  async executeChain(executions: ToolExecution[]): Promise<ExecutionResult[]> {
    // Sort by priority (lower = higher priority)
    const sorted = [...executions].sort((a, b) => a.priority - b.priority);
    
    const results: ExecutionResult[] = [];
    const batches: ToolExecution[][] = [];
    
    // Create batches based on max concurrent
    for (let i = 0; i < sorted.length; i += this.config.maxConcurrent) {
      batches.push(sorted.slice(i, i + this.config.maxConcurrent));
    }

    // Execute batches sequentially
    for (const batch of batches) {
      const batchResults = await Promise.all(
        batch.map(exec => this.execute(exec))
      );
      results.push(...batchResults);
    }

    return results;
  }

  /**
   * Build a tool chain from a sequence of operations
   */
  buildChain(
    operations: Array<{
      tool: string;
      input: Record<string, unknown> | ((prevOutput: string) => Record<string, unknown>);
      fallback?: string;
    }>
  ): () => Promise<ExecutionResult[]> {
    return async () => {
      const results: ExecutionResult[] = [];
      let prevOutput = '';

      for (const op of operations) {
        const input = typeof op.input === 'function' 
          ? op.input(prevOutput) 
          : op.input;

        const result = await this.execute({
          toolName: op.tool,
          input,
          priority: results.length,
          fallbackTool: op.fallback
        });

        results.push(result);

        if (!result.success) {
          break; // Stop chain on failure
        }

        prevOutput = result.output || '';
      }

      return results;
    };
  }

  getRegisteredTools(): string[] {
    return Array.from(this.tools.keys());
  }

  getToolInfo(name: string): Tool | undefined {
    return this.tools.get(name);
  }
}
