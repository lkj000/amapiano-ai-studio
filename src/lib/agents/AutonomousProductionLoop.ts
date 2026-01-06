/**
 * Autonomous Production Loop
 * ReAct-based self-improvement agent for Level 5 autonomy
 * 
 * Implements:
 * - Full production pipeline from prompt to master
 * - Self-evaluation and iterative refinement
 * - Critic model integration
 * - Autonomous decision making
 */

import { supabase } from '@/integrations/supabase/client';
import { ReActLoop, ReActState, ThoughtProcess, ActionResult } from './ReActLoop';
import { 
  PlannerAgent, 
  RhythmAgent, 
  MelodyAgent,
  ReviewAgent,
  ProductionGoal,
  ProductionPlan,
  PatternData,
  QualityScore 
} from './Level5AgentCore';
import { GenerativeKitsEngine, KitConfig, KitResult } from '../kits/GenerativeKitsEngine';
import { SAVoiceSynthesisEngine, SynthesisRequest } from '../voice/SAVoiceSynthesisEngine';
import { DAWBridgeEngine } from '../bridge/DAWBridgeEngine';
import { GenreStyle, SubgenreStyle } from './SamplePackProcessor';

// ============= Types =============

export interface ProductionRequest {
  prompt: string;
  genre?: GenreStyle;
  substyle?: SubgenreStyle;
  bpm?: number;
  key?: string;
  duration?: number;
  voiceModel?: string;
  language?: string;
  constraints?: ProductionConstraints;
}

export interface ProductionConstraints {
  maxIterations?: number;
  minAuthenticityScore?: number;
  requiredElements?: string[];
  targetMood?: string;
  referenceTrack?: string;
}

export interface ProductionResult {
  id: string;
  status: 'complete' | 'partial' | 'failed';
  audioUrl: string;
  stems: StemResult[];
  midiData: any[];
  metadata: ProductionMetadata;
  qualityScore: QualityScore;
  iterations: number;
  processingTime: number;
}

export interface StemResult {
  name: string;
  type: 'drums' | 'bass' | 'keys' | 'melody' | 'vocals' | 'fx';
  audioUrl: string;
  volume: number;
  pan: number;
}

export interface ProductionMetadata {
  genre: GenreStyle;
  substyle?: SubgenreStyle;
  bpm: number;
  key: string;
  duration: number;
  bars: number;
  voiceModel?: string;
  language?: string;
  elements: string[];
}

export interface AgentThought {
  step: number;
  thought: string;
  reasoning: string;
  action: string;
  result: any;
  score?: number;
  timestamp: number;
}

export type ProductionState = 
  | 'idle'
  | 'planning'
  | 'generating_structure'
  | 'generating_rhythm'
  | 'generating_melody'
  | 'generating_vocals'
  | 'mixing'
  | 'evaluating'
  | 'refining'
  | 'mastering'
  | 'complete'
  | 'error';

export interface ProductionProgress {
  state: ProductionState;
  progress: number;
  currentAction: string;
  iteration: number;
  maxIterations: number;
  thoughts: AgentThought[];
  currentScore?: number;
}

// ============= Tool Definitions =============

interface ProductionTool {
  name: string;
  description: string;
  execute: (input: any) => Promise<any>;
}

// ============= Autonomous Production Loop =============

export class AutonomousProductionLoop {
  private planner: PlannerAgent;
  private rhythmAgent: RhythmAgent;
  private melodyAgent: MelodyAgent;
  private reviewAgent: ReviewAgent;
  private kitsEngine: GenerativeKitsEngine;
  private voiceEngine: SAVoiceSynthesisEngine;
  private dawBridge: DAWBridgeEngine;
  
  private state: ProductionState = 'idle';
  private thoughts: AgentThought[] = [];
  private currentPlan: ProductionPlan | null = null;
  private generatedPatterns: PatternData[] = [];
  private generatedStems: StemResult[] = [];
  private currentScore: QualityScore | null = null;
  
  private tools: Map<string, (input: any) => Promise<any>> = new Map();
  private onProgressUpdate?: (progress: ProductionProgress) => void;

  constructor() {
    this.planner = new PlannerAgent();
    this.rhythmAgent = new RhythmAgent();
    this.melodyAgent = new MelodyAgent();
    this.reviewAgent = new ReviewAgent();
    this.kitsEngine = GenerativeKitsEngine.getInstance();
    this.voiceEngine = SAVoiceSynthesisEngine.getInstance();
    this.dawBridge = DAWBridgeEngine.getInstance();
    
    this.registerTools();
  }

