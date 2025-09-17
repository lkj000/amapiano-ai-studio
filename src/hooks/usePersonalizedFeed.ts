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
  const [userEngagementScore, setUserEngagementScore] = useState(0);
  const [lastInteractionTime, setLastInteractionTime] = useState<Date | null>(null);
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
      // Update interaction timestamp
      setLastInteractionTime(new Date());
      
      // Calculate engagement boost based on interaction type
      const engagementBoost = {
        'play': 1,
        'like': 2, 
        'comment': 3,
        'share': 2,
        'remix': 4,
        'keyboard_next': 0.2,
        'keyboard_prev': 0.1,
        'keyboard_pause': 0.3,
        'dwell_time': 0.5
      }[interactionType] || weight;

      setUserEngagementScore(prev => prev + engagementBoost);

      // Track interaction in database
      await Promise.all([
        supabase.rpc('update_user_preferences', {
          p_user_id: user_id,
          p_post_id: postId,
          p_interaction_type: interactionType,
          p_weight: weight
        }),
        supabase.rpc('track_analytics_event', {
          p_user_id: user_id,
          p_event_type: interactionType,
          p_event_data: { 
            engagement_score: userEngagementScore + engagementBoost,
            session_time: lastInteractionTime ? Date.now() - lastInteractionTime.getTime() : 0
          },
          p_post_id: postId
        })
      ]);

    } catch (error) {
      console.error('Error tracking interaction:', error);
    }
  }, [user_id, userEngagementScore, lastInteractionTime]);

  const trackDwellTime = useCallback(async (postId: string, dwellTimeMs: number) => {
    if (!user_id || dwellTimeMs < 3000) return; // Only track if user spent at least 3 seconds
    
    const dwellWeight = Math.min(dwellTimeMs / 10000, 2); // Max weight of 2 for 20+ seconds
    await trackInteraction(postId, 'dwell_time', dwellWeight);
  }, [user_id, trackInteraction]);

  const getRecommendedPosts = useCallback(async () => {
    if (!user_id) return [];
    
    try {
      const { data, error } = await supabase.rpc('get_personalized_feed', {
        p_user_id: user_id,
        p_limit: 5,
        p_offset: 0
      });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching recommendations:', error);
      return [];
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
    trackInteraction,
    trackDwellTime,
    getRecommendedPosts,
    userEngagementScore
  };
};