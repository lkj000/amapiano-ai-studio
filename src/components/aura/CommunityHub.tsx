import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Users, 
  MessageSquare, 
  Heart, 
  Share, 
  Play, 
  Upload,
  Award,
  Lightbulb,
  HelpCircle,
  Music,
  Plus,
  Filter,
  Search,
  Bookmark
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { User } from '@supabase/supabase-js';
import { useToast } from "@/hooks/use-toast";

interface CommunityHubProps {
  user: User | null;
}

interface CommunityPost {
  id: string;
  author_id: string;
  post_type: 'showcase' | 'tutorial' | 'question' | 'collaboration';
  title: string;
  content: string;
  media_urls: string[];
  tags: string[];
  like_count: number;
  comment_count: number;
  is_featured: boolean;
  created_at: string;
  author_name?: string;
  author_avatar?: string;
}

interface Comment {
  id: string;
  post_id: string;
  author_id: string;
  content: string;
  parent_comment_id: string | null;
  like_count: number;
  created_at: string;
  author_name?: string;
}

export const CommunityHub: React.FC<CommunityHubProps> = ({ user }) => {
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [selectedPost, setSelectedPost] = useState<CommunityPost | null>(null);
  const [loading, setLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedType, setSelectedType] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  const [newPost, setNewPost] = useState({
    title: '',
    content: '',
    post_type: 'showcase' as const,
    tags: '',
    media_url: ''
  });

  const [newComment, setNewComment] = useState('');

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('community_posts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPosts((data || []) as CommunityPost[]);
    } catch (error) {
      console.error('Error fetching posts:', error);
    }
  };

  const fetchComments = async (postId: string) => {
    try {
      const { data, error } = await supabase
        .from('community_comments')
        .select('*')
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setComments(data || []);
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  };

  const createPost = async () => {
    if (!user || !newPost.title.trim() || !newPost.content.trim()) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('community_posts')
        .insert([{
          author_id: user.id,
          post_type: newPost.post_type,
          title: newPost.title,
          content: newPost.content,
          media_urls: newPost.media_url ? [newPost.media_url] : [],
          tags: newPost.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
          like_count: 0,
          comment_count: 0,
          is_featured: false
        }]);

      if (error) throw error;

      await fetchPosts();
      setNewPost({
        title: '',
        content: '',
        post_type: 'showcase',
        tags: '',
        media_url: ''
      });
      setShowCreateForm(false);

      toast({
        title: "Post Created",
        description: "Your post has been shared with the community",
      });
    } catch (error) {
      console.error('Error creating post:', error);
      toast({
        title: "Error",
        description: "Failed to create post",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addComment = async (postId: string) => {
    if (!user || !newComment.trim()) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('community_comments')
        .insert([{
          post_id: postId,
          author_id: user.id,
          content: newComment,
          parent_comment_id: null,
          like_count: 0
        }]);

      if (error) throw error;

      // Update comment count on post
      const post = posts.find(p => p.id === postId);
      if (post) {
        await supabase
          .from('community_posts')
          .update({ comment_count: post.comment_count + 1 })
          .eq('id', postId);
      }

      await fetchComments(postId);
      await fetchPosts();
      setNewComment('');

      toast({
        title: "Comment Added",
        description: "Your comment has been posted",
      });
    } catch (error) {
      console.error('Error adding comment:', error);
      toast({
        title: "Error",
        description: "Failed to add comment",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const likePost = async (postId: string) => {
    if (!user) return;

    const post = posts.find(p => p.id === postId);
    if (!post) return;

    try {
      await supabase
        .from('community_posts')
        .update({ like_count: post.like_count + 1 })
        .eq('id', postId);

      setPosts(posts.map(p => 
        p.id === postId ? { ...p, like_count: p.like_count + 1 } : p
      ));
    } catch (error) {
      console.error('Error liking post:', error);
    }
  };

  const getPostIcon = (type: string) => {
    switch (type) {
      case 'showcase': return Music;
      case 'tutorial': return Lightbulb;
      case 'question': return HelpCircle;
      case 'collaboration': return Users;
      default: return MessageSquare;
    }
  };

  const getPostColor = (type: string) => {
    switch (type) {
      case 'showcase': return 'text-primary';
      case 'tutorial': return 'text-yellow-500';
      case 'question': return 'text-blue-500';
      case 'collaboration': return 'text-green-500';
      default: return 'text-muted-foreground';
    }
  };

  // Sample posts for demonstration
  const samplePosts: CommunityPost[] = [
    {
      id: 'post-1',
      author_id: 'user-1',
      post_type: 'showcase',
      title: 'My Latest Amapiano Track - "Sunset Dreams"',
      content: 'Just finished this track inspired by Kelvin Momo\'s style. Used the new log drum synthesizer from the plugin store and added some live piano recordings. Would love to get feedback from the community!',
      media_urls: [],
      tags: ['amapiano', 'private-school', 'piano', 'original'],
      like_count: 47,
      comment_count: 12,
      is_featured: true,
      created_at: '2024-03-15T10:30:00Z',
      author_name: 'MusicMaker_SA',
      author_avatar: ''
    },
    {
      id: 'post-2',
      author_id: 'user-2',
      post_type: 'tutorial',
      title: 'How to Create Authentic Log Drum Patterns',
      content: 'Step-by-step tutorial on programming log drum patterns that capture the essence of traditional amapiano. Covers rhythm programming, swing, and cultural authenticity.',
      media_urls: [],
      tags: ['tutorial', 'log-drum', 'patterns', 'beginner'],
      like_count: 89,
      comment_count: 23,
      is_featured: false,
      created_at: '2024-03-14T14:20:00Z',
      author_name: 'BeatMaster_JHB',
      author_avatar: ''
    },
    {
      id: 'post-3',
      author_id: 'user-3',
      post_type: 'question',
      title: 'Best approach for mixing amapiano vocals?',
      content: 'I\'m struggling with vocal mixing in my amapiano tracks. The vocals seem to get lost in the mix, especially with the prominent log drums and piano. Any tips from experienced producers?',
      media_urls: [],
      tags: ['mixing', 'vocals', 'help', 'production'],
      like_count: 15,
      comment_count: 8,
      is_featured: false,
      created_at: '2024-03-13T09:15:00Z',
      author_name: 'VocalVibes',
      author_avatar: ''
    }
  ];

  const displayPosts = posts.length > 0 ? posts : samplePosts;
  const filteredPosts = displayPosts.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         post.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedType === 'all' || post.post_type === selectedType;
    return matchesSearch && matchesType;
  });

  if (!user) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            Community Hub
          </CardTitle>
          <CardDescription>
            Please sign in to access the community
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (selectedPost) {
    return (
      <div className="space-y-6">
        {/* Back Navigation */}
        <Button 
          variant="ghost" 
          onClick={() => setSelectedPost(null)}
        >
          ← Back to Community
        </Button>

        {/* Post Detail */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Avatar>
                <AvatarFallback>{selectedPost.author_name?.[0] || 'U'}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{selectedPost.author_name || 'Anonymous'}</span>
                  <Badge variant="outline">{selectedPost.post_type}</Badge>
                  {selectedPost.is_featured && (
                    <Badge variant="default">Featured</Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  {new Date(selectedPost.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <h1 className="text-2xl font-bold">{selectedPost.title}</h1>
            <p className="text-muted-foreground">{selectedPost.content}</p>
            
            {/* Tags */}
            <div className="flex flex-wrap gap-2">
              {selectedPost.tags.map((tag, index) => (
                <Badge key={index} variant="secondary">#{tag}</Badge>
              ))}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-4 pt-4 border-t">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => likePost(selectedPost.id)}
              >
                <Heart className="w-4 h-4 mr-2" />
                {selectedPost.like_count}
              </Button>
              <Button variant="ghost" size="sm">
                <MessageSquare className="w-4 h-4 mr-2" />
                {selectedPost.comment_count}
              </Button>
              <Button variant="ghost" size="sm">
                <Share className="w-4 h-4 mr-2" />
                Share
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Comments Section */}
        <Card>
          <CardHeader>
            <CardTitle>Comments</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Add Comment */}
            <div className="flex gap-3">
              <Avatar>
                <AvatarFallback>{user.email?.[0].toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-2">
                <Textarea
                  placeholder="Add a comment..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                />
                <Button 
                  size="sm" 
                  onClick={() => addComment(selectedPost.id)}
                  disabled={!newComment.trim() || loading}
                >
                  Post Comment
                </Button>
              </div>
            </div>

            {/* Comments List */}
            <div className="space-y-4">
              {comments.map((comment) => (
                <div key={comment.id} className="flex gap-3">
                  <Avatar className="w-8 h-8">
                    <AvatarFallback>{comment.author_name?.[0] || 'U'}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm">{comment.author_name || 'Anonymous'}</span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(comment.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm">{comment.content}</p>
                    <Button variant="ghost" size="sm" className="h-auto p-0 mt-1">
                      <Heart className="w-3 h-3 mr-1" />
                      {comment.like_count}
                    </Button>
                  </div>
                </div>
              ))}
              {comments.length === 0 && (
                <p className="text-muted-foreground text-center py-8">
                  No comments yet. Be the first to comment!
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Users className="w-8 h-8 text-primary" />
            Community Hub
            <Badge variant="secondary" className="bg-primary/10 text-primary">
              Connect & Share
            </Badge>
          </h1>
          <p className="text-muted-foreground mt-2">
            Share your music, learn from others, and connect with the amapiano community
          </p>
        </div>
        <Button onClick={() => setShowCreateForm(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Create Post
        </Button>
      </div>

      {/* Create Post Form */}
      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle>Create New Post</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <select
              value={newPost.post_type}
              onChange={(e) => setNewPost({...newPost, post_type: e.target.value as any})}
              className="w-full px-3 py-2 border rounded-md bg-background"
            >
              <option value="showcase">Showcase</option>
              <option value="tutorial">Tutorial</option>
              <option value="question">Question</option>
              <option value="collaboration">Collaboration</option>
            </select>
            <Input
              placeholder="Post title"
              value={newPost.title}
              onChange={(e) => setNewPost({...newPost, title: e.target.value})}
            />
            <Textarea
              placeholder="Share your thoughts, music, or questions..."
              value={newPost.content}
              onChange={(e) => setNewPost({...newPost, content: e.target.value})}
              rows={4}
            />
            <Input
              placeholder="Tags (comma separated)"
              value={newPost.tags}
              onChange={(e) => setNewPost({...newPost, tags: e.target.value})}
            />
            <Input
              placeholder="Media URL (optional)"
              value={newPost.media_url}
              onChange={(e) => setNewPost({...newPost, media_url: e.target.value})}
            />
            <div className="flex gap-2">
              <Button onClick={createPost} disabled={loading}>
                <Upload className="w-4 h-4 mr-2" />
                Post
              </Button>
              <Button variant="outline" onClick={() => setShowCreateForm(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4 flex-wrap">
            <div className="flex-1 min-w-[300px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search posts..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-3 py-2 border rounded-md bg-background"
            >
              <option value="all">All Posts</option>
              <option value="showcase">Showcases</option>
              <option value="tutorial">Tutorials</option>
              <option value="question">Questions</option>
              <option value="collaboration">Collaborations</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Posts List */}
      <div className="space-y-4">
        {filteredPosts.map((post) => {
          const IconComponent = getPostIcon(post.post_type);
          const iconColor = getPostColor(post.post_type);
          
          return (
            <Card 
              key={post.id} 
              className="hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => {
                setSelectedPost(post);
                fetchComments(post.id);
              }}
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback>{post.author_name?.[0] || 'U'}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{post.author_name || 'Anonymous'}</span>
                        <IconComponent className={`w-4 h-4 ${iconColor}`} />
                        <Badge variant="outline">{post.post_type}</Badge>
                        {post.is_featured && (
                          <Badge variant="default">
                            <Award className="w-3 h-3 mr-1" />
                            Featured
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {new Date(post.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <h3 className="text-lg font-semibold">{post.title}</h3>
                <p className="text-muted-foreground line-clamp-3">{post.content}</p>
                
                {/* Tags */}
                <div className="flex flex-wrap gap-1">
                  {post.tags.slice(0, 4).map((tag, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      #{tag}
                    </Badge>
                  ))}
                </div>

                {/* Engagement */}
                <div className="flex items-center gap-4 pt-2 border-t">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={(e) => {
                      e.stopPropagation();
                      likePost(post.id);
                    }}
                  >
                    <Heart className="w-4 h-4 mr-1" />
                    {post.like_count}
                  </Button>
                  <Button variant="ghost" size="sm">
                    <MessageSquare className="w-4 h-4 mr-1" />
                    {post.comment_count}
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Share className="w-4 h-4 mr-1" />
                    Share
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Bookmark className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredPosts.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No posts found</h3>
            <p className="text-muted-foreground mb-4">
              Be the first to share something with the community
            </p>
            <Button onClick={() => setShowCreateForm(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create First Post
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};