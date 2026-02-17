import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Music, Download, Wand2, Loader2, Mic, FileAudio, Link, Cpu, Upload, Zap, Sparkles, Globe, Scissors, MicVocal } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import SunoStyleWorkflow from "@/components/ai/SunoStyleWorkflow";
import { AIPromptParser } from "@/components/AIPromptParser";
import { MicrophoneInput } from "@/components/MicrophoneInput";
import { EnhancedFileUpload } from "@/components/EnhancedFileUpload";
import { StemByStepGenerator } from "@/components/StemByStepGenerator";
import { MoodBasedGenerator } from "@/components/MoodBasedGenerator";
import VoiceToMIDI from "@/components/VoiceToMIDI";
import { HighSpeedDAWEngine } from "@/components/HighSpeedDAWEngine";
import { supabase } from "@/integrations/supabase/client";
import { User } from '@supabase/supabase-js';
import { useWasmAcceleratedGeneration } from "@/hooks/useWasmAcceleratedGeneration";
import { ModalGPUGenerator } from "@/components/generate/ModalGPUGenerator";
import { AMAPIANO_VOICE_CATEGORIES } from "@/constants/amapianoVoices";
import { SA_LANGUAGES } from "@/constants/languages";
import { GENRE_DEFAULTS, getGenreDefaults } from "@/constants/genreDefaults";
import { analyzeReferenceBuffer, type ReferenceConstraints } from "@/lib/audio/ReferenceToGenerate";
import { GeneratedTrackAnalysis } from "@/components/generate/GeneratedTrackAnalysis";

interface GenerateProps {
  user: User | null;
}

