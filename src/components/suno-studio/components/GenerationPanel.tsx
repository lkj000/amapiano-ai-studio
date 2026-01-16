import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Wand2, 
  Music, 
  Repeat, 
  Mic2, 
  Scissors,
  Upload,
  Loader2,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  RefreshCw
} from 'lucide-react';
import { GenerationMode, GenerationRequest, GenerationProgress } from '../SunoStudioTypes';
import { SA_GENRES, AMAPIANO_VOICE_CATEGORIES } from '@/constants/amapianoVoices';

interface GenerationPanelProps {
  mode: GenerationMode;
  onModeChange: (mode: GenerationMode) => void;
  onGenerate: (request: GenerationRequest) => void;
  progress: GenerationProgress | null;
  selectedClipId: string | null;
}

export function GenerationPanel({
  mode,
  onModeChange,
  onGenerate,
  progress,
  selectedClipId
}: GenerationPanelProps) {
  const [prompt, setPrompt] = useState('');
  const [lyrics, setLyrics] = useState('');
  const [style, setStyle] = useState('Amapiano');
  const [bpm, setBpm] = useState(112);
  const [instrumental, setInstrumental] = useState(false);
  const [duration, setDuration] = useState(180);
  const [variations, setVariations] = useState(1);
  const [voiceStyle, setVoiceStyle] = useState('nkosazana');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  const isGenerating = progress?.status === 'generating' || progress?.status === 'processing' || progress?.status === 'starting';

  const handleGenerate = () => {
    onGenerate({
      mode,
      prompt,
      lyrics: instrumental ? undefined : lyrics,
      style,
      bpm,
      instrumental,
      duration,
      variations
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFile(file);
    }
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Wand2 className="h-5 w-5 text-primary" />
          Generation Studio
        </CardTitle>
        <CardDescription>
          Create, extend, remix, or cover any song
        </CardDescription>
      </CardHeader>

      <CardContent className="flex-1 overflow-auto space-y-4">
        {/* Mode Tabs */}
        <Tabs value={mode} onValueChange={(v) => onModeChange(v as GenerationMode)}>
          <TabsList className="grid grid-cols-5 w-full">
            <TabsTrigger value="create" className="text-xs gap-1">
              <Sparkles className="h-3 w-3" />
              Create
            </TabsTrigger>
            <TabsTrigger value="extend" className="text-xs gap-1">
              <ArrowRight className="h-3 w-3" />
              Extend
            </TabsTrigger>
            <TabsTrigger value="remix" className="text-xs gap-1">
              <RefreshCw className="h-3 w-3" />
              Remix
            </TabsTrigger>
            <TabsTrigger value="cover" className="text-xs gap-1">
              <Mic2 className="h-3 w-3" />
              Cover
            </TabsTrigger>
            <TabsTrigger value="inpaint" className="text-xs gap-1">
              <Scissors className="h-3 w-3" />
              Inpaint
            </TabsTrigger>
          </TabsList>

          {/* Create Mode */}
          <TabsContent value="create" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Song Description</Label>
              <Textarea
                placeholder="Describe the song you want to create... (e.g., 'An uplifting Amapiano track with jazzy piano chords, deep log drums, and catchy vocal hooks')"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="min-h-[100px]"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Lyrics</Label>
                <div className="flex items-center gap-2">
                  <Label htmlFor="instrumental" className="text-sm">Instrumental</Label>
                  <Switch 
                    id="instrumental" 
                    checked={instrumental}
                    onCheckedChange={setInstrumental}
                  />
                </div>
              </div>
              <Textarea
                placeholder="[Verse 1]&#10;Your lyrics here...&#10;&#10;[Chorus]&#10;Catchy chorus..."
                value={lyrics}
                onChange={(e) => setLyrics(e.target.value)}
                disabled={instrumental}
                className="min-h-[150px] font-mono text-sm"
              />
              {!instrumental && (
                <p className="text-xs text-muted-foreground">
                  {lyrics.length}/3000 characters • Use [Verse], [Chorus], [Bridge] tags
                </p>
              )}
            </div>
          </TabsContent>

          {/* Extend Mode */}
          <TabsContent value="extend" className="space-y-4 mt-4">
            {selectedClipId ? (
              <>
                <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
                  <p className="text-sm">
                    Extend the selected clip by generating additional music that seamlessly continues from where it ends.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Button variant="outline" className="h-20 flex-col gap-2">
                    <ArrowLeft className="h-5 w-5" />
                    <span>Extend Backward</span>
                    <span className="text-xs text-muted-foreground">Add intro</span>
                  </Button>
                  <Button variant="outline" className="h-20 flex-col gap-2">
                    <ArrowRight className="h-5 w-5" />
                    <span>Extend Forward</span>
                    <span className="text-xs text-muted-foreground">Continue song</span>
                  </Button>
                </div>
                <div className="space-y-2">
                  <Label>Extension Duration: {duration}s</Label>
                  <Slider
                    value={[duration]}
                    onValueChange={([v]) => setDuration(v)}
                    min={15}
                    max={120}
                    step={5}
                  />
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Music className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  Select a clip in the timeline to extend it
                </p>
              </div>
            )}
          </TabsContent>

          {/* Remix Mode */}
          <TabsContent value="remix" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Upload Audio to Remix</Label>
              <div className="border-2 border-dashed rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer">
                <input
                  type="file"
                  accept="audio/*"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="remix-upload"
                />
                <label htmlFor="remix-upload" className="cursor-pointer">
                  <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    {uploadedFile ? uploadedFile.name : 'Click to upload audio (up to 8 min)'}
                  </p>
                </label>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Target Style</Label>
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
              <Label>Remix Intensity: {Math.round((duration / 120) * 100)}%</Label>
              <Slider
                value={[duration]}
                onValueChange={([v]) => setDuration(v)}
                min={0}
                max={100}
              />
              <p className="text-xs text-muted-foreground">
                Lower = subtle changes, Higher = dramatic transformation
              </p>
            </div>
          </TabsContent>

          {/* Cover Mode */}
          <TabsContent value="cover" className="space-y-4 mt-4">
            <div className="p-4 bg-primary/10 rounded-lg border border-primary/20 space-y-2">
              <h4 className="font-medium flex items-center gap-2">
                <Mic2 className="h-4 w-4" />
                AI Cover Generation
              </h4>
              <p className="text-sm text-muted-foreground">
                Transform any song with a new AI voice while preserving the original instrumental.
              </p>
            </div>
            
            <div className="space-y-2">
              <Label>Upload Song to Cover</Label>
              <div className="border-2 border-dashed rounded-lg p-6 text-center hover:border-primary/50 transition-colors cursor-pointer">
                <input
                  type="file"
                  accept="audio/*"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="cover-upload"
                />
                <label htmlFor="cover-upload" className="cursor-pointer">
                  <Upload className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    {uploadedFile ? uploadedFile.name : 'Upload audio file'}
                  </p>
                </label>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Voice Style</Label>
              <Select value={voiceStyle} onValueChange={setVoiceStyle}>
                <SelectTrigger>
                  <SelectValue placeholder="Select voice style" />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  {AMAPIANO_VOICE_CATEGORIES.map((cat) => (
                    <React.Fragment key={cat.category}>
                      <div className="px-2 py-1 text-xs font-semibold text-primary bg-primary/5">
                        {cat.category}
                      </div>
                      {cat.voices.map((v) => (
                        <SelectItem key={v.value} value={v.value}>
                          {v.label}
                        </SelectItem>
                      ))}
                    </React.Fragment>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Pitch Shift: {bpm > 112 ? `+${bpm - 112}` : bpm - 112} semitones</Label>
              <Slider
                value={[bpm]}
                onValueChange={([v]) => setBpm(v)}
                min={100}
                max={124}
              />
            </div>
          </TabsContent>

          {/* Inpaint Mode */}
          <TabsContent value="inpaint" className="space-y-4 mt-4">
            {selectedClipId ? (
              <>
                <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
                  <p className="text-sm">
                    Select a region in the timeline to regenerate. Perfect for fixing sections or trying variations.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>New Content Description</Label>
                  <Textarea
                    placeholder="Describe what should replace this section..."
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    className="min-h-[80px]"
                  />
                </div>
                <div className="flex gap-2">
                  <div className="flex items-center gap-2">
                    <Switch id="regen-vocals" />
                    <Label htmlFor="regen-vocals" className="text-sm">Regenerate Vocals</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch id="regen-instrumental" defaultChecked />
                    <Label htmlFor="regen-instrumental" className="text-sm">Regenerate Instrumental</Label>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Scissors className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  Select a clip and highlight a region to inpaint
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Common Settings (for Create mode) */}
        {mode === 'create' && (
          <div className="space-y-4 pt-4 border-t">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Style/Genre</Label>
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
                <Label>BPM: {bpm}</Label>
                <Slider
                  value={[bpm]}
                  onValueChange={([v]) => setBpm(v)}
                  min={60}
                  max={180}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Variations: {variations}</Label>
              <Slider
                value={[variations]}
                onValueChange={([v]) => setVariations(v)}
                min={1}
                max={4}
              />
              <p className="text-xs text-muted-foreground">
                Generate multiple versions to choose from
              </p>
            </div>
          </div>
        )}

        {/* Progress Indicator */}
        {progress && (
          <div className="space-y-2 p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {isGenerating && <Loader2 className="h-4 w-4 animate-spin" />}
                <span className="text-sm font-medium capitalize">{progress.status}</span>
              </div>
              <Badge variant={progress.status === 'succeeded' ? 'default' : 'secondary'}>
                {Math.round(progress.progress)}%
              </Badge>
            </div>
            <Progress value={progress.progress} className="h-2" />
            {progress.message && (
              <p className="text-xs text-muted-foreground">{progress.message}</p>
            )}
          </div>
        )}

        {/* Generate Button */}
        <Button 
          onClick={handleGenerate}
          disabled={isGenerating || (mode === 'create' && !prompt && !lyrics)}
          className="w-full h-12 text-lg"
          size="lg"
        >
          {isGenerating ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-5 w-5" />
              {mode === 'create' && 'Generate Song'}
              {mode === 'extend' && 'Extend Song'}
              {mode === 'remix' && 'Create Remix'}
              {mode === 'cover' && 'Generate Cover'}
              {mode === 'inpaint' && 'Regenerate Section'}
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
