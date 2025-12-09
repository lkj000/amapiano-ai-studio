/**
 * Judge Agent
 * Temporal-inspired LLM-as-Judge pattern
 * Continuously evaluates agent performance and refines strategies
 */

import { signalBus, AgentSignal } from './AgentSignalBus';
import { supabase } from '@/integrations/supabase/client';

export interface PerformanceMetrics {
  successRate: number;
  averageExecutionTime: number;
  errorRate: number;
  taskCompletionRate: number;
  qualityScore: number;
  authenticityScore?: number;
}

export interface EvaluationResult {
  agentId: string;
  metrics: PerformanceMetrics;
  assessment: 'excellent' | 'good' | 'needs_improvement' | 'poor';
  recommendations: string[];
  promptRefinements?: string;
  strategyUpdates?: Record<string, any>;
  timestamp: number;
}

export interface JudgeAgentConfig {
  evaluationIntervalMs: number;
  minExecutionsForEvaluation: number;
  improvementThreshold: number;
  llmEnabled: boolean;
}

export class JudgeAgent {
  private agentId: string = 'judge-agent';
  private config: JudgeAgentConfig;
  private evaluationHistory: EvaluationResult[] = [];
  private agentPrompts: Map<string, string> = new Map();
  private isRunning: boolean = false;
  private unsubscribers: (() => void)[] = [];

  constructor(config?: Partial<JudgeAgentConfig>) {
    this.config = {
      evaluationIntervalMs: 300000, // 5 minutes
      minExecutionsForEvaluation: 5,
      improvementThreshold: 0.1, // 10% improvement threshold
      llmEnabled: true,
      ...config
    };
  }

  /**
   * Initialize and register with signal bus
   */
  async initialize(): Promise<void> {
    signalBus.registerAgent(this.agentId);

    // Handle nudge signals
    const unsubNudge = signalBus.onSignal(this.agentId, 'nudge', async (signal) => {
      if (signal.payload?.action === 'evaluate_performance') {
        await this.evaluateAllAgents();
      }
    });
    this.unsubscribers.push(unsubNudge);

    // Handle data signals (execution results)
    const unsubData = signalBus.onSignal(this.agentId, 'data', async (signal) => {
      if (signal.payload?.type === 'execution_result') {
        await this.recordExecution(signal);
      }
    });
    this.unsubscribers.push(unsubData);

    // Register queries
    const unsubQuery = signalBus.onQuery(this.agentId, 'get_evaluation', async (query) => {
      const agentId = query.params?.agentId;
      const evaluation = this.getLatestEvaluation(agentId);
      return {
        queryId: query.id,
        success: true,
        data: evaluation,
        timestamp: Date.now()
      };
    });
    this.unsubscribers.push(unsubQuery);

    this.isRunning = true;
    console.log('[JudgeAgent] Initialized and listening for signals');
  }

  /**
   * Shutdown the agent
   */
  shutdown(): void {
    this.unsubscribers.forEach(unsub => unsub());
    this.unsubscribers = [];
    signalBus.unregisterAgent(this.agentId);
    this.isRunning = false;
    console.log('[JudgeAgent] Shutdown complete');
  }

  /**
   * Evaluate all registered agents
   */
  async evaluateAllAgents(): Promise<EvaluationResult[]> {
    console.log('[JudgeAgent] Starting evaluation cycle...');
    
    const agents = signalBus.getRegisteredAgents().filter(
      id => id !== this.agentId && id !== 'heartbeat'
    );

    const results: EvaluationResult[] = [];

    for (const agentId of agents) {
      try {
        const evaluation = await this.evaluateAgent(agentId);
        if (evaluation) {
          results.push(evaluation);
          
          // Send refinement signals if needed
          if (evaluation.assessment === 'needs_improvement' || evaluation.assessment === 'poor') {
            await this.sendRefinements(agentId, evaluation);
          }
        }
      } catch (error) {
        console.error(`[JudgeAgent] Error evaluating ${agentId}:`, error);
      }
    }

    console.log(`[JudgeAgent] Evaluated ${results.length} agents`);
    return results;
  }

  /**
   * Evaluate a specific agent
   */
  async evaluateAgent(agentId: string): Promise<EvaluationResult | null> {
    // Fetch execution history from database
    const { data: executions } = await supabase
      .from('agent_executions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (!executions || executions.length < this.config.minExecutionsForEvaluation) {
      console.log(`[JudgeAgent] Not enough executions for ${agentId}`);
      return null;
    }

    // Calculate metrics
    const metrics = this.calculateMetrics(executions);

    // Generate assessment
    const assessment = this.assessPerformance(metrics);

    // Generate recommendations
    const recommendations = await this.generateRecommendations(agentId, metrics, assessment);

    // Generate prompt refinements if using LLM
    let promptRefinements: string | undefined;
    if (this.config.llmEnabled && (assessment === 'needs_improvement' || assessment === 'poor')) {
      promptRefinements = await this.generatePromptRefinements(agentId, metrics, executions);
    }

    const evaluation: EvaluationResult = {
      agentId,
      metrics,
      assessment,
      recommendations,
      promptRefinements,
      timestamp: Date.now()
    };

    this.evaluationHistory.push(evaluation);
    
    // Keep only last 100 evaluations
    if (this.evaluationHistory.length > 100) {
      this.evaluationHistory = this.evaluationHistory.slice(-100);
    }

    console.log(`[JudgeAgent] Evaluated ${agentId}: ${assessment}`);
    return evaluation;
  }

