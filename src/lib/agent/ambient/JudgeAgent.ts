/**
 * Judge Agent
 * LLM-as-Judge for continuous evaluation and prompt refinement
 */

import { supabase } from '@/integrations/supabase/client';

export interface JudgeEvaluation {
  score: number; // 0-100
  reasoning: string;
  improvements: string[];
  verdict: 'pass' | 'fail' | 'needs_improvement';
  timestamp: number;
}

export interface JudgeCriteria {
  name: string;
  description: string;
  weight: number; // 0-1
  rubric: {
    excellent: string;
    good: string;
    acceptable: string;
    poor: string;
  };
}

const DEFAULT_CRITERIA: JudgeCriteria[] = [
  {
    name: 'accuracy',
    description: 'Correctness and factual accuracy of the output',
    weight: 0.3,
    rubric: {
      excellent: 'Completely accurate, no errors',
      good: 'Mostly accurate with minor inaccuracies',
      acceptable: 'Some accuracy issues but core is correct',
      poor: 'Significant accuracy problems'
    }
  },
  {
    name: 'relevance',
    description: 'How well the output addresses the goal',
    weight: 0.25,
    rubric: {
      excellent: 'Directly addresses all aspects of the goal',
      good: 'Addresses most aspects well',
      acceptable: 'Partially addresses the goal',
      poor: 'Misses key aspects of the goal'
    }
  },
  {
    name: 'completeness',
    description: 'Thoroughness and coverage of the response',
    weight: 0.25,
    rubric: {
      excellent: 'Comprehensive coverage of all requirements',
      good: 'Covers most requirements adequately',
      acceptable: 'Basic coverage with gaps',
      poor: 'Incomplete, missing major elements'
    }
  },
  {
    name: 'quality',
    description: 'Overall quality and professionalism',
    weight: 0.2,
    rubric: {
      excellent: 'Exceptional quality, exceeds expectations',
      good: 'High quality, meets professional standards',
      acceptable: 'Adequate quality for purpose',
      poor: 'Quality issues affect usability'
    }
  }
];

export class JudgeAgent {
  private criteria: JudgeCriteria[];
  private evaluationHistory: JudgeEvaluation[] = [];

  constructor(criteria: JudgeCriteria[] = DEFAULT_CRITERIA) {
    this.criteria = criteria;
  }

  /**
   * Evaluate an output against a goal
   */
  async evaluate(
    goal: string,
    output: string,
    context?: Record<string, unknown>
  ): Promise<JudgeEvaluation> {
    const prompt = this.buildEvaluationPrompt(goal, output, context);

    const { data, error } = await supabase.functions.invoke('ai-chat', {
      body: {
        messages: [
          { role: 'system', content: this.getSystemPrompt() },
          { role: 'user', content: prompt }
        ]
      }
    });

    if (error) throw error;

    const content = data?.content || data?.message || '';
    const evaluation = this.parseEvaluation(content);
    
    this.evaluationHistory.push(evaluation);
    
    return evaluation;
  }

  private getSystemPrompt(): string {
    const criteriaText = this.criteria
      .map(c => `- ${c.name} (${c.weight * 100}%): ${c.description}`)
      .join('\n');

    return `You are an expert judge evaluating AI agent outputs. 

Evaluation criteria:
${criteriaText}

For each evaluation, provide:
1. A score from 0-100
2. Detailed reasoning for your score
3. Specific improvements that could be made
4. A verdict: pass (≥70), needs_improvement (50-69), or fail (<50)

Output your evaluation as JSON:
{
  "score": 75,
  "reasoning": "Detailed analysis...",
  "improvements": ["Improvement 1", "Improvement 2"],
  "verdict": "pass"
}`;
  }

  private buildEvaluationPrompt(
    goal: string,
    output: string,
    context?: Record<string, unknown>
  ): string {
    return `Goal: ${goal}

${context ? `Context: ${JSON.stringify(context, null, 2)}\n\n` : ''}Output to evaluate:
${output}

Evaluate this output against the goal using all criteria.`;
  }

  private parseEvaluation(content: string): JudgeEvaluation {
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          score: parsed.score || 50,
          reasoning: parsed.reasoning || 'No reasoning provided',
          improvements: parsed.improvements || [],
          verdict: parsed.verdict || this.scoreToVerdict(parsed.score || 50),
          timestamp: Date.now()
        };
      }
    } catch {
      // Parse from text
    }

    // Fallback parsing
    const score = this.extractScore(content);
    return {
      score,
      reasoning: content,
      improvements: [],
      verdict: this.scoreToVerdict(score),
      timestamp: Date.now()
    };
  }

  private extractScore(text: string): number {
    const patterns = [
      /score[:\s]+(\d+)/i,
      /(\d+)\s*(?:\/\s*100|%)/,
      /rating[:\s]+(\d+)/i
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        const score = parseInt(match[1], 10);
        if (score >= 0 && score <= 100) return score;
      }
    }

    return 50; // Default
  }

  private scoreToVerdict(score: number): 'pass' | 'fail' | 'needs_improvement' {
    if (score >= 70) return 'pass';
    if (score >= 50) return 'needs_improvement';
    return 'fail';
  }

  /**
   * Refine a prompt based on evaluation feedback
   */
  async refinePrompt(
    originalPrompt: string,
    evaluation: JudgeEvaluation
  ): Promise<string> {
    if (evaluation.verdict === 'pass') {
      return originalPrompt; // No refinement needed
    }

    const refinementPrompt = `The following prompt produced an output that received a score of ${evaluation.score}/100.

Original prompt:
${originalPrompt}

Issues identified:
${evaluation.improvements.map((i, idx) => `${idx + 1}. ${i}`).join('\n')}

Reasoning: ${evaluation.reasoning}

Please improve this prompt to address the identified issues. Keep the core intent but make it clearer and more effective.`;

    const { data, error } = await supabase.functions.invoke('ai-chat', {
      body: {
        messages: [
          { role: 'system', content: 'You are a prompt engineering expert. Improve prompts based on evaluation feedback.' },
          { role: 'user', content: refinementPrompt }
        ]
      }
    });

    if (error) throw error;
    return data?.content || data?.message || originalPrompt;
  }

  /**
   * Compare multiple outputs and select the best
   */
  async selectBest(
    goal: string,
    outputs: string[]
  ): Promise<{ bestIndex: number; evaluation: JudgeEvaluation }> {
    const evaluations = await Promise.all(
      outputs.map(output => this.evaluate(goal, output))
    );

    let bestIndex = 0;
    let bestScore = evaluations[0].score;

    evaluations.forEach((eval_, index) => {
      if (eval_.score > bestScore) {
        bestScore = eval_.score;
        bestIndex = index;
      }
    });

    return { bestIndex, evaluation: evaluations[bestIndex] };
  }

  getHistory(): JudgeEvaluation[] {
    return [...this.evaluationHistory];
  }

  clearHistory(): void {
    this.evaluationHistory = [];
  }

  /**
   * Get average score from history
   */
  getAverageScore(): number {
    if (this.evaluationHistory.length === 0) return 0;
    const sum = this.evaluationHistory.reduce((acc, e) => acc + e.score, 0);
    return sum / this.evaluationHistory.length;
  }
}
