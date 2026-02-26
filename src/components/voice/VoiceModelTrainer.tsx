import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, Play, Pause, Trash2, Mic, Zap, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface AudioSample {
  id: string;
  name: string;
  duration: number;
  file: File;
  status: 'pending' | 'processing' | 'ready' | 'error';
}

interface TrainingConfig {
  modelName: string;
  epochs: number;
  batchSize: number;
  learningRate: number;
  sampleRate: number;
  targetSpeaker: string;
}

type TrainingStatus = 'idle' | 'preparing' | 'training' | 'completed' | 'error';

export const VoiceModelTrainer = () => {
  const { toast } = useToast();
  const [samples, setSamples] = useState<AudioSample[]>([]);
  const [config, setConfig] = useState<TrainingConfig>({
    modelName: '',
    epochs: 100,
    batchSize: 8,
    learningRate: 0.0001,
    sampleRate: 44100,
    targetSpeaker: 'custom',
  });
  const [trainingStatus, setTrainingStatus] = useState<TrainingStatus>('idle');
  const [trainingProgress, setTrainingProgress] = useState(0);
  const [currentEpoch, setCurrentEpoch] = useState(0);

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newSamples: AudioSample[] = Array.from(files).map((file) => ({
      id: crypto.randomUUID(),
      name: file.name,
      duration: 0,
      file,
      status: 'pending' as const,
    }));

    setSamples((prev) => [...prev, ...newSamples]);

    // Analyze audio files
    newSamples.forEach((sample) => {
      const audio = new Audio(URL.createObjectURL(sample.file));
      audio.onloadedmetadata = () => {
        setSamples((prev) =>
          prev.map((s) =>
            s.id === sample.id
              ? { ...s, duration: audio.duration, status: 'ready' as const }
              : s
          )
        );
      };
      audio.onerror = () => {
        setSamples((prev) =>
          prev.map((s) =>
            s.id === sample.id ? { ...s, status: 'error' as const } : s
          )
        );
      };
    });

    toast({
      title: 'Files Added',
      description: `${files.length} audio file(s) added to dataset`,
    });
  }, [toast]);

  const removeSample = (id: string) => {
    setSamples((prev) => prev.filter((s) => s.id !== id));
  };

  const getTotalDuration = () => {
    return samples.reduce((acc, s) => acc + s.duration, 0);
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const startTraining = async () => {
    if (!config.modelName) {
      toast({
        title: 'Model Name Required',
        description: 'Please enter a name for your voice model',
        variant: 'destructive',
      });
      return;
    }

    if (samples.length < 3) {
      toast({
        title: 'Insufficient Data',
        description: 'Please add at least 3 audio samples for training',
        variant: 'destructive',
      });
      return;
    }

    if (getTotalDuration() < 60) {
      toast({
        title: 'Insufficient Audio',
        description: 'Please add at least 1 minute of audio for quality training',
        variant: 'destructive',
      });
      return;
    }

    setTrainingStatus('preparing');
    setTrainingProgress(0);

    toast({
      title: 'Training Started',
      description: 'Submitting dataset to training pipeline...',
    });

    try {
      setTrainingStatus('training');

      const { data, error } = await supabase.functions.invoke('train-voice-model', {
        body: {
          model_name: config.modelName,
          epochs: config.epochs,
          learning_rate: config.learningRate,
          batch_size: config.batchSize,
          sample_count: readySamples.length,
        }
      });

      if (error) throw error;

      setTrainingProgress(100);
      setCurrentEpoch(config.epochs);
      setTrainingStatus('completed');
      toast({
        title: 'Training Complete!',
        description: `Voice model "${config.modelName}" is ready to use`,
      });
    } catch (err) {
      console.error('Training failed:', err);
      setTrainingStatus('idle');
      setTrainingProgress(0);
      toast({
        title: 'Training Failed',
        description: 'Voice model training pipeline unavailable. Check backend connectivity.',
        variant: 'destructive',
      });
    }
  };

  const readySamples = samples.filter((s) => s.status === 'ready');

  return (
    <div className="space-y-6">
      <Card className="border-border/50 bg-card/50 backdrop-blur">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mic className="h-5 w-5 text-primary" />
            Voice Model Training
          </CardTitle>
          <CardDescription>
            Train custom voice models from your audio samples. Upload clean vocal recordings for best results.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="dataset" className="space-y-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="dataset">1. Dataset</TabsTrigger>
              <TabsTrigger value="config">2. Configuration</TabsTrigger>
              <TabsTrigger value="training">3. Training</TabsTrigger>
            </TabsList>

            <TabsContent value="dataset" className="space-y-4">
              {/* Upload Area */}
              <div className="border-2 border-dashed border-border/50 rounded-lg p-8 text-center hover:border-primary/50 transition-colors">
                <input
                  type="file"
                  accept="audio/*"
                  multiple
                  onChange={handleFileUpload}
                  className="hidden"
                  id="audio-upload"
                />
                <label htmlFor="audio-upload" className="cursor-pointer">
                  <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-lg font-medium">Drop audio files here</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    WAV, MP3, FLAC • Clean vocals recommended • Min 1 minute total
                  </p>
                </label>
              </div>

              {/* Dataset Stats */}
              <div className="grid grid-cols-3 gap-4">
                <Card className="bg-muted/30">
                  <CardContent className="p-4 text-center">
                    <p className="text-2xl font-bold">{samples.length}</p>
                    <p className="text-sm text-muted-foreground">Samples</p>
                  </CardContent>
                </Card>
                <Card className="bg-muted/30">
                  <CardContent className="p-4 text-center">
                    <p className="text-2xl font-bold">{formatDuration(getTotalDuration())}</p>
                    <p className="text-sm text-muted-foreground">Total Duration</p>
                  </CardContent>
                </Card>
                <Card className="bg-muted/30">
                  <CardContent className="p-4 text-center">
                    <p className="text-2xl font-bold">{readySamples.length}</p>
                    <p className="text-sm text-muted-foreground">Ready</p>
                  </CardContent>
                </Card>
              </div>

              {/* Sample List */}
              {samples.length > 0 && (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {samples.map((sample) => (
                    <div
                      key={sample.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/30"
                    >
                      <div className="flex items-center gap-3">
                        {sample.status === 'ready' && (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        )}
                        {sample.status === 'pending' && (
                          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                        )}
                        {sample.status === 'error' && (
                          <AlertCircle className="h-4 w-4 text-destructive" />
                        )}
                        <div>
                          <p className="text-sm font-medium truncate max-w-[200px]">
                            {sample.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatDuration(sample.duration)}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeSample(sample.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="config" className="space-y-4">
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label htmlFor="modelName">Model Name</Label>
                  <Input
                    id="modelName"
                    placeholder="e.g., My Custom Voice"
                    value={config.modelName}
                    onChange={(e) =>
                      setConfig((prev) => ({ ...prev, modelName: e.target.value }))
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>Training Epochs: {config.epochs}</Label>
                  <Slider
                    value={[config.epochs]}
                    onValueChange={([v]) =>
                      setConfig((prev) => ({ ...prev, epochs: v }))
                    }
                    min={50}
                    max={500}
                    step={10}
                  />
                  <p className="text-xs text-muted-foreground">
                    More epochs = better quality but longer training time
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Batch Size</Label>
                  <Select
                    value={config.batchSize.toString()}
                    onValueChange={(v) =>
                      setConfig((prev) => ({ ...prev, batchSize: parseInt(v) }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="4">4 (Low VRAM)</SelectItem>
                      <SelectItem value="8">8 (Recommended)</SelectItem>
                      <SelectItem value="16">16 (High VRAM)</SelectItem>
                      <SelectItem value="32">32 (Very High VRAM)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Sample Rate</Label>
                  <Select
                    value={config.sampleRate.toString()}
                    onValueChange={(v) =>
                      setConfig((prev) => ({ ...prev, sampleRate: parseInt(v) }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="22050">22.05 kHz (Faster)</SelectItem>
                      <SelectItem value="44100">44.1 kHz (Recommended)</SelectItem>
                      <SelectItem value="48000">48 kHz (Highest Quality)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Learning Rate: {config.learningRate}</Label>
                  <Slider
                    value={[config.learningRate * 10000]}
                    onValueChange={([v]) =>
                      setConfig((prev) => ({ ...prev, learningRate: v / 10000 }))
                    }
                    min={1}
                    max={10}
                    step={1}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="training" className="space-y-4">
              {trainingStatus === 'idle' && (
                <div className="text-center py-8">
                  <Zap className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-medium">Ready to Train</h3>
                  <p className="text-sm text-muted-foreground mt-1 mb-6">
                    {readySamples.length} samples • {formatDuration(getTotalDuration())} of audio
                  </p>
                  <Button onClick={startTraining} size="lg">
                    <Zap className="h-4 w-4 mr-2" />
                    Start Training
                  </Button>
                </div>
              )}

              {trainingStatus === 'preparing' && (
                <div className="text-center py-8">
                  <Loader2 className="h-16 w-16 mx-auto mb-4 animate-spin text-primary" />
                  <h3 className="text-lg font-medium">Preparing Dataset</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Analyzing audio and initializing model...
                  </p>
                </div>
              )}

              {trainingStatus === 'training' && (
                <div className="space-y-4 py-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium">Training in Progress</h3>
                    <Badge variant="secondary">
                      Epoch {currentEpoch} / {config.epochs}
                    </Badge>
                  </div>
                  <Progress value={trainingProgress} className="h-3" />
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Progress</p>
                      <p className="font-medium">{trainingProgress.toFixed(1)}%</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Model</p>
                      <p className="font-medium">{config.modelName}</p>
                    </div>
                  </div>
                </div>
              )}

              {trainingStatus === 'completed' && (
                <div className="text-center py-8">
                  <CheckCircle className="h-16 w-16 mx-auto mb-4 text-green-500" />
                  <h3 className="text-lg font-medium">Training Complete!</h3>
                  <p className="text-sm text-muted-foreground mt-1 mb-6">
                    Your voice model "{config.modelName}" is ready to use
                  </p>
                  <div className="flex gap-2 justify-center">
                    <Button variant="outline" onClick={() => setTrainingStatus('idle')}>
                      Train Another
                    </Button>
                    <Button>
                      Use Model
                    </Button>
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};
