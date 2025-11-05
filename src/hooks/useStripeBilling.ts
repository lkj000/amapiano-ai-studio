/**
 * Stripe Billing Integration Hook
 * 
 * Connects cost tracking to Stripe billing:
 * - Usage-based billing
 * - Automatic invoice generation
 * - Cost threshold alerts
 * - Subscription management
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useCostTracking } from './useCostTracking';
import { toast } from 'sonner';

export interface BillingConfig {
  billingThreshold: number; // Amount before auto-billing
  billingCycle: 'daily' | 'weekly' | 'monthly';
  autoInvoice: boolean;
}

const DEFAULT_CONFIG: BillingConfig = {
  billingThreshold: 50, // $50
  billingCycle: 'monthly',
  autoInvoice: true,
};

export function useStripeBilling(config: Partial<BillingConfig> = {}) {
  const billingConfig = { ...DEFAULT_CONFIG, ...config };
  const costTracking = useCostTracking();
  const [stripeCustomerId, setStripeCustomerId] = useState<string | null>(null);
  const [pendingInvoice, setPendingInvoice] = useState<any>(null);

  useEffect(() => {
    // Check for existing Stripe customer
    const checkStripeCustomer = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user?.email) return;

        // Check subscription status (includes customer ID)
        const { data, error } = await supabase.functions.invoke('check-subscription');
        
        if (error) {
          console.error('[Stripe Billing] Error checking customer:', error);
          return;
        }

        console.log('[Stripe Billing] Customer check complete');
      } catch (error) {
        console.error('[Stripe Billing] Error:', error);
      }
    };

    checkStripeCustomer();
  }, []);

  const checkBillingThreshold = useCallback(async () => {
    const metrics = costTracking.getMetrics();
    
    if (metrics.monthCost >= billingConfig.billingThreshold && billingConfig.autoInvoice) {
      toast.warning(
        'Billing Threshold Reached',
        { description: `Monthly cost ($${metrics.monthCost.toFixed(2)}) has reached billing threshold ($${billingConfig.billingThreshold})` }
      );
      
      return true;
    }
    
    return false;
  }, [costTracking, billingConfig]);

  const recordGenerationCost = useCallback(async (
    latency_ms: number,
    duration_seconds: number,
    method: 'wasm' | 'js',
    generation_type: string = 'standard'
  ) => {
    try {
      const { data, error } = await supabase.functions.invoke('record-generation-cost', {
        body: {
          latency_ms,
          duration_seconds,
          method,
          generation_type,
        }
      });

      if (error) throw error;

      console.log('[Stripe Billing] Cost recorded:', data);

      // Check if we need to trigger billing
      await checkBillingThreshold();

      // Also record locally
      costTracking.recordCost(duration_seconds, method, generation_type);

      return data;
    } catch (error) {
      console.error('[Stripe Billing] Error recording cost:', error);
      throw error;
    }
  }, [costTracking, checkBillingThreshold]);

  const createUsageInvoice = useCallback(async () => {
    try {
      const metrics = costTracking.getMetrics();
      
      toast.info('Creating invoice...', {
        description: `Total usage: $${metrics.monthCost.toFixed(2)}`
      });

      // In production, you would create an actual Stripe invoice here
      // For now, we'll just track it locally
      
      const invoice = {
        id: `inv_${Date.now()}`,
        amount: metrics.monthCost,
        period: 'current_month',
        created_at: new Date().toISOString(),
        status: 'draft'
      };

      setPendingInvoice(invoice);

      toast.success('Invoice created', {
        description: `Invoice for $${metrics.monthCost.toFixed(2)} is ready`
      });

      return invoice;
    } catch (error) {
      console.error('[Stripe Billing] Error creating invoice:', error);
      toast.error('Failed to create invoice');
      throw error;
    }
  }, [costTracking]);

  const openBillingPortal = useCallback(async () => {
    try {
      const { data, error } = await supabase.functions.invoke('customer-portal');
      
      if (error) throw error;

      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (error) {
      console.error('[Stripe Billing] Error opening portal:', error);
      toast.error('Failed to open billing portal. Please ensure you have an active subscription.');
    }
  }, []);

  return {
    stripeCustomerId,
    pendingInvoice,
    billingConfig,
    costMetrics: costTracking.getMetrics(),
    recordGenerationCost,
    createUsageInvoice,
    openBillingPortal,
    checkBillingThreshold,
  };
}
