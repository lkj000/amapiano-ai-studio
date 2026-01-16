import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  History, 
  Music, 
  Clock, 
  MoreVertical,
  Play,
  Trash2,
  Download
} from 'lucide-react';
import { GeneratedClip } from '../SunoStudioTypes';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

interface HistoryPanelProps {
  history: GeneratedClip[];
  selectedClipId: string | null;
  onSelectClip: (clipId: string) => void;
  onDeleteClip: (clipId: string) => void;
  onPlayClip: (clipId: string) => void;
}

export function HistoryPanel({
  history,
  selectedClipId,
  onSelectClip,
  onDeleteClip,
  onPlayClip
}: HistoryPanelProps) {
  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5 text-primary" />
          Generation History
        </CardTitle>
        <CardDescription>
          {history.length} {history.length === 1 ? 'clip' : 'clips'} generated
        </CardDescription>
      </CardHeader>

      <CardContent className="flex-1 overflow-hidden p-0">
        {history.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <Music className="h-12 w-12 text-muted-foreground/30 mb-4" />
            <p className="text-sm text-muted-foreground">
              No generations yet. Create your first song!
            </p>
          </div>
        ) : (
          <ScrollArea className="h-full">
            <div className="space-y-1 p-4">
              {history.map((clip) => (
                <div
                  key={clip.id}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors group",
                    selectedClipId === clip.id 
                      ? "bg-primary/10 border border-primary/20" 
                      : "hover:bg-muted/50"
                  )}
                  onClick={() => onSelectClip(clip.id)}
                >
                  {/* Thumbnail */}
                  <div className="relative flex-shrink-0">
                    {clip.imageUrl ? (
                      <img 
                        src={clip.imageUrl} 
                        alt="" 
                        className="w-12 h-12 rounded object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded bg-muted flex items-center justify-center">
                        <Music className="h-5 w-5 text-muted-foreground" />
                      </div>
                    )}
                    <Button
                      size="icon"
                      variant="secondary"
                      className="absolute inset-0 w-full h-full opacity-0 group-hover:opacity-100 transition-opacity rounded"
                      onClick={(e) => {
                        e.stopPropagation();
                        onPlayClip(clip.id);
                      }}
                    >
                      <Play className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{clip.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-[10px] h-4 px-1">
                        {clip.metadata.genre}
                      </Badge>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDuration(clip.duration)}
                      </span>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      {formatTimeAgo(new Date(clip.createdAt))}
                    </p>
                  </div>

                  {/* Actions */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onPlayClip(clip.id)}>
                        <Play className="h-4 w-4 mr-2" />
                        Play
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <a href={clip.audioUrl} download>
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </a>
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        className="text-destructive"
                        onClick={() => onDeleteClip(clip.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
