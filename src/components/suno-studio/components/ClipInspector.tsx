import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  Music,
  Download,
  Split,
  RefreshCw,
  ArrowRight,
  Mic2,
  Copy,
  Trash2,
  Share2,
  Star,
  Clock,
  Hash,
  Gauge,
  FileAudio
} from 'lucide-react';
import { GeneratedClip, StemType } from '../SunoStudioTypes';

interface ClipInspectorProps {
  clip: GeneratedClip | null;
  onSeparateStems: (clipId: string) => void;
  onExtend: (clipId: string, direction: 'forward' | 'backward') => void;
  onCreateVariation: (clipId: string) => void;
  onDownload: (clipId: string, format: 'mp3' | 'wav' | 'stems') => void;
  onDelete: (clipId: string) => void;
}

export function ClipInspector({
  clip,
  onSeparateStems,
  onExtend,
  onCreateVariation,
  onDownload,
  onDelete
}: ClipInspectorProps) {
  if (!clip) {
    return (
      <Card className="h-full">
        <CardContent className="h-full flex flex-col items-center justify-center text-center p-8">
          <FileAudio className="h-16 w-16 text-muted-foreground/30 mb-4" />
          <h3 className="text-lg font-medium text-muted-foreground">No Clip Selected</h3>
          <p className="text-sm text-muted-foreground mt-2">
            Generate a song or select a clip from the timeline to see details
          </p>
        </CardContent>
      </Card>
    );
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const stemColors: Record<StemType, string> = {
    vocals: 'bg-red-500',
    drums: 'bg-orange-500',
    bass: 'bg-yellow-500',
    other: 'bg-green-500',
    piano: 'bg-blue-500',
    guitar: 'bg-purple-500',
    strings: 'bg-pink-500',
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Music className="h-5 w-5 text-primary" />
          Clip Inspector
        </CardTitle>
      </CardHeader>

      <CardContent className="flex-1 overflow-hidden">
        <ScrollArea className="h-full pr-4">
          <div className="space-y-6">
            {/* Cover Image & Title */}
            <div className="flex gap-4">
              {clip.imageUrl ? (
                <img 
                  src={clip.imageUrl} 
                  alt={clip.title}
                  className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
                />
              ) : (
                <div className="w-20 h-20 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                  <Music className="h-8 w-8 text-muted-foreground" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold truncate">{clip.title}</h3>
                <p className="text-sm text-muted-foreground">
                  {clip.metadata.genre}
                </p>
                <div className="flex flex-wrap gap-1 mt-2">
                  {clip.metadata.hasVocals && (
                    <Badge variant="secondary" className="text-xs">Vocals</Badge>
                  )}
                  {clip.metadata.isInstrumental && (
                    <Badge variant="outline" className="text-xs">Instrumental</Badge>
                  )}
                  {clip.isVariation && (
                    <Badge variant="outline" className="text-xs">Variation</Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Audio Player */}
            <div className="space-y-2">
              <audio 
                controls 
                src={clip.audioUrl}
                className="w-full h-10"
              />
            </div>

            {/* Metadata */}
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Duration</p>
                  <p className="text-sm font-medium">{formatDuration(clip.duration)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg">
                <Gauge className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">BPM</p>
                  <p className="text-sm font-medium">{clip.metadata.bpm}</p>
                </div>
              </div>
              {clip.metadata.key && (
                <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg">
                  <Hash className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Key</p>
                    <p className="text-sm font-medium">{clip.metadata.key}</p>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg">
                <Star className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Model</p>
                  <p className="text-sm font-medium">{clip.metadata.modelVersion}</p>
                </div>
              </div>
            </div>

            {/* Stems Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium">Stems</h4>
                {!clip.stems && (
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => onSeparateStems(clip.id)}
                  >
                    <Split className="h-3 w-3 mr-1" />
                    Separate
                  </Button>
                )}
              </div>
              
              {clip.stems ? (
                <div className="space-y-2">
                  {Object.entries(clip.stems).map(([type, url]) => (
                    <div 
                      key={type}
                      className="flex items-center justify-between p-2 bg-muted/30 rounded-lg"
                    >
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${stemColors[type as StemType]}`} />
                        <span className="text-sm capitalize">{type}</span>
                      </div>
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        className="h-7 w-7"
                        asChild
                      >
                        <a href={url} download={`${type}.wav`}>
                          <Download className="h-3 w-3" />
                        </a>
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Separate this clip into individual stems for detailed editing
                </p>
              )}
            </div>

            <Separator />

            {/* Quick Actions */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium">Quick Actions</h4>
              <div className="grid grid-cols-2 gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => onExtend(clip.id, 'forward')}
                >
                  <ArrowRight className="h-3 w-3 mr-1" />
                  Extend
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => onCreateVariation(clip.id)}
                >
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Variation
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {/* Cover action */}}
                >
                  <Mic2 className="h-3 w-3 mr-1" />
                  Cover
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {/* Share action */}}
                >
                  <Share2 className="h-3 w-3 mr-1" />
                  Share
                </Button>
              </div>
            </div>

            <Separator />

            {/* Download Options */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium">Download</h4>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1"
                  onClick={() => onDownload(clip.id, 'mp3')}
                >
                  MP3
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1"
                  onClick={() => onDownload(clip.id, 'wav')}
                >
                  WAV
                </Button>
                {clip.stems && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1"
                    onClick={() => onDownload(clip.id, 'stems')}
                  >
                    Stems
                  </Button>
                )}
              </div>
            </div>

            {/* Prompt & Lyrics */}
            {(clip.prompt || clip.lyrics) && (
              <>
                <Separator />
                <div className="space-y-3">
                  {clip.prompt && (
                    <div className="space-y-1">
                      <h4 className="text-sm font-medium">Prompt</h4>
                      <p className="text-xs text-muted-foreground bg-muted/30 p-2 rounded">
                        {clip.prompt}
                      </p>
                    </div>
                  )}
                  {clip.lyrics && (
                    <div className="space-y-1">
                      <h4 className="text-sm font-medium">Lyrics</h4>
                      <p className="text-xs text-muted-foreground bg-muted/30 p-2 rounded whitespace-pre-wrap max-h-[200px] overflow-y-auto font-mono">
                        {clip.lyrics}
                      </p>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Delete */}
            <div className="pt-4">
              <Button 
                variant="ghost" 
                size="sm" 
                className="w-full text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={() => onDelete(clip.id)}
              >
                <Trash2 className="h-3 w-3 mr-1" />
                Delete Clip
              </Button>
            </div>
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
