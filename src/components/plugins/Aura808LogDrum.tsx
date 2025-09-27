import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Music2, Zap, Volume2, Settings, Sparkles, 
  BarChart3, RotateCcw, Play, Pause 
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface Aura808LogDrumProps {
  audioContext: AudioContext | null;
  onParameterChange?: (parameterId: string, value: number) => void;
  trackId?: string;
}

interface LogDrumParameters {
  pitch: number;
  glide_time: number;
  knock_mix: number;
  body_mix: number;
  decay_time: number;
  attack_time: number;
  sustain_level: number;
  release_time: number;
  master_gain: number;
}

interface AIPreset {
  name: string;
  description: string;
  genre: string;
  parameters: Partial<LogDrumParameters>;
}

class LogDrumSynthEngine {
  private audioContext: AudioContext;
  private oscillator: OscillatorNode | null = null;
  private gainNode: GainNode;
  private filterNode: BiquadFilterNode;
  private envelopeGain: GainNode;
  private knockBuffer: AudioBuffer | null = null;
  private knockSource: AudioBufferSourceNode | null = null;
  private isPlaying = false;

  constructor(audioContext: AudioContext) {
    this.audioContext = audioContext;
    this.gainNode = audioContext.createGain();
    this.filterNode = audioContext.createBiquadFilter();
    this.envelopeGain = audioContext.createGain();
    
    // Initialize filter
    this.filterNode.type = 'lowpass';
    this.filterNode.frequency.value = 8000;
    this.filterNode.Q.value = 1;
    
    // Connect nodes
    this.envelopeGain.connect(this.filterNode);
    this.filterNode.connect(this.gainNode);
    
    this.generateKnockSample();
  }

  private async generateKnockSample() {
    // Generate a synthetic "knock" sample using noise and filtering
    const sampleRate = this.audioContext.sampleRate;
    const duration = 0.05; // 50ms knock sample
    const bufferLength = sampleRate * duration;
    
    this.knockBuffer = this.audioContext.createBuffer(1, bufferLength, sampleRate);
    const channelData = this.knockBuffer.getChannelData(0);
    
    // Generate filtered noise for knock sound
    for (let i = 0; i < bufferLength; i++) {
      const envelope = Math.exp(-i / (bufferLength * 0.3));
      const noise = (Math.random() * 2 - 1) * envelope;
      channelData[i] = noise * 0.3;
    }
  }

  triggerNote(frequency: number, parameters: LogDrumParameters) {
    this.stop();
    
    const now = this.audioContext.currentTime;
    
    // Create 808-style sine wave oscillator
    this.oscillator = this.audioContext.createOscillator();
    this.oscillator.type = 'sine';
    this.oscillator.frequency.setValueAtTime(frequency, now);
    
    // Add pitch glide if enabled
    if (parameters.glide_time > 0) {
      const glideEndFreq = frequency * 0.5; // Glide down to half frequency
      this.oscillator.frequency.exponentialRampToValueAtTime(
        glideEndFreq, 
        now + parameters.glide_time / 1000
      );
    }
    
    // Connect oscillator
    this.oscillator.connect(this.envelopeGain);
    
    // ADSR Envelope
    this.envelopeGain.gain.setValueAtTime(0, now);
    this.envelopeGain.gain.linearRampToValueAtTime(1, now + parameters.attack_time / 1000);
    this.envelopeGain.gain.exponentialRampToValueAtTime(
      parameters.sustain_level, 
      now + parameters.attack_time / 1000 + parameters.decay_time / 1000
    );
    this.envelopeGain.gain.exponentialRampToValueAtTime(
      0.001, 
      now + parameters.attack_time / 1000 + parameters.decay_time / 1000 + parameters.release_time / 1000
    );
    
    // Set master gain
    this.gainNode.gain.setValueAtTime(parameters.master_gain, now);
    
    // Start oscillator
    this.oscillator.start(now);
    this.oscillator.stop(now + (parameters.attack_time + parameters.decay_time + parameters.release_time) / 1000);
    
    // Add knock sample if enabled
    if (this.knockBuffer && parameters.knock_mix > 0) {
      this.knockSource = this.audioContext.createBufferSource();
      this.knockSource.buffer = this.knockBuffer;
      
      const knockGain = this.audioContext.createGain();
      knockGain.gain.value = parameters.knock_mix;
      
      this.knockSource.connect(knockGain);
      knockGain.connect(this.filterNode);
      
      this.knockSource.start(now);
    }
    
    this.isPlaying = true;
    
    // Clean up after playback
    setTimeout(() => {
      this.isPlaying = false;
    }, (parameters.attack_time + parameters.decay_time + parameters.release_time));
  }

