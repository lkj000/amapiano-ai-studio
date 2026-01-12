/**
 * LANDR Layers Component
 * AI co-producer that creates unique musical layers
 */

import React, { useState, useRef, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Upload, 
  Download, 
  Play, 
  Pause,
  Layers,
  Music2,
  Drum,
  Guitar,
  Piano,
  Waves,
  Mic2,
  Sparkles,
  RefreshCw,
  Volume2,
  Trash2,
  Settings,
  ChevronRight,
  Loader2,
  CheckCircle2,
  Info,
  LayoutGrid
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { LayersTimeline } from './LayersTimeline';

interface GeneratedLayer {
  id: string;
  type: 'drums' | 'bass' | 'harmony' | 'texture' | 'melody';
  name: string;
  audioUrl: string;
  volume: number;
  muted: boolean;
  solo: boolean;
}

type StemKey = 'vocals' | 'drums' | 'bass' | 'other' | 'guitar' | 'piano';

type StemResult = Partial<Record<StemKey, string>>;

interface LayerPreset {
  id: string;
  name: string;
  icon: React.ReactNode;
  description: string;
  color: string;
}

const LAYER_COLORS: Record<string, string> = {
  drums: 'hsl(25, 95%, 53%)',
  bass: 'hsl(280, 87%, 65%)',
  harmony: 'hsl(217, 91%, 60%)',
  texture: 'hsl(142, 71%, 45%)',
  melody: 'hsl(330, 81%, 60%)',
};

const LAYER_PRESETS: LayerPreset[] = [
  { id: 'drums', name: 'Drums', icon: <Drum className="w-5 h-5" />, description: 'Generate drum patterns', color: 'bg-orange-500' },
  { id: 'bass', name: 'Bass', icon: <Waves className="w-5 h-5" />, description: 'Create basslines', color: 'bg-purple-500' },
  { id: 'harmony', name: 'Harmony', icon: <Piano className="w-5 h-5" />, description: 'Add chord progressions', color: 'bg-blue-500' },
  { id: 'texture', name: 'Texture', icon: <Sparkles className="w-5 h-5" />, description: 'Ambient textures', color: 'bg-green-500' },
  { id: 'melody', name: 'Melody', icon: <Music2 className="w-5 h-5" />, description: 'Generate melodies', color: 'bg-pink-500' },
];

export const LANDRLayers: React.FC = () => {
  const navigate = useNavigate();
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playingLayerId, setPlayingLayerId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateProgress, setGenerateProgress] = useState(0);
  const [selectedLayer, setSelectedLayer] = useState<string>('drums');
  const [layers, setLayers] = useState<GeneratedLayer[]>([]);
  const [availableStems, setAvailableStems] = useState<StemResult | null>(null);
  const [isExportingAll, setIsExportingAll] = useState(false);
  const [showTimeline, setShowTimeline] = useState(true);
  const [layerSettings, setLayerSettings] = useState({
    intensity: 50,
    complexity: 50,
    fills: 30,
    dynamics: 70
  });
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const layerAudioRef = useRef<HTMLAudioElement>(null);
  const queryClient = useQueryClient();

  // Fetch user's layer generations from database
  const { data: savedLayers = [], isLoading: layersLoading } = useQuery({
    queryKey: ['landr-layers'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('generated_samples')
        .select('*')
        .eq('user_id', user.id)
        .eq('sample_type', 'landr-layer')
        .order('created_at', { ascending: false })
        .limit(20);
      
      if (error) throw error;
      return data || [];
    }
  });

  // Sanitize filename for Supabase storage (remove special characters)
  const sanitizeFileName = (name: string): string => {
    return name
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove accents
      .replace(/[–—]/g, '-') // Replace em/en dashes with hyphens
      .replace(/[^\w\s.-]/g, '') // Remove other special chars
      .replace(/\s+/g, '_') // Replace spaces with underscores
      .toLowerCase();
  };

  const getStemForLayerType = (layerType: string, stems: StemResult): { stemKey: StemKey; url: string } | null => {
    const pick = (stemKey: StemKey): { stemKey: StemKey; url: string } | null => {
      const url = stems[stemKey];
      return url ? { stemKey, url } : null;
    };

    switch (layerType) {
      case 'drums':
        return pick('drums');
      case 'bass':
        return pick('bass');
      case 'harmony':
        return pick('piano') || pick('guitar') || pick('other');
      case 'texture':
        return pick('other');
      case 'melody':
        return pick('vocals') || pick('guitar') || pick('piano') || pick('other');
      default:
        return null;
    }
  };

  const splitStems = async (file: File): Promise<StemResult> => {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase env (VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY)');
    }

    setGenerateProgress(8);
    toast.info('Uploading audio for AI stem separation...');

    const formData = new FormData();
    formData.append('audio', file);

    const startResponse = await fetch(`${supabaseUrl}/functions/v1/stem-splitter`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${supabaseKey}`,
      },
      body: formData,
    });

    const startData = await startResponse.json().catch(() => ({}));
    if (!startResponse.ok) {
      throw new Error(startData.error || `Failed to start separation (${startResponse.status})`);
    }

    if (!startData.predictionId) {
      throw new Error(startData.error || 'No prediction ID returned');
    }

    toast.info('AI is separating stems... This may take 2-4 minutes.');

    const maxAttempts = 120; // 4 minutes (2s intervals)
    for (let attempts = 0; attempts < maxAttempts; attempts++) {
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // 10% -> 90% over polling
      const pollProgress = 10 + Math.min(80, (attempts / maxAttempts) * 80);
      setGenerateProgress(Math.round(pollProgress));

      const pollResponse = await fetch(`${supabaseUrl}/functions/v1/stem-splitter`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ predictionId: startData.predictionId }),
      });

      if (!pollResponse.ok) continue;

      const pollData = await pollResponse.json().catch(() => ({}));

      if (pollData.status === 'failed') {
        throw new Error(pollData.error || 'Stem separation failed');
      }

      if (pollData.status === 'succeeded' && pollData.stems) {
        setGenerateProgress(92);
        return pollData.stems as StemResult;
      }
    }

    throw new Error('Stem separation timed out after 4 minutes');
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    if (!file.type.startsWith('audio/')) {
      toast.error('Please upload an audio file');
      return;
    }
    
    setUploadedFile(file);
    setLayers([]);
    setAvailableStems(null);
    setPlayingLayerId(null);
    setIsPlaying(false);
    // Upload to Supabase storage
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error('Please sign in to upload');
      return;
    }
    
    const sanitizedName = sanitizeFileName(file.name);
    const fileName = `${user.id}/layers-input/${Date.now()}-${sanitizedName}`;
    const { data, error } = await supabase.storage
      .from('audio-files')
      .upload(fileName, file);
    
    if (error) {
      toast.error('Upload failed');
      console.error(error);
      return;
    }
    
    const { data: { publicUrl } } = supabase.storage
      .from('audio-files')
      .getPublicUrl(fileName);
    
    setUploadedUrl(publicUrl);
    toast.success('Track uploaded! Ready to generate layers.');
  };

  const generateLayerMutation = useMutation({
    mutationFn: async (layerType: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      if (!uploadedFile) throw new Error('Please upload a track first');

      setIsGenerating(true);
      setGenerateProgress(5);

      // 1) Ensure we have stems (cached per uploaded track)
      let stems = availableStems;
      if (!stems) {
        stems = await splitStems(uploadedFile);
        setAvailableStems(stems);
      }

      // 2) Pick the stem for the requested layer type
      const picked = getStemForLayerType(layerType, stems);
      if (!picked) {
        throw new Error(`No separated stem available for "${layerType}"`);
      }

      // 3) Persist generation record (sample_url must be the layer audio, not the source track)
      const { data, error } = await supabase
        .from('generated_samples')
        .insert({
          user_id: user.id,
          sample_type: 'landr-layer',
          sample_url: picked.url,
          metadata: {
            layer_type: layerType,
            stem_key: picked.stemKey,
            settings: layerSettings,
            source_file: uploadedFile.name,
            source_url: uploadedUrl,
          }
        })
        .select()
        .single();

      if (error) throw error;

      setGenerateProgress(100);

      const newLayer: GeneratedLayer = {
        id: data.id,
        type: layerType as GeneratedLayer['type'],
        name: `${LAYER_PRESETS.find(p => p.id === layerType)?.name} Layer`,
        audioUrl: picked.url,
        volume: 80,
        muted: false,
        solo: false
      };

      return newLayer;
    },
    onSuccess: (newLayer) => {
      setLayers(prev => [...prev, newLayer]);
      queryClient.invalidateQueries({ queryKey: ['landr-layers'] });
      toast.success(`${newLayer.name} generated!`);
      setIsGenerating(false);
      setGenerateProgress(0);
    },
    onError: (error) => {
      console.error(error);
      toast.error(error instanceof Error ? error.message : 'Failed to generate layer');
      setIsGenerating(false);
      setGenerateProgress(0);
    }
  });

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('audio/')) {
      const fakeEvent = { target: { files: [file] } } as any;
      handleFileUpload(fakeEvent);
    }
  };

  const togglePlayback = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const updateLayerVolume = (layerId: string, volume: number) => {
    setLayers(prev => prev.map(l => 
      l.id === layerId ? { ...l, volume } : l
    ));

    if (playingLayerId === layerId && layerAudioRef.current) {
      layerAudioRef.current.volume = volume / 100;
    }
  };

  const toggleLayerMute = (layerId: string) => {
    setLayers(prev => prev.map(l => 
      l.id === layerId ? { ...l, muted: !l.muted } : l
    ));
  };

  const playLayer = (layer: GeneratedLayer) => {
    if (!layer.audioUrl) {
      toast.error('No audio available for this layer');
      return;
    }
    
    if (playingLayerId === layer.id) {
      // Stop playing
      if (layerAudioRef.current) {
        layerAudioRef.current.pause();
        layerAudioRef.current.currentTime = 0;
      }
      setPlayingLayerId(null);
    } else {
      // Play new layer
      if (layerAudioRef.current) {
        layerAudioRef.current.src = layer.audioUrl;
        layerAudioRef.current.volume = layer.volume / 100;
        layerAudioRef.current.play().catch(() => {
          toast.error('Playback failed');
        });
      }
      setPlayingLayerId(layer.id);
    }
  };

  const removeLayer = (layerId: string) => {
    if (playingLayerId === layerId && layerAudioRef.current) {
      layerAudioRef.current.pause();
      layerAudioRef.current.currentTime = 0;
      setPlayingLayerId(null);
    }

    setLayers(prev => prev.filter(l => l.id !== layerId));
  };

  const downloadLayer = async (layer: GeneratedLayer) => {
    if (!layer.audioUrl) {
      toast.error('No audio available to download');
      return;
    }

    const inferExtension = (url: string) => {
      try {
        const pathname = new URL(url).pathname;
        const ext = pathname.split('.').pop();
        if (!ext) return 'wav';
        return ext.split('?')[0].toLowerCase();
      } catch {
        return 'wav';
      }
    };

    try {
      const response = await fetch(layer.audioUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      const ext = inferExtension(layer.audioUrl);
      a.href = url;
      a.download = `${layer.name.replace(/\s+/g, '_')}.${ext}`;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success('Layer downloaded!');
    } catch (error) {
      toast.error('Download failed');
    }
  };

  const exportAllLayers = async () => {
    const layersWithUrls = layers.filter(l => !!l.audioUrl);
    if (layersWithUrls.length === 0) {
      toast.error('No layers available to export');
      return;
    }

    setIsExportingAll(true);
    try {
      toast.info('Creating ZIP archive (client-side)...');

      const inferExtension = (url: string) => {
        try {
          const pathname = new URL(url).pathname;
          const ext = pathname.split('.').pop();
          if (!ext) return 'wav';
          return ext.split('?')[0].toLowerCase();
        } catch {
          return 'wav';
        }
      };

      const projectName = uploadedFile?.name?.replace(/\.[^.]+$/, '') || 'landr-layers';

      // Use client-side JSZip for better performance and no memory limits
      const JSZip = (await import('jszip')).default;
      const zip = new JSZip();

      // Download and add each layer to the ZIP
      for (let i = 0; i < layersWithUrls.length; i++) {
        const layer = layersWithUrls[i];
        toast.info(`Downloading ${layer.name}... (${i + 1}/${layersWithUrls.length})`);
        
        try {
          const response = await fetch(layer.audioUrl);
          if (!response.ok) {
            console.error(`Failed to fetch ${layer.name}`);
            continue;
          }
          
          const blob = await response.blob();
          const ext = inferExtension(layer.audioUrl);
          const filename = `${layer.type}-${layer.name.toLowerCase().replace(/\s+/g, '-')}.${ext}`;
          
          zip.file(filename, blob);
        } catch (error) {
          console.error(`Failed to download ${layer.name}:`, error);
        }
      }

      toast.info('Compressing...');
      
      // Generate the ZIP file
      const zipBlob = await zip.generateAsync({ 
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: { level: 6 }
      });

      // Download the ZIP
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${projectName}-layers.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success('ZIP downloaded!');
    } catch (error) {
      console.error('[LANDRLayers] Export All failed:', error);
      toast.error('Export All failed - downloading individually...');

      // Fallback: download layers individually
      for (let i = 0; i < layersWithUrls.length; i++) {
        await downloadLayer(layersWithUrls[i]);
        if (i < layersWithUrls.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
    } finally {
      setIsExportingAll(false);
    }
  };

  // Prepare layers data for timeline component
  const timelineLayers = layers.map(layer => ({
    ...layer,
    color: LAYER_COLORS[layer.type] || 'hsl(var(--muted-foreground))'
  }));

  // Handle layer mute toggle from timeline
  const handleTimelineMuteToggle = useCallback((layerId: string) => {
    toggleLayerMute(layerId);
  }, []);

  // Handle layer volume change from timeline
  const handleTimelineVolumeChange = useCallback((layerId: string, volume: number) => {
    updateLayerVolume(layerId, volume);
  }, []);

  // Handle opening layers in DAW
  const handleOpenInDAW = useCallback(() => {
    const dawImportData = {
      layers: layers.map(l => ({
        id: l.id,
        name: l.name,
        type: l.type,
        audioUrl: l.audioUrl,
        color: LAYER_COLORS[l.type]
      })),
      originalTrack: uploadedUrl ? {
        name: uploadedFile?.name || 'Original Track',
        audioUrl: uploadedUrl
      } : null,
      timestamp: Date.now()
    };
    
    localStorage.setItem('pendingLayersImport', JSON.stringify(dawImportData));
    toast.success('Layers prepared for DAW import');
    navigate('/daw');
  }, [layers, uploadedUrl, uploadedFile, navigate]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold flex items-center gap-2">
            <Layers className="w-6 h-6 text-primary" />
            LANDR Layers
          </h3>
          <p className="text-sm text-muted-foreground">
            AI co-producer that creates unique musical layers
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={showTimeline ? "secondary" : "outline"}
            size="sm"
            onClick={() => setShowTimeline(!showTimeline)}
          >
            <LayoutGrid className="w-4 h-4 mr-2" />
            Timeline
          </Button>
          <Badge variant="secondary" className="bg-gradient-to-r from-purple-500/20 to-pink-500/20">
            <Sparkles className="w-3 h-3 mr-1" />
            AI Powered
          </Badge>
        </div>
      </div>

      {/* DAW-style Timeline Preview */}
      {showTimeline && (uploadedUrl || layers.length > 0) && (
        <LayersTimeline
          layers={timelineLayers}
          originalTrackUrl={uploadedUrl}
          originalTrackName={uploadedFile?.name || 'Original'}
          onLayerVolumeChange={handleTimelineVolumeChange}
          onLayerMuteToggle={handleTimelineMuteToggle}
          onOpenInDAW={handleOpenInDAW}
        />
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Upload & Controls */}
        <div className="lg:col-span-2 space-y-6">
          {/* Upload Zone */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Import Your Track</CardTitle>
              <CardDescription>
                Upload audio and let AI analyze harmony, rhythm, and structure
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!uploadedFile ? (
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-muted-foreground/30 rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 hover:bg-muted/30 transition-all"
                >
                  <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="font-medium">Drop your track here</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    or click to browse • MP3, WAV, AIFF
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="audio/*"
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
                    <Button
                      variant="outline"
                      size="icon"
                      className="rounded-full"
                      onClick={togglePlayback}
                    >
                      {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </Button>
                    <div className="flex-1">
                      <p className="font-medium text-sm">{uploadedFile.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        if (audioRef.current) {
                          audioRef.current.pause();
                          audioRef.current.currentTime = 0;
                        }
                        if (layerAudioRef.current) {
                          layerAudioRef.current.pause();
                          layerAudioRef.current.currentTime = 0;
                        }

                        setIsPlaying(false);
                        setPlayingLayerId(null);
                        setUploadedFile(null);
                        setUploadedUrl(null);
                        setLayers([]);
                        setAvailableStems(null);
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  {uploadedUrl && (
                    <audio ref={audioRef} src={uploadedUrl} onEnded={() => setIsPlaying(false)} />
                  )}
                  {/* Hidden audio element for layer playback */}
                  <audio ref={layerAudioRef} onEnded={() => setPlayingLayerId(null)} />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Layer Type Selection */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Generate Layer</CardTitle>
              <CardDescription>Choose what type of layer to create</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-5 gap-2">
                {LAYER_PRESETS.map(preset => (
                  <Button
                    key={preset.id}
                    variant={selectedLayer === preset.id ? 'default' : 'outline'}
                    className={`h-auto py-4 flex-col gap-2 ${selectedLayer === preset.id ? preset.color : ''}`}
                    onClick={() => setSelectedLayer(preset.id)}
                    disabled={isGenerating}
                  >
                    {preset.icon}
                    <span className="text-xs">{preset.name}</span>
                  </Button>
                ))}
              </div>

              {/* Layer Settings */}
              <div className="grid grid-cols-2 gap-4 pt-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Intensity</span>
                    <span>{layerSettings.intensity}%</span>
                  </div>
                  <Slider
                    value={[layerSettings.intensity]}
                    onValueChange={([v]) => setLayerSettings(s => ({ ...s, intensity: v }))}
                    max={100}
                    step={1}
                    disabled={isGenerating}
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Complexity</span>
                    <span>{layerSettings.complexity}%</span>
                  </div>
                  <Slider
                    value={[layerSettings.complexity]}
                    onValueChange={([v]) => setLayerSettings(s => ({ ...s, complexity: v }))}
                    max={100}
                    step={1}
                    disabled={isGenerating}
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Fills</span>
                    <span>{layerSettings.fills}%</span>
                  </div>
                  <Slider
                    value={[layerSettings.fills]}
                    onValueChange={([v]) => setLayerSettings(s => ({ ...s, fills: v }))}
                    max={100}
                    step={1}
                    disabled={isGenerating}
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Dynamics</span>
                    <span>{layerSettings.dynamics}%</span>
                  </div>
                  <Slider
                    value={[layerSettings.dynamics]}
                    onValueChange={([v]) => setLayerSettings(s => ({ ...s, dynamics: v }))}
                    max={100}
                    step={1}
                    disabled={isGenerating}
                  />
                </div>
              </div>

              {isGenerating && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Generating {LAYER_PRESETS.find(p => p.id === selectedLayer)?.name} layer...</span>
                  </div>
                  <Progress value={generateProgress} />
                </div>
              )}

              <Button
                className="w-full"
                disabled={!uploadedFile || isGenerating}
                onClick={() => generateLayerMutation.mutate(selectedLayer)}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate {LAYER_PRESETS.find(p => p.id === selectedLayer)?.name} Layer
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Generated Layers */}
          {layers.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Generated Layers</CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={exportAllLayers}
                    disabled={isExportingAll || layers.length === 0}
                  >
                    {isExportingAll ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Download className="w-4 h-4 mr-2" />
                    )}
                    Export All
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {layers.map(layer => (
                    <div
                      key={layer.id}
                      className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
                        layer.muted ? 'bg-muted/30 opacity-50' : 'bg-muted/50'
                      }`}
                    >
                      <Button
                        variant="ghost"
                        size="icon"
                        className="rounded-full"
                        onClick={() => playLayer(layer)}
                        disabled={!layer.audioUrl}
                      >
                        {playingLayerId === layer.id ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                      </Button>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {layer.type}
                          </Badge>
                          <span className="font-medium text-sm">{layer.name}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 w-32">
                        <Volume2 className="w-4 h-4 text-muted-foreground" />
                        <Slider
                          value={[layer.volume]}
                          onValueChange={([v]) => updateLayerVolume(layer.id, v)}
                          max={100}
                          className="flex-1"
                        />
                      </div>

                      <div className="flex items-center gap-1">
                        <Button
                          variant={layer.muted ? 'default' : 'ghost'}
                          size="sm"
                          onClick={() => toggleLayerMute(layer.id)}
                        >
                          M
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => downloadLayer(layer)}
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeLayer(layer.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Info Panel */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">About LANDR Layers</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                An AI co-producer that listens to your track and creates unique musical layers designed to complement it.
              </p>
              
              <div className="space-y-3">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5" />
                  <p className="text-sm">Context-aware layer generation</p>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5" />
                  <p className="text-sm">Multi-instrument AI performances</p>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5" />
                  <p className="text-sm">Per-layer creative control</p>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5" />
                  <p className="text-sm">DAW-ready stems (48kHz / 24-bit)</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/20">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-purple-400 mt-0.5" />
                <div>
                  <p className="font-medium text-sm">Ethical AI</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    All models trained on recordings from consenting musicians with transparent revenue-sharing.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Generations */}
          {savedLayers.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Recent Generations</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[200px]">
                  <div className="space-y-2">
                    {savedLayers.slice(0, 10).map((layer: any) => (
                      <div
                        key={layer.id}
                        className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted/50 cursor-pointer"
                      >
                        <Layers className="w-4 h-4 text-muted-foreground" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm truncate">
                            {(layer.metadata as any)?.layer_type || 'Layer'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(layer.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};
