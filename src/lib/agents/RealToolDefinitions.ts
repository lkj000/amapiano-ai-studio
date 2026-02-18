/**
 * Real Tool Definitions for the Autonomous Agent
 * Connects actual platform capabilities to the agent system
 */

import { ToolDefinition } from './ToolChainManager';
import { supabase } from '@/integrations/supabase/client';

// Stem Separation Tool — Routes through Modal GPU backend
export const stemSeparationTool: ToolDefinition = {
  name: 'stem_separation',
  description: 'Separate audio into stems (vocals, drums, bass, other) using Demucs on Modal GPU',
  inputSchema: {
    audioUrl: 'string - URL of the audio file to separate',
    stems: 'array - Stem types to extract (default: vocals, drums, bass, other)'
  },
  outputSchema: {
    stems: 'object - Map of stem names to URLs',
    success: 'boolean'
  },
  execute: async (input: { audioUrl: string; stems?: string[] }) => {
    const { data, error } = await supabase.functions.invoke('modal-separate', {
      body: { 
        audio_url: input.audioUrl, 
        stems: input.stems || ['vocals', 'drums', 'bass', 'other'] 
      }
    });
    
    if (error) throw new Error(`Stem separation failed: ${error.message}`);
    return data;
  },
  retryable: true,
  maxRetries: 2,
  timeout: 300000
};

// Voice Synthesis Tool
export const voiceSynthesisTool: ToolDefinition = {
  name: 'voice_synthesis',
  description: 'Generate speech from text using ElevenLabs TTS',
  inputSchema: {
    text: 'string - Text to convert to speech',
    voiceType: 'string - male, female, or duet',
    style: 'string - smooth, powerful, raspy, or soft'
  },
  outputSchema: {
    audioUrl: 'string - URL of generated audio',
    duration: 'number - Duration in seconds'
  },
  execute: async (input: { text: string; voiceType: string; style: string }) => {
    const { data, error } = await supabase.functions.invoke('generate-song-with-vocals', {
      body: {
        lyrics: input.text,
        voiceType: input.voiceType,
        voiceStyle: input.style
      }
    });
    
    if (error) throw new Error(`Voice synthesis failed: ${error.message}`);
    return data;
  },
  retryable: true,
  maxRetries: 1,
  timeout: 120000
};

// Lyrics Generation Tool
export const lyricsGenerationTool: ToolDefinition = {
  name: 'lyrics_generation',
  description: 'Generate song lyrics in multiple languages using AI',
  inputSchema: {
    language: 'string - Language for lyrics (Zulu, English, etc.)',
    genre: 'string - Music genre (Amapiano, Afrobeat, etc.)',
    theme: 'string - Theme or topic for the lyrics'
  },
  outputSchema: {
    lyrics: 'string - Generated lyrics',
    language: 'string - Language used'
  },
  execute: async (input: { language: string; genre: string; theme: string }) => {
    const prompt = `Generate ${input.genre} song lyrics in ${input.language} about ${input.theme}. 
Include verses, a chorus, and a bridge. Make it authentic to ${input.genre} style.`;
    
    const { data, error } = await supabase.functions.invoke('ai-chat', {
      body: {
        messages: [{ role: 'user', content: prompt }]
      }
    });
    
    if (error) throw new Error(`Lyrics generation failed: ${error.message}`);
    return { lyrics: data.content || data, language: input.language };
  },
  retryable: true,
  maxRetries: 2,
  timeout: 60000
};

// Audio Analysis Tool — Routes through Modal GPU backend (Essentia + Librosa)
export const audioAnalysisTool: ToolDefinition = {
  name: 'audio_analysis',
  description: 'Analyze audio for BPM, key, energy, genre using Essentia/Librosa on Modal GPU',
  inputSchema: {
    audioUrl: 'string - URL of the audio file to analyze',
    analysisType: 'string - Type of analysis: full, quick, genre (default: full)'
  },
  outputSchema: {
    bpm: 'number - Beats per minute',
    key: 'string - Musical key',
    energy: 'number - Energy level 0-1',
    danceability: 'number - Danceability score 0-1',
    genre: 'string - Detected genre',
    spectral_centroid: 'number'
  },
  execute: async (input: { audioUrl: string; analysisType?: string }) => {
    const { data, error } = await supabase.functions.invoke('modal-analyze', {
      body: { 
        audio_url: input.audioUrl, 
        analysis_type: input.analysisType || 'full' 
      }
    });
    
    if (error) throw new Error(`Audio analysis failed: ${error.message}`);
    if (!data || !data.bpm) {
      throw new Error('Audio analysis returned invalid data');
    }
    return data;
  },
  retryable: true,
  maxRetries: 2,
  timeout: 60000 // 60s for GPU cold starts
};