  stop() {
    if (this.oscillator) {
      try {
        this.oscillator.stop();
      } catch (e) {
        // Ignore if already stopped
      }
      this.oscillator = null;
    }
    
    if (this.knockSource) {
      try {
        this.knockSource.stop();
      } catch (e) {
        // Ignore if already stopped
      }
      this.knockSource = null;
    }
    
    this.isPlaying = false;
  }

  connect(destination: AudioNode) {
    this.gainNode.connect(destination);
  }

  disconnect() {
    this.gainNode.disconnect();
  }

  getAnalyzer() {
    const analyzer = this.audioContext.createAnalyser();
    analyzer.fftSize = 256;
    this.gainNode.connect(analyzer);
    return analyzer;
  }
}

export const Aura808LogDrum: React.FC<Aura808LogDrumProps> = ({ 
  audioContext, 
  onParameterChange,
  trackId 
}) => {
  const [parameters, setParameters] = useState<LogDrumParameters>({
    pitch: 60, // MIDI note number (C4 = 60)
    glide_time: 100, // ms
    knock_mix: 0.3,
    body_mix: 0.7,
    decay_time: 800, // ms
    attack_time: 5, // ms
    sustain_level: 0.3,
    release_time: 1200, // ms
    master_gain: 0.8
  });

  const [isGeneratingPreset, setIsGeneratingPreset] = useState(false);
  const [waveformData, setWaveformData] = useState<number[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  
  const synthEngineRef = useRef<LogDrumSynthEngine | null>(null);
  const analyzerRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Initialize synth engine
  useEffect(() => {
    if (audioContext) {
      synthEngineRef.current = new LogDrumSynthEngine(audioContext);
      analyzerRef.current = synthEngineRef.current.getAnalyzer();
      startWaveformAnimation();
    }

    return () => {
      if (synthEngineRef.current) {
        synthEngineRef.current.disconnect();
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [audioContext]);

  const startWaveformAnimation = useCallback(() => {
    if (!analyzerRef.current) return;

    const updateWaveform = () => {
      if (!analyzerRef.current) return;

      const bufferLength = analyzerRef.current.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      analyzerRef.current.getByteFrequencyData(dataArray);
      
      // Convert to normalized values for display
      const normalizedData = Array.from(dataArray).map(value => value / 255);
      setWaveformData(normalizedData);
      
      animationFrameRef.current = requestAnimationFrame(updateWaveform);
    };

    updateWaveform();
  }, []);

  const handleParameterChange = useCallback((paramId: keyof LogDrumParameters, value: number) => {
    setParameters(prev => ({
      ...prev,
      [paramId]: value
    }));
    
    onParameterChange?.(paramId, value);
  }, [onParameterChange]);

  const triggerNote = useCallback(() => {
    if (!synthEngineRef.current || !audioContext) return;
    
    const frequency = 440 * Math.pow(2, (parameters.pitch - 69) / 12); // Convert MIDI to frequency
    synthEngineRef.current.triggerNote(frequency, parameters);
    setIsPlaying(true);
    
    setTimeout(() => {
      setIsPlaying(false);
    }, parameters.attack_time + parameters.decay_time + parameters.release_time);
  }, [audioContext, parameters]);

  const generateAIPreset = useCallback(async (genre: string = "amapiano") => {
    setIsGeneratingPreset(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('aura-conductor-orchestration', {
        body: {
          task: 'generate_preset',
          plugin_type: '808_log_drum',
          genre,
          current_parameters: parameters
        }
      });

      if (error) throw error;

      // Handle the response from the updated edge function
      if (data?.preset?.parameters) {
        setParameters(prev => ({
          ...prev,
          ...data.preset.parameters
        }));
        
        toast.success(`Generated ${data.preset.name} successfully!`);
      } else {
        // Fallback to hardcoded presets if AI generation fails
        const presets: Record<string, Partial<LogDrumParameters>> = {
          "amapiano": {
            pitch: 50,
            glide_time: 200,
            knock_mix: 0.4,
            body_mix: 0.8,
            decay_time: 600,
            attack_time: 2,
            sustain_level: 0.4,
            release_time: 1000
          },
          "private_school": {
            pitch: 55,
            glide_time: 80,
            knock_mix: 0.2,
            body_mix: 0.9,
            decay_time: 400,
            attack_time: 1,
            sustain_level: 0.2,
            release_time: 800
          },
          "deep_house": {
            pitch: 45,
            glide_time: 300,
            knock_mix: 0.6,
            body_mix: 0.7,
            decay_time: 1200,
            attack_time: 8,
            sustain_level: 0.5,
            release_time: 1800
          }
        };

        const newPreset = presets[genre] || presets["amapiano"];
        
        setParameters(prev => ({
          ...prev,
          ...newPreset
        }));

        toast.success(`Generated ${genre} preset successfully!`);
      }
      
    } catch (error) {
      console.error('Error generating AI preset:', error);
      toast.error('Failed to generate AI preset');
    } finally {
      setIsGeneratingPreset(false);
    }
  }, [parameters]);

  const resetToDefaults = useCallback(() => {
    setParameters({
      pitch: 60,
      glide_time: 100,
      knock_mix: 0.3,
      body_mix: 0.7,
      decay_time: 800,
      attack_time: 5,
      sustain_level: 0.3,
      release_time: 1200,
      master_gain: 0.8
    });
    toast.success('Reset to default parameters');
  }, []);

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-3xl">🥁</div>
            <div>
              <CardTitle className="text-xl flex items-center gap-2">
                Aura 808 Log Drum
                <Badge variant="default" className="bg-primary/10 text-primary">
                  v1.0
                </Badge>
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Authentic Amapiano Log Drum Synthesizer
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge variant={isPlaying ? 'default' : 'secondary'}>
              {isPlaying ? 'Playing' : 'Ready'}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Waveform Visualizer */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Real-time Waveform
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-24 bg-background rounded-lg border p-2 flex items-end justify-around gap-px">
              {Array.from({ length: 32 }).map((_, i) => {
                const height = waveformData[i * 4] || 0;
                return (
                  <div
                    key={i}
                    className="bg-primary/70 min-h-[2px] w-2 rounded-t transition-all duration-75"
                    style={{ height: `${height * 80}px` }}
                  />
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Main Controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Sound Generation */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Volume2 className="h-4 w-4" />
                Sound Generation
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Pitch */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Pitch</label>
                  <span className="text-xs text-muted-foreground">
                    {parameters.pitch} MIDI
                  </span>
                </div>
                <Slider
                  value={[parameters.pitch]}
                  onValueChange={([value]) => handleParameterChange('pitch', value)}
                  min={24}
                  max={96}
                  step={1}
                  className="w-full"
                />
              </div>

              {/* Glide Time */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Glide Time</label>
                  <span className="text-xs text-muted-foreground">
                    {parameters.glide_time}ms
                  </span>
                </div>
                <Slider
                  value={[parameters.glide_time]}
                  onValueChange={([value]) => handleParameterChange('glide_time', value)}
                  min={0}
                  max={1000}
                  step={10}
                  className="w-full"
                />
              </div>

              {/* Body/Knock Mix */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Body Mix</label>
                    <span className="text-xs text-muted-foreground">
                      {(parameters.body_mix * 100).toFixed(0)}%
                    </span>
                  </div>
                  <Slider
                    value={[parameters.body_mix]}
                    onValueChange={([value]) => handleParameterChange('body_mix', value)}
                    min={0}
                    max={1}
                    step={0.01}
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Knock Mix</label>
                    <span className="text-xs text-muted-foreground">
                      {(parameters.knock_mix * 100).toFixed(0)}%
                    </span>
                  </div>
                  <Slider
                    value={[parameters.knock_mix]}
                    onValueChange={([value]) => handleParameterChange('knock_mix', value)}
                    min={0}
                    max={1}
                    step={0.01}
                    className="w-full"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ADSR Envelope */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Zap className="h-4 w-4" />
                ADSR Envelope
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Attack */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Attack</label>
                  <span className="text-xs text-muted-foreground">
                    {parameters.attack_time}ms
                  </span>
                </div>
                <Slider
                  value={[parameters.attack_time]}
                  onValueChange={([value]) => handleParameterChange('attack_time', value)}
                  min={1}
                  max={100}
                  step={1}
                  className="w-full"
                />
              </div>

              {/* Decay */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Decay</label>
                  <span className="text-xs text-muted-foreground">
                    {parameters.decay_time}ms
                  </span>
                </div>
                <Slider
                  value={[parameters.decay_time]}
                  onValueChange={([value]) => handleParameterChange('decay_time', value)}
                  min={50}
                  max={2000}
                  step={10}
                  className="w-full"
                />
              </div>

              {/* Sustain */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Sustain</label>
                  <span className="text-xs text-muted-foreground">
                    {(parameters.sustain_level * 100).toFixed(0)}%
                  </span>
                </div>
                <Slider
                  value={[parameters.sustain_level]}
                  onValueChange={([value]) => handleParameterChange('sustain_level', value)}
                  min={0}
                  max={1}
                  step={0.01}
                  className="w-full"
                />
              </div>

              {/* Release */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Release</label>
                  <span className="text-xs text-muted-foreground">
                    {parameters.release_time}ms
                  </span>
                </div>
                <Slider
                  value={[parameters.release_time]}
                  onValueChange={([value]) => handleParameterChange('release_time', value)}
                  min={100}
                  max={3000}
                  step={50}
                  className="w-full"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* AI Presets & Controls */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              AI-Driven Presets
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 flex-wrap">
              <Button
                onClick={() => generateAIPreset("amapiano")}
                disabled={isGeneratingPreset}
                variant="outline"
              >
                {isGeneratingPreset ? 'Generating...' : 'Amapiano'}
              </Button>
              <Button
                onClick={() => generateAIPreset("private_school")}
                disabled={isGeneratingPreset}
                variant="outline"
              >
                Private School
              </Button>
              <Button
                onClick={() => generateAIPreset("deep_house")}
                disabled={isGeneratingPreset}
                variant="outline"
              >
                Deep House
              </Button>
              
              <div className="ml-auto flex items-center gap-2">
                <Button
                  onClick={resetToDefaults}
                  variant="ghost"
                  size="sm"
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reset
                </Button>
                
                <Button
                  onClick={triggerNote}
                  disabled={!audioContext}
                  className="px-6"
                >
                  {isPlaying ? (
                    <Pause className="h-4 w-4 mr-2" />
                  ) : (
                    <Play className="h-4 w-4 mr-2" />
                  )}
                  Test Sound
                </Button>
              </div>
            </div>
            
            {isGeneratingPreset && (
              <div className="mt-4">
                <Progress value={66} className="w-full" />
                <p className="text-xs text-muted-foreground mt-2">
                  AI is analyzing genre characteristics and generating optimal parameters...
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Master Controls */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Master Controls
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Master Gain</label>
                <span className="text-xs text-muted-foreground">
                  {(parameters.master_gain * 100).toFixed(0)}%
                </span>
              </div>
              <Slider
                value={[parameters.master_gain]}
                onValueChange={([value]) => handleParameterChange('master_gain', value)}
                min={0}
                max={1}
                step={0.01}
                className="w-full"
              />
            </div>
          </CardContent>
        </Card>
      </CardContent>
    </Card>
  );
};