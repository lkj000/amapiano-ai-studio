/**
 * SunoGeneratorModal - Suno V4 song generation integrated into the DAW
 * Generates songs via API.box and provides direct import into DAW tracks
 */

import React, { useState, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Sparkles, Loader2, Download, Play, Pause, Music, Clock, Plus
} from 'lucide-react';
import { SA_GENRES } from '@/constants/amapianoVoices';
import { cn } from '@/lib/utils';
import { useDAWStore } from '@/stores/dawStore';

interface GeneratedTrack {
  id: string;
  title: string;
  audioUrl: string;
  imageUrl?: string;
  duration: number;
  genre: string;
  bpm: number;
  hasVocals: boolean;
}

/**
 * Custom event dispatched when importing a Suno-generated track into the DAW.
 * Both DAW.tsx and AmapianoPro.tsx listen for this event.
 */
export interface SunoImportDetail {
  id: string;
  title: string;
  audioUrl: string;
  duration: number;
  bpm: number;
  genre: string;
}

export const SUNO_IMPORT_EVENT = 'suno:import-to-daw';

export function SunoGeneratorModal() {
  const closeModal = useDAWStore(s => s.closeModal);
  
  const [prompt, setPrompt] = useState('');
  const [lyrics, setLyrics] = useState('');
  const [style, setStyle] = useState('Amapiano');
  const [bpm, setBpm] = useState(112);
  const [instrumental, setInstrumental] = useState(false);
  const [tracks, setTracks] = useState<GeneratedTrack[]>([]);
  const [status, setStatus] = useState<'idle' | 'generating' | 'done' | 'error'>('idle');
  const [progressVal, setProgressVal] = useState(0);
  const [progressMsg, setProgressMsg] = useState('');
  const [playingId, setPlayingId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const handleGenerate = useCallback(async () => {
    if (!prompt && !lyrics) { toast.error('Add a description or lyrics'); return; }

    setStatus('generating');
    setProgressVal(5);
    setProgressMsg('Submitting to Suno V4...');

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
      if (data.requiresSetup) { toast.error(data.message); setStatus('error'); return; }

      if (data.pending && data.taskId) {
        let attempts = 0;
        const max = 60;
        while (attempts < max) {
          await new Promise(r => setTimeout(r, 3000));
          attempts++;
          setProgressVal(Math.min(90, (attempts / max) * 100));
          setProgressMsg(`Generating... (${attempts * 3}s)`);
          try {
            const { data: p } = await supabase.functions.invoke('generate-song-suno', { body: { taskId: data.taskId } });
            if (p?.audioUrl) { addResult(p); return; }
          } catch { /* continue */ }
        }
        setStatus('error');
        setProgressMsg('Timed out');
      } else if (data.audioUrl) {
        addResult(data);
      }
    } catch (err) {
      setStatus('error');
      setProgressMsg(err instanceof Error ? err.message : 'Failed');
      toast.error('Generation failed');
    }
  }, [prompt, lyrics, style, bpm, instrumental]);

  const addResult = (data: any) => {
    const t: GeneratedTrack = {
      id: crypto.randomUUID(),
      title: data.metadata?.title || prompt || 'Generated Song',
      audioUrl: data.audioUrl,
      imageUrl: data.imageUrl,
      duration: data.metadata?.duration || 180,
      genre: data.metadata?.genre || style,
      bpm: data.metadata?.bpm || bpm,
      hasVocals: !instrumental,
    };
    setTracks(prev => [t, ...prev]);
    setStatus('done');
    setProgressVal(100);
    setProgressMsg('Done!');
    toast.success('Song generated!');
    setTimeout(() => { setStatus('idle'); setProgressVal(0); setProgressMsg(''); }, 3000);
  };

  const togglePlay = (track: GeneratedTrack) => {
    if (!audioRef.current) audioRef.current = new Audio();
    if (playingId === track.id) { audioRef.current.pause(); setPlayingId(null); }
    else { audioRef.current.src = track.audioUrl; audioRef.current.play(); setPlayingId(track.id); audioRef.current.onended = () => setPlayingId(null); }
  };

  const importToDAW = (track: GeneratedTrack) => {
    const detail: SunoImportDetail = {
      id: track.id,
      title: track.title,
      audioUrl: track.audioUrl,
      duration: track.duration,
      bpm: track.bpm,
      genre: track.genre,
    };
    window.dispatchEvent(new CustomEvent(SUNO_IMPORT_EVENT, { detail }));
    toast.success(`"${track.title}" imported to DAW`);
    closeModal();
  };

  const downloadTrack = (track: GeneratedTrack) => {
    const a = document.createElement('a');
    a.href = track.audioUrl;
    a.download = `${track.title}.mp3`;
    a.click();
  };

  const fmtDur = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-h-[70vh]">
      {/* Left: Form */}
      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Song Description</Label>
          <Textarea
            placeholder="An Amapiano track with jazzy piano, deep log drums..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="min-h-[70px]"
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Lyrics</Label>
            <div className="flex items-center gap-2">
              <Label htmlFor="inst-daw" className="text-xs">Instrumental</Label>
              <Switch id="inst-daw" checked={instrumental} onCheckedChange={setInstrumental} />
            </div>
          </div>
          <Textarea
            placeholder="[Verse 1]&#10;Lyrics here...&#10;&#10;[Chorus]&#10;..."
            value={lyrics}
            onChange={(e) => setLyrics(e.target.value)}
            disabled={instrumental}
            className="min-h-[100px] font-mono text-sm"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-xs">Genre</Label>
            <Select value={style} onValueChange={setStyle}>
              <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
              <SelectContent>
                {SA_GENRES.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">BPM: {bpm}</Label>
            <Slider value={[bpm]} onValueChange={([v]) => setBpm(v)} min={60} max={180} />
          </div>
        </div>

        {status !== 'idle' && (
          <div className="space-y-1.5 p-2.5 bg-muted/50 rounded-lg">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5">
                {status === 'generating' && <Loader2 className="h-3 w-3 animate-spin" />}
                {progressMsg}
              </span>
              <Badge variant={status === 'done' ? 'default' : 'secondary'} className="text-[10px]">
                {Math.round(progressVal)}%
              </Badge>
            </div>
            <Progress value={progressVal} className="h-1" />
          </div>
        )}

        <Button
          onClick={handleGenerate}
          disabled={status === 'generating' || (!prompt && !lyrics)}
          className="w-full"
        >
          {status === 'generating' ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating...</>
          ) : (
            <><Sparkles className="mr-2 h-4 w-4" /> Generate Song</>
          )}
        </Button>
      </div>

      {/* Right: Results */}
      <div className="border rounded-lg overflow-hidden">
        <div className="p-3 border-b bg-muted/30">
          <h3 className="text-sm font-medium flex items-center gap-1.5">
            <Music className="h-4 w-4 text-primary" />
            Results ({tracks.length})
          </h3>
        </div>
        {tracks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
            <Music className="h-12 w-12 mb-3 opacity-20" />
            <p className="text-sm">Generate a song to see it here</p>
          </div>
        ) : (
          <ScrollArea className="max-h-[50vh]">
            <div className="p-2 space-y-1">
              {tracks.map(track => (
                <div key={track.id} className={cn(
                  "flex items-center gap-2.5 p-2.5 rounded-lg transition-colors group",
                  playingId === track.id ? "bg-primary/5" : "hover:bg-muted/50"
                )}>
                  <button onClick={() => togglePlay(track)} className="w-10 h-10 rounded bg-muted flex items-center justify-center flex-shrink-0 hover:bg-muted/80">
                    {playingId === track.id ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{track.title}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{track.genre}</span>
                      <span>{track.bpm} BPM</span>
                      <span className="flex items-center gap-0.5"><Clock className="h-3 w-3" />{fmtDur(track.duration)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => downloadTrack(track)}>
                      <Download className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="outline" size="sm" className="h-7 gap-1 text-xs" onClick={() => importToDAW(track)}>
                      <Plus className="h-3 w-3" /> Import
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </div>
    </div>
  );
}

export default SunoGeneratorModal;
