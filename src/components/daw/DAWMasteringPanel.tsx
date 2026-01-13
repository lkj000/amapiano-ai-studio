/**
 * DAW Mastering Panel
 * Integrated mastering directly within the DAW - completes the end-to-end production workflow
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  Loader2,
  Square,
  X,
  Music2,
  Zap,
  AudioWaveform
} from 'lucide-react';
import { toast } from 'sonner';
import { useLANDRMastering, MasteringSettings, MasteredTrack } from '@/hooks/useLANDRMastering';
import type { DawProjectData } from '@/types/daw';

interface DAWMasteringPanelProps {
  projectData: DawProjectData | null;
  projectName: string;
  onClose: () => void;
  onMasterComplete?: (masteredUrl: string) => void;
}

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
    description: 'Rich low-end with smooth highs. Great for soul, R&B, and Amapiano.',
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

const AMAPIANO_PRESETS: MasteringPreset[] = [
  { id: '1', name: 'Amapiano Master', style: 'Warm', lufs: '-14', description: 'Optimized for log drums and bass' },
  { id: '2', name: 'Club Ready', style: 'Open', lufs: '-8', description: 'Maximum loudness for club play' },
  { id: '3', name: 'Streaming', style: 'Balanced', lufs: '-14', description: 'Spotify/Apple Music optimized' },
  { id: '4', name: 'Private School', style: 'Open', lufs: '-12', description: 'Bright, energetic mastering' },
  { id: '5', name: 'Deep Amapiano', style: 'Warm', lufs: '-12', description: 'Warm, bass-heavy mastering' },
  { id: '6', name: 'Broadcast', style: 'Balanced', lufs: '-16', description: 'Radio/TV compliance' }
];

export const DAWMasteringPanel: React.FC<DAWMasteringPanelProps> = ({
  projectData,
  projectName,
  onClose,
  onMasterComplete
}) => {
  const [selectedStyle, setSelectedStyle] = useState<'Warm' | 'Balanced' | 'Open'>('Warm');
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isPlayingOriginal, setIsPlayingOriginal] = useState(false);
  const [playingMasteredId, setPlayingMasteredId] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isExportingProject, setIsExportingProject] = useState(false);
  
  const originalAudioRef = useRef<HTMLAudioElement | null>(null);
  const masteredAudioRef = useRef<HTMLAudioElement | null>(null);
  
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
  
  useEffect(() => {
    return () => {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  const { 
    currentTrack, 
    masteredTracks, 
    uploadAndMaster, 
    downloadMastered, 
    saveToLibrary,
    isProcessing 
  } = useLANDRMastering();

  // Export current project as audio for mastering
  const exportProjectForMastering = useCallback(async () => {
    if (!projectData) {
      toast.error('No project data to export');
      return;
    }

    setIsExportingProject(true);
    toast.info('Preparing project for mastering...');

    try {
      // Create an offline audio context for rendering
      const sampleRate = 44100;
      const duration = 180; // 3 minutes max
      const offlineContext = new OfflineAudioContext(2, sampleRate * duration, sampleRate);

      // TODO: In a full implementation, we would:
      // 1. Load all audio clips from tracks
      // 2. Apply effects and mix settings
      // 3. Render to buffer
      
      // For now, create a placeholder that prompts file upload
      toast.info('Please upload your exported mix for mastering', {
        description: 'Export your project from your DAW first, then upload the file here'
      });
      setIsExportingProject(false);
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export project');
      setIsExportingProject(false);
    }
  }, [projectData]);

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
      f.name.match(/\.(wav|mp3|m4a|aac|ogg|aiff|flac)$/i)
    );
    
    if (audioFile) {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
      setUploadedFile(audioFile);
      const url = URL.createObjectURL(audioFile);
      setAudioUrl(url);
      toast.success(`File loaded: ${audioFile.name}`);
    } else {
      toast.error('Please drop a valid audio file');
    }
  }, [audioUrl]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
      setUploadedFile(file);
      const url = URL.createObjectURL(file);
      setAudioUrl(url);
      toast.success(`File loaded: ${file.name}`);
    }
  };

  const toggleOriginalPlayback = useCallback(() => {
    if (!audioUrl) {
      toast.error('No audio file loaded');
      return;
    }

    if (!originalAudioRef.current) {
      originalAudioRef.current = new Audio(audioUrl);
      originalAudioRef.current.onended = () => setIsPlayingOriginal(false);
    }

    if (isPlayingOriginal) {
      originalAudioRef.current.pause();
      setIsPlayingOriginal(false);
    } else {
      if (masteredAudioRef.current) {
        masteredAudioRef.current.pause();
        setPlayingMasteredId(null);
      }
      originalAudioRef.current.currentTime = 0;
      originalAudioRef.current.play().catch(() => toast.error('Failed to play audio'));
      setIsPlayingOriginal(true);
    }
  }, [audioUrl, isPlayingOriginal]);

  const toggleMasteredPlayback = useCallback((track: MasteredTrack) => {
    if (!track.masteredUrl) {
      toast.error('No mastered audio available');
      return;
    }

    if (playingMasteredId === track.id) {
      if (masteredAudioRef.current) {
        masteredAudioRef.current.pause();
      }
      setPlayingMasteredId(null);
      return;
    }

    if (originalAudioRef.current) {
      originalAudioRef.current.pause();
      setIsPlayingOriginal(false);
    }

    if (masteredAudioRef.current) {
      masteredAudioRef.current.pause();
    }

    masteredAudioRef.current = new Audio(track.masteredUrl);
    masteredAudioRef.current.onended = () => setPlayingMasteredId(null);
    masteredAudioRef.current.play().catch(() => toast.error('Failed to play'));
    setPlayingMasteredId(track.id);
  }, [playingMasteredId]);

  const stopAllPlayback = useCallback(() => {
    if (originalAudioRef.current) {
      originalAudioRef.current.pause();
      setIsPlayingOriginal(false);
    }
    if (masteredAudioRef.current) {
      masteredAudioRef.current.pause();
      setPlayingMasteredId(null);
    }
  }, []);

  useEffect(() => {
    return () => {
      stopAllPlayback();
    };
  }, [stopAllPlayback]);

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
    toast.success(`Applied: ${preset.name}`);
  };

  return (
    <div className="fixed inset-4 z-50 bg-background border rounded-lg shadow-xl flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b flex items-center justify-between bg-gradient-to-r from-purple-500/10 to-pink-500/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
            <Wand2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold flex items-center gap-2">
              Mastering Studio
              <Badge variant="secondary" className="bg-purple-500/20 text-purple-300">
                AI-Powered
              </Badge>
            </h3>
            <p className="text-sm text-muted-foreground">
              Finish your track with professional mastering
            </p>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="w-5 h-5" />
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-6xl mx-auto">
          <Tabs defaultValue="master" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="master" className="flex items-center gap-2">
                <Wand2 className="w-4 h-4" />
                Master
              </TabsTrigger>
              <TabsTrigger value="controls" className="flex items-center gap-2">
                <Settings2 className="w-4 h-4" />
                Controls
              </TabsTrigger>
              <TabsTrigger value="history" className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                History
              </TabsTrigger>
            </TabsList>

            {/* Master Tab */}
            <TabsContent value="master" className="space-y-6">
              <div className="grid lg:grid-cols-2 gap-6">
                {/* Upload Section */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <FileAudio className="w-5 h-5" />
                      Upload Mix
                    </CardTitle>
                    <CardDescription>
                      Drop your final mix or export from this project
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Project Export Button */}
                    {projectData && (
                      <Button 
                        variant="outline" 
                        className="w-full"
                        onClick={exportProjectForMastering}
                        disabled={isExportingProject}
                      >
                        {isExportingProject ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Music2 className="w-4 h-4 mr-2" />
                        )}
                        Export Current Project
                      </Button>
                    )}

                    <div className="relative">
                      <Separator className="my-2" />
                      <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-background px-2 text-xs text-muted-foreground">
                        or
                      </span>
                    </div>

                    {/* Drop Zone */}
                    <div
                      className={`border-2 border-dashed rounded-xl p-6 text-center transition-all ${
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
                          <div className="w-12 h-12 mx-auto rounded-xl bg-green-500/20 flex items-center justify-center">
                            <CheckCircle2 className="w-6 h-6 text-green-500" />
                          </div>
                          <div>
                            <p className="font-medium text-sm">{uploadedFile.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                          <div className="flex justify-center gap-2">
                            <Button variant="outline" size="sm" onClick={toggleOriginalPlayback}>
                              {isPlayingOriginal ? <Pause className="w-3 h-3 mr-1" /> : <Play className="w-3 h-3 mr-1" />}
                              Preview
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => {
                              stopAllPlayback();
                              if (audioUrl) URL.revokeObjectURL(audioUrl);
                              setAudioUrl(null);
                              setUploadedFile(null);
                            }}>
                              Change
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <Upload className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
                          <p className="font-medium text-sm mb-1">Drop your mix here</p>
                          <p className="text-xs text-muted-foreground mb-3">
                            WAV, MP3, FLAC, AAC
                          </p>
                          <label>
                            <input
                              type="file"
                              className="hidden"
                              accept="audio/*,.wav,.mp3,.m4a,.aac,.ogg,.aiff,.flac"
                              onChange={handleFileSelect}
                            />
                            <Button variant="outline" size="sm" asChild>
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
                          <span className="text-muted-foreground">Mastering...</span>
                          <span className="font-medium">{currentTrack.progress}%</span>
                        </div>
                        <Progress value={currentTrack.progress} className="h-2" />
                      </div>
                    )}

                    {/* Completed */}
                    {currentTrack && currentTrack.status === 'complete' && (
                      <Card className="bg-green-500/10 border-green-500/30">
                        <CardContent className="p-3 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-5 h-5 text-green-500" />
                            <div>
                              <p className="font-medium text-sm">{currentTrack.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {currentTrack.style} • {currentTrack.lufs} LUFS
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-1">
                            <Button size="sm" variant="ghost" onClick={() => toggleMasteredPlayback(currentTrack)}>
                              {playingMasteredId === currentTrack.id ? <Square className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => downloadMastered(currentTrack)}>
                              <Download className="w-3 h-3" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Master Button */}
                    <Button 
                      className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                      onClick={startMastering}
                      disabled={!uploadedFile || isProcessing}
                    >
                      {isProcessing ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Sparkles className="w-4 h-4 mr-2" />
                      )}
                      {isProcessing ? 'Processing...' : 'Master Track'}
                    </Button>
                  </CardContent>
                </Card>

                {/* Presets Section */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Zap className="w-5 h-5" />
                      Quick Presets
                    </CardTitle>
                    <CardDescription>
                      Optimized settings for different styles
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {/* Style Selection */}
                    <div className="mb-4">
                      <Label className="text-sm font-medium mb-2 block">Style</Label>
                      <div className="grid grid-cols-3 gap-2">
                        {MASTERING_STYLES.map(style => (
                          <Button
                            key={style.id}
                            variant={selectedStyle === style.name ? 'default' : 'outline'}
                            className="h-auto py-3 flex-col gap-1"
                            onClick={() => setSelectedStyle(style.name as 'Warm' | 'Balanced' | 'Open')}
                          >
                            <style.icon className={`w-5 h-5 ${selectedStyle === style.name ? '' : style.color}`} />
                            <span className="text-xs font-medium">{style.name}</span>
                          </Button>
                        ))}
                      </div>
                    </div>

                    <Separator className="my-4" />

                    {/* Preset Grid */}
                    <div className="grid grid-cols-2 gap-2">
                      {AMAPIANO_PRESETS.map(preset => (
                        <Button
                          key={preset.id}
                          variant="outline"
                          className="h-auto py-3 flex-col items-start text-left"
                          onClick={() => applyPreset(preset)}
                        >
                          <span className="font-medium text-sm">{preset.name}</span>
                          <span className="text-xs text-muted-foreground">{preset.description}</span>
                          <Badge variant="secondary" className="mt-1 text-xs">
                            {preset.lufs} LUFS
                          </Badge>
                        </Button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Controls Tab */}
            <TabsContent value="controls" className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                {/* Main Controls */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Mastering Controls</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="flex items-center gap-2">
                          <Gauge className="w-4 h-4" />
                          Loudness (LUFS)
                        </Label>
                        <span className="text-sm font-mono">{controls.loudness[0]} dB</span>
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
                          <Volume2 className="w-4 h-4" />
                          Compression
                        </Label>
                        <span className="text-sm font-mono">{controls.compression[0]}%</span>
                      </div>
                      <Slider
                        value={controls.compression}
                        onValueChange={(v) => setControls(prev => ({ ...prev, compression: v }))}
                        min={0}
                        max={100}
                        step={1}
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
                        step={1}
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
                        step={1}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* EQ Controls */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">EQ Control</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>Low (Bass)</Label>
                        <span className="text-sm font-mono">{controls.eq_low[0] > 0 ? '+' : ''}{controls.eq_low[0]} dB</span>
                      </div>
                      <Slider
                        value={controls.eq_low}
                        onValueChange={(v) => setControls(prev => ({ ...prev, eq_low: v }))}
                        min={-6}
                        max={6}
                        step={0.5}
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>Mid</Label>
                        <span className="text-sm font-mono">{controls.eq_mid[0] > 0 ? '+' : ''}{controls.eq_mid[0]} dB</span>
                      </div>
                      <Slider
                        value={controls.eq_mid}
                        onValueChange={(v) => setControls(prev => ({ ...prev, eq_mid: v }))}
                        min={-6}
                        max={6}
                        step={0.5}
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>High (Treble)</Label>
                        <span className="text-sm font-mono">{controls.eq_high[0] > 0 ? '+' : ''}{controls.eq_high[0]} dB</span>
                      </div>
                      <Slider
                        value={controls.eq_high}
                        onValueChange={(v) => setControls(prev => ({ ...prev, eq_high: v }))}
                        min={-6}
                        max={6}
                        step={0.5}
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>Presence</Label>
                        <span className="text-sm font-mono">{controls.presence[0]}%</span>
                      </div>
                      <Slider
                        value={controls.presence}
                        onValueChange={(v) => setControls(prev => ({ ...prev, presence: v }))}
                        min={0}
                        max={100}
                        step={1}
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>De-Esser</Label>
                        <span className="text-sm font-mono">{controls.deEsser[0]}%</span>
                      </div>
                      <Slider
                        value={controls.deEsser}
                        onValueChange={(v) => setControls(prev => ({ ...prev, deEsser: v }))}
                        min={0}
                        max={100}
                        step={1}
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* History Tab */}
            <TabsContent value="history" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Mastered Tracks</CardTitle>
                  <CardDescription>Your recent mastering history</CardDescription>
                </CardHeader>
                <CardContent>
                  {masteredTracks.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <AudioWaveform className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>No mastered tracks yet</p>
                      <p className="text-sm">Master your first track to see it here</p>
                    </div>
                  ) : (
                    <ScrollArea className="h-[300px]">
                      <div className="space-y-2">
                        {masteredTracks.map((track) => (
                          <div
                            key={track.id}
                            className="p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
                                  <Music2 className="w-5 h-5 text-purple-400" />
                                </div>
                                <div>
                                  <p className="font-medium text-sm">{track.name}</p>
                                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <Badge variant="outline" className="text-xs">{track.style}</Badge>
                                    <span>{track.lufs} LUFS</span>
                                    {track.status === 'complete' && (
                                      <Badge variant="secondary" className="bg-green-500/20 text-green-400 text-xs">
                                        <CheckCircle2 className="w-3 h-3 mr-1" />
                                        Complete
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div className="flex gap-1">
                                <Button 
                                  size="sm" 
                                  variant="ghost"
                                  onClick={() => toggleMasteredPlayback(track)}
                                  disabled={track.status !== 'complete'}
                                >
                                  {playingMasteredId === track.id ? (
                                    <Square className="w-4 h-4" />
                                  ) : (
                                    <Play className="w-4 h-4" />
                                  )}
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="ghost"
                                  onClick={() => saveToLibrary.mutate(track)}
                                  disabled={track.status !== 'complete' || saveToLibrary.isPending}
                                >
                                  <Save className="w-4 h-4" />
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="ghost"
                                  onClick={() => downloadMastered(track)}
                                  disabled={track.status !== 'complete'}
                                >
                                  <Download className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default DAWMasteringPanel;