const Generate: React.FC<GenerateProps> = ({ user }) => {
  const navigate = useNavigate();
  const { isReady: wasmReady, averageMetrics, engineType } = useWasmAcceleratedGeneration();
  const [prompt, setPrompt] = useState("");
  const [genre, setGenre] = useState("classic");
  const [bpm, setBpm] = useState([118]);
  const [duration, setDuration] = useState([180]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedTrack, setGeneratedTrack] = useState<any>(null);
  const [generationType, setGenerationType] = useState<"prompt" | "reference" | "stem" | "mood" | "voice-midi" | "suno-style" | "modal-gpu">("prompt");
  const [trackType, setTrackType] = useState<"full" | "loop">("full");
  const [useAIParsing, setUseAIParsing] = useState(true);
  const [parsedPrompt, setParsedPrompt] = useState<any>(null);
  const [referenceFile, setReferenceFile] = useState<File | null>(null);
  const [referenceUrl, setReferenceUrl] = useState("");
  const [recordedAudio, setRecordedAudio] = useState<{ blob: Blob; transcription?: string } | null>(null);
  const [referenceAnalysis, setReferenceAnalysis] = useState<any>(null);
  const [referenceAudioUrl, setReferenceAudioUrl] = useState<string | null>(null);
  const [selectedArtistStyle, setSelectedArtistStyle] = useState<string | null>(null);
  const [lyrics, setLyrics] = useState("");
  const [musicalKey, setMusicalKey] = useState("Am");
  const [selectedVoiceStyles, setSelectedVoiceStyles] = useState<string[]>([]);
  const [lyricsLanguage, setLyricsLanguage] = useState("zulu");
  const [isGeneratingLyrics, setIsGeneratingLyrics] = useState(false);
  const [culturalSwing, setCulturalSwing] = useState([55]);
  const [gaspTiming, setGaspTiming] = useState("beat1");
  const [logDrumIntensity, setLogDrumIntensity] = useState([50]);
  const [generationDetails, setGenerationDetails] = useState<{ prompt: string; lyrics?: string; source: string } | null>(null);

  // Genre-aware defaults
  const currentGenreDefaults = getGenreDefaults(genre);

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
      // Generate prompt based on context if not provided
      let effectivePrompt = recordedAudio?.transcription || prompt;
      
      if (!effectivePrompt.trim()) {
        if (generationType === "reference" && referenceAnalysis) {
          effectivePrompt = `Generate a ${effectiveGenre} track at ${effectiveBpm} BPM inspired by: ${referenceAnalysis.mood} mood, ${referenceAnalysis.key} key, ${referenceAnalysis.energy} energy level`;
        } else if (selectedArtistStyle) {
          effectivePrompt = `Generate a ${effectiveGenre} track at ${effectiveBpm} BPM in the style of ${selectedArtistStyle}`;
        } else {
          effectivePrompt = `Generate a ${effectiveGenre} track at ${effectiveBpm} BPM with authentic amapiano elements`;
        }
      }
      
      const { data, error } = await supabase.functions.invoke('ai-music-generation', {
        body: {
          prompt: effectivePrompt,
          lyrics: lyrics.trim() || undefined,
          trackType: 'audio',
          generationType,
          bpm: effectiveBpm,
          genre: effectiveGenre,
          duration: trackDuration,
          selectedArtistStyle,
          referenceAnalysis
        }
      });

      if (error) throw error;

      if (data?.success) {
        // Convert base64 audio to blob URL for playback
        let audioUrl = data.newTrack?.clips?.[0]?.audioUrl || '';
        if (data.audioBase64) {
          const audioFormat = data.audioFormat || 'audio/mpeg';
          const byteString = atob(data.audioBase64);
          const ab = new ArrayBuffer(byteString.length);
          const ia = new Uint8Array(ab);
          for (let i = 0; i < byteString.length; i++) {
            ia[i] = byteString.charCodeAt(i);
          }
          const blob = new Blob([ab], { type: audioFormat });
          audioUrl = URL.createObjectURL(blob);
        }

        setGeneratedTrack({
          id: data.newTrack?.id || `track_${Date.now()}`,
          title: data.newTrack?.name || trackTitle,
          type: trackType,
          bpm: effectiveBpm,
          genre: effectiveGenre,
          duration: data.metadata?.duration || trackDuration,
          audioUrl,
          stems: {}
        });
        setGenerationDetails({
          prompt: data.metadata?.prompt || effectivePrompt,
          lyrics: lyrics.trim() || undefined,
          source: data.metadata?.source || 'ai'
        });
        setIsGenerating(false);
        toast.success(`🎉 ${trackTypeLabel} generated successfully (${data.metadata?.duration || trackDuration}s)!`);
        return;
      }
    } catch (aiError: any) {
      console.error('AI Generation failed:', aiError);
      
      // Check for specific error types
      if (aiError?.message?.includes('429') || aiError?.message?.toLowerCase().includes('rate limit')) {
        toast.error('⏱️ Rate limit reached. Please wait a moment before trying again.');
      } else if (aiError?.message?.includes('402') || aiError?.message?.toLowerCase().includes('payment required')) {
        toast.error('💳 AI credits exhausted. Please add credits to continue generating.');
      } else {
        toast.error('AI generation unavailable, using demo generation');
      }
    }

    // Fallback simulation if AI fails
    await new Promise(resolve => setTimeout(resolve, 2000));
    
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
    // Create object URL for playback
    if (referenceAudioUrl) URL.revokeObjectURL(referenceAudioUrl);
    setReferenceAudioUrl(URL.createObjectURL(file));
    toast.success(`Reference file "${file.name}" selected`);
    
    // Real analysis using SharedAnalysisPipeline (same as DJ Mix)
    toast.info("Analyzing reference track with SharedAnalysisPipeline...");
    try {
      const audioContext = new AudioContext({ sampleRate: 22050 });
      const arrayBuffer = await file.arrayBuffer();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      
      const constraints = await analyzeReferenceBuffer(audioBuffer);
      await audioContext.close();
      
      setReferenceAnalysis({
        bpm: constraints.bpm,
        key: constraints.key,
        camelot: constraints.camelot,
        mood: constraints.avgEnergy > 0.6 ? "Energetic" : constraints.avgEnergy > 0.35 ? "Groovy" : "Mellow",
        energy: constraints.avgEnergy,
        instruments: constraints.genre.indicators || [],
        genre: constraints.genre.subgenre?.replace(/_/g, ' ') || (constraints.isAmapiano ? "Amapiano" : "Other"),
        isAmapiano: constraints.isAmapiano,
        duration: Math.round(audioBuffer.duration),
        lufs: constraints.targetLufs,
        vocalPresence: constraints.vocalPresence,
        structure: constraints.structure,
        suggestedPrompt: constraints.suggestedPrompt,
        bpmConfidence: constraints.bpmConfidence,
      });

      // Sync BPM slider to match analysis
      setBpm([Math.round(constraints.bpm)]);

      // Match detected genre to closest Amapiano style dropdown value
      // Valid dropdown values: classic, private-school, vocal, deep
      const detectedSubgenre = constraints.genre.subgenre?.toLowerCase() || '';
      const subgenreToDropdown: Record<string, string> = {
        'private_school': 'private-school',
        'deep': 'deep',
        'deep_amapiano': 'deep',
        'vocal': 'vocal',
        'vocal_amapiano': 'vocal',
        'bacardi': 'classic',
        '3_step': 'classic',
        'classic': 'classic',
      };
      const mappedStyle = subgenreToDropdown[detectedSubgenre];
      if (mappedStyle) {
        setGenre(mappedStyle);
      } else if (constraints.isAmapiano) {
        // Pick best dropdown match by BPM proximity
        const dropdownGenres: Record<string, [number, number]> = {
          'classic': [110, 120],
          'private-school': [112, 122],
          'vocal': [108, 118],
          'deep': [106, 116],
        };
        const detectedBpm = constraints.bpm;
        const best = Object.entries(dropdownGenres)
          .sort(([, a], [, b]) => {
            const midA = (a[0] + a[1]) / 2;
            const midB = (b[0] + b[1]) / 2;
            return Math.abs(midA - detectedBpm) - Math.abs(midB - detectedBpm);
          })[0];
        if (best) setGenre(best[0]);
      } else {
        setGenre('classic');
      }
      
      toast.success("Reference track analyzed successfully!");
    } catch (err) {
      console.error('Reference analysis failed:', err);
      toast.error("Analysis failed — check audio format");
    }
  };

  const handleGenerateLyrics = async () => {
    setIsGeneratingLyrics(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-lyrics', {
        body: {
          theme: prompt.trim() || `${genre === "classic" ? "Classic Amapiano" : genre} track with ${referenceAnalysis?.mood || 'energetic'} vibes`,
          genre: genre === "classic" ? "Classic Amapiano" : genre,
          language: lyricsLanguage,
          mood: referenceAnalysis?.mood || 'energetic',
          style: selectedVoiceStyles.length > 0 ? selectedVoiceStyles.join(', ') : undefined,
          isDuet: selectedVoiceStyles.length > 1,
        }
      });
      if (error) throw error;
      console.log('[LYRICS] Raw response data:', JSON.stringify(data));
      // Edge function returns { versionA: { title, lyrics }, versionB: { title, lyrics } }
      // supabase.functions.invoke may return string or object
      const parsed = typeof data === 'string' ? JSON.parse(data) : data;
      const generatedLyrics = parsed?.versionA?.lyrics || parsed?.lyrics || parsed?.response || parsed?.generatedLyrics || '';
      const versionBLyrics = parsed?.versionB?.lyrics || '';
      const combinedLyrics = versionBLyrics 
        ? `--- Version A: ${parsed?.versionA?.title || 'Version A'} ---\n${generatedLyrics}\n\n--- Version B: ${parsed?.versionB?.title || 'Version B'} ---\n${versionBLyrics}`
        : generatedLyrics;
      setLyrics(combinedLyrics);
      toast.success("🎤 Lyrics generated (2 versions)!");
    } catch (err) {
      console.error('Lyrics generation error:', err);
      // Fallback demo lyrics
      setLyrics(`[Verse 1]\nNgiyak'thanda wena\nUmuhle ngempela\nSihlala ndawonye\n\n[Chorus]\nShaya iLog drum\nSibheke phambili\nThanda mna namhlanje\n\n[Bridge]\nHee... hee...\nYho... yho...`);
      toast.success("🎤 Demo lyrics generated!");
    } finally {
      setIsGeneratingLyrics(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          {/* Title Section */}
          <div className="text-center space-y-3 sm:space-y-4 mb-6">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight px-2">AI Music Generation</h1>
            <p className="text-muted-foreground text-sm sm:text-base md:text-lg max-w-2xl mx-auto px-2">
              Create professional amapiano tracks using advanced AI technology
            </p>
            {wasmReady && (
              <div className="flex items-center justify-center gap-2">
                <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20 text-xs sm:text-sm">
                  <Cpu className="w-3 h-3 mr-1" />
                  {engineType} - {averageMetrics.avgSpeedup > 0 ? `${averageMetrics.avgSpeedup.toFixed(1)}x faster` : 'Ready'}
                </Badge>
              </div>
            )}
          </div>

          {/* High-Speed C++ WASM Engine Status */}
          <div className="mb-6">
            <HighSpeedDAWEngine 
              showMetrics={true}
              onInitialized={() => console.log('✓ High-speed engine ready for generation')}
            />
          </div>

          <Tabs value={generationType} onValueChange={(value) => {
            const newType = value as typeof generationType;
            // Clear prompt when switching to reference mode to avoid confusion
            // (reference generation uses analysis data, not the prompt)
            if (newType === 'reference' && generationType !== 'reference') {
              setPrompt('');
            }
            setGenerationType(newType);
          }} className="mb-4 sm:mb-6">
            <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 h-auto gap-1">
              <TabsTrigger value="prompt" className="text-xs sm:text-sm py-2">Prompt</TabsTrigger>
              <TabsTrigger value="reference" className="text-xs sm:text-sm py-2">Reference</TabsTrigger>
              <TabsTrigger value="stem" className="text-xs sm:text-sm py-2">Stem by Stem</TabsTrigger>
              <TabsTrigger value="mood" className="text-xs sm:text-sm py-2">Mood Based</TabsTrigger>
              <TabsTrigger value="voice-midi" className="text-xs sm:text-sm py-2">Voice-to-MIDI</TabsTrigger>
              <TabsTrigger value="suno-style" className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 text-xs sm:text-sm py-2">
                <Music className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                Suno-Style
              </TabsTrigger>
              <TabsTrigger value="modal-gpu" className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 text-xs sm:text-sm py-2">
                <Zap className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                Modal GPU
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="grid lg:grid-cols-3 gap-4 sm:gap-6">
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
                        <Select value={genre} onValueChange={(val) => {
                          setGenre(val);
                          const defaults = GENRE_DEFAULTS[val];
                          if (defaults) setBpm([defaults.suggestedBpm]);
                        }}>
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
                        <p className="text-xs text-muted-foreground">{currentGenreDefaults.description}</p>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">Key</label>
                        <Select value={musicalKey} onValueChange={setMusicalKey}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {currentGenreDefaults.commonKeys.map((k) => (
                              <SelectItem key={k} value={k}>{k} ★</SelectItem>
                            ))}
                            {['C', 'Cm', 'D', 'Dm', 'E', 'Em', 'F', 'Fm', 'G', 'Gm', 'A', 'Am', 'B', 'Bm']
                              .filter(k => !currentGenreDefaults.commonKeys.includes(k))
                              .map((k) => (
                                <SelectItem key={k} value={k}>{k}</SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <label className="text-sm font-medium">BPM</label>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">
                            Suggested: {currentGenreDefaults.bpmRange[0]}–{currentGenreDefaults.bpmRange[1]}
                          </span>
                          <span className="text-sm font-mono font-medium">{bpm[0]}</span>
                        </div>
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

                    {/* Voice Style Selector - Multi-select */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium flex items-center gap-2">
                        <Mic className="w-4 h-4" />
                        Voice Style(s) — select multiple for duets
                      </label>
                      {selectedVoiceStyles.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-2">
                          {selectedVoiceStyles.map((v) => {
                            const voice = AMAPIANO_VOICE_CATEGORIES.flatMap(c => c.voices).find(vo => vo.value === v);
                            return (
                              <Badge key={v} variant="secondary" className="cursor-pointer gap-1" onClick={() => setSelectedVoiceStyles(prev => prev.filter(s => s !== v))}>
                                {voice?.label || v} ✕
                              </Badge>
                            );
                          })}
                          {selectedVoiceStyles.length > 1 && (
                            <Badge variant="default" className="bg-primary/20 text-primary border-primary/30">
                              🎤 Duet Mode
                            </Badge>
                          )}
                        </div>
                      )}
                      <Select value="" onValueChange={(val) => {
                        if (val && val !== 'none' && !selectedVoiceStyles.includes(val)) {
                          setSelectedVoiceStyles(prev => [...prev, val]);
                        }
                      }}>
                        <SelectTrigger>
                          <SelectValue placeholder={selectedVoiceStyles.length > 0 ? "Add another voice..." : "Choose voice style(s)..."} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No specific style</SelectItem>
                          {AMAPIANO_VOICE_CATEGORIES.map((cat) => (
                            <div key={cat.category}>
                              <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{cat.category}</div>
                              {cat.voices.filter(v => !selectedVoiceStyles.includes(v.value)).map((voice) => (
                                <SelectItem key={voice.value} value={voice.value}>
                                  <span>{voice.label}</span>
                                  <span className="text-xs text-muted-foreground ml-2">— {voice.description}</span>
                                </SelectItem>
                              ))}
                            </div>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Lyrics Generator */}
                    <div className="space-y-3 p-4 rounded-lg border bg-muted/30">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-primary" />
                          Lyrics
                        </label>
                        <div className="flex items-center gap-2">
                          <Select value={lyricsLanguage} onValueChange={setLyricsLanguage}>
                            <SelectTrigger className="w-[140px] h-8 text-xs">
                              <Globe className="w-3 h-3 mr-1" />
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {SA_LANGUAGES.map((lang) => (
                                <SelectItem key={lang.value} value={lang.value}>
                                  {lang.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={handleGenerateLyrics}
                            disabled={isGeneratingLyrics}
                          >
                            {isGeneratingLyrics ? (
                              <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                            ) : (
                              <Sparkles className="w-3 h-3 mr-1" />
                            )}
                            Generate
                          </Button>
                        </div>
                      </div>
                      <Textarea
                        placeholder="Write or generate lyrics... Use [Verse], [Chorus], [Bridge] tags"
                        value={lyrics}
                        onChange={(e) => setLyrics(e.target.value)}
                        className="min-h-[100px] resize-none font-mono text-sm"
                      />
                    </div>

                    {/* Cultural Authenticity Controls */}
                    <div className="space-y-4 p-4 rounded-lg border bg-muted/30">
                      <label className="text-sm font-medium">Cultural Authenticity</label>
                      <p className="text-xs text-muted-foreground -mt-2">Fine-tune linguistic, regional, and rhythmic characteristics</p>
                      
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <div>
                            <span className="text-sm">Swing Feel</span>
                            <p className="text-xs text-muted-foreground">How much rhythmic swing — higher = more township bounce</p>
                          </div>
                          <span className="text-sm font-mono">{culturalSwing[0]}%</span>
                        </div>
                        <Slider value={culturalSwing} onValueChange={setCulturalSwing} min={0} max={100} step={1} />
                      </div>

                      <div className="space-y-2">
                        <div>
                          <span className="text-sm">Gasp Timing</span>
                          <p className="text-xs text-muted-foreground">The signature Amapiano vocal gasp placement in the bar</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {[
                            { value: 'beat1', label: 'Beat 1', desc: 'Classic downbeat gasp' },
                            { value: 'beat2and', label: 'Beat 2&', desc: 'Syncopated feel' },
                            { value: 'beat4', label: 'Beat 4', desc: 'Anticipation gasp' },
                            { value: 'none', label: 'None', desc: 'No gasp' },
                          ].map((g) => (
                            <Badge
                              key={g.value}
                              variant={gaspTiming === g.value ? "default" : "outline"}
                              className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                              onClick={() => setGaspTiming(g.value)}
                              title={g.desc}
                            >
                              {g.label}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <div>
                            <span className="text-sm">Log Drum Intensity</span>
                            <p className="text-xs text-muted-foreground">Controls the presence and punch of the log drum pattern</p>
                          </div>
                          <span className="text-sm font-mono">{logDrumIntensity[0]}%</span>
                        </div>
                        <Slider value={logDrumIntensity} onValueChange={setLogDrumIntensity} min={0} max={100} step={1} />
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
                            <div className="p-3 bg-muted rounded-lg space-y-3">
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
                              {referenceAudioUrl && (
                                <audio controls className="w-full" src={referenceAudioUrl}>
                                  Your browser does not support the audio element.
                                </audio>
                              )}
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
                                  <div className="flex gap-1 text-xs flex-wrap">
                                    {(Array.isArray(referenceAnalysis.structure)
                                      ? referenceAnalysis.structure.map((seg: any) => (
                                          <div key={seg.type} className="bg-primary/20 px-2 py-1 rounded text-center min-w-12">
                                            <div className="font-medium capitalize">{seg.type}</div>
                                            <div className="text-muted-foreground">{seg.durationSec}s</div>
                                          </div>
                                        ))
                                      : Object.entries(referenceAnalysis.structure).map(([part, bars]) => (
                                          <div key={part} className="bg-primary/20 px-2 py-1 rounded text-center min-w-12">
                                            <div className="font-medium capitalize">{part}</div>
                                            <div className="text-muted-foreground">{bars as number} bars</div>
                                          </div>
                                        ))
                                    )}
                                  </div>
                                </div>

                                {/* Reference Track Actions */}
                                <div className="mt-4 pt-3 border-t border-border">
                                  <span className="text-sm text-muted-foreground block mb-2">Process Reference Track</span>
                                  <div className="flex flex-wrap gap-2">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="gap-1.5"
                                      onClick={() => {
                                        if (referenceAudioUrl) {
                                          localStorage.setItem('pendingAmapianorize', JSON.stringify({
                                            audioUrl: referenceAudioUrl,
                                            analysis: referenceAnalysis,
                                          }));
                                          navigate('/amapianorize');
                                        } else {
                                          toast.error('No reference audio available');
                                        }
                                      }}
                                    >
                                      <Sparkles className="w-3.5 h-3.5" />
                                      Amapianorize
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="gap-1.5"
                                      onClick={() => {
                                        if (referenceAudioUrl) {
                                          localStorage.setItem('pendingStemTrack', JSON.stringify({
                                            audioUrl: referenceAudioUrl,
                                            title: 'Reference Track',
                                            analysis: referenceAnalysis,
                                          }));
                                          navigate('/stem-splitter');
                                        } else {
                                          toast.error('No reference audio available');
                                        }
                                      }}
                                    >
                                      <Scissors className="w-3.5 h-3.5" />
                                      Stem Split
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="gap-1.5"
                                      onClick={() => {
                                        if (referenceAudioUrl) {
                                          localStorage.setItem('pendingVocalRemove', JSON.stringify({
                                            audioUrl: referenceAudioUrl,
                                            title: 'Reference Track',
                                          }));
                                          navigate('/vocal-remover');
                                        } else {
                                          toast.error('No reference audio available');
                                        }
                                      }}
                                    >
                                      <MicVocal className="w-3.5 h-3.5" />
                                      Vocal Remove
                                    </Button>
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
                        <p className="text-xs text-muted-foreground">Generation is driven by the reference analysis above. Add extra direction here only if needed.</p>
                        <Textarea
                          placeholder="Optional: Add extra direction, e.g., 'make it more upbeat' or 'add vocal chops'..."
                          value={prompt}
                          onChange={(e) => setPrompt(e.target.value)}
                          className="min-h-[80px] resize-none"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">Lyrics (Optional)</label>
                        <Textarea
                          placeholder="Enter your lyrics here... The AI will incorporate them into the generated track.&#10;&#10;Example:&#10;[Verse 1]&#10;Ngiyak'thanda wena&#10;Umuhle ngempela&#10;&#10;[Chorus]&#10;Shaya iLog drum..."
                          value={lyrics}
                          onChange={(e) => setLyrics(e.target.value)}
                          className="min-h-[140px] resize-none font-mono text-sm"
                        />
                        <p className="text-xs text-muted-foreground">
                          Use [Verse], [Chorus], [Bridge] tags to structure your lyrics
                        </p>
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

                      {/* Voice Style(s) - Multi-select for Reference tab */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium flex items-center gap-2">
                          <Mic className="w-4 h-4" />
                          Voice Style(s) — select multiple for duets
                        </label>
                        {selectedVoiceStyles.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mb-2">
                            {selectedVoiceStyles.map((v) => {
                              const voice = AMAPIANO_VOICE_CATEGORIES.flatMap(c => c.voices).find(vo => vo.value === v);
                              return (
                                <Badge key={v} variant="secondary" className="cursor-pointer gap-1" onClick={() => setSelectedVoiceStyles(prev => prev.filter(s => s !== v))}>
                                  {voice?.label || v} ✕
                                </Badge>
                              );
                            })}
                            {selectedVoiceStyles.length > 1 && (
                              <Badge variant="default" className="bg-primary/20 text-primary border-primary/30">
                                🎤 Duet Mode
                              </Badge>
                            )}
                          </div>
                        )}
                        <Select value="" onValueChange={(val) => {
                          if (val && val !== 'none' && !selectedVoiceStyles.includes(val)) {
                            setSelectedVoiceStyles(prev => [...prev, val]);
                          }
                        }}>
                          <SelectTrigger>
                            <SelectValue placeholder={selectedVoiceStyles.length > 0 ? "Add another voice..." : "Choose voice style(s)..."} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">No specific style</SelectItem>
                            {AMAPIANO_VOICE_CATEGORIES.map((cat) => (
                              <div key={cat.category}>
                                <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{cat.category}</div>
                                {cat.voices.filter(v => !selectedVoiceStyles.includes(v.value)).map((voice) => (
                                  <SelectItem key={voice.value} value={voice.value}>
                                    <span>{voice.label}</span>
                                    <span className="text-xs text-muted-foreground ml-2">— {voice.description}</span>
                                  </SelectItem>
                                ))}
                              </div>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Lyrics section for Reference tab */}
                      <div className="space-y-3 p-4 rounded-lg border bg-muted/30">
                        <div className="flex items-center justify-between">
                          <label className="text-sm font-medium flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-primary" />
                            Lyrics
                          </label>
                          <div className="flex items-center gap-2">
                            <Select value={lyricsLanguage} onValueChange={setLyricsLanguage}>
                              <SelectTrigger className="w-[140px] h-8 text-xs">
                                <Globe className="w-3 h-3 mr-1" />
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {SA_LANGUAGES.map((lang) => (
                                  <SelectItem key={lang.value} value={lang.value}>
                                    {lang.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={handleGenerateLyrics}
                              disabled={isGeneratingLyrics}
                            >
                              {isGeneratingLyrics ? (
                                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                              ) : (
                                <Sparkles className="w-3 h-3 mr-1" />
                              )}
                              Generate
                            </Button>
                          </div>
                        </div>
                        <Textarea
                          placeholder="Write or generate lyrics... Use [Verse], [Chorus], [Bridge] tags"
                          value={lyrics}
                          onChange={(e) => setLyrics(e.target.value)}
                          className="min-h-[100px] resize-none font-mono text-sm"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : generationType === "stem" ? (
                <StemByStepGenerator onTrackGenerated={(track) => setGeneratedTrack(track)} />
              ) : generationType === "mood" ? (
                <MoodBasedGenerator onTrackGenerated={(track) => setGeneratedTrack(track)} />
              ) : generationType === "voice-midi" ? (
                <VoiceToMIDI />
              ) : generationType === "suno-style" ? (
                <Card className="border-primary/20 bg-gradient-to-br from-primary/5 via-background to-purple-500/5">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Music className="w-5 h-5 text-primary" />
                      Complete Song Production Workflow
                    </CardTitle>
                    <CardDescription>
                      Generate lyrics → Create song with vocals → Separate stems → Import to DAW → Amapianorize
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <SunoStyleWorkflow 
                      onComplete={(result) => {
                        console.log('Workflow complete:', result);
                        if (result?.audioUrl) {
                          setGeneratedTrack(result);
                          toast.success("Song Generated! 🎵");
                        } else {
                          toast.success("Production Complete! 🎉");
                        }
                      }}
                    />
                  </CardContent>
                </Card>
              ) : generationType === "modal-gpu" ? (
                <ModalGPUGenerator 
                  onTrackGenerated={(track) => setGeneratedTrack({
                    id: track.id,
                    title: track.title,
                    type: "full",
                    bpm: track.bpm,
                    genre: track.genre,
                    duration: track.duration,
                    audioUrl: track.audioUrl,
                    stems: null
                  })}
                />
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

                      {/* Input vs AI Comparison */}
                      {generationDetails && (
                        <div className="p-4 bg-muted/50 rounded-lg border space-y-4">
                          <h4 className="font-medium text-sm flex items-center gap-2">
                            <Wand2 className="w-4 h-4 text-primary" />
                            Input vs AI Comparison
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Your Input Column */}
                            <div className="space-y-3 p-3 bg-background rounded-lg border">
                              <Badge variant="secondary" className="text-xs">Your Input</Badge>
                              <div>
                                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Prompt / Description</span>
                                <p className="text-sm mt-1 p-2 bg-muted/50 rounded border font-mono whitespace-pre-wrap break-words min-h-[60px]">
                                  {prompt || (referenceAnalysis ? `Reference-based: ${referenceAnalysis.mood} ${referenceAnalysis.genre} at ${referenceAnalysis.bpm} BPM` : '(none)')}
                                </p>
                              </div>
                              {lyrics.trim() && (
                                <div>
                                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Lyrics</span>
                                  <p className="text-sm mt-1 p-2 bg-muted/50 rounded border font-mono whitespace-pre-wrap break-words max-h-[200px] overflow-y-auto">
                                    {lyrics}
                                  </p>
                                </div>
                              )}
                              <div className="flex flex-wrap gap-2 text-xs">
                                <Badge variant="outline">BPM: {bpm[0]}</Badge>
                                <Badge variant="outline">Style: {genre === "classic" ? "Classic" : genre === "private-school" ? "Private School" : genre === "vocal" ? "Vocal" : "Deep"}</Badge>
                                <Badge variant="outline">Duration: {Math.floor(duration[0] / 60)}:{String(duration[0] % 60).padStart(2, '0')}</Badge>
                                {selectedArtistStyle && <Badge variant="outline">Artist: {selectedArtistStyle}</Badge>}
                              </div>
                              {referenceAnalysis && (
                                <div className="flex flex-wrap gap-2 text-xs">
                                  <Badge variant="outline" className="bg-primary/5">Ref BPM: {referenceAnalysis.bpm}</Badge>
                                  <Badge variant="outline" className="bg-primary/5">Ref Key: {referenceAnalysis.key}</Badge>
                                  <Badge variant="outline" className="bg-primary/5">Ref Mood: {referenceAnalysis.mood}</Badge>
                                </div>
                              )}
                            </div>
                            {/* AI Output Column */}
                            <div className="space-y-3 p-3 bg-background rounded-lg border border-primary/20">
                              <Badge className="text-xs bg-primary/10 text-primary border-primary/20">AI Output</Badge>
                              <div>
                                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Enhanced Prompt Sent to Engine</span>
                                <p className="text-sm mt-1 p-2 bg-muted/50 rounded border font-mono whitespace-pre-wrap break-words min-h-[60px]">
                                  {generationDetails.prompt}
                                </p>
                              </div>
                              {generationDetails.lyrics && (
                                <div>
                                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Lyrics Passed</span>
                                  <p className="text-sm mt-1 p-2 bg-muted/50 rounded border font-mono whitespace-pre-wrap break-words max-h-[200px] overflow-y-auto">
                                    {generationDetails.lyrics}
                                  </p>
                                </div>
                              )}
                              <div className="flex flex-wrap gap-2 text-xs">
                                <Badge variant="outline">BPM: {generatedTrack.bpm}</Badge>
                                <Badge variant="outline">Style: {generatedTrack.genre}</Badge>
                                <Badge variant="outline">Duration: {Math.floor(generatedTrack.duration / 60)}:{String(generatedTrack.duration % 60).padStart(2, '0')}</Badge>
                              </div>
                              <div>
                                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Source</span>
                                <Badge variant="outline" className="ml-2 text-xs">{generationDetails.source}</Badge>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="space-y-3">
                        <h4 className="font-medium text-sm">Generated Track (WAV)</h4>
                        <audio controls className="w-full" src={generatedTrack.audioUrl}>
                          Your browser does not support the audio element.
                        </audio>
                        <div className="flex gap-2 flex-wrap">
                           <Button 
                             variant="outline" 
                             size="sm"
                             onClick={() => {
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
                                 
                                 toast.success("🎵 Track downloaded as WAV!");
                               } catch (error) {
                                 console.error('Download error:', error);
                                 toast.error("Download failed");
                               }
                             }}
                           >
                             <Download className="w-4 h-4 mr-2" />
                             Download WAV
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

                      {/* AI Analysis of Generated Track */}
                      {generatedTrack?.audioUrl && (
                        <div className="pt-4 border-t space-y-3">
                          <h4 className="font-medium text-sm flex items-center gap-2">
                            <Music className="w-4 h-4 text-primary" />
                            Generated Track Analysis
                          </h4>
                          <GeneratedTrackAnalysis audioUrl={generatedTrack.audioUrl} />
                        </div>
                      )}

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