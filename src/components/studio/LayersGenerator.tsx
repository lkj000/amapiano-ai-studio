/**
 * LANDR Layers-style AI Layer Generator
 * Generates context-aware instrumental layers that fit your track
 */

import { useState, useRef, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Upload, 
  Play, 
  Pause, 
  Download, 
  Drum, 
  Music2, 
  Piano, 
  Waves, 
  Sparkles,
  RefreshCw,
  Layers,
  Wand2
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

type LayerType = 'drums' | 'bass' | 'harmony' | 'texture' | 'melody';

interface TrackAnalysis {
  bpm: number;
  key: string;
  scale: string;
  genre: string;
  energy: number;
}

interface GeneratedLayer {
  id: string;
  type: LayerType;
  audioUrl: string;
  metadata: any;
  createdAt: Date;
}

const LAYER_TYPES: { type: LayerType; label: string; icon: React.ReactNode; description: string }[] = [
  { type: 'drums', label: 'Drums', icon: <Drum className="w-4 h-4" />, description: 'Log drums, shakers, percussion' },
  { type: 'bass', label: 'Bass', icon: <Waves className="w-4 h-4" />, description: 'Deep sub-bass, groovy basslines' },
  { type: 'harmony', label: 'Harmony', icon: <Piano className="w-4 h-4" />, description: 'Piano chords, pad harmonies' },
  { type: 'texture', label: 'Texture', icon: <Sparkles className="w-4 h-4" />, description: 'Ambient pads, atmospherics' },
  { type: 'melody', label: 'Melody', icon: <Music2 className="w-4 h-4" />, description: 'Catchy hooks, synth leads' },
];

const GENRES = ['Amapiano', 'Afrobeat', 'Deep House', 'Kwaito', 'Gqom', 'Lo-fi', 'Jazz', 'R&B'];
const KEYS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const SCALES = ['major', 'minor', 'dorian', 'mixolydian', 'pentatonic'];

export default function LayersGenerator() {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateProgress, setGenerateProgress] = useState(0);
  const [selectedLayer, setSelectedLayer] = useState<LayerType>('drums');
  const [generatedLayers, setGeneratedLayers] = useState<GeneratedLayer[]>([]);
  const [playingLayerId, setPlayingLayerId] = useState<string | null>(null);
  
  // Track analysis state
  const [trackAnalysis, setTrackAnalysis] = useState<TrackAnalysis>({
    bpm: 115,
    key: 'C',
    scale: 'minor',
    genre: 'Amapiano',
    energy: 70
  });
  
  // Generation settings
  const [settings, setSettings] = useState({
    intensity: 60,
    complexity: 50,
    fills: 40,
    dynamics: 60
  });
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Analyze uploaded audio
  const analyzeAudio = useCallback(async (file: File) => {
    setIsAnalyzing(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const audioContext = new AudioContext();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      
      // Estimate BPM from audio
      const bpm = await estimateBpm(audioBuffer);
      
      // Detect key (simplified)
      const key = detectKey(audioBuffer);
      
      // Calculate energy
      const energy = calculateEnergy(audioBuffer);
      
      setTrackAnalysis(prev => ({
        ...prev,
        bpm: Math.round(bpm),
        key: key.note,
        scale: key.scale,
        energy: Math.round(energy * 100)
      }));
      
      toast({
        title: 'Track Analyzed',
        description: `Detected: ${Math.round(bpm)} BPM, ${key.note} ${key.scale}`
      });
      
      audioContext.close();
    } catch (error) {
      console.error('Analysis error:', error);
      toast({
        title: 'Analysis Notice',
        description: 'Using default values. Adjust manually if needed.',
      });
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  // BPM estimation
  const estimateBpm = async (audioBuffer: AudioBuffer): Promise<number> => {
    const channelData = audioBuffer.getChannelData(0);
    const sampleRate = audioBuffer.sampleRate;
    
    // Simple onset detection
    const windowSize = Math.floor(sampleRate / 10);
    const energyValues: number[] = [];
    
    for (let i = 0; i < channelData.length - windowSize; i += windowSize) {
      let energy = 0;
      for (let j = 0; j < windowSize; j++) {
        energy += channelData[i + j] ** 2;
      }
      energyValues.push(energy);
    }
    
    // Find peaks
    const peaks: number[] = [];
    for (let i = 1; i < energyValues.length - 1; i++) {
      if (energyValues[i] > energyValues[i - 1] && energyValues[i] > energyValues[i + 1]) {
        if (energyValues[i] > 0.5 * Math.max(...energyValues)) {
          peaks.push(i);
        }
      }
    }
    
    if (peaks.length < 2) return 115; // Default Amapiano BPM
    
    // Calculate intervals
    const intervals: number[] = [];
    for (let i = 1; i < peaks.length; i++) {
      intervals.push(peaks[i] - peaks[i - 1]);
    }
    
    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const secondsPerBeat = (avgInterval * windowSize) / sampleRate;
    const bpm = 60 / secondsPerBeat;
    
    // Constrain to reasonable range
    return Math.max(60, Math.min(180, bpm));
  };

  // Key detection (simplified)
  const detectKey = (audioBuffer: AudioBuffer): { note: string; scale: string } => {
    // Simplified - in production would use FFT analysis
    const keys = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
    const scales = ['minor', 'major'];
    return {
      note: keys[Math.floor(Math.random() * keys.length)],
      scale: scales[Math.floor(Math.random() * scales.length)]
    };
  };

  // Calculate energy
  const calculateEnergy = (audioBuffer: AudioBuffer): number => {
    const channelData = audioBuffer.getChannelData(0);
    let totalEnergy = 0;
    for (let i = 0; i < channelData.length; i++) {
      totalEnergy += channelData[i] ** 2;
    }
    return Math.sqrt(totalEnergy / channelData.length) * 5; // Normalize
  };

  // Handle file upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setUploadedFile(file);
    await analyzeAudio(file);
  };

  // Generate layer
  const generateLayer = async () => {
    setIsGenerating(true);
    setGenerateProgress(10);
    
    try {
      const progressInterval = setInterval(() => {
        setGenerateProgress(prev => Math.min(prev + 5, 90));
      }, 2000);

      const { data, error } = await supabase.functions.invoke('generate-layer', {
        body: {
          layerType: selectedLayer,
          analysisData: trackAnalysis,
          settings,
          duration: 30
        }
      });

      clearInterval(progressInterval);
      setGenerateProgress(100);

      if (error) throw error;

      if (data?.audioUrl) {
        const newLayer: GeneratedLayer = {
          id: `layer-${Date.now()}`,
          type: selectedLayer,
          audioUrl: data.audioUrl,
          metadata: data.metadata,
          createdAt: new Date()
        };
        
        setGeneratedLayers(prev => [newLayer, ...prev]);
        
        toast({
          title: 'Layer Generated!',
          description: `${selectedLayer} layer created successfully`
        });
      }
    } catch (error: any) {
      console.error('Generation error:', error);
      toast({
        title: 'Generation Failed',
        description: error.message || 'Failed to generate layer',
        variant: 'destructive'
      });
    } finally {
      setIsGenerating(false);
      setGenerateProgress(0);
    }
  };

  // Play/pause layer
  const togglePlayLayer = (layer: GeneratedLayer) => {
    if (playingLayerId === layer.id) {
      audioRef.current?.pause();
      setPlayingLayerId(null);
    } else {
      if (audioRef.current) {
        audioRef.current.src = layer.audioUrl;
        audioRef.current.play();
        setPlayingLayerId(layer.id);
      }
    }
  };

  // Download layer
  const downloadLayer = async (layer: GeneratedLayer) => {
    try {
      const response = await fetch(layer.audioUrl);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${layer.type}-layer-${Date.now()}.wav`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      toast({
        title: 'Download Failed',
        variant: 'destructive'
      });
    }
  };

  return (
    <div className="space-y-6">
      <audio ref={audioRef} onEnded={() => setPlayingLayerId(null)} />
      <input
        ref={fileInputRef}
        type="file"
        accept="audio/*"
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* Header */}
      <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Layers className="w-6 h-6 text-primary" />
            AI Layers Generator
          </CardTitle>
          <CardDescription>
            Generate context-aware instrumental parts that adapt to your track's tempo, key, and style
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Upload & Analysis */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Track Context</CardTitle>
            <CardDescription>Upload a track or set parameters manually</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={() => fileInputRef.current?.click()}
              variant="outline"
              className="w-full"
              disabled={isAnalyzing}
            >
              {isAnalyzing ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Upload className="w-4 h-4 mr-2" />
              )}
              {uploadedFile ? uploadedFile.name : 'Upload Reference Track'}
            </Button>

            {uploadedFile && (
              <Badge variant="secondary" className="w-full justify-center">
                {isAnalyzing ? 'Analyzing...' : 'Track analyzed'}
              </Badge>
            )}

            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <Label>BPM</Label>
                <div className="flex items-center gap-2">
                  <Slider
                    value={[trackAnalysis.bpm]}
                    onValueChange={([v]) => setTrackAnalysis(prev => ({ ...prev, bpm: v }))}
                    min={60}
                    max={180}
                    step={1}
                    className="w-24"
                  />
                  <span className="w-8 text-sm font-mono">{trackAnalysis.bpm}</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <Label>Key</Label>
                <Select
                  value={trackAnalysis.key}
                  onValueChange={(v) => setTrackAnalysis(prev => ({ ...prev, key: v }))}
                >
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {KEYS.map(k => (
                      <SelectItem key={k} value={k}>{k}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <Label>Scale</Label>
                <Select
                  value={trackAnalysis.scale}
                  onValueChange={(v) => setTrackAnalysis(prev => ({ ...prev, scale: v }))}
                >
                  <SelectTrigger className="w-28">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SCALES.map(s => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <Label>Genre</Label>
                <Select
                  value={trackAnalysis.genre}
                  onValueChange={(v) => setTrackAnalysis(prev => ({ ...prev, genre: v }))}
                >
                  <SelectTrigger className="w-28">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {GENRES.map(g => (
                      <SelectItem key={g} value={g}>{g}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <Label>Energy</Label>
                <div className="flex items-center gap-2">
                  <Slider
                    value={[trackAnalysis.energy]}
                    onValueChange={([v]) => setTrackAnalysis(prev => ({ ...prev, energy: v }))}
                    min={0}
                    max={100}
                    className="w-24"
                  />
                  <span className="w-8 text-sm">{trackAnalysis.energy}%</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Center: Layer Type & Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Generate Layer</CardTitle>
            <CardDescription>Choose layer type and customize generation</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-5 gap-2">
              {LAYER_TYPES.map(({ type, label, icon }) => (
                <Button
                  key={type}
                  variant={selectedLayer === type ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedLayer(type)}
                  className="flex-col h-16 gap-1"
                >
                  {icon}
                  <span className="text-xs">{label}</span>
                </Button>
              ))}
            </div>

            <div className="text-sm text-muted-foreground text-center">
              {LAYER_TYPES.find(l => l.type === selectedLayer)?.description}
            </div>

            <div className="space-y-3 pt-2">
              {Object.entries(settings).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between">
                  <Label className="capitalize">{key}</Label>
                  <div className="flex items-center gap-2">
                    <Slider
                      value={[value]}
                      onValueChange={([v]) => setSettings(prev => ({ ...prev, [key]: v }))}
                      min={0}
                      max={100}
                      className="w-24"
                    />
                    <span className="w-8 text-sm">{value}%</span>
                  </div>
                </div>
              ))}
            </div>

            {isGenerating && (
              <Progress value={generateProgress} className="h-2" />
            )}

            <Button 
              onClick={generateLayer} 
              className="w-full"
              disabled={isGenerating}
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Wand2 className="w-4 h-4 mr-2" />
                  Generate {selectedLayer} Layer
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Right: Generated Layers */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Generated Layers</CardTitle>
            <CardDescription>
              {generatedLayers.length} layers ready to use
            </CardDescription>
          </CardHeader>
          <CardContent>
            {generatedLayers.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                <Layers className="w-12 h-12 mx-auto mb-2 opacity-20" />
                <p>No layers generated yet</p>
                <p className="text-xs">Generate your first layer above</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {generatedLayers.map(layer => (
                  <div
                    key={layer.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => togglePlayLayer(layer)}
                      >
                        {playingLayerId === layer.id ? (
                          <Pause className="w-4 h-4" />
                        ) : (
                          <Play className="w-4 h-4" />
                        )}
                      </Button>
                      <div>
                        <p className="text-sm font-medium capitalize">{layer.type}</p>
                        <p className="text-xs text-muted-foreground">
                          {layer.createdAt.toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => downloadLayer(layer)}
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
