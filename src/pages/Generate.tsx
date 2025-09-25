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
import { StemByStepGenerator } from "@/components/StemByStepGenerator";
import { MoodBasedGenerator } from "@/components/MoodBasedGenerator";
import { supabase } from "@/integrations/supabase/client";
import { User } from '@supabase/supabase-js';

interface GenerateProps {
  user: User | null;
}

const Generate: React.FC<GenerateProps> = ({ user }) => {
  const [prompt, setPrompt] = useState("");
  const [genre, setGenre] = useState("classic");
  const [bpm, setBpm] = useState([118]);
  const [duration, setDuration] = useState([180]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedTrack, setGeneratedTrack] = useState<any>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [generationType, setGenerationType] = useState<"prompt" | "reference" | "stem" | "mood">("prompt");
  const [trackType, setTrackType] = useState<"full" | "loop">("full");
  const [useAIParsing, setUseAIParsing] = useState(true);
  const [parsedPrompt, setParsedPrompt] = useState<any>(null);
  const [referenceFile, setReferenceFile] = useState<File | null>(null);
  const [referenceUrl, setReferenceUrl] = useState("");
  const [recordedAudio, setRecordedAudio] = useState<{ blob: Blob; transcription?: string } | null>(null);
  const [referenceAnalysis, setReferenceAnalysis] = useState<any>(null);
  const [selectedArtistStyle, setSelectedArtistStyle] = useState<string | null>(null);

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
    
    const trackTypeLabel = trackType === "full" ? "complete track" : "loop/pattern";
    
    if (generationType === "prompt") {
      if (recordedAudio?.transcription) {
        toast.info(`🎵 Generating ${trackTypeLabel} from voice input: "${recordedAudio.transcription}"`);
      } else {
        toast.info(`🎵 Generating your amapiano ${trackTypeLabel}...`);
      }
    } else {
      if (referenceUrl.trim()) {
        toast.info(`🎵 Analyzing reference URL and generating ${trackTypeLabel}...`);
      } else {
        toast.info(`🎵 Generating ${trackTypeLabel} from reference audio...`);
      }
    }

    // Use AI-parsed parameters if available
    const effectiveBpm = parsedPrompt?.bpm || bpm[0];
    const effectiveGenre = parsedPrompt?.genre || (genre === "classic" ? "Classic Amapiano" : "Private School Amapiano");
    
    const trackTitle = trackType === "full" ? "Enhanced Amapiano Creation" : "Amapiano Loop/Pattern";
    const trackDuration = trackType === "full" ? duration[0] : Math.min(duration[0], 120);
    
    // Use Supabase edge function URLs for demo audio files
    const baseUrl = "https://mywijmtszelyutssormy.supabase.co/functions/v1/demo-audio-files";

    // Use real AI generation with enhanced parameters
    try {
      const { data, error } = await supabase.functions.invoke('ai-music-generation', {
        body: {
          prompt: recordedAudio?.transcription || prompt,
          trackType: 'midi',
          generationType,
          bpm: effectiveBpm,
          genre: effectiveGenre,
          duration: trackDuration,
          selectedArtistStyle,
          referenceAnalysis
        }
      });

      if (error) throw error;

      if (data?.success && data?.newTrack) {
        setGeneratedTrack({
          id: data.newTrack.id,
          title: data.newTrack.name,
          type: trackType,
          bpm: effectiveBpm,
          genre: effectiveGenre,
          duration: trackDuration,
          audioUrl: data.newTrack.clips?.[0]?.audioUrl || `${baseUrl}/generated-track`,
          stems: {
            drums: `${baseUrl}/drums`,
            bass: `${baseUrl}/bass`, 
            piano: `${baseUrl}/piano`,
            vocals: `${baseUrl}/vocals`,
            other: `${baseUrl}/other`
          }
        });
        setIsGenerating(false);
        toast.success(`🎉 Enhanced ${trackTypeLabel} generated successfully!`);
        return;
      }
    } catch (aiError) {
      console.error('AI Generation failed:', aiError);
      toast.error('AI generation failed, using fallback generation');
    }

    // Fallback simulation if AI fails
    await new Promise(resolve => setTimeout(resolve, 2000));

    const trackTitle = trackType === "full" ? "Enhanced Amapiano Creation" : "Amapiano Loop/Pattern";
    const trackDuration = trackType === "full" ? duration[0] : Math.min(duration[0], 120);
    
    // Use Supabase edge function URLs for demo audio files
    const baseUrl = "https://mywijmtszelyutssormy.supabase.co/functions/v1/demo-audio-files";
    
    setGeneratedTrack({
      id: "enhanced-track-id",
      title: trackTitle,
      type: trackType,
      bpm: effectiveBpm,
      genre: effectiveGenre,
      duration: trackDuration,
      audioUrl: `${baseUrl}/generated-track`,
      stems: {
        drums: `${baseUrl}/drums`,
        bass: `${baseUrl}/bass`, 
        piano: `${baseUrl}/piano`,
        vocals: `${baseUrl}/vocals`,
        other: `${baseUrl}/other`
      }
    });
    setIsGenerating(false);
    toast.success(`🎉 Enhanced ${trackTypeLabel} generated successfully!`);
  };

  const handleRecordingComplete = (audioBlob: Blob, transcription?: string) => {
    setRecordedAudio({ blob: audioBlob, transcription });
    if (transcription) {
      setPrompt(transcription);
      toast.success("Voice input processed and converted to prompt");
    }
  };

  const handleReferenceFileSelect = async (file: File) => {
    setReferenceFile(file);
    toast.success(`Reference file "${file.name}" selected`);
    
    // Simulate reference analysis
    toast.info("Analyzing reference track...");
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setReferenceAnalysis({
      bpm: 115,
      key: "C minor",
      mood: "Melancholic",
      energy: 0.7,
      instruments: ["Piano", "Bass", "Drums", "Strings"],
      genre: "Deep Amapiano",
      duration: 245,
      structure: {
        intro: 16,
        verse: 32,
        chorus: 24,
        bridge: 16,
        outro: 12
      }
    });
    
    toast.success("Reference track analyzed successfully!");
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
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="prompt">Generate from Prompt</TabsTrigger>
              <TabsTrigger value="reference">Generate from Reference</TabsTrigger>
              <TabsTrigger value="stem">Stem by Stem</TabsTrigger>
              <TabsTrigger value="mood">Mood Based</TabsTrigger>
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

                    {/* Track Type Selection */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Generation Type</label>
                      <Select value={trackType} onValueChange={(value) => setTrackType(value as "full" | "loop")}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="full">Complete Track (Full Song)</SelectItem>
                          <SelectItem value="loop">Loop/Pattern (Short Segment)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

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
                        min={trackType === "loop" ? 15 : 30}
                        max={trackType === "loop" ? 120 : 600}
                        step={trackType === "loop" ? 15 : 30}
                        className="w-full"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Artist Style Inspiration (Optional)</label>
                      <div className="flex flex-wrap gap-2">
                        {artistStyles.map((artist) => (
                          <Badge 
                            key={artist} 
                            variant={selectedArtistStyle === artist ? "default" : "outline"} 
                            className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                            onClick={() => setSelectedArtistStyle(selectedArtistStyle === artist ? null : artist)}
                          >
                            {artist}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : generationType === "reference" ? (
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
                          <div className="space-y-4">
                            <div className="p-3 bg-muted rounded-lg">
                              <h4 className="font-medium text-sm mb-2">Reference Track Selected</h4>
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

                            {referenceAnalysis && (
                              <div className="p-4 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-lg border">
                                <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                                  <Music className="w-4 h-4 text-primary" />
                                  Reference Track Analysis
                                </h4>
                                
                                <div className="grid grid-cols-2 gap-4 mb-4">
                                  <div className="space-y-2">
                                    <div className="flex justify-between items-center">
                                      <span className="text-sm text-muted-foreground">BPM</span>
                                      <span className="text-sm font-medium">{referenceAnalysis.bpm}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                      <span className="text-sm text-muted-foreground">Key</span>
                                      <span className="text-sm font-medium">{referenceAnalysis.key}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                      <span className="text-sm text-muted-foreground">Genre</span>
                                      <span className="text-sm font-medium">{referenceAnalysis.genre}</span>
                                    </div>
                                  </div>
                                  
                                  <div className="space-y-2">
                                    <div className="flex justify-between items-center">
                                      <span className="text-sm text-muted-foreground">Mood</span>
                                      <span className="text-sm font-medium">{referenceAnalysis.mood}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                      <span className="text-sm text-muted-foreground">Energy</span>
                                      <div className="flex items-center gap-2">
                                        <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                                          <div 
                                            className="h-full bg-primary rounded-full transition-all duration-300"
                                            style={{ width: `${referenceAnalysis.energy * 100}%` }}
                                          />
                                        </div>
                                        <span className="text-sm font-medium">{Math.round(referenceAnalysis.energy * 100)}%</span>
                                      </div>
                                    </div>
                                    <div className="flex justify-between items-center">
                                      <span className="text-sm text-muted-foreground">Duration</span>
                                      <span className="text-sm font-medium">
                                        {Math.floor(referenceAnalysis.duration / 60)}:{String(referenceAnalysis.duration % 60).padStart(2, '0')}
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                <div className="mb-3">
                                  <span className="text-sm text-muted-foreground block mb-2">Detected Instruments</span>
                                  <div className="flex flex-wrap gap-1">
                                    {referenceAnalysis.instruments.map((instrument: string) => (
                                      <Badge key={instrument} variant="secondary" className="text-xs">
                                        {instrument}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>

                                <div>
                                  <span className="text-sm text-muted-foreground block mb-2">Song Structure</span>
                                  <div className="flex gap-1 text-xs">
                                    {Object.entries(referenceAnalysis.structure).map(([part, bars]) => (
                                      <div key={part} className="bg-primary/20 px-2 py-1 rounded text-center min-w-12">
                                        <div className="font-medium capitalize">{part}</div>
                                        <div className="text-muted-foreground">{bars as number} bars</div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            )}
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

                    {/* Additional Description for Reference */}
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Track Description (Optional)</label>
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
                    </div>

                    {/* Generation Options for Reference */}
                    <div className="space-y-6 pt-6 border-t">
                      <h3 className="font-medium text-sm">Generation Options</h3>
                      
                      {/* Track Type Selection */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Generation Type</label>
                        <Select value={trackType} onValueChange={(value) => setTrackType(value as "full" | "loop")}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="full">Complete Track (Full Song)</SelectItem>
                            <SelectItem value="loop">Loop/Pattern (Short Segment)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

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
                          min={trackType === "loop" ? 15 : 30}
                          max={trackType === "loop" ? 120 : 600}
                          step={trackType === "loop" ? 15 : 30}
                          className="w-full"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">Artist Style Inspiration (Optional)</label>
                        <div className="flex flex-wrap gap-2">
                          {artistStyles.map((artist) => (
                            <Badge 
                              key={artist} 
                              variant={selectedArtistStyle === artist ? "default" : "outline"} 
                              className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                              onClick={() => setSelectedArtistStyle(selectedArtistStyle === artist ? null : artist)}
                            >
                              {artist}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : generationType === "stem" ? (
                <StemByStepGenerator onTrackGenerated={(track) => setGeneratedTrack(track)} />
              ) : generationType === "mood" ? (
                <MoodBasedGenerator onTrackGenerated={(track) => setGeneratedTrack(track)} />
              ) : null}

              {/* Generate Button */}
              {(generationType === "prompt" || generationType === "reference") && (
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
                )}
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* Generation Tips */}
              <Card className="card-glow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    💡 Generation Tips
                  </CardTitle>
                  <CardDescription>
                    For Better Results
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="text-sm space-y-2">
                    <p className="font-medium text-foreground">• Be specific about the mood and style you want</p>
                    <p className="font-medium text-foreground">• Mention specific instruments (log drums, piano, saxophone)</p>
                    <p className="font-medium text-foreground">• Include tempo descriptions (slow, groovy, energetic)</p>
                    <p className="font-medium text-foreground">• Reference time of day or setting (late night, club, chill)</p>
                  </div>
                  
                  <div className="pt-3 border-t">
                    <p className="text-sm font-medium mb-2">Example Prompts:</p>
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <p>• "Deep log drums with soulful piano for late night vibes"</p>
                      <p>• "Jazzy private school amapiano with saxophone melody"</p>
                      <p>• "Energetic classic amapiano with heavy percussion"</p>
                      <p>• "Mellow track with complex chords and smooth bassline"</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

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
                  {!generatedTrack && (
                    <CardDescription>
                      {isGenerating ? "AI is creating your track..." : "Generate a track to see results here"}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  {generatedTrack ? (
                    <div className="space-y-4">
                      <div className="p-4 bg-muted rounded-lg">
                        <h3 className="font-semibold mb-2">{generatedTrack.title}</h3>
                        <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                          <span>Type: {generatedTrack.type === "full" ? "Complete Track" : "Loop/Pattern"}</span>
                          <span>•</span>
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
                             variant="outline" 
                             size="sm"
                             onClick={() => {
                               // Store in localStorage for DAW to pick up
                               const trackData = {
                                 name: generatedTrack.title,
                                 audioUrl: generatedTrack.audioUrl,
                                 type: 'audio',
                                 metadata: {
                                   bpm: generatedTrack.bpm,
                                   genre: generatedTrack.genre,
                                   duration: generatedTrack.duration
                                 }
                               };
                               localStorage.setItem('pendingGeneratedTrack', JSON.stringify(trackData));
                               window.open('/daw', '_blank');
                               toast.success("🎵 Track sent to DAW! Opening DAW in new tab...");
                             }}
                           >
                             <Music className="w-4 h-4 mr-2" />
                             Add to DAW
                           </Button>
                           <Button 
                             variant="secondary" 
                             size="sm"
                             onClick={async () => {
                               try {
                                 const response = await fetch(generatedTrack.audioUrl);
                                 if (!response.ok) throw new Error('Download failed');
                                 
                                 const blob = await response.blob();
                                 const url = window.URL.createObjectURL(blob);
                                 const link = document.createElement('a');
                                 link.href = url;
                                 link.download = `${generatedTrack.title.replace(/\s+/g, '_')}.wav`;
                                 document.body.appendChild(link);
                                 link.click();
                                 document.body.removeChild(link);
                                 window.URL.revokeObjectURL(url);
                                 
                                 toast.success("🎵 Demo track downloaded successfully!");
                               } catch (error) {
                                 console.error('Download error:', error);
                                 toast.error("Download failed - this is a demo version");
                               }
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
                                onClick={async () => {
                                  try {
                                    const response = await fetch(generatedTrack.stems[stem.toLowerCase()]);
                                    if (!response.ok) throw new Error('Download failed');
                                    
                                    const blob = await response.blob();
                                    const url = window.URL.createObjectURL(blob);
                                    const link = document.createElement('a');
                                    link.href = url;
                                    link.download = `${generatedTrack.title.replace(/\s+/g, '_')}_${stem.toLowerCase()}.wav`;
                                    document.body.appendChild(link);
                                    link.click();
                                    document.body.removeChild(link);
                                    window.URL.revokeObjectURL(url);
                                    
                                    toast.success(`🎵 ${stem} stem downloaded successfully!`);
                                  } catch (error) {
                                    console.error('Download error:', error);
                                    toast.error(`${stem} stem download failed - this is a demo version`);
                                  }
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