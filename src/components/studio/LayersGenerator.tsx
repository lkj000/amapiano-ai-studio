/**
 * LANDR Layers-style AI Layer Generator
 * Redesigned to match LANDR Layers UI with timeline, tracks, and generation
 */

import { useState, useRef, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
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
  Wand2,
  Plus,
  Home,
  FileMusic,
  Dices,
  X,
  MousePointer2,
  Pencil,
  Eraser,
  Trash2,
  Undo2,
  Redo2,
  Settings2,
  ZoomIn,
  ZoomOut,
  ChevronDown
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

type LayerType = 'drums' | 'bass' | 'harmony' | 'texture' | 'melody';
type ViewMode = 'welcome' | 'editor';

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
  name: string;
  audioUrl: string;
  color: string;
  startBar: number;
  lengthBars: number;
  metadata: any;
  createdAt: Date;
}

interface Song {
  id: string;
  name: string;
  createdAt: Date;
  tracks: GeneratedLayer[];
}

const LAYER_TYPES: { type: LayerType; label: string; icon: React.ReactNode; description: string; color: string }[] = [
  { type: 'drums', label: 'Drums', icon: <Drum className="w-4 h-4" />, description: 'Log drums, shakers, percussion', color: '#FF6B6B' },
  { type: 'bass', label: 'Bass', icon: <Waves className="w-4 h-4" />, description: 'Deep sub-bass, groovy basslines', color: '#4ECDC4' },
  { type: 'harmony', label: 'Harmony', icon: <Piano className="w-4 h-4" />, description: 'Piano chords, pad harmonies', color: '#45B7D1' },
  { type: 'texture', label: 'Texture', icon: <Sparkles className="w-4 h-4" />, description: 'Ambient pads, atmospherics', color: '#96CEB4' },
  { type: 'melody', label: 'Melody', icon: <Music2 className="w-4 h-4" />, description: 'Catchy hooks, synth leads', color: '#DDA0DD' },
];

const GENRES = ['Amapiano', 'Afrobeat', 'Deep House', 'Kwaito', 'Gqom', 'Lo-fi', 'Jazz', 'R&B'];
const KEYS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const SCALES = ['major', 'minor', 'dorian', 'mixolydian', 'pentatonic'];
const TIME_SIGNATURES = ['4/4', '3/4', '6/8', '2/4'];

