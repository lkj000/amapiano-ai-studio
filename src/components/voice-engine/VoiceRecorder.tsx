/**
 * VoiceRecorder - Extracted recording logic from VoiceToMusicEngine
 * Handles microphone access, MediaRecorder, and visualization
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, Play, Square, Pause } from 'lucide-react';
import { toast } from 'sonner';

export interface RecordingSession {
  isRecording: boolean;
  isPaused: boolean;
  duration: number;
  audioBlob: Blob | null;
}

interface VoiceRecorderProps {
  session: RecordingSession;
  onSessionChange: (session: RecordingSession) => void;
  selectedMode: 'melody' | 'instruction' | 'beatbox';
}

export function VoiceRecorder({ session, onSessionChange, selectedMode }: VoiceRecorderProps) {
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);

  useEffect(() => {
    audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    return () => {
      stopRecording();
      if (audioContextRef.current?.state !== 'closed') {
        audioContextRef.current?.close();
      }
    };
  }, []);

  useEffect(() => {
    if (session.isRecording && !session.isPaused) {
      timerRef.current = setInterval(() => {
        onSessionChange({ ...session, duration: session.duration + 0.1 });
      }, 100);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [session.isRecording, session.isPaused]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { sampleRate: 44100, channelCount: 1, echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });
      streamRef.current = stream;
      audioChunksRef.current = [];

      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus' });
      recorder.ondataavailable = e => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
      recorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        onSessionChange({ isRecording: false, isPaused: false, duration: session.duration, audioBlob: blob });
      };

      if (audioContextRef.current) {
        const source = audioContextRef.current.createMediaStreamSource(stream);
        analyserRef.current = audioContextRef.current.createAnalyser();
        analyserRef.current.fftSize = 256;
        source.connect(analyserRef.current);
        startVisualization();
      }

      mediaRecorderRef.current = recorder;
      recorder.start(100);

      onSessionChange({ isRecording: true, isPaused: false, duration: 0, audioBlob: null });

      const msgs = {
        melody: "🎵 Hum or sing a melody — I'll turn it into an amapiano track!",
        instruction: "🗣️ Describe the music you want!",
        beatbox: "🥁 Beatbox a rhythm — I'll create drums and percussion!",
      };
      toast.info(msgs[selectedMode]);
    } catch {
      toast.error("Couldn't access microphone. Please check permissions.");
    }
  };

  const stopRecording = () => {
    try {
      if (mediaRecorderRef.current && session.isRecording) {
        mediaRecorderRef.current.stop();
        mediaRecorderRef.current = null;
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
        streamRef.current = null;
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      onSessionChange({ ...session, isRecording: false, isPaused: false });
      stopVisualization();
      toast.success('Recording stopped');
    } catch (error) {
      console.error('Error stopping recording:', error);
      onSessionChange({ ...session, isRecording: false, isPaused: false });
    }
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current && session.isRecording) {
      if (session.isPaused) {
        mediaRecorderRef.current.resume();
        onSessionChange({ ...session, isPaused: false });
      } else {
        mediaRecorderRef.current.pause();
        onSessionChange({ ...session, isPaused: true });
      }
    }
  };

  const playRecording = () => {
    if (session.audioBlob) {
      const audio = new Audio(URL.createObjectURL(session.audioBlob));
      audio.play().catch(() => toast.error('Playback blocked by browser'));
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
      let x = 0;
      for (let i = 0; i < bufferLength; i++) {
        const barHeight = (dataArray[i] / 255) * canvas.height;
        ctx.fillStyle = `hsl(${(i / bufferLength) * 360}, 70%, 60%)`;
        ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
        x += barWidth + 1;
      }
    };
    draw();
  };

  const stopVisualization = () => {
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      ctx?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 10);
    return `${mins}:${secs.toString().padStart(2, '0')}.${ms}`;
  };

  return (
    <div className="space-y-4">
      {/* Visualization */}
      <canvas
        ref={canvasRef}
        width={600}
        height={100}
        className="w-full h-20 rounded-lg bg-muted"
      />

      {/* Recording controls */}
      <div className="flex items-center gap-3">
        {!session.isRecording ? (
          <Button onClick={startRecording} size="lg" className="flex-1 gap-2">
            <Mic className="w-5 h-5" />
            Start Recording
          </Button>
        ) : (
          <>
            <Button onClick={pauseRecording} variant="outline" size="lg">
              <Pause className="w-5 h-5" />
            </Button>
            <Button onClick={stopRecording} variant="destructive" size="lg" className="flex-1 gap-2">
              <Square className="w-5 h-5" />
              Stop ({formatTime(session.duration)})
            </Button>
          </>
        )}
        {session.audioBlob && !session.isRecording && (
          <Button onClick={playRecording} variant="outline" size="lg">
            <Play className="w-5 h-5" />
          </Button>
        )}
      </div>
    </div>
  );
}
