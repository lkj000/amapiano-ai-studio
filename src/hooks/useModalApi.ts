import { useState, useCallback } from 'react';
import { modalApi, AudioAnalysisResult, StemSeparationResult, QuantizationResult, AgentExecutionResult } from '@/services/modalApi';
import { toast } from 'sonner';

export function useModalApi() {
  const [isLoading, setIsLoading] = useState(false);

  const analyzeAudio = useCallback(async (audioUrl: string): Promise<AudioAnalysisResult | null> => {
    setIsLoading(true);
    try {
      const result = await modalApi.analyzeAudio(audioUrl);
      toast.success('Audio analysis complete');
      return result;
    } catch (error) {
      toast.error(`Analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const separateStems = useCallback(async (audioUrl: string): Promise<StemSeparationResult | null> => {
    setIsLoading(true);
    try {
      toast.info('Starting GPU stem separation...');
      const result = await modalApi.separateStems(audioUrl);
      toast.success('Stem separation complete');
      return result;
    } catch (error) {
      toast.error(`Stem separation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const quantizeAudio = useCallback(async (audioUrl: string, targetBits: number = 8): Promise<QuantizationResult | null> => {
    setIsLoading(true);
    try {
      toast.info(`Starting ${targetBits}-bit GPU quantization...`);
      const result = await modalApi.quantizeAudio(audioUrl, targetBits);
      toast.success(`Quantization complete: SNR ${result.snr_db.toFixed(1)}dB`);
      return result;
    } catch (error) {
      toast.error(`Quantization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const executeAgent = useCallback(async (goal: string, context?: Record<string, unknown>): Promise<AgentExecutionResult | null> => {
    setIsLoading(true);
    try {
      toast.info('Executing agent goal...');
      const result = await modalApi.executeAgentGoal(goal, context);
      toast.success('Agent execution complete');
      return result;
    } catch (error) {
      toast.error(`Agent execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const checkHealth = useCallback(async (): Promise<boolean> => {
    try {
      const result = await modalApi.checkHealth();
      return result.status === 'healthy' && result.gpu === true;
    } catch {
      return false;
    }
  }, []);

  return {
    isLoading,
    analyzeAudio,
    separateStems,
    quantizeAudio,
    executeAgent,
    checkHealth,
  };
}
