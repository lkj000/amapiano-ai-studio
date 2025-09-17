import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface CreatorWallet {
  id: string;
  user_id: string;
  balance_cents: number;
  currency: string;
  total_earned_cents: number;
  total_withdrawn_cents: number;
  stripe_account_id?: string;
  created_at: string;
  updated_at: string;
}

export interface CreatorEarning {
  id: string;
  creator_id: string;
  post_id?: string;
  amount_cents: number;
  earning_type: string;
  processed_at?: string;
  currency: string;
  created_at: string;
}

export const useCreatorWallet = (userId?: string) => {
  const [wallet, setWallet] = useState<CreatorWallet | null>(null);
  const [earnings, setEarnings] = useState<CreatorEarning[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (userId) {
      fetchWalletData();
      fetchEarnings();
    }
  }, [userId]);

  const fetchWalletData = async () => {
    try {
      const { data, error } = await supabase
        .from('user_wallets')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
        throw error;
      }

      setWallet(data || null);
    } catch (error) {
      console.error('Error fetching wallet:', error);
    }
  };

  const fetchEarnings = async () => {
    try {
      const { data, error } = await supabase
        .from('creator_earnings')
        .select('*')
        .eq('creator_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      setEarnings(data || []);
    } catch (error) {
      console.error('Error fetching earnings:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (cents: number, currency: string = 'usd') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(cents / 100);
  };

  const getEarningsByType = () => {
    const grouped = earnings.reduce((acc, earning) => {
      const type = earning.earning_type;
      if (!acc[type]) {
        acc[type] = { count: 0, total: 0 };
      }
      acc[type].count += 1;
      acc[type].total += earning.amount_cents;
      return acc;
    }, {} as Record<string, { count: number; total: number }>);

    return grouped;
  };

  const getTotalEarningsThisMonth = () => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    return earnings
      .filter(earning => new Date(earning.created_at) >= startOfMonth)
      .reduce((total, earning) => total + earning.amount_cents, 0);
  };

  return {
    wallet,
    earnings,
    loading,
    formatCurrency,
    getEarningsByType,
    getTotalEarningsThisMonth,
    refreshWallet: fetchWalletData,
    refreshEarnings: fetchEarnings
  };
};