/**
 * Modal GPU Dashboard
 * Complete frontend for Modal.com GPU backend operations
 * Implements Suno-style architecture with real Librosa, Demucs, SVDQuant
 */

import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Cpu, Zap, Music, Mic2, Play, Pause, Download, Upload, 
  Activity, CheckCircle2, XCircle, AlertTriangle, Server,
  Brain, Wand2, Layers, BarChart3, Timer, HardDrive, MessageSquare,
  DollarSign, Clock, TrendingUp
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface HealthStatus {
  status: string;
  gpu: boolean;
  gpu_name?: string;
  cuda_version?: string;
  architecture: string;
  endpoints: string[];
  version: string;
}

interface AnalysisResult {
  bpm: number;
  key: string;
  scale: string;
  mode: string;
  genre: string;
  energy: number;
  danceability: number;
  valence: number;
  spectral_centroid: number;
  mfcc: number[];
  chroma: number[];
  duration: number;
  processing_time: number;
  success: boolean;
}

interface StemResult {
  stems: Record<string, string>;
  processing_time: number;
  model_used: string;
  success: boolean;
}

interface QuantResult {
  snr_db: number;
  fad_score: number;
  phase_coherence: number;
  transient_preservation: number;
  stereo_imaging: number;
  dynamic_range: number;
  compression_ratio: number;
  rank_used: number;
  processing_time: number;
  quantized_audio?: string;
  success: boolean;
}

interface AgentStep {
  step: number;
  thought: string;
  action: string;
  observation: string;
}

interface AgentResult {
  output: string;
  steps: AgentStep[];
  total_time: number;
  tools_used: string[];
  success: boolean;
}

// LLM Types
type LLMTaskType = 'simple' | 'creative' | 'reasoning' | 'code' | 'audio_analysis' | 'agent';
type LLMProvider = 'vllm' | 'anthropic' | 'openai' | 'lovable';

interface LLMResponse {
  content: string;
  provider_used: string;
  model_used: string;
  tokens_used: number;
  cost_estimate_usd: number;
  latency_ms: number;
  fallback_triggered: boolean;
  success: boolean;
}

interface LLMStats {
  total_requests: number;
  requests_by_provider: Record<string, number>;
  total_cost_usd: number;
  avg_latency_ms: number;
  fallback_rate: number;
}