// Amapianorization Tool - Connected to real audio processor
export const amapianorizationTool: ToolDefinition = {
  name: 'amapianorization',
  description: 'Transform audio by adding authentic Amapiano elements',
  inputSchema: {
    audioUrl: 'string - URL of source audio',
    region: 'string - South African region style (Johannesburg, Pretoria, Durban, Cape Town)',
    intensity: 'number - Transformation intensity 0-1',
    elements: 'array - Elements to add (log_drums, percussion, piano, bass, effects)'
  },
  outputSchema: {
    outputUrl: 'string - URL of transformed audio',
    authenticityScore: 'number - Cultural authenticity score 0-100',
    elementsApplied: 'array - List of elements that were applied'
  },
  execute: async (input: { 
    audioUrl: string; 
    region: string; 
    intensity: number; 
    elements: string[] 
  }) => {
    // Import and use real audio processor
    const { amapianorizeAudio } = await import('@/lib/audio/audioProcessor');
    
    const settings = {
      addLogDrum: input.elements.includes('log_drums'),
      logDrumIntensity: input.intensity,
      addPercussion: input.elements.includes('percussion'),
      percussionDensity: input.intensity * 0.8,
      addPianoChords: input.elements.includes('piano'),
      pianoComplexity: input.intensity * 0.7,
      addBassline: input.elements.includes('bass'),
      bassDepth: input.intensity,
      addVocalChops: false,
      vocalChopRate: 0,
      sidechainCompression: input.elements.includes('effects'),
      sidechainAmount: input.intensity * 0.6,
      filterSweeps: input.elements.includes('effects'),
      sweepFrequency: 0.5,
      culturalAuthenticity: 'modern' as const,
      regionalStyle: input.region.toLowerCase().replace(' ', '-') as any
    };

    const result = await amapianorizeAudio({ audioUrl: input.audioUrl }, settings);
    
    return {
      outputUrl: result.processedAudio?.url || input.audioUrl,
      authenticityScore: result.authenticityScore,
      elementsApplied: input.elements,
      region: input.region,
      intensity: input.intensity,
      success: result.success
    };
  },
  retryable: true,
  maxRetries: 1,
  timeout: 180000
};

// Music Generation Tool
export const musicGenerationTool: ToolDefinition = {
  name: 'music_generation',
  description: 'Generate instrumental music based on parameters',
  inputSchema: {
    genre: 'string - Music genre',
    bpm: 'number - Tempo in BPM',
    key: 'string - Musical key',
    duration: 'number - Duration in seconds',
    mood: 'string - Mood/energy description'
  },
  outputSchema: {
    audioUrl: 'string - URL of generated music',
    duration: 'number - Actual duration',
    metadata: 'object - Generation metadata'
  },
  execute: async (input: { 
    genre: string; 
    bpm: number; 
    key: string; 
    duration: number;
    mood: string;
  }) => {
    const { data, error } = await supabase.functions.invoke('generate-music', {
      body: input
    });
    
    if (error) throw new Error(`Music generation failed: ${error.message}`);
    return data;
  },
  retryable: true,
  maxRetries: 1,
  timeout: 300000
};

// Export Stems Tool
export const exportStemsTool: ToolDefinition = {
  name: 'export_stems',
  description: 'Bundle and export audio stems as a ZIP file',
  inputSchema: {
    stems: 'object - Map of stem names to URLs',
    projectName: 'string - Name for the export'
  },
  outputSchema: {
    zipUrl: 'string - URL of the ZIP file',
    fileSize: 'number - Size in bytes'
  },
  execute: async (input: { stems: Record<string, string>; projectName: string }) => {
    const { data, error } = await supabase.functions.invoke('zip-stems', {
      body: {
        stems: input.stems,
        projectName: input.projectName
      }
    });
    
    if (error) throw new Error(`Export failed: ${error.message}`);
    return data;
  },
  retryable: true,
  maxRetries: 1,
  timeout: 120000
};

