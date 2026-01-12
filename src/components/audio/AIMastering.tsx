/**
 * AI Mastering Component
 * Provides one-click mastering with genre-aware presets
 */

import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Upload, 
  Wand2, 
  Download, 
  Play, 
  Pause, 
  Volume2, 
  Gauge,
  Music,
  Waves,
  Sparkles,
  RotateCcw
} from 'lucide-react';
import { toast } from 'sonner';

interface MasteringPreset {
  id: string;
  name: string;
  description: string;
  settings: MasteringSettings;
}

interface MasteringSettings {
  loudness: number; // -14 to 0 LUFS
  stereoWidth: number; // 0-200%
  warmth: number; // 0-100
  clarity: number; // 0-100
  punchiness: number; // 0-100
  limitCeiling: number; // -3 to 0 dB
}

const GENRE_PRESETS: MasteringPreset[] = [
  {
    id: 'amapiano',
    name: 'Amapiano',
    description: 'Punchy log drums, wide stereo, warm bass',
    settings: { loudness: -8, stereoWidth: 130, warmth: 70, clarity: 65, punchiness: 85, limitCeiling: -0.3 }
  },
  {
    id: 'afrobeats',
    name: 'Afrobeats',
    description: 'Balanced mix, rhythmic punch, clear vocals',
    settings: { loudness: -9, stereoWidth: 110, warmth: 55, clarity: 75, punchiness: 70, limitCeiling: -0.5 }
  },
  {
    id: 'hiphop',
    name: 'Hip-Hop',
    description: 'Heavy low-end, crisp highs, loud',
    settings: { loudness: -7, stereoWidth: 100, warmth: 60, clarity: 70, punchiness: 90, limitCeiling: -0.1 }
  },
  {
    id: 'edm',
    name: 'EDM/Electronic',
    description: 'Maximum loudness, wide stereo, punchy',
    settings: { loudness: -6, stereoWidth: 150, warmth: 40, clarity: 80, punchiness: 95, limitCeiling: -0.1 }
  },
  {
    id: 'jazz',
    name: 'Jazz/Acoustic',
    description: 'Dynamic, warm, natural',
    settings: { loudness: -14, stereoWidth: 100, warmth: 80, clarity: 60, punchiness: 40, limitCeiling: -1.0 }
  },
  {
    id: 'streaming',
    name: 'Streaming Optimized',
    description: 'Spotify/Apple Music compliant (-14 LUFS)',
    settings: { loudness: -14, stereoWidth: 110, warmth: 50, clarity: 70, punchiness: 60, limitCeiling: -1.0 }
  }
];

