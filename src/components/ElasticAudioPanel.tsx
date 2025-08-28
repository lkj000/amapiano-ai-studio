import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Activity, Clock, Sliders, Volume2, Zap, Settings,
  X, RotateCcw, Music, AudioWaveform, Timer, Play, Pause
} from 'lucide-react';
import { toast } from 'sonner';
import type { AudioClip } from '@/types/daw';

interface ElasticAudioPanelProps {
  audioClip: AudioClip | null;
  onClose: () => void;
  onApplyChanges: (clipId: string, settings: ElasticAudioSettings) => void;
}

export interface ElasticAudioSettings {
  timeStretch: number; // 0.5 to 2.0 (half speed to double speed)
  pitchShift: number; // -12 to +12 semitones
  formantCorrection: boolean;
  algorithm: 'granular' | 'phase_vocoder' | 'wsola' | 'sola';
  quality: 'draft' | 'standard' | 'high' | 'ultra';
  preserveFormants: boolean;
  transientDetection: boolean;
  crossfadeLength: number; // in milliseconds
}

const defaultSettings: ElasticAudioSettings = {
  timeStretch: 1.0,
  pitchShift: 0,
  formantCorrection: true,
  algorithm: 'phase_vocoder',
  quality: 'standard',
  preserveFormants: true,
  transientDetection: true,
  crossfadeLength: 10
};

