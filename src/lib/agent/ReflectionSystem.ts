/**
 * Reflection System
 * Evaluates tool outputs and enables self-correction
 */

import { supabase } from '@/integrations/supabase/client';

export interface ReflectionResult {
  quality: 'excellent' | 'good' | 'acceptable' | 'poor' | 'failed';
  score: number; // 0-100
  issues: string[];
  suggestions: string[];
  shouldRetry: boolean;
  retryStrategy?: string;
}

export interface ReflectionContext {
  goal: string;
  action: string;
  actionInput: Record<string, unknown>;
  observation: string;
  previousReflections?: ReflectionResult[];
}

export class ReflectionSystem {
  private reflectionPrompt = `You are a quality assurance agent. Evaluate the output of an action and determine if it meets the goal requirements.

Provide your evaluation as JSON:
{
  "quality": "excellent|good|acceptable|poor|failed",
  "score": 85,
  "issues": ["List any issues found"],
  "suggestions": ["List improvement suggestions"],
  "shouldRetry": false,
  "retryStrategy": "If retry needed, describe the strategy"
}

Quality guidelines:
- excellent (90-100): Perfect execution, exceeds expectations
- good (75-89): Solid execution with minor improvements possible
- acceptable (60-74): Meets minimum requirements
- poor (40-59): Significant issues, consider retry
- failed (0-39): Did not achieve goal, retry required`;

  async reflect(context: ReflectionContext): Promise<ReflectionResult> {
    const prompt = `Goal: ${context.goal}

Action taken: ${context.action}
Input: ${JSON.stringify(context.actionInput)}

Output/Observation:
${context.observation}

${context.previousReflections?.length 
  ? `Previous attempts: ${context.previousReflections.length} (last score: ${context.previousReflections[context.previousReflections.length - 1].score})`
  : ''}

Evaluate this output. Did it successfully contribute to the goal?`;

    const { data, error } = await supabase.functions.invoke('ai-chat', {
      body: {
        messages: [
          { role: 'system', content: this.reflectionPrompt },
          { role: 'user', content: prompt }
        ]
      }
    });

    if (error) throw error;

    const content = data?.content || data?.message || '';
    
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('No JSON found');
      return JSON.parse(jsonMatch[0]);
    } catch {
      // Parse from text
      const score = this.extractScore(content);
      return {
        quality: this.scoreToQuality(score),
        score,
        issues: [],
        suggestions: [],
        shouldRetry: score < 60,
        retryStrategy: score < 60 ? 'Review and adjust parameters' : undefined
      };
    }
  }

  private extractScore(text: string): number {
    const patterns = [
      /score[:\s]+(\d+)/i,
      /(\d+)%/,
      /(\d+)\s*\/\s*100/
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        const score = parseInt(match[1], 10);
        if (score >= 0 && score <= 100) return score;
      }
    }

    // Estimate from quality words
    if (/excellent|perfect|outstanding/i.test(text)) return 95;
    if (/good|solid|well/i.test(text)) return 80;
    if (/acceptable|adequate|okay/i.test(text)) return 65;
    if (/poor|lacking|insufficient/i.test(text)) return 45;
    if (/fail|error|wrong/i.test(text)) return 25;

    return 70; // Default
  }

  private scoreToQuality(score: number): ReflectionResult['quality'] {
    if (score >= 90) return 'excellent';
    if (score >= 75) return 'good';
    if (score >= 60) return 'acceptable';
    if (score >= 40) return 'poor';
    return 'failed';
  }

  /**
   * Aggregate reflections for a complete task
   */
  aggregateReflections(reflections: ReflectionResult[]): ReflectionResult {
    if (reflections.length === 0) {
      return {
        quality: 'acceptable',
        score: 70,
        issues: [],
        suggestions: [],
        shouldRetry: false
      };
    }

    const avgScore = reflections.reduce((sum, r) => sum + r.score, 0) / reflections.length;
    const allIssues = reflections.flatMap(r => r.issues);
    const allSuggestions = reflections.flatMap(r => r.suggestions);
    const anyRetry = reflections.some(r => r.shouldRetry);

    return {
      quality: this.scoreToQuality(avgScore),
      score: Math.round(avgScore),
      issues: [...new Set(allIssues)],
      suggestions: [...new Set(allSuggestions)],
      shouldRetry: anyRetry,
      retryStrategy: anyRetry ? 'Address accumulated issues' : undefined
    };
  }
}
