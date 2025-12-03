/**
 * Reflection System
 * Evaluates tool outputs and decides next steps
 * Implements self-correction and learning from mistakes
 */

export interface ReflectionInput {
  goal: string;
  action: string;
  toolUsed: string;
  output: any;
  expectedOutcome?: string;
  context: Record<string, any>;
}

export interface ReflectionResult {
  assessment: 'success' | 'partial' | 'failure' | 'unexpected';
  confidence: number;
  insights: string[];
  shouldRetry: boolean;
  retryStrategy?: string;
  shouldProceed: boolean;
  nextActionSuggestion?: string;
  learnings: Learning[];
}

export interface Learning {
  type: 'success-pattern' | 'failure-pattern' | 'optimization';
  description: string;
  applicability: string[];
  timestamp: number;
}

export interface ReflectionHistory {
  reflections: Array<{
    input: ReflectionInput;
    result: ReflectionResult;
    timestamp: number;
  }>;
  learnings: Learning[];
  successRate: number;
  commonFailures: Map<string, number>;
}

export class ReflectionSystem {
  private history: ReflectionHistory;
  private qualityThresholds: Record<string, number>;

  constructor() {
    this.history = {
      reflections: [],
      learnings: [],
      successRate: 0,
      commonFailures: new Map()
    };

    this.qualityThresholds = {
      authenticity: 0.7,
      audioQuality: 0.8,
      fadScore: 0.15,
      beatConsistency: 0.85,
      confidence: 0.6
    };
  }

  reflect(input: ReflectionInput): ReflectionResult {
    const assessment = this.assessOutput(input);
    const insights = this.extractInsights(input, assessment);
    const learnings = this.extractLearnings(input, assessment);
    const { shouldRetry, retryStrategy } = this.determineRetryStrategy(input, assessment);
    const shouldProceed = this.shouldProceed(assessment, input);
    const nextActionSuggestion = this.suggestNextAction(input, assessment);

    const result: ReflectionResult = {
      assessment,
      confidence: this.calculateConfidence(input, assessment),
      insights,
      shouldRetry,
      retryStrategy,
      shouldProceed,
      nextActionSuggestion,
      learnings
    };

    // Record reflection
    this.history.reflections.push({
      input,
      result,
      timestamp: Date.now()
    });

    // Update learnings
    this.history.learnings.push(...learnings);
    this.updateSuccessRate();

    return result;
  }

  private assessOutput(input: ReflectionInput): 'success' | 'partial' | 'failure' | 'unexpected' {
    const { output, toolUsed } = input;

    // Check for explicit errors
    if (output?.error || output?.success === false) {
      return 'failure';
    }

    // Tool-specific quality checks
    switch (toolUsed) {
      case 'authenticityScorer':
        return this.assessAuthenticityOutput(output);
      case 'stemSeparator':
        return this.assessStemOutput(output);
      case 'vocalSynthesis':
        return this.assessVocalOutput(output);
      case 'amapianorizer':
        return this.assessAmapianorizerOutput(output);
      case 'featureExtractor':
        return this.assessFeatureOutput(output);
      default:
        return this.assessGenericOutput(output);
    }
  }

  private assessAuthenticityOutput(output: any): 'success' | 'partial' | 'failure' | 'unexpected' {
    if (!output?.score && output?.score !== 0) return 'unexpected';
    if (output.score >= this.qualityThresholds.authenticity) return 'success';
    if (output.score >= this.qualityThresholds.authenticity * 0.7) return 'partial';
    return 'failure';
  }

  private assessStemOutput(output: any): 'success' | 'partial' | 'failure' | 'unexpected' {
    if (!output?.stems) return 'unexpected';
    const expectedStems = ['vocals', 'drums', 'bass', 'other'];
    const foundStems = Object.keys(output.stems);
    const coverage = expectedStems.filter(s => foundStems.includes(s)).length / expectedStems.length;
    
    if (coverage === 1) return 'success';
    if (coverage >= 0.75) return 'partial';
    return 'failure';
  }

