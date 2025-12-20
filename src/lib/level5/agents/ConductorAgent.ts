/**
 * Conductor Agent
 * 
 * Master orchestrator that coordinates all specialized agents.
 * Implements the multi-agent collaboration protocol for Level 5 autonomy.
 */

import { BaseAgent, ExecutionContext, ExecutionResult, EvaluationResult, ImprovementPlan, AgentConfig } from './BaseAgent';
import { GrooveAgent } from './GrooveAgent';
import { HarmonyAgent } from './HarmonyAgent';
import { MixingAgent } from './MixingAgent';
import type { AgentRole, AgentMessage, GenerationRequest, GenerationResult, QualityAssessment } from '../types';

// ============================================================================
// ORCHESTRATION TYPES
// ============================================================================

interface AgentInstance {
  agent: BaseAgent;
  role: AgentRole;
  priority: number;
  dependencies: AgentRole[];
}

interface OrchestrationPlan {
  phases: OrchestrationPhase[];
  estimatedDuration: number;
  qualityTarget: number;
}

interface OrchestrationPhase {
  name: string;
  agents: AgentRole[];
  parallel: boolean;
  timeout: number;
}

interface PhaseResult {
  phase: string;
  success: boolean;
  outputs: Map<AgentRole, unknown>;
  duration: number;
  errors: string[];
}

// ============================================================================
// CONDUCTOR AGENT IMPLEMENTATION
// ============================================================================

export class ConductorAgent extends BaseAgent {
  private agents: Map<AgentRole, AgentInstance> = new Map();
  private conductorMessageQueue: AgentMessage[] = [];
  private executionHistory: PhaseResult[] = [];
  
  constructor(config?: Partial<AgentConfig>) {
    super('conductor', {
      maxActionsPerExecution: 50,
      timeoutMs: 120000, // 2 minutes for full generation
      ...config
    });
    
    this.initializeAgents();
  }

  private initializeAgents(): void {
    // Register all specialized agents
    this.agents.set('groove', {
      agent: new GrooveAgent(),
      role: 'groove',
      priority: 1,
      dependencies: []
    });
    
    this.agents.set('harmony', {
      agent: new HarmonyAgent(),
      role: 'harmony',
      priority: 2,
      dependencies: ['groove']  // Harmony follows rhythm
    });
    
    this.agents.set('mixing', {
      agent: new MixingAgent(),
      role: 'mixing',
      priority: 4,
      dependencies: ['groove', 'harmony']  // Mixing comes after content
    });
    
    console.log(`[Conductor] Initialized with ${this.agents.size} agents`);
  }

  // ============================================================================
  // MAIN EXECUTION
  // ============================================================================

