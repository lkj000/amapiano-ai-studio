import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface FeatureFlag {
  id: string;
  name: string;
  enabled: boolean;
  rollout_percentage: number;
  user_groups: string[];
  description: string;
}

interface FeatureFlags {
  aura_sidebar: boolean;
  enhanced_style_exchange: boolean;
  ai_model_router: boolean;
  realtime_collaboration: boolean;
  multi_agent_system: boolean;
  cultural_authenticity_engine: boolean;
  micro_royalty_system: boolean;
  voice_ai_guide: boolean;
  neural_music_engine: boolean;
}

const DEFAULT_FLAGS: FeatureFlags = {
  aura_sidebar: true,
  enhanced_style_exchange: true,
  ai_model_router: true,
  realtime_collaboration: true,
  multi_agent_system: true,
  cultural_authenticity_engine: true,
  micro_royalty_system: true,
  voice_ai_guide: true,
  neural_music_engine: true,
};

export const useFeatureFlags = (user: User | null) => {
  const [flags, setFlags] = useState<FeatureFlags>(DEFAULT_FLAGS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFeatureFlags = async () => {
      if (!user) {
        setFlags(DEFAULT_FLAGS);
        setLoading(false);
        return;
      }

    try {
      const { data, error } = await supabase
        .from('feature_flags')
        .select('name, enabled, rollout_percentage, user_groups')
        .eq('enabled', true);

      if (error) throw error;

      if (data && data.length > 0) {
        const userFlags: FeatureFlags = { ...DEFAULT_FLAGS };
        for (const flag of data) {
          const name = flag.name as keyof FeatureFlags;
          if (name in DEFAULT_FLAGS) {
            // Rollout check: use user id hash to determine inclusion
            const userHash = user.id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
            userFlags[name] = (userHash % 100) < flag.rollout_percentage;
          }
        }
        setFlags(userFlags);
      } else {
        setFlags(DEFAULT_FLAGS);
      }
      } catch (error) {
        console.error('Error fetching feature flags:', error);
        setFlags(DEFAULT_FLAGS);
      } finally {
        setLoading(false);
      }
    };

    fetchFeatureFlags();
  }, [user]);

  const isFeatureEnabled = (feature: keyof FeatureFlags): boolean => {
    return flags[feature] || false;
  };

  return {
    flags,
    loading,
    isFeatureEnabled,
  };
};