  private assessVocalOutput(output: any): 'success' | 'partial' | 'failure' | 'unexpected' {
    if (!output?.audioUrl && !output?.audio) return 'unexpected';
    if (output.quality >= this.qualityThresholds.audioQuality) return 'success';
    if (output.quality >= this.qualityThresholds.audioQuality * 0.7) return 'partial';
    return output.audioUrl || output.audio ? 'partial' : 'failure';
  }

  private assessAmapianorizerOutput(output: any): 'success' | 'partial' | 'failure' | 'unexpected' {
    if (!output?.processedAudio) return 'unexpected';
    const score = output.authenticityScore || output.score || 0;
    if (score >= this.qualityThresholds.authenticity) return 'success';
    if (score >= this.qualityThresholds.authenticity * 0.6) return 'partial';
    return 'failure';
  }

  private assessFeatureOutput(output: any): 'success' | 'partial' | 'failure' | 'unexpected' {
    if (!output) return 'unexpected';
    const hasEssentialFeatures = output.bpm || output.key || output.energy;
    if (hasEssentialFeatures && output.confidence >= 0.7) return 'success';
    if (hasEssentialFeatures) return 'partial';
    return 'failure';
  }

  private assessGenericOutput(output: any): 'success' | 'partial' | 'failure' | 'unexpected' {
    if (output === null || output === undefined) return 'failure';
    if (output.success === true) return 'success';
    if (output.success === false) return 'failure';
    if (typeof output === 'object' && Object.keys(output).length > 0) return 'success';
    return 'partial';
  }

  private extractInsights(input: ReflectionInput, assessment: string): string[] {
    const insights: string[] = [];

    switch (assessment) {
      case 'success':
        insights.push(`${input.toolUsed} completed successfully`);
        if (input.output?.score) {
          insights.push(`Quality score: ${(input.output.score * 100).toFixed(1)}%`);
        }
        break;
      case 'partial':
        insights.push(`${input.toolUsed} partially completed - may need refinement`);
        if (input.output?.suggestions) {
          insights.push(...input.output.suggestions);
        }
        break;
      case 'failure':
        insights.push(`${input.toolUsed} failed - ${input.output?.error || 'unknown reason'}`);
        insights.push(...this.getSuggestionsForFailure(input));
        break;
      case 'unexpected':
        insights.push(`Unexpected output from ${input.toolUsed} - output format may have changed`);
        break;
    }

    return insights;
  }

  private getSuggestionsForFailure(input: ReflectionInput): string[] {
    const suggestions: string[] = [];
    
    switch (input.toolUsed) {
      case 'vocalSynthesis':
        suggestions.push('Consider adjusting voice parameters or trying a different voice type');
        suggestions.push('Check if lyrics are properly formatted');
        break;
      case 'stemSeparator':
        suggestions.push('Ensure audio file is in supported format (WAV, MP3)');
        suggestions.push('Audio quality may be too low for effective separation');
        break;
      case 'amapianorizer':
        suggestions.push('Source track may not be compatible with amapianorization');
        suggestions.push('Try adjusting region or intensity settings');
        break;
      default:
        suggestions.push('Check input parameters and try again');
    }

    return suggestions;
  }

  private extractLearnings(input: ReflectionInput, assessment: string): Learning[] {
    const learnings: Learning[] = [];

    if (assessment === 'success') {
      learnings.push({
        type: 'success-pattern',
        description: `${input.toolUsed} works well with ${JSON.stringify(input.context).slice(0, 100)}`,
        applicability: [input.toolUsed, input.goal.split(' ')[0]],
        timestamp: Date.now()
      });
    }

    if (assessment === 'failure') {
      learnings.push({
        type: 'failure-pattern',
        description: `${input.toolUsed} failed: ${input.output?.error || 'unknown'}`,
        applicability: [input.toolUsed],
        timestamp: Date.now()
      });

      // Track common failures
      const failureKey = `${input.toolUsed}:${input.output?.error || 'unknown'}`;
      this.history.commonFailures.set(
        failureKey, 
        (this.history.commonFailures.get(failureKey) || 0) + 1
      );
    }

    return learnings;
  }

