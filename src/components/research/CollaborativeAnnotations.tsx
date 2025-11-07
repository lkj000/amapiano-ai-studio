import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MessageSquare, Send, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { usePerformanceTeamCollaboration } from "@/hooks/usePerformanceTeamCollaboration";

interface CollaborativeAnnotationsProps {
  pillarId: string; // 'sige' | 'nunchaku' | 'distrifusion'
  pillarName: string;
}

export const CollaborativeAnnotations = ({ pillarId, pillarName }: CollaborativeAnnotationsProps) => {
  const [newAnnotation, setNewAnnotation] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { 
    comments, 
    addComment, 
    deleteComment,
    isConnected 
  } = usePerformanceTeamCollaboration();

  // Filter comments for this pillar
  const pillarComments = comments.filter(c => c.metric_id === pillarId);

  const handleSubmit = async () => {
    if (!newAnnotation.trim()) return;
    
    setIsSubmitting(true);
    try {
      await addComment(newAnnotation, pillarId);
      setNewAnnotation("");
      toast.success("Annotation added");
    } catch (error) {
      console.error("Failed to add annotation:", error);
      toast.error("Failed to add annotation");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (commentId: string) => {
    try {
      await deleteComment(commentId);
      toast.success("Annotation deleted");
    } catch (error) {
      console.error("Failed to delete annotation:", error);
      toast.error("Failed to delete annotation");
    }
  };

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <MessageSquare className="w-5 h-5" />
          Annotations: {pillarName}
        </h3>
        <Badge variant={isConnected ? "default" : "secondary"}>
          {isConnected ? "Live" : "Offline"}
        </Badge>
      </div>

      {/* Annotation Input */}
      <div className="space-y-2 mb-4">
        <Textarea
          placeholder="Add your research notes, observations, or questions..."
          value={newAnnotation}
          onChange={(e) => setNewAnnotation(e.target.value)}
          className="min-h-[80px]"
        />
        <Button 
          onClick={handleSubmit} 
          disabled={!newAnnotation.trim() || isSubmitting}
          size="sm"
        >
          <Send className="w-4 h-4 mr-2" />
          Add Annotation
        </Button>
      </div>

      {/* Annotations List */}
      <div className="space-y-3 max-h-[400px] overflow-y-auto">
        {pillarComments.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No annotations yet. Be the first to add research notes!
          </p>
        ) : (
          pillarComments.map((comment) => (
            <div 
              key={comment.id} 
              className="flex gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
            >
              <Avatar className="w-8 h-8">
                <AvatarFallback>
                  {comment.user_profile?.display_name?.charAt(0) || "?"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium">
                    {comment.user_profile?.display_name || "Anonymous"}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(comment.created_at).toLocaleString()}
                  </span>
                </div>
                <p className="text-sm text-foreground/90 whitespace-pre-wrap break-words">
                  {comment.comment_text}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleDelete(comment.id)}
                className="shrink-0"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))
        )}
      </div>
    </Card>
  );
};
