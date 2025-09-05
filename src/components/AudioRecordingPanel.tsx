import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Mic, Square, Play, Pause, Save, Trash2, Volume2, AlertCircle, 
  X, Download, Upload, Activity, Clock, HardDrive 
} from 'lucide-react';
import { toast } from 'sonner';
import type { AudioRecording, RecordingState, WaveformData } from '@/types/daw';

interface AudioRecordingPanelProps {
  trackId: string;
  trackName: string;
  onClose: () => void;
  onSaveRecording: (trackId: string, recording: AudioRecording) => Promise<void>;
  onDeleteRecording: (trackId: string, recordingId: string) => void;
  recordings: AudioRecording[];
}

export default function AudioRecordingPanel({ 
  trackId, 
  trackName, 
  onClose, 
  onSaveRecording, 
  onDeleteRecording,
  recordings 
}: AudioRecordingPanelProps) {
  const [recordingState, setRecordingState] = useState<RecordingState>({
    isRecording: false,
    isPaused: false,
    currentTime: 0,
    inputLevel: 0,
    recordedChunks: []
  });
  
  const [selectedRecording, setSelectedRecording] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackTime, setPlaybackTime] = useState(0);
  const [inputGain, setInputGain] = useState(1);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [waveformData, setWaveformData] = useState<WaveformData | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyzerRef = useRef<AnalyserNode | null>(null);
  const microphoneStreamRef = useRef<MediaStream | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const recordingIntervalRef = useRef<number | null>(null);
  const levelMonitorRef = useRef<number | null>(null);

  // Initialize audio recording
  useEffect(() => {
    const initializeAudio = async () => {
      try {
        // Request microphone permission
        const stream = await navigator.mediaDevices.getUserMedia({ 
          audio: { 
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: false
          } 
        });
        
        setHasPermission(true);
        microphoneStreamRef.current = stream;

        // Set up audio context and analyzer
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        analyzerRef.current = audioContextRef.current.createAnalyser();
        analyzerRef.current.fftSize = 256;

        const source = audioContextRef.current.createMediaStreamSource(stream);
        const gainNode = audioContextRef.current.createGain();
        gainNode.gain.value = inputGain;
        
        source.connect(gainNode);
        gainNode.connect(analyzerRef.current);

        // Set up media recorder
        mediaRecorderRef.current = new MediaRecorder(stream, {
          mimeType: 'audio/webm;codecs=opus'
        });

        mediaRecorderRef.current.ondataavailable = (event) => {
          if (event.data.size > 0) {
            setRecordingState(prev => ({
              ...prev,
              recordedChunks: [...prev.recordedChunks, event.data]
            }));
          }
        };

        mediaRecorderRef.current.onstop = handleRecordingComplete;

        // Start level monitoring
        startLevelMonitoring();

      } catch (error) {
        console.error('Failed to initialize audio:', error);
        setHasPermission(false);
        toast.error('Microphone access denied. Please enable microphone permissions.');
      }
    };

    initializeAudio();

    return () => {
      stopRecording();
      if (microphoneStreamRef.current) {
        microphoneStreamRef.current.getTracks().forEach(track => track.stop());
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
      if (levelMonitorRef.current) {
        clearInterval(levelMonitorRef.current);
      }
    };
  }, [inputGain]);

  const startLevelMonitoring = useCallback(() => {
    if (!analyzerRef.current) return;

    levelMonitorRef.current = window.setInterval(() => {
      if (!analyzerRef.current) return;

      const bufferLength = analyzerRef.current.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      analyzerRef.current.getByteFrequencyData(dataArray);

      const average = dataArray.reduce((sum, value) => sum + value, 0) / bufferLength;
      const level = (average / 255) * 100;

      setRecordingState(prev => ({ ...prev, inputLevel: level }));
    }, 50);
  }, []);

  const startRecording = useCallback(() => {
    if (!mediaRecorderRef.current || !hasPermission) return;

    try {
      setRecordingState(prev => ({
        ...prev,
        isRecording: true,
        isPaused: false,
        currentTime: 0,
        recordedChunks: []
      }));

      mediaRecorderRef.current.start(100); // Collect data every 100ms

      // Start timer
      recordingIntervalRef.current = window.setInterval(() => {
        setRecordingState(prev => ({
          ...prev,
          currentTime: prev.currentTime + 0.1
        }));
      }, 100);

      toast.success('Recording started');
    } catch (error) {
      console.error('Failed to start recording:', error);
      toast.error('Failed to start recording');
    }
  }, [hasPermission]);

  const pauseRecording = useCallback(() => {
    if (!mediaRecorderRef.current) return;

    if (recordingState.isPaused) {
      // Resume
      mediaRecorderRef.current.resume();
      setRecordingState(prev => ({ ...prev, isPaused: false }));
      toast.success('Recording resumed');
    } else {
      // Pause
      mediaRecorderRef.current.pause();
      setRecordingState(prev => ({ ...prev, isPaused: true }));
      toast.success('Recording paused');
    }
  }, [recordingState.isPaused]);

  const stopRecording = useCallback(() => {
    if (!mediaRecorderRef.current || !recordingState.isRecording) return;

    mediaRecorderRef.current.stop();
    
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
      recordingIntervalRef.current = null;
    }

    setRecordingState(prev => ({
      ...prev,
      isRecording: false,
      isPaused: false
    }));

    toast.success('Recording stopped');
  }, [recordingState.isRecording]);

  const handleRecordingComplete = useCallback(async () => {
    if (recordingState.recordedChunks.length === 0) return;

    try {
      // Create audio blob
      const audioBlob = new Blob(recordingState.recordedChunks, { type: 'audio/webm' });
      const audioUrl = URL.createObjectURL(audioBlob);

      // Generate waveform data
      const arrayBuffer = await audioBlob.arrayBuffer();
      const audioContext = new AudioContext();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      const channelData = audioBuffer.getChannelData(0);
      
      // Downsample for visualization
      const samples = 1000;
      const blockSize = Math.floor(channelData.length / samples);
      const peaks: number[] = [];
      
      for (let i = 0; i < samples; i++) {
        const start = i * blockSize;
        const end = start + blockSize;
        let max = 0;
        
        for (let j = start; j < end; j++) {
          const sample = Math.abs(channelData[j]);
          if (sample > max) max = sample;
        }
        
        peaks.push(max);
      }

      // Create recording object
      const recording: AudioRecording = {
        id: `recording_${Date.now()}`,
        name: `Recording ${new Date().toLocaleTimeString()}`,
        audioUrl,
        duration: recordingState.currentTime,
        waveformData: peaks,
        recordedAt: new Date().toISOString()
      };

      await onSaveRecording(trackId, recording);
      
      setRecordingState(prev => ({
        ...prev,
        recordedChunks: []
      }));

      toast.success('Recording saved successfully');
    } catch (error) {
      console.error('Failed to save recording:', error);
      toast.error('Failed to save recording');
    }
  }, [recordingState.recordedChunks, recordingState.currentTime, trackId, onSaveRecording]);

  const playRecording = useCallback((recording: AudioRecording) => {
    if (audioRef.current) {
      audioRef.current.pause();
    }

    audioRef.current = new Audio(recording.audioUrl);
    audioRef.current.currentTime = 0;
    
    audioRef.current.ontimeupdate = () => {
      if (audioRef.current) {
        setPlaybackTime(audioRef.current.currentTime);
      }
    };

    audioRef.current.onended = () => {
      setIsPlaying(false);
      setPlaybackTime(0);
      setSelectedRecording(null);
    };

    audioRef.current.play();
    setIsPlaying(true);
    setSelectedRecording(recording.id);
  }, []);

  const stopPlayback = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsPlaying(false);
    setPlaybackTime(0);
    setSelectedRecording(null);
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const renderWaveform = (recording: AudioRecording) => {
    if (!recording.waveformData) return null;

    return (
      <div className="h-16 bg-muted/20 rounded flex items-end justify-center gap-px p-2">
        {recording.waveformData.map((peak, index) => (
          <div
            key={index}
            className="bg-primary/70 flex-1 max-w-px"
            style={{ height: `${Math.max(2, peak * 100)}%` }}
          />
        ))}
      </div>
    );
  };

  if (hasPermission === false) {
    return (
      <Card className="fixed inset-4 z-50 bg-background">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Audio Recording</CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Microphone access is required for audio recording. Please enable microphone permissions and refresh the page.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="fixed inset-4 z-50 bg-background flex flex-col">
      <CardHeader className="pb-3 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CardTitle className="text-lg">Amapiano Multi-Instrument Recording - {trackName}</CardTitle>
            <Badge variant="outline" className="bg-gradient-to-r from-red-500/20 to-orange-500/20">
              Neural Enhanced v2.0
            </Badge>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="flex-1 space-y-6 overflow-y-auto p-6">
        {/* Recording Controls */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Mic className="w-4 h-4" />
              Recording Controls
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Input Level Meter */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Input Level</span>
                <span>{Math.round(recordingState.inputLevel)}%</span>
              </div>
              <div className="flex items-center gap-2">
                <Progress 
                  value={recordingState.inputLevel} 
                  className="flex-1 h-3"
                />
                <div className={`w-3 h-3 rounded-full ${
                  recordingState.inputLevel > 80 ? 'bg-red-500' :
                  recordingState.inputLevel > 60 ? 'bg-yellow-500' :
                  recordingState.inputLevel > 20 ? 'bg-green-500' :
                  'bg-gray-400'
                }`} />
              </div>
            </div>

            {/* Input Gain */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Input Gain</span>
                <span>{Math.round(inputGain * 100)}%</span>
              </div>
              <Slider
                value={[inputGain]}
                onValueChange={([value]) => setInputGain(value)}
                min={0.1}
                max={2}
                step={0.1}
                className="w-full"
              />
            </div>

            {/* Recording Timer */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm">
                <Clock className="w-4 h-4" />
                <span>{formatTime(recordingState.currentTime)}</span>
                {recordingState.isRecording && (
                  <div className={`w-2 h-2 rounded-full ${
                    recordingState.isPaused ? 'bg-yellow-500' : 'bg-red-500 animate-pulse'
                  }`} />
                )}
              </div>
            </div>

            {/* Control Buttons */}
            <div className="flex gap-2">
              <Button
                onClick={startRecording}
                disabled={recordingState.isRecording}
                variant={recordingState.isRecording ? 'secondary' : 'default'}
                className="flex-1"
              >
                <Mic className="w-4 h-4 mr-2" />
                Start Recording
              </Button>
              
              {recordingState.isRecording && (
                <>
                  <Button
                    onClick={pauseRecording}
                    variant="outline"
                  >
                    {recordingState.isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                  </Button>
                  
                  <Button
                    onClick={stopRecording}
                    variant="destructive"
                  >
                    <Square className="w-4 h-4" />
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recordings List */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <HardDrive className="w-4 h-4" />
              Saved Recordings ({recordings.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recordings.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No recordings yet</p>
                <p className="text-xs">Start recording to create audio clips</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recordings.map((recording) => (
                  <Card key={recording.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h4 className="font-medium">{recording.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {formatTime(recording.duration)} • {new Date(recording.recordedAt).toLocaleString()}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              if (selectedRecording === recording.id && isPlaying) {
                                stopPlayback();
                              } else {
                                playRecording(recording);
                              }
                            }}
                          >
                            {selectedRecording === recording.id && isPlaying ? 
                              <Square className="w-4 h-4" /> : 
                              <Play className="w-4 h-4" />
                            }
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onDeleteRecording(trackId, recording.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      {/* Waveform */}
                      {renderWaveform(recording)}

                      {/* Playback Progress */}
                      {selectedRecording === recording.id && (
                        <div className="mt-2">
                          <Progress 
                            value={(playbackTime / recording.duration) * 100} 
                            className="h-2"
                          />
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </CardContent>
    </Card>
  );
}