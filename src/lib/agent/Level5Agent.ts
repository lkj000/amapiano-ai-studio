/**
 * Level 5 Autonomous Music Production Agent
 * Full end-to-end AI music creation with Suno + Moises + LANDR capabilities
 * 
 * Level 5 = Complete Autonomy: Can handle complex, multi-step music production
 * tasks from conception to distribution without human intervention.
 */

import { AutonomousAgent, AgentConfig, ExecutionReport, AgentEvent } from './AutonomousAgent';
import { musicProductionTools } from './MusicProductionTools';
import { Tool } from './ReActLoop';
import { supabase } from '@/integrations/supabase/client';

// ============= Human-in-the-Loop Types =============

export type HITLCheckpointType = 
  | 'creative_direction'    // Major creative decisions
  | 'mix_approval'          // Mix balance review
  | 'master_approval'       // Final master review
  | 'release_approval'      // Distribution confirmation
  | 'stem_selection'        // Choose which stems to keep
  | 'variation_selection'   // Pick from multiple options
  | 'lyrics_review'         // Approve/edit lyrics
  | 'arrangement_review';   // Arrangement structure approval

export interface HITLCheckpoint {
  id: string;
  type: HITLCheckpointType;
  title: string;
  description: string;
  options: HITLOption[];
  audioPreviewUrls?: string[];
  metadata?: Record<string, unknown>;
  timeout?: number;  // Auto-proceed after timeout (ms)
  defaultOptionId?: string;  // Used if timeout expires
  createdAt: number;
}

export interface HITLOption {
  id: string;
  label: string;
  description?: string;
  value?: unknown;  // Optional - not needed for simple approve actions
  previewUrl?: string;
  isRecommended?: boolean;
}

export interface HITLResponse {
  checkpointId: string;
  selectedOptionId: string;
  customValue?: unknown;
  feedback?: string;
  respondedAt: number;
}

export type HITLCallback = (checkpoint: HITLCheckpoint) => Promise<HITLResponse>;

export interface MusicProductionGoal {
  type: 
    | 'create_song'           // Full song from scratch
    | 'remix_track'           // Remix existing audio
    | 'master_and_release'    // Master and distribute
    | 'stem_extraction'       // Extract stems from audio
    | 'style_transfer'        // Transform genre/style
    | 'vocal_production'      // Record and process vocals
    | 'beat_production'       // Create instrumental beat
    | 'audio_restoration'     // Clean up/restore audio
    | 'custom';               // Custom goal
  
  input: {
    audioUrl?: string;
    prompt?: string;
    genre?: string;
    bpm?: number;
    key?: string;
    mood?: string;
    lyrics?: string;
    referenceTrack?: string;
    outputFormat?: string;
  };
  
  preferences?: {
    autoMaster?: boolean;
    autoDistribute?: boolean;
    createStems?: boolean;
    targetPlatforms?: string[];
    targetLoudness?: number;
  };
  
  // Human-in-the-Loop configuration
  humanInTheLoop?: {
    enabled: boolean;
    checkpoints?: HITLCheckpointType[];  // Which checkpoints to enable
    autoApproveTimeout?: number;          // Auto-proceed after timeout (ms)
    callback?: HITLCallback;              // Handler for checkpoints
  };
}

export interface Level5Result extends ExecutionReport {
  outputs: {
    audioUrl?: string;
    stemsUrls?: Record<string, string>;
    masteredUrl?: string;
    midiData?: any;
    distributionId?: string;
    projectId?: string;
  };
  metadata: {
    genre: string;
    bpm: number;
    key: string;
    duration: number;
    processingTime: number;
  };
}

export class Level5Agent extends AutonomousAgent {
  private productionContext: Map<string, unknown> = new Map();
  private hitlCallback?: HITLCallback;
  private hitlEnabled: boolean = false;
  private hitlCheckpoints: Set<HITLCheckpointType> = new Set();
  private hitlAutoApproveTimeout: number = 0;
  private pendingCheckpoints: Map<string, HITLCheckpoint> = new Map();
  private checkpointResponses: Map<string, HITLResponse> = new Map();
  
