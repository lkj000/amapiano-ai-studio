/**
 * Goal Decomposer
 * Breaks high-level goals into actionable subtasks
 * Handles dependency resolution and task ordering
 */

export interface Subtask {
  id: string;
  name: string;
  description: string;
  toolRequired: string;
  inputSchema: Record<string, any>;
  dependencies: string[];
  priority: number;
  estimatedDuration: number;
  status: 'pending' | 'in-progress' | 'completed' | 'failed' | 'skipped';
  output?: any;
}

export interface DecomposedGoal {
  originalGoal: string;
  interpretation: string;
  subtasks: Subtask[];
  executionOrder: string[];
  estimatedTotalDuration: number;
  complexity: 'simple' | 'moderate' | 'complex';
}

export interface GoalTemplate {
  pattern: RegExp;
  decomposition: (match: RegExpMatchArray) => Subtask[];
}

export class GoalDecomposer {
  private templates: GoalTemplate[];
  private availableTools: Set<string>;

  constructor(availableTools: string[]) {
    this.availableTools = new Set(availableTools);
    this.templates = this.initializeTemplates();
  }

  private initializeTemplates(): GoalTemplate[] {
    return [
      // Lyrics generation pattern - matches "Generate ... lyrics"
      {
        pattern: /generate\s+(.+)?\s*lyrics\s+(in\s+)?(\w+)?\s*(about|for|with)?\s*(.+)?/i,
        decomposition: (match) => this.decomposeLyricsGeneration(
          match[3] || 'Zulu', 
          match[5] || 'love and life'
        )
      },
      // Amapiano track creation
      {
        pattern: /create\s+(an?\s+)?(.+)?\s*amapiano\s+track/i,
        decomposition: (match) => this.decomposeAmapianoCreation(match[2] || '')
      },
      // Song generation with lyrics
      {
        pattern: /generate\s+(a\s+)?song\s+(about|with|for)\s+(.+)/i,
        decomposition: (match) => this.decomposeSongGeneration(match[3])
      },
      // Stem separation workflow
      {
        pattern: /separate\s+(the\s+)?stems?\s+(from|of|for)\s+(.+)/i,
        decomposition: (match) => this.decomposeStemSeparation(match[3])
      },
      // Audio analysis
      {
        pattern: /analyze\s+(the\s+)?(.+)?\s*(audio|track|song|music)/i,
        decomposition: (match) => this.decomposeAudioAnalysis(match[2] || '')
      },
      // Amapianorization
      {
        pattern: /amapianorize\s+(.+)/i,
        decomposition: (match) => this.decomposeAmapianorization(match[1])
      },
      // Generic music production
      {
        pattern: /produce\s+(a\s+)?(.+)?\s*(track|song|beat)/i,
        decomposition: (match) => this.decomposeGenericProduction(match[2] || '', match[3])
      }
    ];
  }

  private decomposeLyricsGeneration(language: string, theme: string): Subtask[] {
    return [
      {
        id: 'generate-lyrics',
        name: 'Generate Lyrics',
        description: `Create ${language} lyrics about ${theme}`,
        toolRequired: 'lyrics_generation',
        inputSchema: { language, theme, genre: 'Amapiano' },
        dependencies: [],
        priority: 1,
        estimatedDuration: 5000,
        status: 'pending'
      },
      {
        id: 'synthesize-vocals',
        name: 'Synthesize Vocals',
        description: 'Convert lyrics to speech',
        toolRequired: 'voice_synthesis',
        inputSchema: { voiceType: 'male', style: 'smooth' },
        dependencies: ['generate-lyrics'],
        priority: 2,
        estimatedDuration: 15000,
        status: 'pending'
      }
    ];
  }

  decompose(goal: string): DecomposedGoal {
    // Try to match against templates
    for (const template of this.templates) {
      const match = goal.match(template.pattern);
      if (match) {
        const subtasks = template.decomposition(match);
        return this.buildDecomposedGoal(goal, subtasks);
      }
    }

    // Fallback to generic decomposition
    return this.genericDecomposition(goal);
  }

  private buildDecomposedGoal(goal: string, subtasks: Subtask[]): DecomposedGoal {
    // Filter out tasks requiring unavailable tools
    const validSubtasks = subtasks.filter(task => 
      this.availableTools.has(task.toolRequired) || task.toolRequired === 'none'
    );

    // Calculate execution order based on dependencies
    const executionOrder = this.topologicalSort(validSubtasks);

    // Calculate total duration
    const estimatedTotalDuration = validSubtasks.reduce(
      (sum, task) => sum + task.estimatedDuration, 0
    );

    // Determine complexity
    const complexity = validSubtasks.length <= 2 ? 'simple' 
      : validSubtasks.length <= 5 ? 'moderate' : 'complex';

    return {
      originalGoal: goal,
      interpretation: this.interpretGoal(goal, validSubtasks),
      subtasks: validSubtasks,
      executionOrder,
      estimatedTotalDuration,
      complexity
    };
  }

