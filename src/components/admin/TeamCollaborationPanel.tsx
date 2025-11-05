import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Users,
  MessageCircle,
  Send,
  Trash2,
  Clock,
  Eye,
  CheckCircle2
} from 'lucide-react';
import { useState } from 'react';
import { usePerformanceTeamCollaboration } from '@/hooks/usePerformanceTeamCollaboration';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';

export function TeamCollaborationPanel() {
  const {
    teamMembers,
    comments,
    isConnected,
    currentUser,
    addComment,
    deleteComment,
  } = usePerformanceTeamCollaboration();
  
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    setIsSubmitting(true);
    try {
      await addComment(newComment);
      setNewComment('');
      toast({
        title: 'Comment added',
        description: 'Your comment has been shared with the team',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to add comment',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      await deleteComment(commentId);
      toast({
        title: 'Comment deleted',
        description: 'Your comment has been removed',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete comment',
        variant: 'destructive',
      });
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const teamMembersList = Object.values(teamMembers);
  const onlineCount = teamMembersList.length;

  return (
    <div className="space-y-6">
      {/* Connection Status */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Team Collaboration
              </CardTitle>
              <CardDescription>
                Real-time collaboration on performance monitoring
              </CardDescription>
            </div>
            <Badge variant={isConnected ? "default" : "outline"} className="gap-1">
              {isConnected ? (
                <>
                  <CheckCircle2 className="h-3 w-3" />
                  Connected
                </>
              ) : (
                'Connecting...'
              )}
            </Badge>
          </div>
        </CardHeader>
      </Card>

      {/* Active Team Members */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            Active Members ({onlineCount})
          </CardTitle>
          <CardDescription>
            Team members currently viewing the performance dashboard
          </CardDescription>
        </CardHeader>
        <CardContent>
          {onlineCount > 0 ? (
            <div className="space-y-3">
              {teamMembersList.map((member) => (
                <div
                  key={member.user_id}
                  className="flex items-center justify-between p-3 rounded-lg border"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={member.avatar_url} />
                      <AvatarFallback>{getInitials(member.display_name)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">{member.display_name}</div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Eye className="h-3 w-3" />
                        <span>Viewing: {member.viewing_section || 'overview'}</span>
                      </div>
                    </div>
                  </div>
                  <Badge variant="outline" className="gap-1">
                    <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                    Online
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No other team members online</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Comments Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <MessageCircle className="h-5 w-5" />
            Team Comments
          </CardTitle>
          <CardDescription>
            Share insights and discuss performance metrics
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Add Comment */}
          {currentUser && (
            <div className="space-y-2">
              <Textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Share your insights with the team..."
                className="min-h-[100px]"
              />
              <div className="flex justify-end">
                <Button
                  onClick={handleAddComment}
                  disabled={!newComment.trim() || isSubmitting}
                  size="sm"
                >
                  <Send className="h-4 w-4 mr-2" />
                  {isSubmitting ? 'Posting...' : 'Post Comment'}
                </Button>
              </div>
            </div>
          )}

          {!currentUser && (
            <Alert>
              <AlertDescription>
                Sign in to collaborate with your team
              </AlertDescription>
            </Alert>
          )}

          {/* Comments List */}
          <div className="space-y-3 pt-4 border-t">
            {comments.length > 0 ? (
              comments.map((comment) => (
                <div
                  key={comment.id}
                  className="p-4 rounded-lg border bg-card"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={comment.user_profile?.avatar_url} />
                        <AvatarFallback>
                          {getInitials(comment.user_profile?.display_name || 'User')}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">
                            {comment.user_profile?.display_name || 'Anonymous'}
                          </span>
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDistanceToNow(new Date(comment.created_at), {
                              addSuffix: true,
                            })}
                          </span>
                        </div>
                        <p className="text-sm">{comment.comment_text}</p>
                      </div>
                    </div>
                    {currentUser && comment.user_id === currentUser.id && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteComment(comment.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <MessageCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No comments yet</p>
                <p className="text-xs mt-1">Be the first to share your insights</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
