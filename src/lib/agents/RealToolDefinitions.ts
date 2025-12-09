/**
 * Real Tool Definitions for the Autonomous Agent
 * Connects actual platform capabilities to the agent system
 */

import { ToolDefinition } from './ToolChainManager';
import { supabase } from '@/integrations/supabase/client';

// Stem Separation Tool
export const stemSeparationTool: ToolDefinition = {
  name: 'stem_separation',
  description: 'Separate audio into stems (vocals, drums, bass, other) using Demucs AI',
  inputSchema: {
    audioUrl: 'string - URL of the audio file to separate'
  },
  outputSchema: {
    predictionId: 'string - ID to poll for results',
    status: 'string - Current status of separation'
  },
  execute: async (input: { audioUrl: string }) => {
    const { data, error } = await supabase.functions.invoke('stem-separation', {
      body: { audioUrl: input.audioUrl }
    });
    
    if (error) throw new Error(`Stem separation failed: ${error.message}`);
    return data;
  },
  retryable: true,
  maxRetries: 2,
  timeout: 300000 // 5 minutes for long-running operation
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

// Audio Analysis Tool
export const audioAnalysisTool: ToolDefinition = {
  name: 'audio_analysis',
  description: 'Analyze audio for BPM, key, energy, and other musical features',
  inputSchema: {
    audioUrl: 'string - URL of the audio file to analyze'
  },
  outputSchema: {
    bpm: 'number - Beats per minute',
    key: 'string - Musical key',
    energy: 'number - Energy level 0-1',
    danceability: 'number - Danceability score 0-1'
  },
  execute: async (input: { audioUrl: string }) => {
    const { data, error } = await supabase.functions.invoke('analyze-audio', {
      body: { audioUrl: input.audioUrl }
    });
    
    if (error) {
      throw new Error(`Audio analysis failed: ${error.message}`);
    }
    
    if (!data || !data.bpm) {
      throw new Error('Audio analysis returned invalid data');
    }
    
    return data;
  },
  retryable: true,
  maxRetries: 1,
  timeout: 30000
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

// Get all real tool definitions
export const getAllRealTools = (): ToolDefinition[] => [
  stemSeparationTool,
  voiceSynthesisTool,
  lyricsGenerationTool,
  audioAnalysisTool,
  amapianorizationTool,
  musicGenerationTool,
  exportStemsTool
];

// Get tool by name
export const getRealToolByName = (name: string): ToolDefinition | undefined => {
  return getAllRealTools().find(tool => tool.name === name);
};
