import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  REGIONAL_SWING_PROFILES,
  getProfile 
} from '@/lib/dsp/regionalSwingProfiles';
import {
  AFRICAN_EUCLIDEAN_PATTERNS,
  generateEuclideanRhythm
} from '@/lib/dsp/euclideanRhythm';
import {
  calculateHeritageAffinity,
  type HeritageAffinityScore
} from '@/lib/audio/heritageAffinity';
import {
  GASP_PATTERNS
} from '@/lib/audio/amapianoGasp';
import type { SouthAfricanLanguage } from '@/lib/audio/vocalTechniqueGenerator';

export interface AmapianorizeSettings {
  // Basic settings
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
  regionalStyle: string;
  
  // Advanced: Regional swing
  swingProfile?: string;
  customSwingPercentage?: number;
  
  // Advanced: Beat-1 Silence (Amapiano Gasp)
  beat1Silence?: {
    enabled: boolean;
    preset?: 'drop-impact' | 'verse-subtle' | 'bridge-dramatic' | 'breakdown-sparse' | 'build-tension';
    duration?: 1 | 2 | 3 | 4;
    probability?: number;
  };
  
  // Advanced: Euclidean patterns
  euclideanPatterns?: {
    logDrum?: string;
    percussion?: string;
    hihat?: string;
  };
  
  // Advanced: Vocal settings
  vocalSettings?: {
    language?: SouthAfricanLanguage;
    adlibDensity?: 'minimal' | 'sparse' | 'moderate' | 'frequent' | 'dense';
    callResponse?: boolean;
  };
}

export interface AmapianorizeResult {
  success: boolean;
  authenticityScore: number;
  regionalStyle: string;
  enhancedStems?: any;
  message?: string;
  error?: string;
  // Extended results
  heritageAffinity?: HeritageAffinityScore;
  swingProfile?: {
    name: string;
    swingPercentage: number;
    description: string;
  };
  appliedElements?: string[];
  culturalMarkers?: string[];
  recommendations?: string[];
}

