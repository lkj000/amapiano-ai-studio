/**
 * LLM-based Reasoning Engine for the Autonomous Agent
 * Provides adaptive, context-aware reasoning using Lovable AI Gateway
 */

import { supabase } from '@/integrations/supabase/client';
import { ThoughtProcess } from './ReActLoop';
import { DecomposedGoal } from './GoalDecomposer';

export interface ReasoningContext {
  goal: string;
  decomposedGoal?: DecomposedGoal;
  currentContext: string;
  availableTools: string[];
  history: Array<{
    action: string;
    result: string;
    timestamp: number;
  }>;
  memory?: Record<string, unknown>;
}

export interface ReasoningResult {
  reasoning: string;
  shouldContinue: boolean;
  confidence: number;
  nextAction: string | null;
  actionInput: Record<string, unknown> | null;
  explanation: string;
}

export class LLMReasoningEngine {
  private fallbackEnabled: boolean = true;
  private lastError: string | null = null;

  constructor(private enableFallback: boolean = true) {
    this.fallbackEnabled = enableFallback;
  }

  /**
   * Generate a thought process using LLM reasoning
   */
  async reason(context: ReasoningContext): Promise<ThoughtProcess> {
    try {
      const result = await this.callLLM(context);
      return this.convertToThoughtProcess(result, context);
    } catch (error) {
      console.error('LLM reasoning failed:', error);
      this.lastError = error instanceof Error ? error.message : 'Unknown error';
      
      if (this.fallbackEnabled) {
        return this.fallbackReasoning(context);
      }
      throw error;
    }
  }

  /**
   * Call the LLM reasoning edge function
   */
  private async callLLM(context: ReasoningContext): Promise<ReasoningResult> {
    const { data, error } = await supabase.functions.invoke('agent-reasoning', {
      body: {
        goal: context.goal,
        context: context.currentContext,
        availableTools: context.availableTools,
        history: context.history.slice(-5) // Last 5 actions for context
      }
    });

    if (error) {
      throw new Error(`LLM reasoning call failed: ${error.message}`);
    }

    if (data.fallback) {
      throw new Error(data.error || 'LLM returned fallback signal');
    }

    return data as ReasoningResult;
  }

  /**
   * Convert LLM result to ThoughtProcess format
   */
  private convertToThoughtProcess(result: ReasoningResult, context: ReasoningContext): ThoughtProcess {
    return {
      thought: result.explanation,
      reasoning: result.reasoning,
      confidence: result.confidence,
      nextAction: result.nextAction
    };
  }

  /**
   * Fallback reasoning when LLM is unavailable
   */
  private fallbackReasoning(context: ReasoningContext): ThoughtProcess {
    console.log('Using fallback reasoning due to LLM unavailability');
    
    const { goal, availableTools, history, decomposedGoal } = context;
    
    // Analyze what's been done
    const completedActions = new Set(history.map(h => h.action));
    
    // Find next action from decomposed goal if available
    if (decomposedGoal) {
      const nextTask = decomposedGoal.subtasks.find(
        task => !completedActions.has(task.toolRequired)
      );
      
      if (nextTask) {
        return {
          thought: `Based on goal decomposition, next step is: ${nextTask.description}`,
          reasoning: `Task ${nextTask.id} requires ${nextTask.toolRequired}`,
          confidence: 0.7,
          nextAction: nextTask.toolRequired
        };
      }
    }

    // Determine next action based on goal keywords
    const goalLower = goal.toLowerCase();
    
    if (goalLower.includes('lyrics') && !completedActions.has('lyrics_generation')) {
      return {
        thought: 'Goal mentions lyrics, and lyrics have not been generated yet',
        reasoning: 'Using lyrics_generation tool to create lyrics',
        confidence: 0.6,
        nextAction: 'lyrics_generation'
      };
    }

    if (goalLower.includes('separate') || goalLower.includes('stem')) {
      if (!completedActions.has('stem_separation')) {
        return {
          thought: 'Goal involves stem separation',
          reasoning: 'Using stem_separation tool',
          confidence: 0.6,
          nextAction: 'stem_separation'
        };
      }
    }

    if (goalLower.includes('amapiano') && !completedActions.has('amapianorization')) {
      return {
        thought: 'Goal mentions Amapiano transformation',
        reasoning: 'Using amapianorization tool to add authentic elements',
        confidence: 0.6,
        nextAction: 'amapianorization'
      };
    }

    // No more actions needed
    return {
      thought: 'No more actions identified from goal analysis',
      reasoning: 'All identified tasks appear to be complete',
      confidence: 0.5,
      nextAction: null
    };
  }

  /**
   * Get the last error that occurred
   */
  getLastError(): string | null {
    return this.lastError;
  }

  /**
   * Check if fallback was used in last reasoning
   */
  wasFallbackUsed(): boolean {
    return this.lastError !== null;
  }
}

// Singleton instance
let reasoningEngineInstance: LLMReasoningEngine | null = null;

export const getLLMReasoningEngine = (enableFallback = true): LLMReasoningEngine => {
  if (!reasoningEngineInstance) {
    reasoningEngineInstance = new LLMReasoningEngine(enableFallback);
  }
  return reasoningEngineInstance;
};