// Layer Generation Tool - LANDR Layers Style
export const layerGenerationTool: ToolDefinition = {
  name: 'layer_generation',
  description: 'Generate AI instrumental layers (drums, bass, harmony, texture, melody) that fit an existing track',
  inputSchema: {
    layerType: 'string - Type of layer: drums, bass, harmony, texture, melody',
    analysisData: 'object - Track analysis with bpm, key, scale, genre, energy',
    settings: 'object - Generation settings with intensity, complexity, fills, dynamics (0-100)',
    duration: 'number - Duration in seconds (max 30)'
  },
  outputSchema: {
    audioUrl: 'string - URL of generated layer',
    layerType: 'string - Type of layer generated',
    metadata: 'object - Generation metadata including prompt used'
  },
  execute: async (input: { 
    layerType: 'drums' | 'bass' | 'harmony' | 'texture' | 'melody';
    analysisData: { bpm: number; key: string; scale: string; genre?: string; energy?: number };
    settings: { intensity: number; complexity: number; fills: number; dynamics: number };
    duration?: number;
  }) => {
    const { data, error } = await supabase.functions.invoke('generate-layer', {
      body: {
        layerType: input.layerType,
        analysisData: input.analysisData,
        settings: input.settings,
        duration: input.duration || 30
      }
    });
    
    if (error) throw new Error(`Layer generation failed: ${error.message}`);
    return data;
  },
  retryable: true,
  maxRetries: 1,
  timeout: 180000 // 3 minutes
};

// AI Mastering Tool
export const aiMasteringTool: ToolDefinition = {
  name: 'ai_mastering',
  description: 'Master audio using AI for optimal loudness, clarity, and platform-specific optimization',
  inputSchema: {
    audioBase64: 'string - Base64-encoded audio data',
    preset: 'string - Mastering preset (amapiano-club, streaming, punchy)',
    targetPlatform: 'string - Target platform (spotify, apple, youtube, club)',
    settings: 'object - Custom settings for loudness, warmth, clarity, stereoWidth'
  },
  outputSchema: {
    audioUrl: 'string - URL of mastered audio',
    analysis: 'object - Analysis of the mastered track'
  },
  execute: async (input: {
    audioBase64: string;
    preset?: string;
    targetPlatform?: string;
    settings?: { loudness?: number; warmth?: number; clarity?: number; stereoWidth?: number };
  }) => {
    const { data, error } = await supabase.functions.invoke('ai-mastering', {
      body: input
    });
    
    if (error) throw new Error(`AI mastering failed: ${error.message}`);
    return data;
  },
  retryable: true,
  maxRetries: 1,
  timeout: 300000 // 5 minutes
};

// GPU Quantization Tool — SVDQuant on Modal
export const quantizationTool: ToolDefinition = {
  name: 'audio_quantization',
  description: 'Apply SVDQuant phase-coherent quantization on Modal GPU for efficient audio compression',
  inputSchema: {
    audioUrl: 'string - URL of audio to quantize',
    targetBits: 'number - Target bit depth (default: 8)'
  },
  outputSchema: {
    quantized_url: 'string - URL of quantized audio',
    snr_db: 'number - Signal-to-noise ratio',
    compression_ratio: 'number'
  },
  execute: async (input: { audioUrl: string; targetBits?: number }) => {
    const { data, error } = await supabase.functions.invoke('modal-quantize', {
      body: { audio_url: input.audioUrl, target_bits: input.targetBits || 8 }
    });
    
    if (error) throw new Error(`Quantization failed: ${error.message}`);
    return data;
  },
  retryable: true,
  maxRetries: 1,
  timeout: 60000
};