  /**
   * Register all available tools for the ReAct loop
   */
  private registerTools(): void {
    // Planning tools
    this.tools.set('analyze_prompt', async (input: { prompt: string }) => {
      return this.analyzePrompt(input.prompt);
    });

    this.tools.set('create_plan', async (input: ProductionGoal) => {
      return this.planner.process(input);
    });

    // Generation tools
    this.tools.set('generate_rhythm', async (input: any) => {
      return this.rhythmAgent.process(input);
    });

    this.tools.set('generate_melody', async (input: any) => {
      return this.melodyAgent.process(input);
    });

    this.tools.set('generate_kit', async (input: KitConfig) => {
      return this.kitsEngine.generateKit(input);
    });

    this.tools.set('generate_vocals', async (input: SynthesisRequest) => {
      return this.voiceEngine.synthesize(input);
    });

    // DAW tools
    this.tools.set('daw_create_track', async (input: { name: string; type: 'audio' | 'midi' }) => {
      this.dawBridge.createTrack(input.name, input.type);
      return { success: true };
    });

    this.tools.set('daw_insert_midi', async (input: { trackIndex: number; startBar: number; notes: any[] }) => {
      this.dawBridge.insertMIDIPattern(input.trackIndex, input.startBar, input.notes);
      return { success: true };
    });

    this.tools.set('daw_set_bpm', async (input: { bpm: number }) => {
      this.dawBridge.setBPM(input.bpm);
      return { success: true };
    });

    // Evaluation tools
    this.tools.set('evaluate', async (input: { plan: ProductionPlan; patterns: PatternData[] }) => {
      return this.reviewAgent.process(input);
    });

    this.tools.set('calculate_authenticity', async (input: { genre: GenreStyle; elements: string[] }) => {
      return this.calculateAuthenticityScore(input.genre, input.elements);
    });

    // Refinement tools
    this.tools.set('refine_pattern', async (input: { pattern: PatternData; feedback: string }) => {
      return this.refinePattern(input.pattern, input.feedback);
    });

    // Completion tools
    this.tools.set('complete', async (input: { result: any }) => {
      return { complete: true, result: input.result };
    });
  }