  private decomposeAmapianoCreation(descriptor: string): Subtask[] {
    return [
      {
        id: 'generate-lyrics',
        name: 'Generate Lyrics',
        description: 'Create lyrics in appropriate language and style',
        toolRequired: 'lyrics_generation',
        inputSchema: { language: 'Zulu', theme: descriptor || 'love and dancing', genre: 'Amapiano' },
        dependencies: [],
        priority: 1,
        estimatedDuration: 5000,
        status: 'pending'
      },
      {
        id: 'generate-vocals',
        name: 'Generate Vocals',
        description: 'Synthesize vocals from lyrics',
        toolRequired: 'voice_synthesis',
        inputSchema: { voiceType: 'male', style: 'smooth' },
        dependencies: ['generate-lyrics'],
        priority: 2,
        estimatedDuration: 15000,
        status: 'pending'
      },
      {
        id: 'compose-track',
        name: 'Compose Base Track',
        description: 'Create instrumental foundation',
        toolRequired: 'music_generation',
        inputSchema: { genre: 'Amapiano', bpm: 115, key: 'Cm', duration: 180, mood: descriptor || 'upbeat' },
        dependencies: [],
        priority: 1,
        estimatedDuration: 10000,
        status: 'pending'
      },
      {
        id: 'apply-amapiano',
        name: 'Apply Amapiano Elements',
        description: 'Add log drums and cultural elements',
        toolRequired: 'amapianorization',
        inputSchema: { region: 'Johannesburg', intensity: 0.8, elements: ['log_drums', 'percussion', 'bass'] },
        dependencies: ['compose-track'],
        priority: 3,
        estimatedDuration: 10000,
        status: 'pending'
      }
    ];
  }

  private decomposeSongGeneration(topic: string): Subtask[] {
    return [
      {
        id: 'generate-lyrics',
        name: 'Generate Lyrics',
        description: `Create lyrics about: ${topic}`,
        toolRequired: 'lyrics_generation',
        inputSchema: { theme: topic, language: 'English', genre: 'Amapiano' },
        dependencies: [],
        priority: 1,
        estimatedDuration: 5000,
        status: 'pending'
      },
      {
        id: 'generate-vocals',
        name: 'Generate Vocals',
        description: 'Synthesize vocals from lyrics',
        toolRequired: 'voice_synthesis',
        inputSchema: { voiceType: 'male', style: 'smooth' },
        dependencies: ['generate-lyrics'],
        priority: 2,
        estimatedDuration: 15000,
        status: 'pending'
      },
      {
        id: 'generate-music',
        name: 'Generate Music',
        description: 'Create instrumental backing',
        toolRequired: 'music_generation',
        inputSchema: { genre: 'Amapiano', bpm: 115, key: 'Am', duration: 180, mood: 'upbeat' },
        dependencies: [],
        priority: 1,
        estimatedDuration: 20000,
        status: 'pending'
      }
    ];
  }

  private decomposeStemSeparation(source: string): Subtask[] {
    return [
      {
        id: 'separate-stems',
        name: 'Separate Stems',
        description: `Separate stems from: ${source}`,
        toolRequired: 'stem_separation',
        inputSchema: { audioUrl: source },
        dependencies: [],
        priority: 1,
        estimatedDuration: 120000,
        status: 'pending'
      },
      {
        id: 'export-stems',
        name: 'Export Stems',
        description: 'Bundle and export stems as ZIP',
        toolRequired: 'export_stems',
        inputSchema: { projectName: 'separated_stems' },
        dependencies: ['separate-stems'],
        priority: 2,
        estimatedDuration: 5000,
        status: 'pending'
      }
    ];
  }

  private decomposeAudioAnalysis(descriptor: string): Subtask[] {
    return [
      {
        id: 'analyze-audio',
        name: 'Analyze Audio',
        description: `Analyze ${descriptor} audio for BPM, key, and features`,
        toolRequired: 'audio_analysis',
        inputSchema: { audioUrl: descriptor || 'sample.mp3' },
        dependencies: [],
        priority: 1,
        estimatedDuration: 10000,
        status: 'pending'
      }
    ];
  }

