import { supabase } from "@/integrations/supabase/client";

// Modal Backend API Service
// Routes through Supabase Edge Functions → Modal GPU Backend

const MODAL_API_BASE = import.meta.env.VITE_MODAL_API_URL || 'https://mabgwej--aura-x-backend-fastapi-app.modal.run';

export interface AudioAnalysisResult {
  bpm: number;
  key: string;
  scale: string;
  genre: string;
  energy: number;
  danceability: number;
  spectral_centroid: number;
  mfcc: number[];
  success: boolean;
}

export interface StemSeparationResult {
  stems: Record<string, string>;
  success: boolean;
}

export interface QuantizationResult {
  quantized_url: string;
  snr_db: number;
  fad: number;
  compression_ratio: number;
  success: boolean;
}

export interface AgentExecutionResult {
  output: string;
  steps: Array<{ thought: string; action: string; result: string }>;
  success: boolean;
}

class ModalApiService {
  /**
   * Analyze audio using Essentia and Librosa on GPU
   */
  async analyzeAudio(audioUrl: string, analysisType: string = "full"): Promise<AudioAnalysisResult> {
    const { data, error } = await supabase.functions.invoke('modal-analyze', {
      body: { audio_url: audioUrl, analysis_type: analysisType }
    });
    
    if (error) throw new Error(`Analysis failed: ${error.message}`);
    return data;
  }

  /**
   * Separate audio into stems using Demucs on GPU
   */
  async separateStems(
    audioUrl: string, 
    stems: string[] = ["vocals", "drums", "bass", "other"]
  ): Promise<StemSeparationResult> {
    const { data, error } = await supabase.functions.invoke('modal-separate', {
      body: { audio_url: audioUrl, stems }
    });
    
    if (error) throw new Error(`Stem separation failed: ${error.message}`);
    return data;
  }

  /**
   * Apply SVDQuant phase-coherent quantization on GPU
   */
  async quantizeAudio(audioUrl: string, targetBits: number = 8): Promise<QuantizationResult> {
    const { data, error } = await supabase.functions.invoke('modal-quantize', {
      body: { audio_url: audioUrl, target_bits: targetBits }
    });
    
    if (error) throw new Error(`Quantization failed: ${error.message}`);
    return data;
  }

  /**
   * Execute autonomous agent goal using LangChain on GPU
   */
  async executeAgentGoal(
    goal: string, 
    context: Record<string, unknown> = {}, 
    maxSteps: number = 10
  ): Promise<AgentExecutionResult> {
    const { data, error } = await supabase.functions.invoke('modal-agent', {
      body: { goal, context, max_steps: maxSteps }
    });
    
    if (error) throw new Error(`Agent execution failed: ${error.message}`);
    return data;
  }

  /**
   * Check backend health status
   */
  async checkHealth(): Promise<{ status: string; gpu: boolean }> {
    const response = await fetch(`${MODAL_API_BASE}/health`);
    return response.json();
  }
}

export const modalApi = new ModalApiService();