export default function ElasticAudioPanel({ 
  audioClip, 
  onClose, 
  onApplyChanges 
}: ElasticAudioPanelProps) {
  const [settings, setSettings] = useState<ElasticAudioSettings>(defaultSettings);
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const audioBufferRef = useRef<AudioBuffer | null>(null);

  useEffect(() => {
    // Initialize audio context for preview
    audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  const updateSetting = <K extends keyof ElasticAudioSettings>(
    key: K, 
    value: ElasticAudioSettings[K]
  ) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const simulateElasticProcessing = useCallback(async (): Promise<void> => {
    if (!audioClip) return;

    setIsProcessing(true);
    setProcessingProgress(0);

    // Simulate processing with progress updates
    const steps = 20;
    for (let i = 0; i <= steps; i++) {
      await new Promise(resolve => setTimeout(resolve, 50));
      setProcessingProgress((i / steps) * 100);
    }

    setIsProcessing(false);
    toast.success('Elastic audio processing complete');
  }, [audioClip]);

  const handlePreview = async () => {
    if (!audioContextRef.current || !audioClip) return;

    if (isPlaying) {
      // Stop preview
      if (sourceNodeRef.current) {
        sourceNodeRef.current.stop();
        sourceNodeRef.current = null;
      }
      setIsPlaying(false);
      return;
    }

    try {
      // In a real implementation, this would load and process the audio file
      // For now, we'll simulate preview playback
      setIsPlaying(true);
      
      // Simulate playback duration based on time stretch
      const originalDuration = audioClip.duration * 1000;
      const stretchedDuration = originalDuration / settings.timeStretch;
      
      setTimeout(() => {
        setIsPlaying(false);
      }, Math.min(stretchedDuration, 5000)); // Max 5 second preview
      
      toast.success(`Previewing with ${settings.timeStretch}x time stretch, ${settings.pitchShift} semitones pitch shift`);
    } catch (error) {
      console.error('Preview failed:', error);
      toast.error('Preview failed');
      setIsPlaying(false);
    }
  };

  const handleApply = async () => {
    if (!audioClip) return;
    
    await simulateElasticProcessing();
    onApplyChanges(audioClip.id, settings);
  };

  const resetSettings = () => {
    setSettings(defaultSettings);
    toast.success('Settings reset to default');
  };

  const algorithmDescriptions = {
    granular: 'Best for complex audio with varying tempo',
    phase_vocoder: 'Good general purpose algorithm',
    wsola: 'Optimized for speech and vocals',
    sola: 'Fast processing, basic quality'
  };

  if (!audioClip) {
    return (
      <Card className="w-full h-full">
        <CardContent className="flex items-center justify-center h-full">
          <div className="text-center">
            <AudioWaveform className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No Audio Clip Selected</h3>
            <p className="text-muted-foreground">
              Select an audio clip to use elastic audio features
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full h-full flex flex-col">
      <CardHeader className="pb-3 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <AudioWaveform className="h-5 w-5" />
              Elastic Audio
            </CardTitle>
            <Badge variant="outline" className="bg-gradient-to-r from-blue-500/20 to-purple-500/20">
              {audioClip.name}
            </Badge>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col gap-6 p-6 overflow-auto">
        <Tabs defaultValue="stretch" className="flex-1">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="stretch">Time & Pitch</TabsTrigger>
            <TabsTrigger value="algorithm">Algorithm</TabsTrigger>
            <TabsTrigger value="advanced">Advanced</TabsTrigger>
          </TabsList>

          <TabsContent value="stretch" className="space-y-6 mt-6">
            {/* Time Stretch */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <h3 className="text-base font-semibold">Time Stretch</h3>
                <Badge variant="secondary">
                  {settings.timeStretch === 1 ? '100%' : `${Math.round(settings.timeStretch * 100)}%`}
                </Badge>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Speed</span>
                  <span className="text-muted-foreground">
                    {settings.timeStretch < 1 ? 'Slower' : settings.timeStretch > 1 ? 'Faster' : 'Normal'}
                  </span>
                </div>
                <Slider
                  value={[settings.timeStretch]}
                  onValueChange={([value]) => updateSetting('timeStretch', value)}
                  min={0.25}
                  max={4.0}
                  step={0.01}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>0.25x</span>
                  <span>1.0x</span>
                  <span>4.0x</span>
                </div>
              </div>
            </div>

            <Separator />

            {/* Pitch Shift */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Music className="h-4 w-4" />
                <h3 className="text-base font-semibold">Pitch Shift</h3>
                <Badge variant="secondary">
                  {settings.pitchShift === 0 ? 'Original' : `${settings.pitchShift > 0 ? '+' : ''}${settings.pitchShift} st`}
                </Badge>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Semitones</span>
                  <span className="text-muted-foreground">
                    {settings.pitchShift === 0 ? 'No change' : 
                     settings.pitchShift > 0 ? 'Higher' : 'Lower'}
                  </span>
                </div>
                <Slider
                  value={[settings.pitchShift]}
                  onValueChange={([value]) => updateSetting('pitchShift', value)}
                  min={-24}
                  max={24}
                  step={0.1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>-24</span>
                  <span>0</span>
                  <span>+24</span>
                </div>
              </div>
            </div>

            {/* Formant Correction */}
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Volume2 className="h-4 w-4" />
                  <span className="text-sm font-medium">Formant Correction</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Preserve vocal character when pitch shifting
                </p>
              </div>
              <Switch
                checked={settings.formantCorrection}
                onCheckedChange={(checked) => updateSetting('formantCorrection', checked)}
              />
            </div>
          </TabsContent>

          <TabsContent value="algorithm" className="space-y-6 mt-6">
            {/* Processing Algorithm */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4" />
                <h3 className="text-base font-semibold">Processing Algorithm</h3>
              </div>
              
              <Select 
                value={settings.algorithm} 
                onValueChange={(value: any) => updateSetting('algorithm', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="granular">Granular Synthesis</SelectItem>
                  <SelectItem value="phase_vocoder">Phase Vocoder</SelectItem>
                  <SelectItem value="wsola">WSOLA</SelectItem>
                  <SelectItem value="sola">SOLA</SelectItem>
                </SelectContent>
              </Select>
              
              <p className="text-sm text-muted-foreground">
                {algorithmDescriptions[settings.algorithm]}
              </p>
            </div>

            <Separator />

            {/* Quality Settings */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                <h3 className="text-base font-semibold">Quality</h3>
              </div>
              
              <Select 
                value={settings.quality} 
                onValueChange={(value: any) => updateSetting('quality', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft (Fast)</SelectItem>
                  <SelectItem value="standard">Standard</SelectItem>
                  <SelectItem value="high">High Quality</SelectItem>
                  <SelectItem value="ultra">Ultra (Slow)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </TabsContent>

          <TabsContent value="advanced" className="space-y-6 mt-6">
            {/* Advanced Options */}
            <div className="space-y-4">
              <h3 className="text-base font-semibold">Advanced Options</h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <span className="text-sm font-medium">Preserve Formants</span>
                    <p className="text-xs text-muted-foreground">
                      Maintain vocal formants during processing
                    </p>
                  </div>
                  <Switch
                    checked={settings.preserveFormants}
                    onCheckedChange={(checked) => updateSetting('preserveFormants', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <span className="text-sm font-medium">Transient Detection</span>
                    <p className="text-xs text-muted-foreground">
                      Detect and preserve audio transients
                    </p>
                  </div>
                  <Switch
                    checked={settings.transientDetection}
                    onCheckedChange={(checked) => updateSetting('transientDetection', checked)}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Timer className="h-4 w-4" />
                    <span className="text-sm font-medium">Crossfade Length</span>
                    <Badge variant="outline">{settings.crossfadeLength}ms</Badge>
                  </div>
                  <Slider
                    value={[settings.crossfadeLength]}
                    onValueChange={([value]) => updateSetting('crossfadeLength', value)}
                    min={1}
                    max={50}
                    step={1}
                    className="w-full"
                  />
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Processing Progress */}
        {isProcessing && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Processing...</span>
              <span>{Math.round(processingProgress)}%</span>
            </div>
            <div className="w-full bg-secondary rounded-full h-2">
              <div 
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${processingProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t">
          <Button 
            variant="outline" 
            onClick={handlePreview}
            disabled={isProcessing}
            className="flex-1"
          >
            {isPlaying ? (
              <>
                <Pause className="h-4 w-4 mr-2" />
                Stop Preview
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Preview
              </>
            )}
          </Button>
          
          <Button 
            variant="outline" 
            onClick={resetSettings}
            disabled={isProcessing}
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset
          </Button>
          
          <Button 
            onClick={handleApply}
            disabled={isProcessing}
            className="flex-1"
          >
            <Zap className="h-4 w-4 mr-2" />
            {isProcessing ? 'Processing...' : 'Apply Changes'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}