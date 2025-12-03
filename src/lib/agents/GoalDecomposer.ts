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
        id: 'analyze-style',
        name: 'Analyze Style Requirements',
        description: `Determine style parameters for ${descriptor || 'authentic'} amapiano`,
        toolRequired: 'styleAnalyzer',
        inputSchema: { style: descriptor || 'authentic', genre: 'amapiano' },
        dependencies: [],
        priority: 1,
        estimatedDuration: 2000,
        status: 'pending'
      },
      {
        id: 'generate-lyrics',
        name: 'Generate Lyrics',
        description: 'Create lyrics in appropriate language and style',
        toolRequired: 'lyricsGenerator',
        inputSchema: { language: 'zulu', style: 'amapiano' },
        dependencies: ['analyze-style'],
        priority: 2,
        estimatedDuration: 5000,
        status: 'pending'
      },
      {
        id: 'select-elements',
        name: 'Select Amapiano Elements',
        description: 'Choose log drums, percussion, and bass elements',
        toolRequired: 'elementSelector',
        inputSchema: { region: 'johannesburg', bpm: 115 },
        dependencies: ['analyze-style'],
        priority: 2,
        estimatedDuration: 3000,
        status: 'pending'
      },
      {
        id: 'generate-vocals',
        name: 'Generate Vocals',
        description: 'Synthesize vocals from lyrics',
        toolRequired: 'vocalSynthesis',
        inputSchema: { voiceType: 'male', style: 'smooth' },
        dependencies: ['generate-lyrics'],
        priority: 3,
        estimatedDuration: 15000,
        status: 'pending'
      },
      {
        id: 'compose-track',
        name: 'Compose Base Track',
        description: 'Create instrumental foundation',
        toolRequired: 'trackComposer',
        inputSchema: { bpm: 115, key: 'Cm' },
        dependencies: ['select-elements'],
        priority: 3,
        estimatedDuration: 10000,
        status: 'pending'
      },
      {
        id: 'mix-audio',
        name: 'Mix Audio',
        description: 'Combine vocals and instrumentals',
        toolRequired: 'audioMixer',
        inputSchema: { levels: 'balanced' },
        dependencies: ['generate-vocals', 'compose-track'],
        priority: 4,
        estimatedDuration: 5000,
        status: 'pending'
      },
      {
        id: 'validate-authenticity',
        name: 'Validate Authenticity',
        description: 'Score cultural and musical authenticity',
        toolRequired: 'authenticityScorer',
        inputSchema: { region: 'johannesburg' },
        dependencies: ['mix-audio'],
        priority: 5,
        estimatedDuration: 3000,
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
        toolRequired: 'lyricsGenerator',
        inputSchema: { topic, language: 'english' },
        dependencies: [],
        priority: 1,
        estimatedDuration: 5000,
        status: 'pending'
      },
      {
        id: 'generate-vocals',
        name: 'Generate Vocals',
        description: 'Synthesize vocals from lyrics',
        toolRequired: 'vocalSynthesis',
        inputSchema: { voiceType: 'auto' },
        dependencies: ['generate-lyrics'],
        priority: 2,
        estimatedDuration: 15000,
        status: 'pending'
      },
      {
        id: 'generate-music',
        name: 'Generate Music',
        description: 'Create instrumental backing',
        toolRequired: 'musicGenerator',
        inputSchema: { style: 'amapiano' },
        dependencies: [],
        priority: 1,
        estimatedDuration: 20000,
        status: 'pending'
      },
      {
        id: 'mix-final',
        name: 'Final Mix',
        description: 'Combine all elements',
        toolRequired: 'audioMixer',
        inputSchema: {},
        dependencies: ['generate-vocals', 'generate-music'],
        priority: 3,
        estimatedDuration: 5000,
        status: 'pending'
      }
    ];
  }

  private decomposeStemSeparation(source: string): Subtask[] {
    return [
      {
        id: 'load-audio',
        name: 'Load Audio',
        description: `Load audio from: ${source}`,
        toolRequired: 'audioLoader',
        inputSchema: { source },
        dependencies: [],
        priority: 1,
        estimatedDuration: 2000,
        status: 'pending'
      },
      {
        id: 'separate-stems',
        name: 'Separate Stems',
        description: 'Run Demucs stem separation',
        toolRequired: 'stemSeparator',
        inputSchema: { model: 'htdemucs' },
        dependencies: ['load-audio'],
        priority: 2,
        estimatedDuration: 120000,
        status: 'pending'
      },
      {
        id: 'export-stems',
        name: 'Export Stems',
        description: 'Save separated stems',
        toolRequired: 'stemExporter',
        inputSchema: { format: 'wav' },
        dependencies: ['separate-stems'],
        priority: 3,
        estimatedDuration: 5000,
        status: 'pending'
      }
    ];
  }

  private decomposeAudioAnalysis(descriptor: string): Subtask[] {
    return [
      {
        id: 'load-audio',
        name: 'Load Audio',
        description: `Load ${descriptor} audio for analysis`,
        toolRequired: 'audioLoader',
        inputSchema: { descriptor },
        dependencies: [],
        priority: 1,
        estimatedDuration: 2000,
        status: 'pending'
      },
      {
        id: 'extract-features',
        name: 'Extract Features',
        description: 'Run Essentia feature extraction',
        toolRequired: 'featureExtractor',
        inputSchema: {},
        dependencies: ['load-audio'],
        priority: 2,
        estimatedDuration: 5000,
        status: 'pending'
      },
      {
        id: 'analyze-musicality',
        name: 'Analyze Musicality',
        description: 'Calculate beat consistency, key stability, etc.',
        toolRequired: 'musicalityAnalyzer',
        inputSchema: {},
        dependencies: ['extract-features'],
        priority: 3,
        estimatedDuration: 3000,
        status: 'pending'
      },
      {
        id: 'generate-report',
        name: 'Generate Report',
        description: 'Compile analysis results',
        toolRequired: 'reportGenerator',
        inputSchema: {},
        dependencies: ['analyze-musicality'],
        priority: 4,
        estimatedDuration: 1000,
        status: 'pending'
      }
    ];
  }

  private decomposeAmapianorization(source: string): Subtask[] {
    return [
      {
        id: 'load-source',
        name: 'Load Source',
        description: `Load ${source} for amapianorization`,
        toolRequired: 'audioLoader',
        inputSchema: { source },
        dependencies: [],
        priority: 1,
        estimatedDuration: 2000,
        status: 'pending'
      },
      {
        id: 'analyze-source',
        name: 'Analyze Source',
        description: 'Extract BPM, key, and characteristics',
        toolRequired: 'featureExtractor',
        inputSchema: {},
        dependencies: ['load-source'],
        priority: 2,
        estimatedDuration: 3000,
        status: 'pending'
      },
      {
        id: 'select-elements',
        name: 'Select Elements',
        description: 'Choose matching amapiano elements',
        toolRequired: 'elementSelector',
        inputSchema: {},
        dependencies: ['analyze-source'],
        priority: 3,
        estimatedDuration: 2000,
        status: 'pending'
      },
      {
        id: 'apply-elements',
        name: 'Apply Elements',
        description: 'Layer log drums, percussion, effects',
        toolRequired: 'amapianorizer',
        inputSchema: {},
        dependencies: ['select-elements'],
        priority: 4,
        estimatedDuration: 10000,
        status: 'pending'
      },
      {
        id: 'score-authenticity',
        name: 'Score Authenticity',
        description: 'Evaluate cultural authenticity',
        toolRequired: 'authenticityScorer',
        inputSchema: {},
        dependencies: ['apply-elements'],
        priority: 5,
        estimatedDuration: 2000,
        status: 'pending'
      }
    ];
  }

  private decomposeGenericProduction(descriptor: string, type: string): Subtask[] {
    return [
      {
        id: 'plan-production',
        name: 'Plan Production',
        description: `Plan ${descriptor} ${type} production`,
        toolRequired: 'productionPlanner',
        inputSchema: { descriptor, type },
        dependencies: [],
        priority: 1,
        estimatedDuration: 2000,
        status: 'pending'
      },
      {
        id: 'generate-content',
        name: 'Generate Content',
        description: 'Create musical content',
        toolRequired: 'musicGenerator',
        inputSchema: { style: descriptor },
        dependencies: ['plan-production'],
        priority: 2,
        estimatedDuration: 15000,
        status: 'pending'
      },
      {
        id: 'process-audio',
        name: 'Process Audio',
        description: 'Apply effects and mixing',
        toolRequired: 'audioProcessor',
        inputSchema: {},
        dependencies: ['generate-content'],
        priority: 3,
        estimatedDuration: 5000,
        status: 'pending'
      }
    ];
  }

  private genericDecomposition(goal: string): DecomposedGoal {
    const subtasks: Subtask[] = [
      {
        id: 'understand-goal',
        name: 'Understand Goal',
        description: `Interpret: ${goal}`,
        toolRequired: 'goalInterpreter',
        inputSchema: { goal },
        dependencies: [],
        priority: 1,
        estimatedDuration: 2000,
        status: 'pending'
      },
      {
        id: 'execute-primary',
        name: 'Execute Primary Action',
        description: 'Perform main task',
        toolRequired: 'generalExecutor',
        inputSchema: { goal },
        dependencies: ['understand-goal'],
        priority: 2,
        estimatedDuration: 10000,
        status: 'pending'
      }
    ];

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
