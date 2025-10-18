import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface StyleProfile {
  id: string;
  name: string;
  characteristics: {
    tempo: { min: number; max: number };
    key: string[];
    instruments: string[];
    effects: string[];
    mixing: any;
  };
  embeddings?: number[];
}

interface TransferOptions {
  strength: number; // 0-1, how much of the style to apply
  preserveElements: string[]; // Elements to keep from original
  targetElements: string[]; // Elements to transfer
}

export const useStyleTransfer = () => {
  const [isTransferring, setIsTransferring] = useState(false);
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();

  // Extract style profile from a project
  const extractStyleProfile = useCallback(async (
    projectData: any,
    profileName: string
  ): Promise<StyleProfile> => {
    try {
      const { data, error } = await supabase.functions.invoke('neural-music-generation', {
        body: {
          action: 'extract-style',
          projectData,
          profileName
        }
      });

      if (error) throw error;

      // Save style profile to database
      const { data: savedProfile, error: saveError } = await supabase
        .from('style_profiles' as any)
        .insert({
          name: profileName,
          style_data: data.characteristics,
          genre_tags: data.genres || []
        })
        .select()
        .single();

      if (saveError || !savedProfile) throw saveError || new Error('Failed to save profile');

      return {
        id: (savedProfile as any).id,
        name: profileName,
        characteristics: data.characteristics,
        embeddings: data.embeddings
      };
    } catch (error: any) {
      toast({
        title: "Style Extraction Failed",
        description: error.message,
        variant: "destructive"
      });
      throw error;
    }
  }, [toast]);

  // Transfer style from one project to another
  const transferStyle = useCallback(async (
    sourceStyle: StyleProfile,
    targetProject: any,
    options: TransferOptions
  ): Promise<any> => {
    setIsTransferring(true);
    setProgress(0);

    try {
      toast({
        title: "Style Transfer Started",
        description: `Applying "${sourceStyle.name}" style...`
      });

      // Phase 1: Analyze target project
      setProgress(20);
      const { data: analysis, error: analysisError } = await supabase.functions.invoke(
        'neural-music-generation',
        {
          body: {
            action: 'analyze-project',
            projectData: targetProject
          }
        }
      );

      if (analysisError) throw analysisError;

      // Phase 2: Generate style transfer plan
      setProgress(40);
      const { data: transferPlan, error: planError } = await supabase.functions.invoke(
        'neural-music-generation',
        {
          body: {
            action: 'create-transfer-plan',
            sourceStyle: sourceStyle.characteristics,
            targetAnalysis: analysis,
            options
          }
        }
      );

      if (planError) throw planError;

      // Phase 3: Apply style transformations
      setProgress(60);
      const transformations = [];

      // Apply tempo changes
      if (options.targetElements.includes('tempo')) {
        const tempoTransform = await applyTempoTransfer(
          targetProject,
          sourceStyle.characteristics.tempo,
          options.strength
        );
        transformations.push(tempoTransform);
      }

      setProgress(70);

      // Apply harmonic changes
      if (options.targetElements.includes('harmony')) {
        const harmonyTransform = await applyHarmonyTransfer(
          targetProject,
          sourceStyle.characteristics.key,
          options.strength
        );
        transformations.push(harmonyTransform);
      }

      setProgress(80);

      // Apply mixing style
      if (options.targetElements.includes('mixing')) {
        const mixingTransform = await applyMixingTransfer(
          targetProject,
          sourceStyle.characteristics.mixing,
          options.strength
        );
        transformations.push(mixingTransform);
      }

      setProgress(90);

      // Phase 4: Combine all transformations
      const { data: result, error: combineError } = await supabase.functions.invoke(
        'neural-music-generation',
        {
          body: {
            action: 'combine-transformations',
            originalProject: targetProject,
            transformations,
            preserveElements: options.preserveElements
          }
        }
      );

      if (combineError) throw combineError;

      setProgress(100);

      toast({
        title: "Style Transfer Complete",
        description: `Successfully applied "${sourceStyle.name}" style`
      });

      return result;
    } catch (error: any) {
      toast({
        title: "Style Transfer Failed",
        description: error.message,
        variant: "destructive"
      });
      throw error;
    } finally {
      setIsTransferring(false);
      setProgress(0);
    }
  }, [toast]);

  // Helper functions for specific transformations
  const applyTempoTransfer = async (
    project: any,
    targetTempo: { min: number; max: number },
    strength: number
  ) => {
    const avgTempo = (targetTempo.min + targetTempo.max) / 2;
    const currentTempo = project.bpm || 120;
    const newTempo = currentTempo + (avgTempo - currentTempo) * strength;

    return {
      type: 'tempo',
      from: currentTempo,
      to: newTempo
    };
  };

  const applyHarmonyTransfer = async (
    project: any,
    targetKeys: string[],
    strength: number
  ) => {
    // Select best matching key from target style
    const targetKey = targetKeys[0]; // Simplified - would use more sophisticated matching

    return {
      type: 'harmony',
      targetKey,
      strength
    };
  };

  const applyMixingTransfer = async (
    project: any,
    targetMixing: any,
    strength: number
  ) => {
    return {
      type: 'mixing',
      parameters: targetMixing,
      strength
    };
  };

  // Get style recommendations for a project
  const getStyleRecommendations = useCallback(async (projectData: any) => {
    try {
      const { data, error } = await supabase
        .from('style_profiles' as any)
        .select('*')
        .eq('is_public', true)
        .limit(10);

      if (error) throw error;

      return data;
    } catch (error: any) {
      toast({
        title: "Failed to Load Recommendations",
        description: error.message,
        variant: "destructive"
      });
      return [];
    }
  }, [toast]);

  return {
    isTransferring,
    progress,
    extractStyleProfile,
    transferStyle,
    getStyleRecommendations
  };
};