  private determineRetryStrategy(input: ReflectionInput, assessment: string): { shouldRetry: boolean; retryStrategy?: string } {
    if (assessment === 'success') {
      return { shouldRetry: false };
    }

    // Check if this failure is common
    const failureKey = `${input.toolUsed}:${input.output?.error || 'unknown'}`;
    const failureCount = this.history.commonFailures.get(failureKey) || 0;

    if (failureCount >= 3) {
      return { shouldRetry: false, retryStrategy: 'Skip - repeated failures with same error' };
    }

    if (assessment === 'partial') {
      return { 
        shouldRetry: true, 
        retryStrategy: 'Refine parameters and retry with adjusted settings' 
      };
    }

    if (assessment === 'failure') {
      return { 
        shouldRetry: true, 
        retryStrategy: 'Try alternative approach or fallback tool' 
      };
    }

    return { shouldRetry: false };
  }

  private shouldProceed(assessment: string, input: ReflectionInput): boolean {
    // Always proceed on success
    if (assessment === 'success') return true;

    // Proceed on partial if not critical
    if (assessment === 'partial') {
      const criticalTools = ['stemSeparator', 'vocalSynthesis'];
      return !criticalTools.includes(input.toolUsed);
    }

    return false;
  }

  private suggestNextAction(input: ReflectionInput, assessment: string): string | undefined {
    if (assessment === 'success') {
      return this.getNextActionForSuccess(input);
    }

    if (assessment === 'partial' || assessment === 'failure') {
      return this.getRecoveryAction(input);
    }

    return 'Investigate unexpected output format';
  }

  private getNextActionForSuccess(input: ReflectionInput): string {
    const nextActions: Record<string, string> = {
      'lyricsGenerator': 'vocalSynthesis: Generate vocals from lyrics',
      'vocalSynthesis': 'audioMixer: Mix vocals with instrumental',
      'stemSeparator': 'amapianorizer: Apply amapiano elements to stems',
      'featureExtractor': 'elementSelector: Select matching elements based on features',
      'elementSelector': 'amapianorizer: Apply selected elements',
      'amapianorizer': 'authenticityScorer: Validate authenticity',
      'authenticityScorer': 'complete: Workflow finished'
    };

    return nextActions[input.toolUsed] || 'continue: Proceed to next step';
  }

  private getRecoveryAction(input: ReflectionInput): string {
    const recoveryActions: Record<string, string> = {
      'vocalSynthesis': 'lyricsGenerator: Simplify lyrics and retry',
      'stemSeparator': 'audioLoader: Re-load audio in different format',
      'amapianorizer': 'elementSelector: Try different element combination'
    };

    return recoveryActions[input.toolUsed] || `retry: ${input.toolUsed} with adjusted parameters`;
  }

  private calculateConfidence(input: ReflectionInput, assessment: string): number {
    let confidence = 0.5;

    // Adjust based on assessment
    switch (assessment) {
      case 'success': confidence = 0.9; break;
      case 'partial': confidence = 0.6; break;
      case 'failure': confidence = 0.2; break;
      case 'unexpected': confidence = 0.3; break;
    }

    // Adjust based on historical success rate for this tool
    const toolReflections = this.history.reflections.filter(
      r => r.input.toolUsed === input.toolUsed
    );
    if (toolReflections.length > 0) {
      const toolSuccessRate = toolReflections.filter(
        r => r.result.assessment === 'success'
      ).length / toolReflections.length;
      confidence = confidence * 0.7 + toolSuccessRate * 0.3;
    }

    return Math.min(Math.max(confidence, 0), 1);
  }

  private updateSuccessRate(): void {
    const total = this.history.reflections.length;
    if (total === 0) {
      this.history.successRate = 0;
      return;
    }

    const successes = this.history.reflections.filter(
      r => r.result.assessment === 'success'
    ).length;
    this.history.successRate = successes / total;
  }

  getHistory(): ReflectionHistory {
    return { ...this.history };
  }

  getLearnings(): Learning[] {
    return [...this.history.learnings];
  }

  getSuccessRate(): number {
    return this.history.successRate;
  }
}
