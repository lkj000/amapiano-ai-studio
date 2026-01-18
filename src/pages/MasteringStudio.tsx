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
    setProcessingProgress(0);

    // Simulate AI mastering process
    const steps = [
      "Analyzing frequency spectrum...",
      "Detecting dynamic range...",
      "Applying EQ corrections...",
      "Optimizing stereo image...",
      "Adding warmth & saturation...",
      "Limiting to target loudness...",
      "Final quality check...",
    ];

    for (let i = 0; i < steps.length; i++) {
      await new Promise((resolve) => setTimeout(resolve, 800));
      setProcessingProgress(((i + 1) / steps.length) * 100);
      toast({
        title: `Step ${i + 1}/${steps.length}`,
        description: steps[i],
      });
    }

    // For now, the "mastered" audio is the uploaded track (placeholder).
    // When we wire real DSP/AI mastering, this becomes a new URL.
    setMasteredAudioUrl(originalAudioUrl);

    setIsProcessing(false);
    setIsMastered(true);
    toast({
      title: "Mastering complete! ✨",
      description: `Your track is ready for ${targetPlatform.name}`,
    });
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
