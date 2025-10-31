import { useState } from 'react';
import { useEssentiaAnalysis, ComprehensiveAnalysis } from './useEssentiaAnalysis';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface UnifiedAnalysisResult {
  // Essentia analysis
  essentia?: ComprehensiveAnalysis;
  
  // Legacy analysis results
  cultural?: {
    score: number;
    details: any;
    recommendations: string[];
  };
  theory?: {
    score: number;
    details: any;
    recommendations: string[];
  };
  commercial?: {
    score: number;
    details: any;
    recommendations: string[];
  };
  
  // Combined metadata
  timestamp: Date;
  source: 'file' | 'url' | 'generated';
}

export const useUnifiedMusicAnalysis = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [analysisStage, setAnalysisStage] = useState('');
  const [result, setResult] = useState<UnifiedAnalysisResult | null>(null);
  
  const { analyzeAudio } = useEssentiaAnalysis();

  /**
   * Perform comprehensive analysis combining Essentia + AI models
   */
  const analyzeComprehensive = async (
    file: File,
    options?: {
      includeCultural?: boolean;
      includeTheory?: boolean;
      includeCommercial?: boolean;
    }
  ): Promise<UnifiedAnalysisResult> => {
    setIsAnalyzing(true);
    setProgress(0);
    setAnalysisStage('Initializing comprehensive analysis...');

    try {
      // Phase 1: Essentia + AI Deep Learning Analysis
      setAnalysisStage('Running Essentia audio analysis...');
      const essentiaResult = await analyzeAudio(file, {
        includeFingerprint: true,
        realtimeCallback: (p) => {
          setProgress(p * 70); // Essentia takes 70% of progress
          if (p < 0.2) setAnalysisStage('Analyzing spectral features...');
          else if (p < 0.4) setAnalysisStage('Analyzing temporal features...');
          else if (p < 0.6) setAnalysisStage('Analyzing tonal features...');
          else if (p < 0.75) setAnalysisStage('Analyzing rhythm...');
          else if (p < 0.85) setAnalysisStage('Analyzing audio quality...');
          else if (p < 0.97) setAnalysisStage('Generating fingerprint...');
          else if (p < 1.0) setAnalysisStage('AI deep learning analysis...');
        }
      });

      // Phase 2: Additional Cultural/Theory/Commercial Analysis (if requested)
      const unifiedResult: UnifiedAnalysisResult = {
        essentia: essentiaResult,
        timestamp: new Date(),
        source: 'file'
      };

      if (options?.includeCultural) {
        setAnalysisStage('Analyzing cultural authenticity...');
        setProgress(75);
        try {
          const { data: culturalData } = await supabase.functions.invoke('music-analysis', {
            body: {
              type: 'cultural_authenticity',
              audioFeatures: essentiaResult,
              analysisParams: {
                genre: 'amapiano',
                cultural_context: 'south_african_house'
              }
            }
          });
          unifiedResult.cultural = culturalData;
        } catch (error) {
          console.error('Cultural analysis failed:', error);
        }
      }

      if (options?.includeTheory) {
        setAnalysisStage('Analyzing music theory...');
        setProgress(85);
        try {
          const { data: theoryData } = await supabase.functions.invoke('music-analysis', {
            body: {
              type: 'music_theory',
              audioFeatures: essentiaResult
            }
          });
          unifiedResult.theory = theoryData;
        } catch (error) {
          console.error('Theory analysis failed:', error);
        }
      }

      if (options?.includeCommercial) {
        setAnalysisStage('Analyzing commercial potential...');
        setProgress(95);
        try {
          const { data: commercialData } = await supabase.functions.invoke('music-analysis', {
            body: {
              type: 'commercial_potential',
              audioFeatures: essentiaResult
            }
          });
          unifiedResult.commercial = commercialData;
        } catch (error) {
          console.error('Commercial analysis failed:', error);
        }
      }

      setProgress(100);
      setAnalysisStage('Analysis complete!');
      setResult(unifiedResult);
      toast.success('🎵 Comprehensive analysis complete with AI insights!');
      
      return unifiedResult;
    } catch (error) {
      console.error('Unified analysis failed:', error);
      toast.error('Analysis failed. Please try again.');
      throw error;
    } finally {
      setIsAnalyzing(false);
    }
  };

  /**
   * Quick analysis with just Essentia + AI models
   */
  const analyzeQuick = async (file: File): Promise<ComprehensiveAnalysis> => {
    setIsAnalyzing(true);
    setAnalysisStage('Quick AI-powered analysis...');
    
    try {
      const essentiaResult = await analyzeAudio(file, {
        includeFingerprint: false,
        realtimeCallback: (p) => {
          setProgress(p * 100);
        }
      });
      
      toast.success('✨ Quick analysis complete!');
      return essentiaResult;
    } catch (error) {
      console.error('Quick analysis failed:', error);
      toast.error('Quick analysis failed. Please try again.');
      throw error;
    } finally {
      setIsAnalyzing(false);
    }
  };

  return {
    analyzeComprehensive,
    analyzeQuick,
    isAnalyzing,
    progress,
    analysisStage,
    result
  };
};
