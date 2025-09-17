import React, { useState, useRef, useEffect } from 'react';
import { SocialFeedPost } from '@/components/SocialFeedPost';
import { SocialOnboarding } from '@/components/SocialOnboarding';
import { EngagementAnalytics } from '@/components/EngagementAnalytics';
import { usePersonalizedFeed } from '@/hooks/usePersonalizedFeed';
import { useSocialInteractions, SocialPost } from '@/hooks/useSocialFeed';
import LoadingSpinner from '@/components/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { RefreshCw, User, Plus, HelpCircle, BarChart3 } from 'lucide-react';
import { VoiceToMusicEngine } from '@/components/VoiceToMusicEngine';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';

interface SocialFeedProps {
  user?: any;
}

const SocialFeed: React.FC<SocialFeedProps> = ({ user }) => {
  const { posts, loading, hasMore, loadMore, refreshFeed, trackInteraction, trackDwellTime, userEngagementScore } = usePersonalizedFeed({
    user_id: user?.id,
    limit: 10
  });
  const { likePost, playPost, sharePost } = useSocialInteractions();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showRemixModal, setShowRemixModal] = useState(false);
  const [selectedPost, setSelectedPost] = useState<SocialPost | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [postViewStartTime, setPostViewStartTime] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Show onboarding for first-time users
  useEffect(() => {
    const hasSeenOnboarding = localStorage.getItem('social-onboarding-seen');
    if (!hasSeenOnboarding && posts.length > 0) {
      setShowOnboarding(true);
      localStorage.setItem('social-onboarding-seen', 'true');
    }
  }, [posts.length]);

  // Track dwell time when current post changes
  useEffect(() => {
    // Track dwell time for previous post
    if (postViewStartTime && posts[currentIndex - 1] && user?.id) {
      const dwellTime = Date.now() - postViewStartTime;
      trackDwellTime(posts[currentIndex - 1].id, dwellTime);
    }
    
    // Start tracking time for current post
    setPostViewStartTime(Date.now());
    
    return () => {
      // Track dwell time when component unmounts
      if (postViewStartTime && posts[currentIndex] && user?.id) {
        const dwellTime = Date.now() - postViewStartTime;
        trackDwellTime(posts[currentIndex].id, dwellTime);
      }
    };
  }, [currentIndex, posts, user?.id, trackDwellTime]);

  const handleScroll = (e: React.WheelEvent) => {
    e.preventDefault();
    if (e.deltaY > 0 && currentIndex < posts.length - 1) {
      // Scroll down
      setCurrentIndex(prev => prev + 1);
      // Track interaction for algorithmic learning
      if (user?.id && posts[currentIndex]) {
        trackInteraction(posts[currentIndex].id, 'scroll_past', 0.1);
      }
      if (currentIndex >= posts.length - 3 && hasMore) {
        loadMore();
      }
    } else if (e.deltaY < 0 && currentIndex > 0) {
      // Scroll up
      setCurrentIndex(prev => prev - 1);
      // Track interaction
      if (user?.id && posts[currentIndex]) {
        trackInteraction(posts[currentIndex].id, 'scroll_back', 0.05);
      }
    }
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    const target = (e.target as HTMLElement) || (document.activeElement as HTMLElement | null);
    const tag = target?.tagName?.toLowerCase();
    const isEditing =
      (tag === 'input' || tag === 'textarea' || target?.isContentEditable) ||
      !!target?.closest('input, textarea, [contenteditable="true"], [role="textbox"]');
    // If user is typing in any input/textarea/contentEditable or inside an open dialog, do nothing
    const openDialog = document.querySelector('[role="dialog"][data-state="open"]');
    if (isEditing || (openDialog && target && openDialog.contains(target))) {
      return;
    }

    if (e.key === 'ArrowDown' && currentIndex < posts.length - 1) {
      setCurrentIndex(prev => prev + 1);
      if (user?.id && posts[currentIndex]) {
        trackInteraction(posts[currentIndex].id, 'keyboard_next', 0.2);
      }
      if (currentIndex >= posts.length - 3 && hasMore) {
        loadMore();
      }
    } else if (e.key === 'ArrowUp' && currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      if (user?.id && posts[currentIndex]) {
        trackInteraction(posts[currentIndex].id, 'keyboard_prev', 0.1);
      }
    } else if (e.key === ' ') {
      // prevent page scroll when not typing
      e.preventDefault();
      if (user?.id && posts[currentIndex]) {
        trackInteraction(posts[currentIndex].id, 'keyboard_pause', 0.3);
      }
      // Optional: notify current post to toggle playback
      window.dispatchEvent(
        new CustomEvent('social:toggle-play', { detail: { index: currentIndex, postId: posts[currentIndex]?.id } })
      );
    }
  };

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, posts.length, hasMore]);

  const handleRemix = (post: SocialPost) => {
    setSelectedPost(post);
    setShowRemixModal(true);
  };

  if (loading && posts.length === 0) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted">
        <LoadingSpinner />
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-gradient-to-br from-background to-muted p-8">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold">No posts yet!</h2>
          <p className="text-muted-foreground">Be the first to share AI-generated music</p>
          {user && (
            <Dialog>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600">
                  <Plus className="w-4 h-4 mr-2" />
                  Create First Post
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh]">
                <VoiceToMusicEngine onTrackGenerated={() => refreshFeed()} />
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className="h-screen overflow-hidden bg-black relative"
      onWheel={handleScroll}
    >
      {/* Fixed Controls */}
      <div className="fixed top-4 right-4 z-50 flex gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={refreshFeed}
          className="bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 border border-white/20"
        >
          <RefreshCw className="w-4 h-4" />
        </Button>
        
        <Dialog open={showAnalytics} onOpenChange={setShowAnalytics}>
          <DialogTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 border border-white/20"
            >
              <BarChart3 className="w-4 h-4" />
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <EngagementAnalytics userId={user?.id} timeframe="24h" />
          </DialogContent>
        </Dialog>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowOnboarding(true)}
          className="bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 border border-white/20"
        >
          <HelpCircle className="w-4 h-4" />
        </Button>
        
        {user ? (
          <Dialog>
            <DialogTrigger asChild>
              <Button
                size="sm"
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white border-0 shadow-lg"
              >
                <Plus className="w-4 h-4 mr-1" />
                Create
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh]">
              <VoiceToMusicEngine onTrackGenerated={() => refreshFeed()} />
            </DialogContent>
          </Dialog>
        ) : (
          <Button
            size="sm"
            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white border-0 shadow-lg"
            onClick={() => window.location.href = '/auth'}
          >
            <Plus className="w-4 h-4 mr-1" />
            Sign In to Create
          </Button>
        )}

        <Button
          variant="ghost"
          size="sm"
          className="bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 border border-white/20"
        >
          <User className="w-4 h-4" />
        </Button>
      </div>

      {/* Post Feed */}
      <div className="relative h-full">
        {posts.map((post, index) => (
          <div
            key={post.id}
            className={`absolute inset-0 transition-transform duration-300 ease-out ${
              index === currentIndex ? 'translate-y-0' : 
              index < currentIndex ? '-translate-y-full' : 'translate-y-full'
            }`}
          >
            <SocialFeedPost
              post={post}
              isVisible={index === currentIndex}
              onRemix={handleRemix}
              onLike={(postId) => trackInteraction(postId, 'like', 1.0)}
              onShare={(postId) => trackInteraction(postId, 'share', 0.8)}
              onPlay={(postId) => trackInteraction(postId, 'play', 0.5)}
            />
          </div>
        ))}
      </div>

      {/* Navigation Indicators */}
      <div className="fixed left-4 top-1/2 transform -translate-y-1/2 z-40">
        <div className="flex flex-col gap-2">
          {posts.slice(Math.max(0, currentIndex - 2), currentIndex + 3).map((_, relativeIndex) => {
            const actualIndex = Math.max(0, currentIndex - 2) + relativeIndex;
            return (
              <button
                key={actualIndex}
                onClick={() => setCurrentIndex(actualIndex)}
                className={`w-2 h-8 rounded-full transition-all ${
                  actualIndex === currentIndex ? 'bg-white' : 'bg-white/40'
                }`}
              />
            );
          })}
        </div>
      </div>

      {/* Remix Modal */}
      <Dialog open={showRemixModal} onOpenChange={setShowRemixModal}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          {selectedPost && (
            <VoiceToMusicEngine 
              onTrackGenerated={() => {
                refreshFeed();
                setShowRemixModal(false);
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Instructions */}
      <div className="fixed bottom-4 left-4 text-white/60 text-xs">
        <p>Use ↑↓ arrow keys or scroll to navigate</p>
        <p>Space to pause/play • Click remix to create your version</p>
      </div>

      {/* Social Onboarding */}
      <SocialOnboarding 
        user={user} 
        isOpen={showOnboarding} 
        onClose={() => setShowOnboarding(false)} 
      />
    </div>
  );
};

export default SocialFeed;