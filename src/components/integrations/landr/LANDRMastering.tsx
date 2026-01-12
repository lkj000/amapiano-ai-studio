/**
 * LANDR Mastering Component
 * AI-driven mastering with drag & drop and style controls
 */

import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { 
  Upload, 
  Wand2, 
  Play, 
  Pause,
  Download,
  Volume2,
  Gauge,
  Sparkles,
  Flame,
  Snowflake,
  Sun,
  Activity,
  Radio,
  Disc3,
  Settings2,
  FileAudio,
  CheckCircle2,
  Clock,
  ArrowRight,
  ExternalLink
} from 'lucide-react';
import { toast } from 'sonner';

interface MasteringPreset {
  id: string;
  name: string;
  style: 'Warm' | 'Balanced' | 'Open';
  lufs: string;
  description?: string;
}

interface MasteredTrack {
  id: string;
  name: string;
  originalFile: string;
  style: string;
  lufs: string;
  status: 'processing' | 'complete';
  progress?: number;
  createdAt: Date;
}

const MASTERING_STYLES = [
  { 
    id: 'warm', 
    name: 'Warm', 
    icon: Flame, 
    description: 'Rich low-end with smooth highs. Great for soul, R&B, and jazz.',
    color: 'text-orange-500'
  },
  { 
    id: 'balanced', 
    name: 'Balanced', 
    icon: Sun, 
    description: 'Neutral and versatile. Works for most genres.',
    color: 'text-yellow-500'
  },
  { 
    id: 'open', 
    name: 'Open', 
    icon: Snowflake, 
    description: 'Bright and airy with enhanced clarity. Ideal for pop and electronic.',
    color: 'text-blue-500'
  }
];

const PRESETS: MasteringPreset[] = [
  { id: '1', name: 'Amapiano Master', style: 'Balanced', lufs: '-14', description: 'Optimized for Amapiano log drums and bass' },
  { id: '2', name: 'Club Ready', style: 'Open', lufs: '-8', description: 'Maximum loudness for club play' },
  { id: '3', name: 'Streaming Optimized', style: 'Balanced', lufs: '-14', description: 'Perfect for Spotify/Apple Music' },
  { id: '4', name: 'Vinyl Warmth', style: 'Warm', lufs: '-12', description: 'Analog warmth simulation' },
  { id: '5', name: 'Broadcast Ready', style: 'Balanced', lufs: '-16', description: 'TV and radio compliance' },
  { id: '6', name: 'Hip-Hop Punch', style: 'Warm', lufs: '-10', description: 'Heavy bass and punchy drums' }
];

