import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Music, Image as ImageIcon, BarChart3, Loader2, Download, Library, Brain, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { useWaveformVisualization } from "@/hooks/useWaveformVisualization";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import SampleLibraryPanel from "@/components/SampleLibraryPanel";

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
        setGeneratedAudio(prediction.output);
        toast({
          title: "Audio Generated",
          description: "Sample created successfully with " + audioModel,
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
                  <Button variant="outline" size="sm" asChild>
                    <a href={generatedAudio} download="amapiano-sample.mp3">
                      <Download className="mr-2 h-4 w-4" />
                      Download Sample
                    </a>
                  </Button>
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
                <div className="mt-4 space-y-4">
                  <Label>Benchmark Results</Label>
                  <div className="grid gap-4">
                    {benchmarkResults.map((result, index) => (
                      <Card key={index} className="p-4">
                        <h4 className="font-semibold text-sm mb-2">{result.model}</h4>
                        <div className="space-y-2 text-sm">
                          <p>Status: <span className={result.status === 'success' ? 'text-green-600' : 'text-red-600'}>{result.status}</span></p>
                          <p>Duration: {(result.duration / 1000).toFixed(2)}s</p>
                          {result.status === 'success' && result.output && (
                            <img src={result.output[0]} alt={`${result.model} output`} className="w-full rounded mt-2" />
                          )}
                          {result.error && <p className="text-red-600">Error: {result.error}</p>}
                        </div>
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