  constructor(config?: Partial<AgentConfig>) {
    super({
      maxSteps: 20,
      maxRetries: 3,
      enableReflection: true,
      enableLearning: true,
      parallelExecution: true,
      ...config
    });
    
    // Register all music production tools
    this.registerTools(musicProductionTools);
    
    // Register meta-tools for complex workflows
    this.registerTools(this.createMetaTools());
    
    // Register HITL tools
    this.registerTools(this.createHITLTools());
  }
  
  /**
   * Configure human-in-the-loop settings
   */
  configureHITL(options: {
    enabled: boolean;
    checkpoints?: HITLCheckpointType[];
    autoApproveTimeout?: number;
    callback?: HITLCallback;
  }): void {
    this.hitlEnabled = options.enabled;
    this.hitlCheckpoints = new Set(options.checkpoints || [
      'creative_direction',
      'mix_approval', 
      'master_approval',
      'release_approval'
    ]);
    this.hitlAutoApproveTimeout = options.autoApproveTimeout || 0;
    this.hitlCallback = options.callback;
  }
  
  /**
   * Set callback for HITL checkpoints
   */
  onCheckpoint(callback: HITLCallback): void {
    this.hitlCallback = callback;
  }
  
  /**
   * Get pending checkpoints awaiting user response
   */
  getPendingCheckpoints(): HITLCheckpoint[] {
    return Array.from(this.pendingCheckpoints.values());
  }
  
  /**
   * Submit response to a checkpoint
   */
  async respondToCheckpoint(response: HITLResponse): Promise<void> {
    const checkpoint = this.pendingCheckpoints.get(response.checkpointId);
    if (!checkpoint) {
      throw new Error(`Checkpoint ${response.checkpointId} not found`);
    }
    
    this.checkpointResponses.set(response.checkpointId, response);
    this.pendingCheckpoints.delete(response.checkpointId);
    
    this.emit({ type: 'log', data: { event: 'checkpoint_responded', checkpoint, response }, timestamp: Date.now() });
  }
  
