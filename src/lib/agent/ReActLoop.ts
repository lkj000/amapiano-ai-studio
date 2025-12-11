/**
 * ReAct Loop Implementation
 * Reasoning + Acting cycle with thought generation, action selection, observation feedback
 * Based on the ReAct paper (https://arxiv.org/abs/2201.11903)
 */

import { supabase } from '@/integrations/supabase/client';

export interface ReActStep {
  step: number;
  thought: string;
  action: string;
  actionInput: Record<string, unknown>;
  observation: string;
  timestamp: number;
}

export interface ReActResult {
  output: string;
  steps: ReActStep[];
  totalTime: number;
  success: boolean;
}

export interface Tool {
  name: string;
  description: string;
  parameters: Record<string, { type: string; description: string; required?: boolean }>;
  execute: (input: Record<string, unknown>) => Promise<string>;
}

export class ReActLoop {
  private tools: Map<string, Tool> = new Map();
  private maxSteps: number;
  private systemPrompt: string;

  constructor(maxSteps = 10) {
    this.maxSteps = maxSteps;
    this.systemPrompt = this.buildSystemPrompt();
  }

  registerTool(tool: Tool): void {
    this.tools.set(tool.name, tool);
    this.systemPrompt = this.buildSystemPrompt();
  }

  registerTools(tools: Tool[]): void {
    tools.forEach(tool => this.registerTool(tool));
  }

  private buildSystemPrompt(): string {
    const toolDescriptions = Array.from(this.tools.values())
      .map(t => `- ${t.name}: ${t.description}`)
      .join('\n');

    return `You are an autonomous AI agent that solves tasks using the ReAct framework.

Available tools:
${toolDescriptions || '- No tools registered'}

For each step, you must output in this exact JSON format:
{
  "thought": "Your reasoning about what to do next",
  "action": "tool_name",
  "action_input": { "param": "value" }
}

When you have the final answer, use:
{
  "thought": "I now have the answer",
  "action": "final_answer",
  "action_input": { "answer": "Your final answer here" }
}

Always think step by step. Be concise but thorough.`;
  }

  async execute(goal: string, context?: Record<string, unknown>): Promise<ReActResult> {
    const startTime = Date.now();
    const steps: ReActStep[] = [];
    let currentContext = context ? JSON.stringify(context) : '';

    for (let stepNum = 0; stepNum < this.maxSteps; stepNum++) {
      const stepStart = Date.now();
      
      // Build prompt with history
      const historyText = steps.length > 0
        ? `\n\nPrevious steps:\n${steps.map(s => 
            `Step ${s.step}: Thought: ${s.thought}\nAction: ${s.action}\nObservation: ${s.observation}`
          ).join('\n\n')}`
        : '';

      const prompt = `Goal: ${goal}${currentContext ? `\n\nContext: ${currentContext}` : ''}${historyText}

What is your next step?`;

      // Call LLM for reasoning
      const response = await this.callLLM(prompt);
      
      let parsed: { thought: string; action: string; action_input: Record<string, unknown> };
      try {
        // Extract JSON from response
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error('No JSON found');
        parsed = JSON.parse(jsonMatch[0]);
      } catch {
        // Fallback parsing
        parsed = {
          thought: response,
          action: 'final_answer',
          action_input: { answer: response }
        };
      }

      // Check for final answer
      if (parsed.action === 'final_answer') {
        const finalStep: ReActStep = {
          step: stepNum + 1,
          thought: parsed.thought,
          action: 'final_answer',
          actionInput: parsed.action_input,
          observation: 'Task complete',
          timestamp: stepStart
        };
        steps.push(finalStep);

        return {
          output: String(parsed.action_input.answer || parsed.thought),
          steps,
          totalTime: Date.now() - startTime,
          success: true
        };
      }

      // Execute tool
      let observation: string;
      const tool = this.tools.get(parsed.action);
      
      if (tool) {
        try {
          observation = await tool.execute(parsed.action_input);
        } catch (error) {
          observation = `Error executing ${parsed.action}: ${error instanceof Error ? error.message : 'Unknown error'}`;
        }
      } else {
        observation = `Unknown tool: ${parsed.action}. Available tools: ${Array.from(this.tools.keys()).join(', ')}`;
      }

      steps.push({
        step: stepNum + 1,
        thought: parsed.thought,
        action: parsed.action,
        actionInput: parsed.action_input,
        observation,
        timestamp: stepStart
      });
    }

    // Max steps reached
    return {
      output: 'Max steps reached without finding answer',
      steps,
      totalTime: Date.now() - startTime,
      success: false
    };
  }

  private async callLLM(prompt: string): Promise<string> {
    const { data, error } = await supabase.functions.invoke('ai-chat', {
      body: {
        messages: [
          { role: 'system', content: this.systemPrompt },
          { role: 'user', content: prompt }
        ]
      }
    });

    if (error) throw error;
    return data?.content || data?.message || '';
  }
}

// Default tools
export const defaultTools: Tool[] = [
  {
    name: 'analyze_audio',
    description: 'Analyze audio file for BPM, key, genre, and spectral features',
    parameters: {
      audio_url: { type: 'string', description: 'URL of audio file to analyze', required: true }
    },
    execute: async (input) => {
      const { data, error } = await supabase.functions.invoke('modal-analyze', {
        body: { audio_url: input.audio_url }
      });
      if (error) throw error;
      return JSON.stringify(data);
    }
  },
  {
    name: 'separate_stems',
    description: 'Separate audio into stems (vocals, drums, bass, other)',
    parameters: {
      audio_url: { type: 'string', description: 'URL of audio file', required: true },
      stems: { type: 'array', description: 'Stems to extract', required: false }
    },
    execute: async (input) => {
      const { data, error } = await supabase.functions.invoke('modal-separate', {
        body: { audio_url: input.audio_url, stems: input.stems || ['vocals', 'drums', 'bass', 'other'] }
      });
      if (error) throw error;
      return JSON.stringify(data);
    }
  },
  {
    name: 'generate_music',
    description: 'Generate music from text prompt',
    parameters: {
      prompt: { type: 'string', description: 'Description of music to generate', required: true },
      duration: { type: 'number', description: 'Duration in seconds', required: false }
    },
    execute: async (input) => {
      const { data, error } = await supabase.functions.invoke('modal-generate', {
        body: { prompt: input.prompt, duration: input.duration || 30 }
      });
      if (error) throw error;
      return JSON.stringify(data);
    }
  },
  {
    name: 'quantize_audio',
    description: 'Compress audio using SVDQuant with specified bit depth',
    parameters: {
      audio_url: { type: 'string', description: 'URL of audio file', required: true },
      target_bits: { type: 'number', description: 'Target bit depth (4, 8, 16)', required: false }
    },
    execute: async (input) => {
      const { data, error } = await supabase.functions.invoke('modal-quantize', {
        body: { audio_url: input.audio_url, target_bits: input.target_bits || 8 }
      });
      if (error) throw error;
      return JSON.stringify(data);
    }
  },
  {
    name: 'search_web',
    description: 'Search the web for information',
    parameters: {
      query: { type: 'string', description: 'Search query', required: true }
    },
    execute: async (input) => {
      return `Web search results for "${input.query}": [Simulated results - integrate with actual search API]`;
    }
  }
];