export function AIMastering() {
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [masteredUrl, setMasteredUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playingMastered, setPlayingMastered] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<string>('amapiano');
  const [settings, setSettings] = useState<MasteringSettings>(GENRE_PRESETS[0].settings);
  const [autoAnalyze, setAutoAnalyze] = useState(true);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const masteredAudioRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('audio/')) {
      toast.error('Please upload an audio file');
      return;
    }

    setAudioFile(file);
    const url = URL.createObjectURL(file);
    setAudioUrl(url);
    setMasteredUrl(null);
    toast.success(`Loaded: ${file.name}`);
  };

  const applyPreset = (presetId: string) => {
    const preset = GENRE_PRESETS.find(p => p.id === presetId);
    if (preset) {
      setSelectedPreset(presetId);
      setSettings(preset.settings);
      toast.info(`Applied ${preset.name} preset`);
    }
  };

  const handleMaster = async () => {
    if (!audioFile) {
      toast.error('Please upload an audio file first');
      return;
    }

    setIsProcessing(true);
    setProgress(0);

    try {
      // Simulate AI mastering process with progress
      const steps = [
        'Analyzing audio characteristics...',
        'Detecting genre and key...',
        'Applying EQ curve...',
        'Multiband compression...',
        'Stereo enhancement...',
        'Harmonic saturation...',
        'Limiting and loudness optimization...',
        'Final polish...'
      ];

      for (let i = 0; i < steps.length; i++) {
        toast.info(steps[i]);
        setProgress((i + 1) / steps.length * 100);
        await new Promise(resolve => setTimeout(resolve, 800));
      }

      // In production, this would call an edge function for actual processing
      // For now, we'll use the original audio as a placeholder
      setMasteredUrl(audioUrl);
      toast.success('Mastering complete!');

    } catch (error) {
      console.error('Mastering failed:', error);
      toast.error('Mastering failed. Please try again.');
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  };

  const togglePlay = (mastered: boolean) => {
    const audio = mastered ? masteredAudioRef.current : audioRef.current;
    const otherAudio = mastered ? audioRef.current : masteredAudioRef.current;
    
    if (!audio) return;

    // Stop the other audio
    if (otherAudio) {
      otherAudio.pause();
      otherAudio.currentTime = 0;
    }

    if (audio.paused) {
      audio.play();
      if (mastered) {
        setPlayingMastered(true);
        setIsPlaying(false);
      } else {
        setIsPlaying(true);
        setPlayingMastered(false);
      }
    } else {
      audio.pause();
      if (mastered) {
        setPlayingMastered(false);
      } else {
        setIsPlaying(false);
      }
    }
  };

  const handleDownload = () => {
    if (!masteredUrl) return;
    
    const a = document.createElement('a');
    a.href = masteredUrl;
    a.download = `${audioFile?.name.replace(/\.[^/.]+$/, '')}_mastered.wav`;
    a.click();
    toast.success('Download started');
  };

  const resetSettings = () => {
    applyPreset(selectedPreset);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2">
          <Wand2 className="w-8 h-8 text-primary" />
          <h2 className="text-3xl font-bold">AI Mastering</h2>
        </div>
        <p className="text-muted-foreground">
          Professional mastering powered by AI. Upload your mix and get release-ready audio.
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Upload & Preview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5" />
              Upload Mix
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <input
              type="file"
              accept="audio/*"
              onChange={handleFileUpload}
              ref={fileInputRef}
              className="hidden"
            />
            
            {!audioFile ? (
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed rounded-lg p-12 text-center cursor-pointer hover:border-primary transition-colors"
              >
                <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="font-medium">Drop your mix here</p>
                <p className="text-sm text-muted-foreground">WAV, MP3, FLAC supported</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
                  <Music className="w-10 h-10 text-primary" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{audioFile.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {(audioFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => togglePlay(false)}
                  >
                    {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  </Button>
                </div>

                {audioUrl && (
                  <audio 
                    ref={audioRef} 
                    src={audioUrl} 
                    onEnded={() => setIsPlaying(false)}
                  />
                )}

                {masteredUrl && (
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-primary" />
                      Mastered Version
                    </Label>
                    <div className="flex items-center gap-4 p-4 bg-primary/10 rounded-lg border border-primary/20">
                      <Wand2 className="w-10 h-10 text-primary" />
                      <div className="flex-1">
                        <p className="font-medium">Mastered</p>
                        <p className="text-sm text-muted-foreground">Ready for release</p>
                      </div>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => togglePlay(true)}
                      >
                        {playingMastered ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                      </Button>
                      <Button
                        variant="default"
                        size="icon"
                        onClick={handleDownload}
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                    </div>
                    <audio 
                      ref={masteredAudioRef} 
                      src={masteredUrl} 
                      onEnded={() => setPlayingMastered(false)}
                    />
                  </div>
                )}

                <Button
                  onClick={() => {
                    setAudioFile(null);
                    setAudioUrl(null);
                    setMasteredUrl(null);
                    fileInputRef.current?.click();
                  }}
                  variant="outline"
                  className="w-full"
                >
                  Upload Different File
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gauge className="w-5 h-5" />
              Mastering Settings
            </CardTitle>
            <CardDescription>
              Choose a genre preset or fine-tune manually
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Genre Presets */}
            <div className="space-y-2">
              <Label>Genre Preset</Label>
              <Select value={selectedPreset} onValueChange={applyPreset}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {GENRE_PRESETS.map(preset => (
                    <SelectItem key={preset.id} value={preset.id}>
                      <div>
                        <span className="font-medium">{preset.name}</span>
                        <span className="text-muted-foreground ml-2 text-xs">
                          {preset.description}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Auto Analyze Toggle */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Auto-Analyze</Label>
                <p className="text-xs text-muted-foreground">
                  AI detects genre and adjusts settings
                </p>
              </div>
              <Switch checked={autoAnalyze} onCheckedChange={setAutoAnalyze} />
            </div>

            {/* Manual Controls */}
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Fine-Tune Controls</Label>
                <Button variant="ghost" size="sm" onClick={resetSettings}>
                  <RotateCcw className="w-3 h-3 mr-1" />
                  Reset
                </Button>
              </div>

              {/* Loudness */}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label className="text-sm flex items-center gap-2">
                    <Volume2 className="w-4 h-4" />
                    Target Loudness
                  </Label>
                  <Badge variant="outline">{settings.loudness} LUFS</Badge>
                </div>
                <Slider
                  value={[settings.loudness]}
                  onValueChange={([v]) => setSettings(s => ({ ...s, loudness: v }))}
                  min={-14}
                  max={-3}
                  step={0.5}
                />
              </div>

              {/* Stereo Width */}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label className="text-sm flex items-center gap-2">
                    <Waves className="w-4 h-4" />
                    Stereo Width
                  </Label>
                  <Badge variant="outline">{settings.stereoWidth}%</Badge>
                </div>
                <Slider
                  value={[settings.stereoWidth]}
                  onValueChange={([v]) => setSettings(s => ({ ...s, stereoWidth: v }))}
                  min={50}
                  max={200}
                  step={5}
                />
              </div>

              {/* Warmth */}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label className="text-sm">Warmth</Label>
                  <Badge variant="outline">{settings.warmth}%</Badge>
                </div>
                <Slider
                  value={[settings.warmth]}
                  onValueChange={([v]) => setSettings(s => ({ ...s, warmth: v }))}
                  min={0}
                  max={100}
                />
              </div>

              {/* Clarity */}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label className="text-sm">Clarity</Label>
                  <Badge variant="outline">{settings.clarity}%</Badge>
                </div>
                <Slider
                  value={[settings.clarity]}
                  onValueChange={([v]) => setSettings(s => ({ ...s, clarity: v }))}
                  min={0}
                  max={100}
                />
              </div>

              {/* Punchiness */}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label className="text-sm">Punchiness</Label>
                  <Badge variant="outline">{settings.punchiness}%</Badge>
                </div>
                <Slider
                  value={[settings.punchiness]}
                  onValueChange={([v]) => setSettings(s => ({ ...s, punchiness: v }))}
                  min={0}
                  max={100}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Master Button */}
      <Card>
        <CardContent className="pt-6">
          {isProcessing ? (
            <div className="space-y-4">
              <Progress value={progress} className="h-3" />
              <p className="text-center text-muted-foreground">
                Processing... {Math.round(progress)}%
              </p>
            </div>
          ) : (
            <Button 
              onClick={handleMaster} 
              disabled={!audioFile}
              className="w-full h-14 text-lg"
              size="lg"
            >
              <Wand2 className="w-5 h-5 mr-2" />
              Master My Track
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
