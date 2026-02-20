import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Play, Pause, Download, Heart, Sun, Moon, Zap, Waves, Coffee } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

interface MoodSliders {
  energy: number;      // 0-100: Calm to Energetic
  emotion: number;     // 0-100: Melancholic to Joyful
  intensity: number;   // 0-100: Subtle to Intense
  groove: number;      // 0-100: Laid-back to Danceable
  complexity: number;  // 0-100: Simple to Complex
  atmosphere: number;  // 0-100: Intimate to Epic
}

interface TimeOfDayPreset {
  name: string;
  icon: React.ReactNode;
  description: string;
  moods: MoodSliders;
  color: string;
}

interface MoodBasedGeneratorProps {
  onTrackGenerated?: (audioUrl: string, metadata: any) => void;
}

const timePresets: TimeOfDayPreset[] = [
  {
    name: 'Morning Vibes',
    icon: <Sun className="w-4 h-4" />,
    description: 'Fresh, uplifting energy to start the day',
    moods: { energy: 70, emotion: 80, intensity: 60, groove: 75, complexity: 50, atmosphere: 60 },
    color: 'bg-yellow-500'
  },
  {
    name: 'Afternoon Groove',
    icon: <Coffee className="w-4 h-4" />,
    description: 'Smooth, productive background flow',
    moods: { energy: 60, emotion: 65, intensity: 50, groove: 80, complexity: 60, atmosphere: 50 },
    color: 'bg-orange-500'
  },
  {
    name: 'Evening Chill',
    icon: <Waves className="w-4 h-4" />,
    description: 'Relaxed, contemplative wind-down',
    moods: { energy: 40, emotion: 50, intensity: 30, groove: 60, complexity: 70, atmosphere: 80 },
    color: 'bg-blue-500'
  },
  {
    name: 'Late Night Deep',
    icon: <Moon className="w-4 h-4" />,
    description: 'Deep, introspective late-night sessions',
    moods: { energy: 30, emotion: 40, intensity: 80, groove: 50, complexity: 90, atmosphere: 95 },
    color: 'bg-purple-500'
  },
  {
    name: 'Party Energy',
    icon: <Zap className="w-4 h-4" />,
    description: 'High-energy dance floor bangers',
    moods: { energy: 95, emotion: 85, intensity: 90, groove: 100, complexity: 70, atmosphere: 85 },
    color: 'bg-red-500'
  },
  {
    name: 'Romantic Feels',
    icon: <Heart className="w-4 h-4" />,
    description: 'Soulful, emotional connection',
    moods: { energy: 45, emotion: 90, intensity: 70, groove: 65, complexity: 80, atmosphere: 75 },
    color: 'bg-pink-500'
  }
];

