import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Volume2, Play, Pause, Download, Loader2, Copy, Sparkles, 
  Music, RefreshCw, Settings2, Mic2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Voice {
  id: string;
  name: string;
  gender: 'male' | 'female' | 'neutral';
  accent: string;
  style: string;
  preview?: string;
}

const VOICES: Voice[] = [
  { id: 'za-male-1', name: 'Themba', gender: 'male', accent: 'South African', style: 'Natural' },
  { id: 'za-female-1', name: 'Nomzamo', gender: 'female', accent: 'South African', style: 'Warm' },
  { id: 'za-male-2', name: 'Sipho', gender: 'male', accent: 'South African', style: 'Deep' },
  { id: 'za-female-2', name: 'Lerato', gender: 'female', accent: 'South African', style: 'Bright' },
  { id: 'ng-male-1', name: 'Chidi', gender: 'male', accent: 'Nigerian', style: 'Energetic' },
  { id: 'ng-female-1', name: 'Adaeze', gender: 'female', accent: 'Nigerian', style: 'Melodic' },
  { id: 'us-male-1', name: 'Marcus', gender: 'male', accent: 'American', style: 'Smooth' },
  { id: 'us-female-1', name: 'Jasmine', gender: 'female', accent: 'American', style: 'Clear' },
  { id: 'uk-male-1', name: 'James', gender: 'male', accent: 'British', style: 'Refined' },
  { id: 'uk-female-1', name: 'Amelia', gender: 'female', accent: 'British', style: 'Elegant' },
];

