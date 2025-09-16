import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { 
  Mic, Volume2, VolumeX, Play, Pause, Download, 
  Bot, Headphones, Languages, Settings, Sparkles
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface VoiceAIGuideProps {
  currentContext?: string;
  onVoiceCommand?: (command: string) => void;
  className?: string;
}

interface VoiceSettings {
  voiceId: string;
  model: string;
  speed: number;
  stability: number;
  clarity: number;
  style: number;
}

interface VoicePreset {
  name: string;
  description: string;
  settings: VoiceSettings;
}

// ElevenLabs voices with their IDs
const VOICES = [
  { id: 'Aria', name: 'Aria', description: 'Professional, clear female voice' },
  { id: 'Roger', name: 'Roger', description: 'Warm, friendly male voice' },
  { id: 'Sarah', name: 'Sarah', description: 'Energetic, expressive female voice' },
  { id: 'Charlie', name: 'Charlie', description: 'Deep, authoritative male voice' },
  { id: 'George', name: 'George', description: 'British, sophisticated male voice' },
  { id: 'Charlotte', name: 'Charlotte', description: 'Smooth, professional female voice' },
  { id: 'Alice', name: 'Alice', description: 'Young, enthusiastic female voice' },
  { id: 'Liam', name: 'Liam', description: 'Casual, friendly male voice' }
];

const VOICE_PRESETS: VoicePreset[] = [
  {
    name: 'Music Tutor',
    description: 'Patient, educational guidance for learning',
    settings: {
      voiceId: 'Sarah',
      model: 'eleven_multilingual_v2',
      speed: 0.8,
      stability: 0.8,
      clarity: 0.9,
      style: 0.6
    }
  },
  {
    name: 'Production Coach',
    description: 'Energetic, motivational production feedback',
    settings: {
      voiceId: 'Charlie',
      model: 'eleven_turbo_v2_5', 
      speed: 1.0,
      stability: 0.7,
      clarity: 0.8,
      style: 0.8
    }
  },
  {
    name: 'Cultural Guide',
    description: 'Knowledgeable, respectful cultural context',
    settings: {
      voiceId: 'George',
      model: 'eleven_multilingual_v2',
      speed: 0.9,
      stability: 0.9,
      clarity: 0.9,
      style: 0.7
    }
  },
  {
    name: 'Quick Assistant',
    description: 'Fast, efficient real-time help',
    settings: {
      voiceId: 'Aria',
      model: 'eleven_turbo_v2_5',
      speed: 1.2,
      stability: 0.6,
      clarity: 0.7,
      style: 0.5
    }
  }
];

export const VoiceAIGuide: React.FC<VoiceAIGuideProps> = ({
  currentContext,
  onVoiceCommand,
  className
}) => {
  const [isEnabled, setIsEnabled] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);
  const [voiceSettings, setVoiceSettings] = useState<VoiceSettings>(VOICE_PRESETS[0].settings);
  const [customText, setCustomText] = useState('');
  const [recentGuidance, setRecentGuidance] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Auto-guidance based on context changes
  useEffect(() => {
    if (isEnabled && currentContext) {
      generateContextualGuidance(currentContext);
    }
  }, [currentContext, isEnabled]);

  const generateContextualGuidance = async (context: string) => {
    if (!context || isGenerating) return;

    setIsGenerating(true);
    
    try {
      // Generate contextual guidance text
      const guidanceText = generateGuidanceText(context);
      
      if (guidanceText) {
        await speakText(guidanceText);
        setRecentGuidance(prev => [guidanceText, ...prev.slice(0, 4)]);
      }
    } catch (error) {
      console.error('Contextual guidance error:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const generateGuidanceText = (context: string): string => {
    // Smart contextual guidance based on current activity
    const contextLower = context.toLowerCase();
    
    if (contextLower.includes('log') && contextLower.includes('drum')) {
      return "Try emphasizing the kick on beats 1 and 3, with syncopated ghost hits for that authentic amapiano groove.";
    } else if (contextLower.includes('piano') && contextLower.includes('chord')) {
      return "Consider adding gospel-style chord inversions with 7th and 9th extensions for that soulful amapiano sound.";
    } else if (contextLower.includes('bass')) {
      return "Keep your bass frequencies focused between C1 and G2, and make sure it locks tightly with the kick drum pattern.";
    } else if (contextLower.includes('mix') || contextLower.includes('master')) {
      return "High-pass filter everything except kick and bass around 80-100Hz to avoid muddy low-end buildup.";
    } else if (contextLower.includes('tempo') || contextLower.includes('bpm')) {
      return "Classic amapiano typically sits between 113-120 BPM. 118 BPM is the sweet spot for most tracks.";
    } else if (contextLower.includes('key') || contextLower.includes('scale')) {
      return "F# minor is a popular key for amapiano. Try incorporating traditional South African melodic patterns.";
    } else {
      return "Remember, amapiano is about the groove and the soul. Let the music breathe and build gradually.";
    }
  };

  const speakText = async (text: string) => {
    if (!text.trim()) {
      toast.error("Please enter some text to speak");
      return;
    }

    setIsGenerating(true);

    try {
      const { data, error } = await supabase.functions.invoke('elevenlabs-tts', {
        body: {
          text,
          voice: voiceSettings.voiceId,
          model: voiceSettings.model,
          voice_settings: {
            stability: voiceSettings.stability,
            similarity_boost: voiceSettings.clarity,
            style: voiceSettings.style,
            use_speaker_boost: true
          }
        }
      });

      if (error) throw error;

      if (data.audioContent) {
        // Stop current audio if playing
        if (currentAudio) {
          currentAudio.pause();
          currentAudio.currentTime = 0;
        }

        // Play new audio
        const audio = new Audio(`data:audio/mp3;base64,${data.audioContent}`);
        setCurrentAudio(audio);
        
        audio.onplay = () => setIsPlaying(true);
        audio.onended = () => {
          setIsPlaying(false);
          setCurrentAudio(null);
        };
        audio.onerror = () => {
          setIsPlaying(false);
          setCurrentAudio(null);
          toast.error("Audio playback failed");
        };

        await audio.play();
        
      } else {
        throw new Error('No audio content received');
      }

    } catch (error) {
      console.error('Text-to-speech error:', error);
      toast.error("Failed to generate speech. Please check your ElevenLabs API key.");
    } finally {
      setIsGenerating(false);
    }
  };

  const stopAudio = () => {
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
      setCurrentAudio(null);
      setIsPlaying(false);
    }
  };

  const downloadAudio = async () => {
    if (!customText.trim()) {
      toast.error("Please enter text first");
      return;
    }

    try {
      setIsGenerating(true);
      
      const { data, error } = await supabase.functions.invoke('elevenlabs-tts', {
        body: {
          text: customText,
          voice: voiceSettings.voiceId,
          model: voiceSettings.model,
          voice_settings: {
            stability: voiceSettings.stability,
            similarity_boost: voiceSettings.clarity,
            style: voiceSettings.style
          }
        }
      });

      if (error) throw error;

      // Create download link
      const audioBlob = new Blob([
        Uint8Array.from(atob(data.audioContent), c => c.charCodeAt(0))
      ], { type: 'audio/mp3' });
      
      const url = URL.createObjectURL(audioBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `voice-guidance-${Date.now()}.mp3`;
      a.click();
      
      URL.revokeObjectURL(url);
      toast.success("Audio downloaded successfully!");
      
    } catch (error) {
      console.error('Download error:', error);
      toast.error("Failed to download audio");
    } finally {
      setIsGenerating(false);
    }
  };

  const applyPreset = (preset: VoicePreset) => {
    setVoiceSettings(preset.settings);
    toast.success(`Applied ${preset.name} preset`);
  };

  const updateVoiceSetting = (key: keyof VoiceSettings, value: any) => {
    setVoiceSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Bot className="w-5 h-5 text-primary" />
          Voice AI Guide
          <Badge variant="outline" className="ml-auto bg-gradient-to-r from-purple-500/20 to-pink-500/20">
            <Languages className="w-3 h-3 mr-1" />
            ElevenLabs
          </Badge>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Enable/Disable Toggle */}
        <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
          <div className="flex items-center gap-2">
            <Headphones className="w-4 h-4 text-primary" />
            <span className="font-medium">Voice Guidance</span>
          </div>
          <Button
            variant={isEnabled ? "default" : "outline"}
            size="sm"
            onClick={() => setIsEnabled(!isEnabled)}
          >
            {isEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </Button>
        </div>

        {/* Voice Presets */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Voice Presets</label>
          <div className="grid grid-cols-2 gap-2">
            {VOICE_PRESETS.map((preset) => (
              <Button
                key={preset.name}
                variant="outline"
                size="sm"
                onClick={() => applyPreset(preset)}
                className="justify-start h-auto p-3"
              >
                <div className="text-left">
                  <div className="font-medium text-xs">{preset.name}</div>
                  <div className="text-xs text-muted-foreground">{preset.description}</div>
                </div>
              </Button>
            ))}
          </div>
        </div>

        {/* Voice Selection */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-medium">Voice</label>
            <Select
              value={voiceSettings.voiceId}
              onValueChange={(value) => updateVoiceSetting('voiceId', value)}
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {VOICES.map((voice) => (
                  <SelectItem key={voice.id} value={voice.id}>
                    <div>
                      <div className="font-medium">{voice.name}</div>
                      <div className="text-xs text-muted-foreground">{voice.description}</div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium">Model</label>
            <Select
              value={voiceSettings.model}
              onValueChange={(value) => updateVoiceSetting('model', value)}
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="eleven_turbo_v2_5">Turbo V2.5 (Fast)</SelectItem>
                <SelectItem value="eleven_multilingual_v2">Multilingual V2 (Quality)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Voice Settings */}
        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium">Stability: {voiceSettings.stability.toFixed(1)}</label>
            <Slider
              value={[voiceSettings.stability]}
              onValueChange={([value]) => updateVoiceSetting('stability', value)}
              min={0}
              max={1}
              step={0.1}
              className="mt-1"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Clarity: {voiceSettings.clarity.toFixed(1)}</label>
            <Slider
              value={[voiceSettings.clarity]}
              onValueChange={([value]) => updateVoiceSetting('clarity', value)}
              min={0}
              max={1}
              step={0.1}
              className="mt-1"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Style: {voiceSettings.style.toFixed(1)}</label>
            <Slider
              value={[voiceSettings.style]}
              onValueChange={([value]) => updateVoiceSetting('style', value)}
              min={0}
              max={1}
              step={0.1}
              className="mt-1"
            />
          </div>
        </div>

        {/* Custom Text Input */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Custom Guidance</label>
          <Textarea
            placeholder="Enter custom text for voice guidance..."
            value={customText}
            onChange={(e) => setCustomText(e.target.value)}
            className="min-h-[80px]"
          />
          
          <div className="flex gap-2">
            <Button
              onClick={() => speakText(customText)}
              disabled={!customText.trim() || isGenerating}
              className="flex-1"
            >
              {isGenerating ? (
                <><div className="w-4 h-4 animate-spin border-2 border-white border-t-transparent rounded-full" /> Generating...</>
              ) : isPlaying ? (
                <><Pause className="w-4 h-4 mr-2" /> Playing</>
              ) : (
                <><Play className="w-4 h-4 mr-2" /> Speak</>
              )}
            </Button>
            
            {isPlaying && (
              <Button onClick={stopAudio} variant="outline">
                Stop
              </Button>
            )}
            
            <Button onClick={downloadAudio} variant="outline" disabled={!customText.trim()}>
              <Download className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Recent Guidance */}
        {recentGuidance.length > 0 && (
          <div className="space-y-2">
            <label className="text-sm font-medium">Recent AI Guidance</label>
            <div className="max-h-32 overflow-y-auto space-y-1">
              {recentGuidance.map((guidance, index) => (
                <div 
                  key={index}
                  className="p-2 bg-muted/20 rounded text-sm cursor-pointer hover:bg-muted/40"
                  onClick={() => speakText(guidance)}
                >
                  {guidance}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Status Indicators */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isEnabled ? 'bg-green-500' : 'bg-gray-400'}`} />
            {isEnabled ? 'Voice guidance active' : 'Voice guidance disabled'}
          </div>
          {isGenerating && (
            <div className="flex items-center gap-1">
              <Sparkles className="w-3 h-3 animate-pulse" />
              Generating...
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};