export default function ModalDashboard() {
  // Health
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [isCheckingHealth, setIsCheckingHealth] = useState(false);
  
  // Audio
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [publicUrl, setPublicUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  // Analysis
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  // Stems
  const [stemResult, setStemResult] = useState<StemResult | null>(null);
  const [isSeparating, setIsSeparating] = useState(false);
  const [stemModel, setStemModel] = useState('htdemucs');
  
  // Quantization
  const [quantResult, setQuantResult] = useState<QuantResult | null>(null);
  const [isQuantizing, setIsQuantizing] = useState(false);
  const [bitDepth, setBitDepth] = useState(8);
  const [useMidSide, setUseMidSide] = useState(true);
  const [useDithering, setUseDithering] = useState(true);
  const [useNoiseShaping, setUseNoiseShaping] = useState(true);
  
  // Agent
  const [agentGoal, setAgentGoal] = useState('');
  const [agentResult, setAgentResult] = useState<AgentResult | null>(null);
  const [isExecutingAgent, setIsExecutingAgent] = useState(false);

  // LLM Routing
  const [llmPrompt, setLlmPrompt] = useState('');
  const [llmTaskType, setLlmTaskType] = useState<LLMTaskType>('simple');
  const [llmProvider, setLlmProvider] = useState<LLMProvider | 'auto'>('auto');
  const [llmResponse, setLlmResponse] = useState<LLMResponse | null>(null);
  const [llmStats, setLlmStats] = useState<LLMStats | null>(null);
  const [isGeneratingLLM, setIsGeneratingLLM] = useState(false);

  // Check Modal health on mount
  useEffect(() => {
    checkHealth();
  }, []);

  const checkHealth = async () => {
    setIsCheckingHealth(true);
    try {
      const response = await fetch('https://mabgwej--aura-x-backend-fastapi-app.modal.run/health');
      const data = await response.json();
      setHealth(data);
      toast.success('Modal backend is healthy');
    } catch (error) {
      toast.error('Failed to connect to Modal backend');
      setHealth(null);
    } finally {
      setIsCheckingHealth(false);
    }
  };

  const uploadToStorage = async (file: File): Promise<string | null> => {
    setIsUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const userId = user?.id || 'anonymous';
      const fileName = `modal-test/${userId}/${Date.now()}-${file.name}`;
      
      const { data, error } = await supabase.storage
        .from('temp-audio')
        .upload(fileName, file, { upsert: true });

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from('temp-audio')
        .getPublicUrl(data.path);

      return urlData.publicUrl;
    } catch (error) {
      console.error('Upload failed:', error);
      toast.error('Failed to upload audio');
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAudioFile(file);
    setAnalysisResult(null);
    setStemResult(null);
    setQuantResult(null);

    const localUrl = URL.createObjectURL(file);
    setAudioUrl(localUrl);

    toast.info('Uploading to cloud storage...');
    const url = await uploadToStorage(file);
    setPublicUrl(url);
    
    if (url) {
      toast.success('Audio ready for GPU processing');
    }
  };

  const togglePlayback = () => {
    if (!audioRef.current || !audioUrl) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const runAnalysis = async () => {
    if (!publicUrl) {
      toast.error('Please upload an audio file first');
      return;
    }

    setIsAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke('modal-analyze', {
        body: { audio_url: publicUrl, analysis_type: 'full' }
      });

      if (error) throw error;
      setAnalysisResult(data);
      toast.success(`Analysis complete: ${data.key} ${data.mode}, ${data.bpm.toFixed(0)} BPM`);
    } catch (error) {
      console.error('Analysis failed:', error);
      toast.error('Analysis failed');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const runStemSeparation = async () => {
    if (!publicUrl) {
      toast.error('Please upload an audio file first');
      return;
    }

    setIsSeparating(true);
    try {
      const { data, error } = await supabase.functions.invoke('modal-separate', {
        body: { audio_url: publicUrl, stems: ['vocals', 'drums', 'bass', 'other'], model: stemModel }
      });

      if (error) throw error;
      setStemResult(data);
      toast.success(`Separated ${Object.keys(data.stems || {}).length} stems with ${stemModel}`);
    } catch (error) {
      console.error('Stem separation failed:', error);
      toast.error('Stem separation failed');
    } finally {
      setIsSeparating(false);
    }
  };

  const runQuantization = async () => {
    if (!publicUrl) {
      toast.error('Please upload an audio file first');
      return;
    }

    setIsQuantizing(true);
    try {
      const { data, error } = await supabase.functions.invoke('modal-quantize', {
        body: { 
          audio_url: publicUrl, 
          target_bits: bitDepth,
          use_mid_side: useMidSide,
          use_dithering: useDithering,
          noise_shaping: useNoiseShaping
        }
      });

      if (error) throw error;
      setQuantResult(data);
      toast.success(`Quantized to ${bitDepth}-bit: SNR=${data.snr_db?.toFixed(1)}dB`);
    } catch (error) {
      console.error('Quantization failed:', error);
      toast.error('Quantization failed');
    } finally {
      setIsQuantizing(false);
    }
  };

  const runAgent = async () => {
    if (!agentGoal.trim()) {
      toast.error('Please enter a goal');
      return;
    }

    setIsExecutingAgent(true);
    try {
      const { data, error } = await supabase.functions.invoke('modal-agent', {
        body: { goal: agentGoal, context: { audio_url: publicUrl }, max_steps: 10 }
      });

      if (error) throw error;
      setAgentResult(data);
      toast.success(`Agent completed: ${data.tools_used?.length} tools used`);
    } catch (error) {
      console.error('Agent execution failed:', error);
      toast.error('Agent execution failed');
    } finally {
      setIsExecutingAgent(false);
    }
  };

  // LLM Generation with smart routing
  const runLLMGenerate = async () => {
    if (!llmPrompt.trim()) {
      toast.error('Please enter a prompt');
      return;
    }

    setIsGeneratingLLM(true);
    try {
      const response = await fetch('https://mabgwej--aura-x-backend-fastapi-app.modal.run/llm/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: llmPrompt,
          task_type: llmTaskType,
          provider_override: llmProvider === 'auto' ? null : llmProvider,
          max_tokens: 1024,
          temperature: 0.7,
          fallback: true
        })
      });

      if (!response.ok) throw new Error('LLM generation failed');
      const data = await response.json();
      setLlmResponse(data);
      toast.success(`Generated via ${data.provider_used}/${data.model_used}`);
    } catch (error) {
      console.error('LLM generation failed:', error);
      toast.error('LLM generation failed');
    } finally {
      setIsGeneratingLLM(false);
    }
  };

  const fetchLLMStats = async () => {
    try {
      const response = await fetch('https://mabgwej--aura-x-backend-fastapi-app.modal.run/llm/stats');
      if (!response.ok) throw new Error('Failed to fetch stats');
      const data = await response.json();
      setLlmStats(data);
    } catch (error) {
      console.error('Failed to fetch LLM stats:', error);
    }
  };

  const getQualityBadge = (value: number, thresholds: { good: number; fair: number }) => {
    if (value >= thresholds.good) return { variant: 'default' as const, label: 'Excellent' };
    if (value >= thresholds.fair) return { variant: 'secondary' as const, label: 'Good' };
    return { variant: 'destructive' as const, label: 'Poor' };
  };

  const getTaskTypeDescription = (type: LLMTaskType): string => {
    const descriptions: Record<LLMTaskType, string> = {
      simple: 'vLLM → Lovable → OpenAI (10-50x cheaper)',
      creative: 'Claude → GPT-4o → Gemini (best quality)',
      reasoning: 'GPT-4o → Claude → Gemini (most capable)',
      code: 'Claude → GPT-4o → CodeLlama (excellent code)',
      audio_analysis: 'vLLM → Gemini (fast structured)',
      agent: 'GPT-4o → Claude → Gemini (best function calling)'
    };
    return descriptions[type];
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Server className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">Modal GPU Dashboard</h1>
              <p className="text-muted-foreground text-sm">
                Suno-style architecture • Real Librosa • Demucs • SVDQuant
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {health ? (
              <Badge variant="default" className="gap-1">
                <CheckCircle2 className="w-3 h-3" />
                {health.gpu_name || 'GPU Ready'}
              </Badge>
            ) : (
              <Badge variant="destructive" className="gap-1">
                <XCircle className="w-3 h-3" />
                Disconnected
              </Badge>
            )}
            <Button variant="outline" size="sm" onClick={checkHealth} disabled={isCheckingHealth}>
              {isCheckingHealth ? 'Checking...' : 'Refresh'}
            </Button>
          </div>
        </div>

        {/* Health Status */}
        {health && (
          <Card>
            <CardContent className="pt-4">
              <div className="grid grid-cols-2 md:grid-cols-6 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Status</span>
                  <p className="font-medium capitalize">{health.status}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">GPU</span>
                  <p className="font-medium">{health.gpu ? health.gpu_name : 'None'}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">CUDA</span>
                  <p className="font-medium">{health.cuda_version || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Architecture</span>
                  <p className="font-medium">{health.architecture}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Version</span>
                  <p className="font-medium">{health.version}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Endpoints</span>
                  <p className="font-medium">{health.endpoints?.length || 0} active</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Audio Upload */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Audio Input
            </CardTitle>
            <CardDescription>
              Upload audio for GPU-accelerated processing
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap items-center gap-4">
              <input
                type="file"
                accept="audio/*"
                onChange={handleFileUpload}
                className="hidden"
                id="modal-audio-upload"
              />
              <label htmlFor="modal-audio-upload">
                <Button variant="outline" asChild disabled={isUploading}>
                  <span>
                    <Upload className="mr-2 h-4 w-4" />
                    {isUploading ? 'Uploading...' : 'Choose Audio'}
                  </span>
                </Button>
              </label>
              
              {audioFile && (
                <div className="flex items-center gap-2">
                  <Music className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{audioFile.name}</span>
                  {publicUrl && <Badge variant="secondary">Cloud Ready</Badge>}
                </div>
              )}
            </div>

            {audioUrl && (
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <audio ref={audioRef} src={audioUrl} onEnded={() => setIsPlaying(false)} />
                <Button variant="ghost" size="icon" onClick={togglePlayback}>
                  {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                </Button>
                <span className="text-sm text-muted-foreground">Preview audio</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Main Tabs */}
        <Tabs defaultValue="analyze" className="space-y-4">
          <TabsList className="grid grid-cols-5 w-full max-w-2xl">
            <TabsTrigger value="analyze" className="gap-1">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Analyze</span>
            </TabsTrigger>
            <TabsTrigger value="stems" className="gap-1">
              <Layers className="h-4 w-4" />
              <span className="hidden sm:inline">Stems</span>
            </TabsTrigger>
            <TabsTrigger value="quantize" className="gap-1">
              <Cpu className="h-4 w-4" />
              <span className="hidden sm:inline">Quantize</span>
            </TabsTrigger>
            <TabsTrigger value="llm" className="gap-1">
              <MessageSquare className="h-4 w-4" />
              <span className="hidden sm:inline">LLM</span>
            </TabsTrigger>
            <TabsTrigger value="agent" className="gap-1">
              <Brain className="h-4 w-4" />
              <span className="hidden sm:inline">Agent</span>
            </TabsTrigger>
          </TabsList>

          {/* Analyze Tab */}
          <TabsContent value="analyze" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Real Librosa Analysis
                </CardTitle>
                <CardDescription>
                  Full musicology feature extraction on GPU
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button 
                  onClick={runAnalysis} 
                  disabled={!publicUrl || isAnalyzing}
                  className="w-full"
                >
                  {isAnalyzing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
                      Analyzing on GPU...
                    </>
                  ) : (
                    <>
                      <Activity className="mr-2 h-4 w-4" />
                      Run Librosa Analysis
                    </>
                  )}
                </Button>

                {analysisResult && (
                  <div className="space-y-4 pt-4 border-t">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center p-3 bg-muted/50 rounded-lg">
                        <p className="text-2xl font-bold">{analysisResult.bpm.toFixed(0)}</p>
                        <p className="text-xs text-muted-foreground">BPM</p>
                      </div>
                      <div className="text-center p-3 bg-muted/50 rounded-lg">
                        <p className="text-2xl font-bold">{analysisResult.key}</p>
                        <p className="text-xs text-muted-foreground">{analysisResult.mode}</p>
                      </div>
                      <div className="text-center p-3 bg-muted/50 rounded-lg">
                        <p className="text-2xl font-bold capitalize">{analysisResult.genre}</p>
                        <p className="text-xs text-muted-foreground">Genre</p>
                      </div>
                      <div className="text-center p-3 bg-muted/50 rounded-lg">
                        <p className="text-2xl font-bold">{analysisResult.duration.toFixed(1)}s</p>
                        <p className="text-xs text-muted-foreground">Duration</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Energy</span>
                          <span>{(analysisResult.energy * 100).toFixed(0)}%</span>
                        </div>
                        <Progress value={analysisResult.energy * 100} />
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Danceability</span>
                          <span>{(analysisResult.danceability * 100).toFixed(0)}%</span>
                        </div>
                        <Progress value={analysisResult.danceability * 100} />
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Valence</span>
                          <span>{(analysisResult.valence * 100).toFixed(0)}%</span>
                        </div>
                        <Progress value={analysisResult.valence * 100} />
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Timer className="h-4 w-4" />
                      Processed in {analysisResult.processing_time.toFixed(2)}s on GPU
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Stems Tab */}
          <TabsContent value="stems" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Layers className="h-5 w-5" />
                  Demucs Stem Separation
                </CardTitle>
                <CardDescription>
                  GPU-accelerated source separation
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {['htdemucs', 'htdemucs_ft', 'mdx_extra'].map((model) => (
                    <Button
                      key={model}
                      variant={stemModel === model ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setStemModel(model)}
                    >
                      {model}
                    </Button>
                  ))}
                </div>

                <Button 
                  onClick={runStemSeparation} 
                  disabled={!publicUrl || isSeparating}
                  className="w-full"
                >
                  {isSeparating ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
                      Separating on GPU...
                    </>
                  ) : (
                    <>
                      <Mic2 className="mr-2 h-4 w-4" />
                      Separate Stems
                    </>
                  )}
                </Button>

                {stemResult && (
                  <div className="space-y-4 pt-4 border-t">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {Object.keys(stemResult.stems || {}).map((stem) => (
                        <div key={stem} className="p-3 bg-muted/50 rounded-lg text-center">
                          <Mic2 className="h-6 w-6 mx-auto mb-1 text-primary" />
                          <p className="font-medium capitalize">{stem}</p>
                          <Button size="sm" variant="ghost" className="mt-1">
                            <Download className="h-3 w-3 mr-1" />
                            Download
                          </Button>
                        </div>
                      ))}
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Timer className="h-4 w-4" />
                      Model: {stemResult.model_used} • {stemResult.processing_time.toFixed(2)}s
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Quantize Tab */}
          <TabsContent value="quantize" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Cpu className="h-5 w-5" />
                  SVDQuant-Audio v2
                </CardTitle>
                <CardDescription>
                  Phase-coherent quantization with psychoacoustic enhancements
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Target Bit Depth</span>
                    <Badge variant={bitDepth <= 4 ? 'destructive' : bitDepth <= 8 ? 'secondary' : 'default'}>
                      {bitDepth}-bit
                    </Badge>
                  </div>
                  <Slider
                    value={[bitDepth]}
                    onValueChange={(v) => setBitDepth(v[0])}
                    min={4}
                    max={16}
                    step={4}
                    className="w-full"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="mid-side">Mid/Side Processing</Label>
                    <Switch id="mid-side" checked={useMidSide} onCheckedChange={setUseMidSide} />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="dithering">TPDF Dithering</Label>
                    <Switch id="dithering" checked={useDithering} onCheckedChange={setUseDithering} />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="noise-shaping">Noise Shaping</Label>
                    <Switch id="noise-shaping" checked={useNoiseShaping} onCheckedChange={setUseNoiseShaping} />
                  </div>
                </div>

                <Button 
                  onClick={runQuantization} 
                  disabled={!publicUrl || isQuantizing}
                  className="w-full"
                >
                  {isQuantizing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
                      Quantizing on GPU...
                    </>
                  ) : (
                    <>
                      <Zap className="mr-2 h-4 w-4" />
                      Run SVDQuant-Audio
                    </>
                  )}
                </Button>

                {quantResult && (
                  <div className="space-y-4 pt-4 border-t">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div className="text-center p-3 bg-muted/50 rounded-lg">
                        <p className="text-2xl font-bold">{quantResult.snr_db.toFixed(1)}</p>
                        <p className="text-xs text-muted-foreground">SNR (dB)</p>
                        <Badge {...getQualityBadge(quantResult.snr_db, { good: 35, fair: 25 })} className="mt-1">
                          {getQualityBadge(quantResult.snr_db, { good: 35, fair: 25 }).label}
                        </Badge>
                      </div>
                      <div className="text-center p-3 bg-muted/50 rounded-lg">
                        <p className="text-2xl font-bold">{(quantResult.fad_score * 100).toFixed(1)}%</p>
                        <p className="text-xs text-muted-foreground">FAD Score</p>
                        <Badge 
                          variant={quantResult.fad_score < (bitDepth === 4 ? 0.25 : 0.15) ? 'default' : 'destructive'}
                          className="mt-1"
                        >
                          {quantResult.fad_score < (bitDepth === 4 ? 0.25 : 0.15) ? 'Passed' : 'Failed'}
                        </Badge>
                      </div>
                      <div className="text-center p-3 bg-muted/50 rounded-lg">
                        <p className="text-2xl font-bold">{quantResult.compression_ratio.toFixed(1)}x</p>
                        <p className="text-xs text-muted-foreground">Compression</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                      <div>
                        <span className="text-muted-foreground">Phase Coherence</span>
                        <p className="font-mono">{(quantResult.phase_coherence * 100).toFixed(1)}%</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Transients</span>
                        <p className="font-mono">{(quantResult.transient_preservation * 100).toFixed(1)}%</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Stereo</span>
                        <p className="font-mono">{(quantResult.stereo_imaging * 100).toFixed(1)}%</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Dynamic Range</span>
                        <p className="font-mono">{(quantResult.dynamic_range * 100).toFixed(1)}%</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Timer className="h-4 w-4" />
                      Rank {quantResult.rank_used} • {quantResult.processing_time.toFixed(2)}s on GPU
                    </div>

                    {quantResult.quantized_audio && (
                      <Button variant="outline" className="w-full">
                        <Download className="mr-2 h-4 w-4" />
                        Download Quantized Audio
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* LLM Routing Tab */}
          <TabsContent value="llm" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Intelligent LLM Routing
                </CardTitle>
                <CardDescription>
                  Smart provider selection: vLLM (cheap) → Claude (creative) → GPT-4o (reasoning)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Task Type</Label>
                    <Select value={llmTaskType} onValueChange={(v) => setLlmTaskType(v as LLMTaskType)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="simple">Simple (vLLM first)</SelectItem>
                        <SelectItem value="creative">Creative (Claude first)</SelectItem>
                        <SelectItem value="reasoning">Reasoning (GPT-4o first)</SelectItem>
                        <SelectItem value="code">Code (Claude first)</SelectItem>
                        <SelectItem value="audio_analysis">Audio Analysis (vLLM)</SelectItem>
                        <SelectItem value="agent">Agent (GPT-4o first)</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">{getTaskTypeDescription(llmTaskType)}</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Provider Override (optional)</Label>
                    <Select value={llmProvider} onValueChange={(v) => setLlmProvider(v as LLMProvider | 'auto')}>
                      <SelectTrigger><SelectValue placeholder="Auto-route" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="auto">Auto-route (recommended)</SelectItem>
                        <SelectItem value="vllm">vLLM (self-hosted)</SelectItem>
                        <SelectItem value="anthropic">Anthropic (Claude)</SelectItem>
                        <SelectItem value="openai">OpenAI (GPT-4o)</SelectItem>
                        <SelectItem value="lovable">Lovable AI (Gemini)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Textarea
                  placeholder="Enter your prompt..."
                  value={llmPrompt}
                  onChange={(e) => setLlmPrompt(e.target.value)}
                  rows={4}
                />

                <div className="flex gap-2">
                  <Button onClick={runLLMGenerate} disabled={!llmPrompt.trim() || isGeneratingLLM} className="flex-1">
                    {isGeneratingLLM ? 'Generating...' : 'Generate'}
                  </Button>
                  <Button variant="outline" onClick={fetchLLMStats}>
                    <TrendingUp className="h-4 w-4" />
                  </Button>
                </div>

                {llmResponse && (
                  <div className="space-y-3 pt-4 border-t">
                    <div className="flex flex-wrap gap-2">
                      <Badge variant={llmResponse.fallback_triggered ? 'secondary' : 'default'}>
                        {llmResponse.provider_used}/{llmResponse.model_used}
                      </Badge>
                      <Badge variant="outline"><Clock className="h-3 w-3 mr-1" />{llmResponse.latency_ms.toFixed(0)}ms</Badge>
                      <Badge variant="outline"><DollarSign className="h-3 w-3 mr-1" />${llmResponse.cost_estimate_usd.toFixed(4)}</Badge>
                      <Badge variant="outline">{llmResponse.tokens_used} tokens</Badge>
                    </div>
                    <ScrollArea className="h-48 rounded-md border p-3">
                      <p className="text-sm whitespace-pre-wrap">{llmResponse.content}</p>
                    </ScrollArea>
                  </div>
                )}

                {llmStats && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-4 border-t text-center">
                    <div className="p-2 bg-muted/50 rounded">
                      <p className="text-lg font-bold">{llmStats.total_requests}</p>
                      <p className="text-xs text-muted-foreground">Total Requests</p>
                    </div>
                    <div className="p-2 bg-muted/50 rounded">
                      <p className="text-lg font-bold">${llmStats.total_cost_usd.toFixed(2)}</p>
                      <p className="text-xs text-muted-foreground">Total Cost</p>
                    </div>
                    <div className="p-2 bg-muted/50 rounded">
                      <p className="text-lg font-bold">{llmStats.avg_latency_ms.toFixed(0)}ms</p>
                      <p className="text-xs text-muted-foreground">Avg Latency</p>
                    </div>
                    <div className="p-2 bg-muted/50 rounded">
                      <p className="text-lg font-bold">{(llmStats.fallback_rate * 100).toFixed(1)}%</p>
                      <p className="text-xs text-muted-foreground">Fallback Rate</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Agent Tab */}
          <TabsContent value="agent" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5" />
                  Autonomous Agent
                </CardTitle>
                <CardDescription>
                  Goal-driven execution with GPU tools
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  placeholder="Enter a goal... e.g., 'Analyze this track and separate the stems'"
                  value={agentGoal}
                  onChange={(e) => setAgentGoal(e.target.value)}
                  rows={3}
                />

                <Button 
                  onClick={runAgent} 
                  disabled={!agentGoal.trim() || isExecutingAgent}
                  className="w-full"
                >
                  {isExecutingAgent ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
                      Executing...
                    </>
                  ) : (
                    <>
                      <Wand2 className="mr-2 h-4 w-4" />
                      Execute Goal
                    </>
                  )}
                </Button>

                {agentResult && (
                  <div className="space-y-4 pt-4 border-t">
                    <Alert>
                      <CheckCircle2 className="h-4 w-4" />
                      <AlertDescription>{agentResult.output}</AlertDescription>
                    </Alert>

                    <div className="flex flex-wrap gap-2">
                      {agentResult.tools_used?.map((tool) => (
                        <Badge key={tool} variant="secondary">{tool}</Badge>
                      ))}
                    </div>

                    <ScrollArea className="h-48 rounded-md border p-3">
                      <div className="space-y-3">
                        {agentResult.steps?.map((step) => (
                          <div key={step.step} className="text-sm border-b pb-2">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">Step {step.step}</Badge>
                              <span className="font-medium">{step.action}</span>
                            </div>
                            <p className="text-muted-foreground mt-1">{step.thought}</p>
                            <p className="text-xs text-green-600 mt-1">{step.observation}</p>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>

                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Timer className="h-4 w-4" />
                      Total time: {agentResult.total_time.toFixed(2)}s
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Architecture Info */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <HardDrive className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div className="text-sm text-muted-foreground space-y-1">
                <p><strong>Suno-Style Architecture:</strong> Dynamic GPU scaling (L4 → A10G → A100 → H100)</p>
                <p><strong>Stack:</strong> Modal.com • PyTorch • Librosa • Demucs • SVDQuant-Audio</p>
                <p><strong>Concurrency:</strong> 100 containers × 10 concurrent requests = 1000 req/s capacity</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
