import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Music, Play, Download, Wand2, Loader2, Mic, FileAudio, Link } from "lucide-react";
import { toast } from "sonner";
import { AIPromptParser } from "@/components/AIPromptParser";
import { MicrophoneInput } from "@/components/MicrophoneInput";
import { EnhancedFileUpload } from "@/components/EnhancedFileUpload";

const Generate = () => {
  const [prompt, setPrompt] = useState("");
  const [genre, setGenre] = useState("classic");
  const [bpm, setBpm] = useState([118]);
  const [duration, setDuration] = useState([180]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedTrack, setGeneratedTrack] = useState<any>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [generationType, setGenerationType] = useState<"prompt" | "reference">("prompt");
  const [useAIParsing, setUseAIParsing] = useState(true);
  const [parsedPrompt, setParsedPrompt] = useState<any>(null);
  const [referenceFile, setReferenceFile] = useState<File | null>(null);
  const [referenceUrl, setReferenceUrl] = useState("");
  const [recordedAudio, setRecordedAudio] = useState<{ blob: Blob; transcription?: string } | null>(null);

  const handleGenerate = async () => {
    if (!prompt.trim() && !referenceFile && !referenceUrl.trim() && !recordedAudio) {
      toast.error("Please provide a description, reference file/URL, or recorded audio");
      return;
    }

    // Validate URL if provided
    if (generationType === "reference" && referenceUrl.trim()) {
      try {
        new URL(referenceUrl);
      } catch {
        toast.error("Please enter a valid URL");
        return;
      }
    }

    setIsGenerating(true);
    
    if (generationType === "prompt") {
      if (recordedAudio?.transcription) {
        toast.info(`🎵 Generating track from voice input: "${recordedAudio.transcription}"`);
      } else {
        toast.info("🎵 Generating your amapiano track...");
      }
    } else {
      if (referenceUrl.trim()) {
        toast.info("🎵 Analyzing reference URL and generating track...");
      } else {
        toast.info("🎵 Generating track from reference audio...");
      }
    }

    // Use AI-parsed parameters if available
    const effectiveBpm = parsedPrompt?.bpm || bpm[0];
    const effectiveGenre = parsedPrompt?.genre || (genre === "classic" ? "Classic Amapiano" : "Private School Amapiano");
    
    // Simulate AI generation with enhanced parameters
    await new Promise(resolve => setTimeout(resolve, 4000));

    setGeneratedTrack({
      id: "enhanced-track-id",
      title: "Enhanced Amapiano Creation",
      bpm: effectiveBpm,
      genre: effectiveGenre,
      duration: duration[0],
      audioUrl: "/api/generated-track.mp3", // Mock URL
      stems: {
        drums: "/api/stems/drums.wav",
        bass: "/api/stems/bass.wav", 
        piano: "/api/stems/piano.wav",
        vocals: "/api/stems/vocals.wav",
        other: "/api/stems/other.wav"
      }
    });
    setIsGenerating(false);
    toast.success("🎉 Enhanced track generated successfully!");
  };

  const handleRecordingComplete = (audioBlob: Blob, transcription?: string) => {
    setRecordedAudio({ blob: audioBlob, transcription });
    if (transcription) {
      setPrompt(transcription);
      toast.success("Voice input processed and converted to prompt");
    }
  };

  const handleReferenceFileSelect = (file: File) => {
    setReferenceFile(file);
    toast.success(`Reference file "${file.name}" selected`);
  };

  const artistStyles = [
    "Kabza De Small",
    "Kelvin Momo", 
    "Babalwa M",
    "MFR Souls",
    "Mas MusiQ"
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gradient-primary mb-4">
              AI Music Generation & Transformation
            </h1>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              Generate authentic amapiano tracks with advanced AI. Use voice prompts, reference audio, or detailed descriptions to create professional-quality music with cultural authenticity.
            </p>
          </div>

          <Tabs value={generationType} onValueChange={(value) => setGenerationType(value as typeof generationType)} className="mb-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="prompt">Generate from Prompt</TabsTrigger>
              <TabsTrigger value="reference">Generate from Reference</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Left Column - Generation Controls */}
            <div className="lg:col-span-2 space-y-6">
              {generationType === "prompt" ? (
                <Card className="card-glow">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Wand2 className="w-5 h-5 text-primary" />
                      Prompt-Based Generation
                    </CardTitle>
                    <CardDescription>
                      Describe your amapiano track using text, voice, or reference audio
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <Tabs defaultValue="text" className="w-full">
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="text">Text Description</TabsTrigger>
                        <TabsTrigger value="voice">Voice Input</TabsTrigger>
                      </TabsList>
                      
                      <TabsContent value="text" className="space-y-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Track Description</label>
                          <Textarea
                            placeholder="Describe your amapiano track... e.g., 'A soulful private school amapiano track with jazzy piano chords, subtle log drums, and deep bass'"
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            className="min-h-[120px] resize-none"
                          />
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <label className="text-sm font-medium">AI Prompt Parsing</label>
                          <Switch
                            checked={useAIParsing}
                            onCheckedChange={setUseAIParsing}
                          />
                        </div>
                      </TabsContent>
                      
                      <TabsContent value="voice">
                        <MicrophoneInput 
                          onRecordingComplete={handleRecordingComplete}
                          className="border-0 shadow-none p-0"
                        />
                      </TabsContent>
                    </Tabs>

                    {/* Manual Controls */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Amapiano Style</label>
                        <Select value={genre} onValueChange={setGenre}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="classic">Classic Amapiano</SelectItem>
                            <SelectItem value="private-school">Private School Amapiano</SelectItem>
                            <SelectItem value="vocal">Vocal Amapiano</SelectItem>
                            <SelectItem value="deep">Deep Amapiano</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <label className="text-sm font-medium">BPM</label>
                          <span className="text-sm text-muted-foreground">{bpm[0]}</span>
                        </div>
                        <Slider
                          value={bpm}
                          onValueChange={setBpm}
                          min={80}
                          max={160}
                          step={1}
                          className="w-full"
                        />
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <label className="text-sm font-medium">Duration</label>
                        <span className="text-sm text-muted-foreground">{Math.floor(duration[0] / 60)}:{String(duration[0] % 60).padStart(2, '0')}</span>
                      </div>
                      <Slider
                        value={duration}
                        onValueChange={setDuration}
                        min={30}
                        max={600}
                        step={30}
                        className="w-full"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Artist Style Inspiration (Optional)</label>
                      <div className="flex flex-wrap gap-2">
                        {artistStyles.map((artist) => (
                          <Badge key={artist} variant="outline" className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors">
                            {artist}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card className="card-glow">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileAudio className="w-5 h-5 text-primary" />
                      Reference-Based Generation
                    </CardTitle>
                    <CardDescription>
                      Upload a reference audio file or provide a URL to guide the AI generation
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <Tabs defaultValue="file" className="w-full">
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="file">Upload File</TabsTrigger>
                        <TabsTrigger value="url">From URL</TabsTrigger>
                      </TabsList>
                      
                      <TabsContent value="file" className="space-y-4">
                        <EnhancedFileUpload 
                          onFileSelect={handleReferenceFileSelect}
                          className="border-0 shadow-none p-0"
                          maxSize={500}
                        />
                        {referenceFile && (
                          <div className="p-3 bg-muted rounded-lg">
                            <h4 className="font-medium text-sm mb-2">Reference Track Selected</h4>
                            <p className="text-sm text-muted-foreground mb-3">
                              AI will analyze this track and generate a new amapiano version inspired by its elements
                            </p>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <span className="text-muted-foreground">File:</span>
                                <span className="ml-2 font-medium">{referenceFile.name}</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Size:</span>
                                <span className="ml-2 font-medium">{(referenceFile.size / 1024 / 1024).toFixed(2)} MB</span>
                              </div>
                            </div>
                          </div>
                        )}
                      </TabsContent>
                      
                      <TabsContent value="url" className="space-y-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Reference URL</label>
                          <div className="flex gap-2">
                            <Input
                              placeholder="Paste YouTube, SoundCloud, or direct audio URL..."
                              value={referenceUrl}
                              onChange={(e) => setReferenceUrl(e.target.value)}
                              className="flex-1"
                            />
                            <Button 
                              variant="outline" 
                              size="icon"
                              onClick={() => {
                                if (referenceUrl.trim()) {
                                  try {
                                    new URL(referenceUrl);
                                    toast.success("Reference URL validated and ready");
                                  } catch {
                                    toast.error("Please enter a valid URL");
                                  }
                                } else {
                                  toast.error("Please enter a valid URL");
                                }
                              }}
                            >
                              <Link className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                        {referenceUrl.trim() && (
                          <div className="p-3 bg-muted rounded-lg">
                            <h4 className="font-medium text-sm mb-2">Reference URL Set</h4>
                            <p className="text-sm text-muted-foreground mb-3">
                              AI will download and analyze this track to create a new amapiano version
                            </p>
                            <div className="text-sm">
                              <span className="text-muted-foreground">URL:</span>
                              <span className="ml-2 font-medium break-all">{referenceUrl}</span>
                            </div>
                          </div>
                        )}
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>
              )}

              {/* Generate Button */}
              <Button 
                onClick={handleGenerate}
                disabled={isGenerating || (!prompt.trim() && !referenceFile && !referenceUrl.trim() && !recordedAudio)}
                className="w-full btn-glow"
                size="lg"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Music className="w-4 h-4 mr-2" />
                    Generate {generationType === "prompt" ? "from Prompt" : "from Reference"}
                  </>
                )}
              </Button>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* AI Prompt Analysis */}
              {generationType === "prompt" && useAIParsing && (
                <AIPromptParser
                  prompt={recordedAudio?.transcription || prompt}
                  onParsedChange={setParsedPrompt}
                />
              )}

              {/* Generated Track Results */}
              <Card className="card-glow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Music className="w-5 h-5 text-primary" />
                    Generated Track
                  </CardTitle>
                  <CardDescription>
                    Your AI-generated amapiano track will appear here
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {generatedTrack ? (
                    <div className="space-y-4">
                      <div className="p-4 bg-muted rounded-lg">
                        <h3 className="font-semibold mb-2">Enhanced Amapiano Creation</h3>
                        <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                          <span>Style: {generatedTrack.genre}</span>
                          <span>•</span>
                          <span>BPM: {generatedTrack.bpm}</span>
                          <span>•</span>
                          <span>Duration: {Math.floor(generatedTrack.duration / 60)}:{String(generatedTrack.duration % 60).padStart(2, '0')}</span>
                          {parsedPrompt?.key && (
                            <>
                              <span>•</span>
                              <span>Key: {parsedPrompt.key}</span>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="bg-gradient-primary p-6 rounded-lg text-center">
                        <div className="w-16 h-16 bg-primary-foreground/20 rounded-full flex items-center justify-center mx-auto mb-4">
                          <Play className="w-8 h-8 text-primary-foreground" />
                        </div>
                        <p className="text-primary-foreground/80 mb-4">Professional Audio Player</p>
                        <div className="flex gap-2 justify-center">
                          <Button 
                            variant="secondary" 
                            size="sm"
                            onClick={() => {
                              setIsPlaying(!isPlaying);
                              toast.success(isPlaying ? "⏸️ Paused" : "▶️ Playing");
                            }}
                          >
                            {isPlaying ? (
                              <>
                                <div className="w-4 h-4 mr-2 flex gap-1">
                                  <div className="w-1.5 h-4 bg-current"></div>
                                  <div className="w-1.5 h-4 bg-current"></div>
                                </div>
                                Pause
                              </>
                            ) : (
                              <>
                                <Play className="w-4 h-4 mr-2" />
                                Play
                              </>
                            )}
                          </Button>
                          <Button 
                            variant="secondary" 
                            size="sm"
                            onClick={() => {
                              const link = document.createElement('a');
                              link.href = generatedTrack.audioUrl;
                              link.download = `${generatedTrack.title}.mp3`;
                              link.click();
                              toast.success("🎵 Download started");
                            }}
                          >
                            <Download className="w-4 h-4 mr-2" />
                            Download
                          </Button>
                        </div>
                      </div>

                        <div className="space-y-2">
                          <h4 className="font-medium">Professional Stems</h4>
                          <div className="grid grid-cols-2 gap-2">
                            {["Drums", "Bass", "Piano", "Vocals", "Other"].map((stem) => (
                              <Button 
                                key={stem} 
                                variant="outline" 
                                size="sm" 
                                className="justify-start"
                                onClick={() => {
                                  const link = document.createElement('a');
                                  link.href = generatedTrack.stems[stem.toLowerCase()];
                                  link.download = `${generatedTrack.title}_${stem.toLowerCase()}.wav`;
                                  link.click();
                                  toast.success(`🎵 ${stem} stem download started`);
                                }}
                              >
                                <Download className="w-3 h-3 mr-2" />
                                {stem}
                              </Button>
                            ))}
                          </div>
                        </div>

                      {parsedPrompt?.instrumentation && (
                        <div className="space-y-2">
                          <h4 className="font-medium text-sm">AI-Detected Instrumentation</h4>
                          <div className="flex flex-wrap gap-1">
                            {parsedPrompt.instrumentation.map((instrument: string) => (
                              <Badge key={instrument} variant="secondary" className="text-xs">
                                {instrument}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                        <Music className="w-12 h-12 text-muted-foreground" />
                      </div>
                      <p className="text-muted-foreground">
                        {isGenerating ? "Generating your enhanced track..." : "Your generated track will appear here"}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Generate;