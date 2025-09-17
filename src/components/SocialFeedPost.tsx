import React, { useRef, useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Heart, Play, Pause, Share2, MessageCircle, Repeat, MoreHorizontal } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { SocialPost, useSocialInteractions } from '@/hooks/useSocialFeed';
import { formatDistanceToNow } from 'date-fns';

interface SocialFeedPostProps {
  post: SocialPost;
  isVisible: boolean;
  onRemix?: (post: SocialPost) => void;
  onLike?: (postId: string) => void;
  onShare?: (postId: string) => void;
  onPlay?: (postId: string) => void;
}

export const SocialFeedPost: React.FC<SocialFeedPostProps> = ({ post, isVisible, onRemix, onLike, onShare, onPlay }) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLiked, setIsLiked] = useState(post.user_interactions?.liked || false);
  const [likeCount, setLikeCount] = useState<number>(post.like_count || 0);
  const [shareCount, setShareCount] = useState<number>(post.share_count || 0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const { likePost, playPost, sharePost } = useSocialInteractions();

  // Auto-play when visible (muted initially)
  useEffect(() => {
    if (isVisible && audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play();
      setIsPlaying(true);
      onPlay?.(post.id);
      playPost(post.id);
    } else if (!isVisible && audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  }, [isVisible, post.id, onPlay, playPost]);

  const togglePlay = async () => {
    const audio = audioRef.current;
    if (!audio) return;
    try {
      if (audio.paused) {
        await audio.play();
        playPost(post.id);
      } else {
        audio.pause();
      }
      // isPlaying state syncs via onPlay/onPause events
    } catch (err) {
      console.error('Playback failed:', err);
    }
  };

  const handleLike = async () => {
    const nextLiked = !isLiked;
    setIsLiked(nextLiked);
    setLikeCount((c) => Math.max(0, c + (nextLiked ? 1 : -1)));
    onLike?.(post.id);
    const serverLiked = await likePost(post.id);
    if (serverLiked !== nextLiked) {
      setIsLiked(serverLiked);
      setLikeCount((c) => Math.max(0, c + (serverLiked ? 1 : -1) - (nextLiked ? 1 : -1)));
    }
  };

  const handleShare = () => {
    const url = `${window.location.origin}/social/post/${post.id}`;
    navigator.clipboard.writeText(url);
    setShareCount((c) => c + 1);
    onShare?.(post.id);
    sharePost(post.id);
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <Card className="h-screen w-full max-w-md mx-auto relative overflow-hidden bg-gradient-to-b from-background/20 to-background/80 border-0">
      {/* Background Image */}
      {post.cover_image_url && (
        <div 
          className="absolute inset-0 bg-cover bg-center blur-sm"
          style={{ backgroundImage: `url(${post.cover_image_url})` }}
        />
      )}
      
      {/* Content Overlay */}
      <div className="relative z-10 h-full flex flex-col justify-between p-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="w-10 h-10 border-2 border-white/20">
              <AvatarImage src={post.creator?.avatar_url} />
              <AvatarFallback>{post.creator?.display_name?.[0]}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold text-white">{post.creator?.display_name}</p>
              <p className="text-xs text-white/80">{formatDistanceToNow(new Date(post.created_at))} ago</p>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="text-white/80 hover:text-white">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[180px]">
              <DropdownMenuItem onClick={() => onRemix?.(post)}>Remix this track</DropdownMenuItem>
              <DropdownMenuItem onClick={handleShare}>Share</DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigator.clipboard.writeText(`${window.location.origin}/social/post/${post.id}`)}>Copy link</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Center Play Button */}
        <div className="flex-1 flex items-center justify-center">
          <Button
            variant="ghost"
            size="lg"
            onClick={togglePlay}
            className="w-20 h-20 rounded-full bg-white/20 hover:bg-white/30 text-white border-2 border-white/40"
          >
            {isPlaying ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8 ml-1" />}
          </Button>
        </div>

        {/* Bottom Content */}
        <div className="space-y-4">
          {/* Track Info */}
          <div className="space-y-2">
            <h3 className="text-lg font-bold text-white">{post.title}</h3>
            {post.description && (
              <p className="text-sm text-white/90">{post.description}</p>
            )}
            
            {/* Tags */}
            <div className="flex flex-wrap gap-2">
              {post.genre_tags.slice(0, 3).map((tag, index) => (
                <Badge key={index} variant="secondary" className="bg-white/20 text-white border-white/30">
                  #{tag}
                </Badge>
              ))}
              {post.is_remix && (
                <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                  Remix
                </Badge>
              )}
            </div>

            {/* AI Model Badge */}
            {post.ai_model_used && (
              <Badge variant="outline" className="bg-black/40 text-white border-white/30">
                AI: {post.ai_model_used}
              </Badge>
            )}
          </div>

          {/* Audio Progress */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-white/80">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
            <div className="w-full bg-white/20 rounded-full h-1">
              <div 
                className="bg-gradient-to-r from-purple-400 to-pink-400 h-1 rounded-full transition-all duration-100"
                style={{ width: duration > 0 ? `${(currentTime / duration) * 100}%` : '0%' }}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between bg-black/40 backdrop-blur-sm rounded-lg p-3 border border-white/10">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLike}
                className={`text-white hover:bg-white/20 transition-all ${isLiked ? 'text-red-400' : 'text-white/90'}`}
              >
                <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
                <span className="ml-1 text-sm font-medium">{likeCount}</span>
              </Button>
              
              <Button variant="ghost" size="sm" className="text-white/90 hover:text-white hover:bg-white/20 transition-all">
                <MessageCircle className="w-5 h-5" />
                <span className="ml-1 text-sm font-medium">{post.comment_count}</span>
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onRemix?.(post)}
                className="text-white/90 hover:text-white hover:bg-gradient-to-r hover:from-purple-500/20 hover:to-pink-500/20 transition-all border border-purple-400/30 bg-gradient-to-r from-purple-500/10 to-pink-500/10"
              >
                <Repeat className="w-5 h-5" />
                <span className="ml-1 text-sm font-medium">Remix</span>
                {post.remix_count > 0 && <span className="ml-1 text-xs">({post.remix_count})</span>}
              </Button>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleShare}
              className="text-white/90 hover:text-white hover:bg-white/20 transition-all"
            >
              <Share2 className="w-5 h-5" />
              <span className="ml-1 text-sm font-medium">{shareCount}</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Audio Element */}
      <audio
        ref={audioRef}
        src={post.preview_url || post.audio_url}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => setIsPlaying(false)}
        loop
        muted={!isVisible}
      />
    </Card>
  );
};