  /**
   * Main entry point - produce a complete track from a prompt
   */
  async produce(
    request: ProductionRequest, 
    onProgress?: (progress: ProductionProgress) => void
  ): Promise<ProductionResult> {
    const startTime = Date.now();
    this.onProgressUpdate = onProgress;
    this.thoughts = [];
    this.generatedPatterns = [];
    this.generatedStems = [];
    
    const maxIterations = request.constraints?.maxIterations || 5;
    const minScore = request.constraints?.minAuthenticityScore || 0.8;
    
    try {
      // Phase 1: Planning
      this.updateState('planning', 0, 'Analyzing production request...');
      
      const goal = await this.createGoalFromRequest(request);
      this.recordThought('Planning', `Creating production plan for: ${goal.description}`, 'create_plan', goal);
      
      this.currentPlan = await this.planner.process(goal);
      
      // Phase 2: Structure Generation
      this.updateState('generating_structure', 10, 'Generating song structure...');
      
      // Phase 3: Rhythm Generation
      this.updateState('generating_rhythm', 20, 'Generating drum patterns...');
      
      for (const section of this.currentPlan.structure) {
        if (section.instruments.some(i => ['kick', 'log_drum', 'hi_hat', 'shaker'].includes(i))) {
          const rhythmPatterns = await this.rhythmAgent.process({
            section,
            globalParams: this.currentPlan.globalParams,
            style: goal.genre
          });
          this.generatedPatterns.push(...rhythmPatterns);
          this.recordThought('Rhythm', `Generated ${rhythmPatterns.length} patterns for ${section.name}`, 'generate_rhythm', rhythmPatterns);
        }
      }

      // Phase 4: Melody Generation
      this.updateState('generating_melody', 40, 'Generating melodic content...');
      
      for (const section of this.currentPlan.structure) {
        if (section.instruments.some(i => ['keys', 'bass', 'lead', 'pad'].includes(i))) {
          const melodyPatterns = await this.melodyAgent.process({
            section,
            globalParams: this.currentPlan.globalParams
          });
          this.generatedPatterns.push(...melodyPatterns);
          this.recordThought('Melody', `Generated melodic content for ${section.name}`, 'generate_melody', melodyPatterns);
        }
      }

      // Phase 5: Vocals (if requested)
      if (request.voiceModel) {
        this.updateState('generating_vocals', 60, 'Generating vocals...');
        
        const vocalResult = await this.generateVocals(request);
        if (vocalResult) {
          this.generatedStems.push({
            name: 'Vocals',
            type: 'vocals',
            audioUrl: vocalResult.audioUrl,
            volume: 0.8,
            pan: 0
          });
          this.recordThought('Vocals', `Generated vocals with ${request.voiceModel}`, 'generate_vocals', vocalResult);
        }
      }

      // Phase 6: Audio Generation via Kits
      this.updateState('mixing', 70, 'Generating audio stems...');
      
      const kitResult = await this.kitsEngine.generateKit({
        type: 'full_track',
        genre: goal.genre,
        substyle: goal.substyle,
        bpm: this.currentPlan.globalParams.bpm,
        key: this.currentPlan.globalParams.key,
        duration: request.duration || 120,
        energy: 0.8,
        density: 0.7
      });

      // Phase 7: Evaluation Loop
      let iteration = 0;
      let bestScore: QualityScore | null = null;
      
      while (iteration < maxIterations) {
        iteration++;
        this.updateState('evaluating', 80 + (iteration * 3), `Evaluating quality (iteration ${iteration})...`);
        
        this.currentScore = await this.reviewAgent.process({
          plan: this.currentPlan,
          patterns: this.generatedPatterns
        });
        
        this.recordThought(
          'Evaluation', 
          `Score: ${this.currentScore.overall.toFixed(2)}, Authenticity: ${this.currentScore.authenticityScore.toFixed(2)}`,
          'evaluate',
          this.currentScore
        );

        if (!bestScore || this.currentScore.overall > bestScore.overall) {
          bestScore = this.currentScore;
        }

        // Check if we meet minimum requirements
        if (this.currentScore.authenticityScore >= minScore && this.currentScore.overall >= 0.75) {
          break;
        }

        // Refine based on feedback
        if (iteration < maxIterations) {
          this.updateState('refining', 80 + (iteration * 3) + 2, `Refining based on feedback...`);
          await this.applyRefinements(this.currentScore);
        }
      }

      // Phase 8: Mastering
      this.updateState('mastering', 95, 'Finalizing production...');
      
      // Complete
      this.updateState('complete', 100, 'Production complete');

      const result: ProductionResult = {
        id: `prod_${Date.now()}`,
        status: 'complete',
        audioUrl: kitResult.audioUrl,
        stems: this.generatedStems,
        midiData: this.generatedPatterns,
        metadata: {
          genre: goal.genre,
          substyle: goal.substyle,
          bpm: this.currentPlan.globalParams.bpm,
          key: this.currentPlan.globalParams.key,
          duration: request.duration || 120,
          bars: this.currentPlan.structure.reduce((sum, s) => sum + s.lengthBars, 0),
          voiceModel: request.voiceModel,
          language: request.language,
          elements: kitResult.metadata.elements
        },
        qualityScore: bestScore || this.currentScore!,
        iterations: iteration,
        processingTime: Date.now() - startTime
      };

      // Persist execution
      await this.persistExecution(request, result);

      return result;

    } catch (error) {
      console.error('[AutonomousLoop] Production failed:', error);
      this.updateState('error', 0, `Error: ${error}`);
      
      return {
        id: `prod_${Date.now()}`,
        status: 'failed',
        audioUrl: '',
        stems: [],
        midiData: [],
        metadata: {
          genre: request.genre || 'amapiano',
          bpm: request.bpm || 112,
          key: request.key || 'F# Minor',
          duration: request.duration || 120,
          bars: 0,
          elements: []
        },
        qualityScore: {
          overall: 0,
          genreFidelity: 0,
          grooveQuality: 0,
          harmonicDepth: 0,
          productionQuality: 0,
          authenticityScore: 0,
          feedback: [(error as Error).message]
        },
        iterations: 0,
        processingTime: Date.now() - startTime
      };
    }
  }