// Autonomous Agent Goal Execution Tool — Modal GPU + LangChain
// Falls back to Modal if Temporal is unavailable
export const agentExecutionTool: ToolDefinition = {
  name: 'agent_goal_execution',
  description: 'Execute autonomous agent goals durably via Temporal Cloud, with Modal GPU fallback',
  inputSchema: {
    goal: 'string - Goal to achieve',
    context: 'object - Context data',
    maxSteps: 'number - Maximum steps (default: 10)',
    durable: 'boolean - Use Temporal durable execution (default: true)'
  },
  outputSchema: {
    output: 'string - Agent output',
    steps: 'array - Execution steps',
    success: 'boolean',
    workflowId: 'string - Temporal workflow ID (if durable)'
  },
  execute: async (input: { goal: string; context?: Record<string, unknown>; maxSteps?: number; durable?: boolean }) => {
    const useDurable = input.durable !== false;

    if (useDurable) {
      try {
        const { temporalWorkflowService } = await import('./TemporalWorkflowService');
        const execution = await temporalWorkflowService.startWorkflow(
          'ProductionWorkflow',
          { goal: input.goal, context: input.context || {}, maxSteps: input.maxSteps || 10 },
        );
        return {
          success: true,
          workflowId: execution.workflowId,
          status: execution.status,
          execution_mode: 'temporal_durable',
          message: `Durable workflow ${execution.workflowId} started on Temporal Cloud`
        };
      } catch (temporalError) {
        console.warn('[AGENT] Temporal unavailable, falling back to Modal:', temporalError);
      }
    }

    // Fallback: direct Modal execution
    const { data, error } = await supabase.functions.invoke('modal-agent', {
      body: { goal: input.goal, context: input.context || {}, max_steps: input.maxSteps || 10 }
    });

    if (error) throw new Error(`Agent execution failed: ${error.message}`);
    return data;
  },
  retryable: true,
  maxRetries: 1,
  timeout: 120000
};

// Temporal Workflow Management Tool
export const temporalWorkflowTool: ToolDefinition = {
  name: 'temporal_workflow',
  description: 'Manage durable Temporal workflows: start, signal, query progress, terminate',
  inputSchema: {
    action: 'string - start | signal | query | describe | terminate | list',
    workflowType: 'string - ProductionWorkflow | MixdownWorkflow | MasteringWorkflow | AnalysisWorkflow | AmapianorizeWorkflow',
    workflowId: 'string - Workflow ID (for signal/query/describe/terminate)',
    input: 'object - Workflow input parameters',
    signalName: 'string - Signal name (for signal action)',
    signalInput: 'object - Signal data',
    queryType: 'string - Query type (for query action)'
  },
  outputSchema: {
    success: 'boolean',
    data: 'object - Response data'
  },
  execute: async (input: {
    action: string;
    workflowType?: string;
    workflowId?: string;
    input?: Record<string, unknown>;
    signalName?: string;
    signalInput?: unknown;
    queryType?: string;
    reason?: string;
  }) => {
    const { temporalWorkflowService } = await import('./TemporalWorkflowService');

    switch (input.action) {
      case 'start':
        if (!input.workflowType) throw new Error('workflowType required');
        return await temporalWorkflowService.startWorkflow(
          input.workflowType as any,
          input.input || {}
        );
      case 'signal':
        if (!input.workflowId || !input.signalName) throw new Error('workflowId and signalName required');
        await temporalWorkflowService.signalWorkflow(input.workflowId, input.signalName, input.signalInput);
        return { success: true };
      case 'query':
        if (!input.workflowId || !input.queryType) throw new Error('workflowId and queryType required');
        return await temporalWorkflowService.queryWorkflow(input.workflowId, input.queryType);
      case 'describe':
        if (!input.workflowId) throw new Error('workflowId required');
        return await temporalWorkflowService.describeWorkflow(input.workflowId);
      case 'terminate':
        if (!input.workflowId) throw new Error('workflowId required');
        await temporalWorkflowService.terminateWorkflow(input.workflowId, input.reason);
        return { success: true };
      case 'list':
        return await temporalWorkflowService.listWorkflows();
      default:
        throw new Error(`Unknown action: ${input.action}`);
    }
  },
  retryable: false,
  maxRetries: 0,
  timeout: 30000
};

// Get all real tool definitions
export const getAllRealTools = (): ToolDefinition[] => [
  stemSeparationTool,
  voiceSynthesisTool,
  lyricsGenerationTool,
  audioAnalysisTool,
  amapianorizationTool,
  musicGenerationTool,
  exportStemsTool,
  layerGenerationTool,
  aiMasteringTool,
  quantizationTool,
  agentExecutionTool,
  temporalWorkflowTool
];

// Get tool by name
export const getRealToolByName = (name: string): ToolDefinition | undefined => {
  return getAllRealTools().find(tool => tool.name === name);
};
