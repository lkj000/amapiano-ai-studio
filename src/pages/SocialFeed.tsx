import React, { useState, useRef, useEffect } from 'react';
import { SocialFeedPost } from '@/components/SocialFeedPost';
import { usePersonalizedFeed } from '@/hooks/usePersonalizedFeed';
import { useSocialInteractions, SocialPost } from '@/hooks/useSocialFeed';
import LoadingSpinner from '@/components/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { RefreshCw, User, Plus } from 'lucide-react';
import { VoiceToMusicEngine } from '@/components/VoiceToMusicEngine';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';

interface SocialFeedProps {
  user?: any;
}

const SocialFeed: React.FC<SocialFeedProps> = ({ user }) => {
  const { posts, loading, hasMore, loadMore, refreshFeed, trackInteraction } = usePersonalizedFeed({
    user_id: user?.id,
    limit: 10
  });
  const { likePost, playPost, sharePost } = useSocialInteractions();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showRemixModal, setShowRemixModal] = useState(false);
  const [selectedPost, setSelectedPost] = useState<SocialPost | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

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
    if (e.key === 'ArrowDown' && currentIndex < posts.length - 1) {
      setCurrentIndex(prev => prev + 1);
      // Track interaction
      if (user?.id && posts[currentIndex]) {
        trackInteraction(posts[currentIndex].id, 'keyboard_next', 0.2);
      }
      if (currentIndex >= posts.length - 3 && hasMore) {
        loadMore();
      }
    } else if (e.key === 'ArrowUp' && currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      // Track interaction
      if (user?.id && posts[currentIndex]) {
        trackInteraction(posts[currentIndex].id, 'keyboard_prev', 0.1);
      }
    } else if (e.key === ' ') {
      e.preventDefault();
      // Track pause/play interaction
      if (user?.id && posts[currentIndex]) {
        trackInteraction(posts[currentIndex].id, 'keyboard_pause', 0.3);
      }
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
          className="bg-black/40 text-white hover:bg-black/60"
        >
          <RefreshCw className="w-4 h-4" />
        </Button>
        
        {user && (
          <Dialog>
            <DialogTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="bg-black/40 text-white hover:bg-black/60"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh]">
              <VoiceToMusicEngine onTrackGenerated={() => refreshFeed()} />
            </DialogContent>
          </Dialog>
        )}

        <Button
          variant="ghost"
          size="sm"
          className="bg-black/40 text-white hover:bg-black/60"
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
    </div>
  );
};

export default SocialFeed;