export const MoodBasedGenerator: React.FC<MoodBasedGeneratorProps> = ({ onTrackGenerated }) => {
  const [moods, setMoods] = useState<MoodSliders>({
    energy: 65,
    emotion: 70,
    intensity: 60,
    groove: 75,
    complexity: 55,
    atmosphere: 60
  });

  const [selectedPreset, setSelectedPreset] = useState<string>('');
  const [customPrompt, setCustomPrompt] = useState('');
  const [tempo, setTempo] = useState(118);
  const [key, setKey] = useState('Am');
  const [duration, setDuration] = useState(120);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generatedTrack, setGeneratedTrack] = useState<{
    audioUrl: string;
    isPlaying: boolean;
  } | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const { toast } = useToast();

  const updateMood = useCallback((moodType: keyof MoodSliders, value: number) => {
    setMoods(prev => ({ ...prev, [moodType]: value }));
    setSelectedPreset(''); // Clear preset when manually adjusting
  }, []);

  const applyPreset = useCallback((preset: TimeOfDayPreset) => {
    setMoods(preset.moods);
    setSelectedPreset(preset.name);
    toast({
      title: "Preset Applied",
      description: `Switched to ${preset.name} mood settings`,
    });
  }, [toast]);

  const generateMoodPrompt = useCallback((): string => {
    const moodDescriptors = {
      energy: moods.energy > 70 ? 'energetic and vibrant' : moods.energy > 40 ? 'moderate energy' : 'calm and relaxed',
      emotion: moods.emotion > 70 ? 'joyful and uplifting' : moods.emotion > 40 ? 'balanced emotion' : 'melancholic and introspective',
      intensity: moods.intensity > 70 ? 'intense and powerful' : moods.intensity > 40 ? 'moderate intensity' : 'subtle and gentle',
      groove: moods.groove > 70 ? 'highly danceable' : moods.groove > 40 ? 'good groove' : 'laid-back rhythm',
      complexity: moods.complexity > 70 ? 'complex arrangements' : moods.complexity > 40 ? 'moderate complexity' : 'simple structure',
      atmosphere: moods.atmosphere > 70 ? 'epic and expansive' : moods.atmosphere > 40 ? 'balanced atmosphere' : 'intimate and personal'
    };

    const basePrompt = `Create an amapiano track with ${moodDescriptors.energy}, ${moodDescriptors.emotion}, ${moodDescriptors.intensity}, ${moodDescriptors.groove}, ${moodDescriptors.complexity}, and ${moodDescriptors.atmosphere} feel.`;
    
    return customPrompt ? `${basePrompt} ${customPrompt}` : basePrompt;
  }, [moods, customPrompt]);

  const generateTrack = async () => {
    setIsGenerating(true);
    setGenerationProgress(0);

    setGenerationProgress(10);

    try {
      const promptText = generateMoodPrompt();
      
      const { data, error } = await supabase.functions.invoke('ai-music-generation', {
        body: {
          prompt: promptText,
          trackType: 'midi',
          mood_parameters: {
            ...moods,
            tempo,
            key,
            duration,
            preset: selectedPreset || 'custom'
          },
          generation_settings: {
            use_amapiano_style: true,
            cultural_authenticity: 0.8,
            modern_production: 0.7
          }
        }
      });

      if (error) throw error;

      setGenerationProgress(100);

      // Convert base64 audio to playable blob URL — no fake fallbacks
      let audioUrl = '';
      if (data?.audioBase64) {
        const audioFormat = data.audioFormat || 'audio/mpeg';
        const byteString = atob(data.audioBase64);
        const ab = new ArrayBuffer(byteString.length);
        const ia = new Uint8Array(ab);
        for (let i = 0; i < byteString.length; i++) {
          ia[i] = byteString.charCodeAt(i);
        }
        const blob = new Blob([ab], { type: audioFormat });
        audioUrl = URL.createObjectURL(blob);
      } else if (data?.audioUrl) {
        audioUrl = data.audioUrl;
      }

      if (!audioUrl) {
        throw new Error('No audio data returned from generation');
      }

      // Clean up previous audio
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if (generatedTrack?.audioUrl?.startsWith('blob:')) {
        URL.revokeObjectURL(generatedTrack.audioUrl);
      }

      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      setGeneratedTrack({
        audioUrl,
        isPlaying: false
      });

      toast({
        title: "Track Generated!",
        description: "Your mood-based amapiano track is ready",
      });

      if (onTrackGenerated) {
        onTrackGenerated(audioUrl, {
          moods,
          prompt: promptText,
          preset: selectedPreset,
          tempo,
          key,
          duration,
          generatedAt: new Date().toISOString()
        });
      }

    } catch (error) {
      console.error('Error generating track:', error);
      toast({
        title: "Generation Error",
        description: "Failed to generate track. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
      setGenerationProgress(0);
    }
  };

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if (generatedTrack?.audioUrl?.startsWith('blob:')) {
        URL.revokeObjectURL(generatedTrack.audioUrl);
      }
    };
  }, []);

  const togglePlayback = () => {
    if (!generatedTrack || !audioRef.current) return;
    
    if (generatedTrack.isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(e => console.error('Playback error:', e));
    }
    setGeneratedTrack(prev => prev ? {
      ...prev,
      isPlaying: !prev.isPlaying
    } : null);
  };

  const downloadTrack = () => {
    if (!generatedTrack?.audioUrl) return;
    const a = document.createElement('a');
    a.href = generatedTrack.audioUrl;
    a.download = `mood-track-${Date.now()}.mp3`;
    a.click();
  };

  const getMoodColor = (value: number): string => {
    if (value >= 80) return 'bg-green-500';
    if (value >= 60) return 'bg-yellow-500';
    if (value >= 40) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getMoodLabel = (moodType: keyof MoodSliders, value: number): string => {
    const labels = {
      energy: value > 70 ? 'High Energy' : value > 40 ? 'Moderate' : 'Calm',
      emotion: value > 70 ? 'Joyful' : value > 40 ? 'Neutral' : 'Melancholic',
      intensity: value > 70 ? 'Intense' : value > 40 ? 'Moderate' : 'Subtle',
      groove: value > 70 ? 'Danceable' : value > 40 ? 'Groovy' : 'Laid-back',
      complexity: value > 70 ? 'Complex' : value > 40 ? 'Moderate' : 'Simple',
      atmosphere: value > 70 ? 'Epic' : value > 40 ? 'Balanced' : 'Intimate'
    };
    return labels[moodType];
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Mood-Based Generator</span>
            <Badge variant="secondary">AI-Powered Emotions</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Time of Day Presets */}
          <div>
            <h4 className="font-medium mb-3">Quick Mood Presets</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {timePresets.map((preset) => (
                <Button
                  key={preset.name}
                  variant={selectedPreset === preset.name ? "default" : "outline"}
                  onClick={() => applyPreset(preset)}
                  className="h-auto p-3 flex flex-col items-center gap-2"
                >
                  <div className={`w-8 h-8 rounded-full ${preset.color} flex items-center justify-center text-white`}>
                    {preset.icon}
                  </div>
                  <div className="text-center">
                    <div className="font-medium">{preset.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {preset.description}
                    </div>
                  </div>
                </Button>
              ))}
            </div>
          </div>

          <Separator />

          {/* Mood Sliders */}
          <div>
            <h4 className="font-medium mb-4">Fine-tune Your Mood</h4>
            <div className="grid md:grid-cols-2 gap-6">
              {Object.entries(moods).map(([moodType, value]) => (
                <div key={moodType} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-medium capitalize">
                      {moodType}
                    </label>
                    <Badge 
                      className={`${getMoodColor(value)} text-white text-xs`}
                    >
                      {getMoodLabel(moodType as keyof MoodSliders, value)}
                    </Badge>
                  </div>
                  <Slider
                    value={[value]}
                    onValueChange={([newValue]) => updateMood(moodType as keyof MoodSliders, newValue)}
                    max={100}
                    step={1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{moodType === 'energy' ? 'Calm' : 
                           moodType === 'emotion' ? 'Melancholic' : 
                           moodType === 'intensity' ? 'Subtle' :
                           moodType === 'groove' ? 'Laid-back' :
                           moodType === 'complexity' ? 'Simple' : 'Intimate'}</span>
                    <span>{value}</span>
                    <span>{moodType === 'energy' ? 'Energetic' : 
                           moodType === 'emotion' ? 'Joyful' : 
                           moodType === 'intensity' ? 'Intense' :
                           moodType === 'groove' ? 'Danceable' :
                           moodType === 'complexity' ? 'Complex' : 'Epic'}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Technical Parameters */}
          <div>
            <h4 className="font-medium mb-4">Technical Settings</h4>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Tempo (BPM)</label>
                <Slider
                  value={[tempo]}
                  onValueChange={([value]) => setTempo(value)}
                  min={100}
                  max={140}
                  step={1}
                />
                <div className="text-center text-sm text-muted-foreground">
                  {tempo} BPM
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Key</label>
                <Select value={key} onValueChange={setKey}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Am">A minor</SelectItem>
                    <SelectItem value="Dm">D minor</SelectItem>
                    <SelectItem value="Em">E minor</SelectItem>
                    <SelectItem value="Fm">F minor</SelectItem>
                    <SelectItem value="Gm">G minor</SelectItem>
                    <SelectItem value="C">C major</SelectItem>
                    <SelectItem value="F">F major</SelectItem>
                    <SelectItem value="G">G major</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Duration (seconds)</label>
                <Slider
                  value={[duration]}
                  onValueChange={([value]) => setDuration(value)}
                  min={30}
                  max={300}
                  step={30}
                />
                <div className="text-center text-sm text-muted-foreground">
                  {Math.floor(duration / 60)}:{(duration % 60).toString().padStart(2, '0')}
                </div>
              </div>
            </div>
          </div>

          {/* Custom Prompt */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Additional Instructions (Optional)</label>
            <Textarea
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              placeholder="Add specific elements like 'with saxophone solo' or 'deep bass emphasis'..."
              rows={3}
            />
          </div>

          {/* Generation Controls */}
          <div className="flex flex-col gap-4">
            {isGenerating && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Generating your mood-based track...</span>
                  <span>{Math.round(generationProgress)}%</span>
                </div>
                <Progress value={generationProgress} />
              </div>
            )}

            <div className="flex gap-3">
              <Button
                onClick={generateTrack}
                disabled={isGenerating}
                className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
              >
                {isGenerating ? (
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                ) : null}
                {isGenerating ? 'Generating...' : 'Generate Mood Track'}
              </Button>

              {generatedTrack && (
                <>
                  <Button
                    variant="outline"
                    onClick={togglePlayback}
                    className="w-12"
                  >
                    {generatedTrack.isPlaying ? (
                      <Pause className="w-4 h-4" />
                    ) : (
                      <Play className="w-4 h-4" />
                    )}
                  </Button>
                  <Button variant="outline" className="w-12" onClick={downloadTrack}>
                    <Download className="w-4 h-4" />
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Generated Track Info */}
          {generatedTrack && (
            <Card className="bg-muted/50">
              <CardContent className="p-4">
                <h5 className="font-medium mb-2">Generated Track</h5>
                <p className="text-sm text-muted-foreground mb-2">
                  {generateMoodPrompt()}
                </p>
                <div className="flex gap-2 flex-wrap">
                  <Badge variant="secondary">{tempo} BPM</Badge>
                  <Badge variant="secondary">{key}</Badge>
                  <Badge variant="secondary">{Math.floor(duration / 60)}:{(duration % 60).toString().padStart(2, '0')}</Badge>
                  {selectedPreset && <Badge>{selectedPreset}</Badge>}
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
};