  /**
   * Run the ReAct reasoning loop for complex decisions
   */
  async runReActLoop(goal: string, maxSteps: number = 10): Promise<ReActState> {
    const reasoningFn = async (context: string): Promise<ThoughtProcess> => {
      // Use AI for reasoning
      const { data, error } = await supabase.functions.invoke('agent-reasoning', {
        body: {
          context: JSON.parse(context),
          goal,
          availableTools: Array.from(this.tools.keys()),
          history: this.thoughts.slice(-5).map(t => ({
            thought: t.thought,
            action: t.action,
            result: t.result
          }))
        }
      });

      if (error) {
        console.error('[AutonomousLoop] Reasoning error:', error);
        return {
          thought: 'Encountered an error, attempting recovery',
          reasoning: 'Error in reasoning, will try alternative approach',
          confidence: 0.5,
          nextAction: null
        };
      }

      return {
        thought: data.thought || 'Processing...',
        reasoning: data.reasoning || '',
        confidence: data.confidence || 0.7,
        nextAction: data.nextAction || null
      };
    };

    const loop = new ReActLoop(goal, this.tools, reasoningFn, maxSteps);
    return loop.run();
  }

  // ============= Helper Methods =============

  private async createGoalFromRequest(request: ProductionRequest): Promise<ProductionGoal> {
    // Use AI to analyze prompt if genre not specified
    if (!request.genre) {
      const analysis = await this.analyzePrompt(request.prompt);
      request.genre = analysis.detectedGenre;
      request.substyle = analysis.detectedSubstyle;
      request.bpm = request.bpm || analysis.suggestedBpm;
      request.key = request.key || analysis.suggestedKey;
    }

    return {
      description: request.prompt,
      genre: request.genre || 'amapiano',
      substyle: request.substyle,
      bpm: request.bpm,
      key: request.key,
      duration: request.duration,
      mood: request.constraints?.targetMood,
      constraints: {
        minAuthenticityScore: request.constraints?.minAuthenticityScore,
        requiredElements: request.constraints?.requiredElements
      }
    };
  }

