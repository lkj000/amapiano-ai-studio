import { useState, useCallback, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';
import { Download, FileText, ListMusic, BarChart3, Clock, Music2, ArrowRight, Play, Pause, SkipForward, SkipBack, Volume2 } from 'lucide-react';
import { GeneratedSet } from './DJAgentTypes';
import { toast } from 'sonner';

interface DJSetPreviewProps {
  sets: GeneratedSet[];
  activeSetIndex: number;
  onSelectSet: (index: number) => void;
  tracks?: { id: string; fileUrl: string }[];
}

export default function DJSetPreview({ sets, activeSetIndex, onSelectSet, tracks = [] }: DJSetPreviewProps) {
  const [playingIndex, setPlayingIndex] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const animFrameRef = useRef<number>(0);

  const activeSet = sets[activeSetIndex];

  // Cleanup on unmount or set change
  useEffect(() => {
    return () => {
      audioRef.current?.pause();
      cancelAnimationFrame(animFrameRef.current);
    };
  }, [activeSetIndex]);

  const findTrackUrl = useCallback((trackId?: string): string | null => {
    if (!trackId) return null;
    const t = tracks.find(tr => tr.id === trackId);
    return t?.fileUrl || null;
  }, [tracks]);

  const updateTimeLoop = useCallback(() => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
    animFrameRef.current = requestAnimationFrame(updateTimeLoop);
  }, []);

  const playTrackAtIndex = useCallback((index: number) => {
    if (!activeSet) return;
    
    // Find the track items in the set (skip transition items)
    const trackItems = activeSet.items.filter(item => item.type === 'track');
    if (index < 0 || index >= trackItems.length) return;

    const item = trackItems[index];
    const url = findTrackUrl(item.trackId);
    
    if (!url) {
      toast.error(`No audio URL for "${item.trackTitle}"`);
      return;
    }

    // Stop current
    audioRef.current?.pause();
    cancelAnimationFrame(animFrameRef.current);

    const audio = new Audio(url);
    audio.volume = volume;
    
    audio.onloadedmetadata = () => {
      setDuration(audio.duration);
    };
    
    audio.onended = () => {
      // Auto-advance to next track
      const nextIndex = index + 1;
      if (nextIndex < trackItems.length) {
        playTrackAtIndex(nextIndex);
      } else {
        setIsPlaying(false);
        setPlayingIndex(null);
        cancelAnimationFrame(animFrameRef.current);
      }
    };

    audio.onerror = () => {
      toast.error(`Failed to play track`);
      setIsPlaying(false);
      setPlayingIndex(null);
    };

    audio.play().then(() => {
      audioRef.current = audio;
      setPlayingIndex(index);
      setIsPlaying(true);
      updateTimeLoop();
    }).catch(() => {
      toast.error('Browser blocked audio — interact with the page first');
    });
  }, [activeSet, findTrackUrl, volume, updateTimeLoop]);

  const handlePlayPause = useCallback(() => {
    if (!activeSet) return;
    
    if (isPlaying && audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
      cancelAnimationFrame(animFrameRef.current);
    } else if (!isPlaying && audioRef.current && playingIndex !== null) {
      audioRef.current.play();
      setIsPlaying(true);
      updateTimeLoop();
    } else {
      // Start from beginning
      playTrackAtIndex(0);
    }
  }, [isPlaying, playingIndex, activeSet, playTrackAtIndex, updateTimeLoop]);

  const handleSkip = useCallback((direction: 'next' | 'prev') => {
    if (!activeSet || playingIndex === null) return;
    const trackItems = activeSet.items.filter(item => item.type === 'track');
    const next = direction === 'next' ? playingIndex + 1 : playingIndex - 1;
    if (next >= 0 && next < trackItems.length) {
      playTrackAtIndex(next);
    }
  }, [activeSet, playingIndex, playTrackAtIndex]);

  const handleVolumeChange = useCallback((val: number[]) => {
    const v = val[0];
    setVolume(v);
    if (audioRef.current) audioRef.current.volume = v;
  }, []);

  const handleSeek = useCallback((val: number[]) => {
    if (audioRef.current) {
      audioRef.current.currentTime = val[0];
      setCurrentTime(val[0]);
    }
  }, []);

  const formatTimestamp = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  if (sets.length === 0) {
    return (
      <Card className="border-border/50 bg-card/80 backdrop-blur-sm h-full flex items-center justify-center">
        <div className="text-center p-8">
          <ListMusic className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">Generated sets will appear here</p>
          <p className="text-xs text-muted-foreground/60 mt-1">The agent will produce 3 variations (Safe, Balanced, Wild)</p>
        </div>
      </Card>
    );
  }

  const scoreColor = (score: number) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  const trackItems = activeSet.items.filter(item => item.type === 'track');

  return (
    <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <ListMusic className="w-5 h-5 text-primary" />
            Generated Sets
          </CardTitle>
          <div className="flex gap-1">
            {sets.map((set, i) => (
              <Button
                key={set.planId}
                variant={i === activeSetIndex ? 'default' : 'outline'}
                size="sm"
                onClick={() => onSelectSet(i)}
                className="text-xs px-3"
              >
                v{i + 1}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Transport controls */}
        {tracks.length > 0 && (
          <div className="bg-muted/30 rounded-lg p-3 space-y-2">
            <div className="flex items-center justify-center gap-2">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleSkip('prev')} disabled={playingIndex === null || playingIndex === 0}>
                <SkipBack className="w-4 h-4" />
              </Button>
              <Button variant="default" size="icon" className="h-10 w-10 rounded-full" onClick={handlePlayPause}>
                {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleSkip('next')} disabled={playingIndex === null || playingIndex >= trackItems.length - 1}>
                <SkipForward className="w-4 h-4" />
              </Button>
            </div>
            
            {playingIndex !== null && (
              <>
                <div className="text-center text-xs text-muted-foreground">
                  Now: <span className="text-foreground font-medium">{trackItems[playingIndex]?.trackTitle}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="w-10 text-right font-mono">{formatTimestamp(currentTime)}</span>
                  <Slider
                    value={[currentTime]}
                    max={duration || 1}
                    step={0.1}
                    onValueChange={handleSeek}
                    className="flex-1"
                  />
                  <span className="w-10 font-mono">{formatTimestamp(duration)}</span>
                </div>
              </>
            )}
            
            <div className="flex items-center gap-2">
              <Volume2 className="w-3.5 h-3.5 text-muted-foreground" />
              <Slider value={[volume]} max={1} step={0.01} onValueChange={handleVolumeChange} className="w-24" />
            </div>
          </div>
        )}

        {/* Scores */}
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-muted/30 rounded-lg p-2.5 text-center">
            <p className={`text-xl font-bold ${scoreColor(activeSet.scores.overall)}`}>{activeSet.scores.overall}</p>
            <p className="text-[10px] text-muted-foreground">Overall</p>
          </div>
          <div className="bg-muted/30 rounded-lg p-2.5 text-center">
            <p className={`text-xl font-bold ${scoreColor(activeSet.scores.energySmoothness)}`}>{activeSet.scores.energySmoothness}</p>
            <p className="text-[10px] text-muted-foreground">Energy Flow</p>
          </div>
          <div className="bg-muted/30 rounded-lg p-2.5 text-center">
            <p className={`text-xl font-bold ${scoreColor(activeSet.scores.transitionCleanliness)}`}>{activeSet.scores.transitionCleanliness}</p>
            <p className="text-[10px] text-muted-foreground">Transitions</p>
          </div>
        </div>

        {/* Energy curve */}
        <div className="space-y-1">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <BarChart3 className="w-3 h-3" /> Energy Arc
          </div>
          <div className="flex items-end gap-px h-12">
            {activeSet.energyCurve.map((val, i) => (
              <div
                key={i}
                className="flex-1 rounded-t-sm transition-all"
                style={{
                  height: `${val * 100}%`,
                  background: `hsl(${45 + (val * 225)}, 80%, ${50 + val * 20}%)`,
                }}
              />
            ))}
          </div>
        </div>

        <Separator />

        {/* Tracklist */}
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground font-medium flex items-center gap-1">
            <Clock className="w-3 h-3" /> Tracklist ({activeSet.tracklist.length} tracks)
          </p>
          <ScrollArea className="h-[200px]">
            <div className="space-y-0.5">
              {activeSet.tracklist.map((item, i) => (
                <div
                  key={i}
                  className={`flex items-center gap-2 p-1.5 rounded hover:bg-muted/30 text-sm cursor-pointer ${
                    playingIndex === i ? 'bg-primary/10 border border-primary/30' : ''
                  }`}
                  onClick={() => tracks.length > 0 && playTrackAtIndex(i)}
                >
                  <span className="text-xs text-muted-foreground w-10 shrink-0 font-mono">{item.time}</span>
                  {playingIndex === i && isPlaying ? (
                    <Volume2 className="w-3 h-3 text-primary animate-pulse shrink-0" />
                  ) : (
                    <Music2 className="w-3 h-3 text-primary shrink-0" />
                  )}
                  <span className="flex-1 truncate">{item.title}</span>
                  {item.artist && <span className="text-xs text-muted-foreground truncate max-w-[80px]">{item.artist}</span>}
                  <Badge variant="outline" className="text-[9px] px-1 py-0 shrink-0">{item.bpm} BPM</Badge>
                  <Badge variant="outline" className="text-[9px] px-1 py-0 shrink-0">{item.key}</Badge>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>

        <Separator />

        {/* Export */}
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="flex-1">
            <Download className="w-4 h-4 mr-1" /> Export Mix
          </Button>
          <Button variant="outline" size="sm" className="flex-1">
            <FileText className="w-4 h-4 mr-1" /> Cue Sheet
          </Button>
          <Button variant="outline" size="sm">
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
