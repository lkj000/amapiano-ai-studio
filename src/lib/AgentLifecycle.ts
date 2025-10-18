/**
 * Agent Lifecycle System - Inspired by VAST's Agentic Computing
 * Implements Sense → Learn → Reason → Act paradigm for AI agents
 */

import { toast } from '@/hooks/use-toast';

export type AgentState = 'idle' | 'sensing' | 'learning' | 'reasoning' | 'acting';

export interface SensorData {
  type: 'audio' | 'midi' | 'user_action' | 'collaboration' | 'pattern';
  timestamp: number;
  payload: any;
  metadata?: Record<string, any>;
}

export interface LearningContext {
  patterns: any[];
  userPreferences: Record<string, any>;
  musicalKnowledge: Record<string, any>;
  performanceMetrics: Record<string, number>;
}

export interface ReasoningOutput {
  decision: string;
  confidence: number;
  reasoning: string;
  suggestedActions: Action[];
}

export interface Action {
  type: 'generate' | 'adjust' | 'suggest' | 'optimize' | 'notify';
  target: string;
  params: Record<string, any>;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

export class AgentLifecycle {
  private state: AgentState = 'idle';
  private sensorBuffer: SensorData[] = [];
  private learningContext: LearningContext = {
    patterns: [],
    userPreferences: {},
    musicalKnowledge: {},
    performanceMetrics: {},
  };
  private onStateChange?: (state: AgentState) => void;
  private onAction?: (action: Action) => void;

  constructor(config: {
    onStateChange?: (state: AgentState) => void;
    onAction?: (action: Action) => void;
  }) {
    this.onStateChange = config.onStateChange;
    this.onAction = config.onAction;
  }

  /**
   * SENSE: Collect data from multiple sources
   */
  sense(data: SensorData) {
    this.setState('sensing');
    this.sensorBuffer.push({
      ...data,
      timestamp: Date.now(),
    });

    // Trigger learning if buffer reaches threshold
    if (this.sensorBuffer.length >= 10) {
      this.learn();
    }
  }

  /**
   * LEARN: Extract patterns and update knowledge base
   */
  async learn() {
    this.setState('learning');

    try {
      // Pattern recognition from sensor data
      const audioPatterns = this.sensorBuffer
        .filter(s => s.type === 'audio')
        .map(s => s.payload);

      const midiPatterns = this.sensorBuffer
        .filter(s => s.type === 'midi')
        .map(s => s.payload);

      const userActions = this.sensorBuffer
        .filter(s => s.type === 'user_action')
        .map(s => s.payload);

      // Update learning context
      this.learningContext.patterns = [
        ...this.learningContext.patterns,
        { audio: audioPatterns, midi: midiPatterns, timestamp: Date.now() },
      ].slice(-100); // Keep last 100 patterns

      // Extract user preferences
      userActions.forEach(action => {
        const key = action.category || 'general';
        this.learningContext.userPreferences[key] = 
          (this.learningContext.userPreferences[key] || 0) + 1;
      });

      // Clear processed sensors
      this.sensorBuffer = [];

      // Trigger reasoning
      await this.reason();
    } catch (error) {
      console.error('Learning phase error:', error);
      this.setState('idle');
    }
  }

  /**
   * REASON: Analyze context and make decisions
   */
  async reason(): Promise<ReasoningOutput> {
    this.setState('reasoning');

    try {
      // Analyze patterns
      const recentPatterns = this.learningContext.patterns.slice(-10);
      const topPreferences = Object.entries(this.learningContext.userPreferences)
        .sort(([, a], [, b]) => (b as number) - (a as number))
        .slice(0, 5);

      // Make decisions based on learned context
      const reasoning: ReasoningOutput = {
        decision: 'optimize_workflow',
        confidence: 0.85,
        reasoning: `Based on ${recentPatterns.length} recent patterns and user preferences`,
        suggestedActions: [],
      };

      // Generate suggested actions
      if (topPreferences.length > 0) {
        const [topPref] = topPreferences;
        reasoning.suggestedActions.push({
          type: 'suggest',
          target: 'ui',
          params: {
            suggestion: `You frequently use ${topPref[0]}. Would you like shortcuts?`,
          },
          priority: 'medium',
        });
      }

      // Auto-optimize based on performance
      if (this.learningContext.performanceMetrics.latency > 100) {
        reasoning.suggestedActions.push({
          type: 'optimize',
          target: 'audio_engine',
          params: { bufferSize: 4096 },
          priority: 'high',
        });
      }

      // Execute actions
      await this.act(reasoning.suggestedActions);

      return reasoning;
    } catch (error) {
      console.error('Reasoning phase error:', error);
      this.setState('idle');
      throw error;
    }
  }

  /**
   * ACT: Execute decided actions
   */
  async act(actions: Action[]) {
    this.setState('acting');

    try {
      // Sort by priority
      const sortedActions = actions.sort((a, b) => {
        const priority = { critical: 4, high: 3, medium: 2, low: 1 };
        return priority[b.priority] - priority[a.priority];
      });

      // Execute actions
      for (const action of sortedActions) {
        if (this.onAction) {
          this.onAction(action);
        }

        // Log action
        console.log(`[Agent Action] ${action.type} on ${action.target}`, action.params);

        // Add small delay between actions
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      this.setState('idle');
    } catch (error) {
      console.error('Action phase error:', error);
      this.setState('idle');
    }
  }

  /**
   * Update performance metrics for learning
   */
  updateMetrics(metrics: Record<string, number>) {
    this.learningContext.performanceMetrics = {
      ...this.learningContext.performanceMetrics,
      ...metrics,
    };
  }

  /**
   * Get current agent state
   */
  getState(): AgentState {
    return this.state;
  }

  /**
   * Get learning context
   */
  getContext(): LearningContext {
    return this.learningContext;
  }

  /**
   * Reset agent state
   */
  reset() {
    this.state = 'idle';
    this.sensorBuffer = [];
    this.learningContext = {
      patterns: [],
      userPreferences: {},
      musicalKnowledge: {},
      performanceMetrics: {},
    };
  }

  private setState(state: AgentState) {
    this.state = state;
    if (this.onStateChange) {
      this.onStateChange(state);
    }
  }
}