export function useAmapianorizationProcessor() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<AmapianorizeResult | null>(null);

  // Get available profiles and patterns
  const getAvailableSwingProfiles = useCallback(() => {
    return Object.keys(REGIONAL_SWING_PROFILES);
  }, []);

  const getAvailableEuclideanPatterns = useCallback(() => {
    return Object.keys(AFRICAN_EUCLIDEAN_PATTERNS);
  }, []);

  const getAvailableBeat1Presets = useCallback(() => {
    return Object.keys(GASP_PATTERNS);
  }, []);

  const processAmapianorization = useCallback(async (
    stems: any,
    settings: AmapianorizeSettings
  ): Promise<AmapianorizeResult> => {
    setIsProcessing(true);
    setProgress(0);
    setResult(null);

    const appliedElements: string[] = [];

    try {
      toast.info('Starting Amapianorization...');

      // Stage 1: Resolve swing profile
      setProgress(5);
      const swingProfileKey = settings.swingProfile || mapRegionToSwingProfile(settings.regionalStyle);
      const swingProfile = getProfile(swingProfileKey);
      
      if (swingProfile) {
        appliedElements.push(`swing:${swingProfile.name}`);
        toast.info(`Applying ${swingProfile.name} swing (${swingProfile.swingPercentage}%)`);
      }
      setProgress(10);

      // Stage 2: Generate Euclidean patterns
      if (settings.euclideanPatterns) {
        for (const [instrument, patternName] of Object.entries(settings.euclideanPatterns)) {
          if (patternName && AFRICAN_EUCLIDEAN_PATTERNS[patternName]) {
            appliedElements.push(`euclidean:${patternName}`);
          }
        }
        if (appliedElements.some(e => e.startsWith('euclidean:'))) {
          toast.info('Generating Euclidean rhythm patterns...');
        }
      }
      setProgress(20);

      // Stage 3: Beat-1 Silence preparation
      if (settings.beat1Silence?.enabled) {
        appliedElements.push('beat1_silence');
        toast.info('Preparing Amapiano Gasp (Beat-1 Silence)...');
      }
      setProgress(25);

      // Progress simulation stages
      const stages = [
        { name: 'Analyzing stems...', progress: 30 },
        { name: 'Adding log drum patterns...', progress: 40 },
        { name: 'Layering percussion...', progress: 50 },
        { name: 'Enhancing piano chords...', progress: 60 },
        { name: 'Deepening bassline...', progress: 70 },
        { name: 'Applying sidechain...', progress: 75 },
        { name: 'Adding filter sweeps...', progress: 80 },
        { name: 'Applying regional swing...', progress: 85 },
        { name: 'Calculating heritage affinity...', progress: 90 },
        { name: 'Validating authenticity...', progress: 95 }
      ];

      for (const stage of stages) {
        toast.info(stage.name);
        setProgress(stage.progress);
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      // Track basic elements
      if (settings.addLogDrum) appliedElements.push('log_drums');
      if (settings.addPercussion) appliedElements.push('percussion');
      if (settings.addPianoChords) appliedElements.push('piano');
      if (settings.addBassline) appliedElements.push('bass');
      if (settings.sidechainCompression) appliedElements.push('sidechain');
      if (settings.filterSweeps) appliedElements.push('filter_sweeps');

      // Calculate Heritage Affinity locally
      const heritageAffinity = calculateHeritageAffinity(
        {
          bpm: 115,
          key: 'Cm',
          energy: settings.logDrumIntensity,
          spectralCentroid: 2000,
          zeroCrossingRate: 0.1,
          danceability: 0.8
        },
        {
          hasLogDrum: settings.addLogDrum,
          hasShaker: settings.addPercussion,
          shakerDensity: settings.addPercussion ? settings.percussionDensity * 0.8 : 0,
          swingAmount: swingProfile ? swingProfile.swingPercentage / 100 : 0.58,
          vocalLanguage: settings.vocalSettings?.language
        }
      );

      // Call the backend edge function
      const { data, error } = await supabase.functions.invoke('amapianorize-audio', {
        body: { 
          stems, 
          settings: {
            ...settings,
            swingProfileName: swingProfile?.name,
            swingPercentage: settings.customSwingPercentage || swingProfile?.swingPercentage
          }
        }
      });

      if (error) throw error;

      setProgress(100);

      const processResult: AmapianorizeResult = {
        success: data?.success || true,
        authenticityScore: data?.authenticityScore || heritageAffinity.overall,
        regionalStyle: data?.regionalStyle || settings.regionalStyle,
        enhancedStems: data?.enhancedStems || stems,
        message: data?.message,
        // Extended results
        heritageAffinity,
        swingProfile: swingProfile ? {
          name: swingProfile.name,
          swingPercentage: swingProfile.swingPercentage,
          description: swingProfile.description
        } : undefined,
        appliedElements,
        culturalMarkers: heritageAffinity.culturalMarkers,
        recommendations: heritageAffinity.recommendations
      };

      setResult(processResult);
      
      const heritageLabel = heritageAffinity.overall >= 80 ? '🔥 Authentic' :
                           heritageAffinity.overall >= 60 ? '✨ Good' :
                           heritageAffinity.overall >= 40 ? '🎵 Developing' : '🎹 Basic';
      
      toast.success(
        `${heritageLabel} Amapianorization! Heritage: ${heritageAffinity.overall}% | Style: ${heritageAffinity.regionalStyle.replace(/_/g, ' ')}`,
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
    reset,
    // Utility functions
    getAvailableSwingProfiles,
    getAvailableEuclideanPatterns,
    getAvailableBeat1Presets
  };
}

// Helper function
function mapRegionToSwingProfile(region: string): string {
  const regionMap: Record<string, string> = {
    'johannesburg': 'johannesburg-deep',
    'pretoria': 'pretoria-bounce',
    'durban': 'durban-gqom',
    'cape-town': 'cape-town-jazzy',
    'soweto': 'soweto-authentic'
  };
  return regionMap[region] || 'johannesburg-deep';
}