  private createHITLTools(): Tool[] {
    return [
      {
        name: 'request_creative_feedback',
        description: 'Pause execution and request human feedback on creative direction',
        parameters: {
          title: { type: 'string', description: 'Title of the decision point', required: true },
          description: { type: 'string', description: 'What feedback is needed', required: true },
          options: { type: 'array', description: 'Available options for the user', required: true },
          preview_urls: { type: 'array', description: 'Audio preview URLs', required: false },
          checkpoint_type: { type: 'string', description: 'Type of checkpoint', required: false }
        },
        execute: async (input) => {
          if (!this.hitlEnabled) {
            // Auto-select recommended or first option
            const options = input.options as HITLOption[];
            const selected = options.find(o => o.isRecommended) || options[0];
            return JSON.stringify({ 
              autoApproved: true, 
              selectedOption: selected,
              reason: 'HITL disabled - auto-selected recommended option'
            });
          }
          
          const checkpoint = await this.createCheckpoint(
            String(input.checkpoint_type || 'creative_direction') as HITLCheckpointType,
            String(input.title),
            String(input.description),
            input.options as HITLOption[],
            input.preview_urls as string[]
          );
          
          const response = await this.waitForCheckpointResponse(checkpoint);
          const selectedOption = (input.options as HITLOption[]).find(o => o.id === response.selectedOptionId);
          
          return JSON.stringify({
            approved: true,
            selectedOption,
            feedback: response.feedback,
            customValue: response.customValue
          });
        }
      },
      {
        name: 'request_mix_approval',
        description: 'Request human approval for mix balance and levels',
        parameters: {
          audio_url: { type: 'string', description: 'URL of the mix to review', required: true },
          mix_details: { type: 'object', description: 'Details about the current mix', required: false }
        },
        execute: async (input) => {
          if (!this.hitlEnabled || !this.hitlCheckpoints.has('mix_approval')) {
            return JSON.stringify({ approved: true, autoApproved: true });
          }
          
          const checkpoint = await this.createCheckpoint(
            'mix_approval',
            'Mix Review Required',
            'Please review the current mix and approve or request adjustments.',
            [
              { id: 'approve', label: 'Approve Mix', description: 'Mix sounds good, proceed', isRecommended: true },
              { id: 'louder_vocals', label: 'Louder Vocals', description: 'Increase vocal level', value: { adjust: 'vocals', amount: 3 } },
              { id: 'more_bass', label: 'More Bass', description: 'Increase bass presence', value: { adjust: 'bass', amount: 2 } },
              { id: 'adjust_eq', label: 'Adjust EQ', description: 'General EQ adjustments needed', value: { adjust: 'eq' } }
            ],
            [String(input.audio_url)]
          );
          
          const response = await this.waitForCheckpointResponse(checkpoint);
          return JSON.stringify({
            approved: response.selectedOptionId === 'approve',
            adjustments: response.selectedOptionId !== 'approve' ? response.selectedOptionId : null,
            feedback: response.feedback
          });
        }
      },
      {
        name: 'request_master_approval',
        description: 'Request human approval for mastered audio before release',
        parameters: {
          audio_url: { type: 'string', description: 'URL of mastered audio', required: true },
          master_specs: { type: 'object', description: 'Mastering specifications applied', required: false }
        },
        execute: async (input) => {
          if (!this.hitlEnabled || !this.hitlCheckpoints.has('master_approval')) {
            return JSON.stringify({ approved: true, autoApproved: true });
          }
          
          const checkpoint = await this.createCheckpoint(
            'master_approval',
            'Master Review Required',
            'The track has been mastered. Please review before proceeding to distribution.',
            [
              { id: 'approve', label: 'Approve Master', description: 'Master sounds professional', isRecommended: true },
              { id: 'louder', label: 'Make Louder', description: 'Increase overall loudness', value: { loudness: '+2' } },
              { id: 'softer', label: 'Reduce Loudness', description: 'More dynamic range', value: { loudness: '-2' } },
              { id: 'remaster', label: 'Remaster', description: 'Apply different mastering approach', value: { remaster: true } }
            ],
            [String(input.audio_url)]
          );
          
          const response = await this.waitForCheckpointResponse(checkpoint);
          return JSON.stringify({
            approved: response.selectedOptionId === 'approve',
            adjustment: response.selectedOptionId !== 'approve' ? response.selectedOptionId : null,
            feedback: response.feedback
          });
        }
      },
      {
        name: 'request_release_confirmation',
        description: 'Final confirmation before distributing to platforms',
        parameters: {
          release_details: { type: 'object', description: 'Release metadata and targets', required: true }
        },
        execute: async (input) => {
          if (!this.hitlEnabled || !this.hitlCheckpoints.has('release_approval')) {
            return JSON.stringify({ confirmed: true, autoApproved: true });
          }
          
          const details = input.release_details as Record<string, unknown>;
          const checkpoint = await this.createCheckpoint(
            'release_approval',
            'Confirm Release',
            `Ready to distribute "${details.title || 'Untitled'}" to ${(details.platforms as string[])?.join(', ') || 'all platforms'}.`,
            [
              { id: 'confirm', label: 'Release Now', description: 'Proceed with distribution', isRecommended: true },
              { id: 'schedule', label: 'Schedule Later', description: 'Set a release date', value: { action: 'schedule' } },
              { id: 'cancel', label: 'Cancel', description: 'Do not release', value: { action: 'cancel' } }
            ]
          );
          
          const response = await this.waitForCheckpointResponse(checkpoint);
          return JSON.stringify({
            confirmed: response.selectedOptionId === 'confirm',
            action: response.selectedOptionId,
            feedback: response.feedback
          });
        }
      },
      {
        name: 'select_from_variations',
        description: 'Present multiple generated variations for user to choose from',
        parameters: {
          title: { type: 'string', description: 'What variations represent', required: true },
          variations: { type: 'array', description: 'Array of variation objects with urls and descriptions', required: true }
        },
        execute: async (input) => {
          if (!this.hitlEnabled || !this.hitlCheckpoints.has('variation_selection')) {
            // Auto-select first variation
            const variations = input.variations as Array<{ url: string; description: string }>;
            return JSON.stringify({ selected: variations[0], autoSelected: true });
          }
          
          const variations = input.variations as Array<{ url: string; description: string }>;
          const options: HITLOption[] = variations.map((v, i) => ({
            id: `variation_${i}`,
            label: `Option ${i + 1}`,
            description: v.description,
            previewUrl: v.url,
            value: v,
            isRecommended: i === 0
          }));
          
          const checkpoint = await this.createCheckpoint(
            'variation_selection',
            String(input.title),
            'Multiple variations have been generated. Please select your preferred option.',
            options,
            variations.map(v => v.url)
          );
          
          const response = await this.waitForCheckpointResponse(checkpoint);
          const selectedIndex = parseInt(response.selectedOptionId.replace('variation_', ''));
          
          return JSON.stringify({
            selected: variations[selectedIndex],
            feedback: response.feedback
          });
        }
      }
    ];
  }
  