  private decomposeAmapianorization(source: string): Subtask[] {
    return [
      {
        id: 'analyze-source',
        name: 'Analyze Source',
        description: 'Extract BPM, key, and characteristics',
        toolRequired: 'audio_analysis',
        inputSchema: { audioUrl: source },
        dependencies: [],
        priority: 1,
        estimatedDuration: 5000,
        status: 'pending'
      },
      {
        id: 'apply-amapiano',
        name: 'Apply Amapiano Elements',
        description: 'Layer log drums, percussion, effects',
        toolRequired: 'amapianorization',
        inputSchema: { 
          audioUrl: source, 
          region: 'Johannesburg', 
          intensity: 0.8, 
          elements: ['log_drums', 'percussion', 'bass', 'effects'] 
        },
        dependencies: ['analyze-source'],
        priority: 2,
        estimatedDuration: 15000,
        status: 'pending'
      }
    ];
  }

  private decomposeGenericProduction(descriptor: string, type: string): Subtask[] {
    return [
      {
        id: 'generate-content',
        name: 'Generate Content',
        description: `Create ${descriptor} ${type}`,
        toolRequired: 'music_generation',
        inputSchema: { genre: descriptor || 'Amapiano', bpm: 115, key: 'Cm', duration: 180, mood: 'upbeat' },
        dependencies: [],
        priority: 1,
        estimatedDuration: 15000,
        status: 'pending'
      }
    ];
  }

  private genericDecomposition(goal: string): DecomposedGoal {
    // Try to infer best tool from goal keywords
    const hasLyrics = /lyrics?|words|text|write/i.test(goal);
    const hasVoice = /voice|vocal|sing|speech/i.test(goal);
    const hasMusic = /music|track|beat|song|instrumental/i.test(goal);
    const hasAnalysis = /analyz|detect|extract|feature/i.test(goal);

    const subtasks: Subtask[] = [];

    if (hasLyrics) {
      subtasks.push({
        id: 'generate-lyrics',
        name: 'Generate Lyrics',
        description: `Generate lyrics for: ${goal}`,
        toolRequired: 'lyrics_generation',
        inputSchema: { language: 'English', theme: goal, genre: 'Amapiano' },
        dependencies: [],
        priority: 1,
        estimatedDuration: 5000,
        status: 'pending'
      });
    }

    if (hasVoice) {
      subtasks.push({
        id: 'synthesize-voice',
        name: 'Synthesize Voice',
        description: 'Generate vocals',
        toolRequired: 'voice_synthesis',
        inputSchema: { text: goal, voiceType: 'male', style: 'smooth' },
        dependencies: hasLyrics ? ['generate-lyrics'] : [],
        priority: hasLyrics ? 2 : 1,
        estimatedDuration: 15000,
        status: 'pending'
      });
    }

    if (hasMusic) {
      subtasks.push({
        id: 'generate-music',
        name: 'Generate Music',
        description: `Create music for: ${goal}`,
        toolRequired: 'music_generation',
        inputSchema: { genre: 'Amapiano', bpm: 115, key: 'Cm', duration: 180, mood: 'upbeat' },
        dependencies: [],
        priority: 1,
        estimatedDuration: 20000,
        status: 'pending'
      });
    }

    if (hasAnalysis) {
      subtasks.push({
        id: 'analyze-audio',
        name: 'Analyze Audio',
        description: `Analyze: ${goal}`,
        toolRequired: 'audio_analysis',
        inputSchema: { audioUrl: 'input.mp3' },
        dependencies: [],
        priority: 1,
        estimatedDuration: 10000,
        status: 'pending'
      });
    }

    // If no specific tools detected, use lyrics generation as default
    if (subtasks.length === 0) {
      subtasks.push({
        id: 'default-lyrics',
        name: 'Generate Content',
        description: `Create content for: ${goal}`,
        toolRequired: 'lyrics_generation',
        inputSchema: { language: 'English', theme: goal, genre: 'Amapiano' },
        dependencies: [],
        priority: 1,
        estimatedDuration: 5000,
        status: 'pending'
      });
    }

    return this.buildDecomposedGoal(goal, subtasks);
  }

  private topologicalSort(subtasks: Subtask[]): string[] {
    const taskMap = new Map(subtasks.map(t => [t.id, t]));
    const visited = new Set<string>();
    const result: string[] = [];

    const visit = (taskId: string) => {
      if (visited.has(taskId)) return;
      visited.add(taskId);
      
      const task = taskMap.get(taskId);
      if (task) {
        for (const dep of task.dependencies) {
          visit(dep);
        }
        result.push(taskId);
      }
    };

    // Sort by priority first, then topologically
    const sortedByPriority = [...subtasks].sort((a, b) => a.priority - b.priority);
    for (const task of sortedByPriority) {
      visit(task.id);
    }

    return result;
  }

  private interpretGoal(goal: string, subtasks: Subtask[]): string {
    const taskNames = subtasks.map(t => t.name).join(', ');
    return `To achieve "${goal}", I will: ${taskNames}`;
  }
}
