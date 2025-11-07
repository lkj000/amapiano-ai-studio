import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Users, Circle, MessageSquare } from "lucide-react";
import { useRealtimePresence } from "@/hooks/useRealtimePresence";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface RealtimeReviewCollaborationProps {
  paperId: string;
}

interface Comment {
  id: string;
  reviewer_id: string;
  comment: string;
  created_at: string;
  reviewer?: {
    name: string;
  };
}

export const RealtimeReviewCollaboration = ({ paperId }: RealtimeReviewCollaborationProps) => {
  const { activeUsers, isConnected } = useRealtimePresence({
    channelName: 'paper-review',
    entityId: paperId,
  });

  const [recentComments, setRecentComments] = useState<Comment[]>([]);

  useEffect(() => {
    // Fetch recent comments
    const fetchComments = async () => {
      const { data } = await supabase
        .from('review_comments')
        .select(`
          id,
          reviewer_id,
          comment,
          created_at,
          reviewers:reviewer_id(name)
        `)
        .eq('review_id', paperId)
        .order('created_at', { ascending: false })
        .limit(5);

      if (data) {
        setRecentComments(data as any);
      }
    };

    fetchComments();

    // Subscribe to new comments
    const channel = supabase
      .channel(`review-comments:${paperId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'review_comments',
          filter: `review_id=eq.${paperId}`,
        },
        (payload) => {
          console.log('[REALTIME] New comment:', payload);
          toast.success("New comment added", {
            description: "A reviewer just added a comment",
          });
          fetchComments();
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [paperId]);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="space-y-4">
      <Card className="p-4 bg-primary/5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            <h4 className="font-semibold text-foreground">Active Reviewers</h4>
            <Badge variant={isConnected ? "default" : "secondary"}>
              <Circle className={`w-2 h-2 mr-1 ${isConnected ? 'fill-current' : ''}`} />
              {isConnected ? "Connected" : "Connecting..."}
            </Badge>
          </div>
          <span className="text-sm text-muted-foreground">
            {activeUsers.length} viewing now
          </span>
        </div>

        <div className="flex flex-wrap gap-3">
          {activeUsers.length === 0 ? (
            <p className="text-sm text-muted-foreground">No active reviewers at the moment</p>
          ) : (
            activeUsers.map((user) => (
              <div key={user.userId} className="flex items-center gap-2 bg-background p-2 rounded-lg border border-border">
                <Avatar className="w-8 h-8">
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                    {getInitials(user.userName)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <span className="text-sm font-medium">{user.userName}</span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(user.onlineAt).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>

      {recentComments.length > 0 && (
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <MessageSquare className="w-5 h-5 text-primary" />
            <h4 className="font-semibold text-foreground">Recent Activity</h4>
          </div>
          <div className="space-y-3">
            {recentComments.map((comment) => (
              <div key={comment.id} className="flex gap-3 text-sm border-l-2 border-primary pl-3">
                <div className="flex-1">
                  <p className="font-medium text-foreground">
                    {(comment.reviewer as any)?.name || 'Anonymous'}
                  </p>
                  <p className="text-muted-foreground">{comment.comment}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(comment.created_at).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};