  async execute(context: ExecutionContext): Promise<ExecutionResult> {
    const startTime = Date.now();
    this.setStatus('thinking');
    this.setCurrentTask('Planning orchestration');
    
    try {
      // Step 1: Create orchestration plan
      this.setProgress(5);
      const plan = this.createOrchestrationPlan(context.request);
      this.recordAction('create_plan', { phases: plan.phases.length });
      
      // Step 2: Initialize all agents
      this.setProgress(10);
      await this.initializeAllAgents();
      this.recordAction('initialize_agents', { count: this.agents.size });
      
      // Step 3: Execute phases
      const outputs = new Map<AgentRole, unknown>();
      let currentProgress = 10;
      const progressPerPhase = 70 / plan.phases.length;
      
      for (const phase of plan.phases) {
        this.setCurrentTask(`Phase: ${phase.name}`);
        
        const phaseResult = await this.executePhase(phase, context, outputs);
        this.executionHistory.push(phaseResult);
        
        if (!phaseResult.success) {
          throw new Error(`Phase ${phase.name} failed: ${phaseResult.errors.join(', ')}`);
        }
        
        // Merge outputs
        phaseResult.outputs.forEach((value, key) => outputs.set(key, value));
        
        currentProgress += progressPerPhase;
        this.setProgress(currentProgress);
        this.recordAction('complete_phase', { phase: phase.name, success: true });
      }
      
      // Step 4: Evaluate overall quality
      this.setProgress(85);
      this.setCurrentTask('Quality evaluation');
      const quality = await this.evaluateOverallQuality(outputs);
      this.recordAction('evaluate_quality', { score: quality.overallScore });
      
      // Step 5: Self-improvement loop if needed
      const qualityTarget = typeof context.request.qualityTarget === 'number' ? context.request.qualityTarget : 75;
      if (quality.overallScore < qualityTarget) {
        this.setProgress(90);
        this.setCurrentTask('Self-improvement');
        
        const improved = await this.selfImprove(outputs, quality, context);
        outputs.forEach((_, key) => {
          if (improved.has(key)) outputs.set(key, improved.get(key));
        });
        
        this.recordAction('self_improve', { improved: true });
      }
      
      this.setProgress(100);
      this.setStatus('complete');
      
      // Build final result
      const result = this.buildGenerationResult(
        context.request as unknown as GenerationRequest,
        outputs,
        quality,
        Date.now() - startTime
      );
      
      return {
        success: true,
        output: result,
        actions: this.actionHistory,
        duration: Date.now() - startTime
      };
      
    } catch (error) {
      this.setStatus('error');
      return {
        success: false,
        output: null,
        actions: this.actionHistory,
        duration: Date.now() - startTime,
        notes: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async evaluate(output: unknown): Promise<EvaluationResult> {
    const result = output as GenerationResult;
    
    return {
      score: result.qualityScore,
      passed: result.passedThreshold,
      components: {
        groove: result.agentContributions.find(c => c.agent === 'groove')?.qualityDelta || 0,
        harmony: result.agentContributions.find(c => c.agent === 'harmony')?.qualityDelta || 0,
        mixing: result.agentContributions.find(c => c.agent === 'mixing')?.qualityDelta || 0
      },
      issues: [],
      suggestions: []
    };
  }

  async improve(feedback: EvaluationResult): Promise<ImprovementPlan> {
    // Conductor delegates improvement to individual agents
    return {
      actions: [],
      estimatedNewScore: feedback.score
    };
  }

  // ============================================================================
  // ORCHESTRATION METHODS
  // ============================================================================

  private createOrchestrationPlan(request: ExecutionContext['request']): OrchestrationPlan {
    // Standard Amapiano generation pipeline
    const phases: OrchestrationPhase[] = [
      {
        name: 'Rhythm Foundation',
        agents: ['groove'],
        parallel: false,
        timeout: 30000
      },
      {
        name: 'Harmonic Content',
        agents: ['harmony'],
        parallel: false,
        timeout: 25000
      },
      {
        name: 'Mix & Master',
        agents: ['mixing'],
        parallel: false,
        timeout: 20000
      }
    ];
    
    return {
      phases,
      estimatedDuration: phases.reduce((sum, p) => sum + p.timeout, 0),
      qualityTarget: 75
    };
  }

  private async initializeAllAgents(): Promise<void> {
    const initPromises = Array.from(this.agents.values()).map(
      instance => instance.agent.initialize()
    );
    await Promise.all(initPromises);
  }

  private async executePhase(
    phase: OrchestrationPhase,
    context: ExecutionContext,
    previousOutputs: Map<AgentRole, unknown>
  ): Promise<PhaseResult> {
    const startTime = Date.now();
    const outputs = new Map<AgentRole, unknown>();
    const errors: string[] = [];
    
    const executeAgent = async (role: AgentRole) => {
      const instance = this.agents.get(role);
      if (!instance) {
        errors.push(`Agent ${role} not found`);
        return;
      }
      
      // Build context with previous outputs
      const agentContext: ExecutionContext = {
        request: context.request,
        previousOutputs: new Map(previousOutputs),
        constraints: context.constraints
      };
      
      try {
        const result = await instance.agent.execute(agentContext);
        
        if (result.success) {
          outputs.set(role, result.output);
        } else {
          errors.push(`Agent ${role} failed: ${result.notes}`);
        }
      } catch (error) {
        errors.push(`Agent ${role} error: ${error instanceof Error ? error.message : 'Unknown'}`);
      }
    };
    
    if (phase.parallel) {
      await Promise.all(phase.agents.map(executeAgent));
    } else {
      for (const role of phase.agents) {
        await executeAgent(role);
      }
    }
    
    return {
      phase: phase.name,
      success: errors.length === 0,
      outputs,
      duration: Date.now() - startTime,
      errors
    };
  }

  // ============================================================================
  // QUALITY EVALUATION
  // ============================================================================

  private async evaluateOverallQuality(
    outputs: Map<AgentRole, unknown>
  ): Promise<QualityAssessment> {
    const components = {
      rhythmicAccuracy: 0,
      harmonicRichness: 0,
      soundDesignQuality: 0,
      mixBalance: 0,
      genreAuthenticity: 0,
      productionPolish: 0
    };
    
    // Evaluate each agent's output
    for (const [role, instance] of this.agents) {
      const output = outputs.get(role);
      if (!output) continue;
      
      const evaluation = await instance.agent.evaluate(output);
      
      switch (role) {
        case 'groove':
          components.rhythmicAccuracy = evaluation.score / 100;
          break;
        case 'harmony':
          components.harmonicRichness = evaluation.score / 100;
          break;
        case 'mixing':
          components.mixBalance = evaluation.score / 100;
          break;
      }
    }
    
    // Calculate overall score
    const weights = {
      rhythmicAccuracy: 0.25,
      harmonicRichness: 0.20,
      soundDesignQuality: 0.15,
      mixBalance: 0.20,
      genreAuthenticity: 0.15,
      productionPolish: 0.05
    };
    
    let overallScore = 0;
    for (const [key, weight] of Object.entries(weights)) {
      overallScore += (components[key as keyof typeof components] || 0.5) * weight;
    }
    overallScore *= 100;
    
    return {
      overallScore,
      components,
      discriminatorScores: {
        isReal: 0.7,
        genreMatch: 0.8,
        qualityEstimate: overallScore / 100
      },
      issues: [],
      improvements: []
    };
  }

  // ============================================================================
  // SELF-IMPROVEMENT
  // ============================================================================

  private async selfImprove(
    outputs: Map<AgentRole, unknown>,
    quality: QualityAssessment,
    context: ExecutionContext
  ): Promise<Map<AgentRole, unknown>> {
    const improved = new Map<AgentRole, unknown>();
    
    // Identify weakest components
    const sortedComponents = Object.entries(quality.components)
      .sort(([, a], [, b]) => a - b);
    
    // Focus on bottom performers
    for (const [component] of sortedComponents.slice(0, 2)) {
      const role = this.componentToAgent(component);
      if (!role) continue;
      
      const instance = this.agents.get(role);
      if (!instance) continue;
      
      const output = outputs.get(role);
      if (!output) continue;
      
      // Get improvement plan
      const evaluation = await instance.agent.evaluate(output);
      const plan = await instance.agent.improve(evaluation);
      
      // If significant improvement expected, re-execute
      if (plan.estimatedNewScore > evaluation.score + 5) {
        const newResult = await instance.agent.execute({
          request: context.request,
          previousOutputs: outputs,
          constraints: {
            ...context.constraints,
            improvements: plan.actions
          }
        });
        
        if (newResult.success) {
          improved.set(role, newResult.output);
        }
      }
    }
    
    return improved;
  }

  private componentToAgent(component: string): AgentRole | null {
    const mapping: Record<string, AgentRole> = {
      'rhythmicAccuracy': 'groove',
      'harmonicRichness': 'harmony',
      'mixBalance': 'mixing',
      'soundDesignQuality': 'groove',
      'genreAuthenticity': 'harmony',
      'productionPolish': 'mixing'
    };
    return mapping[component] || null;
  }

  // ============================================================================
  // RESULT BUILDING
  // ============================================================================

  private buildGenerationResult(
    request: GenerationRequest,
    outputs: Map<AgentRole, unknown>,
    quality: QualityAssessment,
    totalTime: number
  ): GenerationResult {
    const contributions = Array.from(this.agents.entries()).map(([role, instance]) => ({
      agent: role,
      actions: instance.agent.getState().memory.episodic.slice(-5),
      improvements: [],
      qualityDelta: quality.components[this.agentToComponent(role)] || 0
    }));
    
    return {
      id: crypto.randomUUID(),
      requestId: request.id,
      audioUrl: '', // Would be generated by actual audio rendering
      duration: request.duration || 30,
      qualityScore: quality.overallScore,
      authenticityScore: quality.components.genreAuthenticity * 100,
      passedThreshold: quality.overallScore >= request.qualityTarget,
      features: {} as any, // Would come from analysis
      labels: {
        genre: request.genre,
        region: request.region as any
      },
      model: 'level5-multi-agent',
      promptUsed: request.prompt,
      attempts: 1,
      totalTime,
      agentContributions: contributions
    };
  }

  private agentToComponent(role: AgentRole): keyof QualityAssessment['components'] {
    const mapping: Record<AgentRole, keyof QualityAssessment['components']> = {
      'groove': 'rhythmicAccuracy',
      'harmony': 'harmonicRichness',
      'bass': 'soundDesignQuality',
      'arrangement': 'productionPolish',
      'mixing': 'mixBalance',
      'mastering': 'productionPolish',
      'conductor': 'genreAuthenticity'
    };
    return mapping[role] || 'genreAuthenticity';
  }

  // ============================================================================
  // PUBLIC API
  // ============================================================================

  /**
   * Generate music with full Level 5 autonomy
   */
  async generate(request: GenerationRequest): Promise<GenerationResult> {
    const context: ExecutionContext = {
      request: {
        ...request,
        prompt: request.prompt,
        genre: request.genre,
        region: request.region,
        bpm: request.bpm,
        key: request.key
      },
      constraints: {
        qualityTarget: request.qualityTarget,
        maxAttempts: request.maxAttempts
      }
    };
    
    const result = await this.execute(context);
    
    if (!result.success) {
      throw new Error(result.notes || 'Generation failed');
    }
    
    return result.output as GenerationResult;
  }

  /**
   * Get status of all agents
   */
  getAgentStatuses(): Map<AgentRole, string> {
    const statuses = new Map<AgentRole, string>();
    this.agents.forEach((instance, role) => {
      statuses.set(role, instance.agent.getState().status);
    });
    return statuses;
  }

  /**
   * Get execution history
   */
  getExecutionHistory(): PhaseResult[] {
    return [...this.executionHistory];
  }
}

// Singleton instance
export const conductorAgent = new ConductorAgent();