export const LANDRMastering: React.FC = () => {
  const [selectedStyle, setSelectedStyle] = useState<string>('balanced');
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  
  // Mastering controls
  const [controls, setControls] = useState({
    loudness: [-14],
    eq_low: [0],
    eq_mid: [0],
    eq_high: [0],
    presence: [50],
    compression: [50],
    stereoWidth: [50],
    saturation: [25],
    deEsser: [30]
  });

  const [masteredTracks, setMasteredTracks] = useState<MasteredTrack[]>([
    { 
      id: '1', 
      name: 'Summer Vibes - Master.wav', 
      originalFile: 'Summer Vibes.wav',
      style: 'Balanced', 
      lufs: '-14', 
      status: 'complete',
      createdAt: new Date(Date.now() - 86400000)
    },
    { 
      id: '2', 
      name: 'Night Drive - Master.wav', 
      originalFile: 'Night Drive.wav',
      style: 'Warm', 
      lufs: '-12', 
      status: 'complete',
      createdAt: new Date(Date.now() - 172800000)
    }
  ]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    const audioFile = files.find(f => 
      f.type.startsWith('audio/') || 
      f.name.match(/\.(wav|mp3|m4a|aac|ogg|aiff)$/i)
    );
    
    if (audioFile) {
      setUploadedFile(audioFile);
      toast.success(`File loaded: ${audioFile.name}`);
    } else {
      toast.error('Please drop a valid audio file');
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFile(file);
      toast.success(`File loaded: ${file.name}`);
    }
  };

  const startMastering = () => {
    if (!uploadedFile) {
      toast.error('Please upload a file first');
      return;
    }

    setIsProcessing(true);
    setProcessingProgress(0);

    // Simulate mastering progress
    const interval = setInterval(() => {
      setProcessingProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsProcessing(false);
          
          const newTrack: MasteredTrack = {
            id: Date.now().toString(),
            name: uploadedFile.name.replace(/\.[^/.]+$/, '') + ' - Master.wav',
            originalFile: uploadedFile.name,
            style: MASTERING_STYLES.find(s => s.id === selectedStyle)?.name || 'Balanced',
            lufs: controls.loudness[0].toString(),
            status: 'complete',
            createdAt: new Date()
          };
          
          setMasteredTracks(prev => [newTrack, ...prev]);
          toast.success('Mastering complete!', {
            description: 'Your track has been mastered and is ready for download'
          });
          
          return 100;
        }
        return prev + 2;
      });
    }, 100);
  };

  const applyPreset = (preset: MasteringPreset) => {
    const styleMap: Record<string, string> = {
      'Warm': 'warm',
      'Balanced': 'balanced',
      'Open': 'open'
    };
    setSelectedStyle(styleMap[preset.style]);
    setControls(prev => ({
      ...prev,
      loudness: [parseInt(preset.lufs)]
    }));
    toast.success(`Applied preset: ${preset.name}`);
  };

  return (
    <div className="space-y-6">
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Upload & Process */}
        <div className="lg:col-span-2 space-y-6">
          {/* Drop Zone */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wand2 className="w-5 h-5 text-purple-500" />
                AI Mastering Engine
              </CardTitle>
              <CardDescription>
                Drop a track and hear the difference. Our AI-driven engine delivers pristine, studio-quality masters.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div
                className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${
                  isDragging 
                    ? 'border-primary bg-primary/10' 
                    : uploadedFile 
                      ? 'border-green-500/50 bg-green-500/5' 
                      : 'border-border hover:border-primary/50'
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                {uploadedFile ? (
                  <div className="space-y-3">
                    <div className="w-16 h-16 mx-auto rounded-xl bg-green-500/20 flex items-center justify-center">
                      <FileAudio className="w-8 h-8 text-green-500" />
                    </div>
                    <div>
                      <p className="font-medium">{uploadedFile.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                    <div className="flex justify-center gap-2">
                      <Button variant="outline" size="sm" onClick={() => setIsPlaying(!isPlaying)}>
                        {isPlaying ? <Pause className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
                        Preview Original
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => setUploadedFile(null)}>
                        Change File
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-lg font-medium mb-1">Drop your track here</p>
                    <p className="text-sm text-muted-foreground mb-4">
                      Accepted formats: MP3, M4A, WAV, AAC, OGG, AIFF
                    </p>
                    <label>
                      <input
                        type="file"
                        className="hidden"
                        accept="audio/*,.wav,.mp3,.m4a,.aac,.ogg,.aiff"
                        onChange={handleFileSelect}
                      />
                      <Button variant="outline" asChild>
                        <span>Choose File</span>
                      </Button>
                    </label>
                  </>
                )}
              </div>

              {/* Processing Progress */}
              {isProcessing && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Mastering in progress...</span>
                    <span className="font-medium">{processingProgress}%</span>
                  </div>
                  <Progress value={processingProgress} className="h-2" />
                  <p className="text-xs text-muted-foreground text-center">
                    {processingProgress < 30 && "Analyzing audio characteristics..."}
                    {processingProgress >= 30 && processingProgress < 60 && "Applying AI mastering..."}
                    {processingProgress >= 60 && processingProgress < 90 && "Optimizing dynamics..."}
                    {processingProgress >= 90 && "Finalizing master..."}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Mastering Controls */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings2 className="w-5 h-5" />
                Mastering Controls
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Style Selection */}
              <div>
                <Label className="text-sm font-medium mb-3 block">Mastering Style</Label>
                <div className="grid grid-cols-3 gap-3">
                  {MASTERING_STYLES.map(style => (
                    <Button
                      key={style.id}
                      variant={selectedStyle === style.id ? 'default' : 'outline'}
                      className={`h-auto py-4 flex-col gap-2 ${selectedStyle === style.id ? '' : ''}`}
                      onClick={() => setSelectedStyle(style.id)}
                    >
                      <style.icon className={`w-6 h-6 ${selectedStyle === style.id ? '' : style.color}`} />
                      <span className="font-medium">{style.name}</span>
                    </Button>
                  ))}
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  {MASTERING_STYLES.find(s => s.id === selectedStyle)?.description}
                </p>
              </div>

              <Separator />

              {/* Control Sliders */}
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="flex items-center gap-2">
                        <Gauge className="w-4 h-4" />
                        Loudness (LUFS)
                      </Label>
                      <span className="text-sm font-mono">{controls.loudness[0]}</span>
                    </div>
                    <Slider
                      value={controls.loudness}
                      onValueChange={(v) => setControls(prev => ({ ...prev, loudness: v }))}
                      min={-20}
                      max={-6}
                      step={1}
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="flex items-center gap-2">
                        <Activity className="w-4 h-4" />
                        Compression
                      </Label>
                      <span className="text-sm font-mono">{controls.compression[0]}%</span>
                    </div>
                    <Slider
                      value={controls.compression}
                      onValueChange={(v) => setControls(prev => ({ ...prev, compression: v }))}
                      min={0}
                      max={100}
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="flex items-center gap-2">
                        <Radio className="w-4 h-4" />
                        Stereo Width
                      </Label>
                      <span className="text-sm font-mono">{controls.stereoWidth[0]}%</span>
                    </div>
                    <Slider
                      value={controls.stereoWidth}
                      onValueChange={(v) => setControls(prev => ({ ...prev, stereoWidth: v }))}
                      min={0}
                      max={100}
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4" />
                        Saturation
                      </Label>
                      <span className="text-sm font-mono">{controls.saturation[0]}%</span>
                    </div>
                    <Slider
                      value={controls.saturation}
                      onValueChange={(v) => setControls(prev => ({ ...prev, saturation: v }))}
                      min={0}
                      max={100}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>EQ - Low</Label>
                      <span className="text-sm font-mono">{controls.eq_low[0] > 0 ? '+' : ''}{controls.eq_low[0]} dB</span>
                    </div>
                    <Slider
                      value={controls.eq_low}
                      onValueChange={(v) => setControls(prev => ({ ...prev, eq_low: v }))}
                      min={-6}
                      max={6}
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>EQ - Mid</Label>
                      <span className="text-sm font-mono">{controls.eq_mid[0] > 0 ? '+' : ''}{controls.eq_mid[0]} dB</span>
                    </div>
                    <Slider
                      value={controls.eq_mid}
                      onValueChange={(v) => setControls(prev => ({ ...prev, eq_mid: v }))}
                      min={-6}
                      max={6}
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>EQ - High</Label>
                      <span className="text-sm font-mono">{controls.eq_high[0] > 0 ? '+' : ''}{controls.eq_high[0]} dB</span>
                    </div>
                    <Slider
                      value={controls.eq_high}
                      onValueChange={(v) => setControls(prev => ({ ...prev, eq_high: v }))}
                      min={-6}
                      max={6}
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="flex items-center gap-2">
                        <Volume2 className="w-4 h-4" />
                        De-Esser
                      </Label>
                      <span className="text-sm font-mono">{controls.deEsser[0]}%</span>
                    </div>
                    <Slider
                      value={controls.deEsser}
                      onValueChange={(v) => setControls(prev => ({ ...prev, deEsser: v }))}
                      min={0}
                      max={100}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Master Button */}
              <Button 
                className="w-full" 
                size="lg" 
                onClick={startMastering}
                disabled={!uploadedFile || isProcessing}
              >
                <Wand2 className="w-5 h-5 mr-2" />
                {isProcessing ? 'Mastering...' : 'Master Track'}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Presets */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Mastering Presets</CardTitle>
              <CardDescription>Quick-apply saved configurations</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[280px]">
                <div className="space-y-2">
                  {PRESETS.map(preset => (
                    <div 
                      key={preset.id}
                      className="p-3 rounded-lg border hover:border-primary/50 cursor-pointer transition-all group"
                      onClick={() => applyPreset(preset)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm">{preset.name}</h4>
                          <p className="text-xs text-muted-foreground">
                            {preset.style} • {preset.lufs} LUFS
                          </p>
                          {preset.description && (
                            <p className="text-xs text-muted-foreground mt-1 truncate">
                              {preset.description}
                            </p>
                          )}
                        </div>
                        <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Recent Masters */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Disc3 className="w-4 h-4" />
                Recent Masters
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[200px]">
                <div className="space-y-2">
                  {masteredTracks.map(track => (
                    <div 
                      key={track.id}
                      className="p-3 rounded-lg border hover:border-primary/50 transition-all"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium text-sm truncate">{track.name}</h4>
                            {track.status === 'complete' && (
                              <CheckCircle2 className="w-3 h-3 text-green-500 flex-shrink-0" />
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {track.style} • {track.lufs} LUFS
                          </p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                            <Clock className="w-3 h-3" />
                            {track.createdAt.toLocaleDateString()}
                          </p>
                        </div>
                        <Button size="icon" variant="ghost">
                          <Download className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* API Info */}
          <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">LANDR Mastering API</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Integrate AI mastering directly into your apps with the LANDR API.
              </p>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• 3 previewable loudness settings</li>
                <li>• Genre-tailored mastering styles</li>
                <li>• Custom results without presets</li>
              </ul>
              <Button variant="outline" size="sm" className="w-full" asChild>
                <a href="https://www.landr.com/api" target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  View API Docs
                </a>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default LANDRMastering;
