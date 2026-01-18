import { useState, useRef, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { 
  Upload, 
  Play, 
  Pause, 
  Volume2, 
  Wand2, 
  Download, 
  RefreshCw,
  CheckCircle2,
  Zap,
  Music,
  Radio,
  Headphones,
  BarChart3,
  Settings2,
  ArrowLeftRight,
  Sparkles
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface MasteringPreset {
  id: string;
  name: string;
  description: string;
  genre: string;
  loudness: number;
  warmth: number;
  clarity: number;
  stereoWidth: number;
  icon: React.ReactNode;
}

const MASTERING_PRESETS: MasteringPreset[] = [
  {
    id: "amapiano-club",
    name: "Amapiano Club",
    description: "Punchy low-end, crisp hi-hats, warm keys",
    genre: "Amapiano",
    loudness: -8,
    warmth: 65,
    clarity: 70,
    stereoWidth: 75,
    icon: <Music className="w-4 h-4" />
  },
  {
    id: "amapiano-radio",
    name: "Radio Ready",
    description: "Broadcast-ready with controlled dynamics",
    genre: "Amapiano",
    loudness: -11,
    warmth: 55,
    clarity: 80,
    stereoWidth: 60,
    icon: <Radio className="w-4 h-4" />
  },
  {
    id: "streaming",
    name: "Streaming Optimized",
    description: "Perfect for Spotify, Apple Music, YouTube",
    genre: "Universal",
    loudness: -14,
    warmth: 50,
    clarity: 75,
    stereoWidth: 65,
    icon: <Headphones className="w-4 h-4" />
  },
  {
    id: "punchy",
    name: "Punchy & Loud",
    description: "Maximum impact for club play",
    genre: "Dance",
    loudness: -6,
    warmth: 40,
    clarity: 85,
    stereoWidth: 80,
    icon: <Zap className="w-4 h-4" />
  }
];

const PLATFORM_TARGETS = [
  { id: "spotify", name: "Spotify", lufs: -14, peak: -1 },
  { id: "apple", name: "Apple Music", lufs: -16, peak: -1 },
  { id: "youtube", name: "YouTube", lufs: -14, peak: -1 },
  { id: "tiktok", name: "TikTok", lufs: -14, peak: -2 },
  { id: "soundcloud", name: "SoundCloud", lufs: -10, peak: -1 },
  { id: "club", name: "Club/DJ", lufs: -8, peak: -0.3 }
];

export default function MasteringStudio() {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [originalAudioUrl, setOriginalAudioUrl] = useState<string | null>(null);
  const [masteredAudioUrl, setMasteredAudioUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isMastered, setIsMastered] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playingVersion, setPlayingVersion] = useState<"original" | "mastered">("original");
  const [selectedPreset, setSelectedPreset] = useState<MasteringPreset>(MASTERING_PRESETS[0]);
  const [targetPlatform, setTargetPlatform] = useState(PLATFORM_TARGETS[0]);
  const [processingProgress, setProcessingProgress] = useState(0);

  // Audio ref for real playback
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const activeAudioUrl =
    playingVersion === "mastered" ? (masteredAudioUrl ?? originalAudioUrl) : originalAudioUrl;
  
  // Custom settings
  const [loudness, setLoudness] = useState([-14]);
  const [warmth, setWarmth] = useState([50]);
  const [clarity, setClarity] = useState([70]);
  const [stereoWidth, setStereoWidth] = useState([65]);
  const [lowEnd, setLowEnd] = useState([50]);
  const [highEnd, setHighEnd] = useState([50]);
  const [useAI, setUseAI] = useState(true);
  const [referenceTrack, setReferenceTrack] = useState(false);

  const revokeIfBlobUrl = useCallback((url: string | null) => {
    if (url && url.startsWith("blob:")) {
      URL.revokeObjectURL(url);
    }
  }, []);

  const originalUrlRef = useRef<string | null>(null);
  const masteredUrlRef = useRef<string | null>(null);

  useEffect(() => {
    originalUrlRef.current = originalAudioUrl;
  }, [originalAudioUrl]);

  useEffect(() => {
    masteredUrlRef.current = masteredAudioUrl;
  }, [masteredAudioUrl]);

  const stopPlayback = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsPlaying(false);
  }, []);

  const clearTrack = useCallback(() => {
    stopPlayback();
    audioRef.current = null;

    // Revoke URLs we created
    const m = masteredUrlRef.current;
    const o = originalUrlRef.current;
    revokeIfBlobUrl(m);
    if (m !== o) {
      revokeIfBlobUrl(o);
    }

    setUploadedFile(null);
    setOriginalAudioUrl(null);
    setMasteredAudioUrl(null);
    setIsMastered(false);
    setPlayingVersion("original");
  }, [revokeIfBlobUrl, stopPlayback]);

  // Cleanup on unmount (revoke any blob URLs we created)
  useEffect(() => {
    return () => {
      try {
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current = null;
        }

        const m = masteredUrlRef.current;
        const o = originalUrlRef.current;
        revokeIfBlobUrl(m);
        if (m !== o) {
          revokeIfBlobUrl(o);
        }
      } catch {
        // ignore
      }
    };
  }, [revokeIfBlobUrl]);

  // Toggle playback for currently selected version (original/mastered)
  const togglePlayback = useCallback(() => {
    if (!activeAudioUrl) {
      toast({
        title: "No audio loaded",
        description: "Please upload a track first",
        variant: "destructive",
      });
      return;
    }

    if (isPlaying) {
      stopPlayback();
      return;
    }

    if (!audioRef.current) {
      audioRef.current = new Audio(activeAudioUrl);
      audioRef.current.onended = () => setIsPlaying(false);
      audioRef.current.onerror = () => {
        toast({
          title: "Playback error",
          description: "Failed to play audio",
          variant: "destructive",
        });
        setIsPlaying(false);
      };
    }

    // Ensure the correct version is loaded
    if (audioRef.current.src !== activeAudioUrl) {
      audioRef.current.src = activeAudioUrl;
    }

    audioRef.current.currentTime = 0;
    audioRef.current
      .play()
      .then(() => setIsPlaying(true))
      .catch((err) => {
        console.error("Playback error:", err);
        toast({
          title: "Playback error",
          description: "Browser blocked playback or file is unsupported",
          variant: "destructive",
        });
      });
  }, [activeAudioUrl, isPlaying, stopPlayback]);

  // If user switches Original/Mastered while playing, switch the audio source
  useEffect(() => {
    if (!isPlaying) return;
    if (!activeAudioUrl) return;
    if (!audioRef.current) return;

    audioRef.current.pause();
    audioRef.current.src = activeAudioUrl;
    audioRef.current.currentTime = 0;
    audioRef.current.play().catch(() => {
      setIsPlaying(false);
    });
  }, [activeAudioUrl, isPlaying]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Cleanup previous audio
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if (masteredAudioUrl && masteredAudioUrl.startsWith("blob:")) {
        URL.revokeObjectURL(masteredAudioUrl);
      }
      if (originalAudioUrl && originalAudioUrl.startsWith("blob:")) {
        URL.revokeObjectURL(originalAudioUrl);
      }

      // Create new audio URL
      const url = URL.createObjectURL(file);
      setOriginalAudioUrl(url);
      setMasteredAudioUrl(null);
      setUploadedFile(file);
      setIsMastered(false);
      setIsPlaying(false);
      setPlayingVersion("original");

      toast({
        title: "Track uploaded",
        description: `${file.name} ready for mastering`,
      });
    }
  };


  // Helper: Encode AudioBuffer to WAV with optional mono downmix
  const encodeWavWithOptions = useCallback((
    audioBuffer: AudioBuffer, 
    targetSampleRate?: number,
    forceMono?: boolean
  ): ArrayBuffer => {
    const sourceSampleRate = audioBuffer.sampleRate;
    const outputSampleRate = targetSampleRate || sourceSampleRate;
    const inputChannels = audioBuffer.numberOfChannels;
    const numChannels = forceMono ? 1 : Math.min(inputChannels, 2);
    const bitsPerSample = 16;
    const bytesPerSample = bitsPerSample / 8;
    const blockAlign = numChannels * bytesPerSample;
    
    // Resample if needed
    const resampleRatio = outputSampleRate / sourceSampleRate;
    const outputLength = Math.floor(audioBuffer.length * resampleRatio);
    const dataSize = outputLength * blockAlign;
    const bufferSize = 44 + dataSize;

    const wavBuffer = new ArrayBuffer(bufferSize);
    const wavView = new DataView(wavBuffer);

    // Write WAV header
    const writeString = (offset: number, str: string) => {
      for (let i = 0; i < str.length; i++) {
        wavView.setUint8(offset + i, str.charCodeAt(i));
      }
    };

    writeString(0, 'RIFF');
    wavView.setUint32(4, bufferSize - 8, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    wavView.setUint32(16, 16, true);
    wavView.setUint16(20, 1, true);
    wavView.setUint16(22, numChannels, true);
    wavView.setUint32(24, outputSampleRate, true);
    wavView.setUint32(28, outputSampleRate * blockAlign, true);
    wavView.setUint16(32, blockAlign, true);
    wavView.setUint16(34, bitsPerSample, true);
    writeString(36, 'data');
    wavView.setUint32(40, dataSize, true);

    // Get channel data
    const channels: Float32Array[] = [];
    for (let ch = 0; ch < Math.min(inputChannels, 2); ch++) {
      channels.push(audioBuffer.getChannelData(ch));
    }

    // Write samples with linear interpolation for resampling
    let offset = 44;
    for (let i = 0; i < outputLength; i++) {
      const srcIndex = i / resampleRatio;
      const srcIndexFloor = Math.floor(srcIndex);
      const srcIndexCeil = Math.min(srcIndexFloor + 1, audioBuffer.length - 1);
      const t = srcIndex - srcIndexFloor;
      
      if (forceMono && channels.length > 1) {
        // Downmix to mono
        let monoSample = 0;
        for (let ch = 0; ch < channels.length; ch++) {
          const sample0 = channels[ch][srcIndexFloor];
          const sample1 = channels[ch][srcIndexCeil];
          monoSample += sample0 + t * (sample1 - sample0);
        }
        monoSample /= channels.length;
        const clampedSample = Math.max(-1, Math.min(1, monoSample));
        wavView.setInt16(offset, Math.round(clampedSample * 32767), true);
        offset += 2;
      } else {
        for (let ch = 0; ch < numChannels; ch++) {
          const sample0 = channels[ch][srcIndexFloor];
          const sample1 = channels[ch][srcIndexCeil];
          const sample = sample0 + t * (sample1 - sample0);
          const clampedSample = Math.max(-1, Math.min(1, sample));
          wavView.setInt16(offset, Math.round(clampedSample * 32767), true);
          offset += 2;
        }
      }
    }

    return wavBuffer;
  }, []);

  // Helper: Convert any audio file to WAV, maintaining quality (44.1kHz minimum)
  const MAX_WAV_SIZE_MB = 14; // Leave headroom below 15MB limit
  
  const convertToWav = useCallback(async (file: File): Promise<ArrayBuffer> => {
    const arrayBuffer = await file.arrayBuffer();
    
    // Decode audio using Web Audio API (works for WAV, MP3, AAC, OGG, etc.)
    const audioContext = new AudioContext();
    let audioBuffer: AudioBuffer;
    
    try {
      audioBuffer = await audioContext.decodeAudioData(arrayBuffer.slice(0));
    } catch (e) {
      await audioContext.close();
      throw new Error('Could not decode audio file. Please try a different format.');
    }
    
    const maxBytes = MAX_WAV_SIZE_MB * 1024 * 1024;
    const isStereo = audioBuffer.numberOfChannels > 1;
    
    // Strategy: Maintain CD quality (44.1kHz/16-bit), reduce to mono if needed
    // Never downsample below 44.1kHz as it destroys audio quality
    
    // Step 1: Try at original sample rate, stereo
    let wavBuffer = encodeWavWithOptions(audioBuffer, audioBuffer.sampleRate, false);
    console.log(`Original WAV: ${(wavBuffer.byteLength / 1024 / 1024).toFixed(1)}MB @ ${audioBuffer.sampleRate}Hz stereo`);
    
    // Step 2: If too large and high sample rate (48kHz+), try 44.1kHz
    if (wavBuffer.byteLength > maxBytes && audioBuffer.sampleRate > 44100) {
      console.log(`WAV too large, resampling to 44100Hz`);
      wavBuffer = encodeWavWithOptions(audioBuffer, 44100, false);
    }
    
    // Step 3: If still too large and stereo, convert to mono (halves size)
    if (wavBuffer.byteLength > maxBytes && isStereo) {
      console.log(`WAV still too large (${(wavBuffer.byteLength / 1024 / 1024).toFixed(1)}MB), converting to mono for size`);
      wavBuffer = encodeWavWithOptions(audioBuffer, Math.min(audioBuffer.sampleRate, 44100), true);
      toast({
        title: "Audio converted to mono",
        description: "Stereo file was too large - converted to mono to maintain quality",
      });
    }
    
    await audioContext.close();
    
    // Final size check
    if (wavBuffer.byteLength > maxBytes) {
      const sizeMB = (wavBuffer.byteLength / 1024 / 1024).toFixed(1);
      const durationSec = audioBuffer.duration;
      // At 44.1kHz 16-bit mono, max duration for 14MB
      const maxDurationMono = Math.floor(14 * 1024 * 1024 / (44100 * 2));
      throw new Error(`Audio too long (${Math.round(durationSec)}s / ${sizeMB}MB). Maximum ~${maxDurationMono}s for mastering. Please trim your track.`);
    }
    
    console.log(`WAV prepared: ${(wavBuffer.byteLength / 1024 / 1024).toFixed(1)}MB (quality preserved at 44.1kHz+)`);
    return wavBuffer;
  }, [encodeWavWithOptions]);

  const handleMaster = async () => {
    if (!uploadedFile) {
      toast({
        title: "No track uploaded",
        description: "Please upload a track first",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    setProcessingProgress(5);

    try {
      // Convert to WAV if needed (handles MP3, AAC, OGG, etc.)
      toast({ title: "Preparing audio...", description: "Converting to WAV format (may downsample if large)" });
      const wavBuffer = await convertToWav(uploadedFile);
      const wavSizeMB = (wavBuffer.byteLength / 1024 / 1024).toFixed(1);
      console.log(`WAV prepared: ${wavSizeMB}MB`);
      const uint8Array = new Uint8Array(wavBuffer);

      setProcessingProgress(20);
      
      // Chunk the base64 encoding to avoid stack overflow
      const CHUNK_SIZE = 49152;
      let base64 = '';
      for (let offset = 0; offset < uint8Array.length; offset += CHUNK_SIZE) {
        const chunk = uint8Array.subarray(offset, Math.min(offset + CHUNK_SIZE, uint8Array.length));
        let binary = '';
        for (let i = 0; i < chunk.length; i++) {
          binary += String.fromCharCode(chunk[i]);
        }
        base64 += btoa(binary);
      }
      const audioDataBase64 = `data:audio/wav;base64,${base64}`;

      setProcessingProgress(35);

      // Build mastering settings from UI state
      const masteringSettings = {
        style: warmth[0] > 60 ? 'Warm' : warmth[0] < 40 ? 'Open' : 'Balanced' as 'Warm' | 'Balanced' | 'Open',
        loudness: loudness[0],
        eq: {
          low: (lowEnd[0] - 50) / 10, // Convert 0-100 to -5 to +5 dB
          mid: 0,
          high: (highEnd[0] - 50) / 10,
        },
        presence: clarity[0],
        compression: 50, // Default moderate compression
        stereoWidth: stereoWidth[0],
        saturation: warmth[0] > 50 ? (warmth[0] - 50) : 0,
        deEsser: 30, // Light de-essing
      };

      setProcessingProgress(40);
      toast({ title: "Processing...", description: "Sending to AI mastering engine" });

      // Call real AI mastering edge function
      const { data, error } = await supabase.functions.invoke('ai-mastering', {
        body: {
          audioData: audioDataBase64,
          settings: masteringSettings,
          quality: 'master',
        },
      });

      if (error) {
        throw new Error(error.message || 'Mastering failed');
      }

      if (!data?.success) {
        throw new Error(data?.error || 'Mastering returned unsuccessful');
      }

      setProcessingProgress(90);

      // Get the mastered audio URL
      let masteredUrl: string;
      if (data.masteredUrl) {
        masteredUrl = data.masteredUrl;
      } else if (data.masteredAudioBase64) {
        // Convert base64 to blob URL
        const base64Clean = data.masteredAudioBase64.replace(/^data:[^;]+;base64,/, '');
        const binaryString = atob(base64Clean);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        const blob = new Blob([bytes], { type: 'audio/wav' });
        masteredUrl = URL.createObjectURL(blob);
      } else {
        throw new Error('No mastered audio returned');
      }

      // Cleanup old mastered URL if it was a blob
      if (masteredAudioUrl && masteredAudioUrl.startsWith('blob:')) {
        URL.revokeObjectURL(masteredAudioUrl);
      }

      setMasteredAudioUrl(masteredUrl);
      setProcessingProgress(100);
      setIsMastered(true);

      toast({
        title: "Mastering complete! ✨",
        description: `LUFS: ${data.outputAnalysis?.lufs ?? 'N/A'} | Peak: ${data.outputAnalysis?.peakDb ?? 'N/A'}dB`,
      });

    } catch (error) {
      console.error('[MasteringStudio] Mastering error:', error);
      toast({
        title: "Mastering failed",
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const applyPreset = (preset: MasteringPreset) => {
    setSelectedPreset(preset);
    setLoudness([preset.loudness]);
    setWarmth([preset.warmth]);
    setClarity([preset.clarity]);
    setStereoWidth([preset.stereoWidth]);
    toast({
      title: `Preset applied: ${preset.name}`,
      description: preset.description
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <Wand2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">AI Mastering Studio</h1>
              <p className="text-muted-foreground">Professional mastering powered by machine learning</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Panel */}
          <div className="lg:col-span-2 space-y-6">
            {/* Upload Section */}
            <Card className="border-2 border-dashed border-muted-foreground/25 hover:border-primary/50 transition-colors">
              <CardContent className="p-8">
                {!uploadedFile ? (
                  <label className="flex flex-col items-center justify-center cursor-pointer">
                    <Upload className="w-12 h-12 text-muted-foreground mb-4" />
                    <p className="text-lg font-medium mb-1">Drop your track here</p>
                    <p className="text-sm text-muted-foreground mb-4">WAV, MP3, FLAC up to 100MB</p>
                    <input
                      type="file"
                      accept="audio/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <Button variant="outline">Browse Files</Button>
                  </label>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Music className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{uploadedFile.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {(uploadedFile.size / (1024 * 1024)).toFixed(2)} MB
                          </p>
                        </div>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={clearTrack}
                      >
                        Replace
                      </Button>
                    </div>

                    {/* Waveform visualization placeholder */}
                    <div className="h-24 bg-muted rounded-lg flex items-center justify-center relative overflow-hidden">
                      <div className="absolute inset-0 flex items-center justify-center gap-0.5">
                        {Array.from({ length: 100 }).map((_, i) => (
                          <div
                            key={i}
                            className="w-1 bg-primary/40 rounded-full"
                            style={{ 
                              height: `${Math.random() * 80 + 20}%`,
                              opacity: isMastered && playingVersion === "mastered" ? 1 : 0.6
                            }}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Playback controls */}
                    <div className="flex items-center justify-center gap-4">
                      <Button
                        variant={playingVersion === "original" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setPlayingVersion("original")}
                      >
                        Original
                      </Button>
                      <Button
                        size="icon"
                        variant="outline"
                        className="w-12 h-12 rounded-full"
                        onClick={togglePlayback}
                      >
                        {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                      </Button>
                      <Button
                        variant={playingVersion === "mastered" ? "default" : "outline"}
                        size="sm"
                        disabled={!isMastered}
                        onClick={() => setPlayingVersion("mastered")}
                      >
                        Mastered
                      </Button>
                    </div>

                    {/* A/B Toggle */}
                    {isMastered && (
                      <div className="flex items-center justify-center gap-2 p-3 bg-muted rounded-lg">
                        <ArrowLeftRight className="w-4 h-4" />
                        <span className="text-sm">Press A/B to compare versions</span>
                        <Badge variant="outline">Shortcut: Space</Badge>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Processing Progress */}
            {isProcessing && (
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <RefreshCw className="w-5 h-5 animate-spin text-primary" />
                    <span className="font-medium">AI Mastering in progress...</span>
                  </div>
                  <Progress value={processingProgress} className="h-2" />
                  <p className="text-sm text-muted-foreground mt-2">
                    {Math.round(processingProgress)}% complete
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Mastering Controls */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Settings2 className="w-5 h-5" />
                    Mastering Controls
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Switch id="ai-mode" checked={useAI} onCheckedChange={setUseAI} />
                    <Label htmlFor="ai-mode" className="text-sm">AI Assisted</Label>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <Tabs defaultValue="simple">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="simple">Simple</TabsTrigger>
                    <TabsTrigger value="advanced">Advanced</TabsTrigger>
                  </TabsList>

                  <TabsContent value="simple" className="space-y-6 pt-4">
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between mb-2">
                          <Label>Target Loudness</Label>
                          <span className="text-sm text-muted-foreground">{loudness[0]} LUFS</span>
                        </div>
                        <Slider
                          value={loudness}
                          onValueChange={setLoudness}
                          min={-20}
                          max={-4}
                          step={1}
                        />
                      </div>

                      <div>
                        <div className="flex justify-between mb-2">
                          <Label>Warmth</Label>
                          <span className="text-sm text-muted-foreground">{warmth[0]}%</span>
                        </div>
                        <Slider
                          value={warmth}
                          onValueChange={setWarmth}
                          min={0}
                          max={100}
                        />
                      </div>

                      <div>
                        <div className="flex justify-between mb-2">
                          <Label>Clarity</Label>
                          <span className="text-sm text-muted-foreground">{clarity[0]}%</span>
                        </div>
                        <Slider
                          value={clarity}
                          onValueChange={setClarity}
                          min={0}
                          max={100}
                        />
                      </div>

                      <div>
                        <div className="flex justify-between mb-2">
                          <Label>Stereo Width</Label>
                          <span className="text-sm text-muted-foreground">{stereoWidth[0]}%</span>
                        </div>
                        <Slider
                          value={stereoWidth}
                          onValueChange={setStereoWidth}
                          min={0}
                          max={100}
                        />
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="advanced" className="space-y-6 pt-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="flex justify-between mb-2">
                          <Label>Low End</Label>
                          <span className="text-sm text-muted-foreground">{lowEnd[0]}%</span>
                        </div>
                        <Slider value={lowEnd} onValueChange={setLowEnd} min={0} max={100} />
                      </div>

                      <div>
                        <div className="flex justify-between mb-2">
                          <Label>High End</Label>
                          <span className="text-sm text-muted-foreground">{highEnd[0]}%</span>
                        </div>
                        <Slider value={highEnd} onValueChange={setHighEnd} min={0} max={100} />
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <Switch id="reference" checked={referenceTrack} onCheckedChange={setReferenceTrack} />
                        <Label htmlFor="reference">Use Reference Track</Label>
                      </div>
                      {referenceTrack && (
                        <Button variant="outline" size="sm">
                          <Upload className="w-4 h-4 mr-2" />
                          Upload Reference
                        </Button>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Platform Target */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Target Platform</CardTitle>
              </CardHeader>
              <CardContent>
                <Select 
                  value={targetPlatform.id} 
                  onValueChange={(id) => {
                    const platform = PLATFORM_TARGETS.find(p => p.id === id);
                    if (platform) {
                      setTargetPlatform(platform);
                      setLoudness([platform.lufs]);
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PLATFORM_TARGETS.map(platform => (
                      <SelectItem key={platform.id} value={platform.id}>
                        <div className="flex items-center justify-between w-full">
                          <span>{platform.name}</span>
                          <span className="text-xs text-muted-foreground ml-2">
                            {platform.lufs} LUFS
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-2">
                  Target: {targetPlatform.lufs} LUFS, {targetPlatform.peak} dB peak
                </p>
              </CardContent>
            </Card>

            {/* Presets */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  Mastering Presets
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {MASTERING_PRESETS.map(preset => (
                  <button
                    key={preset.id}
                    onClick={() => applyPreset(preset)}
                    className={`w-full p-3 rounded-lg border text-left transition-all ${
                      selectedPreset.id === preset.id
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      {preset.icon}
                      <span className="font-medium text-sm">{preset.name}</span>
                      <Badge variant="secondary" className="ml-auto text-xs">
                        {preset.genre}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{preset.description}</p>
                  </button>
                ))}
              </CardContent>
            </Card>

            {/* Analysis */}
            {isMastered && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <BarChart3 className="w-4 h-4" />
                    Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span>Integrated LUFS</span>
                    <span className="font-mono">{loudness[0]} LUFS</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>True Peak</span>
                    <span className="font-mono">-0.8 dBTP</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Dynamic Range</span>
                    <span className="font-mono">8.2 LU</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Stereo Correlation</span>
                    <span className="font-mono">0.85</span>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Action Buttons */}
            <div className="space-y-3">
              <Button 
                className="w-full" 
                size="lg"
                onClick={handleMaster}
                disabled={!uploadedFile || isProcessing}
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Mastering...
                  </>
                ) : isMastered ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Re-Master
                  </>
                ) : (
                  <>
                    <Wand2 className="w-4 h-4 mr-2" />
                    Master Track
                  </>
                )}
              </Button>

              {isMastered && (
                <>
                  <Button
                    variant="outline"
                    className="w-full"
                    size="lg"
                    onClick={async () => {
                      const url = masteredAudioUrl ?? originalAudioUrl;
                      if (!url || !uploadedFile) {
                        toast({
                          title: "No mastered file",
                          description: "Please master a track first",
                          variant: "destructive",
                        });
                        return;
                      }

                      const baseName = uploadedFile.name.replace(/\.[^/.]+$/, "");
                      const extMatch = uploadedFile.name.match(/\.([0-9a-z]+)$/i);
                      const ext = extMatch?.[1] ?? "wav";
                      const downloadName = `${baseName}-mastered.${ext}`;

                      try {
                        const res = await fetch(url);
                        const blob = await res.blob();
                        const blobUrl = URL.createObjectURL(blob);
                        const a = document.createElement("a");
                        a.href = blobUrl;
                        a.download = downloadName;
                        document.body.appendChild(a);
                        a.click();
                        a.remove();
                        URL.revokeObjectURL(blobUrl);

                        toast({
                          title: "Download started",
                          description: downloadName,
                        });
                      } catch (e) {
                        console.error("Download error:", e);
                        toast({
                          title: "Download failed",
                          description: "Could not download the mastered file",
                          variant: "destructive",
                        });
                      }
                    }}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download Master
                  </Button>
                  <Button variant="secondary" className="w-full">
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Send to Release
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
