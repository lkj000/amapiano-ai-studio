
import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Mic, Square, Play, Pause, Save, Trash2, Settings } from 'lucide-react';
import { toast } from 'sonner';
import { Track } from '@/types/daw';

interface AudioRecordingPanelProps {
  tracks: Track[];
  selectedTrackId?: string;
  onTrackSelect?: (trackId: string) => void;
  onRecordingComplete?: (audioData: Blob, trackId: string) => void;
}

export default function AudioRecordingPanel({ 
  tracks, 
  selectedTrackId, 
  onTrackSelect, 
  onRecordingComplete 
}: AudioRecordingPanelProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioLevel, setAudioLevel] = useState(0);
  const [recordedAudio, setRecordedAudio] = useState<Blob | null>(null);
  const [isCountingIn, setIsCountingIn] = useState(false);
  const [countInValue, setCountInValue] = useState(0);
  const [inputGain, setInputGain] = useState([75]);
  const [monitorLevel, setMonitorLevel] = useState([50]);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const countInTimerRef = useRef<NodeJS.Timeout | null>(null);
  const audioUrlRef = useRef<string | null>(null);

  // Find armed track or use selected track
  const targetTrack = tracks.find(track => track.isArmed) || 
                     tracks.find(track => track.id === selectedTrackId) ||
                     tracks[0];

  useEffect(() => {
    return () => {
      // Cleanup on unmount
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
      if (countInTimerRef.current) {
        clearTimeout(countInTimerRef.current);
      }
      if (audioUrlRef.current) {
        URL.revokeObjectURL(audioUrlRef.current);
      }
    };
  }, []);

  const initializeAudio = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false
        } 
      });
      streamRef.current = stream;

      // Set up audio analysis
      audioContextRef.current = new AudioContext();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      source.connect(analyserRef.current);

      // Start level monitoring
      monitorAudioLevel();

      return stream;
    } catch (error) {
      console.error('Failed to initialize audio:', error);
      toast.error('Failed to access microphone');
      throw error;
    }
  };

  const monitorAudioLevel = () => {
    if (!analyserRef.current) return;

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    
    const updateLevel = () => {
      if (!analyserRef.current) return;
      
      analyserRef.current.getByteFrequencyData(dataArray);
      const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
      setAudioLevel(Math.min(100, (average / 128) * 100));
      
      if (streamRef.current && streamRef.current.active) {
        requestAnimationFrame(updateLevel);
      }
    };
    
    updateLevel();
  };

  const startCountIn = () => {
    setIsCountingIn(true);
    setCountInValue(4);
    
    const countdown = () => {
      setCountInValue(prev => {
        if (prev <= 1) {
          setIsCountingIn(false);
          startActualRecording();
          return 0;
        }
        
        countInTimerRef.current = setTimeout(countdown, 1000);
        return prev - 1;
      });
    };
    
    countInTimerRef.current = setTimeout(countdown, 1000);
  };

  const startActualRecording = async () => {
    try {
      const stream = streamRef.current || await initializeAudio();
      
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      
      const chunks: BlobPart[] = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(chunks, { type: 'audio/wav' });
        setRecordedAudio(audioBlob);
        
        if (onRecordingComplete && targetTrack) {
          onRecordingComplete(audioBlob, targetTrack.id);
        }
      };
      
      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      
      // Start timer
      recordingTimerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 0.1);
      }, 100);
      
      toast.success('Recording started');
    } catch (error) {
      console.error('Failed to start recording:', error);
      toast.error('Failed to start recording');
    }
  };

  const startRecording = async () => {
    if (!targetTrack) {
      toast.error('Please select a track to record to');
      return;
    }

    try {
      if (!streamRef.current) {
        await initializeAudio();
      }
      startCountIn();
    } catch (error) {
      console.error('Failed to start recording:', error);
    }
  };

  const stopRecording = () => {
    if (isCountingIn) {
      setIsCountingIn(false);
      if (countInTimerRef.current) {
        clearTimeout(countInTimerRef.current);
      }
      return;
    }

    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
      
      toast.success('Recording stopped');
    }
  };

  const playRecording = async () => {
    if (!recordedAudio) return;
    
    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current);
    }
    
    audioUrlRef.current = URL.createObjectURL(recordedAudio);
    const audio = new Audio(audioUrlRef.current);
    
    audio.onended = () => setIsPlaying(false);
    
    try {
      await audio.play();
      setIsPlaying(true);
    } catch (error) {
      console.error('Failed to play recording:', error);
      toast.error('Failed to play recording');
    }
  };

  const deleteRecording = () => {
    setRecordedAudio(null);
    setRecordingTime(0);
    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current);
      audioUrlRef.current = null;
    }
    toast.success('Recording deleted');
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const centisecs = Math.floor((seconds % 1) * 10);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${centisecs}`;
  };

  return (
    <div className="h-full bg-background border-l border-border overflow-hidden">
      <Card className="h-full rounded-none border-0">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Mic className="w-5 h-5" />
            Audio Recording
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Track Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Record to Track</label>
            <Select 
              value={targetTrack?.id || ''} 
              onValueChange={onTrackSelect}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select track" />
              </SelectTrigger>
              <SelectContent>
                {tracks.map((track) => (
                  <SelectItem key={track.id} value={track.id}>
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded ${track.color}`} />
                      {track.name}
                      {track.isArmed && <span className="text-red-500">●</span>}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Input Controls */}
          <div className="space-y-3">
            <div className="space-y-2">
              <label className="text-sm font-medium">Input Gain</label>
              <Slider
                value={inputGain}
                onValueChange={setInputGain}
                max={100}
                step={1}
                className="w-full"
              />
              <div className="text-xs text-muted-foreground text-right">
                {inputGain[0]}%
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Monitor Level</label>
              <Slider
                value={monitorLevel}
                onValueChange={setMonitorLevel}
                max={100}
                step={1}
                className="w-full"
              />
              <div className="text-xs text-muted-foreground text-right">
                {monitorLevel[0]}%
              </div>
            </div>
          </div>

          {/* Audio Level Meter */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Input Level</label>
            <div className="relative">
              <Progress value={audioLevel} className="w-full h-3" />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xs font-medium">
                  {Math.round(audioLevel)}%
                </span>
              </div>
            </div>
          </div>

          {/* Recording Controls */}
          <div className="space-y-3">
            {isCountingIn && (
              <div className="text-center">
                <div className="text-2xl font-bold text-red-500">
                  {countInValue}
                </div>
                <div className="text-sm text-muted-foreground">
                  Get ready...
                </div>
              </div>
            )}

            <div className="flex items-center justify-center gap-2">
              {!isRecording && !isCountingIn ? (
                <Button 
                  onClick={startRecording}
                  disabled={!targetTrack}
                  className="flex-1 bg-red-600 hover:bg-red-700"
                >
                  <Mic className="w-4 h-4 mr-2" />
                  Record
                </Button>
              ) : (
                <Button 
                  onClick={stopRecording}
                  variant="destructive"
                  className="flex-1"
                >
                  <Square className="w-4 h-4 mr-2" />
                  Stop
                </Button>
              )}
            </div>

            {/* Recording Time */}
            {(isRecording || recordingTime > 0) && (
              <div className="text-center">
                <div className="text-lg font-mono">
                  {formatTime(recordingTime)}
                </div>
                {isRecording && (
                  <div className="text-sm text-red-500 animate-pulse">
                    ● Recording
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Playback Controls */}
          {recordedAudio && (
            <div className="space-y-3 border-t pt-3">
              <label className="text-sm font-medium">Recorded Audio</label>
              
              <div className="flex items-center gap-2">
                <Button
                  onClick={playRecording}
                  disabled={isPlaying}
                  variant="outline"
                  size="sm"
                >
                  <Play className="w-4 h-4" />
                </Button>
                
                <Button
                  onClick={deleteRecording}
                  variant="outline"
                  size="sm"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
                
                <div className="text-sm text-muted-foreground">
                  {formatTime(recordingTime)}
                </div>
              </div>
            </div>
          )}

          {/* Help Text */}
          {!targetTrack && (
            <div className="text-center text-muted-foreground text-sm py-4">
              Select a track above to start recording
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