  /**
   * Calculate performance metrics from executions
   */
  private calculateMetrics(executions: any[]): PerformanceMetrics {
    const successful = executions.filter(e => e.success);
    const totalDuration = executions.reduce((sum, e) => sum + (e.duration_ms || 0), 0);
    
    // Extract quality scores from execution results
    const qualityScores = executions
      .filter(e => e.execution_result?.authenticityScore)
      .map(e => e.execution_result.authenticityScore);

    return {
      successRate: successful.length / executions.length,
      averageExecutionTime: totalDuration / executions.length,
      errorRate: 1 - (successful.length / executions.length),
      taskCompletionRate: executions.reduce((sum, e) => {
        const result = e.execution_result;
        if (result?.tasksCompleted && result?.totalTasks) {
          return sum + (result.tasksCompleted / result.totalTasks);
        }
        return sum;
      }, 0) / executions.length,
      qualityScore: qualityScores.length > 0 
        ? qualityScores.reduce((a, b) => a + b, 0) / qualityScores.length 
        : 0.5,
      authenticityScore: qualityScores.length > 0 
        ? qualityScores.reduce((a, b) => a + b, 0) / qualityScores.length 
        : undefined
    };
  }

  /**
   * Assess overall performance
   */
  private assessPerformance(metrics: PerformanceMetrics): EvaluationResult['assessment'] {
    const score = (
      metrics.successRate * 0.3 +
      metrics.taskCompletionRate * 0.3 +
      metrics.qualityScore * 0.3 +
      (1 - Math.min(metrics.errorRate, 1)) * 0.1
    );

    if (score >= 0.85) return 'excellent';
    if (score >= 0.70) return 'good';
    if (score >= 0.50) return 'needs_improvement';
    return 'poor';
  }

  /**
   * Generate recommendations based on metrics
   */
  private async generateRecommendations(
    agentId: string,
    metrics: PerformanceMetrics,
    assessment: EvaluationResult['assessment']
  ): Promise<string[]> {
    const recommendations: string[] = [];

    if (metrics.successRate < 0.7) {
      recommendations.push('Increase error handling and retry logic');
      recommendations.push('Review tool fallback mechanisms');
    }

    if (metrics.averageExecutionTime > 30000) {
      recommendations.push('Optimize task parallelization');
      recommendations.push('Consider caching frequently accessed data');
    }

    if (metrics.taskCompletionRate < 0.8) {
      recommendations.push('Review goal decomposition logic');
      recommendations.push('Improve dependency resolution');
    }

    if (metrics.qualityScore < 0.6) {
      recommendations.push('Enhance quality validation in output processing');
      recommendations.push('Add more comprehensive reflection steps');
    }

    if (metrics.authenticityScore && metrics.authenticityScore < 0.7) {
      recommendations.push('Increase region-specific element selection');
      recommendations.push('Improve cultural authenticity scoring weights');
    }

    return recommendations;
  }

  /**
   * Generate LLM-powered prompt refinements
   */
  private async generatePromptRefinements(
    agentId: string,
    metrics: PerformanceMetrics,
    executions: any[]
  ): Promise<string> {
    try {
      const { data, error } = await supabase.functions.invoke('agent-reasoning', {
        body: {
          goal: 'Improve agent performance',
          context: {
            agentId,
            metrics,
            recentErrors: executions
              .filter(e => !e.success)
              .slice(0, 5)
              .map(e => e.execution_result?.errors),
            currentPrompt: this.agentPrompts.get(agentId) || 'Default system prompt'
          },
          availableTools: [],
          history: []
        }
      });

      if (error) throw error;

      const refinement = data?.suggested_actions?.[0] || 
        'Consider breaking complex goals into smaller, more focused subtasks.';

      return refinement;
    } catch (error) {
      console.error('[JudgeAgent] LLM refinement failed:', error);
      return 'Focus on improving task success rate through better error handling.';
    }
  }

  /**
   * Send refinement signals to an agent
   */
  private async sendRefinements(agentId: string, evaluation: EvaluationResult): Promise<void> {
    // Send strategy update signal
    await signalBus.signal(
      this.agentId,
      agentId,
      'refinement',
      {
        evaluation,
        recommendations: evaluation.recommendations,
        promptRefinements: evaluation.promptRefinements
      },
      'high'
    );

    // If we have prompt refinements, send update_prompt signal
    if (evaluation.promptRefinements) {
      await signalBus.signal(
        this.agentId,
        agentId,
        'update_prompt',
        {
          newPrompt: evaluation.promptRefinements,
          reason: `Performance assessment: ${evaluation.assessment}`,
          metrics: evaluation.metrics
        },
        'high'
      );

      console.log(`[JudgeAgent] Sent prompt refinement to ${agentId}`);
    }
  }

  /**
   * Record execution result for evaluation
   */
  private async recordExecution(signal: AgentSignal): Promise<void> {
    // Store execution data for future evaluation
    console.log(`[JudgeAgent] Recorded execution from ${signal.source}`);
  }

  /**
   * Get latest evaluation for an agent
   */
  getLatestEvaluation(agentId?: string): EvaluationResult | null {
    if (agentId) {
      return this.evaluationHistory
        .filter(e => e.agentId === agentId)
        .pop() || null;
    }
    return this.evaluationHistory[this.evaluationHistory.length - 1] || null;
  }

  /**
   * Get evaluation history
   */
  getEvaluationHistory(limit: number = 50): EvaluationResult[] {
    return this.evaluationHistory.slice(-limit);
  }

  /**
   * Update agent prompt (called when receiving refinements)
   */
  updateAgentPrompt(agentId: string, prompt: string): void {
    this.agentPrompts.set(agentId, prompt);
  }

  /**
   * Check if running
   */
  isActive(): boolean {
    return this.isRunning;
  }
}

export const judgeAgent = new JudgeAgent();