  private async createCheckpoint(
    type: HITLCheckpointType,
    title: string,
    description: string,
    options: HITLOption[],
    previewUrls?: string[]
  ): Promise<HITLCheckpoint> {
    const checkpoint: HITLCheckpoint = {
      id: `checkpoint_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      title,
      description,
      options,
      audioPreviewUrls: previewUrls,
      timeout: this.hitlAutoApproveTimeout,
      defaultOptionId: options.find(o => o.isRecommended)?.id || options[0]?.id,
      createdAt: Date.now()
    };
    
    this.pendingCheckpoints.set(checkpoint.id, checkpoint);
    this.emit({ type: 'log', data: { event: 'checkpoint_created', checkpoint }, timestamp: Date.now() });
    
    return checkpoint;
  }
  
  private async waitForCheckpointResponse(checkpoint: HITLCheckpoint): Promise<HITLResponse> {
    // If callback is set, use it
    if (this.hitlCallback) {
      try {
        const response = await this.hitlCallback(checkpoint);
        this.checkpointResponses.set(checkpoint.id, response);
        this.pendingCheckpoints.delete(checkpoint.id);
        return response;
      } catch (error) {
        console.error('HITL callback error:', error);
      }
    }
    
    // Otherwise wait for external response with optional timeout
    return new Promise((resolve) => {
      const checkInterval = setInterval(() => {
        const response = this.checkpointResponses.get(checkpoint.id);
        if (response) {
          clearInterval(checkInterval);
          resolve(response);
        }
      }, 100);
      
      // Auto-approve after timeout if configured
      if (checkpoint.timeout && checkpoint.timeout > 0) {
        setTimeout(() => {
          if (!this.checkpointResponses.has(checkpoint.id)) {
            const autoResponse: HITLResponse = {
              checkpointId: checkpoint.id,
              selectedOptionId: checkpoint.defaultOptionId || checkpoint.options[0].id,
              respondedAt: Date.now()
            };
            this.checkpointResponses.set(checkpoint.id, autoResponse);
            this.pendingCheckpoints.delete(checkpoint.id);
            this.emit({ type: 'log', data: { event: 'checkpoint_auto_approved', checkpoint, response: autoResponse }, timestamp: Date.now() });
            clearInterval(checkInterval);
            resolve(autoResponse);
          }
        }, checkpoint.timeout);
      }
    });
  }
  
  private createMetaTools(): Tool[] {
    return [
      {
        name: 'plan_production',
        description: 'Create a detailed production plan for the given goal',
        parameters: {
          goal: { type: 'string', description: 'Production goal description', required: true },
          constraints: { type: 'object', description: 'Any constraints or preferences', required: false }
        },
        execute: async (input) => {
          const plan = await this.createProductionPlan(String(input.goal), input.constraints as Record<string, unknown>);
          return JSON.stringify(plan);
        }
      },
      {
        name: 'quality_check',
        description: 'Perform quality assessment on audio output',
        parameters: {
          audio_url: { type: 'string', description: 'URL of audio to check', required: true },
          criteria: { type: 'array', description: 'Quality criteria to check', required: false }
        },
        execute: async (input) => {
          const result = await this.performQualityCheck(String(input.audio_url), input.criteria as string[]);
          return JSON.stringify(result);
        }
      },
      {
        name: 'iterate_and_improve',
        description: 'Analyze current output and suggest/apply improvements',
        parameters: {
          audio_url: { type: 'string', description: 'Current audio URL', required: true },
          feedback: { type: 'string', description: 'Feedback or issues to address', required: false }
        },
        execute: async (input) => {
          const improvements = await this.suggestImprovements(String(input.audio_url), String(input.feedback || ''));
          return JSON.stringify(improvements);
        }
      },
      {
        name: 'workflow_complete',
        description: 'Finalize workflow and prepare outputs',
        parameters: {
          outputs: { type: 'object', description: 'All generated outputs', required: true }
        },
        execute: async (input) => {
          this.productionContext.set('finalOutputs', input.outputs);
          return JSON.stringify({ status: 'complete', outputs: input.outputs });
        }
      }
    ];
  }
  
  /**
   * Execute a structured music production goal
   */
  async executeProductionGoal(goal: MusicProductionGoal): Promise<Level5Result> {
    const startTime = Date.now();
    
    // Configure HITL from goal if provided
    if (goal.humanInTheLoop) {
      this.configureHITL({
        enabled: goal.humanInTheLoop.enabled,
        checkpoints: goal.humanInTheLoop.checkpoints,
        autoApproveTimeout: goal.humanInTheLoop.autoApproveTimeout,
        callback: goal.humanInTheLoop.callback
      });
    }
    
    // Build natural language goal from structured input
    const naturalGoal = this.buildNaturalGoal(goal);
    
    // Store context
    this.productionContext.set('goal', goal);
    this.productionContext.set('preferences', goal.preferences);
    
    // Execute via parent autonomous agent
    const result = await this.execute(naturalGoal, {
      goalType: goal.type,
      ...goal.input,
      preferences: goal.preferences
    });
    
    // Extract and compile outputs
    const outputs = this.compileOutputs(result);
    const metadata = await this.extractMetadata(outputs.audioUrl || outputs.masteredUrl);
    
    return {
      ...result,
      outputs,
      metadata: {
        genre: goal.input.genre || metadata?.genre || 'Unknown',
        bpm: goal.input.bpm || metadata?.bpm || 120,
        key: goal.input.key || metadata?.key || 'C',
        duration: metadata?.duration || 0,
        processingTime: Date.now() - startTime
      }
    };
  }
  
  /**
   * Quick methods for common operations
   */
  async createSong(prompt: string, options?: Partial<MusicProductionGoal['input']>): Promise<Level5Result> {
    return this.executeProductionGoal({
      type: 'create_song',
      input: { prompt, ...options }
    });
  }
  
  async remixTrack(audioUrl: string, targetGenre: string, options?: Partial<MusicProductionGoal['input']>): Promise<Level5Result> {
    return this.executeProductionGoal({
      type: 'remix_track',
      input: { audioUrl, genre: targetGenre, ...options }
    });
  }
  
  async masterAndRelease(audioUrl: string, metadata: { title: string; artist: string }, options?: Partial<MusicProductionGoal['preferences']>): Promise<Level5Result> {
    return this.executeProductionGoal({
      type: 'master_and_release',
      input: { audioUrl },
      preferences: { autoMaster: true, autoDistribute: true, ...options }
    });
  }
  
  async extractStems(audioUrl: string): Promise<Level5Result> {
    return this.executeProductionGoal({
      type: 'stem_extraction',
      input: { audioUrl },
      preferences: { createStems: true }
    });
  }
  
  async transformStyle(audioUrl: string, targetGenre: string): Promise<Level5Result> {
    return this.executeProductionGoal({
      type: 'style_transfer',
      input: { audioUrl, genre: targetGenre }
    });
  }
  
  async createBeat(genre: string, bpm: number, key: string): Promise<Level5Result> {
    return this.executeProductionGoal({
      type: 'beat_production',
      input: { genre, bpm, key }
    });
  }
  
  // ============= Internal Methods =============
  
  private buildNaturalGoal(goal: MusicProductionGoal): string {
    const goalTemplates: Record<string, (g: MusicProductionGoal) => string> = {
      create_song: (g) => `Create a complete ${g.input.genre || 'Amapiano'} song ${g.input.prompt ? `about: ${g.input.prompt}` : ''}. 
        ${g.input.bpm ? `Tempo: ${g.input.bpm} BPM.` : ''}
        ${g.input.mood ? `Mood: ${g.input.mood}.` : ''}
        ${g.input.lyrics ? `Lyrics provided.` : 'Generate appropriate lyrics.'}
        ${g.preferences?.autoMaster ? 'Master the final track.' : ''}
        ${g.preferences?.autoDistribute ? 'Prepare for distribution.' : ''}`,
      
      remix_track: (g) => `Remix the provided track into ${g.input.genre} style.
        ${g.input.referenceTrack ? 'Use reference track as style guide.' : ''}
        Maintain original energy while transforming the genre.`,
      
      master_and_release: (g) => `Master the audio file for professional release.
        Apply appropriate EQ, compression, and loudness optimization.
        ${g.preferences?.targetLoudness ? `Target: ${g.preferences.targetLoudness} LUFS.` : 'Target: -14 LUFS for streaming.'}
        ${g.preferences?.autoDistribute ? 'Prepare and submit for distribution.' : ''}`,
      
      stem_extraction: (g) => `Extract all stems from the audio file.
        Separate vocals, drums, bass, and other instruments.
        Provide high-quality isolated tracks.`,
      
      style_transfer: (g) => `Transform the audio into ${g.input.genre} style.
        Analyze the source, extract key elements, and resynthesize with target genre characteristics.`,
      
      vocal_production: (g) => `Process and enhance vocals.
        Apply pitch correction, compression, EQ, and effects.
        ${g.input.prompt ? `Specific notes: ${g.input.prompt}` : ''}`,
      
      beat_production: (g) => `Create a ${g.input.genre} instrumental beat at ${g.input.bpm} BPM in ${g.input.key}.
        Include drums, bass, and melodic elements.
        ${g.input.mood ? `Mood: ${g.input.mood}.` : ''}`,
      
      audio_restoration: (g) => `Restore and clean up the audio file.
        Remove noise, fix clipping, and enhance clarity.`,
      
      custom: (g) => g.input.prompt || 'Execute custom music production task.'
    };
    
    const template = goalTemplates[goal.type] || goalTemplates.custom;
    return template(goal);
  }
  
  private async createProductionPlan(goal: string, constraints?: Record<string, unknown>): Promise<object> {
    // Use AI to create a detailed plan
    const { data } = await supabase.functions.invoke('agent-reasoning', {
      body: {
        goal: `Create a step-by-step production plan for: ${goal}`,
        context: { constraints },
        availableTools: musicProductionTools.map(t => t.name)
      }
    });
    
    return data?.plan || { steps: ['Analyze requirements', 'Execute production', 'Quality check', 'Finalize'] };
  }
  
  private async performQualityCheck(audioUrl: string, criteria?: string[]): Promise<object> {
    const defaultCriteria = ['loudness', 'dynamic_range', 'frequency_balance', 'stereo_width', 'clipping'];
    const checkCriteria = criteria || defaultCriteria;
    
    const { data } = await supabase.functions.invoke('analyze-audio', {
      body: { audioUrl, analysisType: 'quality' }
    });
    
    const issues: string[] = [];
    const scores: Record<string, number> = {};
    
    if (data) {
      if (data.peakDb > 0) issues.push('Clipping detected');
      if (data.lufs > -8) issues.push('Too loud - may cause distortion');
      if (data.dynamicRange < 4) issues.push('Over-compressed');
      
      scores.loudness = Math.max(0, 100 - Math.abs(data.lufs + 14) * 5);
      scores.dynamicRange = Math.min(100, data.dynamicRange * 8);
      scores.overall = (scores.loudness + scores.dynamicRange) / 2;
    }
    
    return {
      passed: issues.length === 0,
      issues,
      scores,
      recommendation: issues.length === 0 ? 'Audio meets quality standards' : 'Address issues before release'
    };
  }
  
  private async suggestImprovements(audioUrl: string, feedback: string): Promise<object> {
    const analysis = await this.performQualityCheck(audioUrl);
    
    const suggestions: string[] = [];
    
    if ((analysis as any).issues?.includes('Clipping detected')) {
      suggestions.push('Reduce master volume by 2-3 dB');
    }
    if ((analysis as any).issues?.includes('Over-compressed')) {
      suggestions.push('Reduce compression ratio or increase threshold');
    }
    if (feedback) {
      suggestions.push(`Address user feedback: ${feedback}`);
    }
    
    return {
      currentQuality: analysis,
      suggestions,
      autoFixAvailable: suggestions.length > 0
    };
  }
  
  private compileOutputs(result: ExecutionReport): Level5Result['outputs'] {
    const outputs: Level5Result['outputs'] = {};
    
    // Extract URLs and data from task results
    result.taskResults.forEach((value, key) => {
      try {
        const parsed = JSON.parse(value.output);
        if (parsed.audioUrl) outputs.audioUrl = parsed.audioUrl;
        if (parsed.masteredUrl) outputs.masteredUrl = parsed.masteredUrl;
        if (parsed.stems) outputs.stemsUrls = parsed.stems;
        if (parsed.midiData) outputs.midiData = parsed.midiData;
        if (parsed.distributionId) outputs.distributionId = parsed.distributionId;
        if (parsed.projectId) outputs.projectId = parsed.projectId;
      } catch {
        // Not JSON, skip
      }
    });
    
    // Also check final output
    try {
      const finalParsed = JSON.parse(result.finalOutput);
      Object.assign(outputs, finalParsed);
    } catch {
      // Not JSON
    }
    
    return outputs;
  }
  
  private async extractMetadata(audioUrl?: string): Promise<any> {
    if (!audioUrl) return null;
    
    try {
      const { data } = await supabase.functions.invoke('analyze-audio', {
        body: { audioUrl, analysisType: 'metadata' }
      });
      return data;
    } catch {
      return null;
    }
  }
}

// Export singleton instance
export const level5Agent = new Level5Agent();

// Export convenience functions
export const createSong = (prompt: string, options?: Partial<MusicProductionGoal['input']>) => 
  level5Agent.createSong(prompt, options);

export const remixTrack = (audioUrl: string, targetGenre: string) => 
  level5Agent.remixTrack(audioUrl, targetGenre);

export const masterAndRelease = (audioUrl: string, metadata: { title: string; artist: string }) => 
  level5Agent.masterAndRelease(audioUrl, metadata);

export const extractStems = (audioUrl: string) => 
  level5Agent.extractStems(audioUrl);

export const createBeat = (genre: string, bpm: number, key: string) => 
  level5Agent.createBeat(genre, bpm, key);
