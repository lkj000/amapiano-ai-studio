/**
 * Predictive Agent System - Phase 2 Enhancement
 * Predicts user actions and suggests optimizations
 */

import { AgentLifecycle, Action, SensorData } from './AgentLifecycle';

export interface UserPattern {
  actionSequence: string[];
  frequency: number;
  context: Record<string, any>;
  lastOccurred: number;
}

export interface Prediction {
  nextAction: string;
  confidence: number;
  suggestions: Action[];
  reasoning: string;
  timeToAction?: number;
}

export class PredictiveAgent extends AgentLifecycle {
  private actionHistory: string[] = [];
  private patterns: Map<string, UserPattern> = new Map();
  private predictionThreshold: number = 0.7;
  private maxHistoryLength: number = 1000;

  constructor(config: {
    onStateChange?: (state: any) => void;
    onAction?: (action: Action) => void;
    predictionThreshold?: number;
  }) {
    super(config);
    this.predictionThreshold = config.predictionThreshold || 0.7;
  }

  /**
   * Track user action for pattern learning
   */
  trackAction(action: string, context: Record<string, any> = {}) {
    this.actionHistory.push(action);
    
    // Keep history bounded
    if (this.actionHistory.length > this.maxHistoryLength) {
      this.actionHistory.shift();
    }

    // Update patterns
    this.updatePatterns(action, context);

    // Create sensor data
    this.sense({
      type: 'user_action',
      timestamp: Date.now(),
      payload: { action, context },
    });
  }

  /**
   * Update pattern recognition
   */
  private updatePatterns(action: string, context: Record<string, any>) {
    // Look for sequences of 2-5 actions
    for (let seqLen = 2; seqLen <= 5; seqLen++) {
      if (this.actionHistory.length < seqLen) continue;

      const sequence = this.actionHistory.slice(-seqLen);
      const patternKey = sequence.join('->');

      const existing = this.patterns.get(patternKey);
      if (existing) {
        existing.frequency++;
        existing.lastOccurred = Date.now();
        existing.context = { ...existing.context, ...context };
      } else {
        this.patterns.set(patternKey, {
          actionSequence: sequence,
          frequency: 1,
          context,
          lastOccurred: Date.now(),
        });
      }
    }

    // Clean up old patterns (not seen in 24 hours)
    const dayAgo = Date.now() - 24 * 60 * 60 * 1000;
    for (const [key, pattern] of this.patterns.entries()) {
      if (pattern.lastOccurred < dayAgo && pattern.frequency < 3) {
        this.patterns.delete(key);
      }
    }
  }

  /**
   * Predict next user action
   */
  predictNextAction(): Prediction | null {
    if (this.actionHistory.length < 2) return null;

    // Find matching patterns
    const matchingPatterns: Array<{ pattern: UserPattern; key: string }> = [];
    
    for (const [key, pattern] of this.patterns.entries()) {
      const seqLen = pattern.actionSequence.length;
      const recentActions = this.actionHistory.slice(-(seqLen - 1));
      const patternPrefix = pattern.actionSequence.slice(0, -1);

      if (JSON.stringify(recentActions) === JSON.stringify(patternPrefix)) {
        matchingPatterns.push({ pattern, key });
      }
    }

    if (matchingPatterns.length === 0) return null;

    // Sort by frequency and recency
    matchingPatterns.sort((a, b) => {
      const scoreA = a.pattern.frequency * (1 + (Date.now() - a.pattern.lastOccurred) / 1000000);
      const scoreB = b.pattern.frequency * (1 + (Date.now() - b.pattern.lastOccurred) / 1000000);
      return scoreB - scoreA;
    });

    const topPattern = matchingPatterns[0].pattern;
    const nextAction = topPattern.actionSequence[topPattern.actionSequence.length - 1];

    // Calculate confidence
    const totalMatches = matchingPatterns.reduce((sum, mp) => sum + mp.pattern.frequency, 0);
    const confidence = topPattern.frequency / totalMatches;

    if (confidence < this.predictionThreshold) return null;

    // Generate suggestions
    const suggestions = this.generateSuggestions(nextAction, topPattern.context);

    return {
      nextAction,
      confidence,
      suggestions,
      reasoning: `Pattern detected: ${topPattern.actionSequence.join(' → ')} (occurred ${topPattern.frequency} times)`,
      timeToAction: this.estimateTimeToAction(topPattern),
    };
  }

  /**
   * Generate contextual suggestions
   */
  private generateSuggestions(action: string, context: Record<string, any>): Action[] {
    const suggestions: Action[] = [];

    // Context-aware suggestions
    if (action === 'add_track') {
      suggestions.push({
        type: 'suggest',
        target: 'ui',
        params: {
          message: 'Add a new track?',
          quickActions: ['Audio Track', 'MIDI Track', 'Instrument'],
          context,
        },
        priority: 'medium',
      });
    }

    if (action === 'adjust_volume') {
      suggestions.push({
        type: 'suggest',
        target: 'mixer',
        params: {
          message: 'Quick access to mixer?',
          presetValues: context.commonValues || [],
        },
        priority: 'low',
      });
    }

    if (action === 'export_project') {
      suggestions.push({
        type: 'suggest',
        target: 'export',
        params: {
          message: 'Export with your usual settings?',
          quickExport: true,
          lastSettings: context.exportSettings,
        },
        priority: 'high',
      });
    }

    // Optimization suggestions based on context
    if (context.trackCount > 20) {
      suggestions.push({
        type: 'optimize',
        target: 'performance',
        params: {
          message: 'Many tracks detected. Enable track freezing?',
          optimization: 'freeze_tracks',
        },
        priority: 'medium',
      });
    }

    return suggestions;
  }

  /**
   * Estimate time until predicted action
   */
  private estimateTimeToAction(pattern: UserPattern): number {
    // Simple heuristic: average time between pattern occurrences
    const avgInterval = 5000; // 5 seconds default
    return avgInterval;
  }

  /**
   * Get top patterns
   */
  getTopPatterns(limit: number = 10): UserPattern[] {
    return Array.from(this.patterns.values())
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, limit);
  }

  /**
   * Get action statistics
   */
  getActionStats(): Record<string, number> {
    const stats: Record<string, number> = {};
    
    this.actionHistory.forEach(action => {
      stats[action] = (stats[action] || 0) + 1;
    });

    return stats;
  }

  /**
   * Reset prediction data
   */
  resetPredictions() {
    this.actionHistory = [];
    this.patterns.clear();
  }
}
