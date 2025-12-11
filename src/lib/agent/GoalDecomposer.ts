/**
 * Goal Decomposer
 * Breaks high-level objectives into actionable subtasks
 */

import { supabase } from '@/integrations/supabase/client';

export interface Subtask {
  id: string;
  title: string;
  description: string;
  dependencies: string[];
  priority: 'high' | 'medium' | 'low';
  estimatedTime: number; // minutes
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  tools?: string[];
}

export interface DecomposedGoal {
  originalGoal: string;
  summary: string;
  subtasks: Subtask[];
  totalEstimatedTime: number;
  complexity: 'simple' | 'moderate' | 'complex';
  createdAt: number;
}

export class GoalDecomposer {
  private systemPrompt = `You are a task decomposition expert. Given a high-level goal, break it down into specific, actionable subtasks.

For each subtask, provide:
1. A clear title
2. A detailed description
3. Dependencies (which subtasks must complete first)
4. Priority (high/medium/low)
5. Estimated time in minutes
6. Required tools

Output your response as JSON:
{
  "summary": "Brief summary of the decomposition",
  "subtasks": [
    {
      "id": "task_1",
      "title": "Task title",
      "description": "Detailed description",
      "dependencies": [],
      "priority": "high",
      "estimatedTime": 5,
      "tools": ["tool_name"]
    }
  ],
  "complexity": "simple|moderate|complex"
}

Available tools:
- analyze_audio: Analyze audio for BPM, key, features
- separate_stems: Separate audio into stems
- generate_music: Generate music from prompt
- quantize_audio: Compress audio with SVDQuant
- amapianorize: Apply Amapiano elements
- generate_lyrics: Generate song lyrics
- synthesize_voice: Generate vocals with TTS`;

  async decompose(goal: string, context?: Record<string, unknown>): Promise<DecomposedGoal> {
    const prompt = `Goal: ${goal}${context ? `\n\nContext: ${JSON.stringify(context)}` : ''}

Break this goal into actionable subtasks.`;

    const { data, error } = await supabase.functions.invoke('ai-chat', {
      body: {
        messages: [
          { role: 'system', content: this.systemPrompt },
          { role: 'user', content: prompt }
        ]
      }
    });

    if (error) throw error;

    const content = data?.content || data?.message || '';
    
    let parsed: { summary: string; subtasks: Subtask[]; complexity: string };
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('No JSON found');
      parsed = JSON.parse(jsonMatch[0]);
    } catch {
      // Create default decomposition
      parsed = {
        summary: 'Goal decomposition created',
        subtasks: [{
          id: 'task_1',
          title: goal,
          description: goal,
          dependencies: [],
          priority: 'high',
          estimatedTime: 10,
          tools: [],
          status: 'pending'
        }] as Subtask[],
        complexity: 'simple'
      };
    }

    // Ensure all subtasks have status
    const subtasks = parsed.subtasks.map(t => ({
      ...t,
      status: t.status || 'pending' as const
    }));

    const totalTime = subtasks.reduce((sum, t) => sum + (t.estimatedTime || 5), 0);

    return {
      originalGoal: goal,
      summary: parsed.summary,
      subtasks,
      totalEstimatedTime: totalTime,
      complexity: parsed.complexity as 'simple' | 'moderate' | 'complex',
      createdAt: Date.now()
    };
  }

  /**
   * Get execution order respecting dependencies
   */
  getExecutionOrder(subtasks: Subtask[]): Subtask[][] {
    const completed = new Set<string>();
    const result: Subtask[][] = [];
    const remaining = [...subtasks];

    while (remaining.length > 0) {
      const batch: Subtask[] = [];
      
      for (let i = remaining.length - 1; i >= 0; i--) {
        const task = remaining[i];
        const depsComplete = task.dependencies.every(d => completed.has(d));
        
        if (depsComplete) {
          batch.push(task);
          remaining.splice(i, 1);
        }
      }

      if (batch.length === 0 && remaining.length > 0) {
        // Circular dependency - add remaining as final batch
        result.push(remaining);
        break;
      }

      if (batch.length > 0) {
        // Sort batch by priority
        batch.sort((a, b) => {
          const order = { high: 0, medium: 1, low: 2 };
          return order[a.priority] - order[b.priority];
        });
        
        result.push(batch);
        batch.forEach(t => completed.add(t.id));
      }
    }

    return result;
  }

  /**
   * Estimate total time considering parallel execution
   */
  estimateParallelTime(subtasks: Subtask[]): number {
    const batches = this.getExecutionOrder(subtasks);
    return batches.reduce((total, batch) => {
      const batchTime = Math.max(...batch.map(t => t.estimatedTime));
      return total + batchTime;
    }, 0);
  }
}
