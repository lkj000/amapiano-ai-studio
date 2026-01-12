/**
 * LANDR Mastering Component
 * AI-driven mastering with real Supabase integration
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
  Settings2,
  FileAudio,
  CheckCircle2,
  Clock,
  Save,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { useLANDRMastering, MasteringSettings } from '@/hooks/useLANDRMastering';

interface MasteringPreset {
  id: string;
  name: string;
  style: 'Warm' | 'Balanced' | 'Open';
  lufs: string;
  description?: string;
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
  const [selectedStyle, setSelectedStyle] = useState<'Warm' | 'Balanced' | 'Open'>('Balanced');
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
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

  const { 
    currentTrack, 
    masteredTracks, 
    uploadAndMaster, 
    downloadMastered, 
    saveToLibrary,
    isProcessing 
  } = useLANDRMastering();

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

    const settings: MasteringSettings = {
      style: selectedStyle,
      loudness: controls.loudness[0],
      eq_low: controls.eq_low[0],
      eq_mid: controls.eq_mid[0],
      eq_high: controls.eq_high[0],
      presence: controls.presence[0],
      compression: controls.compression[0],
      stereoWidth: controls.stereoWidth[0],
      saturation: controls.saturation[0],
      deEsser: controls.deEsser[0]
    };

    uploadAndMaster.mutate({ file: uploadedFile, settings });
  };

  const applyPreset = (preset: MasteringPreset) => {
    setSelectedStyle(preset.style);
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
              {currentTrack && currentTrack.status === 'processing' && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Mastering in progress...</span>
                    <span className="font-medium">{currentTrack.progress}%</span>
                  </div>
                  <Progress value={currentTrack.progress} className="h-2" />
                  <p className="text-xs text-muted-foreground text-center">
                    {currentTrack.progress < 30 && "Uploading audio file..."}
                    {currentTrack.progress >= 30 && currentTrack.progress < 60 && "Analyzing audio characteristics..."}
                    {currentTrack.progress >= 60 && currentTrack.progress < 90 && "Applying AI mastering..."}
                    {currentTrack.progress >= 90 && "Finalizing master..."}
                  </p>
                </div>
              )}

              {/* Completed Track */}
              {currentTrack && currentTrack.status === 'complete' && (
                <Card className="bg-green-500/10 border-green-500/30">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="w-8 h-8 text-green-500" />
                      <div>
                        <p className="font-medium">{currentTrack.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {currentTrack.style} • {currentTrack.lufs} LUFS
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => saveToLibrary.mutate(currentTrack)}
                        disabled={saveToLibrary.isPending}
                      >
                        {saveToLibrary.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 mr-1" />}
                        Save
                      </Button>
                      <Button size="sm" onClick={() => downloadMastered(currentTrack)}>
                        <Download className="w-4 h-4 mr-1" />
                        Download
                      </Button>
                    </div>
                  </CardContent>
                </Card>
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
                      variant={selectedStyle === style.name ? 'default' : 'outline'}
                      className="h-auto py-4 flex-col gap-2"
                      onClick={() => setSelectedStyle(style.name as 'Warm' | 'Balanced' | 'Open')}
                    >
                      <style.icon className={`w-6 h-6 ${selectedStyle === style.name ? '' : style.color}`} />
                      <span className="font-medium">{style.name}</span>
                    </Button>
                  ))}
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  {MASTERING_STYLES.find(s => s.name === selectedStyle)?.description}
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
                {isProcessing ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Wand2 className="w-5 h-5 mr-2" />
                    Master My Track
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Presets & History */}
        <div className="space-y-6">
          {/* Presets */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Quick Presets</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[300px]">
                <div className="space-y-2">
                  {PRESETS.map(preset => (
                    <div
                      key={preset.id}
                      className="p-3 rounded-lg border cursor-pointer hover:border-primary/50 transition-colors"
                      onClick={() => applyPreset(preset)}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-sm">{preset.name}</span>
                        <Badge variant="outline" className="text-xs">
                          {preset.lufs} LUFS
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{preset.description}</p>
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
                <Clock className="w-4 h-4" />
                Recent Masters ({masteredTracks.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {masteredTracks.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No mastered tracks yet
                </p>
              ) : (
                <ScrollArea className="h-[200px]">
                  <div className="space-y-2">
                    {masteredTracks.map(track => (
                      <div
                        key={track.id}
                        className="flex items-center justify-between p-2 rounded-lg bg-muted/30"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate">{track.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {track.style} • {track.lufs} LUFS
                          </p>
                        </div>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => downloadMastered(track)}
                        >
                          <Download className="w-4 h-4" />
                        </Button>
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
};
