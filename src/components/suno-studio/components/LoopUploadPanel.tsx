import React, { useState, useRef, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { 
  Upload, 
  Music, 
  Wand2, 
  Loader2, 
  Play, 
  Pause, 
  Volume2,
  FileAudio,
  Sparkles,
  Drum,
  Guitar,
  Piano,
  Mic2,
  Trash2,
  Check,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { SA_GENRES } from '@/constants/amapianoVoices';

interface UploadedLoop {
  id: string;
  file: File;
  audioUrl: string;
  name: string;
  duration: number;
  type: 'loop' | 'sample' | 'vocal';
  isActive: boolean;
}

interface LoopUploadPanelProps {
  onBuildBeat: (loops: UploadedLoop[], options: BeatBuildOptions) => void;
  isProcessing: boolean;
  progress: number;
  progressMessage?: string;
}

export interface BeatBuildOptions {
  style: string;
  prompt: string;
  bpm: number;
  key: string;
  duration: number;
  preserveLoop: boolean;
  blendAmount: number;
  addDrums: boolean;
  addBass: boolean;
  addMelody: boolean;
  addVocals: boolean;
}

const MUSICAL_KEYS = [
  'C Major', 'C Minor', 'C# Major', 'C# Minor',
  'D Major', 'D Minor', 'D# Major', 'D# Minor',
  'E Major', 'E Minor', 'F Major', 'F Minor',
  'F# Major', 'F# Minor', 'G Major', 'G Minor',
  'G# Major', 'G# Minor', 'A Major', 'A Minor',
  'A# Major', 'A# Minor', 'B Major', 'B Minor',
  'Auto Detect'
];

export function LoopUploadPanel({
  onBuildBeat,
  isProcessing,
  progress,
  progressMessage
}: LoopUploadPanelProps) {
  const [loops, setLoops] = useState<UploadedLoop[]>([]);
  const [style, setStyle] = useState('Amapiano');
  const [prompt, setPrompt] = useState('');
  const [bpm, setBpm] = useState(112);
  const [key, setKey] = useState('Auto Detect');
  const [duration, setDuration] = useState(180);
  const [preserveLoop, setPreserveLoop] = useState(true);
  const [blendAmount, setBlendAmount] = useState(70);
  const [addDrums, setAddDrums] = useState(true);
  const [addBass, setAddBass] = useState(true);
  const [addMelody, setAddMelody] = useState(true);
  const [addVocals, setAddVocals] = useState(false);
  const [playingLoopId, setPlayingLoopId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioRefs = useRef<Map<string, HTMLAudioElement>>(new Map());

  const handleFileSelect = useCallback((files: FileList | null) => {
    if (!files) return;

    Array.from(files).forEach((file) => {
      if (!file.type.startsWith('audio/')) return;

      const loop: UploadedLoop = {
        id: crypto.randomUUID(),
        file,
        audioUrl: URL.createObjectURL(file),
        name: file.name.replace(/\.[^/.]+$/, ''),
        duration: 0,
        type: 'loop',
        isActive: true,
      };

      // Get duration
      const audio = new Audio(loop.audioUrl);
      audio.onloadedmetadata = () => {
        loop.duration = audio.duration;
        setLoops((prev) => [...prev, loop]);
      };
      audioRefs.current.set(loop.id, audio);
    });
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const removeLoop = (id: string) => {
    const audio = audioRefs.current.get(id);
    if (audio) {
      audio.pause();
      audioRefs.current.delete(id);
    }
    setLoops((prev) => prev.filter((l) => l.id !== id));
    if (playingLoopId === id) setPlayingLoopId(null);
  };

  const togglePlayLoop = (id: string) => {
    if (playingLoopId === id) {
      audioRefs.current.get(id)?.pause();
      setPlayingLoopId(null);
    } else {
      if (playingLoopId) {
        audioRefs.current.get(playingLoopId)?.pause();
      }
      audioRefs.current.get(id)?.play();
      setPlayingLoopId(id);
    }
  };

  const toggleLoopActive = (id: string) => {
    setLoops((prev) =>
      prev.map((l) => (l.id === id ? { ...l, isActive: !l.isActive } : l))
    );
  };

  const updateLoopType = (id: string, type: 'loop' | 'sample' | 'vocal') => {
    setLoops((prev) =>
      prev.map((l) => (l.id === id ? { ...l, type } : l))
    );
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleBuildBeat = () => {
    const activeLoops = loops.filter((l) => l.isActive);
    if (activeLoops.length === 0) return;

    onBuildBeat(activeLoops, {
      style,
      prompt,
      bpm,
      key,
      duration,
      preserveLoop,
      blendAmount,
      addDrums,
      addBass,
      addMelody,
      addVocals,
    });
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5 text-primary" />
          Loop Upload Studio
        </CardTitle>
        <CardDescription>
          Upload your loops and let AI build a complete beat around them
        </CardDescription>
      </CardHeader>

      <CardContent className="flex-1 overflow-auto space-y-4">
        {/* Upload Zone */}
        <div
          className={cn(
            "border-2 border-dashed rounded-lg p-6 text-center transition-all cursor-pointer",
            isDragging ? "border-primary bg-primary/10" : "border-muted-foreground/30 hover:border-primary/50",
            loops.length > 0 && "py-4"
          )}
          onClick={() => fileInputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*"
            multiple
            onChange={(e) => handleFileSelect(e.target.files)}
            className="hidden"
          />
          <FileAudio className={cn("mx-auto mb-2 text-muted-foreground", loops.length > 0 ? "h-6 w-6" : "h-10 w-10")} />
          <p className="text-sm text-muted-foreground">
            {loops.length > 0 
              ? "Drop more loops or click to add" 
              : "Drag & drop your loops, samples, or vocals here"}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Supports MP3, WAV, FLAC (up to 8 minutes)
          </p>
        </div>

        {/* Uploaded Loops List */}
        {loops.length > 0 && (
          <div className="space-y-2">
            <Label className="text-sm font-medium">Your Loops ({loops.length})</Label>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {loops.map((loop) => (
                <div
                  key={loop.id}
                  className={cn(
                    "flex items-center gap-2 p-2 rounded-lg border transition-all",
                    loop.isActive ? "bg-primary/10 border-primary/30" : "bg-muted/30 opacity-60"
                  )}
                >
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 flex-shrink-0"
                    onClick={(e) => { e.stopPropagation(); togglePlayLoop(loop.id); }}
                  >
                    {playingLoopId === loop.id ? (
                      <Pause className="h-4 w-4" />
                    ) : (
                      <Play className="h-4 w-4" />
                    )}
                  </Button>
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{loop.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDuration(loop.duration)}
                    </p>
                  </div>

                  <Select
                    value={loop.type}
                    onValueChange={(v) => updateLoopType(loop.id, v as any)}
                  >
                    <SelectTrigger className="w-24 h-7 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="loop">Loop</SelectItem>
                      <SelectItem value="sample">Sample</SelectItem>
                      <SelectItem value="vocal">Vocal</SelectItem>
                    </SelectContent>
                  </Select>

                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => toggleLoopActive(loop.id)}
                  >
                    {loop.isActive ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <X className="h-4 w-4" />
                    )}
                  </Button>

                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive"
                    onClick={() => removeLoop(loop.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Beat Building Options */}
        <div className="space-y-4 pt-4 border-t">
          <div className="space-y-2">
            <Label>Style Direction</Label>
            <Textarea
              placeholder="Describe what you want the AI to build around your loop... (e.g., 'Add deep log drums, jazzy piano chords, and a bouncy bassline')"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="min-h-[80px]"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Genre/Style</Label>
              <Select value={style} onValueChange={setStyle}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SA_GENRES.map((g) => (
                    <SelectItem key={g} value={g}>{g}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Key</Label>
              <Select value={key} onValueChange={setKey}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MUSICAL_KEYS.map((k) => (
                    <SelectItem key={k} value={k}>{k}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>BPM: {bpm}</Label>
            <Slider
              value={[bpm]}
              onValueChange={([v]) => setBpm(v)}
              min={60}
              max={180}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>AI Blend Amount: {blendAmount}%</Label>
              <div className="flex items-center gap-2">
                <Switch
                  id="preserve"
                  checked={preserveLoop}
                  onCheckedChange={setPreserveLoop}
                />
                <Label htmlFor="preserve" className="text-xs">Preserve Original Loop</Label>
              </div>
            </div>
            <Slider
              value={[blendAmount]}
              onValueChange={([v]) => setBlendAmount(v)}
              min={10}
              max={100}
            />
            <p className="text-xs text-muted-foreground">
              Lower = subtle additions, Higher = more AI-generated content
            </p>
          </div>

          {/* What to Generate */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Elements to Generate</Label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant={addDrums ? "default" : "outline"}
                size="sm"
                className="justify-start gap-2"
                onClick={() => setAddDrums(!addDrums)}
              >
                <Drum className="h-4 w-4" />
                Drums
              </Button>
              <Button
                variant={addBass ? "default" : "outline"}
                size="sm"
                className="justify-start gap-2"
                onClick={() => setAddBass(!addBass)}
              >
                <Guitar className="h-4 w-4" />
                Bass
              </Button>
              <Button
                variant={addMelody ? "default" : "outline"}
                size="sm"
                className="justify-start gap-2"
                onClick={() => setAddMelody(!addMelody)}
              >
                <Piano className="h-4 w-4" />
                Melody
              </Button>
              <Button
                variant={addVocals ? "default" : "outline"}
                size="sm"
                className="justify-start gap-2"
                onClick={() => setAddVocals(!addVocals)}
              >
                <Mic2 className="h-4 w-4" />
                Vocals
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Target Duration: {Math.floor(duration / 60)}:{(duration % 60).toString().padStart(2, '0')}</Label>
            <Slider
              value={[duration]}
              onValueChange={([v]) => setDuration(v)}
              min={30}
              max={480}
              step={15}
            />
          </div>
        </div>

        {/* Progress */}
        {isProcessing && (
          <div className="space-y-2 p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm font-medium">Building Beat...</span>
              </div>
              <Badge variant="secondary">{Math.round(progress)}%</Badge>
            </div>
            <Progress value={progress} className="h-2" />
            {progressMessage && (
              <p className="text-xs text-muted-foreground">{progressMessage}</p>
            )}
          </div>
        )}

        {/* Build Button */}
        <Button
          onClick={handleBuildBeat}
          disabled={isProcessing || loops.filter(l => l.isActive).length === 0}
          className="w-full h-12 text-lg"
          size="lg"
        >
          {isProcessing ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Building Beat...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-5 w-5" />
              Build Beat Around Loop{loops.filter(l => l.isActive).length > 1 ? 's' : ''}
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
