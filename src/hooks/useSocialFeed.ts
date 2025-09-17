import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface SocialPost {
  id: string;
  creator_id: string;
  title: string;
  description?: string;
  audio_url: string;
  preview_url?: string;
  cover_image_url?: string;
  duration_seconds?: number;
  genre_tags: string[];
  ai_model_used?: string;
  generation_params: any;
  is_remix: boolean;
  original_post_id?: string;
  remix_style?: string;
  play_count: number;
  like_count: number;
  comment_count: number;
  remix_count: number;
  share_count: number;
  is_featured: boolean;
  visibility: string;
  created_at: string;
  updated_at: string;
  creator?: {
    display_name: string;
    avatar_url?: string;
  };
  is_liked?: boolean;
  user_interactions?: {
    liked: boolean;
    played: boolean;
  };
}

export const useSocialFeed = () => {
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const { toast } = useToast();

  const fetchPosts = async (pageNum: number = 0, reset: boolean = false) => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('social_posts')
        .select(`
          *,
          profiles!social_posts_creator_id_fkey(display_name, avatar_url)
        `)
        .eq('visibility', 'public')
        .order('created_at', { ascending: false })
        .range(pageNum * 10, (pageNum + 1) * 10 - 1);

      if (error) throw error;

      const postsWithInteractions = data?.map(post => ({
        ...post,
        creator: Array.isArray(post.profiles) ? post.profiles[0] : post.profiles,
        user_interactions: {
          liked: false,
          played: false,
        }
      })) || [];

      if (reset) {
        setPosts(postsWithInteractions);
      } else {
        setPosts(prev => [...prev, ...postsWithInteractions]);
      }

      setHasMore(data?.length === 10);
      setPage(pageNum);
    } catch (error) {
      console.error('Error fetching posts:', error);
      toast({
        title: "Error",
        description: "Failed to load social feed",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadMore = () => {
    if (!loading && hasMore) {
      fetchPosts(page + 1, false);
    }
  };

  const refreshFeed = () => {
    fetchPosts(0, true);
  };

  useEffect(() => {
    fetchPosts(0, true);
  }, []);

  return {
    posts,
    loading,
    hasMore,
    loadMore,
    refreshFeed
  };
};

export const useSocialInteractions = () => {
  const { toast } = useToast();

  const likePost = async (postId: string) => {
    try {
      const { data: existingLike } = await supabase
        .from('post_interactions')
        .select('id')
        .eq('post_id', postId)
        .eq('interaction_type', 'like')
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
        .maybeSingle();

      if (existingLike) {
        // Unlike
        await supabase
          .from('post_interactions')
          .delete()
          .eq('id', existingLike.id);
      } else {
        // Like
        await supabase
          .from('post_interactions')
          .insert({
            post_id: postId,
            user_id: (await supabase.auth.getUser()).data.user?.id,
            interaction_type: 'like'
          });
      }

      return !existingLike;
    } catch (error) {
      console.error('Error liking post:', error);
      toast({
        title: "Error",
        description: "Failed to like post",
        variant: "destructive",
      });
      return false;
    }
  };

  const playPost = async (postId: string) => {
    try {
      // Record play interaction
      await supabase
        .from('post_interactions')
        .upsert({
          post_id: postId,
          user_id: (await supabase.auth.getUser()).data.user?.id,
          interaction_type: 'play'
        });
    } catch (error) {
      console.error('Error recording play:', error);
    }
  };

  const sharePost = async (postId: string) => {
    try {
      await supabase
        .from('post_interactions')
        .insert({
          post_id: postId,
          user_id: (await supabase.auth.getUser()).data.user?.id,
          interaction_type: 'share'
        });

      toast({
        title: "Success",
        description: "Post shared successfully",
      });
    } catch (error) {
      console.error('Error sharing post:', error);
      toast({
        title: "Error",
        description: "Failed to share post",
        variant: "destructive",
      });
    }
  };

  return {
    likePost,
    playPost,
    sharePost
  };
};