import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Heart, MessageCircle, Share2, Star, ThumbsUp, Send } from 'lucide-react';

interface Comment {
  id: string;
  author: string;
  avatar: string;
  content: string;
  timestamp: string;
  likes: number;
  isLiked: boolean;
}

interface Rating {
  stars: number;
  count: number;
}

export function PluginSocialFeatures() {
  const [newComment, setNewComment] = useState('');
  const [comments, setComments] = useState<Comment[]>([
    {
      id: '1',
      author: 'DJ Maphorisa',
      avatar: '',
      content: 'This synth is fire! 🔥 Perfect for those authentic log drum sounds',
      timestamp: '2 hours ago',
      likes: 24,
      isLiked: false,
    },
    {
      id: '2',
      author: 'Producer Mike',
      avatar: '',
      content: 'Best amapiano plugin on the market. Worth every penny.',
      timestamp: '5 hours ago',
      likes: 18,
      isLiked: true,
    },
    {
      id: '3',
      author: 'BeatMaker Pro',
      avatar: '',
      content: 'Could you add more preset banks? Would love to see more variations.',
      timestamp: '1 day ago',
      likes: 12,
      isLiked: false,
    },
  ]);

  const ratings: Rating[] = [
    { stars: 5, count: 124 },
    { stars: 4, count: 32 },
    { stars: 3, count: 8 },
    { stars: 2, count: 2 },
    { stars: 1, count: 1 },
  ];

  const totalRatings = ratings.reduce((sum, r) => sum + r.count, 0);
  const avgRating = ratings.reduce((sum, r) => sum + (r.stars * r.count), 0) / totalRatings;

  const handleLike = (commentId: string) => {
    setComments(prev => prev.map(c => 
      c.id === commentId 
        ? { ...c, isLiked: !c.isLiked, likes: c.isLiked ? c.likes - 1 : c.likes + 1 }
        : c
    ));
  };

  const handleSubmitComment = () => {
    if (!newComment.trim()) return;

    const comment: Comment = {
      id: Date.now().toString(),
      author: 'You',
      avatar: '',
      content: newComment,
      timestamp: 'Just now',
      likes: 0,
      isLiked: false,
    };

    setComments([comment, ...comments]);
    setNewComment('');
  };

  return (
    <div className="space-y-6">
      {/* Rating Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5" />
            Community Ratings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-start gap-8">
            <div className="text-center">
              <div className="text-5xl font-bold">{avgRating.toFixed(1)}</div>
              <div className="flex items-center gap-1 mt-2 justify-center">
                {[1, 2, 3, 4, 5].map(i => (
                  <Star 
                    key={i} 
                    className={`h-5 w-5 ${i <= Math.round(avgRating) ? 'fill-yellow-500 text-yellow-500' : 'text-muted'}`}
                  />
                ))}
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                {totalRatings} ratings
              </div>
            </div>

            <div className="flex-1 space-y-2">
              {ratings.map((rating) => (
                <div key={rating.stars} className="flex items-center gap-3">
                  <div className="w-12 text-sm text-muted-foreground">
                    {rating.stars} stars
                  </div>
                  <div className="flex-1 bg-secondary h-2 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-yellow-500" 
                      style={{ width: `${(rating.count / totalRatings) * 100}%` }}
                    />
                  </div>
                  <div className="w-12 text-sm text-muted-foreground text-right">
                    {rating.count}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Social Actions */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <Button variant="outline" className="flex-1">
              <Heart className="h-4 w-4 mr-2" />
              Like (342)
            </Button>
            <Button variant="outline" className="flex-1">
              <MessageCircle className="h-4 w-4 mr-2" />
              Comment ({comments.length})
            </Button>
            <Button variant="outline" className="flex-1">
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Comments Section */}
      <Card>
        <CardHeader>
          <CardTitle>Community Discussion</CardTitle>
          <CardDescription>
            Share your feedback and connect with other users
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* New Comment */}
          <div className="space-y-3">
            <Textarea
              placeholder="Share your thoughts about this plugin..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              rows={3}
            />
            <div className="flex justify-end">
              <Button onClick={handleSubmitComment} disabled={!newComment.trim()}>
                <Send className="h-4 w-4 mr-2" />
                Post Comment
              </Button>
            </div>
          </div>

          {/* Comments List */}
          <div className="space-y-4">
            {comments.map((comment) => (
              <Card key={comment.id}>
                <CardContent className="pt-6">
                  <div className="flex gap-3">
                    <Avatar>
                      <AvatarImage src={comment.avatar} />
                      <AvatarFallback>{comment.author[0]}</AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">{comment.author}</div>
                          <div className="text-xs text-muted-foreground">{comment.timestamp}</div>
                        </div>
                        {comment.author === 'You' && (
                          <Badge variant="secondary">Your Comment</Badge>
                        )}
                      </div>
                      
                      <p className="text-sm">{comment.content}</p>
                      
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant={comment.isLiked ? 'default' : 'ghost'}
                          onClick={() => handleLike(comment.id)}
                        >
                          <ThumbsUp className={`h-3 w-3 mr-1 ${comment.isLiked ? 'fill-current' : ''}`} />
                          {comment.likes}
                        </Button>
                        <Button size="sm" variant="ghost">
                          Reply
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