export default function LayersGenerator() {
  const [viewMode, setViewMode] = useState<ViewMode>('welcome');
  const [songs, setSongs] = useState<Song[]>([
    { id: '1', name: 'Imported Music', createdAt: new Date(), tracks: [] },
    { id: '2', name: 'New Song', createdAt: new Date(), tracks: [] },
  ]);
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showAddTrack, setShowAddTrack] = useState(false);
  
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateProgress, setGenerateProgress] = useState(0);
  const [selectedLayer, setSelectedLayer] = useState<LayerType>('drums');
  const [playingLayerId, setPlayingLayerId] = useState<string | null>(null);
  const [selectedTool, setSelectedTool] = useState<'select' | 'pencil' | 'eraser'>('select');
  const [zoom, setZoom] = useState(100);
  
  // Track analysis state
  const [trackAnalysis, setTrackAnalysis] = useState<TrackAnalysis>({
    bpm: 120,
    key: 'C',
    scale: 'minor',
    genre: 'Amapiano',
    energy: 70
  });
  
  const [timeSignature, setTimeSignature] = useState('4/4');
  
  // Generation settings
  const [settings, setSettings] = useState({
    intensity: 60,
    complexity: 50,
    fills: 40,
    dynamics: 60
  });
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Create new song
  const createNewSong = (type: 'blank' | 'import' | 'demo' | 'sample') => {
    const newSong: Song = {
      id: `song-${Date.now()}`,
      name: type === 'import' ? 'Imported Music' : 'New Song',
      createdAt: new Date(),
      tracks: []
    };
    setSongs(prev => [newSong, ...prev]);
    setCurrentSong(newSong);
    setViewMode('editor');
    setShowSettings(true);
    
    if (type === 'import') {
      fileInputRef.current?.click();
    }
  };

  // Analyze uploaded audio
  const analyzeAudio = useCallback(async (file: File) => {
    setIsAnalyzing(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const audioContext = new AudioContext();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      
      const bpm = await estimateBpm(audioBuffer);
      const key = detectKey(audioBuffer);
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

  const estimateBpm = async (audioBuffer: AudioBuffer): Promise<number> => {
    const channelData = audioBuffer.getChannelData(0);
    const sampleRate = audioBuffer.sampleRate;
    const windowSize = Math.floor(sampleRate / 10);
    const energyValues: number[] = [];
    
    for (let i = 0; i < channelData.length - windowSize; i += windowSize) {
      let energy = 0;
      for (let j = 0; j < windowSize; j++) {
        energy += channelData[i + j] ** 2;
      }
      energyValues.push(energy);
    }
    
    const peaks: number[] = [];
    for (let i = 1; i < energyValues.length - 1; i++) {
      if (energyValues[i] > energyValues[i - 1] && energyValues[i] > energyValues[i + 1]) {
        if (energyValues[i] > 0.5 * Math.max(...energyValues)) {
          peaks.push(i);
        }
      }
    }
    
    if (peaks.length < 2) return 120;
    
    const intervals: number[] = [];
    for (let i = 1; i < peaks.length; i++) {
      intervals.push(peaks[i] - peaks[i - 1]);
    }
    
    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const secondsPerBeat = (avgInterval * windowSize) / sampleRate;
    const bpm = 60 / secondsPerBeat;
    
    return Math.max(60, Math.min(180, bpm));
  };

  const detectKey = (audioBuffer: AudioBuffer): { note: string; scale: string } => {
    const keys = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
    const scales = ['minor', 'major'];
    return {
      note: keys[Math.floor(Math.random() * keys.length)],
      scale: scales[Math.floor(Math.random() * scales.length)]
    };
  };

  const calculateEnergy = (audioBuffer: AudioBuffer): number => {
    const channelData = audioBuffer.getChannelData(0);
    let totalEnergy = 0;
    for (let i = 0; i < channelData.length; i++) {
      totalEnergy += channelData[i] ** 2;
    }
    return Math.sqrt(totalEnergy / channelData.length) * 5;
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadedFile(file);
    await analyzeAudio(file);
  };

  // Generate layer
  const generateLayer = async () => {
    if (!currentSong) return;
    
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

      const layerConfig = LAYER_TYPES.find(l => l.type === selectedLayer);
      
      const newLayer: GeneratedLayer = {
        id: `layer-${Date.now()}`,
        type: selectedLayer,
        name: `${layerConfig?.label || selectedLayer} Layer`,
        audioUrl: data?.audioUrl || '',
        color: layerConfig?.color || '#888',
        startBar: 1,
        lengthBars: 8,
        metadata: data?.metadata,
        createdAt: new Date()
      };
      
      setCurrentSong(prev => prev ? {
        ...prev,
        tracks: [...prev.tracks, newLayer]
      } : null);
      
      setShowAddTrack(false);
      
      toast({
        title: 'Layer Generated!',
        description: `${selectedLayer} layer created successfully`
      });
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

  const togglePlayLayer = (layer: GeneratedLayer) => {
    if (!layer.audioUrl) return;
    
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

  const downloadLayer = async (layer: GeneratedLayer) => {
    if (!layer.audioUrl) return;
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

  const deleteTrack = (trackId: string) => {
    setCurrentSong(prev => prev ? {
      ...prev,
      tracks: prev.tracks.filter(t => t.id !== trackId)
    } : null);
  };

  // Welcome View
  if (viewMode === 'welcome') {
    return (
      <div className="h-full bg-[#1a1a2e] text-white flex">
        <audio ref={audioRef} onEnded={() => setPlayingLayerId(null)} />
        <input
          ref={fileInputRef}
          type="file"
          accept="audio/*"
          onChange={handleFileUpload}
          className="hidden"
        />
        
        {/* Sidebar */}
        <div className="w-60 border-r border-white/10 flex flex-col">
          <div className="p-3 border-b border-white/10 flex items-center gap-2">
            <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-white/60 hover:text-white hover:bg-white/10">
              <Home className="w-4 h-4" />
            </Button>
            <Button 
              size="sm" 
              className="bg-[#00CED1] hover:bg-[#00CED1]/80 text-black font-medium h-8"
              onClick={() => createNewSong('blank')}
            >
              <Plus className="w-4 h-4 mr-1" />
              NEW SONG
            </Button>
          </div>
          
          <ScrollArea className="flex-1 p-2">
            <div className="text-xs text-white/40 px-2 py-1 mb-1">January</div>
            {songs.map(song => (
              <button
                key={song.id}
                onClick={() => {
                  setCurrentSong(song);
                  setViewMode('editor');
                }}
                className="w-full flex items-center gap-2 px-2 py-2 rounded hover:bg-white/5 text-left text-sm text-white/80"
              >
                <FileMusic className="w-4 h-4 text-white/40" />
                {song.name}
              </button>
            ))}
          </ScrollArea>
        </div>
        
        {/* Main Content */}
        <div className="flex-1 flex flex-col items-center justify-center">
          <h1 className="text-3xl font-light mb-12">Welcome Back !</h1>
          
          <div className="flex gap-4">
            {/* Import Music */}
            <Card 
              className="w-44 h-40 bg-[#2a2a3e] border-white/10 hover:border-[#00CED1]/50 cursor-pointer transition-all group"
              onClick={() => createNewSong('import')}
            >
              <CardContent className="p-6 flex flex-col items-center justify-center h-full">
                <Upload className="w-6 h-6 text-[#00CED1] mb-3" />
                <span className="font-medium mb-2">Import Music</span>
                <div className="border border-dashed border-white/20 rounded px-3 py-1 text-xs text-white/40">
                  Drop your audio file
                </div>
              </CardContent>
            </Card>
            
            {/* Demo Songs */}
            <Card 
              className="w-44 h-40 bg-[#2a2a3e] border-white/10 hover:border-[#00CED1]/50 cursor-pointer transition-all"
              onClick={() => createNewSong('demo')}
            >
              <CardContent className="p-6 flex flex-col items-center justify-center h-full text-center">
                <Dices className="w-6 h-6 text-[#00CED1] mb-3" />
                <span className="font-medium mb-2">Demo Songs</span>
                <span className="text-xs text-white/40">Explore and edit curated example projects</span>
              </CardContent>
            </Card>
            
            {/* From Scratch */}
            <Card 
              className="w-44 h-40 bg-[#2a2a3e] border-white/10 hover:border-[#00CED1]/50 cursor-pointer transition-all"
              onClick={() => createNewSong('blank')}
            >
              <CardContent className="p-6 flex flex-col items-center justify-center h-full text-center">
                <FileMusic className="w-6 h-6 text-[#00CED1] mb-3" />
                <span className="font-medium mb-2">From Scratch</span>
                <span className="text-xs text-white/40">Start with a blank project and build from there</span>
              </CardContent>
            </Card>
            
            {/* Sample Remaker */}
            <Card 
              className="w-44 h-40 bg-gradient-to-br from-[#2a2a3e] to-[#3a3a5e] border-[#00CED1]/30 hover:border-[#00CED1] cursor-pointer transition-all"
              onClick={() => createNewSong('sample')}
            >
              <CardContent className="p-6 flex flex-col items-center justify-center h-full text-center">
                <RefreshCw className="w-6 h-6 text-[#00CED1] mb-3" />
                <span className="font-medium mb-2">Sample Remaker</span>
                <span className="text-xs text-white/40">Recreate a reference sample to fit your song</span>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // Editor View
  return (
    <div className="h-full bg-[#1a1a2e] text-white flex flex-col">
      <audio ref={audioRef} onEnded={() => setPlayingLayerId(null)} />
      <input
        ref={fileInputRef}
        type="file"
        accept="audio/*"
        onChange={handleFileUpload}
        className="hidden"
      />
      
      {/* Top Bar */}
      <div className="h-12 border-b border-white/10 flex items-center justify-between px-3">
        <div className="flex items-center gap-2">
          <Button 
            size="sm" 
            variant="ghost" 
            className="h-8 w-8 p-0 text-white/60 hover:text-white hover:bg-white/10"
            onClick={() => setViewMode('welcome')}
          >
            <Home className="w-4 h-4" />
          </Button>
          <Button 
            size="sm" 
            className="bg-[#00CED1] hover:bg-[#00CED1]/80 text-black font-medium h-8"
            onClick={() => createNewSong('blank')}
          >
            <Plus className="w-4 h-4 mr-1" />
            NEW SONG
          </Button>
        </div>
        
        <div className="flex items-center gap-1">
          <span className="text-xl font-light tracking-wide">LANDR</span>
          <span className="text-xl font-light text-[#00CED1]">Layers</span>
          <Badge variant="outline" className="ml-2 text-[10px] border-white/20 text-white/60">BETA</Badge>
        </div>
        
        <div className="flex items-center gap-2">
          <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-white/60 hover:text-white">
            <Undo2 className="w-4 h-4" />
          </Button>
          <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-white/60 hover:text-white">
            <Redo2 className="w-4 h-4" />
          </Button>
          <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-white/60 hover:text-white">
            <Download className="w-4 h-4" />
          </Button>
          <Button 
            size="sm" 
            variant="ghost" 
            className="h-8 w-8 p-0 text-white/60 hover:text-white"
            onClick={() => setShowSettings(true)}
          >
            <Settings2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
      
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <div className="w-60 border-r border-white/10 flex flex-col">
          <ScrollArea className="flex-1 p-2">
            <div className="text-xs text-white/40 px-2 py-1 mb-1">January</div>
            {songs.map(song => (
              <button
                key={song.id}
                onClick={() => setCurrentSong(song)}
                className={cn(
                  "w-full flex items-center gap-2 px-2 py-2 rounded text-left text-sm",
                  currentSong?.id === song.id 
                    ? "bg-white/10 text-white" 
                    : "text-white/60 hover:bg-white/5"
                )}
              >
                <FileMusic className="w-4 h-4" />
                {song.name}
              </button>
            ))}
          </ScrollArea>
        </div>
        
        {/* Main Editor */}
        <div className="flex-1 flex flex-col">
          {/* Project Header */}
          <div className="h-10 border-b border-white/10 flex items-center px-3 gap-3">
            <FileMusic className="w-4 h-4 text-white/40" />
            <span className="font-medium">{currentSong?.name || 'New Song'}</span>
          </div>
          
          {/* Timeline & Tools */}
          <div className="flex-1 flex">
            {/* Tools Sidebar */}
            <div className="w-12 border-r border-white/10 flex flex-col items-center py-2 gap-1">
              <Button 
                size="sm"
                variant="ghost"
                className={cn(
                  "h-8 w-8 p-0",
                  selectedTool === 'select' ? "bg-[#00CED1] text-black" : "text-white/60 hover:text-white"
                )}
                onClick={() => setSelectedTool('select')}
              >
                <MousePointer2 className="w-4 h-4" />
              </Button>
              <Button 
                size="sm"
                variant="ghost"
                className={cn(
                  "h-8 w-8 p-0",
                  selectedTool === 'pencil' ? "bg-[#00CED1] text-black" : "text-white/60 hover:text-white"
                )}
                onClick={() => setSelectedTool('pencil')}
              >
                <Pencil className="w-4 h-4" />
              </Button>
              <Button 
                size="sm"
                variant="ghost"
                className={cn(
                  "h-8 w-8 p-0",
                  selectedTool === 'eraser' ? "bg-[#00CED1] text-black" : "text-white/60 hover:text-white"
                )}
                onClick={() => setSelectedTool('eraser')}
              >
                <Eraser className="w-4 h-4" />
              </Button>
            </div>
            
            {/* Timeline Grid */}
            <div className="flex-1 flex flex-col">
              {/* Add Track Button */}
              <div className="h-10 border-b border-white/10 flex items-center px-3">
                <Button 
                  size="sm" 
                  className="bg-[#00CED1] hover:bg-[#00CED1]/80 text-black font-medium h-7"
                  onClick={() => setShowAddTrack(true)}
                >
                  <Plus className="w-3 h-3 mr-1" />
                  NEW TRACK
                </Button>
              </div>
              
              {/* Bar Numbers */}
              <div className="h-6 border-b border-white/10 flex">
                <div className="w-32 border-r border-white/10" />
                {Array.from({ length: 16 }, (_, i) => (
                  <div 
                    key={i} 
                    className="flex-1 border-r border-white/5 text-xs text-white/40 flex items-center justify-center min-w-[60px]"
                  >
                    {i + 1}
                  </div>
                ))}
              </div>
              
              {/* Tracks */}
              <ScrollArea className="flex-1">
                {(!currentSong?.tracks || currentSong.tracks.length === 0) ? (
                  <div className="h-full flex items-center justify-center text-white/40">
                    <div className="text-center">
                      <Layers className="w-12 h-12 mx-auto mb-3 opacity-30" />
                      <p>No tracks yet</p>
                      <p className="text-xs mt-1">Click "NEW TRACK" to add AI-generated layers</p>
                    </div>
                  </div>
                ) : (
                  currentSong.tracks.map(track => (
                    <div key={track.id} className="h-16 border-b border-white/10 flex group">
                      {/* Track Info */}
                      <div className="w-32 border-r border-white/10 flex items-center px-2 gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 w-6 p-0 text-white/60 hover:text-white"
                          onClick={() => togglePlayLayer(track)}
                        >
                          {playingLayerId === track.id ? (
                            <Pause className="w-3 h-3" />
                          ) : (
                            <Play className="w-3 h-3" />
                          )}
                        </Button>
                        <span className="text-xs truncate flex-1">{track.name}</span>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 w-6 p-0 text-white/40 hover:text-red-400 opacity-0 group-hover:opacity-100"
                          onClick={() => deleteTrack(track.id)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                      
                      {/* Track Lane */}
                      <div className="flex-1 relative">
                        {/* Grid lines */}
                        <div className="absolute inset-0 flex">
                          {Array.from({ length: 16 }, (_, i) => (
                            <div key={i} className="flex-1 border-r border-white/5 min-w-[60px]" />
                          ))}
                        </div>
                        
                        {/* Audio clip visualization */}
                        <div 
                          className="absolute top-1 bottom-1 rounded"
                          style={{
                            left: `${((track.startBar - 1) / 16) * 100}%`,
                            width: `${(track.lengthBars / 16) * 100}%`,
                            backgroundColor: track.color,
                            opacity: 0.8
                          }}
                        >
                          <div className="h-full flex items-center px-2">
                            <span className="text-xs text-white font-medium truncate">{track.name}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </ScrollArea>
            </div>
          </div>
        </div>
      </div>
      
      {/* Bottom Transport Bar */}
      <div className="h-12 border-t border-white/10 flex items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Settings2 className="w-4 h-4 text-white/40" />
            <button 
              className="text-sm px-2 py-1 rounded hover:bg-white/10 flex items-center gap-1"
              onClick={() => setShowSettings(true)}
            >
              <span className="text-white/60">{timeSignature}</span>
              <span className="text-xs text-white/40">TIME SIG.</span>
            </button>
          </div>
          <button 
            className="text-sm px-2 py-1 rounded hover:bg-white/10 flex items-center gap-1"
            onClick={() => setShowSettings(true)}
          >
            <span className="text-white font-medium">{trackAnalysis.bpm}</span>
            <span className="text-xs text-white/40">BPM</span>
            <span className="text-xs text-white/60">TEMPO</span>
          </button>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-yellow-500" />
          <Button 
            size="sm" 
            className="bg-[#00CED1] hover:bg-[#00CED1]/80 text-black font-medium h-8"
            onClick={() => setShowAddTrack(true)}
          >
            <Plus className="w-3 h-3 mr-1" />
            ADD TRACK
          </Button>
          <Button 
            size="sm" 
            variant="outline"
            className="border-white/20 text-white hover:bg-white/10 h-8"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="w-3 h-3 mr-1" />
            IMPORT MUSIC
          </Button>
        </div>
        
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1">
            <span className="text-white font-medium">1</span>
            <span className="text-xs text-white/40">BAR</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-white font-medium">1</span>
            <span className="text-xs text-white/40">2</span>
            <span className="text-white/60">3</span>
            <span className="text-white/60">4</span>
            <span className="text-xs text-white/40">DIVISION</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-white/60">00:00.000</span>
            <span className="text-xs text-white/40">TIME</span>
          </div>
          <div className="flex items-center gap-1">
            <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-white/60" onClick={() => setZoom(Math.max(50, zoom - 25))}>
              <ZoomOut className="w-3 h-3" />
            </Button>
            <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-white/60" onClick={() => setZoom(Math.min(200, zoom + 25))}>
              <ZoomIn className="w-3 h-3" />
            </Button>
          </div>
        </div>
      </div>
      
      {/* Song Settings Dialog */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="bg-[#2a2a3e] border-white/10 text-white">
          <DialogHeader>
            <DialogTitle>Set Your Song's Settings</DialogTitle>
            <DialogDescription className="text-white/60">
              Make sure your track is aligned to the grid for the best results.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 pt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Time Signature</Label>
                <Select value={timeSignature} onValueChange={setTimeSignature}>
                  <SelectTrigger className="bg-[#1a1a2e] border-white/20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIME_SIGNATURES.map(ts => (
                      <SelectItem key={ts} value={ts}>{ts}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Tempo (BPM)</Label>
                <div className="flex gap-2">
                  <Slider
                    value={[trackAnalysis.bpm]}
                    onValueChange={([v]) => setTrackAnalysis(prev => ({ ...prev, bpm: v }))}
                    min={60}
                    max={180}
                    step={1}
                    className="flex-1"
                  />
                  <span className="w-10 text-sm font-mono text-center">{trackAnalysis.bpm}</span>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Key</Label>
                <Select
                  value={trackAnalysis.key}
                  onValueChange={(v) => setTrackAnalysis(prev => ({ ...prev, key: v }))}
                >
                  <SelectTrigger className="bg-[#1a1a2e] border-white/20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {KEYS.map(k => (
                      <SelectItem key={k} value={k}>{k}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Scale</Label>
                <Select
                  value={trackAnalysis.scale}
                  onValueChange={(v) => setTrackAnalysis(prev => ({ ...prev, scale: v }))}
                >
                  <SelectTrigger className="bg-[#1a1a2e] border-white/20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SCALES.map(s => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Genre</Label>
              <Select
                value={trackAnalysis.genre}
                onValueChange={(v) => setTrackAnalysis(prev => ({ ...prev, genre: v }))}
              >
                <SelectTrigger className="bg-[#1a1a2e] border-white/20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {GENRES.map(g => (
                    <SelectItem key={g} value={g}>{g}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Add Track Dialog */}
      <Dialog open={showAddTrack} onOpenChange={setShowAddTrack}>
        <DialogContent className="bg-[#2a2a3e] border-white/10 text-white max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wand2 className="w-5 h-5 text-[#00CED1]" />
              Generate AI Layer
            </DialogTitle>
            <DialogDescription className="text-white/60">
              Choose a layer type and customize generation settings
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 pt-4">
            {/* Layer Type Selection */}
            <div className="grid grid-cols-5 gap-2">
              {LAYER_TYPES.map(({ type, label, icon, color }) => (
                <Button
                  key={type}
                  variant={selectedLayer === type ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedLayer(type)}
                  className={cn(
                    "flex-col h-16 gap-1 border-white/20",
                    selectedLayer === type 
                      ? "text-black" 
                      : "bg-transparent text-white hover:bg-white/10"
                  )}
                  style={{
                    backgroundColor: selectedLayer === type ? color : undefined
                  }}
                >
                  {icon}
                  <span className="text-xs">{label}</span>
                </Button>
              ))}
            </div>

            <div className="text-sm text-white/60 text-center">
              {LAYER_TYPES.find(l => l.type === selectedLayer)?.description}
            </div>

            {/* Generation Settings */}
            <div className="space-y-3 pt-2">
              {Object.entries(settings).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between">
                  <Label className="capitalize text-white/80">{key}</Label>
                  <div className="flex items-center gap-2">
                    <Slider
                      value={[value]}
                      onValueChange={([v]) => setSettings(prev => ({ ...prev, [key]: v }))}
                      min={0}
                      max={100}
                      className="w-32"
                    />
                    <span className="w-10 text-sm text-white/60">{value}%</span>
                  </div>
                </div>
              ))}
            </div>

            {isGenerating && (
              <Progress value={generateProgress} className="h-2" />
            )}

            <Button 
              onClick={generateLayer} 
              className="w-full bg-[#00CED1] hover:bg-[#00CED1]/80 text-black font-medium"
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
                  Generate {LAYER_TYPES.find(l => l.type === selectedLayer)?.label} Layer
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
