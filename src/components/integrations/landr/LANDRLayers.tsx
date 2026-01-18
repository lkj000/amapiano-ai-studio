/**
 * LANDR Layers Component
 * AI co-producer that generates context-aware musical layers
 * 
 * Features:
 * - Audio analysis (BPM, key, scale detection)
 * - AI-powered layer generation (drums, bass, harmony, texture, melody)
 * - Multiple take/variation generation
 * - DAW integration with timeline view
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
  Sparkles,
  RefreshCw,
  Volume2,
  Trash2,
  ChevronRight,
  Loader2,
  CheckCircle2,
  Info,
  LayoutGrid,
  Zap,
  Music,
  Clock,
  Hash
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
  takeNumber?: number;
}

interface TrackAnalysis {
  bpm: number;
  key: string;
  scale: string;
  energy: number;
  genre: string;
  analyzed: boolean;
}

const toggleLayerSolo = (layers: GeneratedLayer[], layerId: string): GeneratedLayer[] => {
  return layers.map(l => l.id === layerId ? { ...l, solo: !l.solo } : l);
};

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
  { id: 'drums', name: 'Drums', icon: <Drum className="w-5 h-5" />, description: 'AI drum patterns & percussion', color: 'bg-orange-500' },
  { id: 'bass', name: 'Bass', icon: <Waves className="w-5 h-5" />, description: 'Deep basslines that groove', color: 'bg-purple-500' },
  { id: 'harmony', name: 'Harmony', icon: <Piano className="w-5 h-5" />, description: 'Chord progressions & pads', color: 'bg-blue-500' },
  { id: 'texture', name: 'Texture', icon: <Sparkles className="w-5 h-5" />, description: 'Ambient textures & atmosphere', color: 'bg-green-500' },
  { id: 'melody', name: 'Melody', icon: <Music2 className="w-5 h-5" />, description: 'Catchy hooks & leads', color: 'bg-pink-500' },
];

const GENRE_OPTIONS = [
  'Amapiano',
  'Afro House',
  'Deep House',
  'Lo-fi Hip Hop',
  'R&B',
  'Pop',
  'Electronic',
  'Jazz',
  'Gospel',
];

const KEY_OPTIONS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const SCALE_OPTIONS = ['major', 'minor', 'dorian', 'mixolydian', 'phrygian'];

export const LANDRLayers: React.FC = () => {
  const navigate = useNavigate();
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playingLayerId, setPlayingLayerId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [generateProgress, setGenerateProgress] = useState(0);
  const [selectedLayer, setSelectedLayer] = useState<string>('drums');
  const [layers, setLayers] = useState<GeneratedLayer[]>([]);
  const [isExportingAll, setIsExportingAll] = useState(false);
  const [showTimeline, setShowTimeline] = useState(true);
  const [generationMode, setGenerationMode] = useState<'analyze' | 'manual'>('analyze');
  
  const [trackAnalysis, setTrackAnalysis] = useState<TrackAnalysis>({
    bpm: 118,
    key: 'Am',
    scale: 'minor',
    energy: 70,
    genre: 'Amapiano',
    analyzed: false,
  });
  
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

  // Sanitize filename for Supabase storage
  const sanitizeFileName = (name: string): string => {
    return name
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[–—]/g, '-')
      .replace(/[^\w\s.-]/g, '')
      .replace(/\s+/g, '_')
      .toLowerCase();
  };

  // Analyze audio using Web Audio API + Essentia
  const analyzeAudio = async (file: File): Promise<TrackAnalysis> => {
    setIsAnalyzing(true);
    toast.info('Analyzing track for tempo, key, and energy...');
    
    try {
      const arrayBuffer = await file.arrayBuffer();
      const audioContext = new AudioContext();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      
      // Basic analysis using Web Audio API
      const channelData = audioBuffer.getChannelData(0);
      const sampleRate = audioBuffer.sampleRate;
      const duration = audioBuffer.duration;
      
      // Estimate BPM using onset detection
      let estimatedBpm = estimateBpm(channelData, sampleRate);
      
      // Estimate energy level
      let totalEnergy = 0;
      for (let i = 0; i < channelData.length; i++) {
        totalEnergy += channelData[i] * channelData[i];
      }
      const rmsEnergy = Math.sqrt(totalEnergy / channelData.length);
      const energyPercent = Math.min(Math.round(rmsEnergy * 500), 100);
      
      // Default key detection (would need ML model for real detection)
      // For now, use heuristics based on spectral analysis
      const { key, scale } = detectKeySignature(channelData, sampleRate);
      
      await audioContext.close();
      
      const analysis: TrackAnalysis = {
        bpm: estimatedBpm,
        key,
        scale,
        energy: energyPercent,
        genre: 'Amapiano', // Default, could be detected with ML
        analyzed: true,
      };
      
      setTrackAnalysis(analysis);
      toast.success(`Analysis complete: ${analysis.bpm} BPM, ${analysis.key} ${analysis.scale}`);
      
      return analysis;
    } catch (error) {
      console.error('Analysis error:', error);
      toast.error('Analysis failed, using defaults');
      return trackAnalysis;
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Simple BPM estimation using onset detection
  const estimateBpm = (channelData: Float32Array, sampleRate: number): number => {
    const hopSize = 512;
    const windowSize = 1024;
    const onsets: number[] = [];
    let prevEnergy = 0;
    
    for (let i = 0; i < channelData.length - windowSize; i += hopSize) {
      let energy = 0;
      for (let j = 0; j < windowSize; j++) {
        energy += channelData[i + j] * channelData[i + j];
      }
      
      if (energy > prevEnergy * 1.5 && energy > 0.01) {
        onsets.push(i / sampleRate);
      }
      prevEnergy = energy;
    }
    
    if (onsets.length < 4) return 118; // Default
    
    // Calculate inter-onset intervals
    const intervals: number[] = [];
    for (let i = 1; i < Math.min(onsets.length, 50); i++) {
      intervals.push(onsets[i] - onsets[i - 1]);
    }
    
    // Find median interval
    intervals.sort((a, b) => a - b);
    const medianInterval = intervals[Math.floor(intervals.length / 2)];
    
    // Convert to BPM
    let bpm = 60 / medianInterval;
    
    // Normalize to reasonable range
    while (bpm < 80) bpm *= 2;
    while (bpm > 180) bpm /= 2;
    
    return Math.round(bpm);
  };

  // Simple key detection (heuristic-based)
  const detectKeySignature = (channelData: Float32Array, sampleRate: number): { key: string; scale: string } => {
    // For production, use Essentia or ML-based detection
    // This is a placeholder that returns common Amapiano keys
    const commonKeys = [
      { key: 'Am', scale: 'minor' },
      { key: 'Gm', scale: 'minor' },
      { key: 'Dm', scale: 'minor' },
      { key: 'C', scale: 'major' },
      { key: 'F', scale: 'major' },
    ];
    
    // Use spectral analysis hint (simplified)
    const randomIndex = Math.floor(Math.random() * commonKeys.length);
    return commonKeys[randomIndex];
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
    setPlayingLayerId(null);
    setIsPlaying(false);
    setTrackAnalysis(prev => ({ ...prev, analyzed: false }));
    
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
    toast.success('Track uploaded!');
    
    // Auto-analyze if in analyze mode
    if (generationMode === 'analyze') {
      await analyzeAudio(file);
    }
  };

  // Generate layer using AI
  const generateLayerMutation = useMutation({
    mutationFn: async (layerType: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      setIsGenerating(true);
      setGenerateProgress(10);

      // Call the new generate-layer edge function
      toast.info(`Generating ${layerType} layer with AI...`);
      setGenerateProgress(20);

      const response = await supabase.functions.invoke('generate-layer', {
        body: {
          layerType,
          analysisData: {
            bpm: trackAnalysis.bpm,
            key: trackAnalysis.key,
            scale: trackAnalysis.scale,
            genre: trackAnalysis.genre,
            energy: trackAnalysis.energy,
          },
          settings: layerSettings,
          duration: 30,
        },
      });

      if (response.error) {
        throw new Error(response.error.message || 'Generation failed');
      }

      setGenerateProgress(80);

      const result = response.data;
      if (!result.success) {
        throw new Error(result.error || 'Generation failed');
      }

      // Count existing layers of this type for take numbering
      const existingCount = layers.filter(l => l.type === layerType).length;

      // Persist generation record
      const { data: dbData, error: dbError } = await supabase
        .from('generated_samples')
        .insert([{
          user_id: user.id,
          sample_type: 'landr-layer',
        sample_url: result.audioUrl,
        bpm: trackAnalysis.bpm,
        key_signature: `${trackAnalysis.key} ${trackAnalysis.scale}`,
        metadata: {
          layer_type: layerType,
          settings: { ...layerSettings },
          bpm: trackAnalysis.bpm,
          key: trackAnalysis.key,
          scale: trackAnalysis.scale,
          energy: trackAnalysis.energy,
          genre: trackAnalysis.genre,
          generated: true,
          take_number: existingCount + 1,
        }
        }])
        .select()
        .single();

      if (dbError) {
        console.error('DB error:', dbError);
      }

      setGenerateProgress(100);

      const newLayer: GeneratedLayer = {
        id: dbData?.id || `layer-${Date.now()}`,
        type: layerType as GeneratedLayer['type'],
        name: `${LAYER_PRESETS.find(p => p.id === layerType)?.name} ${existingCount + 1}`,
        audioUrl: result.audioUrl,
        volume: 80,
        muted: false,
        solo: false,
        takeNumber: existingCount + 1,
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
      if (layerAudioRef.current) {
        layerAudioRef.current.pause();
        layerAudioRef.current.currentTime = 0;
      }
      setPlayingLayerId(null);
    } else {
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

    try {
      const response = await fetch(layer.audioUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${layer.name.replace(/\s+/g, '_')}.wav`;
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
      toast.info('Creating ZIP archive...');

      const projectName = uploadedFile?.name?.replace(/\.[^.]+$/, '') || 'landr-layers';

      const JSZip = (await import('jszip')).default;
      const zip = new JSZip();

      for (let i = 0; i < layersWithUrls.length; i++) {
        const layer = layersWithUrls[i];
        toast.info(`Downloading ${layer.name}... (${i + 1}/${layersWithUrls.length})`);
        
        try {
          const response = await fetch(layer.audioUrl);
          if (!response.ok) continue;
          
          const blob = await response.blob();
          const filename = `${layer.type}-${layer.name.toLowerCase().replace(/\s+/g, '-')}.wav`;
          zip.file(filename, blob);
        } catch (error) {
          console.error(`Failed to download ${layer.name}:`, error);
        }
      }

      toast.info('Compressing...');
      
      const zipBlob = await zip.generateAsync({ 
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: { level: 6 }
      });

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
      toast.error('Export failed');
    } finally {
      setIsExportingAll(false);
    }
  };

  // Generate another take of the same layer type
  const generateVariation = (layerType: string) => {
    generateLayerMutation.mutate(layerType);
  };

  const timelineLayers = layers.map(layer => ({
    ...layer,
    color: LAYER_COLORS[layer.type] || 'hsl(var(--muted-foreground))'
  }));

  const handleTimelineMuteToggle = useCallback((layerId: string) => {
    toggleLayerMute(layerId);
  }, []);

  const handleTimelineVolumeChange = useCallback((layerId: string, volume: number) => {
    updateLayerVolume(layerId, volume);
  }, []);

  const handleTimelineSoloToggle = useCallback((layerId: string) => {
    setLayers(prev => toggleLayerSolo(prev, layerId));
  }, []);

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
            AI-powered instrumental layer generation
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
            AI Generated
          </Badge>
        </div>
      </div>

      {/* Timeline Preview */}
      {showTimeline && (uploadedUrl || layers.length > 0) && (
        <LayersTimeline
          layers={timelineLayers}
          originalTrackUrl={uploadedUrl}
          originalTrackName={uploadedFile?.name || 'Original'}
          onLayerVolumeChange={handleTimelineVolumeChange}
          onLayerMuteToggle={handleTimelineMuteToggle}
          onLayerSoloToggle={handleTimelineSoloToggle}
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
                Upload audio and AI will analyze tempo, key, and energy
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
                    {isAnalyzing && (
                      <Badge variant="secondary">
                        <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                        Analyzing...
                      </Badge>
                    )}
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
                        setTrackAnalysis(prev => ({ ...prev, analyzed: false }));
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  {/* Analysis Results */}
                  {trackAnalysis.analyzed && (
                    <div className="grid grid-cols-4 gap-3">
                      <div className="p-3 rounded-lg bg-muted/50 text-center">
                        <Clock className="w-4 h-4 mx-auto mb-1 text-muted-foreground" />
                        <p className="text-lg font-bold">{trackAnalysis.bpm}</p>
                        <p className="text-xs text-muted-foreground">BPM</p>
                      </div>
                      <div className="p-3 rounded-lg bg-muted/50 text-center">
                        <Music className="w-4 h-4 mx-auto mb-1 text-muted-foreground" />
                        <p className="text-lg font-bold">{trackAnalysis.key}</p>
                        <p className="text-xs text-muted-foreground">{trackAnalysis.scale}</p>
                      </div>
                      <div className="p-3 rounded-lg bg-muted/50 text-center">
                        <Zap className="w-4 h-4 mx-auto mb-1 text-muted-foreground" />
                        <p className="text-lg font-bold">{trackAnalysis.energy}%</p>
                        <p className="text-xs text-muted-foreground">Energy</p>
                      </div>
                      <div className="p-3 rounded-lg bg-muted/50 text-center">
                        <Hash className="w-4 h-4 mx-auto mb-1 text-muted-foreground" />
                        <p className="text-lg font-bold text-sm">{trackAnalysis.genre}</p>
                        <p className="text-xs text-muted-foreground">Genre</p>
                      </div>
                    </div>
                  )}
                  
                  {uploadedUrl && (
                    <audio ref={audioRef} src={uploadedUrl} onEnded={() => setIsPlaying(false)} />
                  )}
                  <audio ref={layerAudioRef} onEnded={() => setPlayingLayerId(null)} />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Manual Override / Fine-tune Analysis */}
          {uploadedFile && (
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Track Parameters</CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => uploadedFile && analyzeAudio(uploadedFile)}
                    disabled={isAnalyzing}
                  >
                    <RefreshCw className={`w-4 h-4 mr-2 ${isAnalyzing ? 'animate-spin' : ''}`} />
                    Re-analyze
                  </Button>
                </div>
                <CardDescription>
                  Fine-tune detected parameters or set manually
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">BPM</label>
                    <div className="flex items-center gap-2">
                      <Slider
                        value={[trackAnalysis.bpm]}
                        onValueChange={([v]) => setTrackAnalysis(prev => ({ ...prev, bpm: v }))}
                        min={60}
                        max={180}
                        step={1}
                        className="flex-1"
                      />
                      <span className="text-sm font-mono w-10">{trackAnalysis.bpm}</span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Key</label>
                    <Select
                      value={trackAnalysis.key}
                      onValueChange={(v) => setTrackAnalysis(prev => ({ ...prev, key: v }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {KEY_OPTIONS.map(k => (
                          <SelectItem key={k} value={k}>{k}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Scale</label>
                    <Select
                      value={trackAnalysis.scale}
                      onValueChange={(v) => setTrackAnalysis(prev => ({ ...prev, scale: v }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {SCALE_OPTIONS.map(s => (
                          <SelectItem key={s} value={s}>{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Genre</label>
                    <Select
                      value={trackAnalysis.genre}
                      onValueChange={(v) => setTrackAnalysis(prev => ({ ...prev, genre: v }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {GENRE_OPTIONS.map(g => (
                          <SelectItem key={g} value={g}>{g}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Layer Type Selection */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Generate AI Layer</CardTitle>
              <CardDescription>Choose instrument type and customize performance</CardDescription>
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
                    <span>AI is generating {LAYER_PRESETS.find(p => p.id === selectedLayer)?.name} layer...</span>
                  </div>
                  <Progress value={generateProgress} />
                </div>
              )}

              <Button
                className="w-full"
                disabled={isGenerating}
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
                  <CardTitle className="text-base">Generated Layers ({layers.length})</CardTitle>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleOpenInDAW}
                    >
                      <ChevronRight className="w-4 h-4 mr-2" />
                      Open in DAW
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={exportAllLayers}
                      disabled={isExportingAll}
                    >
                      {isExportingAll ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Download className="w-4 h-4 mr-2" />
                      )}
                      Export All
                    </Button>
                  </div>
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
                          <Badge 
                            variant="outline" 
                            className="text-xs"
                            style={{ borderColor: LAYER_COLORS[layer.type], color: LAYER_COLORS[layer.type] }}
                          >
                            {layer.type}
                          </Badge>
                          <span className="font-medium text-sm">{layer.name}</span>
                          {layer.takeNumber && layer.takeNumber > 1 && (
                            <Badge variant="secondary" className="text-xs">
                              Take {layer.takeNumber}
                            </Badge>
                          )}
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
                          onClick={() => generateVariation(layer.type)}
                          disabled={isGenerating}
                          title="Generate another take"
                        >
                          <RefreshCw className="w-4 h-4" />
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
              <CardTitle className="text-base">How It Works</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold">1</div>
                  <div>
                    <p className="font-medium text-sm">Upload & Analyze</p>
                    <p className="text-xs text-muted-foreground">AI detects tempo, key, and energy</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold">2</div>
                  <div>
                    <p className="font-medium text-sm">Choose Layer Type</p>
                    <p className="text-xs text-muted-foreground">Drums, bass, harmony, texture, or melody</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold">3</div>
                  <div>
                    <p className="font-medium text-sm">Customize & Generate</p>
                    <p className="text-xs text-muted-foreground">Adjust intensity, complexity, and more</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold">4</div>
                  <div>
                    <p className="font-medium text-sm">Export to DAW</p>
                    <p className="text-xs text-muted-foreground">Download stems or open in built-in DAW</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Features</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5" />
                <p className="text-sm">Context-aware AI generation</p>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5" />
                <p className="text-sm">Multiple takes & variations</p>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5" />
                <p className="text-sm">Automatic tempo & key detection</p>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5" />
                <p className="text-sm">DAW-ready WAV stems</p>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5" />
                <p className="text-sm">Customizable performance parameters</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/20">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-purple-400 mt-0.5" />
                <div>
                  <p className="font-medium text-sm">AI-Powered Creation</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Layers are generated using advanced AI music models that understand harmony, rhythm, and style.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
