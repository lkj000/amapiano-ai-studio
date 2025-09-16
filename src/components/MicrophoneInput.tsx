import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Mic, MicOff, Play, Square, Radio, Music } from "lucide-react";
import { toast } from "sonner";

interface MicrophoneInputProps {
  onRecordingComplete: (audioBlob: Blob, transcription?: string) => void;
  className?: string;
}

export const MicrophoneInput = ({ onRecordingComplete, className }: MicrophoneInputProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioLevel, setAudioLevel] = useState(0);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [mode, setMode] = useState<"voice" | "hum" | "sound">("voice");
  const [isProcessing, setIsProcessing] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyzerRef = useRef<AnalyserNode | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const animationRef = useRef<number | null>(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      // Set up audio analysis for visual feedback
      audioContextRef.current = new AudioContext();
      analyzerRef.current = audioContextRef.current.createAnalyser();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyzerRef.current);
      analyzerRef.current.fftSize = 256;

      // Start audio level monitoring
      const updateAudioLevel = () => {
        if (analyzerRef.current) {
          const dataArray = new Uint8Array(analyzerRef.current.frequencyBinCount);
          analyzerRef.current.getByteFrequencyData(dataArray);
          const average = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;
          setAudioLevel((average / 255) * 100);
        }
        animationRef.current = requestAnimationFrame(updateAudioLevel);
      };
      updateAudioLevel();

      // Set up media recorder
      mediaRecorderRef.current = new MediaRecorder(stream);
      const chunks: Blob[] = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        chunks.push(event.data);
      };

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        setRecordedBlob(blob);
        stream.getTracks().forEach(track => track.stop());
        
        if (audioContextRef.current) {
          audioContextRef.current.close();
        }
        
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
        }
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      setRecordingTime(0);

      // Start timer
      intervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

      toast.success("Recording started");
    } catch (error) {
      toast.error("Could not access microphone");
      console.error("Microphone access error:", error);
    }
  };

  const stopRecording = () => {
    console.log("MicrophoneInput.stopRecording called", { isRecording });
    try {
      if (mediaRecorderRef.current && isRecording) {
        mediaRecorderRef.current.stop();
      }
      setIsRecording(false);
      setAudioLevel(0);

      if (intervalRef.current) {
        clearInterval(intervalRef.current as unknown as number);
        intervalRef.current = null;
      }
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }

      toast.success("Recording stopped");
    } catch (err) {
      console.error("Error stopping recording:", err);
      toast.error("Couldn't stop recording. Forcing cleanup.");
      setIsRecording(false);
    }
  };

  const processRecording = async () => {
    if (!recordedBlob) return;

    setIsProcessing(true);
    
    // Simulate processing
    await new Promise(resolve => setTimeout(resolve, 2000));

    let transcription = "";
    if (mode === "voice") {
      transcription = "Create a soulful private school amapiano track with jazzy piano chords";
    } else if (mode === "hum") {
      transcription = "Melodic humming detected - converted to MIDI pattern";
    } else {
      transcription = "Sound sample recorded - ready for integration";
    }

    setIsProcessing(false);
    onRecordingComplete(recordedBlob, transcription);
    setRecordedBlob(null);
    setRecordingTime(0);
    
    toast.success(`${mode === "voice" ? "Voice prompt" : mode === "hum" ? "Melody" : "Sound"} processed successfully`);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getModeDescription = () => {
    switch (mode) {
      case "voice":
        return "Describe your desired track using your voice. The AI will convert speech to text and analyze your musical intent.";
      case "hum":
        return "Hum a melody or tune. The AI will extract the melodic content and use it as inspiration for generation.";
      case "sound":
        return "Record any sound, beatbox, or percussive idea. The AI will incorporate the recorded audio into your track.";
      default:
        return "";
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mic className="w-5 h-5 text-primary" />
          Microphone Input
        </CardTitle>
        <CardDescription>
          Record voice prompts, melodies, or sounds for AI generation
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs value={mode} onValueChange={(value) => setMode(value as typeof mode)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="voice" className="text-xs">Voice Prompt</TabsTrigger>
            <TabsTrigger value="hum" className="text-xs">Hum Melody</TabsTrigger>
            <TabsTrigger value="sound" className="text-xs">Record Sound</TabsTrigger>
          </TabsList>

          <TabsContent value={mode} className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {getModeDescription()}
            </p>

            {/* Recording Interface */}
            <div className="text-center space-y-4">
              {isRecording ? (
                <div className="space-y-4">
                  <div className="relative">
                    <Button
                      size="lg"
                      variant="destructive"
                      onClick={stopRecording}
                      className="w-16 h-16 rounded-full"
                    >
                      <Square className="w-6 h-6" />
                      </Button>
                      <div className="absolute inset-0 rounded-full border-2 border-destructive animate-pulse pointer-events-none" />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="font-mono text-lg">
                      {formatTime(recordingTime)}
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span>Audio Level</span>
                        <span>{Math.round(audioLevel)}%</span>
                      </div>
                      <Progress value={audioLevel} className="h-2" />
                    </div>
                  </div>

                  <Badge variant="destructive" className="animate-pulse">
                    Recording...
                  </Badge>
                </div>
              ) : recordedBlob ? (
                <div className="space-y-4">
                  <div className="p-4 bg-muted rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Radio className="w-4 h-4 text-primary" />
                      <span className="font-medium">Recorded Audio</span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Duration: {formatTime(recordingTime)}
                    </div>
                  </div>

                  <div className="flex gap-2 justify-center">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        if (recordedBlob) {
                          const audio = new Audio(URL.createObjectURL(recordedBlob));
                          audio.play().catch(error => {
                            console.error('Audio playback failed:', error);
                            toast.error("Playback failed - browser may have blocked autoplay");
                          });
                        }
                      }}
                    >
                      <Play className="w-3 h-3 mr-1" />
                      Preview
                    </Button>
                    <Button 
                      onClick={processRecording}
                      disabled={isProcessing}
                      className="btn-glow"
                      size="sm"
                    >
                      {isProcessing ? (
                        <>Processing...</>
                      ) : (
                        <>
                          <Music className="w-3 h-3 mr-1" />
                          Use in Generation
                        </>
                      )}
                    </Button>
                  </div>

                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => {
                      setRecordedBlob(null);
                      setRecordingTime(0);
                    }}
                  >
                    Record Again
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <Button
                    size="lg"
                    onClick={startRecording}
                    className="w-16 h-16 rounded-full btn-glow"
                  >
                    <Mic className="w-6 h-6" />
                  </Button>

                  <div>
                    <div className="text-sm font-medium mb-1">
                      {mode === "voice" ? "Tap to start voice recording" :
                       mode === "hum" ? "Tap to record melody" :
                       "Tap to record sound"}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Maximum recording time: 30 seconds
                    </div>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};