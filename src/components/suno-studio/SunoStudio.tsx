import React, { useState, useRef, useCallback } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Music, Wand2, Sparkles, Loader2, Download, Play, Pause,
  Trash2, Clock, Gauge, MoreVertical, ArrowRight
} from 'lucide-react';
import { SA_GENRES } from '@/constants/amapianoVoices';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

interface SunoStudioProps {
  user: User | null;
}

interface GeneratedTrack {
  id: string;
  title: string;
  audioUrl: string;
  imageUrl?: string;
  duration: number;
  genre: string;
  bpm: number;
  hasVocals: boolean;
  createdAt: Date;
  prompt?: string;
  lyrics?: string;
}

interface GenProgress {
  status: 'idle' | 'generating' | 'succeeded' | 'failed';
  progress: number;
  message: string;
}

export function SunoStudio({ user }: SunoStudioProps) {
  const navigate = useNavigate();
  
  // Generation form
  const [prompt, setPrompt] = useState('');
  const [lyrics, setLyrics] = useState('');
  const [style, setStyle] = useState('Amapiano');
  const [bpm, setBpm] = useState(112);
  const [instrumental, setInstrumental] = useState(false);
  
  // State
  const [tracks, setTracks] = useState<GeneratedTrack[]>([]);
  const [progress, setProgress] = useState<GenProgress>({ status: 'idle', progress: 0, message: '' });
  const [playingId, setPlayingId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const isGenerating = progress.status === 'generating';

  const handleGenerate = useCallback(async () => {
    if (!prompt && !lyrics) {
      toast.error('Add a description or lyrics');
      return;
    }

    setProgress({ status: 'generating', progress: 5, message: 'Submitting to Suno V4...' });

    try {
      const { data, error } = await supabase.functions.invoke('generate-song-suno', {
        body: {
          lyrics: instrumental ? undefined : lyrics,
          title: prompt || 'Generated Song',
          genre: style,
          mood: 'energetic',
          bpm,
          instrumental,
          customMode: true,
        }
      });

      if (error) throw error;

      if (data.requiresSetup) {
        toast.error(data.message);
        setProgress({ status: 'failed', progress: 0, message: data.message });
        return;
      }

      if (data.pending && data.taskId) {
        // Poll for result
        let attempts = 0;
        const maxAttempts = 60;
        while (attempts < maxAttempts) {
          await new Promise(r => setTimeout(r, 3000));
          attempts++;
          setProgress({
            status: 'generating',
            progress: Math.min(90, (attempts / maxAttempts) * 100),
            message: `Generating music... (${attempts * 3}s)`
          });

          try {
            const { data: pollData } = await supabase.functions.invoke('generate-song-suno', {
              body: { taskId: data.taskId }
            });
            if (pollData?.audioUrl) {
              addTrack(pollData);
              return;
            }
          } catch { /* continue polling */ }
        }
        setProgress({ status: 'failed', progress: 0, message: 'Generation timed out' });
      } else if (data.audioUrl) {
        addTrack(data);
      } else {
        throw new Error('Unexpected response');
      }
    } catch (err) {
      console.error('Generation error:', err);
      setProgress({ status: 'failed', progress: 0, message: err instanceof Error ? err.message : 'Failed' });
      toast.error('Generation failed');
    }
  }, [prompt, lyrics, style, bpm, instrumental]);

  const addTrack = (data: any) => {
    const track: GeneratedTrack = {
      id: crypto.randomUUID(),
      title: data.metadata?.title || prompt || 'Generated Song',
      audioUrl: data.audioUrl,
      imageUrl: data.imageUrl,
      duration: data.metadata?.duration || 180,
      genre: data.metadata?.genre || style,
      bpm: data.metadata?.bpm || bpm,
      hasVocals: !instrumental,
      createdAt: new Date(),
      prompt,
      lyrics: instrumental ? undefined : lyrics,
    };
    setTracks(prev => [track, ...prev]);
    setProgress({ status: 'succeeded', progress: 100, message: 'Done!' });
    toast.success('Song generated!');
    setTimeout(() => setProgress({ status: 'idle', progress: 0, message: '' }), 3000);
  };

  const togglePlay = (track: GeneratedTrack) => {
    if (!audioRef.current) audioRef.current = new Audio();
    const audio = audioRef.current;

    if (playingId === track.id) {
      audio.pause();
      setPlayingId(null);
    } else {
      audio.src = track.audioUrl;
      audio.play();
      setPlayingId(track.id);
      audio.onended = () => setPlayingId(null);
    }
  };

  const deleteTrack = (id: string) => {
    if (playingId === id) {
      audioRef.current?.pause();
      setPlayingId(null);
    }
    setTracks(prev => prev.filter(t => t.id !== id));
    toast.success('Track deleted');
  };

  const downloadTrack = (track: GeneratedTrack) => {
    const a = document.createElement('a');
    a.href = track.audioUrl;
    a.download = `${track.title}.mp3`;
    a.click();
  };

  const fmtDur = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20">
              <Music className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Song Generator</h1>
              <p className="text-sm text-muted-foreground">Generate complete songs with Suno V4 • Download & use in DAW</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => navigate('/amapiano-pro')}>
            <ArrowRight className="h-4 w-4 mr-1.5" />
            Open in DAW
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Left: Generation Form */}
          <Card className="lg:col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Wand2 className="h-5 w-5 text-primary" />
                Create Song
              </CardTitle>
              <CardDescription>Describe your song and generate with AI</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Song Description</Label>
                <Textarea
                  placeholder="An uplifting Amapiano track with jazzy piano chords, deep log drums..."
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="min-h-[80px]"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Lyrics</Label>
                  <div className="flex items-center gap-2">
                    <Label htmlFor="inst" className="text-xs">Instrumental</Label>
                    <Switch id="inst" checked={instrumental} onCheckedChange={setInstrumental} />
                  </div>
                </div>
                <Textarea
                  placeholder="[Verse 1]&#10;Your lyrics here...&#10;&#10;[Chorus]&#10;..."
                  value={lyrics}
                  onChange={(e) => setLyrics(e.target.value)}
                  disabled={instrumental}
                  className="min-h-[120px] font-mono text-sm"
                />
                {!instrumental && (
                  <p className="text-xs text-muted-foreground">{lyrics.length}/3000 chars</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Genre</Label>
                  <Select value={style} onValueChange={setStyle}>
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SA_GENRES.map(g => (
                        <SelectItem key={g} value={g}>{g}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">BPM: {bpm}</Label>
                  <Slider value={[bpm]} onValueChange={([v]) => setBpm(v)} min={60} max={180} />
                </div>
              </div>

              {/* Progress */}
              {progress.status !== 'idle' && (
                <div className="space-y-2 p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-1.5">
                      {isGenerating && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                      {progress.message}
                    </span>
                    <Badge variant={progress.status === 'succeeded' ? 'default' : 'secondary'} className="text-xs">
                      {Math.round(progress.progress)}%
                    </Badge>
                  </div>
                  <Progress value={progress.progress} className="h-1.5" />
                </div>
              )}

              <Button
                onClick={handleGenerate}
                disabled={isGenerating || (!prompt && !lyrics)}
                className="w-full h-11"
                size="lg"
              >
                {isGenerating ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating...</>
                ) : (
                  <><Sparkles className="mr-2 h-4 w-4" /> Generate Song</>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Right: Generated Tracks */}
          <Card className="lg:col-span-3">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Music className="h-5 w-5 text-primary" />
                Generated Songs
              </CardTitle>
              <CardDescription>
                {tracks.length} {tracks.length === 1 ? 'song' : 'songs'} • Click to preview, download to use
              </CardDescription>
            </CardHeader>
            <CardContent>
              {tracks.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <Music className="h-16 w-16 text-muted-foreground/20 mb-4" />
                  <p className="text-muted-foreground">No songs yet — generate your first!</p>
                </div>
              ) : (
                <ScrollArea className="max-h-[600px]">
                  <div className="space-y-2">
                    {tracks.map((track) => (
                      <div
                        key={track.id}
                        className={cn(
                          "flex items-center gap-3 p-3 rounded-lg border transition-colors group",
                          playingId === track.id
                            ? "bg-primary/5 border-primary/30"
                            : "border-transparent hover:bg-muted/50"
                        )}
                      >
                        {/* Play button / thumbnail */}
                        <button
                          onClick={() => togglePlay(track)}
                          className="relative w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 bg-muted flex items-center justify-center group/play"
                        >
                          {track.imageUrl ? (
                            <img src={track.imageUrl} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <Music className="h-6 w-6 text-muted-foreground" />
                          )}
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover/play:opacity-100 transition-opacity">
                            {playingId === track.id ? (
                              <Pause className="h-5 w-5 text-white" />
                            ) : (
                              <Play className="h-5 w-5 text-white" />
                            )}
                          </div>
                        </button>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{track.title}</p>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <Badge variant="outline" className="text-[10px] h-4 px-1.5">{track.genre}</Badge>
                            <span className="text-xs text-muted-foreground">{track.bpm} BPM</span>
                            <span className="text-xs text-muted-foreground flex items-center gap-0.5">
                              <Clock className="h-3 w-3" /> {fmtDur(track.duration)}
                            </span>
                            {track.hasVocals && <Badge variant="secondary" className="text-[10px] h-4 px-1.5">Vocals</Badge>}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 gap-1"
                            onClick={() => downloadTrack(track)}
                          >
                            <Download className="h-3.5 w-3.5" />
                            <span className="hidden sm:inline">Download</span>
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => navigate('/amapiano-pro')}>
                                <ArrowRight className="h-4 w-4 mr-2" />
                                Open in DAW
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-destructive" onClick={() => deleteTrack(track.id)}>
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default SunoStudio;
