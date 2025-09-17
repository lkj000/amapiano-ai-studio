import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { SocialPost } from './useSocialFeed';

interface PersonalizedFeedOptions {
  user_id?: string;
  limit?: number;
}

export const usePersonalizedFeed = ({ user_id, limit = 10 }: PersonalizedFeedOptions = {}) => {
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const { toast } = useToast();

  const fetchPersonalizedPosts = useCallback(async (pageNum: number = 0, reset: boolean = false) => {
    try {
      setLoading(true);
      
      // Use the personalized feed function
      const { data, error } = await supabase.rpc('get_personalized_feed', {
        p_user_id: user_id || null,
        p_limit: limit,
        p_offset: pageNum * limit
      });

      if (error) throw error;

      // Transform the data to match SocialPost interface
      const transformedPosts = data?.map((post: any) => ({
        ...post,
        creator: null, // Will be fetched separately if needed
        user_interactions: {
          liked: false,
          played: false,
        },
        relevance_score: post.relevance_score
      })) || [];

      if (reset) {
        setPosts(transformedPosts);
      } else {
        setPosts(prev => [...prev, ...transformedPosts]);
      }

      setHasMore(data?.length === limit);
      setPage(pageNum);
    } catch (error) {
      console.error('Error fetching personalized feed:', error);
      toast({
        title: "Error",
        description: "Failed to load personalized feed",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [user_id, limit, toast]);

  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      fetchPersonalizedPosts(page + 1, false);
    }
  }, [loading, hasMore, page, fetchPersonalizedPosts]);

  const refreshFeed = useCallback(() => {
    fetchPersonalizedPosts(0, true);
  }, [fetchPersonalizedPosts]);

  const trackInteraction = useCallback(async (postId: string, interactionType: string, weight: number = 1.0) => {
    if (!user_id) return;

    try {
      await supabase.rpc('update_user_preferences', {
        p_user_id: user_id,
        p_post_id: postId,
        p_interaction_type: interactionType,
        p_weight: weight
      });
    } catch (error) {
      console.error('Error tracking interaction:', error);
    }
  }, [user_id]);

  useEffect(() => {
    fetchPersonalizedPosts(0, true);
  }, [fetchPersonalizedPosts]);

  return {
    posts,
    loading,
    hasMore,
    loadMore,
    refreshFeed,
    trackInteraction
  };
};