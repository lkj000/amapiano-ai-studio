import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface ABTest {
  id: string;
  name: string;
  variants: {
    control: any;
    treatment: any;
  };
  enabled: boolean;
  traffic_allocation: number;
  start_date: string;
  end_date?: string;
}

interface ABTestResult {
  testId: string;
  variant: 'control' | 'treatment';
  userId?: string;
  sessionId: string;
}

export const useABTesting = (user: User | null) => {
  const [activeTests, setActiveTests] = useState<ABTest[]>([]);
  const [userVariants, setUserVariants] = useState<Record<string, 'control' | 'treatment'>>({});
  const [sessionId] = useState(() => Math.random().toString(36).substr(2, 9));

  useEffect(() => {
    // Load active A/B tests
    const loadTests = async () => {
      // Mock A/B tests for demo
      const mockTests: ABTest[] = [
        {
          id: 'aura-sidebar-position',
          name: 'AURA Sidebar Position',
          variants: {
            control: { position: 'right', width: '300px' },
            treatment: { position: 'left', width: '350px' }
          },
          enabled: true,
          traffic_allocation: 50,
          start_date: new Date().toISOString(),
        },
        {
          id: 'generation-ui-layout',
          name: 'Generation UI Layout',
          variants: {
            control: { layout: 'horizontal', showAdvanced: false },
            treatment: { layout: 'vertical', showAdvanced: true }
          },
          enabled: true,
          traffic_allocation: 30,
          start_date: new Date().toISOString(),
        },
        {
          id: 'social-feed-algorithm',
          name: 'Social Feed Algorithm',
          variants: {
            control: { algorithm: 'chronological', boost_factor: 1.0 },
            treatment: { algorithm: 'ai_personalized', boost_factor: 1.5 }
          },
          enabled: true,
          traffic_allocation: 70,
          start_date: new Date().toISOString(),
        }
      ];

      setActiveTests(mockTests);

      // Assign variants to user
      const variants: Record<string, 'control' | 'treatment'> = {};
      mockTests.forEach(test => {
        if (test.enabled) {
          const hash = hashUserId(user?.id || sessionId, test.id);
          const variant = hash < test.traffic_allocation ? 'treatment' : 'control';
          variants[test.id] = variant;
        }
      });

      setUserVariants(variants);
    };

    loadTests();
  }, [user, sessionId]);

  const hashUserId = (userId: string, testId: string): number => {
    let hash = 0;
    const str = userId + testId;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash) % 100;
  };

  const getVariant = (testId: string): 'control' | 'treatment' | null => {
    return userVariants[testId] || null;
  };

  const getTestConfig = (testId: string) => {
    const test = activeTests.find(t => t.id === testId);
    const variant = getVariant(testId);
    
    if (!test || !variant) return null;
    
    return test.variants[variant];
  };

  const trackConversion = async (testId: string, event: string, value?: number) => {
    const variant = getVariant(testId);
    if (!variant) return;

    try {
      // Track conversion event
      await supabase.functions.invoke('track-ab-conversion', {
        body: {
          testId,
          variant,
          event,
          value,
          userId: user?.id,
          sessionId
        }
      });
    } catch (error) {
      console.error('Failed to track A/B test conversion:', error);
    }
  };

  const isFeatureEnabled = (testId: string, feature: string): boolean => {
    const config = getTestConfig(testId);
    return config?.[feature] || false;
  };

  return {
    activeTests,
    getVariant,
    getTestConfig,
    trackConversion,
    isFeatureEnabled,
    userVariants
  };
};