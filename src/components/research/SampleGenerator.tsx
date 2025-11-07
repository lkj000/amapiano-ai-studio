import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Music, Image as ImageIcon, BarChart3, Loader2, Download, Library, Brain, CheckCircle2, XCircle, AlertCircle, Edit, Save, Clock, Zap, Award } from "lucide-react";
import { useWaveformVisualization } from "@/hooks/useWaveformVisualization";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import SampleLibraryPanel from "@/components/SampleLibraryPanel";
import { AudioEditor } from "./AudioEditor";

export const SampleGenerator = () => {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [audioPrompt, setAudioPrompt] = useState("Amapiano beat with log drum, piano chords, deep bass, 112 BPM");
  const [imagePrompt, setImagePrompt] = useState("Amapiano music waveform visualization with vibrant colors");
  const [benchmarkPrompt, setBenchmarkPrompt] = useState("Abstract amapiano album cover art");
  const [audioDuration, setAudioDuration] = useState("8");
  const [audioModel, setAudioModel] = useState("musicgen");
  const [imageModel, setImageModel] = useState("flux-schnell");
  const [imageAspect, setImageAspect] = useState("16:9");
  const [generatedAudio, setGeneratedAudio] = useState<string | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [benchmarkResults, setBenchmarkResults] = useState<any[]>([]);
  const [showLibrary, setShowLibrary] = useState(false);
  const [healthStatus, setHealthStatus] = useState<'unknown' | 'healthy' | 'unhealthy'>('unknown');
  const [healthMessage, setHealthMessage] = useState<string>('');
  const [isCheckingHealth, setIsCheckingHealth] = useState(false);
  const [showAudioEditor, setShowAudioEditor] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [editedAudioUrl, setEditedAudioUrl] = useState<string | null>(null);
  const [sampleName, setSampleName] = useState("");
  const [sampleDescription, setSampleDescription] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { generateWaveform, drawWaveform } = useWaveformVisualization();

  useEffect(() => {
    if (generatedAudio && audioRef.current && canvasRef.current) {
      const audio = audioRef.current;
      const loadAndVisualize = async () => {
        try {
          const audioContext = new AudioContext();
          const response = await fetch(generatedAudio);
          const arrayBuffer = await response.arrayBuffer();
          const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
          
          const waveformData = await generateWaveform(audioBuffer);
          if (canvasRef.current) {
            drawWaveform(canvasRef.current, waveformData.peaks, '#10b981');
          }
        } catch (error) {
          console.error('Error visualizing audio:', error);
        }
      };
      loadAndVisualize();
    }
  }, [generatedAudio, generateWaveform, drawWaveform]);

  const generateAudioSample = async () => {
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-sample', {
        body: { 
          type: 'audio', 
          prompt: audioPrompt,
          duration: parseInt(audioDuration),
          model: audioModel
        }
      });

      if (error) throw error;

      let prediction = data;
      while (prediction.status !== 'succeeded' && prediction.status !== 'failed') {
        await new Promise(resolve => setTimeout(resolve, 2000));
        const { data: statusData } = await supabase.functions.invoke('generate-sample', {
          body: { predictionId: prediction.id }
        });
        prediction = statusData;
      }

      if (prediction.status === 'succeeded') {
        const audioUrl = typeof prediction.output === 'string' ? prediction.output : prediction.output?.[0];
        console.log("Generated audio URL:", audioUrl);
        if (!audioUrl) {
          throw new Error('No audio output received from generation');
        }
        setGeneratedAudio(audioUrl);
        toast({
          title: "Audio Generated",
          description: "Sample created successfully with " + audioModel,
        });
      } else {
        throw new Error(prediction.error || 'Generation failed');
      }
    } catch (error: any) {
      const errorData = error?.message ? JSON.parse(error.message) : error;
      const errorMessage = errorData?.details || errorData?.error || error.message;
      const hint = errorData?.hint;
      
      toast({
        title: "Generation Failed",
        description: (
          <div className="space-y-1">
            <p>{errorMessage}</p>
            {hint && <p className="text-xs opacity-80">{hint}</p>}
          </div>
        ),
        variant: "destructive",
      });
      
      if (errorData?.error?.includes("Invalid") || errorData?.error?.includes("Unauthorized")) {
        setHealthStatus('unhealthy');
        setHealthMessage('API key appears invalid. Run health check to verify.');
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const generateVisualAsset = async () => {
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-sample', {
        body: { 
          type: 'image', 
          prompt: imagePrompt,
          aspectRatio: imageAspect,
          model: imageModel
        }
      });

      if (error) throw error;

      let prediction = data;
      while (prediction.status !== 'succeeded' && prediction.status !== 'failed') {
        await new Promise(resolve => setTimeout(resolve, 2000));
        const { data: statusData } = await supabase.functions.invoke('generate-sample', {
          body: { predictionId: prediction.id }
        });
        prediction = statusData;
      }

      if (prediction.status === 'succeeded') {
        setGeneratedImage(prediction.output[0]);
        toast({
          title: "Image Generated",
          description: "Visual asset created with " + imageModel,
        });
      } else {
        throw new Error('Generation failed');
      }
    } catch (error: any) {
      const errorData = error?.message ? JSON.parse(error.message) : error;
      const errorMessage = errorData?.details || errorData?.error || error.message;
      const hint = errorData?.hint;
      
      toast({
        title: "Generation Failed",
        description: (
          <div className="space-y-1">
            <p>{errorMessage}</p>
            {hint && <p className="text-xs opacity-80">{hint}</p>}
          </div>
        ),
        variant: "destructive",
      });
      
      if (errorData?.error?.includes("Invalid") || errorData?.error?.includes("Unauthorized")) {
        setHealthStatus('unhealthy');
        setHealthMessage('API key appears invalid. Run health check to verify.');
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const checkReplicateHealth = async () => {
    setIsCheckingHealth(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-sample', {
        body: { type: 'health-check' }
      });

      if (error) {
        setHealthStatus('unhealthy');
        setHealthMessage('Failed to connect to Replicate API');
        toast({
          title: "Health Check Failed",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      if (data.status === 'healthy') {
        setHealthStatus('healthy');
        setHealthMessage(data.message + (data.username ? ` (${data.username})` : ''));
        toast({
          title: "Health Check Passed",
          description: data.message,
        });
      } else {
        setHealthStatus('unhealthy');
        setHealthMessage(data.details || data.error);
        toast({
          title: "Health Check Failed",
          description: (
            <div className="space-y-1">
              <p>{data.error}</p>
              {data.details && <p className="text-xs opacity-80">{data.details}</p>}
              {data.hint && <p className="text-xs opacity-80">{data.hint}</p>}
            </div>
          ),
          variant: "destructive",
        });
      }
    } catch (error: any) {
      setHealthStatus('unhealthy');
      setHealthMessage('Error checking health: ' + error.message);
      toast({
        title: "Health Check Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsCheckingHealth(false);
    }
  };

  const runBenchmark = async () => {
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-sample', {
        body: { 
          type: 'benchmark', 
          prompt: benchmarkPrompt,
          models: ["black-forest-labs/flux-schnell", "black-forest-labs/flux-dev"]
        }
      });

      if (error) throw error;

      setBenchmarkResults(data.benchmarkResults);
      toast({
        title: "Benchmark Complete",
        description: `Compared ${data.benchmarkResults.length} models`,
      });
    } catch (error: any) {
      toast({
        title: "Benchmark Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAudioExport = (blob: Blob, format: string) => {
    const url = URL.createObjectURL(blob);
    setEditedAudioUrl(url);
    setGeneratedAudio(url);
    setShowAudioEditor(false);
    toast({
      title: "Audio Edited",
      description: `Effects applied successfully. Exported as ${format.toUpperCase()}.`,
    });
  };

  const saveToLibrary = async () => {
    if (!generatedAudio) return;
    
    setIsSaving(true);
    try {
      const audioUrl = generatedAudio;
      const response = await fetch(audioUrl);
      const blob = await response.blob();
      
      const fileName = `sample-${Date.now()}.${blob.type.includes('wav') ? 'wav' : 'mp3'}`;
      const filePath = `samples/${fileName}`;
      
      const { error: uploadError } = await supabase.storage
        .from('samples')
        .upload(filePath, blob);
      
      if (uploadError) throw uploadError;
      
      const { data: { publicUrl } } = supabase.storage
        .from('samples')
        .getPublicUrl(filePath);
      
      const audioContext = new AudioContext();
      const arrayBuffer = await blob.arrayBuffer();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      const duration = audioBuffer.duration;
      
      const { error: dbError } = await supabase
        .from('samples')
        .insert({
          name: sampleName || 'Generated Sample',
          description: sampleDescription || audioPrompt,
          file_url: publicUrl,
          category: 'generated',
          duration: duration,
          file_size: blob.size,
          tags: ['ai-generated', 'amapiano', audioModel],
          is_public: true,
        });
      
      if (dbError) throw dbError;
      
      toast({
        title: "Saved to Library",
        description: "Sample saved successfully",
      });
      
      setShowSaveDialog(false);
      setSampleName("");
      setSampleDescription("");
    } catch (error: any) {
      toast({
        title: "Save Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-4">
        <Button 
          variant="outline" 
          size="sm"
          onClick={checkReplicateHealth}
          disabled={isCheckingHealth}
        >
          {isCheckingHealth ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Checking...
            </>
          ) : (
            <>
              <Brain className="mr-2 h-4 w-4" />
              Check API Health
            </>
          )}
        </Button>
        
        <Dialog open={showLibrary} onOpenChange={setShowLibrary}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <Library className="mr-2 h-4 w-4" />
              Sample Library
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-6xl max-h-[90vh]">
            <DialogHeader>
              <DialogTitle>Sample Library</DialogTitle>
            </DialogHeader>
            <SampleLibraryPanel 
              onClose={() => setShowLibrary(false)}
              onAddSampleToTrack={() => {}}
            />
          </DialogContent>
        </Dialog>
      </div>

      {healthStatus !== 'unknown' && (
        <Alert variant={healthStatus === 'healthy' ? 'default' : 'destructive'}>
          {healthStatus === 'healthy' ? (
            <CheckCircle2 className="h-4 w-4" />
          ) : (
            <XCircle className="h-4 w-4" />
          )}
          <AlertTitle>
            {healthStatus === 'healthy' ? 'API Connection Healthy' : 'API Connection Issue'}
          </AlertTitle>
          <AlertDescription className="flex flex-col gap-2">
            <span>{healthMessage}</span>
            {healthStatus === 'unhealthy' && (
              <a 
                href="https://supabase.com/dashboard/project/mywijmtszelyutssormy/settings/functions"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm underline hover:no-underline"
              >
                Update API key in Supabase →
              </a>
            )}
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="audio" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="audio" className="flex items-center gap-2">
            <Music className="h-4 w-4" />
            Audio Samples
          </TabsTrigger>
          <TabsTrigger value="visual" className="flex items-center gap-2">
            <ImageIcon className="h-4 w-4" />
            Visual Assets
          </TabsTrigger>
          <TabsTrigger value="benchmark" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Model Benchmark
          </TabsTrigger>
        </TabsList>

        <TabsContent value="audio" className="space-y-4">
          <Card className="p-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="audio-prompt">Amapiano Sample Description</Label>
                <Textarea
                  id="audio-prompt"
                  value={audioPrompt}
                  onChange={(e) => setAudioPrompt(e.target.value)}
                  placeholder="Describe the Amapiano beat you want to generate..."
                  className="min-h-[100px] mt-2"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="audio-duration">Duration (seconds)</Label>
                  <Select value={audioDuration} onValueChange={setAudioDuration}>
                    <SelectTrigger id="audio-duration" className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="4">4 seconds</SelectItem>
                      <SelectItem value="8">8 seconds</SelectItem>
                      <SelectItem value="15">15 seconds</SelectItem>
                      <SelectItem value="30">30 seconds</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="audio-model">AI Model</Label>
                  <Select value={audioModel} onValueChange={setAudioModel}>
                    <SelectTrigger id="audio-model" className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="musicgen">MusicGen (Fast)</SelectItem>
                      <SelectItem value="musicgen-large">MusicGen Large (Quality)</SelectItem>
                      <SelectItem value="riffusion">Riffusion (Experimental)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button 
                onClick={generateAudioSample} 
                disabled={isGenerating}
                className="w-full"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Music className="mr-2 h-4 w-4" />
                    Generate Amapiano Sample
                  </>
                )}
              </Button>
              
              {generatedAudio && (
                <div className="mt-4 space-y-4">
                  <div>
                    <Label>Waveform Visualization</Label>
                    <canvas 
                      ref={canvasRef}
                      width={800}
                      height={200}
                      className="w-full border border-border rounded-lg mt-2"
                    />
                  </div>
                  <div>
                    <Label>Audio Playback</Label>
                    <audio ref={audioRef} controls className="w-full mt-2">
                      <source src={generatedAudio} type="audio/mpeg" />
                    </audio>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" asChild className="flex-1">
                      <a href={generatedAudio} download="amapiano-sample.mp3">
                        <Download className="mr-2 h-4 w-4" />
                        Download
                      </a>
                    </Button>
                    <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" className="flex-1">
                          <Save className="mr-2 h-4 w-4" />
                          Save to Library
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Save to Sample Library</DialogTitle>
                          <DialogDescription>
                            Add this sample to your library for later use
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div>
                            <Label htmlFor="sample-name">Sample Name</Label>
                            <Input
                              id="sample-name"
                              value={sampleName}
                              onChange={(e) => setSampleName(e.target.value)}
                              placeholder="Enter sample name..."
                              className="mt-2"
                            />
                          </div>
                          <div>
                            <Label htmlFor="sample-description">Description (Optional)</Label>
                            <Textarea
                              id="sample-description"
                              value={sampleDescription}
                              onChange={(e) => setSampleDescription(e.target.value)}
                              placeholder="Add description..."
                              className="mt-2 min-h-[80px]"
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setShowSaveDialog(false)}>
                            Cancel
                          </Button>
                          <Button onClick={saveToLibrary} disabled={isSaving}>
                            {isSaving ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Saving...
                              </>
                            ) : (
                              <>
                                <Save className="mr-2 h-4 w-4" />
                                Save
                              </>
                            )}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                    <Dialog open={showAudioEditor} onOpenChange={setShowAudioEditor}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" className="flex-1">
                          <Edit className="mr-2 h-4 w-4" />
                          Edit Audio
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>Edit Audio Sample</DialogTitle>
                        </DialogHeader>
                        <AudioEditor 
                          audioUrl={generatedAudio} 
                          onExport={handleAudioExport}
                        />
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="visual" className="space-y-4">
          <Card className="p-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="image-prompt">Visual Asset Description</Label>
                <Textarea
                  id="image-prompt"
                  value={imagePrompt}
                  onChange={(e) => setImagePrompt(e.target.value)}
                  placeholder="Describe the visual asset you want to generate..."
                  className="min-h-[100px] mt-2"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="aspect-ratio">Aspect Ratio</Label>
                  <Select value={imageAspect} onValueChange={setImageAspect}>
                    <SelectTrigger id="aspect-ratio" className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1:1">Square (1:1)</SelectItem>
                      <SelectItem value="16:9">Widescreen (16:9)</SelectItem>
                      <SelectItem value="9:16">Portrait (9:16)</SelectItem>
                      <SelectItem value="4:3">Standard (4:3)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="image-model">AI Model</Label>
                  <Select value={imageModel} onValueChange={setImageModel}>
                    <SelectTrigger id="image-model" className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="flux-schnell">Flux Schnell (Fast)</SelectItem>
                      <SelectItem value="flux-dev">Flux Dev (Quality)</SelectItem>
                      <SelectItem value="sdxl">SDXL (Stable Diffusion)</SelectItem>
                      <SelectItem value="playground-v2.5">Playground v2.5</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button 
                onClick={generateVisualAsset} 
                disabled={isGenerating}
                className="w-full"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <ImageIcon className="mr-2 h-4 w-4" />
                    Generate Visual Asset
                  </>
                )}
              </Button>
              
              {generatedImage && (
                <div className="mt-4 space-y-2">
                  <Label>Generated Image</Label>
                  <img src={generatedImage} alt="Generated visual" className="w-full rounded-lg" />
                  <Button variant="outline" size="sm" asChild>
                    <a href={generatedImage} download="visual-asset.webp">
                      <Download className="mr-2 h-4 w-4" />
                      Download
                    </a>
                  </Button>
                </div>
              )}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="benchmark" className="space-y-4">
          <Card className="p-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="benchmark-prompt">Benchmark Prompt</Label>
                <Textarea
                  id="benchmark-prompt"
                  value={benchmarkPrompt}
                  onChange={(e) => setBenchmarkPrompt(e.target.value)}
                  placeholder="Enter prompt to benchmark models..."
                  className="min-h-[100px] mt-2"
                />
              </div>
              <Button 
                onClick={runBenchmark} 
                disabled={isGenerating}
                className="w-full"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Running Benchmark...
                  </>
                ) : (
                  <>
                    <BarChart3 className="mr-2 h-4 w-4" />
                    Run Model Benchmark
                  </>
                )}
              </Button>
              
              {benchmarkResults.length > 0 && (
                <div className="mt-4 space-y-6">
                  <div className="flex items-center justify-between">
                    <Label className="text-lg font-semibold">Benchmark Results</Label>
                    <div className="text-sm text-muted-foreground">
                      {benchmarkResults.filter(r => r.status === 'success').length}/{benchmarkResults.length} successful
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <Card className="p-4">
                      <Clock className="h-5 w-5 mx-auto mb-2 text-primary" />
                      <div className="text-2xl font-bold">
                        {(benchmarkResults.reduce((sum, r) => sum + r.duration, 0) / benchmarkResults.length / 1000).toFixed(2)}s
                      </div>
                      <div className="text-xs text-muted-foreground">Avg Time</div>
                    </Card>
                    <Card className="p-4">
                      <Zap className="h-5 w-5 mx-auto mb-2 text-primary" />
                      <div className="text-2xl font-bold">
                        {benchmarkResults.reduce((min, r) => r.duration < min ? r.duration : min, Infinity) / 1000}s
                      </div>
                      <div className="text-xs text-muted-foreground">Fastest</div>
                    </Card>
                    <Card className="p-4">
                      <Award className="h-5 w-5 mx-auto mb-2 text-primary" />
                      <div className="text-2xl font-bold">
                        {benchmarkResults.find(r => r.duration === Math.min(...benchmarkResults.map(r => r.duration)))?.model.split('/')[1] || 'N/A'}
                      </div>
                      <div className="text-xs text-muted-foreground">Winner</div>
                    </Card>
                  </div>
                  
                  <div className="grid gap-4">
                    {benchmarkResults
                      .sort((a, b) => a.duration - b.duration)
                      .map((result, index) => (
                      <Card key={index} className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h4 className="font-semibold text-sm">{result.model}</h4>
                            <div className="flex items-center gap-3 mt-1">
                              <span className={`text-xs px-2 py-1 rounded-full ${result.status === 'success' ? 'bg-green-500/10 text-green-600' : 'bg-red-500/10 text-red-600'}`}>
                                {result.status}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {(result.duration / 1000).toFixed(2)}s
                              </span>
                              {index === 0 && result.status === 'success' && (
                                <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">
                                  Fastest
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-xs text-muted-foreground">Speed</div>
                            <div className="text-sm font-semibold">
                              {((Math.min(...benchmarkResults.map(r => r.duration)) / result.duration) * 100).toFixed(0)}%
                            </div>
                          </div>
                        </div>
                        {result.status === 'success' && result.output && (
                          <img src={result.output[0]} alt={`${result.model} output`} className="w-full rounded border border-border" />
                        )}
                        {result.error && <p className="text-xs text-red-600 mt-2">Error: {result.error}</p>}
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
