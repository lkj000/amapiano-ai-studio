import { useState, useCallback, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Upload, Radio, Layers3, Music4, Drum, Guitar, 
  Mic, Piano, Volume2, Download, Eye, Zap 
} from "lucide-react";
import { toast } from "sonner";

interface SeparatedStem {
  id: string;
  name: string;
  instrument: string;
  confidence: number;
  waveformData: number[];
  audioBuffer?: AudioBuffer;
  isPlaying: boolean;
  volume: number;
  isMuted: boolean;
  color: string;
}

interface AnalysisResult {
  bpm: number;
  key: string;
  mood: string;
  genre: string;
  complexity: number;
  patterns: {
    rhythm: string[];
    harmony: string[];
    melody: string[];
  };
}

const INSTRUMENT_COLORS = {
  drums: 'bg-red-500',
  bass: 'bg-purple-500',
  piano: 'bg-blue-500',
  guitar: 'bg-green-500',
  vocals: 'bg-yellow-500',
  synth: 'bg-pink-500',
  percussion: 'bg-orange-500',
  strings: 'bg-indigo-500',
  other: 'bg-gray-500'
};

export const SourceSeparationEngine: React.FC<{ initialAudioUrl?: string; autoStart?: boolean; }> = ({ initialAudioUrl, autoStart }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [separationProgress, setSeparationProgress] = useState(0);
  const [separatedStems, setSeparatedStems] = useState<SeparatedStem[]>([]);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [enableRealTimeProcessing, setEnableRealTimeProcessing] = useState(false);
  const [separationQuality, setSeparationQuality] = useState(85);
  const [enablePatternExtraction, setEnablePatternExtraction] = useState(true);

  const audioContextRef = useRef<AudioContext | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const analyzerNodes = useRef<Map<string, AnalyserNode>>(new Map());
  const audioSourcesRef = useRef<Map<string, AudioBufferSourceNode>>(new Map());

  const initializeAudioContext = useCallback(async () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (audioContextRef.current.state === 'suspended') {
      await audioContextRef.current.resume();
      console.log('AudioContext resumed');
    }
  }, []);

  const generateMockWaveform = useCallback((length: number = 200): number[] => {
    return Array.from({ length }, (_, i) => {
      const t = i / length;
      return Math.sin(t * Math.PI * 8) * Math.exp(-t * 2) * (0.5 + Math.random() * 0.5);
    });
  }, []);

  const simulateSourceSeparation = useCallback(async (file: File): Promise<SeparatedStem[]> => {
    const stems: SeparatedStem[] = [
      {
        id: 'drums',
        name: 'Log Drums',
        instrument: 'drums',
        confidence: 94.2,
        waveformData: generateMockWaveform(),
        isPlaying: false,
        volume: 80,
        isMuted: false,
        color: INSTRUMENT_COLORS.drums
      },
      {
        id: 'bass',
        name: 'Deep Bass',
        instrument: 'bass',
        confidence: 91.7,
        waveformData: generateMockWaveform(),
        isPlaying: false,
        volume: 75,
        isMuted: false,
        color: INSTRUMENT_COLORS.bass
      },
      {
        id: 'piano',
        name: 'Amapiano Keys',
        instrument: 'piano',
        confidence: 89.3,
        waveformData: generateMockWaveform(),
        isPlaying: false,
        volume: 70,
        isMuted: false,
        color: INSTRUMENT_COLORS.piano
      },
      {
        id: 'percussion',
        name: 'Shakers & Perc',
        instrument: 'percussion',
        confidence: 86.8,
        waveformData: generateMockWaveform(),
        isPlaying: false,
        volume: 65,
        isMuted: false,
        color: INSTRUMENT_COLORS.percussion
      },
      {
        id: 'synth',
        name: 'Synth Lead',
        instrument: 'synth',
        confidence: 82.4,
        waveformData: generateMockWaveform(),
        isPlaying: false,
        volume: 60,
        isMuted: false,
        color: INSTRUMENT_COLORS.synth
      }
    ];

    // Simulate processing time
    for (let progress = 0; progress <= 100; progress += 5) {
      setSeparationProgress(progress);
      await new Promise(resolve => setTimeout(resolve, 150));
    }

    return stems;
  }, [generateMockWaveform]);

  const analyzeAudioPatterns = useCallback(async (stems: SeparatedStem[]): Promise<AnalysisResult> => {
    // Simulate pattern analysis
    await new Promise(resolve => setTimeout(resolve, 1000));

    return {
      bpm: 118,
      key: 'F# minor',
      mood: 'Energetic',
      genre: 'Private School Amapiano',
      complexity: 78,
      patterns: {
        rhythm: ['4/4 Log Drum Pattern', 'Syncopated Hi-Hat', 'Off-beat Kick'],
        harmony: ['ii-V-I Progression', 'Jazz Extensions', 'Modal Interchange'],
        melody: ['Pentatonic Motifs', 'Call-Response', 'Rhythmic Displacement']
      }
    };
  }, []);

  const handleFileUpload = useCallback(async (file: File) => {
    if (!file) return;

    setOriginalFile(file);
    setIsProcessing(true);
    setUploadProgress(0);
    setSeparationProgress(0);

    try {
      await initializeAudioContext();

      // Simulate file upload progress
      for (let progress = 0; progress <= 100; progress += 10) {
        setUploadProgress(progress);
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      toast.info("Starting source separation...");

      // Perform source separation
      const stems = await simulateSourceSeparation(file);
      setSeparatedStems(stems);

      if (enablePatternExtraction) {
        toast.info("Analyzing musical patterns...");
        const analysis = await analyzeAudioPatterns(stems);
        setAnalysisResult(analysis);
      }

      toast.success(`Successfully separated audio into ${stems.length} stems!`);
    } catch (error) {
      toast.error("Failed to process audio file");
      console.error(error);
    } finally {
      setIsProcessing(false);
    }
  }, [initializeAudioContext, simulateSourceSeparation, analyzeAudioPatterns, enablePatternExtraction]);

  // Auto-start processing if an initial URL is provided
  useEffect(() => {
    const run = async () => {
      if (autoStart && initialAudioUrl) {
        try {
          const resp = await fetch(initialAudioUrl);
          if (!resp.ok) throw new Error('Failed to fetch audio for stems');
          const blob = await resp.blob();
          const ext = (blob.type?.split('/')[1] || 'mp3').split(';')[0];
          const file = new File([blob], `track-${Date.now()}.${ext}`, { type: blob.type || 'audio/mpeg' });
          await handleFileUpload(file);
        } catch (e) {
          toast.error("Failed to prepare track for stem separation");
          console.error(e);
        }
      }
    };
    run();
    // We intentionally omit handleFileUpload to avoid unnecessary re-runs
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialAudioUrl, autoStart]);

  const toggleStemPlayback = useCallback(async (stemId: string) => {
    await initializeAudioContext();
    
    setSeparatedStems(prev => prev.map(stem => {
      if (stem.id === stemId) {
        const newIsPlaying = !stem.isPlaying;
        
        // Stop audio if playing
        if (!newIsPlaying) {
          const source = audioSourcesRef.current.get(stemId);
          if (source) {
            source.stop();
            audioSourcesRef.current.delete(stemId);
          }
        } else {
          // Start playback - in real implementation would play actual stem audio
          toast.info(`Playing ${stem.name}...`);
        }
        
        return { ...stem, isPlaying: newIsPlaying };
      }
      return stem;
    }));
  }, [initializeAudioContext]);

  const updateStemVolume = useCallback((stemId: string, volume: number) => {
    setSeparatedStems(prev => prev.map(stem => 
      stem.id === stemId ? { ...stem, volume } : stem
    ));
  }, []);

  const toggleStemMute = useCallback((stemId: string) => {
    setSeparatedStems(prev => prev.map(stem => 
      stem.id === stemId ? { ...stem, isMuted: !stem.isMuted } : stem
    ));
  }, []);

  const exportStem = useCallback(async (stem: SeparatedStem) => {
    try {
      toast.info(`Exporting ${stem.name}...`);
      
      // Create a simple WAV file from the stem data
      const sampleRate = 44100;
      const duration = 10; // 10 seconds
      const numSamples = sampleRate * duration;
      const buffer = new Float32Array(numSamples);
      
      // Generate audio based on waveform pattern (mock data for now)
      for (let i = 0; i < numSamples; i++) {
        const t = i / sampleRate;
        const waveformIndex = Math.floor((i / numSamples) * stem.waveformData.length);
        const amplitude = stem.waveformData[waveformIndex] * 0.5;
        buffer[i] = amplitude * Math.sin(2 * Math.PI * 440 * t);
      }
      
      // Convert to WAV blob
      const wavBlob = createWavBlob(buffer, sampleRate);
      
      // Create download link
      const url = URL.createObjectURL(wavBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${stem.name.toLowerCase().replace(/\s+/g, '-')}.wav`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success(`${stem.name} exported successfully!`);
    } catch (error) {
      toast.error('Export failed');
      console.error(error);
    }
  }, []);

  const createWavBlob = (buffer: Float32Array, sampleRate: number): Blob => {
    const numChannels = 1;
    const bitsPerSample = 16;
    const bytesPerSample = bitsPerSample / 8;
    const blockAlign = numChannels * bytesPerSample;
    const byteRate = sampleRate * blockAlign;
    const dataSize = buffer.length * bytesPerSample;
    const bufferSize = 44 + dataSize;
    
    const arrayBuffer = new ArrayBuffer(bufferSize);
    const view = new DataView(arrayBuffer);
    
    // WAV header
    const writeString = (offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };
    
    writeString(0, 'RIFF');
    view.setUint32(4, bufferSize - 8, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, byteRate, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitsPerSample, true);
    writeString(36, 'data');
    view.setUint32(40, dataSize, true);
    
    // Audio data
    let offset = 44;
    for (let i = 0; i < buffer.length; i++) {
      const sample = Math.max(-1, Math.min(1, buffer[i]));
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
      offset += 2;
    }
    
    return new Blob([arrayBuffer], { type: 'audio/wav' });
  };

  const extractPatternsFromStem = useCallback(async (stem: SeparatedStem) => {
    try {
      toast.info(`Analyzing ${stem.name}...`);
      
      // Simulate pattern extraction
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success(`Extracted patterns from ${stem.name}!`);
    } catch (error) {
      toast.error('Pattern extraction failed');
      console.error(error);
    }
  }, []);

  const exportAllStems = useCallback(async () => {
    try {
      toast.info('Exporting all stems...');
      
      for (const stem of separatedStems) {
        await exportStem(stem);
      }
      
      toast.success('All stems exported successfully!');
    } catch (error) {
      toast.error('Failed to export all stems');
      console.error(error);
    }
  }, [separatedStems, exportStem]);

  const convertToMidi = useCallback(async () => {
    try {
      if (!originalFile) {
        toast.error('No audio file available for MIDI conversion');
        return;
      }
      
      toast.info('Converting to MIDI patterns...');
      
      // Use the audio-to-midi edge function
      const { supabase } = await import('@/integrations/supabase/client');
      
      const formData = new FormData();
      formData.append('audio', originalFile);
      
      const { data, error } = await supabase.functions.invoke('audio-to-midi', {
        body: formData,
      });
      
      if (error) throw error;
      
      if (data?.midiUrl) {
        // Download the MIDI file
        const response = await fetch(data.midiUrl);
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'converted-stems.mid';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        toast.success('MIDI file downloaded!');
      } else {
        toast.success('MIDI patterns generated!');
      }
    } catch (error) {
      toast.error('MIDI conversion failed');
      console.error(error);
    }
  }, [originalFile]);

  const importToDAW = useCallback(async () => {
    try {
      toast.info('Importing stems to DAW...');
      
      // Store stems data in localStorage to be picked up by DAW
      const stemData = separatedStems.map(stem => ({
        name: stem.name,
        instrument: stem.instrument,
        color: stem.color,
        volume: stem.volume,
      }));
      
      localStorage.setItem('pendingDAWImport', JSON.stringify({
        stems: stemData,
        timestamp: Date.now(),
      }));
      
      // Navigate to DAW
      window.location.href = '/daw';
      
      toast.success('Navigating to DAW...');
    } catch (error) {
      toast.error('DAW import failed');
      console.error(error);
    }
  }, [separatedStems]);

  const renderWaveform = (waveformData: number[], color: string) => {
    const maxValue = Math.max(...waveformData.map(Math.abs));
    const normalizedData = waveformData.map(value => (value / maxValue) * 100);

    return (
      <div className="flex items-center h-16 bg-muted/20 rounded px-2 gap-1">
        {normalizedData.map((value, index) => (
          <div
            key={index}
            className={`w-1 ${color} opacity-70 rounded-sm`}
            style={{ height: `${Math.abs(value)}%` }}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Layers3 className="w-5 h-5 text-primary" />
            AI Source Separation Engine
            <Badge variant="outline" className="ml-auto">
              Neural Network Powered
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Upload Section */}
            <div className="space-y-4">
              <div className="flex gap-4 items-end">
                <div className="space-y-2 flex-1">
                  <Label htmlFor="audio-file">Upload Audio File</Label>
                  <Input
                    id="audio-file"
                    type="file"
                    accept="audio/*"
                    ref={fileInputRef}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileUpload(file);
                    }}
                    disabled={isProcessing}
                  />
                </div>
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isProcessing}
                  variant="outline"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Browse
                </Button>
              </div>

              <div className="flex gap-4 items-center text-sm">
                <div className="flex items-center space-x-2">
                  <Switch 
                    checked={enableRealTimeProcessing} 
                    onCheckedChange={setEnableRealTimeProcessing} 
                  />
                  <span>Real-time Processing</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch 
                    checked={enablePatternExtraction} 
                    onCheckedChange={setEnablePatternExtraction} 
                  />
                  <span>Pattern Extraction</span>
                </div>
                <div className="flex items-center space-x-2 flex-1">
                  <span className="whitespace-nowrap">Quality:</span>
                  <Slider
                    value={[separationQuality]}
                    onValueChange={([value]) => setSeparationQuality(value)}
                    max={100}
                    step={5}
                    className="flex-1"
                  />
                  <span className="text-muted-foreground w-8">{separationQuality}%</span>
                </div>
              </div>
            </div>

            {/* Progress Section */}
            {isProcessing && (
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Upload Progress</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <Progress value={uploadProgress} />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Separation Progress</span>
                    <span>{separationProgress}%</span>
                  </div>
                  <Progress value={separationProgress} />
                </div>
              </div>
            )}

            {/* Results Section */}
            {separatedStems.length > 0 && (
              <Tabs defaultValue="stems" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="stems">Separated Stems</TabsTrigger>
                  <TabsTrigger value="analysis">Pattern Analysis</TabsTrigger>
                  <TabsTrigger value="export">Export & Use</TabsTrigger>
                </TabsList>

                <TabsContent value="stems" className="space-y-4">
                  {separatedStems.map((stem) => (
                    <Card key={stem.id} className="p-4">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`w-4 h-4 rounded ${stem.color}`} />
                            <div>
                              <h4 className="font-medium">{stem.name}</h4>
                              <p className="text-sm text-muted-foreground">
                                {stem.instrument} • {stem.confidence}% confidence
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={() => extractPatternsFromStem(stem)}>
                              <Zap className="w-4 h-4 mr-1" />
                              Extract
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => exportStem(stem)}>
                              <Download className="w-4 h-4 mr-1" />
                              Export
                            </Button>
                          </div>
                        </div>

                        {/* Waveform Visualization */}
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm">
                            <Radio className="w-4 h-4" />
                            <span>Waveform</span>
                          </div>
                          {renderWaveform(stem.waveformData, stem.color)}
                        </div>

                        {/* Controls */}
                        <div className="flex items-center gap-4">
                          <Button
                            size="sm"
                            variant={stem.isPlaying ? "default" : "outline"}
                            onClick={() => toggleStemPlayback(stem.id)}
                          >
                            {stem.isPlaying ? (
                              <>
                                <Radio className="w-4 h-4 mr-1 animate-pulse" />
                                Playing
                              </>
                            ) : (
                              <>
                                <Radio className="w-4 h-4 mr-1" />
                                Play
                              </>
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant={stem.isMuted ? "outline" : "secondary"}
                            onClick={() => toggleStemMute(stem.id)}
                          >
                            <Volume2 className="w-4 h-4 mr-1" />
                            {stem.isMuted ? 'Unmute' : 'Mute'}
                          </Button>
                          <div className="flex items-center gap-2 flex-1">
                            <span className="text-sm">Volume:</span>
                            <Slider
                              value={[stem.volume]}
                              onValueChange={([value]) => updateStemVolume(stem.id, value)}
                              max={100}
                              step={1}
                              className="flex-1"
                            />
                            <span className="text-sm text-muted-foreground w-8">{stem.volume}%</span>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </TabsContent>

                <TabsContent value="analysis" className="space-y-4">
                  {analysisResult && (
                    <div className="grid gap-4">
                      <Card className="p-4">
                        <h3 className="font-medium mb-3">Musical Analysis</h3>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">BPM:</span>
                            <span className="ml-2 font-medium">{analysisResult.bpm}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Key:</span>
                            <span className="ml-2 font-medium">{analysisResult.key}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Mood:</span>
                            <span className="ml-2 font-medium">{analysisResult.mood}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Genre:</span>
                            <span className="ml-2 font-medium">{analysisResult.genre}</span>
                          </div>
                        </div>
                        <Separator className="my-3" />
                        <div>
                          <span className="text-sm text-muted-foreground">Complexity:</span>
                          <div className="mt-1">
                            <Progress value={analysisResult.complexity} className="h-2" />
                          </div>
                        </div>
                      </Card>

                      <Card className="p-4">
                        <h3 className="font-medium mb-3">Extracted Patterns</h3>
                        <div className="space-y-3">
                          <div>
                            <h4 className="text-sm font-medium text-muted-foreground">Rhythm Patterns</h4>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {analysisResult.patterns.rhythm.map((pattern, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {pattern}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          <div>
                            <h4 className="text-sm font-medium text-muted-foreground">Harmony Patterns</h4>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {analysisResult.patterns.harmony.map((pattern, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {pattern}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          <div>
                            <h4 className="text-sm font-medium text-muted-foreground">Melody Patterns</h4>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {analysisResult.patterns.melody.map((pattern, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {pattern}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                      </Card>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="export" className="space-y-4">
                  <Card className="p-4">
                    <h3 className="font-medium mb-3">Export Options</h3>
                    <div className="grid gap-3">
                      <Button className="justify-start" onClick={exportAllStems}>
                        <Download className="w-4 h-4 mr-2" />
                        Export All Stems as WAV Files
                      </Button>
                      <Button variant="outline" className="justify-start" onClick={convertToMidi}>
                        <Music4 className="w-4 h-4 mr-2" />
                        Convert to MIDI Patterns
                      </Button>
                      <Button variant="outline" className="justify-start" onClick={importToDAW}>
                        <Eye className="w-4 h-4 mr-2" />
                        Import to DAW Tracks
                      </Button>
                    </div>
                  </Card>
                </TabsContent>
              </Tabs>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};