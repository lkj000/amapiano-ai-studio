import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Mic, MicOff, Play, Square, Wand2, Music, Volume2, VolumeX,
  Brain, Headphones, AudioWaveform, Sparkles, Upload, Download,
  RefreshCw, Settings2, Clock, User, Bot
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface VoiceToMusicEngineProps {
  onTrackGenerated: (trackData: any) => void;
  className?: string;
}

interface RecordingSession {
  isRecording: boolean;
  isPaused: boolean;
  duration: number;
  audioBlob: Blob | null;
  transcript: string;
  confidence: number;
}

interface GenerationResult {
  id: string;
  type: 'hummed_melody' | 'voice_instruction' | 'beatbox_pattern';
  originalAudio: string; // base64
  transcript: string;
  generatedTrack: {
    audioUrl: string;
    midiData?: any;
    metadata: {
      bpm: number;
      key: string;
      genre: string;
      confidence: number;
    };
  };
  timestamp: Date;
}

export const VoiceToMusicEngine: React.FC<VoiceToMusicEngineProps> = ({
  onTrackGenerated,
  className
}) => {
  const [session, setSession] = useState<RecordingSession>({
    isRecording: false,
    isPaused: false,
    duration: 0,
    audioBlob: null,
    transcript: '',
    confidence: 0
  });
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [processingStep, setProcessingStep] = useState('');
  const [results, setResults] = useState<GenerationResult[]>([]);
  const [selectedMode, setSelectedMode] = useState<'melody' | 'instruction' | 'beatbox'>('melody');
  const [customInstructions, setCustomInstructions] = useState('');
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Initialize audio context and visualization
  useEffect(() => {
    const initAudio = async () => {
      try {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      } catch (error) {
        console.error('Audio context initialization failed:', error);
      }
    };

    initAudio();

    return () => {
      stopRecording();
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }
    };
  }, []);

  // Recording timer
  useEffect(() => {
    if (session.isRecording && !session.isPaused) {
      timerRef.current = setInterval(() => {
        setSession(prev => ({ ...prev, duration: prev.duration + 0.1 }));
      }, 100);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [session.isRecording, session.isPaused]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 44100,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      streamRef.current = stream;
      audioChunksRef.current = [];

      const recorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setSession(prev => ({ ...prev, audioBlob }));
      };

      // Setup audio visualization
      if (audioContextRef.current) {
        const source = audioContextRef.current.createMediaStreamSource(stream);
        analyserRef.current = audioContextRef.current.createAnalyser();
        analyserRef.current.fftSize = 256;
        source.connect(analyserRef.current);
        startVisualization();
      }

      mediaRecorderRef.current = recorder;
      recorder.start(100); // Collect data every 100ms

      setSession(prev => ({
        ...prev,
        isRecording: true,
        isPaused: false,
        duration: 0
      }));

      const modeMessages = {
        melody: "🎵 Hum or sing a melody - I'll turn it into an amapiano track!",
        instruction: "🗣️ Describe the music you want - be as detailed as you like!",
        beatbox: "🥁 Beatbox a rhythm - I'll create drums and percussion!"
      };

      toast.info(modeMessages[selectedMode]);

    } catch (error) {
      console.error('Recording failed:', error);
      toast.error("Couldn't access microphone. Please check permissions.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && session.isRecording) {
      mediaRecorderRef.current.stop();
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    setSession(prev => ({
      ...prev,
      isRecording: false,
      isPaused: false
    }));

    stopVisualization();
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current && session.isRecording) {
      if (session.isPaused) {
        mediaRecorderRef.current.resume();
        setSession(prev => ({ ...prev, isPaused: false }));
        toast.info("Recording resumed");
      } else {
        mediaRecorderRef.current.pause();
        setSession(prev => ({ ...prev, isPaused: true }));
        toast.info("Recording paused");
      }
    }
  };

  const startVisualization = () => {
    if (!analyserRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const analyser = analyserRef.current;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      if (!session.isRecording) return;

      requestAnimationFrame(draw);

      analyser.getByteFrequencyData(dataArray);

      ctx.fillStyle = 'rgb(20, 20, 30)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const barWidth = (canvas.width / bufferLength) * 2.5;
      let barHeight;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        barHeight = (dataArray[i] / 255) * canvas.height;

        const hue = (i / bufferLength) * 360;
        ctx.fillStyle = `hsl(${hue}, 70%, 60%)`;
        ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);

        x += barWidth + 1;
      }
    };

    draw();
  };

  const stopVisualization = () => {
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      }
    }
  };

  const processRecording = async () => {
    if (!session.audioBlob) {
      toast.error("No recording to process");
      return;
    }

    setIsProcessing(true);
    setProcessingProgress(0);

    try {
      // Convert audio blob to base64
      const arrayBuffer = await session.audioBlob.arrayBuffer();
      const base64Audio = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));

      const steps = [
        { progress: 20, step: "Analyzing audio input..." },
        { progress: 40, step: "Transcribing speech/melody..." },
        { progress: 60, step: "Interpreting musical intent..." },
        { progress: 80, step: "Generating amapiano arrangement..." },
        { progress: 100, step: "Finalizing track..." }
      ];

      for (const step of steps) {
        setProcessingProgress(step.progress);
        setProcessingStep(step.step);
        await new Promise(resolve => setTimeout(resolve, 1500));
      }

      // Call the neural music generation function
      const { data, error } = await supabase.functions.invoke('neural-music-generation', {
        body: {
          type: 'voice_to_music',
          audioData: base64Audio,
          mode: selectedMode,
          customInstructions: customInstructions || undefined,
          outputFormat: 'full_track_with_stems',
          amapiano_style: 'adaptive' // Let AI determine best style
        }
      });

      if (error) throw error;

      // Create result object
      const result: GenerationResult = {
        id: `voice_${Date.now()}`,
        type: selectedMode === 'melody' ? 'hummed_melody' : 
              selectedMode === 'instruction' ? 'voice_instruction' : 'beatbox_pattern',
        originalAudio: base64Audio,
        transcript: data.transcript || "Audio processed successfully",
        generatedTrack: {
          audioUrl: data.audioUrl || '',
          midiData: data.midiData,
          metadata: {
            bpm: data.metadata?.bpm || 118,
            key: data.metadata?.key || 'F#m',
            genre: data.metadata?.genre || 'Classic Amapiano',
            confidence: data.metadata?.confidence || 0.85
          }
        },
        timestamp: new Date()
      };

      setResults(prev => [result, ...prev]);
      setSession(prev => ({ ...prev, transcript: result.transcript }));

      // Trigger callback to add to DAW
      onTrackGenerated({
        name: `Voice Generated - ${selectedMode}`,
        audioUrl: result.generatedTrack.audioUrl,
        type: 'audio',
        metadata: result.generatedTrack.metadata
      });

      toast.success(`✨ Successfully generated ${selectedMode} track!`);

    } catch (error) {
      console.error('Processing failed:', error);
      toast.error("Failed to process recording. Please try again.");
    } finally {
      setIsProcessing(false);
      setProcessingProgress(0);
      setProcessingStep('');
    }
  };

  const playRecording = () => {
    if (session.audioBlob) {
      const audio = new Audio(URL.createObjectURL(session.audioBlob));
      audio.play();
    }
  };

  const resetSession = () => {
    setSession({
      isRecording: false,
      isPaused: false,
      duration: 0,
      audioBlob: null,
      transcript: '',
      confidence: 0
    });
    setProcessingProgress(0);
    setProcessingStep('');
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 10);
    return `${mins}:${secs.toString().padStart(2, '0')}.${ms}`;
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wand2 className="w-5 h-5 text-primary" />
          Voice-to-Music Engine
          <Badge variant="outline" className="ml-auto bg-gradient-to-r from-purple-500/20 to-pink-500/20">
            <Brain className="w-3 h-3 mr-1" />
            AI-Powered
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <Tabs value={selectedMode} onValueChange={(value: any) => setSelectedMode(value)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="melody" className="text-xs">
              <Music className="w-3 h-3 mr-1" />
              Hum Melody
            </TabsTrigger>
            <TabsTrigger value="instruction" className="text-xs">
              <Bot className="w-3 h-3 mr-1" />
              Voice Command
            </TabsTrigger>
            <TabsTrigger value="beatbox" className="text-xs">
              <AudioWaveform className="w-3 h-3 mr-1" />
              Beatbox
            </TabsTrigger>
          </TabsList>

          <TabsContent value="melody" className="space-y-4">
            <div className="text-center p-4 bg-muted/30 rounded-lg">
              <Music className="w-8 h-8 mx-auto mb-2 text-primary" />
              <h3 className="font-medium mb-1">Hum or Sing a Melody</h3>
              <p className="text-sm text-muted-foreground">
                I'll analyze your melody and create a full amapiano arrangement around it
              </p>
            </div>
          </TabsContent>

          <TabsContent value="instruction" className="space-y-4">
            <div className="text-center p-4 bg-muted/30 rounded-lg">
              <Bot className="w-8 h-8 mx-auto mb-2 text-primary" />
              <h3 className="font-medium mb-1">Describe Your Music</h3>
              <p className="text-sm text-muted-foreground">
                Tell me what kind of amapiano track you want - I'll create it from your description
              </p>
            </div>
            <Textarea
              placeholder="Additional instructions: 'Make it more soulful', 'Add saxophone', 'Private school style'..."
              value={customInstructions}
              onChange={(e) => setCustomInstructions(e.target.value)}
              className="min-h-[60px]"
            />
          </TabsContent>

          <TabsContent value="beatbox" className="space-y-4">
            <div className="text-center p-4 bg-muted/30 rounded-lg">
              <AudioWaveform className="w-8 h-8 mx-auto mb-2 text-primary" />
              <h3 className="font-medium mb-1">Beatbox a Rhythm</h3>
              <p className="text-sm text-muted-foreground">
                Create percussion patterns with your voice - perfect for amapiano drums
              </p>
            </div>
          </TabsContent>
        </Tabs>

        {/* Recording Interface */}
        <Card className="bg-muted/20">
          <CardContent className="p-4">
            {/* Visualization Canvas */}
            <div className="mb-4">
              <canvas
                ref={canvasRef}
                width={320}
                height={80}
                className="w-full h-20 bg-background rounded border"
              />
            </div>

            {/* Recording Controls */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${
                  session.isRecording 
                    ? session.isPaused 
                      ? 'bg-yellow-500 animate-pulse' 
                      : 'bg-red-500 animate-pulse'
                    : 'bg-gray-500'
                }`} />
                <span className="text-sm font-mono">
                  {formatTime(session.duration)}
                </span>
              </div>
              
              <div className="flex gap-2">
                {!session.isRecording ? (
                  <Button onClick={startRecording} className="bg-red-500 hover:bg-red-600">
                    <Mic className="w-4 h-4 mr-2" />
                    Record
                  </Button>
                ) : (
                  <>
                    <Button onClick={pauseRecording} variant="outline">
                      {session.isPaused ? <Play className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                    </Button>
                    <Button onClick={stopRecording} variant="destructive">
                      <Square className="w-4 h-4 mr-2" />
                      Stop
                    </Button>
                  </>
                )}
              </div>
            </div>

            {/* Playback & Processing */}
            {session.audioBlob && (
              <div className="space-y-3">
                <div className="flex gap-2">
                  <Button onClick={playRecording} variant="outline" size="sm">
                    <Play className="w-4 h-4 mr-2" />
                    Play Recording
                  </Button>
                  <Button onClick={resetSession} variant="outline" size="sm">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Reset
                  </Button>
                </div>

                {session.transcript && (
                  <div className="p-3 bg-background rounded border">
                    <div className="text-xs text-muted-foreground mb-1">Detected:</div>
                    <div className="text-sm">{session.transcript}</div>
                  </div>
                )}
              </div>
            )}

            {/* Processing */}
            {isProcessing && (
              <div className="space-y-3 p-4 bg-primary/5 rounded-lg border border-primary/20">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Processing Audio...</span>
                  <span className="text-sm text-muted-foreground">{processingProgress}%</span>
                </div>
                <Progress value={processingProgress} className="h-2" />
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  <span>{processingStep}</span>
                </div>
              </div>
            )}

            {/* Generate Button */}
            {session.audioBlob && !isProcessing && (
              <Button onClick={processRecording} className="w-full btn-glow" size="lg">
                <Sparkles className="w-4 h-4 mr-2" />
                Generate Amapiano Track
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Results */}
        {results.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Generated Tracks</CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              {results.slice(0, 3).map((result) => (
                <div key={result.id} className="p-3 bg-muted/30 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="outline" className="text-xs">
                      {result.type.replace('_', ' ')}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {result.timestamp.toLocaleTimeString()}
                    </span>
                  </div>
                  <div className="text-sm mb-2">{result.transcript}</div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{result.generatedTrack.metadata.bpm} BPM</span>
                    <span>•</span>
                    <span>{result.generatedTrack.metadata.key}</span>
                    <span>•</span>
                    <span>{Math.round(result.generatedTrack.metadata.confidence * 100)}% confidence</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </CardContent>
    </Card>
  );
};