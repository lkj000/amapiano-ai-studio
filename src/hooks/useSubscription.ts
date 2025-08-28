import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';

export type SubscriptionTier = 'free' | 'producer' | 'professional' | 'enterprise';

export interface SubscriptionState {
  subscribed: boolean;
  subscription_tier: SubscriptionTier;
  subscription_end: string | null;
  loading: boolean;
  error: string | null;
}

export const useSubscription = (user: User | null) => {
  const [subscriptionState, setSubscriptionState] = useState<SubscriptionState>({
    subscribed: false,
    subscription_tier: 'free',
    subscription_end: null,
    loading: false,
    error: null,
  });

  const checkSubscription = useCallback(async () => {
    if (!user) {
      setSubscriptionState({
        subscribed: false,
        subscription_tier: 'free', 
        subscription_end: null,
        loading: false,
        error: null,
      });
      return;
    }

    setSubscriptionState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const { data, error } = await supabase.functions.invoke('check-subscription');
      
      if (error) throw error;

      setSubscriptionState({
        subscribed: data.subscribed || false,
        subscription_tier: data.subscription_tier || 'free',
        subscription_end: data.subscription_end || null,
        loading: false,
        error: null,
      });
    } catch (error) {
      console.error('Subscription check failed:', error);
      setSubscriptionState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to check subscription',
      }));
    }
  }, [user]);

  const createSubscription = useCallback(async (tier: SubscriptionTier) => {
    if (!user) throw new Error('Must be logged in to subscribe');

    const { data, error } = await supabase.functions.invoke('create-subscription', {
      body: { tier }
    });

    if (error) throw error;
    return data;
  }, [user]);

  const openCustomerPortal = useCallback(async () => {
    if (!user) throw new Error('Must be logged in to access customer portal');

    const { data, error } = await supabase.functions.invoke('customer-portal');
    if (error) throw error;
    
    // Open in new tab
    window.open(data.url, '_blank');
  }, [user]);

  // Feature access helpers
  const hasFeature = useCallback((feature: string): boolean => {
    const { subscription_tier } = subscriptionState;
    
    const features = {
      'unlimited_projects': ['producer', 'professional', 'enterprise'],
      'basic_vst_plugins': ['producer', 'professional', 'enterprise'],
      'sample_library': ['producer', 'professional', 'enterprise'],
      'premium_vst_plugins': ['professional', 'enterprise'],
      'advanced_effects': ['professional', 'enterprise'],
      'multitrack_routing': ['professional', 'enterprise'],
      'collaboration_tools': ['enterprise'],
      'elastic_audio': ['professional', 'enterprise'],
      'midi_controller': ['producer', 'professional', 'enterprise'],
      'automation_lanes': ['professional', 'enterprise'],
      'batch_processing': ['enterprise'],
    };

    return features[feature]?.includes(subscription_tier) || false;
  }, [subscriptionState.subscription_tier]);

  const getFeatureLimit = useCallback((feature: string): number => {
    const { subscription_tier } = subscriptionState;
    
    const limits = {
      'max_projects': {
        'free': 3,
        'producer': Infinity,
        'professional': Infinity,
        'enterprise': Infinity,
      },
      'max_tracks_per_project': {
        'free': 8,
        'producer': 32,
        'professional': 64,
        'enterprise': Infinity,
      },
      'max_plugins_per_track': {
        'free': 2,
        'producer': 8,
        'professional': 16,
        'enterprise': Infinity,
      },
    };

    return limits[feature]?.[subscription_tier] || 0;
  }, [subscriptionState.subscription_tier]);

  // Check subscription on user change and periodically
  useEffect(() => {
    checkSubscription();
    
    // Auto-refresh every 30 seconds if user is logged in
    const interval = user ? setInterval(checkSubscription, 30000) : null;
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [user, checkSubscription]);

  return {
    ...subscriptionState,
    checkSubscription,
    createSubscription,
    openCustomerPortal,
    hasFeature,
    getFeatureLimit,
  };
};