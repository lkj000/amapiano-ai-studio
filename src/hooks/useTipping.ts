import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface TipTransaction {
  id: string;
  tipper_id: string;
  recipient_id: string;
  post_id?: string;
  amount_cents: number;
  currency: string;
  message?: string;
  processed_at?: string;
  status: string;
  created_at: string;
}

export const useTipping = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const sendTip = async (
    recipientId: string,
    postId: string,
    amountCents: number,
    message?: string
  ) => {
    try {
      setLoading(true);

      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        throw new Error('User not authenticated');
      }

      // In a real implementation, this would integrate with Stripe or another payment processor
      // For now, we'll create a mock transaction
      const { data, error } = await supabase.rpc('process_tip', {
        p_tipper_id: user.user.id,
        p_recipient_id: recipientId,
        p_post_id: postId,
        p_amount_cents: amountCents,
        p_message: message || null
      });

      if (error) throw error;

      toast({
        title: "Tip Sent Successfully!",
        description: `Sent ${formatCurrency(amountCents)} to the creator`,
      });

      return data;
    } catch (error) {
      console.error('Error sending tip:', error);
      toast({
        title: "Failed to Send Tip",
        description: "Please try again later",
        variant: "destructive",
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const getTipHistory = async (userId: string, type: 'sent' | 'received') => {
    try {
      const column = type === 'sent' ? 'tipper_id' : 'recipient_id';
      
      const { data, error } = await supabase
        .from('tip_transactions')
        .select(`
          *,
          tipper:profiles!tip_transactions_tipper_id_fkey(display_name, avatar_url),
          recipient:profiles!tip_transactions_recipient_id_fkey(display_name, avatar_url),
          post:social_posts(title, audio_url)
        `)
        .eq(column, userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error fetching tip history:', error);
      return [];
    }
  };

  const formatCurrency = (cents: number, currency: string = 'usd') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(cents / 100);
  };

  return {
    sendTip,
    getTipHistory,
    formatCurrency,
    loading
  };
};