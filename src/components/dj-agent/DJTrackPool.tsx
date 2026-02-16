import { useState, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Upload, Music, Trash2, FolderOpen, Loader2, Play, Pause, Volume2, Sparkles } from 'lucide-react';
import { DJTrack } from './DJAgentTypes';
import { toast } from 'sonner';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

// iOS Safari is picky with accept strings — use broad audio/* plus specific extensions
const IS_IOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
const ACCEPTED_AUDIO = IS_IOS ? 'audio/*' : 'audio/*,.mp3,.mp4,.wav,.flac,.ogg,.aiff,.m4a';

interface DJTrackPoolProps {
  tracks: DJTrack[];
  onAddTracks: (tracks: DJTrack[]) => void;
  onRemoveTrack: (id: string) => void;
  onAmapianorize?: (trackId: string) => void;
  isAnalyzing: boolean;
  amapianorizingTrackId?: string | null;
}

export default function DJTrackPool({ tracks, onAddTracks, onRemoveTrack, onAmapianorize, isAnalyzing, amapianorizingTrackId }: DJTrackPoolProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [playingTrackId, setPlayingTrackId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const processFiles = useCallback((files: FileList) => {
    const audioFiles = Array.from(files).filter(f => {
      const ext = f.name.split('.').pop()?.toLowerCase();
      return ['mp3', 'mp4', 'wav', 'flac', 'ogg', 'aiff', 'm4a'].includes(ext || '');
    });

    if (audioFiles.length === 0) {
      toast.error('No audio files found');
      return;
    }

    const newTracks: DJTrack[] = audioFiles.map(f => {
      const nameWithoutExt = f.name.replace(/\.[^/.]+$/, '');
      const parts = nameWithoutExt.split(' - ');
      return {
        id: crypto.randomUUID(),
        title: parts.length > 1 ? parts[1].trim() : nameWithoutExt,
        artist: parts.length > 1 ? parts[0].trim() : undefined,
        fileUrl: URL.createObjectURL(f),
        fileFormat: f.name.split('.').pop()?.toLowerCase() || 'mp3',
      };
    });

    onAddTracks(newTracks);
    toast.success(`Added ${newTracks.length} track(s) to pool`);
  }, [onAddTracks]);

  const handlePlayToggle = useCallback((track: DJTrack) => {
    if (playingTrackId === track.id) {
      // Stop current
      audioRef.current?.pause();
      audioRef.current = null;
      setPlayingTrackId(null);
      return;
    }

    // Stop previous
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    const audio = new Audio(track.fileUrl);
    audio.volume = 0.8;
    audio.onended = () => {
      setPlayingTrackId(null);
      audioRef.current = null;
    };
    audio.onerror = () => {
      toast.error(`Failed to play "${track.title}"`);
      setPlayingTrackId(null);
      audioRef.current = null;
    };
    audio.play().then(() => {
      audioRef.current = audio;
      setPlayingTrackId(track.id);
    }).catch(() => {
      toast.error('Browser blocked audio playback — click Enable Audio first');
    });
  }, [playingTrackId]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files.length) processFiles(e.dataTransfer.files);
  }, [processFiles]);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const folderInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileSelect = useCallback(() => {
    if (!fileInputRef.current) {
      const input = document.createElement('input');
      input.type = 'file';
      input.multiple = true;
      input.accept = ACCEPTED_AUDIO;
      input.style.display = 'none';
      document.body.appendChild(input);
      fileInputRef.current = input;
    }
    fileInputRef.current.onchange = (e) => {
      const target = e.target as HTMLInputElement;
      if (target.files?.length) processFiles(target.files);
      target.value = ''; // reset so same files can be re-selected
    };
    fileInputRef.current.click();
  }, [processFiles]);

  const handleFolderSelect = useCallback(() => {
    if (IS_IOS) {
      // iOS doesn't support folder selection — fall back to file picker
      handleFileSelect();
      return;
    }
    if (!folderInputRef.current) {
      const input = document.createElement('input');
      input.type = 'file';
      input.multiple = true;
      input.setAttribute('webkitdirectory', '');
      input.setAttribute('directory', '');
      input.style.display = 'none';
      document.body.appendChild(input);
      folderInputRef.current = input;
    }
    folderInputRef.current.onchange = (e) => {
      const target = e.target as HTMLInputElement;
      if (target.files?.length) processFiles(target.files);
      target.value = '';
    };
    folderInputRef.current.click();
  }, [processFiles, handleFileSelect]);

  const formatDuration = (sec?: number) => {
    if (!sec) return '--:--';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Music className="w-5 h-5 text-primary" />
          Track Pool
          <Badge variant="secondary" className="ml-auto">{tracks.length} tracks</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Upload zone */}
        <div
          className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer ${
            isDragOver ? 'border-primary bg-primary/5' : 'border-border/50 hover:border-primary/50'
          }`}
          onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
        >
          <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Drag & drop audio files or{' '}
            <span className="text-primary underline cursor-pointer" onClick={handleFileSelect}>browse files</span>
            {' '}or{' '}
            <span className="text-primary underline cursor-pointer" onClick={handleFolderSelect}>select folder</span>
          </p>
          <p className="text-xs text-muted-foreground mt-1">MP3, MP4, WAV, FLAC, OGG, AIFF, M4A</p>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleFileSelect} className="flex-1">
            <Upload className="w-4 h-4 mr-1" /> Add Files
          </Button>
          <Button variant="outline" size="sm" onClick={handleFolderSelect} className="flex-1">
            <FolderOpen className="w-4 h-4 mr-1" /> Add Folder
          </Button>
        </div>

        {/* Track list */}
        <ScrollArea className="h-[340px]">
          <div className="space-y-1">
            {tracks.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">
                Add tracks to build your DJ set pool
              </p>
            )}
            {tracks.map(track => (
              <div
                key={track.id}
                className={`flex items-center gap-2 p-2 rounded-md hover:bg-muted/40 group ${
                  playingTrackId === track.id ? 'bg-primary/10 border border-primary/30' : ''
                }`}
              >
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 shrink-0"
                  onClick={() => handlePlayToggle(track)}
                >
                  {playingTrackId === track.id ? (
                    <Pause className="w-3.5 h-3.5 text-primary" />
                  ) : (
                    <Play className="w-3.5 h-3.5" />
                  )}
                </Button>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{track.title}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    {track.artist && <span>{track.artist}</span>}
                    <span>{formatDuration(track.durationSec)}</span>
                    {track.features && (
                      <>
                        <Badge variant="outline" className="text-[10px] px-1 py-0">
                          {track.features.bpm.toFixed(0)} BPM
                        </Badge>
                        <Badge variant="outline" className="text-[10px] px-1 py-0">
                          {track.features.key}
                        </Badge>
                      </>
                    )}
                    {isAnalyzing && !track.features && (
                      <Loader2 className="w-3 h-3 animate-spin text-primary" />
                    )}
                    {playingTrackId === track.id && (
                      <Volume2 className="w-3 h-3 text-primary animate-pulse" />
                    )}
                  </div>
                </div>
                {onAmapianorize && track.features && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="opacity-0 group-hover:opacity-100 h-7 w-7"
                          onClick={() => onAmapianorize(track.id)}
                          disabled={amapianorizingTrackId === track.id}
                        >
                          {amapianorizingTrackId === track.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
                          ) : (
                            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                          )}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent><p className="text-xs">Amapianorize this track</p></TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="opacity-0 group-hover:opacity-100 h-7 w-7"
                  onClick={() => onRemoveTrack(track.id)}
                >
                  <Trash2 className="w-3.5 h-3.5 text-destructive" />
                </Button>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
