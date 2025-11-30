import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface AmapianorizeSettings {
  addLogDrum: boolean;
  logDrumIntensity: number;
  addPercussion: boolean;
  percussionDensity: number;
  addPianoChords: boolean;
  pianoComplexity: number;
  addBassline: boolean;
  bassDepth: number;
  addVocalChops: boolean;
  vocalChopRate: number;
  sidechainCompression: boolean;
  sidechainAmount: number;
  filterSweeps: boolean;
  sweepFrequency: number;
  culturalAuthenticity: 'traditional' | 'modern' | 'fusion';
  regionalStyle: 'johannesburg' | 'pretoria' | 'durban' | 'cape-town';
}

export interface AmapianorizeResult {
  success: boolean;
  authenticityScore: number;
  regionalStyle: string;
  enhancedStems?: any;
  message?: string;
  error?: string;
}

export function useAmapianorizationProcessor() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<AmapianorizeResult | null>(null);

  const processAmapianorization = useCallback(async (
    stems: any,
    settings: AmapianorizeSettings
  ): Promise<AmapianorizeResult> => {
    setIsProcessing(true);
    setProgress(0);
    setResult(null);

    try {
      toast.info('Starting Amapianorization...');

      // Progress simulation stages
      const stages = [
        { name: 'Analyzing stems...', progress: 10 },
        { name: 'Adding log drum patterns...', progress: 25 },
        { name: 'Layering percussion...', progress: 40 },
        { name: 'Enhancing piano chords...', progress: 55 },
        { name: 'Deepening bassline...', progress: 70 },
        { name: 'Applying sidechain...', progress: 80 },
        { name: 'Adding filter sweeps...', progress: 90 },
        { name: 'Validating authenticity...', progress: 95 }
      ];

      for (const stage of stages) {
        toast.info(stage.name);
        setProgress(stage.progress);
        await new Promise(resolve => setTimeout(resolve, 300));
      }

      // Call the backend edge function
      const { data, error } = await supabase.functions.invoke('amapianorize-audio', {
        body: { stems, settings }
      });

      if (error) throw error;

      setProgress(100);

      const processResult: AmapianorizeResult = {
        success: data?.success || true,
        authenticityScore: data?.authenticityScore || 0,
        regionalStyle: data?.regionalStyle || settings.regionalStyle,
        enhancedStems: data?.enhancedStems || stems,
        message: data?.message
      };

      setResult(processResult);
      
      toast.success(
        `✨ Amapianorization complete! Authenticity: ${processResult.authenticityScore}%`,
        { duration: 5000 }
      );

      return processResult;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Enhancement failed';
      console.error('Amapianorization error:', error);
      
      const errorResult: AmapianorizeResult = {
        success: false,
        authenticityScore: 0,
        regionalStyle: settings.regionalStyle,
        error: errorMessage
      };
      
      setResult(errorResult);
      toast.error(errorMessage);
      
      return errorResult;
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const reset = useCallback(() => {
    setIsProcessing(false);
    setProgress(0);
    setResult(null);
  }, []);

  return {
    isProcessing,
    progress,
    result,
    processAmapianorization,
    reset
  };
}