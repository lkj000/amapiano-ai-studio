import { useState, useEffect, useCallback } from 'react';
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

export const useABTesting = (user: User | null) => {
  const [activeTests, setActiveTests] = useState<ABTest[]>([]);
  const [userVariants, setUserVariants] = useState<Record<string, 'control' | 'treatment'>>({});
  const [sessionId] = useState(() => Math.random().toString(36).substr(2, 9));
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const loadTests = async () => {
      setIsLoading(true);
      try {
        // Load A/B tests from database
        const { data, error } = await supabase
          .from('ab_tests' as any)
          .select('*')
          .eq('enabled', true);

        if (error) {
          console.warn('[A/B Testing] No ab_tests table found, A/B testing disabled:', error.message);
          setActiveTests([]);
          return;
        }

        const tests: ABTest[] = (data || []).map((row: any) => ({
          id: row.id,
          name: row.name,
          variants: typeof row.variants === 'string' ? JSON.parse(row.variants) : row.variants,
          enabled: row.enabled,
          traffic_allocation: row.traffic_allocation ?? 50,
          start_date: row.start_date || row.created_at,
          end_date: row.end_date,
        }));

        setActiveTests(tests);

        // Assign variants deterministically based on user/session hash
        const variants: Record<string, 'control' | 'treatment'> = {};
        tests.forEach(test => {
          if (test.enabled) {
            const hash = hashUserId(user?.id || sessionId, test.id);
            const variant = hash < test.traffic_allocation ? 'treatment' : 'control';
            variants[test.id] = variant;
          }
        });

        setUserVariants(variants);
      } catch (error) {
        console.error('[A/B Testing] Failed to load tests:', error);
        setActiveTests([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadTests();
  }, [user, sessionId]);

  const hashUserId = (userId: string, testId: string): number => {
    let hash = 0;
    const str = userId + testId;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash) % 100;
  };

  const getVariant = useCallback((testId: string): 'control' | 'treatment' | null => {
    return userVariants[testId] || null;
  }, [userVariants]);

  const getTestConfig = useCallback((testId: string) => {
    const test = activeTests.find(t => t.id === testId);
    const variant = userVariants[testId];
    if (!test || !variant) return null;
    return test.variants[variant];
  }, [activeTests, userVariants]);

  const trackConversion = useCallback(async (testId: string, event: string, value?: number) => {
    const variant = userVariants[testId];
    if (!variant) return;

    try {
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
  }, [userVariants, user?.id, sessionId]);

  const isFeatureEnabled = useCallback((testId: string, feature: string): boolean => {
    const config = getTestConfig(testId);
    return config?.[feature] || false;
  }, [getTestConfig]);

  return {
    activeTests,
    getVariant,
    getTestConfig,
    trackConversion,
    isFeatureEnabled,
    userVariants,
    isLoading,
  };
};