export const TextToSpeech = () => {
  const { toast } = useToast();
  const audioRef = useRef<HTMLAudioElement>(null);
  
  const [text, setText] = useState('');
  const [selectedVoice, setSelectedVoice] = useState<string>(VOICES[0].id);
  const [speed, setSpeed] = useState(1.0);
  const [pitch, setPitch] = useState(1.0);
  const [stability, setStability] = useState(0.5);
  const [similarity, setSimilarity] = useState(0.75);
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  useEffect(() => {
    return () => {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  const handleGenerate = async () => {
    if (!text.trim()) {
      toast({
        title: 'Text Required',
        description: 'Please enter some text to convert to speech',
        variant: 'destructive',
      });
      return;
    }

    if (text.length > 5000) {
      toast({
        title: 'Text Too Long',
        description: 'Please limit your text to 5000 characters',
        variant: 'destructive',
      });
      return;
    }

    setIsGenerating(true);

    try {
      // Call the TTS edge function
      const { data, error } = await supabase.functions.invoke('text-to-speech', {
        body: {
          text: text.trim(),
          voiceId: selectedVoice,
          speed,
          pitch,
          stability,
          similarity,
        },
      });

      if (error) throw error;

      if (data?.audioContent) {
        // Convert base64 to blob
        const binaryString = atob(data.audioContent);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        const blob = new Blob([bytes], { type: 'audio/mpeg' });
        
        if (audioUrl) {
          URL.revokeObjectURL(audioUrl);
        }
        
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        
        toast({
          title: 'Audio Generated',
          description: 'Your speech is ready to play',
        });
      } else {
        // Fallback: Use browser's built-in TTS for demo
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = speed;
        utterance.pitch = pitch;
        speechSynthesis.speak(utterance);
        
        toast({
          title: 'Demo Mode',
          description: 'Using browser TTS. Configure ElevenLabs for premium voices.',
        });
      }
    } catch (error) {
      console.error('TTS error:', error);
      
      // Fallback to browser TTS
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = speed;
      utterance.pitch = pitch;
      speechSynthesis.speak(utterance);
      
      toast({
        title: 'Using Browser TTS',
        description: 'Premium voices require ElevenLabs API configuration',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const togglePlayback = () => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleDownload = () => {
    if (!audioUrl) return;
    
    const a = document.createElement('a');
    a.href = audioUrl;
    a.download = `tts-${Date.now()}.mp3`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    toast({
      title: 'Downloaded',
      description: 'Audio file saved to your device',
    });
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const currentVoice = VOICES.find((v) => v.id === selectedVoice);

  return (
    <div className="space-y-6">
      <Card className="border-border/50 bg-card/50 backdrop-blur">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Volume2 className="h-5 w-5 text-primary" />
            Text to Speech
          </CardTitle>
          <CardDescription>
            Convert text into natural-sounding speech with customizable voices and styles.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="compose" className="space-y-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="compose">Compose</TabsTrigger>
              <TabsTrigger value="settings">Voice Settings</TabsTrigger>
            </TabsList>

            <TabsContent value="compose" className="space-y-4">
              {/* Text Input */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Text</Label>
                  <span className="text-xs text-muted-foreground">
                    {text.length}/5000
                  </span>
                </div>
                <Textarea
                  placeholder="Enter the text you want to convert to speech..."
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  rows={6}
                  className="resize-none"
                />
              </div>

              {/* Quick Voice Selection */}
              <div className="space-y-2">
                <Label>Voice</Label>
                <Select value={selectedVoice} onValueChange={setSelectedVoice}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {VOICES.map((voice) => (
                      <SelectItem key={voice.id} value={voice.id}>
                        <div className="flex items-center gap-2">
                          <Mic2 className="h-3 w-3" />
                          <span>{voice.name}</span>
                          <Badge variant="secondary" className="text-xs">
                            {voice.accent}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {voice.style}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {currentVoice && (
                  <p className="text-xs text-muted-foreground">
                    {currentVoice.gender === 'male' ? '♂' : '♀'} {currentVoice.accent} • {currentVoice.style} style
                  </p>
                )}
              </div>

              {/* Generate Button */}
              <Button
                onClick={handleGenerate}
                disabled={isGenerating || !text.trim()}
                className="w-full"
                size="lg"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Generate Speech
                  </>
                )}
              </Button>

              {/* Audio Player */}
              {audioUrl && (
                <Card className="bg-muted/30">
                  <CardContent className="p-4 space-y-4">
                    <audio
                      ref={audioRef}
                      src={audioUrl}
                      onLoadedMetadata={() => {
                        if (audioRef.current) {
                          setDuration(audioRef.current.duration);
                        }
                      }}
                      onTimeUpdate={() => {
                        if (audioRef.current) {
                          setCurrentTime(audioRef.current.currentTime);
                        }
                      }}
                      onEnded={() => setIsPlaying(false)}
                    />

                    {/* Progress */}
                    <div className="space-y-1">
                      <Slider
                        value={[currentTime]}
                        max={duration || 100}
                        step={0.1}
                        onValueChange={([v]) => {
                          if (audioRef.current) {
                            audioRef.current.currentTime = v;
                            setCurrentTime(v);
                          }
                        }}
                      />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{formatTime(currentTime)}</span>
                        <span>{formatTime(duration)}</span>
                      </div>
                    </div>

                    {/* Controls */}
                    <div className="flex items-center justify-center gap-4">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={togglePlayback}
                      >
                        {isPlaying ? (
                          <Pause className="h-4 w-4" />
                        ) : (
                          <Play className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => {
                          if (audioRef.current) {
                            audioRef.current.currentTime = 0;
                            setCurrentTime(0);
                          }
                        }}
                      >
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="icon" onClick={handleDownload}>
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => {
                          navigator.clipboard.writeText(text);
                          toast({ title: 'Copied', description: 'Text copied to clipboard' });
                        }}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="settings" className="space-y-4">
              {/* Speed */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Speed</Label>
                  <span className="text-sm font-medium">{speed.toFixed(1)}x</span>
                </div>
                <Slider
                  value={[speed]}
                  onValueChange={([v]) => setSpeed(v)}
                  min={0.5}
                  max={2.0}
                  step={0.1}
                />
                <p className="text-xs text-muted-foreground">
                  Adjust how fast the speech is delivered
                </p>
              </div>

              {/* Pitch */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Pitch</Label>
                  <span className="text-sm font-medium">{pitch.toFixed(1)}</span>
                </div>
                <Slider
                  value={[pitch]}
                  onValueChange={([v]) => setPitch(v)}
                  min={0.5}
                  max={2.0}
                  step={0.1}
                />
                <p className="text-xs text-muted-foreground">
                  Higher values for higher-pitched voice
                </p>
              </div>

              {/* Stability (ElevenLabs-style) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Stability</Label>
                  <span className="text-sm font-medium">{(stability * 100).toFixed(0)}%</span>
                </div>
                <Slider
                  value={[stability]}
                  onValueChange={([v]) => setStability(v)}
                  min={0}
                  max={1}
                  step={0.05}
                />
                <p className="text-xs text-muted-foreground">
                  Lower = more expressive, Higher = more consistent
                </p>
              </div>

              {/* Similarity (ElevenLabs-style) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Similarity Boost</Label>
                  <span className="text-sm font-medium">{(similarity * 100).toFixed(0)}%</span>
                </div>
                <Slider
                  value={[similarity]}
                  onValueChange={([v]) => setSimilarity(v)}
                  min={0}
                  max={1}
                  step={0.05}
                />
                <p className="text-xs text-muted-foreground">
                  How closely to match the original voice
                </p>
              </div>

              {/* Voice Preview Grid */}
              <div className="space-y-2">
                <Label>All Voices</Label>
                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                  {VOICES.map((voice) => (
                    <Button
                      key={voice.id}
                      variant={selectedVoice === voice.id ? 'default' : 'outline'}
                      className="justify-start h-auto py-2"
                      onClick={() => setSelectedVoice(voice.id)}
                    >
                      <div className="text-left">
                        <p className="text-sm font-medium">{voice.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {voice.accent} • {voice.style}
                        </p>
                      </div>
                    </Button>
                  ))}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};
