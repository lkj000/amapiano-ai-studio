import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';

interface CommentsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  postTitle?: string;
  commentCount?: number;
}

export const CommentsDialog: React.FC<CommentsDialogProps> = ({ open, onOpenChange, postTitle, commentCount }) => {
  const [comments, setComments] = useState<string[]>([]);
  const [draft, setDraft] = useState('');

  const addComment = () => {
    if (!draft.trim()) return;
    setComments((prev) => [...prev, draft.trim()]);
    setDraft('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Comments</DialogTitle>
          <DialogDescription>
            {postTitle ? `Discuss "${postTitle}"` : 'Join the conversation'}
            {typeof commentCount === 'number' && (
              <span className="ml-2 text-muted-foreground">• {commentCount} total</span>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <ScrollArea className="h-64 rounded-md border p-3">
            {comments.length === 0 ? (
              <p className="text-sm text-muted-foreground">No comments yet. Be the first to say something!</p>
            ) : (
              <ul className="space-y-3">
                {comments.map((c, i) => (
                  <li key={i} className="text-sm leading-relaxed">
                    {c}
                  </li>
                ))}
              </ul>
            )}
          </ScrollArea>

          <div className="flex items-center gap-2">
            <Input
              placeholder="Write a comment..."
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') addComment();
              }}
            />
            <Button onClick={addComment}>Send</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CommentsDialog;
