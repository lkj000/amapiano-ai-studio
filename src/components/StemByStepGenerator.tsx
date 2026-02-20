import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Play, Pause, Volume2, Download, Plus, Minus, RotateCcw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

interface StemTrack {
  id: string;
  name: string;
  type: 'drums' | 'piano' | 'bass' | 'sax' | 'vocals' | 'percussion';
  audioUrl?: string;
  isPlaying: boolean;
  volume: number;
  isGenerating: boolean;
  prompt: string;
  color: string;
}

interface StemByStepGeneratorProps {
  onTrackGenerated?: (audioUrl: string, metadata: any) => void;
}

export const StemByStepGenerator: React.FC<StemByStepGeneratorProps> = ({
  onTrackGenerated
}) => {
  const [stems, setStems] = useState<StemTrack[]>([
    {
      id: 'log-drums',
      name: 'Log Drums',
      type: 'drums',
      isPlaying: false,
      volume: 80,
      isGenerating: false,
      prompt: 'Deep amapiano log drums with signature kick pattern',
      color: 'bg-red-500'
    },
    {
      id: 'piano',
      name: 'Piano Chords',
      type: 'piano',
      isPlaying: false,
      volume: 70,
      isGenerating: false,
      prompt: 'Soulful amapiano piano chords with jazz influences',
      color: 'bg-blue-500'
    },
    {
      id: 'bass',
      name: 'Bass Line',
      type: 'bass',
      isPlaying: false,
      volume: 75,
      isGenerating: false,
      prompt: 'Groovy amapiano bassline that follows the kick pattern',
      color: 'bg-green-500'
    },
    {
      id: 'sax',
      name: 'Saxophone',
      type: 'sax',
      isPlaying: false,
      volume: 60,
      isGenerating: false,
      prompt: 'Melodic saxophone melody with South African flavor',
      color: 'bg-yellow-500'
    }
  ]);

  const [masterVolume, setMasterVolume] = useState(80);
  const [isRecording, setIsRecording] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [currentGeneratingStem, setCurrentGeneratingStem] = useState<string | null>(null);
  const audioRefs = useRef<{ [key: string]: HTMLAudioElement }>({});
  const { toast } = useToast();

  // Initialize audio elements
  useEffect(() => {
    stems.forEach(stem => {
      if (stem.audioUrl && !audioRefs.current[stem.id]) {
        const audio = new Audio(stem.audioUrl);
        audio.loop = true;
        audio.volume = (stem.volume / 100) * (masterVolume / 100);
        audioRefs.current[stem.id] = audio;
      }
    });
  }, [stems, masterVolume]);

  const generateStem = async (stemId: string, customPrompt?: string) => {
    const stem = stems.find(s => s.id === stemId);
    if (!stem) return;

    setStems(prev => prev.map(s => 
      s.id === stemId ? { ...s, isGenerating: true } : s
    ));
    setCurrentGeneratingStem(stemId);
    setGenerationProgress(0);

    // Simulate progress
    const progressInterval = setInterval(() => {
      setGenerationProgress(prev => Math.min(prev + Math.random() * 15, 95));
    }, 1000);

    try {
      const prompt = customPrompt || stem.prompt;
      
      const { data, error } = await supabase.functions.invoke('ai-music-generation', {
        body: {
          prompt: `Generate a ${stem.type} track for amapiano music: ${prompt}`,
          type: 'stem',
          stem_type: stem.type,
          duration: 30,
          tempo: 118, // Standard amapiano tempo
          key: 'Am', // Common amapiano key
        }
      });

      if (error) throw error;

      clearInterval(progressInterval);
      setGenerationProgress(100);

      // Convert base64 audio response to playable blob URL
      let stemAudioUrl = '';
      if (data?.audioBase64) {
        const audioFormat = data.audioFormat || 'audio/mpeg';
        const byteString = atob(data.audioBase64);
        const ab = new ArrayBuffer(byteString.length);
        const ia = new Uint8Array(ab);
        for (let i = 0; i < byteString.length; i++) {
          ia[i] = byteString.charCodeAt(i);
        }
        const blob = new Blob([ab], { type: audioFormat });
        stemAudioUrl = URL.createObjectURL(blob);
      } else if (data?.audioUrl) {
        stemAudioUrl = data.audioUrl;
      }

      if (!stemAudioUrl) {
        throw new Error('No audio data returned from generation');
      }
      
      setStems(prev => prev.map(s => 
        s.id === stemId ? { 
          ...s, 
          audioUrl: stemAudioUrl,
          isGenerating: false 
        } : s
      ));

      toast({
        title: "Stem Generated!",
        description: `${stem.name} has been generated successfully`,
      });

      // Create audio element with real audio
      const audio = new Audio(stemAudioUrl);
      audio.loop = true;
      audio.volume = (stem.volume / 100) * (masterVolume / 100);
      audioRefs.current[stemId] = audio;

    } catch (error) {
      console.error('Error generating stem:', error);
      toast({
        title: "Generation Error",
        description: "Failed to generate stem. Please try again.",
        variant: "destructive",
      });
    } finally {
      clearInterval(progressInterval);
      setCurrentGeneratingStem(null);
      setGenerationProgress(0);
      setStems(prev => prev.map(s => 
        s.id === stemId ? { ...s, isGenerating: false } : s
      ));
    }
  };

  const toggleStemPlayback = (stemId: string) => {
    const audio = audioRefs.current[stemId];
    if (!audio) return;

    setStems(prev => prev.map(stem => {
      if (stem.id === stemId) {
        const newIsPlaying = !stem.isPlaying;
        if (newIsPlaying) {
          audio.play().catch(e => console.error('Playback error:', e));
        } else {
          audio.pause();
        }
        return { ...stem, isPlaying: newIsPlaying };
      }
      return stem;
    }));
  };

  const updateStemVolume = (stemId: string, volume: number) => {
    setStems(prev => prev.map(s => 
      s.id === stemId ? { ...s, volume } : s
    ));
    
    const audio = audioRefs.current[stemId];
    if (audio) {
      audio.volume = (volume / 100) * (masterVolume / 100);
    }
  };

  const toggleAllStems = () => {
    const hasPlaying = stems.some(s => s.isPlaying);
    
    stems.forEach(stem => {
      const audio = audioRefs.current[stem.id];
      if (audio) {
        if (hasPlaying) {
          audio.pause();
        } else if (stem.audioUrl) {
          audio.play().catch(e => console.error('Playback error:', e));
        }
      }
    });

    setStems(prev => prev.map(s => ({
      ...s,
      isPlaying: !hasPlaying && !!s.audioUrl
    })));
  };

  const exportMix = async () => {
    const stemsWithAudio = stems.filter(s => s.audioUrl);
    if (stemsWithAudio.length === 0) {
      toast({ title: "No stems to export", description: "Generate at least one stem first.", variant: "destructive" });
      return;
    }

    setIsRecording(true);

    try {
      // Real offline mix using Web Audio API
      const audioContext = new OfflineAudioContext(2, 44100 * 30, 44100); // 30s stereo

      const bufferPromises = stemsWithAudio.map(async (stem) => {
        const response = await fetch(stem.audioUrl!);
        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        return { stem, audioBuffer };
      });

      const decodedStems = await Promise.all(bufferPromises);

      decodedStems.forEach(({ stem, audioBuffer }) => {
        const source = audioContext.createBufferSource();
        source.buffer = audioBuffer;
        const gainNode = audioContext.createGain();
        gainNode.gain.value = (stem.volume / 100) * (masterVolume / 100);
        source.connect(gainNode);
        gainNode.connect(audioContext.destination);
        source.start(0);
      });

      const renderedBuffer = await audioContext.startRendering();

      // Encode to WAV
      const numChannels = renderedBuffer.numberOfChannels;
      const length = renderedBuffer.length;
      const sampleRate = renderedBuffer.sampleRate;
      const bitsPerSample = 16;
      const byteRate = sampleRate * numChannels * (bitsPerSample / 8);
      const blockAlign = numChannels * (bitsPerSample / 8);
      const dataSize = length * blockAlign;
      const bufferSize = 44 + dataSize;
      const wavBuffer = new ArrayBuffer(bufferSize);
      const view = new DataView(wavBuffer);

      const writeString = (offset: number, str: string) => {
        for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
      };
      writeString(0, 'RIFF');
      view.setUint32(4, bufferSize - 8, true);
      writeString(8, 'WAVE');
      writeString(12, 'fmt ');
      view.setUint32(16, 16, true);
      view.setUint16(20, 1, true);
      view.setUint16(22, numChannels, true);
      view.setUint32(24, sampleRate, true);
      view.setUint32(28, byteRate, true);
      view.setUint16(32, blockAlign, true);
      view.setUint16(34, bitsPerSample, true);
      writeString(36, 'data');
      view.setUint32(40, dataSize, true);

      let offset = 44;
      for (let i = 0; i < length; i++) {
        for (let ch = 0; ch < numChannels; ch++) {
          const sample = Math.max(-1, Math.min(1, renderedBuffer.getChannelData(ch)[i]));
          view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
          offset += 2;
        }
      }

      const blob = new Blob([wavBuffer], { type: 'audio/wav' });
      const mixUrl = URL.createObjectURL(blob);

      // Trigger download
      const a = document.createElement('a');
      a.href = mixUrl;
      a.download = `amapiano-mix-${Date.now()}.wav`;
      a.click();

      toast({
        title: "Mix Exported!",
        description: "Your amapiano track has been downloaded as WAV",
      });

      if (onTrackGenerated) {
        onTrackGenerated(mixUrl, {
          stems: stemsWithAudio.map(s => ({ name: s.name, type: s.type, volume: s.volume })),
          masterVolume,
          exportedAt: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Export Error",
        description: "Failed to export mix. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsRecording(false);
    }
  };

  const resetStem = (stemId: string) => {
    const audio = audioRefs.current[stemId];
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
      delete audioRefs.current[stemId];
    }

    setStems(prev => prev.map(s => 
      s.id === stemId ? { 
        ...s, 
        audioUrl: undefined, 
        isPlaying: false 
      } : s
    ));
  };

  const addCustomStem = () => {
    const customId = `custom-${Date.now()}`;
    const newStem: StemTrack = {
      id: customId,
      name: 'Custom Stem',
      type: 'percussion',
      isPlaying: false,
      volume: 70,
      isGenerating: false,
      prompt: 'Custom amapiano element',
      color: 'bg-purple-500'
    };
    
    setStems(prev => [...prev, newStem]);
  };

  const removeStem = (stemId: string) => {
    resetStem(stemId);
    setStems(prev => prev.filter(s => s.id !== stemId));
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Stem-by-Stem Generator</span>
            <Badge variant="secondary">Amapiano Mode</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Master Controls */}
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-4">
              <Button
                size="lg"
                onClick={toggleAllStems}
                className="bg-primary hover:bg-primary/90"
              >
                {stems.some(s => s.isPlaying) ? (
                  <Pause className="w-5 h-5" />
                ) : (
                  <Play className="w-5 h-5" />
                )}
              </Button>
              
              <div className="flex items-center gap-2 min-w-32">
                <Volume2 className="w-4 h-4" />
                <Slider
                  value={[masterVolume]}
                  onValueChange={([value]) => setMasterVolume(value)}
                  max={100}
                  step={1}
                  className="flex-1"
                />
                <span className="text-sm text-muted-foreground w-8">
                  {masterVolume}%
                </span>
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={addCustomStem}>
                <Plus className="w-4 h-4 mr-2" />
                Add Stem
              </Button>
              <Button onClick={exportMix} disabled={isRecording}>
                <Download className="w-4 h-4 mr-2" />
                {isRecording ? 'Exporting...' : 'Export Mix'}
              </Button>
            </div>
          </div>

          {/* Generation Progress */}
          {currentGeneratingStem && (
            <div className="p-4 bg-muted/30 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">
                  Generating {stems.find(s => s.id === currentGeneratingStem)?.name}...
                </span>
                <span className="text-sm text-muted-foreground">
                  {Math.round(generationProgress)}%
                </span>
              </div>
              <Progress value={generationProgress} className="h-2" />
            </div>
          )}

          <Separator />

          {/* Stem Tracks */}
          <div className="space-y-4">
            {stems.map((stem) => (
              <Card key={stem.id} className="border-l-4" style={{ borderLeftColor: stem.color.replace('bg-', '') }}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      {/* Playback Control */}
                      <Button
                        size="sm"
                        variant={stem.isPlaying ? "default" : "outline"}
                        onClick={() => toggleStemPlayback(stem.id)}
                        disabled={!stem.audioUrl || stem.isGenerating}
                        className="w-10 h-10"
                      >
                        {stem.isPlaying ? (
                          <Pause className="w-4 h-4" />
                        ) : (
                          <Play className="w-4 h-4" />
                        )}
                      </Button>

                      {/* Stem Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium">{stem.name}</h4>
                          <Badge 
                            variant="secondary" 
                            className={`${stem.color} text-white text-xs`}
                          >
                            {stem.type}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground truncate">
                          {stem.prompt}
                        </p>
                      </div>

                      {/* Volume Control */}
                      <div className="flex items-center gap-2 min-w-32">
                        <Volume2 className="w-4 h-4" />
                        <Slider
                          value={[stem.volume]}
                          onValueChange={([value]) => updateStemVolume(stem.id, value)}
                          max={100}
                          step={1}
                          className="flex-1"
                          disabled={stem.isGenerating}
                        />
                        <span className="text-sm text-muted-foreground w-8">
                          {stem.volume}%
                        </span>
                      </div>
                    </div>

                    {/* Stem Actions */}
                    <div className="flex items-center gap-2 ml-4">
                      <Button
                        size="sm"
                        onClick={() => generateStem(stem.id)}
                        disabled={stem.isGenerating}
                        variant={stem.audioUrl ? "outline" : "default"}
                      >
                        {stem.isGenerating ? (
                          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <span>{stem.audioUrl ? 'Regenerate' : 'Generate'}</span>
                        )}
                      </Button>
                      
                      {stem.audioUrl && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => resetStem(stem.id)}
                        >
                          <RotateCcw className="w-4 h-4" />
                        </Button>
                      )}
                      
                      {stem.id.startsWith('custom-') && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => removeStem(stem.id)}
                        >
                          <Minus className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Tips */}
          <div className="p-4 bg-muted/30 rounded-lg">
            <h4 className="font-medium mb-2">Pro Tips:</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Start with log drums as your foundation</li>
              <li>• Add piano chords to establish the harmonic progression</li>
              <li>• Layer in bass to create the groove</li>
              <li>• Use saxophone or vocals for melodic elements</li>
              <li>• Adjust volumes to balance your mix</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};