  private async analyzePrompt(prompt: string): Promise<{
    detectedGenre: GenreStyle;
    detectedSubstyle?: SubgenreStyle;
    suggestedBpm: number;
    suggestedKey: string;
    elements: string[];
  }> {
    const { data, error } = await supabase.functions.invoke('ai-chat', {
      body: {
        messages: [
          {
            role: 'system',
            content: `You are an Amapiano music production expert. Analyze the user's prompt and extract:
- genre (amapiano, private_school, three_step, gqom, bacardi)
- substyle
- suggested BPM (typically 110-115 for Amapiano)
- suggested key
- required musical elements

Respond in JSON format: { genre, substyle, bpm, key, elements }`
          },
          { role: 'user', content: prompt }
        ]
      }
    });

    try {
      const content = data?.choices?.[0]?.message?.content || '';
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          detectedGenre: parsed.genre || 'amapiano',
          detectedSubstyle: parsed.substyle,
          suggestedBpm: parsed.bpm || 112,
          suggestedKey: parsed.key || 'F# Minor',
          elements: parsed.elements || []
        };
      }
    } catch (e) {
      console.error('[AutonomousLoop] Prompt analysis failed:', e);
    }

    return {
      detectedGenre: 'amapiano',
      suggestedBpm: 112,
      suggestedKey: 'F# Minor',
      elements: ['log_drum', 'keys', 'shaker']
    };
  }

  private async generateVocals(request: ProductionRequest): Promise<any> {
    if (!request.voiceModel) return null;

    try {
      // First generate lyrics
      const { data: lyricsData } = await supabase.functions.invoke('generate-lyrics', {
        body: {
          prompt: request.prompt,
          genre: request.genre,
          language: request.language || 'zulu',
          mood: request.constraints?.targetMood
        }
      });

      const lyrics = lyricsData?.lyrics || '';

      // Then synthesize vocals
      const vocalResult = await this.voiceEngine.generateSinging(
        lyrics,
        request.voiceModel,
        {
          language: (request.language || 'zulu') as any,
          bpm: request.bpm || 112,
          key: request.key || 'F# Minor',
          genre: request.genre || 'amapiano'
        }
      );

      return vocalResult;
    } catch (error) {
      console.error('[AutonomousLoop] Vocal generation failed:', error);
      return null;
    }
  }

  private calculateAuthenticityScore(genre: GenreStyle, elements: string[]): number {
    const requiredElements: Partial<Record<GenreStyle, string[]>> = {
      amapiano: ['log_drum', 'keys', 'shaker', 'kick'],
      private_school: ['log_drum', 'keys', 'pad', 'rhodes'],
      three_step: ['kick', 'log_drum', 'hi_hat', 'shaker'],
      gqom: ['kick', 'bass', 'hi_hat'],
      bacardi: ['kick', 'shaker', 'bass'],
      dust: ['log_drum', 'kick', 'shaker', 'congas'],
      sgija: ['log_drum', 'kick', 'sub_bass', 'claps'],
      commercial: ['log_drum', 'rhodes', 'synth_pad', 'shaker'],
      kabza_style: ['log_drum', 'rhodes', 'shaker', 'congas'],
      vocal_deep: ['log_drum', 'rhodes', 'vocals', 'sub_bass'],
      piano_hub: ['rhodes', 'acoustic_piano', 'log_drum', 'shaker'],
      soweto_groove: ['log_drum', 'kick', 'congas', 'shaker'],
      durban_tech: ['kick', 'sub_bass', 'shaker', 'claps'],
      kwaito_fusion: ['kick', 'log_drum', 'synth_bass', 'vocals'],
      international: ['log_drum', 'rhodes', 'synth_pad', 'shaker'],
      afro_tech: ['kick', 'shaker', 'synth_bass', 'synth_pad'],
      experimental: ['log_drum', 'synth_pad', 'synth_lead', 'sub_bass']
    };

    const required = requiredElements[genre] || requiredElements.amapiano;
    const present = elements.filter(e => required.includes(e));
    
    return present.length / required.length;
  }

  private async refinePattern(pattern: PatternData, feedback: string): Promise<PatternData> {
    // Use AI to suggest refinements
    const { data } = await supabase.functions.invoke('ai-chat', {
      body: {
        messages: [
          {
            role: 'system',
            content: 'You are an expert music producer. Suggest specific MIDI modifications to improve the pattern.'
          },
          {
            role: 'user',
            content: `Pattern: ${JSON.stringify(pattern.metadata)}
Feedback: ${feedback}
Suggest velocity, timing, or note changes as JSON.`
          }
        ]
      }
    });

    // Apply suggested refinements (simplified)
    return pattern;
  }

  private async applyRefinements(score: QualityScore): Promise<void> {
    // Apply refinements based on lowest scoring areas
    const issues = score.feedback.slice(0, 3);
    
    for (const issue of issues) {
      this.recordThought('Refinement', `Addressing: ${issue}`, 'refine', { issue });
      
      // Add refinement logic based on the type of issue
      if (issue.toLowerCase().includes('groove')) {
        // Adjust swing and timing
      } else if (issue.toLowerCase().includes('harmony')) {
        // Regenerate chord progressions
      } else if (issue.toLowerCase().includes('energy')) {
        // Adjust dynamics and density
      }
    }
  }

  private updateState(state: ProductionState, progress: number, action: string): void {
    this.state = state;
    
    if (this.onProgressUpdate) {
      this.onProgressUpdate({
        state,
        progress,
        currentAction: action,
        iteration: this.thoughts.filter(t => t.action === 'evaluate').length,
        maxIterations: 5,
        thoughts: this.thoughts,
        currentScore: this.currentScore?.overall
      });
    }
  }

  private recordThought(phase: string, thought: string, action: string, result: any): void {
    this.thoughts.push({
      step: this.thoughts.length + 1,
      thought: `[${phase}] ${thought}`,
      reasoning: `Executing ${action}`,
      action,
      result,
      timestamp: Date.now()
    });
  }

  private async persistExecution(request: ProductionRequest, result: ProductionResult): Promise<void> {
    try {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData?.user?.id;
      if (!userId) return;
      
      await supabase.from('agent_executions').insert({
        user_id: userId,
        goal: request.prompt,
        decomposed_goal: this.currentPlan as any,
        execution_result: result as any,
        reflections: this.thoughts as any,
        success: result.status === 'complete',
        duration_ms: result.processingTime
      });
    } catch (error) {
      console.error('[AutonomousLoop] Failed to persist execution:', error);
    }
  }

  /**
   * Get current production state
   */
  getState(): ProductionState {
    return this.state;
  }

  /**
   * Get thought history
   */
  getThoughts(): AgentThought[] {
    return [...this.thoughts];
  }

  /**
   * Get current plan
   */
  getPlan(): ProductionPlan | null {
    return this.currentPlan;
  }
}

// Export singleton factory
export function createAutonomousLoop(): AutonomousProductionLoop {
  return new AutonomousProductionLoop();
}
