import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Heart, 
  MessageCircle, 
  Share2, 
  Music, 
  Play, 
  Pause, 
  Download,
  MoreHorizontal,
  TrendingUp,
  Clock,
  Users,
  Headphones
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { User } from '@supabase/supabase-js';
import { toast } from 'sonner';
import { cn } from "@/lib/utils";

interface SocialPost {
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
  play_count: number;
  like_count: number;
  comment_count: number;
  remix_count: number;
  share_count: number;
  is_featured: boolean;
  visibility: string;
  created_at: string;
  creator_display_name?: string;
  creator_avatar_url?: string;
}

interface SocialFeedManagerProps {
  user: User | null;
  className?: string;
  feedType?: 'discover' | 'following' | 'trending';
  maxPosts?: number;
}

export const SocialFeedManager: React.FC<SocialFeedManagerProps> = ({
  user,
  className,
  feedType = 'discover',
  maxPosts = 20
}) => {
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null);
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [followedUsers, setFollowedUsers] = useState<Set<string>>(new Set());
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadingRef = useRef<HTMLDivElement>(null);

  // Load posts based on feed type
  const loadPosts = useCallback(async (pageNum: number = 0, append: boolean = false) => {
    if (!user && feedType === 'following') return;
    
    setLoading(true);
    try {
      const offset = pageNum * maxPosts;
      
      // Use Supabase function for personalized feed
      const { data, error } = await supabase.functions.invoke('get-personalized-feed', {
        body: {
          userId: user?.id,
          feedType,
          limit: maxPosts,
          offset
        }
      });

      if (error) throw error;

      const newPosts = data?.posts || [];
      
      if (append) {
        setPosts(prev => [...prev, ...newPosts]);
      } else {
        setPosts(newPosts);
      }
      
      setHasMore(newPosts.length === maxPosts);
      
    } catch (error) {
      console.error('Failed to load posts:', error);
      
      // Fallback to mock data for demo
      const mockPosts = generateMockPosts(pageNum, maxPosts);
      if (append) {
        setPosts(prev => [...prev, ...mockPosts]);
      } else {
        setPosts(mockPosts);
      }
    } finally {
      setLoading(false);
    }
  }, [user, feedType, maxPosts]);

  // Generate mock posts for demo
  const generateMockPosts = (pageNum: number, limit: number): SocialPost[] => {
    const mockGenres = ['Classic Amapiano', 'Private School', 'Deep Amapiano', 'Vocal'];
    const mockArtists = ['DJ Maphorisa', 'Kabza De Small', 'Kelvin Momo', 'Focalistic', 'Babalwa M'];
    const mockTitles = [
      'Midnight Vibes', 'Johannesburg Dreams', 'Township Sunrise', 'Piano Stories',
      'Deep Thoughts', 'Sunday Sessions', 'Street Sounds', 'Cultural Fusion'
    ];

    return Array.from({ length: limit }, (_, i) => {
      const id = `mock-${pageNum}-${i}`;
      const artistIndex = (pageNum * limit + i) % mockArtists.length;
      const titleIndex = (pageNum * limit + i) % mockTitles.length;
      
      return {
        id,
        creator_id: `creator-${artistIndex}`,
        title: `${mockTitles[titleIndex]} ${pageNum + 1}.${i + 1}`,
        description: `A soulful ${mockGenres[i % mockGenres.length].toLowerCase()} track with authentic South African flavors`,
        audio_url: `https://mywijmtszelyutssormy.supabase.co/functions/v1/demo-audio-files/track-${i % 5}`,
        preview_url: `https://mywijmtszelyutssormy.supabase.co/functions/v1/demo-audio-files/preview-${i % 5}`,
        cover_image_url: `https://picsum.photos/300/300?random=${pageNum * limit + i}`,
        duration_seconds: 180 + Math.floor(Math.random() * 120),
        genre_tags: [mockGenres[i % mockGenres.length]],
        ai_model_used: 'Amapiano AI v2.1',
        play_count: Math.floor(Math.random() * 10000),
        like_count: Math.floor(Math.random() * 1000),
        comment_count: Math.floor(Math.random() * 100),
        remix_count: Math.floor(Math.random() * 50),
        share_count: Math.floor(Math.random() * 200),
        is_featured: Math.random() > 0.8,
        visibility: 'public',
        created_at: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
        creator_display_name: mockArtists[artistIndex],
        creator_avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${mockArtists[artistIndex]}`
      };
    });
  };

  // Handle post interactions
  const handleLike = async (postId: string) => {
    if (!user) {
      toast.error('Please login to like posts');
      return;
    }

    try {
      const isLiked = likedPosts.has(postId);
      
      // Optimistic update
      setLikedPosts(prev => {
        const newSet = new Set(prev);
        if (isLiked) {
          newSet.delete(postId);
        } else {
          newSet.add(postId);
        }
        return newSet;
      });

      setPosts(prev => prev.map(post => 
        post.id === postId 
          ? { ...post, like_count: post.like_count + (isLiked ? -1 : 1) }
          : post
      ));

      // Update like status in database
      const { error } = await supabase
        .from('social_posts')
        .update({ 
          like_count: isLiked 
            ? Math.max(0, posts.find(p => p.id === postId)?.like_count - 1 || 0)
            : (posts.find(p => p.id === postId)?.like_count || 0) + 1
        })
        .eq('id', postId);

      if (error) {
        console.error('Error updating like status:', error);
        // Revert optimistic update
        setLikedPosts(prev => {
          const newSet = new Set(prev);
          if (isLiked) {
            newSet.add(postId);
          } else {
            newSet.delete(postId);
          }
          return newSet;
        });
        setPosts(prev => prev.map(post => 
          post.id === postId 
            ? { ...post, like_count: post.like_count + (isLiked ? 1 : -1) }
            : post
        ));
        toast.error('Failed to update like status');
        return;
      }

      toast.success(isLiked ? 'Post unliked' : 'Post liked');
      
    } catch (error) {
      console.error('Failed to toggle like:', error);
      toast.error('Failed to update like status');
    }
  };

  const handlePlay = async (postId: string, audioUrl: string) => {
    try {
      if (currentlyPlaying === postId) {
        // Pause current track
        if (audioRef.current) {
          audioRef.current.pause();
        }
        setCurrentlyPlaying(null);
        return;
      }

      // Play new track
      if (audioRef.current) {
        audioRef.current.src = audioUrl;
        await audioRef.current.play();
        setCurrentlyPlaying(postId);
        
        // Track play analytics
        setPosts(prev => prev.map(post => 
          post.id === postId 
            ? { ...post, play_count: post.play_count + 1 }
            : post
        ));
      }
    } catch (error) {
      console.error('Failed to play audio:', error);
      toast.error('Failed to play audio');
    }
  };

  const handleShare = async (postId: string) => {
    try {
      const post = posts.find(p => p.id === postId);
      if (!post) return;

      if (navigator.share) {
        await navigator.share({
          title: post.title,
          text: post.description,
          url: `${window.location.origin}/post/${postId}`
        });
      } else {
        // Fallback to clipboard
        await navigator.clipboard.writeText(`${window.location.origin}/post/${postId}`);
        toast.success('Link copied to clipboard');
      }

      setPosts(prev => prev.map(p => 
        p.id === postId 
          ? { ...p, share_count: p.share_count + 1 }
          : p
      ));
      
    } catch (error) {
      console.error('Failed to share post:', error);
      toast.error('Failed to share post');
    }
  };

  // Infinite scroll setup
  useEffect(() => {
    if (!loadingRef.current) return;

    observerRef.current = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && hasMore && !loading) {
          const nextPage = page + 1;
          setPage(nextPage);
          loadPosts(nextPage, true);
        }
      },
      { threshold: 0.1 }
    );

    observerRef.current.observe(loadingRef.current);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [hasMore, loading, page, loadPosts]);

  // Load initial posts
  useEffect(() => {
    setPage(0);
    loadPosts(0, false);
  }, [feedType, user]);

  // Format time ago
  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Card className={cn("", className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Music className="w-5 h-5 text-primary" />
          {feedType === 'discover' && 'Discover'}
          {feedType === 'following' && 'Following'}
          {feedType === 'trending' && 'Trending'}
          <Badge variant="secondary" className="ml-auto">
            {posts.length} posts
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[600px]">
          <div className="space-y-4 p-4">
            {posts.map((post) => (
              <Card key={post.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <CardContent className="p-4">
                  {/* Creator Info */}
                  <div className="flex items-center gap-3 mb-3">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={post.creator_avatar_url} />
                      <AvatarFallback>
                        {post.creator_display_name?.charAt(0) || 'A'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="font-medium text-sm">
                        {post.creator_display_name || 'Anonymous'}
                      </div>
                      <div className="text-xs text-muted-foreground flex items-center gap-2">
                        <Clock className="w-3 h-3" />
                        {formatTimeAgo(post.created_at)}
                        {post.is_featured && (
                          <Badge variant="secondary" className="text-xs">
                            <TrendingUp className="w-3 h-3 mr-1" />
                            Featured
                          </Badge>
                        )}
                      </div>
                    </div>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </div>

                  {/* Post Content */}
                  <div className="space-y-3">
                    <div>
                      <h3 className="font-semibold text-lg">{post.title}</h3>
                      {post.description && (
                        <p className="text-muted-foreground text-sm mt-1">
                          {post.description}
                        </p>
                      )}
                    </div>

                    {/* Cover Image */}
                    {post.cover_image_url && (
                      <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
                        <img 
                          src={post.cover_image_url} 
                          alt={post.title}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                          <Button
                            variant="secondary"
                            size="lg"
                            className="rounded-full w-16 h-16"
                            onClick={() => handlePlay(post.id, post.audio_url)}
                          >
                            {currentlyPlaying === post.id ? (
                              <Pause className="w-6 h-6" />
                            ) : (
                              <Play className="w-6 h-6" />
                            )}
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Genre Tags */}
                    <div className="flex flex-wrap gap-2">
                      {post.genre_tags.map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                      {post.duration_seconds && (
                        <Badge variant="secondary" className="text-xs">
                          {formatDuration(post.duration_seconds)}
                        </Badge>
                      )}
                    </div>

                    {/* Engagement Stats */}
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Headphones className="w-4 h-4" />
                        {post.play_count.toLocaleString()}
                      </div>
                      <div className="flex items-center gap-1">
                        <Heart className="w-4 h-4" />
                        {post.like_count.toLocaleString()}
                      </div>
                      <div className="flex items-center gap-1">
                        <MessageCircle className="w-4 h-4" />
                        {post.comment_count}
                      </div>
                      <div className="flex items-center gap-1">
                        <Share2 className="w-4 h-4" />
                        {post.share_count}
                      </div>
                    </div>

                    <Separator />

                    {/* Action Buttons */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleLike(post.id)}
                          className={cn(
                            "flex items-center gap-2",
                            likedPosts.has(post.id) && "text-red-500"
                          )}
                        >
                          <Heart className={cn(
                            "w-4 h-4",
                            likedPosts.has(post.id) && "fill-current"
                          )} />
                          Like
                        </Button>
                        <Button variant="ghost" size="sm">
                          <MessageCircle className="w-4 h-4 mr-2" />
                          Comment
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleShare(post.id)}
                        >
                          <Share2 className="w-4 h-4 mr-2" />
                          Share
                        </Button>
                      </div>
                      <Button variant="outline" size="sm">
                        <Download className="w-4 h-4 mr-2" />
                        Remix
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* Loading indicator */}
            {loading && (
              <div className="flex justify-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            )}

            {/* Infinite scroll trigger */}
            <div ref={loadingRef} className="h-4" />
          </div>
        </ScrollArea>

        {/* Hidden audio player */}
        <audio 
          ref={audioRef}
          onEnded={() => setCurrentlyPlaying(null)}
          preload="none"
        />
      </CardContent>
    </Card>
  );
};