import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface MarketplacePlugin {
  id: string;
  name: string;
  description: string;
  category: string;
  price_cents: number;
  rating: number;
  downloads: number;
  seller_id: string;
  seller_name?: string;
  image_url?: string;
  tags?: string[];
  created_at: string;
}

export interface PluginReview {
  id: string;
  plugin_id: string;
  user_id: string;
  user_name?: string;
  rating: number;
  title: string;
  content: string;
  verified_purchase: boolean;
  helpful_count: number;
  created_at: string;
}

export const usePluginMarketplace = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const browsePlugins = async (filters?: {
    category?: string;
    search?: string;
    minRating?: number;
    maxPrice?: number;
    sortBy?: 'popular' | 'recent' | 'rating' | 'price';
  }) => {
    setLoading(true);
    try {
      let query = supabase
        .from('marketplace_items')
        .select('*')
        .eq('active', true)
        .eq('category', 'plugin');

      if (filters?.category) {
        query = query.eq('subcategory', filters.category);
      }

      if (filters?.search) {
        query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
      }

      if (filters?.minRating) {
        query = query.gte('rating', filters.minRating);
      }

      if (filters?.maxPrice) {
        query = query.lte('price_cents', filters.maxPrice);
      }

      switch (filters?.sortBy) {
        case 'popular':
          query = query.order('downloads', { ascending: false });
          break;
        case 'recent':
          query = query.order('created_at', { ascending: false });
          break;
        case 'rating':
          query = query.order('rating', { ascending: false });
          break;
        case 'price':
          query = query.order('price_cents', { ascending: true });
          break;
        default:
          query = query.order('downloads', { ascending: false });
      }

      const { data, error } = await query;
      
      if (error) throw error;

      // Fetch seller names
      const sellerIds = [...new Set(data.map(item => item.seller_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, display_name')
        .in('user_id', sellerIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p.display_name]) || []);

      return data.map(item => ({
        ...item,
        seller_name: profileMap.get(item.seller_id) || 'Anonymous'
      })) as MarketplacePlugin[];
    } catch (error) {
      console.error('Error browsing plugins:', error);
      toast({
        title: 'Error',
        description: 'Failed to load plugins',
        variant: 'destructive'
      });
      return [];
    } finally {
      setLoading(false);
    }
  };

  const submitPlugin = async (pluginData: {
    name: string;
    description: string;
    category: string;
    price_cents: number;
    tags: string[];
    code: string;
    parameters: any[];
    framework: string;
    version: string;
  }) => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Create marketplace item
      const { data: item, error: itemError } = await supabase
        .from('marketplace_items')
        .insert({
          name: pluginData.name,
          description: pluginData.description,
          category: 'plugin',
          subcategory: pluginData.category,
          price_cents: pluginData.price_cents,
          tags: pluginData.tags,
          seller_id: user.id,
          active: false // Will be activated after approval
        })
        .select()
        .single();

      if (itemError) throw itemError;

      // Create submission
      const { error: submissionError } = await supabase
        .from('plugin_submissions')
        .insert({
          marketplace_item_id: item.id,
          submitter_id: user.id,
          plugin_data: {
            code: pluginData.code,
            parameters: pluginData.parameters,
            framework: pluginData.framework
          },
          version: pluginData.version,
          approval_status: 'pending'
        });

      if (submissionError) throw submissionError;

      toast({
        title: 'Success',
        description: 'Plugin submitted for review'
      });

      return item;
    } catch (error) {
      console.error('Error submitting plugin:', error);
      toast({
        title: 'Error',
        description: 'Failed to submit plugin',
        variant: 'destructive'
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const purchasePlugin = async (pluginId: string) => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Call edge function to create Stripe checkout
      const { data, error } = await supabase.functions.invoke('create-purchase', {
        body: { item_id: pluginId }
      });

      if (error) throw error;

      // Redirect to Stripe checkout
      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Error purchasing plugin:', error);
      toast({
        title: 'Error',
        description: 'Failed to initiate purchase',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const getPluginReviews = async (pluginId: string) => {
    try {
      const { data, error } = await supabase
        .from('plugin_reviews')
        .select('*')
        .eq('plugin_id', pluginId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch user names
      const userIds = [...new Set(data.map(r => r.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, display_name')
        .in('user_id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p.display_name]) || []);

      return data.map(review => ({
        ...review,
        user_name: profileMap.get(review.user_id) || 'Anonymous'
      })) as PluginReview[];
    } catch (error) {
      console.error('Error fetching reviews:', error);
      return [];
    }
  };

  const submitReview = async (pluginId: string, review: {
    rating: number;
    title: string;
    content: string;
  }) => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Check if user purchased the plugin
      const { data: purchase } = await supabase
        .from('user_purchases')
        .select('id')
        .eq('user_id', user.id)
        .eq('marketplace_item_id', pluginId)
        .single();

      const { error } = await supabase
        .from('plugin_reviews')
        .insert({
          plugin_id: pluginId,
          user_id: user.id,
          rating: review.rating,
          title: review.title,
          content: review.content,
          verified_purchase: !!purchase
        });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Review submitted'
      });
    } catch (error: any) {
      console.error('Error submitting review:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to submit review',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const markReviewHelpful = async (reviewId: string, isHelpful: boolean) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('review_helpfulness')
        .upsert({
          review_id: reviewId,
          user_id: user.id,
          is_helpful: isHelpful
        }, {
          onConflict: 'review_id,user_id'
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error marking review helpful:', error);
    }
  };

  return {
    loading,
    browsePlugins,
    submitPlugin,
    purchasePlugin,
    getPluginReviews,
    submitReview,
    markReviewHelpful
  };
};
